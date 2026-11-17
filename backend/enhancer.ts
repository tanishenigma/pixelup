import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import {
  BACKEND_DIR,
  DIGITAL_ART_MODEL,
  FACE_FALLBACK_MODEL,
  MODEL_DIR,
  OSDFACE_CKPT_DIR,
  OSDFACE_DIR,
  OSDFACE_SD21_DIR,
  OSDFACE_VENV_PYTHON,
  OSDFACE_WEIGHT,
  logEvent,
} from "./config.ts";

const execFileAsync = promisify(execFile);

export type EnhanceMode = "digital-art" | "face";

export interface EnhanceResult {
  buffer: Buffer;
  fallback: boolean;
  reason: string | null;
  strategy: string;
}

async function findRealesrganExe(): Promise<string | null> {
  const candidates = [
    path.join(BACKEND_DIR, "bin", "realesrgan-ncnn-vulkan"),
    "/opt/homebrew/bin/realesrgan-ncnn-vulkan",
    "/usr/local/bin/realesrgan-ncnn-vulkan",
    "/usr/bin/realesrgan-ncnn-vulkan",
    "realesrgan-ncnn-vulkan",
  ];

  for (const candidate of candidates) {
    try {
      const { stdout, stderr } = await execFileAsync(candidate, ["-h"], {
        timeout: 5000,
      });
      if (
        (stdout && stdout.includes("Usage:")) ||
        (stderr && stderr.includes("Usage:"))
      ) {
        return candidate;
      }
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string };
      const out = `${execErr?.stdout || ""}${execErr?.stderr || ""}`;
      if (out.includes("Usage:")) {
        return candidate;
      }
    }
  }
  return null;
}

async function runRealesrganPass(
  realesrganExe: string,
  modelName: string,
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(realesrganExe, [
      "-i",
      inputPath,
      "-o",
      outputPath,
      "-n",
      modelName,
      "-m",
      MODEL_DIR,
      "-s",
      "4",
      "-f",
      "png",
    ]);

    const lastLogs: string[] = [];
    let killedByTimeout = false;
    const timer = setTimeout(() => {
      killedByTimeout = true;
      child.kill("SIGKILL");
    }, 300000);

    const handleChunk = (chunk: Buffer) => {
      const text = chunk.toString();
      const lines = text.split(/[\r\n]+/).filter(Boolean);
      for (const line of lines) {
        lastLogs.push(line);
        if (lastLogs.length > 5) lastLogs.shift();
        const match = line.match(/(\d+(?:\.\d+)?)%/);
        if (match && onProgress) {
          onProgress(Number(match[1]));
        }
      }
    };

    child.stdout.on("data", handleChunk);
    child.stderr.on("data", handleChunk);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (lastLogs.length) {
        logEvent("INFO", "RealESRGAN output", {
          output: lastLogs.slice(-3).join(" | "),
        });
      }
      if (killedByTimeout) {
        return reject(new Error("RealESRGAN timed out"));
      }
      if (code !== 0) {
        return reject(new Error(`RealESRGAN exited with code ${code}`));
      }
      resolve();
    });
  });
}

async function runOsdfaceLocal(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (percent: number) => void
): Promise<Buffer | null> {
  if (
    !fs.existsSync(OSDFACE_VENV_PYTHON) ||
    !fs.existsSync(OSDFACE_WEIGHT) ||
    !fs.existsSync(OSDFACE_SD21_DIR)
  ) {
    return null;
  }

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "pixelup-osdface-"));
  try {
    const inDir = path.join(tmpDir, "in");
    const outDir = path.join(tmpDir, "out");
    await fsp.mkdir(inDir, { recursive: true });
    await fsp.mkdir(outDir, { recursive: true });

    const inputPath = path.join(inDir, "input.png");
    await sharp(imageBuffer).png().toFile(inputPath);
    if (onProgress) onProgress(15);

    logEvent("INFO", "Running OSDFace locally on Apple Silicon (MPS)");

    await execFileAsync(
      OSDFACE_VENV_PYTHON,
      [
        path.join(OSDFACE_DIR, "infer.py"),
        "--input_image",
        inDir,
        "--output_dir",
        outDir,
        "--pretrained_model_name_or_path",
        OSDFACE_SD21_DIR,
        "--img_encoder_weight",
        OSDFACE_WEIGHT,
        "--ckpt_path",
        OSDFACE_CKPT_DIR,
        "--merge_lora",
        "--mixed_precision",
        "fp16",
      ],
      { cwd: OSDFACE_DIR, timeout: 300000 }
    );

    if (onProgress) onProgress(85);

    const outFile = path.join(outDir, "input.png");
    if (!fs.existsSync(outFile)) {
      throw new Error("OSDFace produced no output image");
    }

    const enhancedBuffer = await sharp(outFile, {
      limitInputPixels: false,
    })
      .resize(targetWidth, targetHeight, { kernel: "lanczos3" })
      .png({ compressionLevel: 8 })
      .toBuffer();

    if (onProgress) onProgress(100);
    return enhancedBuffer;
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true });
  }
}

