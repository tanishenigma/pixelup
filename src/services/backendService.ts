/**
 * Backend service for processing images using the Python server with RealESRGAN.
 * Expects a Flask endpoint at POST /process that returns JSON:
 * { enhanced_image_base64: string, mime_type: string, fallback?: boolean, reason?: string }
 */

export interface ProcessResult {
  blob: Blob;
  fallback: boolean;
  reason?: string | null;
  strategy: string; // 'realesrgan' or other strategies
}

export async function processImage(file: File): Promise<ProcessResult> {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("method", "realesrgan");

  let resp: Response;
  try {
    resp = await fetch(`${backendUrl}/process`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    // Network/connection error (server likely not running)
    throw new Error(
      `Cannot reach enhancement server at ${backendUrl}. Is the Python backend running? (${
        err?.message || "network error"
      })`
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

  const data = await resp.json();
  if (!data.enhanced_image_base64) {
    throw new Error("No enhanced image returned");
  }
  const bytes = Uint8Array.from(atob(data.enhanced_image_base64), (c) =>
    c.charCodeAt(0)
  );
  return {
    blob: new Blob([bytes], { type: data.mime_type || "image/png" }),
    fallback: Boolean(data.fallback),
    reason: data.reason || null,
    strategy: data.strategy || "realesrgan",
  };
}

/** Quick health check to see if backend is reachable before attempting enhancement */
export async function isBackendAvailable(timeoutMs = 2000): Promise<boolean> {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";
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
