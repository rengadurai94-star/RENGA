"use client";

import { useEffect, useState } from "react";
import type { Colour } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const urlCache = new Map<string, string>();

/**
 * 2D swatch rendered from the exact procedural texture used on the 3D models,
 * so the chip and the cabinet always match.
 */
export function Swatch({ colour, className }: { colour: Pick<Colour, "hex" | "pattern" | "code">; className?: string }) {
  const key = `${colour.pattern}:${colour.hex}:${colour.code}`;
  const [url, setUrl] = useState<string | null>(() => urlCache.get(key) ?? null);

  useEffect(() => {
    if (colour.pattern === "solid" || urlCache.has(key)) return;
    let cancelled = false;
    import("@/components/three/textures").then(({ woodTexture, stoneTexture }) => {
      const tex =
        colour.pattern === "wood"
          ? woodTexture(colour.hex, colour.code.charCodeAt(3))
          : stoneTexture(colour.hex, colour.hex === "#4a4946" ? "#77756f" : "#a8a6a0");
      const src = (tex.image as HTMLCanvasElement).toDataURL("image/jpeg", 0.85);
      urlCache.set(key, src);
      if (!cancelled) setUrl(src);
    });
    return () => {
      cancelled = true;
    };
  }, [key, colour.pattern, colour.hex, colour.code]);

  return (
    <span
      className={cn("block bg-cover bg-center", className)}
      style={{ backgroundColor: colour.hex, backgroundImage: url ? `url(${url})` : undefined }}
    />
  );
}
