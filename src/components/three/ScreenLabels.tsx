"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 3D-anchored DOM labels without drei <Html>.
 *
 * drei's <Html> mounts a separate React root per label, and unmounting those
 * roots during a route change throws under React 19. Here the labels are
 * ordinary elements in the page's own React tree (<LabelOverlay>, rendered
 * next to the <Canvas>); <LabelProjector>, inside the Canvas, only moves them
 * each frame.
 */
export interface ScreenLabel {
  id: string;
  /** World position in metres. */
  position: THREE.Vector3Tuple;
  visible?: boolean;
  /** "center" centres the label on the point; "left" puts the point at its left edge. */
  anchor?: "center" | "left";
  content: ReactNode;
}

export function LabelOverlay({ labels, overlayRef }: { labels: ScreenLabel[]; overlayRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={overlayRef} aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {labels.map((l) => (
        <div
          key={l.id}
          data-label={l.id}
          className="absolute left-0 top-0 will-change-transform"
          style={{ display: l.visible === false ? "none" : undefined, visibility: "hidden" }}
        >
          {l.content}
        </div>
      ))}
    </div>
  );
}

export function LabelProjector({
  labels,
  overlayRef,
}: {
  labels: Pick<ScreenLabel, "id" | "position" | "anchor">[];
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  const v = useRef(new THREE.Vector3());
  useFrame(({ camera, size }) => {
    const root = overlayRef.current;
    if (!root) return;
    for (const l of labels) {
      const el = root.querySelector<HTMLElement>(`[data-label="${l.id}"]`);
      if (!el) continue;
      const p = v.current.fromArray(l.position).project(camera);
      const behind = p.z > 1;
      const x = ((p.x + 1) / 2) * size.width;
      const y = ((1 - p.y) / 2) * size.height;
      const shift = l.anchor === "left" ? "translate(-6px,-50%)" : "translate(-50%,-50%)";
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) ${shift}`;
      el.style.visibility = behind ? "hidden" : "visible";
    }
  });
  return null;
}
