"use client";

import dynamic from "next/dynamic";
import type { SpModelData } from "./types";

// WebGL viewer is client-only.
const SpModelViewer = dynamic(() => import("./SpModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0b0b0c]">
      <p className="text-[10px] uppercase tracking-editorial text-warm/50">Loading 3D model…</p>
    </div>
  ),
});

export default function SpModelExperience({ data }: { data: SpModelData }) {
  return <SpModelViewer data={data} />;
}
