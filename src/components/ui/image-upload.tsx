"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  className,
  aspect = "video",
  label = "Click to upload an image",
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  className?: string;
  aspect?: "square" | "video";
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-video";

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setLoading(true);
    try {
      onChange(await fileToDataUrl(file));
    } catch {
      toast.error("Could not read that file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className={cn("relative overflow-hidden rounded-lg border", aspectClass)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Remove image"
            className="absolute top-2 right-2 rounded-full bg-background/80 p-1 shadow ring-1 ring-border backdrop-blur transition-colors hover:bg-background"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50",
            aspectClass,
          )}
        >
          <Upload className="size-6" />
          {loading ? "Loading…" : label}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
