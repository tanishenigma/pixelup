import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ImageGrid } from "@/components/ImageGrid";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export interface UpscaledImage {
  id: string;
  originalUrl: string;
  upscaledUrl: string;
  method: "local" | "realesrgan";
  timestamp: Date;
  userId: string;
}

const MyImages = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<UpscaledImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const imagesRef = collection(db, "upscaledImages");
      const q = query(
        imagesRef,
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(q);
      const fetchedImages: UpscaledImage[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedImages.push({
          id: doc.id,
          originalUrl: data.originalUrl,
          upscaledUrl: data.upscaledUrl,
          method: data.method,
          timestamp: data.timestamp.toDate(),
          userId: data.userId,
        });
      });

      setImages(fetchedImages);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-foreground">
            My Upscaled Images
          </h1>
          <p className="text-lg text-muted-foreground">
            View and download all your AI-enhanced images
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <span className="text-2xl">🖼️</span>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              No images yet
            </h2>
            <p className="text-muted-foreground">
              Start upscaling images from the dashboard to see them here
            </p>
          </div>
        ) : (
          <ImageGrid images={images} onImageDeleted={fetchImages} />
        )}
      </main>
    </div>
  );
};

export default MyImages;
