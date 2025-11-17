import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";
import type { UpscaleMethod } from "@/pages/Dashboard";
import { toast } from "sonner";

interface ResultsDisplayProps {
  originalImageUrl: string;
  upscaledImageUrl: string;
  method: UpscaleMethod;
  onReset: () => void;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  strategy?: string;
}

export const ResultsDisplay = ({
  originalImageUrl,
  upscaledImageUrl,
  method,
  onReset,
  fallbackUsed = false,
  fallbackReason,
  strategy,
}: ResultsDisplayProps) => {
  const handleDownload = async () => {
    try {
      // For Firebase URLs, we can use XMLHttpRequest which handles CORS better
      const xhr = new XMLHttpRequest();
      xhr.responseType = "blob";
      xhr.onload = () => {
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `upscaled-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Download started");
      };
      xhr.onerror = () => {
        console.error("XHR download failed, trying fallback");
        // Fallback: Create a temporary link with download attribute
        const a = document.createElement("a");
        a.href = upscaledImageUrl;
        a.download = `upscaled-${Date.now()}.png`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      xhr.open("GET", upscaledImageUrl);
      xhr.send();
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed. Opening in new tab...");
      window.open(upscaledImageUrl, "_blank");
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-elevated">
      <div className="bg-gradient-primary p-6 text-center">
        <h2 className="mb-2 text-3xl font-bold text-primary-foreground flex items-center justify-center gap-3">
          <span>Success! </span>
          {strategy && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase ${
                strategy === "realesrgan"
                  ? "bg-white/20 text-primary-foreground"
                  : "bg-amber-500/80 text-white"
              }`}>
              {strategy === "realesrgan"
                ? "RealESRGAN"
                : strategy.replace("-", " ")}
            </span>
          )}
        </h2>
        {fallbackUsed ? (
          <p className="text-primary-foreground/90">
            Your image has been enhanced using OpenCV (4x bicubic + sharpening).
            {fallbackReason && fallbackReason.includes("unavailable")
              ? " RealESRGAN binary not installed - using quality fallback."
              : ""}
          </p>
        ) : (
          <p className="text-primary-foreground/90">
            Your image has been upscaled with RealESRGAN (4x resolution)
          </p>
        )}
      </div>

      <div className="p-6">
        <div className="mb-6 grid gap-4 md:grid-cols-2">
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleDownload}
            className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
            size="lg">
            <Download className="h-5 w-5" />
            Download HD Image
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 gap-2"
            size="lg">
            <RotateCcw className="h-5 w-5" />
            Upscale Another
          </Button>
        </div>
      </div>
    </Card>
  );
};
