import { useCallback, useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

interface ImageCompareSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  magnifyMode?: boolean;
}

const ZOOM = 3;
const LOUPE_SIZE = 180;

export const ImageCompareSlider = ({
  beforeUrl,
  afterUrl,
  beforeLabel = "Before",
  afterLabel = "After (4x)",
  magnifyMode = false,
}: ImageCompareSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const afterImgRef = useRef<HTMLImageElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [loupe, setLoupe] = useState<{
    visible: boolean;
    x: number;
    y: number;
    imgLeft: number;
    imgTop: number;
    imgWidth: number;
    imgHeight: number;
    containerX: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    imgLeft: 0,
    imgTop: 0,
    imgWidth: 0,
    imgHeight: 0,
    containerX: 0,
  });

  // Subtle initial sweep animation when entering slider mode
  useEffect(() => {
    if (magnifyMode) return;
    setPosition(35);
    const t = setTimeout(() => setPosition(50), 80);
    return () => clearTimeout(t);
  }, [magnifyMode, beforeUrl, afterUrl]);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  const updateLoupe = useCallback(
    (clientX: number, clientY: number) => {
      if (!magnifyMode) return;
      const container = containerRef.current;
      const img = afterImgRef.current;
      if (!container || !img) return;
      const cRect = container.getBoundingClientRect();
      const iRect = img.getBoundingClientRect();
      if (iRect.width <= 0 || iRect.height <= 0) return;

      setLoupe({
        visible: true,
        x: clientX - cRect.left,
        y: clientY - cRect.top,
        imgLeft: iRect.left - cRect.left,
        imgTop: iRect.top - cRect.top,
        imgWidth: iRect.width,
        imgHeight: iRect.height,
        containerX: cRect.width * (position / 100),
      });
    },
    [magnifyMode, position]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!magnifyMode) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      updatePosition(e.clientX);
    }
    updateLoupe(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging && !magnifyMode) {
      updatePosition(e.clientX);
    }
    if (magnifyMode) {
      updateLoupe(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    setLoupe((prev) => ({ ...prev, visible: false }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      setPosition((p) => Math.max(0, p - 2));
    } else if (e.key === "ArrowRight") {
      setPosition((p) => Math.min(100, p + 2));
    }
  };

  const halfLoupe = LOUPE_SIZE / 2;
  const relImgX = loupe.x - loupe.imgLeft;
  const relImgY = loupe.y - loupe.imgTop;
  const sliderInLoupePx = halfLoupe;
  const beforeClipRightPct = 50;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label="Before and after image comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        className={`group relative mx-auto flex max-h-[500px] w-full select-none items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 touch-none focus:outline-none focus:ring-2 focus:ring-ring ${
          magnifyMode ? "cursor-crosshair" : "cursor-ew-resize"
        }`}
      >
        {/* After image (full width base) */}
        <img
          ref={afterImgRef}
          src={afterUrl}
          alt={afterLabel}
          draggable={false}
          className="block max-h-[500px] w-full object-contain pointer-events-none"
        />

        {/* Before image (clipped by slider position in slider mode) */}
        {!magnifyMode && (
          <div
            className={`absolute inset-0 overflow-hidden pointer-events-none ${
              !isDragging ? "transition-[clip-path] duration-300 ease-out" : ""
            }`}
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <img
              src={beforeUrl}
              alt={beforeLabel}
              draggable={false}
              className="block max-h-[500px] w-full h-full object-contain"
            />
          </div>
        )}

        {/* Labels */}
        {!magnifyMode && (
          <>
            <span
              className={`pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm transition-opacity duration-150 ${
                position < 18 ? "opacity-0" : "opacity-100"
              }`}
            >
              {beforeLabel}
            </span>
            <span
              className={`pointer-events-none absolute right-3 top-3 rounded-md border border-border bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm transition-opacity duration-150 ${
                position > 82 ? "opacity-0" : "opacity-100"
              }`}
            >
              {afterLabel}
            </span>

            {/* Divider line & animated handle */}
            <div
              className={`pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.45)] ${
                !isDragging ? "transition-[left] duration-300 ease-out" : ""
              }`}
              style={{ left: `${position}%` }}
            >
              <div
                className={`absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-background/80 text-white shadow-lg backdrop-blur-md transition-transform duration-150 ${
                  isDragging
                    ? "scale-110 shadow-[0_0_16px_rgba(167,139,250,0.65)]"
                    : "group-hover:scale-105"
                }`}
              >
                <MoveHorizontal className="h-4 w-4 text-white" />
              </div>
            </div>
          </>
        )}

        {/* Magnifying glass square loupe (positioned under the cursor) */}
        {magnifyMode && loupe.visible && (
          <>
            <div
              className="pointer-events-none absolute z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-primary/80 shadow"
              style={{ left: loupe.x, top: loupe.y }}
            />
            <div
              className="pointer-events-none absolute z-30 overflow-hidden rounded-xl border-2 border-white/80 bg-background shadow-2xl"
              style={{
                width: LOUPE_SIZE,
                height: LOUPE_SIZE,
                left: Math.max(
                  8,
                  Math.min(
                    (containerRef.current?.clientWidth || LOUPE_SIZE) -
                      LOUPE_SIZE -
                      8,
                    loupe.x - halfLoupe
                  )
                ),
                top:
                  loupe.y + 20 + LOUPE_SIZE >
                  (containerRef.current?.clientHeight || 500)
                    ? Math.max(8, loupe.y - LOUPE_SIZE - 20)
                    : loupe.y + 20,
              }}
            >
              {/* Zoomed After */}
              <img
                src={afterUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: loupe.imgWidth * ZOOM,
                  height: loupe.imgHeight * ZOOM,
                  left: halfLoupe - relImgX * ZOOM,
                  top: halfLoupe - relImgY * ZOOM,
                }}
              />
              {/* Zoomed Before (left half) */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${beforeClipRightPct}% 0 0)` }}
              >
                <img
                  src={beforeUrl}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute max-w-none"
                  style={{
                    width: loupe.imgWidth * ZOOM,
                    height: loupe.imgHeight * ZOOM,
                    left: halfLoupe - relImgX * ZOOM,
                    top: halfLoupe - relImgY * ZOOM,
                  }}
                />
              </div>
              {/* White line of separation between Before and After */}
              <div
                className="pointer-events-none absolute inset-y-0 w-[2px] bg-white shadow-[0_0_6px_rgba(0,0,0,0.75)]"
                style={{ left: sliderInLoupePx - 1 }}
              />
              <span className="absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                Before
              </span>
              <span className="absolute right-2 top-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                After
              </span>
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                {ZOOM}x
              </span>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {magnifyMode
          ? "Move cursor over the image to compare Before (left) and After (right) at 3x"
          : "Drag the slider to compare before and after"}
      </p>
    </div>
  );
};
