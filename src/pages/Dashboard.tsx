import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ImageUploader } from "@/components/ImageUploader";
import { MethodSelector } from "@/components/MethodSelector";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { ResultsDisplay } from "@/components/ResultsDisplay";

export type UpscaleMethod = "local" | null;
export type ProcessingState =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

const Dashboard = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null); // enhanced image download URL
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null); // local preview only
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<UpscaleMethod>(null);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");
  const [upscaledImageUrl, setUpscaledImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fallbackUsed, setFallbackUsed] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string | null>(null);

  const handleImageSelected = (file: File | null, preview?: string | null) => {
    setSelectedFile(file);
    setPreviewDataUrl(preview || null);
    setUploadedImageUrl(null);
    setSelectedMethod(null);
    setProcessingState("idle");
    setUpscaledImageUrl(null);
    setErrorMessage("");
  };

  // Original upload removed: enhanced image URL will be set upon processing completion.

  const handleMethodSelected = (method: UpscaleMethod) => {
    setSelectedMethod(method);
  };

  const handleProcessingComplete = (
    enhancedUrl: string,
    fallback: boolean,
    reason?: string | null,
    strategy?: string
  ) => {
    setUpscaledImageUrl(enhancedUrl);
    setUploadedImageUrl(enhancedUrl);
    setProcessingState("complete");
    setFallbackUsed(fallback);
    setFallbackReason(reason || null);
    setStrategy(strategy || "realesrgan");
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setProcessingState("error");
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewDataUrl(null);
    setUploadedImageUrl(null);
    setSelectedMethod(null);
    setProcessingState("idle");
    setUpscaledImageUrl(null);
    setErrorMessage("");
    setFallbackUsed(false);
    setFallbackReason(null);
    setStrategy(null);
  };

  return (
    <div className="min-h-screen  bg-gradient-subtle">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl font-bold text-foreground">
            Pixelup Your Image
          </h1>
          <p className="text-lg text-muted-foreground">
            Transform your images to stunning HD quality with AI
          </p>
        </div>

        <div className="mx-auto max-w-4xl space-y-6">
          {processingState === "complete" && upscaledImageUrl ? (
            <ResultsDisplay
              originalImageUrl={previewDataUrl || ""}
              upscaledImageUrl={upscaledImageUrl || ""}
              method={selectedMethod || "local"}
              onReset={handleReset}
              fallbackUsed={fallbackUsed}
              fallbackReason={fallbackReason || undefined}
              strategy={strategy || undefined}
            />
          ) : (
            <>
              <ImageUploader
                onImageSelected={handleImageSelected}
                disabled={processingState === "processing"}
                selectedFile={selectedFile}
              />

              {selectedFile &&
                previewDataUrl &&
                (processingState === "idle" || processingState === "error") && (
                  <MethodSelector
                    onMethodSelected={handleMethodSelected}
                    disabled={false}
                    file={selectedFile}
                    onProcessingStateChange={setProcessingState}
                    onProcessingComplete={handleProcessingComplete}
                    onError={handleError}
                  />
                )}

              {(processingState === "processing" ||
                processingState === "uploading") && (
                <ProcessingStatus
                  state={processingState}
                  method={selectedMethod}
                />
              )}

              {processingState === "error" && errorMessage && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
                  <p className="text-destructive">{errorMessage}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
