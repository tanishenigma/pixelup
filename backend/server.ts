import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { DIST_DIR, PORT, logEvent } from "./config.ts";
import { enhanceImage, type EnhanceMode } from "./enhancer.ts";
import {
  deleteAllStoredImages,
  deleteStoredImage,
  listStoredImages,
  resolveImageFilePath,
  saveProcessedImage,
} from "./storage.ts";

const app = express();
app.use(cors());

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path !== "/health") {
    logEvent("INFO", `${req.method} ${req.path}`);
  }
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post(
  "/process",
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const requestedScale = Number(req.body?.scale);
    const scale = [1, 2, 3, 4].includes(requestedScale) ? requestedScale : 2;
    const mode: EnhanceMode =
      req.body?.mode === "face" ? "face" : "digital-art";
    const useStream = req.query.stream === "1";
    const startedAt = Date.now();

    logEvent("INFO", "Processing image", {
      filename: req.file.originalname,
      sizeBytes: req.file.size,
      scale,
      mode,
    });

    if (useStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();
    }

    const sendEvent = (event: string, payload: Record<string, unknown>) => {
      if (!useStream || res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    let lastSentPct = -1;

    try {
      const rawBuffer = req.file.buffer;
      const { buffer: enhancedBuffer, fallback, reason, strategy } =
        await enhanceImage(rawBuffer, scale, mode, (pct) => {
          if (pct !== lastSentPct) {
            lastSentPct = pct;
            sendEvent("progress", { progress: pct });
          }
        });

      const entry = await saveProcessedImage({
        originalName: req.file.originalname,
        rawBuffer,
        enhancedBuffer,
        scale,
        strategy,
        fallback,
      });

      logEvent("INFO", "Image processed successfully", {
        id: entry.id,
        scale,
        mode,
        strategy,
        fallback,
        outputBytes: enhancedBuffer.length,
        durationMs: Date.now() - startedAt,
      });

      const payload = {
        id: entry.id,
        scale,
        mode,
        mime_type: "image/png",
        fallback,
        reason,
        strategy,
        original_url: `/images/${entry.id}/original`,
        upscaled_url: `/images/${entry.id}/upscaled`,
      };

      if (useStream) {
        sendEvent("complete", payload);
        return res.end();
      }
      return res.json(payload);
    } catch (err: any) {
      logEvent("ERROR", "Processing error", {
        error: err?.message || String(err),
        durationMs: Date.now() - startedAt,
      });
      if (useStream) {
        sendEvent("error", {
          error: "Enhancement failed",
          detail: err?.message || String(err),
        });
        return res.end();
      }
      return res.status(500).json({
        error: "Enhancement failed",
        detail: err?.message || String(err),
      });
    }
  }
);

app.get("/images", async (_req: Request, res: Response) => {
  const images = await listStoredImages();
  res.json({ images });
});

app.get("/images/:id/:kind", async (req: Request, res: Response) => {
  const { id, kind } = req.params;
  const resolved = await resolveImageFilePath(String(id), String(kind));
  if (resolved.error || !resolved.filePath) {
    return res
      .status(resolved.status || 404)
      .json({ error: resolved.error || "Not found" });
  }
  res.sendFile(resolved.filePath);
});

app.delete("/images", async (_req: Request, res: Response) => {
  const count = await deleteAllStoredImages();
  logEvent("INFO", "Deleted all stored images", { count });
  res.json({ deletedAll: true, count });
});

app.delete("/images/:id", async (req: Request, res: Response) => {
  const deleted = await deleteStoredImage(String(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Image not found" });
  }
  res.json({ deleted: true, id: req.params.id });
});

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("/{*splat}", (_req: Request, res: Response) => {
    const indexFile = path.join(DIST_DIR, "index.html");
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }
    res.status(404).json({ error: "Not found" });
  });
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logEvent("ERROR", "Express error", {
    code: err?.code,
    message: err?.message || String(err),
  });
  const status = err?.code === "LIMIT_FILE_SIZE" ? 413 : 500;
  res.status(status).json({
    error: err?.message || "Server error",
    code: err?.code || "INTERNAL_ERROR",
  });
});

const server = app.listen(PORT, "127.0.0.1", () => {
  logEvent("INFO", `Pixelup local backend listening on http://127.0.0.1:${PORT}`);
});
server.requestTimeout = 0;
