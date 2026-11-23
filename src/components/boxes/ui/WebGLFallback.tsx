"use client";

import { project } from "@/config/project";
import { useBoxes } from "@/lib/boxes/store";
import { scrollToSelector } from "@/lib/boxes/scroll";

/** Shown when WebGL is unavailable or the 3D scene failed to start. */
export default function WebGLFallback() {
  const webgl = useBoxes((s) => s.webgl);
  const message = useBoxes((s) => s.errorMessage);
  if (webgl !== "unsupported" && webgl !== "error") return null;
  return (
    <div className="fixed inset-0 z-[45] flex items-center justify-center bg-paper px-6" role="alert">
      <div className="max-w-lg text-center">
        <p className="font-sans text-2xl font-light tracking-brand">{project.name}</p>
        <h2 className="mt-6 font-display text-4xl font-light text-charcoal">The 3D experience couldn&apos;t start on this device.</h2>
        <p className="mt-4 text-sm leading-relaxed text-ash">
          {webgl === "unsupported"
            ? "Your browser or device doesn't support WebGL, which the interactive tower needs. Try a recent version of Chrome, Edge, Safari or Firefox with hardware acceleration enabled."
            : "Something went wrong while rendering the 3D scene. Reloading usually fixes it."}
        </p>
        {message && <p className="mt-2 font-mono text-[11px] text-taupe">{message}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              useBoxes.setState({ webgl: "unsupported" });
              document.documentElement.classList.remove("boxes-locked");
              scrollToSelector("#overview");
            }}
          >
            View project details
          </button>
        </div>
      </div>
    </div>
  );
}
