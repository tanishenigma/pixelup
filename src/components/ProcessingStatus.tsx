import { Loader2 } from "lucide-react";
import type { UpscaleMethod, ProcessingState } from "@/pages/Dashboard";
import GlassSurface from "./GlassSurface";

interface ProcessingStatusProps {
  state: ProcessingState;
  method: UpscaleMethod;
  progress?: number;
}

export const ProcessingStatus = ({ progress = 0 }: ProcessingStatusProps) => {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={20}
      refraction={false}
      backgroundOpacity={0.22}
      className="w-full"
    >
      <div className="w-full px-6 py-5 text-center">
        <div className="mx-auto mb-3 flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {pct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </GlassSurface>
  );
};
