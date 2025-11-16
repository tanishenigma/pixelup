import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { UpscaleMethod, ProcessingState } from "@/pages/Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import {
  processImage,
  isBackendAvailable,
  ProcessResult,
} from "../services/backendService";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface MethodSelectorProps {
  onMethodSelected: (method: UpscaleMethod) => void;
  disabled?: boolean;
  file: File | null;
  onProcessingStateChange: (state: ProcessingState) => void;
  onProcessingComplete: (
    enhancedUrl: string,
    fallback: boolean,
    reason?: string | null,
    strategy?: string
  ) => void;
  onError: (message: string) => void;
}

export const MethodSelector = ({
  onMethodSelected,
  disabled,
  file,
  onProcessingStateChange,
  onProcessingComplete,
  onError,
}: MethodSelectorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<UpscaleMethod>(null);
  const { user } = useAuth();

  const handleMethodClick = async (method: UpscaleMethod) => {
    if (!method) return;
    if (!file) {
      toast.error("Please select an image first");
      return;
    }
    if (!user) {
      toast.error("You must be signed in to process images");
      return;
    }

    // Preflight backend availability
    const reachable = await isBackendAvailable();
    if (!reachable) {
      toast.error(
        "Enhancement server not reachable on 127.0.0.1:5000. Start backend: cd backend && python app.py"
      );
      onError("Backend not running on 127.0.0.1:5000");
      return;
    }

    setSelectedMethod(method);
    onMethodSelected(method);
    onProcessingStateChange("processing");

    try {
      toast.info("Enhancing image (4x upscale)...");

      // Upload original image to Firebase Storage first
      const originalTimestamp = Date.now();
      const originalFileName = `${originalTimestamp}_original.${file.name
        .split(".")
        .pop()}`;
      const originalStoragePath = `original-uploads/${user.uid}/${originalFileName}`;
      const originalStorageRef = ref(storage, originalStoragePath);
      await uploadBytes(originalStorageRef, file);
      const originalDownloadURL = await getDownloadURL(originalStorageRef);

      // Call backend to process image (no API key needed)
      const result: ProcessResult = await processImage(file);
      const enhancedBlob = result.blob;

      // Upload enhanced image to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_enhanced.png`;
      const storagePath = `enhanced-uploads/${user.uid}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, enhancedBlob, { contentType: "image/png" });
      const downloadURL = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      try {
        await addDoc(collection(db, "upscaledImages"), {
          userId: user.uid,
          originalUrl: originalDownloadURL,
          upscaledUrl: downloadURL,
          method: method || "local",
          strategy: result.strategy || "realesrgan",
          fallback: result.fallback || false,
          timestamp: serverTimestamp(),
        });
        console.log("Image metadata saved to Firestore");
      } catch (firestoreError) {
        console.error("Failed to save to Firestore:", firestoreError);
        // Don't fail the whole process if Firestore save fails
      }

      onProcessingComplete(
        downloadURL,
        result.fallback,
        result.reason,
        result.strategy
      );
      toast.success("Image enhanced & uploaded successfully");
    } catch (err) {
      console.error("Enhancement error:", err);
      const message = err?.message || "Failed to enhance image";
      onError(message);
      toast.error(message);
      onProcessingStateChange("error");
    }
  };

  return (
    <Card className="overflow-hidden border-border bg-card shadow-soft">
      <div className="bg-gradient-card p-6">
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Pixelup{" "}
        </h2>
        <p className="text-sm text-muted-foreground">
          Enhance your image with local AI upscaling
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-1">
        <Card
          className={`group overflow-hidden border-2 transition-all hover:border-primary hover:shadow-medium ${
            selectedMethod === "local"
              ? "border-primary shadow-medium"
              : "border-border"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
          <div className="bg-gradient-primary p-6 transition-opacity group-hover:opacity-90">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-primary-foreground">
              RealESRGAN 4x Upscale
            </h3>
            <p className="text-sm text-primary-foreground/90">
              Local AI model for stunning image enhancement with 4x resolution
              increase
            </p>
          </div>
          <div className="space-y-3 p-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              Powered by RealESRGAN - runs locally on your machine.
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                <span className="text-muted-foreground">
                  High quality 4x upscaling
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                <span className="text-muted-foreground">
                  100% local processing
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                <span className="text-muted-foreground">
                  No API key required
                </span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => !disabled && handleMethodClick("local")}
              disabled={disabled}>
              Enhance & Upload with RealESRGAN
            </Button>
          </div>
        </Card>
      </div>
    </Card>
  );
};
