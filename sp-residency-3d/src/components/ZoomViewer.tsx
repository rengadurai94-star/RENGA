import { Maximize2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Pan & zoom container for plans. Drag to pan, pinch / ctrl+wheel / buttons / double-click to zoom.
 * A drag never triggers a click on the plan underneath.
 */
export default function ZoomViewer({ contentW, contentH, children, label, badge }: { contentW: number; contentH: number; children: ReactNode; label: string; badge?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState({ w: 800, h: 600 });
  const [z, setZ] = useState(1);
  const [t, setT] = useState({ x: 0, y: 0 });
  const [grab, setGrab] = useState(false);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number; d: number; moved: number }>({ x: 0, y: 0, d: 0, moved: 0 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const base = Math.min(vp.w / contentW, vp.h / contentH) * 0.94;
  const reset = useCallback(() => {
    setZ(1);
    setT({ x: 0, y: 0 });
  }, []);
  useEffect(reset, [contentW, contentH, reset]);

  const live = useRef({ z: 1, t: { x: 0, y: 0 } });
  live.current = { z, t };
  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const { z: oz, t: ot } = live.current;
      const nz = Math.min(5, Math.max(1, oz * factor));
      if (nz === 1) {
        setZ(1);
        setT({ x: 0, y: 0 });
        return;
      }
      const s0 = base * oz;
      const s1 = base * nz;
      const px = cx ?? vp.w / 2;
      const py = cy ?? vp.h / 2;
      // keep the content point under (px, py) fixed while zooming
      const ox0 = (vp.w - contentW * s0) / 2 + ot.x;
      const oy0 = (vp.h - contentH * s0) / 2 + ot.y;
      const qx = (px - ox0) / s0;
      const qy = (py - oy0) / s0;
      const ox1 = (vp.w - contentW * s1) / 2;
      const oy1 = (vp.h - contentH * s1) / 2;
      setZ(nz);
      setT({ x: px - qx * s1 - ox1, y: py - qy * s1 - oy1 });
    },
    [vp, base, contentW, contentH],
  );

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.003), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [zoomAt]);

  const scale = base * z;
  const ox = (vp.w - contentW * scale) / 2;
  const oy = (vp.h - contentH * scale) / 2;
  // keep translation in a sensible range
  const lim = (v: number, size: number, view: number) => {
    const m = Math.max(0, (size * scale - view) / 2 + 40);
    return Math.max(-m, Math.min(m, v));
  };
  const tx = z === 1 ? 0 : lim(t.x, contentW, vp.w);
  const ty = z === 1 ? 0 : lim(t.y, contentH, vp.h);

  return (
    <div
      ref={box}
      className={`viewer${grab ? ' grabbing' : ''}`}
      role="region"
      aria-label={`${label} - zoomable viewer`}
      onPointerDown={(e) => {
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        last.current = { x: e.clientX, y: e.clientY, d: 0, moved: 0 };
        if (pts.current.size === 2) {
          const [a, b] = [...pts.current.values()];
          last.current.d = Math.hypot(a.x - b.x, a.y - b.y);
        }
      }}
      onPointerMove={(e) => {
        if (!pts.current.has(e.pointerId)) return;
        pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.current.size === 2) {
          const [a, b] = [...pts.current.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (last.current.d) zoomAt(d / last.current.d);
          last.current.d = d;
          last.current.moved += 10;
          return;
        }
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        last.current.x = e.clientX;
        last.current.y = e.clientY;
        last.current.moved += Math.abs(dx) + Math.abs(dy);
        if (z > 1 && last.current.moved > 4) {
          setGrab(true);
          setT((o) => ({ x: o.x + dx, y: o.y + dy }));
        }
      }}
      onPointerUp={(e) => {
        pts.current.delete(e.pointerId);
        setGrab(false);
      }}
      onPointerCancel={(e) => {
        pts.current.delete(e.pointerId);
        setGrab(false);
      }}
      onClickCapture={(e) => {
        if (last.current.moved > 6) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onDoubleClick={(e) => {
        const r = box.current!.getBoundingClientRect();
        if (z > 1) reset();
        else zoomAt(2.2, e.clientX - r.left, e.clientY - r.top);
      }}
    >
      <div className="compass" aria-label="North is up">
        <i />N
      </div>
      <div className="viewer-tools">
        <button className="icon-btn" onClick={() => zoomAt(1.4)} aria-label="Zoom in">
          <Plus />
        </button>
        <button className="icon-btn" onClick={() => zoomAt(1 / 1.4)} aria-label="Zoom out" disabled={z <= 1}>
          <Minus />
        </button>
        <button className="icon-btn" onClick={reset} aria-label="Fit to view">
          <Maximize2 />
        </button>
      </div>
      <div className="viewer-content" style={{ width: contentW, height: contentH, transform: `translate(${ox + tx}px, ${oy + ty}px) scale(${scale})`, transition: grab ? 'none' : 'transform .45s cubic-bezier(.22,1,.36,1)' }}>
        {children}
      </div>
      {badge && <div className="viewer-badge">{badge}</div>}
    </div>
  );
}
