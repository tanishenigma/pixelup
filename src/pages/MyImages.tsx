import { useState, useEffect, useCallback } from "react";
import { ImageGrid } from "@/components/ImageGrid";
import {
  deleteAllImages,
  getImages,
  LocalImageItem,
} from "@/services/backendService";
import { Image, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassSurface from "@/components/GlassSurface";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export type UpscaledImage = LocalImageItem;

const MyImages = () => {
  const [images, setImages] = useState<UpscaledImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedImages = await getImages();
      setImages(fetchedImages);
    } catch (err: any) {
      console.error("Error fetching images:", err);
      setError(
        err?.message ||
          "Could not load local images. Make sure the local backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await deleteAllImages();
      setImages([]);
      toast.success("All images deleted");
    } catch (err: any) {
      console.error("Delete all error:", err);
      toast.error(err?.message || "Failed to delete all images");
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <main
      className={
        images.length === 0
          ? "relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-4xl flex-col justify-center px-4 py-8"
          : "relative z-10 mx-auto w-full max-w-4xl px-4 pt-20 pb-14"
      }>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        {images.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deletingAll}
                className="group gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(239,68,68,0.35)]">
                <Trash2 className="h-4 w-4 text-white transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110" />
                {deletingAll ? "Deleting..." : "Delete All"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-white/15 bg-card/85 backdrop-blur-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all images?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {images.length} original and
                  upscaled images from local storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  className="bg-destructive text-white hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : error ? (
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={20}
          refraction={false}
          backgroundOpacity={0.12}
          className="w-full">
          <div className="w-full p-6 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </GlassSurface>
      ) : images.length === 0 ? (
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={20}
          refraction={false}
          backgroundOpacity={0.1}
          className="w-full">
          <div className="w-full px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
              <Image className="h-6 w-6 text-white" />
            </div>
            <h2 className="mb-1.5 text-lg font-semibold text-foreground">
              No images yet
            </h2>
            <p className="text-sm text-muted-foreground">
              Start upscaling images from the Upscale tab to see them here
            </p>
          </div>
        </GlassSurface>
      ) : (
        <ImageGrid images={images} onImageDeleted={fetchImages} />
      )}
    </main>
  );
};

export default MyImages;
