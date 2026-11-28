import { ChevronLeft, ChevronRight, Maximize, Minus, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { mediaInfo } from '../data/project';

export interface LightboxItem {
  src: string;
  caption: string;
  note?: string;
  kind?: 'photo' | 'plan';
}

let current: { items: LightboxItem[]; index: number } | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function openLightbox(items: LightboxItem[], index = 0) {
  current = { items, index };
  emit();
}
const close = () => {
  current = null;
  emit();
};
const go = (d: number) => {
  if (!current) return;
  const n = current.items.length;
  current = { ...current, index: (current.index + d + n) % n };
  emit();
};

/** Full-screen viewer for the original brochure images and plans: keyboard, swipe, zoom & pan. */
export function LightboxHost() {
  const state = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => current,
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    reset();
  }, [state?.index, reset]);

  useEffect(() => {
    if (!state) return;
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, z * 1.4));
      if (e.key === '-') setZoom((z) => Math.max(1, z / 1.4));
    };
    window.addEventListener('keydown', onKey, true);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.documentElement.style.overflow = '';
      prev?.focus?.();
    };
  }, [state]);

  if (!state) return null;
  const item = state.items[state.index];
  const m = mediaInfo(item.src);
  const many = state.items.length > 1;

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (zoom > 1) setPan({ x: d.px + dx, y: d.py + dy });
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (zoom === 1 && many && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    else if (!d.moved) setZoom((z) => (z > 1 ? 1 : 2.2));
    if (zoom === 1) setPan({ x: 0, y: 0 });
  };

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.caption} data-testid="lightbox">
      <div className="lightbox-top">
        <span className="count">{many ? `${state.index + 1} / ${state.items.length}` : item.kind === 'plan' ? 'Original plan' : 'Original image'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={() => setZoom((z) => Math.max(1, z / 1.4))} aria-label="Zoom out" disabled={zoom <= 1}>
            <Minus />
          </button>
          <button className="icon-btn" onClick={() => setZoom((z) => Math.min(4, z * 1.4))} aria-label="Zoom in">
            <Plus />
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              // optional: some browsers and embedded viewers refuse full screen
              const req = document.fullscreenElement ? document.exitFullscreen() : stageRef.current?.parentElement?.requestFullscreen?.();
              req?.catch?.(() => undefined);
            }}
            aria-label="Toggle full screen"
          >
            <Maximize />
          </button>
          <button ref={closeBtn} className="icon-btn" onClick={close} aria-label="Close viewer" data-testid="lightbox-close">
            <X />
          </button>
        </div>
      </div>
      <div ref={stageRef} className={`lightbox-stage${item.kind === 'plan' ? ' plan' : ''}`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => (drag.current = null)}>
        {m && (
          <img
            key={item.src}
            src={m.large ?? m.src}
            alt={item.caption}
            draggable={false}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: drag.current ? 'none' : 'transform .5s cubic-bezier(.22,1,.36,1)', cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
          />
        )}
        {many && (
          <>
            <button className="icon-btn lightbox-nav prev" onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft />
            </button>
            <button className="icon-btn lightbox-nav next" onClick={() => go(1)} aria-label="Next image">
              <ChevronRight />
            </button>
          </>
        )}
      </div>
      <div className="lightbox-cap">
        <div>
          <b>{item.caption}</b>
          {item.note && <span>{item.note}</span>}
        </div>
        <span>Original brochure asset · not altered</span>
      </div>
    </div>
  );
}
