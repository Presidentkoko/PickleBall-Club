"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function VectorMark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className="shrink-0 drop-shadow-sm"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14" className="fill-primary" />
      <circle cx="16" cy="8.5" r="1.7" className="fill-background" />
      <circle cx="10.5" cy="12.5" r="1.7" className="fill-background" />
      <circle cx="21.5" cy="12.5" r="1.7" className="fill-background" />
      <circle cx="12.5" cy="18.5" r="1.7" className="fill-background" />
      <circle cx="19.5" cy="18.5" r="1.7" className="fill-background" />
      <circle cx="16" cy="23.5" r="1.5" className="fill-background" />
    </svg>
  );
}

/**
 * SVPC brand lockup. Uses /logo.png if present; otherwise falls back to a
 * vector pickleball mark so the UI never shows a broken image.
 */
export function Logo({
  className,
  showWordmark = true,
  size = 36,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="San Vicente Pickleball Club"
          width={size}
          height={size}
          className="shrink-0 rounded-full object-contain"
          onError={() => setImgOk(false)}
        />
      ) : (
        <VectorMark size={size} />
      )}
      {showWordmark && (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">San Vicente</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pickleball Club
          </span>
        </span>
      )}
    </span>
  );
}
