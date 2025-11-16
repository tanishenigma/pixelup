import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { UpscaleMethod, ProcessingState } from "@/pages/Dashboard";

interface ProcessingStatusProps {
  state: ProcessingState;
  method: UpscaleMethod;
}

export const ProcessingStatus = ({ state, method }: ProcessingStatusProps) => {
  const getStatusMessage = () => {
    if (state === "uploading") {
      return "Uploading image...";
    }
    if (state === "processing") {
      return "Processing with RealESRGAN (4x upscaling)...";
    }
    return "Processing...";
  };

  return (
    <Card className="border-border bg-card p-8 text-center shadow-soft">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">
        {getStatusMessage()}
      </h3>
      <p className="text-sm text-muted-foreground">
        This may take a few moments. Please don't close this page.
      </p>
    </Card>
  );
};
