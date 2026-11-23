"use client";

import { Component, Suspense, useEffect, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Optional GLB/GLTF architectural model (exported from SketchUp, Revit or
 * Blender). Renders `fallback` (the procedural geometry) while loading and
 * whenever the file is missing or fails to parse.
 */
function GLB({ url, onLoaded }: { url: string; onLoaded?: (scene: THREE.Object3D) => void }) {
  const { scene } = useGLTF(url);
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    onLoaded?.(scene);
  }, [scene, onLoaded]);
  return <primitive object={scene} />;
}

class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode; url: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn(`[BOXES] Could not load model ${this.props.url} — using procedural geometry instead.`, error.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function ModelSlot({
  url,
  fallback,
  onLoaded,
}: {
  url: string | null | undefined;
  fallback: ReactNode;
  onLoaded?: (scene: THREE.Object3D) => void;
}) {
  if (!url) return <>{fallback}</>;
  return (
    <ModelBoundary fallback={fallback} url={url}>
      <Suspense fallback={fallback}>
        <GLB url={url} onLoaded={onLoaded} />
      </Suspense>
    </ModelBoundary>
  );
}
