import { useState } from "react";
import type { ScaleFactor } from "@/services/backendService";
import { ImageUploader } from "@/components/ImageUploader";
import { MethodSelector } from "@/components/MethodSelector";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import CRTWarp from "@/components/CRTWarp";
import RefineFrame from "@/components/RefineFrame";

export type UpscaleMethod = "local" | null;
export type ProcessingState =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

const Dashboard = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [originalResultUrl, setOriginalResultUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<UpscaleMethod>(null);
  const [selectedScale, setSelectedScale] = useState<ScaleFactor>(2);
  const [progress, setProgress] = useState<number>(0);
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
    setOriginalResultUrl(null);
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
    originalUrl: string,
    fallback: boolean,
    reason?: string | null,
    strategy?: string,
    scale?: ScaleFactor
  ) => {
    setUpscaledImageUrl(enhancedUrl);
    setOriginalResultUrl(originalUrl);
    setUploadedImageUrl(enhancedUrl);
    if (scale) setSelectedScale(scale);
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
    setOriginalResultUrl(null);
    setUploadedImageUrl(null);
    setSelectedMethod(null);
    setProcessingState("idle");
    setUpscaledImageUrl(null);
    setErrorMessage("");
    setFallbackUsed(false);
    setFallbackReason(null);
    setStrategy(null);
  };

  const isLoading =
    processingState === "processing" || processingState === "uploading";

  const refineStatus =
    progress >= 100
      ? "complete"
      : progress >= 65
        ? "refining"
        : progress >= 20
          ? "generating"
          : "queued";

  return (
    <>
      {/* CRTWarp background overlay that fades in/out during loading */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
          isLoading ? "opacity-80" : "opacity-0"
        }`}
      >
        <CRTWarp
          color="#c755f7"
          backgroundColor="transparent"
          mask="aperture"
          curvature={0.25}
          persistence={0.4}
          paused={!isLoading}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-4xl flex-col justify-center px-4 py-8">
        <div className="w-full space-y-6">
          {processingState === "complete" && upscaledImageUrl ? (
            <ResultsDisplay
              originalImageUrl={originalResultUrl || previewDataUrl || ""}
              upscaledImageUrl={upscaledImageUrl || ""}
              method={selectedMethod || "local"}
              scale={selectedScale}
              onReset={handleReset}
              fallbackUsed={fallbackUsed}
              fallbackReason={fallbackReason || undefined}
              strategy={strategy || undefined}
            />
          ) : (
            <>
              <div
                className={
                  selectedFile && previewDataUrl && !isLoading
                    ? "grid items-start gap-5 md:grid-cols-[1fr_260px]"
                    : "w-full"
                }
              >
                <div className="relative min-w-0">
                  {isLoading && previewDataUrl ? (
                    <div className="flex justify-center">
                      <RefineFrame
                        status={refineStatus}
                        aspectRatio="16 / 10"
                        width={896}
                        radius={20}
                        background="#1a1625"
                        color="#f5f5f5"
                        stageDuration={450}
                        sweep
                        showStatus
                        hideAfter={0}
                        labels={{
                          queued: `Queued ${progress}%`,
                          generating: `Upscaling ${progress}%`,
                          refining: `Refining ${progress}%`,
                          complete: "Ready 100%",
                        }}
                        className="w-full shadow-elevated"
                      >
                        <img
                          src={previewDataUrl}
                          alt="Upscaling preview"
                          className="h-full w-full object-contain"
                        />
                      </RefineFrame>
                    </div>
                  ) : (
                    <ImageUploader
                      onImageSelected={handleImageSelected}
                      disabled={isLoading}
                      selectedFile={selectedFile}
                    />
                  )}
                </div>

                {selectedFile &&
                  previewDataUrl &&
                  (processingState === "idle" ||
                    processingState === "error") && (
                    <div className="w-full">
                      <MethodSelector
                        onMethodSelected={handleMethodSelected}
                        disabled={false}
                        file={selectedFile}
                        onProcessingStateChange={setProcessingState}
                        onProgressChange={setProgress}
                        onProcessingComplete={handleProcessingComplete}
                        onError={handleError}
                      />
                    </div>
                  )}
              </div>

              {processingState === "error" && errorMessage && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center">
                  <p className="text-destructive">{errorMessage}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Dashboard;
