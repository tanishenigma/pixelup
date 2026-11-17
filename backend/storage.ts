import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { METADATA_FILE, STORAGE_DIR, logEvent } from "./config.ts";

export interface StoredImageMetadata {
  id: string;
  originalFilename: string;
  enhancedFilename: string;
  method: string;
  scale: number;
  strategy: string;
  fallback: boolean;
  timestamp: string;
}

export async function loadMetadata(): Promise<StoredImageMetadata[]> {
  if (!fs.existsSync(METADATA_FILE)) return [];
  try {
    const raw = await fsp.readFile(METADATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err: unknown) {
    logEvent("ERROR", "Failed to read metadata.json", {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export async function saveMetadata(items: StoredImageMetadata[]): Promise<void> {
  await fsp.mkdir(STORAGE_DIR, { recursive: true });
  await fsp.writeFile(METADATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function saveProcessedImage({
  originalName,
  rawBuffer,
  enhancedBuffer,
  scale,
  strategy,
  fallback,
}: {
  originalName: string;
  rawBuffer: Buffer;
  enhancedBuffer: Buffer;
  scale: number;
  strategy: string;
  fallback: boolean;
}): Promise<StoredImageMetadata> {
  const imageId = crypto.randomBytes(16).toString("hex");
  let origExt = path.extname(originalName || "image.png").toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(origExt)) {
    origExt = ".png";
  }

  const origFilename = `${imageId}_original${origExt}`;
  const enhancedFilename = `${imageId}_enhanced.png`;

  await fsp.writeFile(path.join(STORAGE_DIR, origFilename), rawBuffer);
  await fsp.writeFile(path.join(STORAGE_DIR, enhancedFilename), enhancedBuffer);

  const entry: StoredImageMetadata = {
    id: imageId,
    originalFilename: origFilename,
    enhancedFilename,
    method: "local",
    scale,
    strategy,
    fallback,
    timestamp: new Date().toISOString(),
  };

  const items = await loadMetadata();
  items.unshift(entry);
  await saveMetadata(items);

  return entry;
}

export async function listStoredImages() {
  const items = await loadMetadata();
  const result = [];

  for (const item of items) {
    if (!item.id) continue;
    const origPath = path.join(STORAGE_DIR, item.originalFilename || "");
    const enhPath = path.join(STORAGE_DIR, item.enhancedFilename || "");
    if (!fs.existsSync(origPath) || !fs.existsSync(enhPath)) continue;

    result.push({
      id: item.id,
      originalUrl: `/images/${item.id}/original`,
      upscaledUrl: `/images/${item.id}/upscaled`,
      method: item.method || "local",
      scale: item.scale || 2,
      strategy: item.strategy || "realesrgan",
      fallback: Boolean(item.fallback),
      timestamp: item.timestamp,
    });
  }

  return result;
}

export async function resolveImageFilePath(
  id: string,
  kind: string
): Promise<{ filePath?: string; error?: string; status?: number }> {
  if (kind !== "original" && kind !== "upscaled") {
    return { error: "Invalid image kind", status: 400 };
  }

  const items = await loadMetadata();
  const entry = items.find((item) => item.id === id);
  if (!entry) {
    return { error: "Image not found", status: 404 };
  }

  const filename =
    kind === "original" ? entry.originalFilename : entry.enhancedFilename;
  if (!filename) {
    return { error: "File not found", status: 404 };
  }

  const filePath = path.resolve(STORAGE_DIR, filename);
  if (
    !filePath.startsWith(path.resolve(STORAGE_DIR)) ||
    !fs.existsSync(filePath)
  ) {
    return { error: "File not found", status: 404 };
  }

  return { filePath };
}

export async function deleteStoredImage(id: string): Promise<boolean> {
  const items = await loadMetadata();
  const entry = items.find((item) => item.id === id);
  if (!entry) return false;

  for (const key of ["originalFilename", "enhancedFilename"] as const) {
    const filename = entry[key];
    if (filename) {
      const filePath = path.join(STORAGE_DIR, filename);
      if (fs.existsSync(filePath)) {
        await fsp.unlink(filePath);
      }
    }
  }

  const remaining = items.filter((item) => item.id !== id);
  await saveMetadata(remaining);
  return true;
}

export async function deleteAllStoredImages(): Promise<number> {
  const items = await loadMetadata();
  for (const entry of items) {
    for (const key of ["originalFilename", "enhancedFilename"] as const) {
      const filename = entry[key];
      if (filename) {
        const filePath = path.join(STORAGE_DIR, filename);
        if (fs.existsSync(filePath)) {
          await fsp.unlink(filePath);
        }
      }
    }
  }
  await saveMetadata([]);
  return items.length;
}
