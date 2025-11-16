import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  useAuth(); // invoke to ensure auth state (not directly used here now)
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setPreview(result);
          onImageSelected(file, result);
        };
        reader.readAsDataURL(file);
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
    <Card className="overflow-hidden border-border bg-card shadow-soft">
      <div className="bg-gradient-card p-6">
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Upload Image
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload an image to upscale to HD quality
        </p>
      </div>

      <div className="p-6">
        {!preview ? (
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="mb-2 text-lg font-medium text-foreground">
                {isDragActive
                  ? "Drop your image here"
                  : "Drag & drop your image"}
              </p>
              <p className="mb-4 text-sm text-muted-foreground">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG, or WEBP
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-border">
              <img
                src={preview}
                alt="Preview"
                className="h-auto w-full object-contain"
                style={{ maxHeight: "400px" }}
              />
              {!disabled && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full shadow-medium"
                  onClick={handleRemove}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate text-sm text-foreground">
                {selectedFile?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                MB
              </span>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Enhanced image will be uploaded after processing.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
