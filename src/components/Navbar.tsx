import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import GlassSurface from "./GlassSurface";

export const Navbar = () => {
  const location = useLocation();
  const upscaleRef = useRef<HTMLAnchorElement>(null);
  const imagesRef = useRef<HTMLAnchorElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 4,
    width: 0,
  });

  const isImages =
    location.pathname === "/images" || location.pathname === "/my-images";

  useEffect(() => {
    const target = isImages ? imagesRef.current : upscaleRef.current;
    if (!target) return;
    setPillStyle({
      left: target.offsetLeft,
      width: target.offsetWidth,
    });
  }, [isImages]);

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-4xl px-4">
      <GlassSurface
        width="100%"
        height={64}
        borderRadius={24}
        backgroundOpacity={0.04}
        displace={0.5}
        distortionScale={-160}
        className="w-full px-3"
      >
        <nav className="flex w-full items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Pixelup"
              className="h-9 w-9 object-contain"
            />
            <span className="text-lg font-bold tracking-wider text-foreground">
              Pixelup
            </span>
          </Link>

          <div className="relative flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1 backdrop-blur-md">
            {/* Sliding liquid glass active pill */}
            {pillStyle.width > 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-1 rounded-lg border border-white/25 bg-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_14px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 ease-out"
                style={{
                  left: pillStyle.left,
                  width: pillStyle.width,
                }}
              />
            )}

            <Link
              ref={upscaleRef}
              to="/"
              className="relative z-10 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4 text-white" />
              Upscale
            </Link>
            <Link
              ref={imagesRef}
              to="/images"
              className="relative z-10 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
            >
              <ImageIcon className="h-4 w-4 text-white" />
              My Images
            </Link>
          </div>
        </nav>
      </GlassSurface>
    </header>
  );
};
