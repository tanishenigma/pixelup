import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
export const BACKEND_DIR = path.dirname(__filename);
export const ROOT_DIR = path.resolve(BACKEND_DIR, "..");
export const DIST_DIR = path.join(ROOT_DIR, "dist");
export const MODEL_DIR = path.join(ROOT_DIR, "models");

export const DIGITAL_ART_MODEL = "realesr-animevideov3-x4";
export const FACE_FALLBACK_MODEL = "4x-UltraSharp";

export const OSDFACE_DIR = path.join(BACKEND_DIR, "osdface");
export const OSDFACE_CKPT_DIR = path.join(OSDFACE_DIR, "pretrained");
export const OSDFACE_WEIGHT = path.join(OSDFACE_CKPT_DIR, "associate_2.ckpt");
export const OSDFACE_SD21_DIR = path.join(OSDFACE_DIR, "sd21");
export const OSDFACE_VENV_PYTHON = path.join(OSDFACE_DIR, ".venv", "bin", "python");

export const STORAGE_DIR = path.join(BACKEND_DIR, "local_storage");
export const METADATA_FILE = path.join(STORAGE_DIR, "metadata.json");
export const LOG_FILE = path.join(STORAGE_DIR, "server.log");

export const PORT = Number(process.env.PORT || 5050);

await fsp.mkdir(STORAGE_DIR, { recursive: true });

export type LogLevel = "INFO" | "WARN" | "ERROR";

export function logEvent(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): void {
  const line = `[${new Date().toISOString()}] [${level}] ${message}${
    meta ? " " + JSON.stringify(meta) : ""
  }`;
  if (level === "ERROR") {
    console.error(line);
  } else {
    console.log(line);
  }
  fsp.appendFile(LOG_FILE, line + "\n", "utf-8").catch(() => {});
}
