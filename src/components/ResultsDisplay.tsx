import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Columns2,
  Download,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { UpscaleMethod } from "@/pages/Dashboard";
import { toast } from "sonner";
import { ImageCompareSlider } from "./ImageCompareSlider";
import GlassSurface from "./GlassSurface";

import type { ScaleFactor } from "@/services/backendService";

interface ResultsDisplayProps {
  originalImageUrl: string;
  upscaledImageUrl: string;
  method: UpscaleMethod;
  scale?: ScaleFactor;
  onReset: () => void;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  strategy?: string;
}

export const ResultsDisplay = ({
  originalImageUrl,
  upscaledImageUrl,
  scale = 2,
  onReset,
}: ResultsDisplayProps) => {
  const [compareMode, setCompareMode] = useState<
    "slider" | "side-by-side" | "magnify"
  >("slider");

  const handleDownload = async () => {
    try {
      const resp = await fetch(upscaledImageUrl);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `upscaled-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed. Opening in new tab...");
      window.open(upscaledImageUrl, "_blank");
    }
  };

  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={20}
      refraction={false}
      backgroundOpacity={0.12}
      className="w-full"
    >
      <div className="w-full p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Upscaled!</h2>
            <p className="text-sm text-muted-foreground">
              {scale}x resolution enhancement complete
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 backdrop-blur-sm">
            <Button
              type="button"
              size="sm"
              variant={compareMode === "slider" ? "secondary" : "ghost"}
              className="gap-1.5"
              onClick={() => setCompareMode("slider")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Slider
            </Button>
            <Button
              type="button"
              size="sm"
              variant={compareMode === "side-by-side" ? "secondary" : "ghost"}
              className="gap-1.5"
              onClick={() => setCompareMode("side-by-side")}
            >
              <Columns2 className="h-4 w-4" />
              Side by Side
            </Button>
            <Button
              type="button"
              size="sm"
              variant={compareMode === "magnify" ? "secondary" : "ghost"}
              className="gap-1.5"
              onClick={() => setCompareMode("magnify")}
            >
              <Search className="h-4 w-4" />
              Magnify
            </Button>
          </div>
        </div>

        <div className="mb-6">
          {compareMode === "slider" || compareMode === "magnify" ? (
            <ImageCompareSlider
              beforeUrl={originalImageUrl}
              afterUrl={upscaledImageUrl}
              afterLabel={`After (${scale}x)`}
              magnifyMode={compareMode === "magnify"}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Original</h3>
                <div className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={originalImageUrl}
                    alt="Original"
                    className="h-auto w-full object-contain"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Upscaled HD</h3>
                <div className="overflow-hidden rounded-lg border-2 border-primary shadow-medium">
                  <img
                    src={upscaledImageUrl}
                    alt="Upscaled"
                    className="h-auto w-full object-contain"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            className="group flex-1 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_8px_24px_rgba(167,139,250,0.3)] active:translate-y-0 active:opacity-85"
          >
            <GlassSurface
              width="100%"
              height={48}
              borderRadius={16}
              refraction={false}
              backgroundOpacity={0.22}
              className="w-full bg-primary/20"
            >
              <span className="flex items-center justify-center gap-2 font-semibold text-foreground">
                <Download className="h-5 w-5 text-white transition-transform duration-200 group-hover:translate-y-0.5" />
                Download HD Image
              </span>
            </GlassSurface>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-2xl transition-all hover:brightness-110 active:opacity-85"
          >
            <GlassSurface
              width="100%"
              height={48}
              borderRadius={16}
              refraction={false}
              backgroundOpacity={0.08}
              className="w-full"
            >
              <span className="flex items-center justify-center gap-2 font-medium text-foreground">
                <RotateCcw className="h-5 w-5" />
                Upscale Another
              </span>
            </GlassSurface>
          </button>
        </div>
      </div>
    </GlassSurface>
  );
};
