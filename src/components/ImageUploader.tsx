import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import GlassSurface from "./GlassSurface";

interface ImageUploaderProps {
  onImageSelected: (file: File | null, preview?: string | null) => void;
  disabled?: boolean;
  selectedFile: File | null;
}

export const ImageUploader = ({
  onImageSelected,
  disabled,
  selectedFile,
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onImageSelected(file, objectUrl);
      }
    },
    [onImageSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
    disabled,
  });

  // Upload removed: processing will happen before upload and only enhanced image is stored.

  const handleRemove = () => {
    setPreview(null);
    onImageSelected(null, null);
  };

  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={20}
      refraction={false}
      backgroundOpacity={0.12}
      className="w-full"
    >
      <div className="w-full p-3 sm:p-4">
        {!preview ? (
          <div
            {...getRootProps()}
            className={`group cursor-pointer rounded-xl border border-dashed transition-all duration-200 ${
              isDragActive
                ? "border-primary bg-primary/15 shadow-[0_0_24px_rgba(167,139,250,0.25)]"
                : "border-white/15 bg-white/[0.02] hover:border-primary/70 hover:bg-primary/10 hover:shadow-[0_0_24px_rgba(167,139,250,0.2)]"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center px-6 py-16 sm:py-20">
              <div
                className={`mb-4 rounded-2xl border p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-colors duration-200 ${
                  isDragActive
                    ? "border-primary/60 bg-primary/20"
                    : "border-white/15 bg-white/10 group-hover:border-primary/50 group-hover:bg-primary/20"
                }`}
              >
                <Upload className="h-7 w-7 text-white" />
              </div>
              <p className="mb-1.5 text-base font-medium text-foreground sm:text-lg">
                {isDragActive
                  ? "Drop your image here"
                  : "Drop an image or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG, or WEBP
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-auto max-h-[420px] w-full object-contain"
              />
              {!disabled && (
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={handleRemove}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-white/35 hover:bg-black/75 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
              <ImageIcon className="h-4 w-4 shrink-0 text-white" />
              <span className="flex-1 truncate text-sm text-foreground">
                {selectedFile?.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                MB
              </span>
            </div>
          </div>
        )}
      </div>
    </GlassSurface>
  );
};
