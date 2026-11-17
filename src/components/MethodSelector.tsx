import { useEffect, useRef, useState } from "react";
import { Palette, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { UpscaleMethod, ProcessingState } from "@/pages/Dashboard";
import {
  EnhanceMode,
  processImage,
  isBackendAvailable,
  ProcessResult,
  ScaleFactor,
} from "../services/backendService";
import GlassSurface from "./GlassSurface";

const SCALE_OPTIONS: ScaleFactor[] = [1, 2, 3, 4];
const MODE_OPTIONS: Array<{ id: EnhanceMode; label: string }> = [
  { id: "digital-art", label: "Digital Art" },
  { id: "face", label: "Face" },
];

interface MethodSelectorProps {
  onMethodSelected: (method: UpscaleMethod) => void;
  disabled?: boolean;
  file: File | null;
  onProcessingStateChange: (state: ProcessingState) => void;
  onProgressChange?: (progress: number) => void;
  onProcessingComplete: (
    enhancedUrl: string,
    originalUrl: string,
    fallback: boolean,
    reason?: string | null,
    strategy?: string,
    scale?: ScaleFactor
  ) => void;
  onError: (message: string) => void;
}

export const MethodSelector = ({
  onMethodSelected,
  disabled,
  file,
  onProcessingStateChange,
  onProgressChange,
  onProcessingComplete,
  onError,
}: MethodSelectorProps) => {
  const [scale, setScale] = useState<ScaleFactor>(2);
  const [mode, setMode] = useState<EnhanceMode>("face");
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const modeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 6, top: 6, width: 0, height: 0 });
  const [modePill, setModePill] = useState<{
    left: number;
    width: number;
  }>({ left: 4, width: 0 });

  useEffect(() => {
    const el = btnRefs.current[scale];
    if (!el) return;
    setPill({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  }, [scale]);

  useEffect(() => {
    const el = modeRefs.current[mode];
    if (!el) return;
    setModePill({
      left: el.offsetLeft,
      width: el.offsetWidth,
    });
  }, [mode]);

  const handleMethodClick = async (method: UpscaleMethod) => {
    if (!method) return;
    if (!file) {
      toast.error("Please select an image first");
      return;
    }

    const reachable = await isBackendAvailable();
    if (!reachable) {
      toast.error(
        "Enhancement server not reachable on 127.0.0.1:5050. Start backend: npm run dev:backend"
      );
      onError("Backend not running on 127.0.0.1:5050");
      return;
    }

    onMethodSelected(method);
    onProgressChange?.(0);
    onProcessingStateChange("processing");

    const MIN_DURATION_MS = 5000;
    const startedAt = Date.now();
    let latestPct = 0;

    // Smooth baseline timer so progress advances naturally even if backend is fast
    const smoothTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const timePct = Math.min(92, Math.round((elapsed / MIN_DURATION_MS) * 92));
      if (timePct > latestPct) {
        latestPct = timePct;
        onProgressChange?.(latestPct);
      }
    }, 100);

    try {
      toast.info(`Upscaling image (${scale}x)...`);

      const result: ProcessResult = await processImage(
        file,
        scale,
        (pct) => {
          // Cap real progress to time-paced progress until MIN_DURATION_MS elapses
          const elapsed = Date.now() - startedAt;
          const maxAllowed =
            elapsed >= MIN_DURATION_MS
              ? pct
              : Math.min(pct, Math.round((elapsed / MIN_DURATION_MS) * 95));
          if (maxAllowed > latestPct) {
            latestPct = maxAllowed;
            onProgressChange?.(latestPct);
          }
        },
        mode
      );

      const remaining = MIN_DURATION_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        const steps = Math.max(1, Math.ceil(remaining / 80));
        const startPct = latestPct;
        for (let i = 1; i <= steps; i++) {
          await new Promise((r) => setTimeout(r, remaining / steps));
          const nextPct = Math.round(startPct + ((99 - startPct) * i) / steps);
          onProgressChange?.(nextPct);
        }
      }
      onProgressChange?.(100);
      await new Promise((r) => setTimeout(r, 250));

      onProcessingComplete(
        result.upscaledUrl,
        result.originalUrl,
        result.fallback,
        result.reason,
        result.strategy,
        scale
      );
      toast.success("Image enhanced & saved locally");
    } catch (err: unknown) {
      console.error("Enhancement error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to enhance image";
      onError(message);
      toast.error(message);
      onProcessingStateChange("error");
    } finally {
      window.clearInterval(smoothTimer);
    }
  };

  return (
    <div className="space-y-4">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={20}
        refraction={false}
        backgroundOpacity={0.12}
        className="w-full"
      >
        <div className="w-full space-y-4 p-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Mode</span>
              <span className="text-xs text-muted-foreground">
                {mode === "face" ? "Photo / Face" : "Anime / Art"}
              </span>
            </div>
            <div className="relative grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 text-xs font-medium">
              {modePill.width > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-1 rounded-lg border border-white/25 bg-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 ease-out"
                  style={{
                    left: modePill.left,
                    width: modePill.width,
                  }}
                />
              )}
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  ref={(el) => {
                    modeRefs.current[opt.id] = el;
                  }}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMode(opt.id)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                    mode === opt.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.id === "digital-art" ? (
                    <Palette className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5 text-white" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Scale</span>
              <span className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                {scale}x {scale === 1 ? "Enhance" : ""}
              </span>
            </div>
            <div className="relative grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 text-xs font-medium">
              {pill.width > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-lg border border-white/25 bg-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 ease-out"
                  style={{
                    left: pill.left,
                    top: pill.top,
                    width: pill.width,
                    height: pill.height,
                  }}
                />
              )}
              {SCALE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  ref={(el) => {
                    btnRefs.current[opt] = el;
                  }}
                  type="button"
                  disabled={disabled}
                  onClick={() => setScale(opt)}
                  className={`relative z-10 rounded-lg py-2 transition-colors ${
                    scale === opt
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassSurface>

      <button
        type="button"
        onClick={() => !disabled && handleMethodClick("local")}
        disabled={disabled}
        className="group w-full rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(167,139,250,0.3)] active:translate-y-0 active:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GlassSurface
          width="100%"
          height={52}
          borderRadius={16}
          refraction={false}
          backgroundOpacity={0.22}
          className="w-full bg-primary/20"
        >
          <span className="flex items-center justify-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-white transition-transform duration-200 group-hover:scale-110" />
            Upscale {scale}x
          </span>
        </GlassSurface>
      </button>
    </div>
  );
};
