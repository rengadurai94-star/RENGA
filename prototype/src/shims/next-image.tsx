import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string | { src: string };
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  preload?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
};

/**
 * Prototype stand-in for next/image: a plain <img> with a RELATIVE src, so the build works from
 * any folder or host. The WebP files are already optimised by sp-residency/scripts/build_web_assets.py.
 */
export default function Image({
  src,
  alt = "",
  width,
  height,
  fill,
  sizes,
  preload,
  priority,
  quality,
  placeholder,
  blurDataURL,
  style,
  ...rest
}: Props) {
  void quality;
  void placeholder;
  void blurDataURL;
  const raw = typeof src === "string" ? src : src.src;
  const url = raw.startsWith("/") ? raw.slice(1) : raw;
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : style;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      loading={preload || priority ? "eager" : "lazy"}
      decoding="async"
      style={fillStyle}
      {...rest}
    />
  );
}