async function runOsdfaceRemote(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (percent: number) => void
): Promise<Buffer> {
  const sshHost = process.env.OSDFACE_SSH_HOST || "archlinux";
  const jobId = `pixelup_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const tmpLocalDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "pixelup-osdface-")
  );
  const localIn = path.join(tmpLocalDir, "input.png");
  const localOut = path.join(tmpLocalDir, "output.png");
  const remoteDir = `~/OSDFace/jobs/${jobId}`;

  try {
    await sharp(imageBuffer).png().toFile(localIn);
    if (onProgress) onProgress(10);

    await execFileAsync(
      "ssh",
      [sshHost, `mkdir -p ${remoteDir}/in ${remoteDir}/out`],
      { timeout: 15000 }
    );
    await execFileAsync(
      "scp",
      [localIn, `${sshHost}:${remoteDir}/in/input.png`],
      { timeout: 30000 }
    );
    if (onProgress) onProgress(25);

    logEvent("INFO", "Running OSDFace on remote GPU", { sshHost, jobId });

    const remoteCmd = [
      "cd ~/OSDFace",
      "&&",
      ".venv/bin/python infer.py",
      `--input_image ${remoteDir}/in`,
      `--output_dir ${remoteDir}/out`,
      "--pretrained_model_name_or_path sd21",
      "--img_encoder_weight pretrained/associate_2.ckpt",
      "--gpu_id 0",
      "--ckpt_path pretrained",
      "--merge_lora",
      "--mixed_precision fp16",
    ].join(" ");

    await execFileAsync("ssh", [sshHost, remoteCmd], { timeout: 300000 });
    if (onProgress) onProgress(80);

    await execFileAsync(
      "scp",
      [`${sshHost}:${remoteDir}/out/input.png`, localOut],
      { timeout: 30000 }
    );

    if (!fs.existsSync(localOut)) {
      throw new Error("OSDFace produced no output image");
    }

    const enhancedBuffer = await sharp(localOut, {
      limitInputPixels: false,
    })
      .resize(targetWidth, targetHeight, { kernel: "lanczos3" })
      .png({ compressionLevel: 8 })
      .toBuffer();

    if (onProgress) onProgress(100);
    return enhancedBuffer;
  } finally {
    await fsp.rm(tmpLocalDir, { recursive: true, force: true });
    execFileAsync("ssh", [sshHost, `rm -rf ${remoteDir}`], {
      timeout: 15000,
    }).catch(() => {});
  }
}

export async function enhanceImage(
  imageBuffer: Buffer,
  scale = 2,
  mode: EnhanceMode = "digital-art",
  onProgress?: (percent: number) => void
): Promise<EnhanceResult> {
  const inputMeta = await sharp(imageBuffer).metadata();
  if (!inputMeta.width || !inputMeta.height) {
    throw new Error("Cannot decode input image dimensions");
  }

  const MAX_DIM = 16384;
  let targetWidth = Math.round(inputMeta.width * scale);
  let targetHeight = Math.round(inputMeta.height * scale);
  if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / targetWidth, MAX_DIM / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  if (mode === "face") {
    const localOsdBuffer = await runOsdfaceLocal(
      imageBuffer,
      targetWidth,
      targetHeight,
      onProgress
    );
    if (localOsdBuffer) {
      return {
        buffer: localOsdBuffer,
        fallback: false,
        reason: null,
        strategy: "osdface-mps",
      };
    }

    const osdBuffer = await runOsdfaceRemote(
      imageBuffer,
      targetWidth,
      targetHeight,
      onProgress
    );
    return {
      buffer: osdBuffer,
      fallback: false,
      reason: null,
      strategy: "osdface",
    };
  }

  const modelName =
    mode === "digital-art" ? DIGITAL_ART_MODEL : FACE_FALLBACK_MODEL;
  const realesrganExe = await findRealesrganExe();

  if (realesrganExe) {
    logEvent("INFO", "Using RealESRGAN binary", {
      exe: realesrganExe,
      model: modelName,
      mode,
      scale,
      inputDimensions: `${inputMeta.width}x${inputMeta.height}`,
      targetDimensions: `${targetWidth}x${targetHeight}`,
    });
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "pixelup-"));
    try {
      const inputPath = path.join(tmpDir, "input.png");
      const outputPath = path.join(tmpDir, "output.png");

      await sharp(imageBuffer).png().toFile(inputPath);
      if (onProgress) onProgress(2);

      await runRealesrganPass(
        realesrganExe,
        modelName,
        inputPath,
        outputPath,
        (p) => {
          if (!onProgress) return;
          const pct = Math.min(95, Math.max(2, Math.round(p * 0.93 + 2)));
          onProgress(pct);
        }
      );

      if (!fs.existsSync(outputPath)) {
        throw new Error("RealESRGAN output file was not created");
      }

      if (onProgress) onProgress(97);

      let pipeline = sharp(outputPath, { limitInputPixels: false });
      const outMeta = await pipeline.metadata();
      if (outMeta.width !== targetWidth || outMeta.height !== targetHeight) {
        pipeline = pipeline.resize(targetWidth, targetHeight, {
          kernel: "lanczos3",
        });
      }
      const enhancedBuffer = await pipeline
        .png({ compressionLevel: 8 })
        .toBuffer();

      if (onProgress) onProgress(100);

      return {
        buffer: enhancedBuffer,
        fallback: false,
        reason: null,
        strategy: mode === "face" ? "realesrgan-face" : "realesrgan-digital-art",
      };
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    }
  }

  logEvent("WARN", "RealESRGAN binary not found, using Sharp fallback");
  if (onProgress) onProgress(50);

  const enhancedBuffer = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, { kernel: "cubic" })
    .sharpen()
    .png({ compressionLevel: 8 })
    .toBuffer();

  if (onProgress) onProgress(100);

  return {
    buffer: enhancedBuffer,
    fallback: true,
    reason:
      "realesrgan-ncnn-vulkan binary unavailable; used Sharp cubic + sharpen",
    strategy: "sharp-fallback",
  };
}
