/**
 * Backend service for processing and storing images locally.
 */

export const getBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5050";

export type ScaleFactor = 1 | 2 | 3 | 4;
export type EnhanceMode = "digital-art" | "face";

export interface ProcessResult {
  id: string;
  originalUrl: string;
  upscaledUrl: string;
  scale: number;
  fallback: boolean;
  reason?: string | null;
  strategy: string;
}

export interface LocalImageItem {
  id: string;
  originalUrl: string;
  upscaledUrl: string;
  method: "local" | "realesrgan";
  scale?: number;
  strategy?: string;
  fallback?: boolean;
  timestamp: Date;
}

export async function processImage(
  file: File,
  scale: ScaleFactor = 2,
  onProgress?: (percent: number) => void,
  mode: EnhanceMode = "digital-art"
): Promise<ProcessResult> {
  const backendUrl = getBackendUrl();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("method", "realesrgan");
  formData.append("scale", String(scale));
  formData.append("mode", mode);

  let resp: Response;
  try {
    resp = await fetch(`${backendUrl}/process?stream=1`, {
      method: "POST",
      body: formData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "network error";
    throw new Error(
      `Cannot reach enhancement server at ${backendUrl}. Is the backend running? (${message})`
    );
  }

  if (!resp.ok) {
    let details: string;
    try {
      details = await resp.text();
    } catch {
      details = "No error body";
    }
    throw new Error(`Backend error (${resp.status}): ${details}`);
  }

  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream") && resp.body) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let resultData: {
      id?: string;
      original_url?: string;
      upscaled_url?: string;
      scale?: number;
      fallback?: boolean;
      reason?: string | null;
      strategy?: string;
    } | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        let eventName = "message";
        let dataStr = "";
        for (const line of chunk.split("\n")) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataStr += line.slice(5).trim();
          }
        }
        if (!dataStr) continue;
        const parsed = JSON.parse(dataStr);
        if (eventName === "progress" && typeof parsed.progress === "number") {
          onProgress?.(parsed.progress);
        } else if (eventName === "complete") {
          resultData = parsed;
        } else if (eventName === "error") {
          throw new Error(parsed.detail || parsed.error || "Enhancement failed");
        }
      }
    }

    if (!resultData?.upscaled_url) {
      throw new Error("No enhanced image URL returned");
    }

    return {
      id: resultData.id || "",
      originalUrl: resultData.original_url
        ? `${backendUrl}${resultData.original_url}`
        : "",
      upscaledUrl: `${backendUrl}${resultData.upscaled_url}`,
      scale: Number(resultData.scale || scale),
      fallback: Boolean(resultData.fallback),
      reason: resultData.reason || null,
      strategy: resultData.strategy || "realesrgan",
    };
  }

  const data = await resp.json();
  if (!data.upscaled_url) {
    throw new Error("No enhanced image URL returned");
  }

  return {
    id: data.id || "",
    originalUrl: data.original_url ? `${backendUrl}${data.original_url}` : "",
    upscaledUrl: `${backendUrl}${data.upscaled_url}`,
    scale: Number(data.scale || scale),
    fallback: Boolean(data.fallback),
    reason: data.reason || null,
    strategy: data.strategy || "realesrgan",
  };
}

export async function getImages(): Promise<LocalImageItem[]> {
  const backendUrl = getBackendUrl();
  const resp = await fetch(`${backendUrl}/images`, { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`Failed to fetch images (${resp.status})`);
  }
  const data = (await resp.json()) as {
    images?: Array<{
      id: string;
      originalUrl: string;
      upscaledUrl: string;
      method?: "local" | "realesrgan";
      strategy?: string;
      fallback?: boolean;
      timestamp: string;
    }>;
  };
  return (data.images || []).map((item) => ({
    id: item.id,
    originalUrl: `${backendUrl}${item.originalUrl}`,
    upscaledUrl: `${backendUrl}${item.upscaledUrl}`,
    method: item.method || "local",
    strategy: item.strategy,
    fallback: Boolean(item.fallback),
    timestamp: new Date(item.timestamp),
  }));
}

export async function deleteImage(id: string): Promise<void> {
  const backendUrl = getBackendUrl();
  const resp = await fetch(`${backendUrl}/images/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!resp.ok) {
    throw new Error(`Failed to delete image (${resp.status})`);
  }
}

export async function deleteAllImages(): Promise<void> {
  const backendUrl = getBackendUrl();
  const resp = await fetch(`${backendUrl}/images`, {
    method: "DELETE",
  });
  if (!resp.ok) {
    throw new Error(`Failed to delete all images (${resp.status})`);
  }
}

/** Quick health check to see if backend is reachable before attempting enhancement */
export async function isBackendAvailable(timeoutMs = 2000): Promise<boolean> {
  const backendUrl = getBackendUrl();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(`${backendUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!resp.ok) return false;
    const json = await resp.json().catch(() => ({}));
    return json.status === "ok";
  } catch {
    clearTimeout(t);
    return false;
  }
}
