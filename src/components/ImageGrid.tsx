import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Cpu, Trash2 } from "lucide-react";
import type { UpscaledImage } from "@/pages/MyImages";
import { toast } from "sonner";
import { db, storage } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

interface ImageGridProps {
  images: UpscaledImage[];
  onImageDeleted?: () => void;
}

export const ImageGrid = ({ images, onImageDeleted }: ImageGridProps) => {
  const [selectedImage, setSelectedImage] = useState<UpscaledImage | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async (url: string) => {
    try {
      // For Firebase URLs, use XMLHttpRequest which handles CORS better
      const xhr = new XMLHttpRequest();
      xhr.responseType = "blob";
      xhr.onload = () => {
        const blob = xhr.response;
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `upscaled-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success("Download started");
      };
      xhr.onerror = () => {
        console.error("XHR download failed, trying fallback");
        // Fallback: Create a temporary link with download attribute
        const a = document.createElement("a");
        a.href = url;
        a.download = `upscaled-${Date.now()}.png`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      xhr.open("GET", url);
      xhr.send();
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed. Opening in new tab...");
      window.open(url, "_blank");
    }
  };

  const handleDelete = async (image: UpscaledImage) => {
    setIsDeleting(true);
    try {
      // Extract the storage path from the URL
      const getStoragePathFromUrl = (url: string) => {
        try {
          const decodedUrl = decodeURIComponent(url);
          const match = decodedUrl.match(/\/o\/(.+?)\?/);
          return match ? match[1] : null;
        } catch {
          return null;
        }
      };

      // Delete from Firestore
      await deleteDoc(doc(db, "upscaledImages", image.id));

      // Delete files from Storage
      const originalPath = getStoragePathFromUrl(image.originalUrl);
      const upscaledPath = getStoragePathFromUrl(image.upscaledUrl);

      if (originalPath) {
        try {
          await deleteObject(ref(storage, originalPath));
        } catch (err) {
          console.warn("Failed to delete original image:", err);
        }
      }

      if (upscaledPath) {
        try {
          await deleteObject(ref(storage, upscaledPath));
        } catch (err) {
          console.warn("Failed to delete upscaled image:", err);
        }
      }

      toast.success("Image deleted successfully");
      setSelectedImage(null);

      // Notify parent to refresh the list
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="group cursor-pointer overflow-hidden border-border bg-card transition-all hover:shadow-medium"
            onClick={() => setSelectedImage(image)}>
            <div className="relative aspect-square overflow-hidden">
              <img
                src={image.upscaledUrl}
                alt="Upscaled"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground">
                {image.timestamp.toLocaleDateString()} at{" "}
                {image.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex mr-10 gap-2">
                  <Button
                    onClick={() => handleDownload(selectedImage.upscaledUrl)}
                    className="gap-2 bg-gradient-primary hover:opacity-90">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={() => handleDelete(selectedImage)}
                    disabled={isDeleting}
                    variant="destructive"
                    className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>

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
