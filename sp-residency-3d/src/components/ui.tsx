import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { mediaInfo } from '../data/project';

/** Fades/slides children in when they enter the viewport. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div', style }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li' | 'figure'; style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('in');
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`reveal ${className}`} style={{ ...style, ['--d' as string]: `${delay}s` }}>
      {children}
    </Tag>
  );
}

/** Original brochure image, responsive, lazy-loaded, never upscaled. */
export function Img({ src, alt, sizes = '(max-width: 900px) 100vw, 50vw', className, eager = false, style }: { src: string | null | undefined; alt: string; sizes?: string; className?: string; eager?: boolean; style?: CSSProperties }) {
  const m = mediaInfo(src);
  if (!m) return null;
  return (
    <img
      src={m.src}
      srcSet={m.srcSet}
      sizes={sizes}
      width={m.width}
      height={m.height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={style}
    />
  );
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="source-note">{children}</p>;
}
