import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Columns2,
  Download,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { UpscaledImage } from "@/pages/MyImages";
import { toast } from "sonner";
import { deleteImage } from "@/services/backendService";
import { ImageCompareSlider } from "./ImageCompareSlider";
import GlassSurface from "./GlassSurface";

interface ImageGridProps {
  images: UpscaledImage[];
  onImageDeleted?: () => void;
}

export const ImageGrid = ({ images, onImageDeleted }: ImageGridProps) => {
  const [selectedImage, setSelectedImage] = useState<UpscaledImage | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [compareMode, setCompareMode] = useState<
    "slider" | "side-by-side" | "magnify"
  >("slider");

  const handleDownload = async (url: string) => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Download failed");
      const blob = await resp.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `upscaled-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed. Opening in new tab...");
      window.open(url, "_blank");
    }
  };

  const handleDelete = async (image: UpscaledImage) => {
    setIsDeleting(true);
    try {
      await deleteImage(image.id);
      toast.success("Image deleted successfully");
      setSelectedImage(null);
      if (onImageDeleted) {
        onImageDeleted();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelectedImage(image)}
            className="group w-full text-left rounded-[20px] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
          >
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={20}
              refraction={false}
              backgroundOpacity={0.1}
              className="w-full"
            >
              <div className="w-full p-2.5">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <img
                    src={image.upscaledUrl}
                    alt="Upscaled"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between px-1 pt-2.5 pb-0.5">
                  <span className="text-xs text-muted-foreground">
                    {image.timestamp.toLocaleDateString()} ·{" "}
                    {image.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                    {image.scale ? `${image.scale}x` : "HD"}
                  </span>
                </div>
              </div>
            </GlassSurface>
          </button>
        ))}
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl border-white/15 bg-card/85 backdrop-blur-xl">
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mr-8">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(selectedImage.upscaledUrl)}
                    className="group gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(167,139,250,0.35)]">
                    <Download className="h-4 w-4 text-white transition-transform duration-200 group-hover:translate-y-0.5" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedImage)}
                    disabled={isDeleting}
                    variant="destructive"
                    className="group gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(239,68,68,0.35)]">
                    <Trash2 className="h-4 w-4 text-white transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1 backdrop-blur-md">
                  <Button
                    type="button"
                    size="sm"
                    variant={compareMode === "slider" ? "secondary" : "ghost"}
                    className="gap-1.5"
                    onClick={() => setCompareMode("slider")}
                  >
                    <SlidersHorizontal className="h-4 w-4 text-white" />
                    Slider
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      compareMode === "side-by-side" ? "secondary" : "ghost"
                    }
                    className="gap-1.5"
                    onClick={() => setCompareMode("side-by-side")}
                  >
                    <Columns2 className="h-4 w-4 text-white" />
                    Side by Side
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={compareMode === "magnify" ? "secondary" : "ghost"}
                    className="gap-1.5"
                    onClick={() => setCompareMode("magnify")}
                  >
                    <Search className="h-4 w-4 text-white" />
                    Magnify
                  </Button>
                </div>
              </div>

              {compareMode === "slider" || compareMode === "magnify" ? (
                <ImageCompareSlider
                  beforeUrl={selectedImage.originalUrl}
                  afterUrl={selectedImage.upscaledUrl}
                  magnifyMode={compareMode === "magnify"}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Original
                    </h4>
                    <img
                      src={selectedImage.originalUrl}
                      alt="Original"
                      className="w-full rounded-lg border border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Upscaled HD
                    </h4>
                    <img
                      src={selectedImage.upscaledUrl}
                      alt="Upscaled"
                      className="w-full rounded-lg border-2 border-primary"
                    />
                  </div>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground">
                Created on {selectedImage.timestamp.toLocaleDateString()} at{" "}
                {selectedImage.timestamp.toLocaleTimeString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
