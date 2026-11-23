/**
 * Small geometry "builder": collects primitives into per-material buckets and
 * merges them into a handful of BufferGeometries. This keeps draw calls low
 * (one mesh per material) even for fully furnished interiors.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { MatKey } from "./materials";

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const tmpP = new THREE.Vector3();
const Y = new THREE.Vector3(0, 1, 0);

// Shared unit primitives (cloned + transformed on add).
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const cylCache = new Map<string, THREE.BufferGeometry>();
const roundCache = new Map<string, THREE.BufferGeometry>();

export type Buckets = Map<MatKey, THREE.BufferGeometry>;

export class Builder {
  private parts = new Map<MatKey, THREE.BufferGeometry[]>();
  private stack: THREE.Matrix4[] = [new THREE.Matrix4()];

  get matrix() {
    return this.stack[this.stack.length - 1];
  }

  /** Run `fn` inside a local frame translated to (x, y, z) and rotated about Y. */
  frame(x: number, y: number, z: number, rotY: number, fn: () => void) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromAxisAngle(Y, rotY),
      new THREE.Vector3(1, 1, 1),
    );
    this.stack.push(this.matrix.clone().multiply(m));
    try {
      fn();
    } finally {
      this.stack.pop();
    }
  }

  add(mat: MatKey, geo: THREE.BufferGeometry, local: THREE.Matrix4) {
    const g = geo.clone();
    g.applyMatrix4(this.matrix.clone().multiply(local));
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat)!.push(g);
  }

  /** Box by centre and size. */
  box(mat: MatKey, w: number, h: number, d: number, x: number, y: number, z: number, rotY = 0) {
    if (w <= 0.001 || h <= 0.001 || d <= 0.001) return;
    tmpM.compose(tmpP.set(x, y, z), tmpQ.setFromAxisAngle(Y, rotY), tmpS.set(w, h, d));
    this.add(mat, unitBox, tmpM);
  }

  /** Box by min/max corners. */
  boxMinMax(mat: MatKey, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    const [ax, bx] = x0 < x1 ? [x0, x1] : [x1, x0];
    const [ay, by] = y0 < y1 ? [y0, y1] : [y1, y0];
    const [az, bz] = z0 < z1 ? [z0, z1] : [z1, z0];
    this.box(mat, bx - ax, by - ay, bz - az, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  }

  cyl(mat: MatKey, rTop: number, rBottom: number, h: number, x: number, y: number, z: number, seg = 18) {
    const k = `${rTop}:${rBottom}:${seg}`;
    if (!cylCache.has(k)) cylCache.set(k, new THREE.CylinderGeometry(rTop, rBottom, 1, seg));
    tmpM.compose(tmpP.set(x, y, z), tmpQ.identity(), tmpS.set(1, h, 1));
    this.add(mat, cylCache.get(k)!, tmpM);
  }

  /** Horizontal cylinder along local X (rotY rotates it). */
  cylX(mat: MatKey, r: number, len: number, x: number, y: number, z: number, rotY = 0, seg = 16) {
    const k = `${r}:${r}:${seg}`;
    if (!cylCache.has(k)) cylCache.set(k, new THREE.CylinderGeometry(r, r, 1, seg));
    const q = new THREE.Quaternion()
      .setFromAxisAngle(Y, rotY)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2));
    tmpM.compose(tmpP.set(x, y, z), q, tmpS.set(1, len, 1));
    this.add(mat, cylCache.get(k)!, tmpM);
  }

  sphere(mat: MatKey, r: number, x: number, y: number, z: number, sy = 1, seg = 14) {
    const k = `s:${seg}`;
    if (!cylCache.has(k)) cylCache.set(k, new THREE.SphereGeometry(1, seg, Math.max(8, Math.round(seg * 0.7))));
    tmpM.compose(tmpP.set(x, y, z), tmpQ.identity(), tmpS.set(r, r * sy, r));
    this.add(mat, cylCache.get(k)!, tmpM);
  }

  /** Rounded box (cushions, mattresses, upholstered pieces). */
  rounded(mat: MatKey, w: number, h: number, d: number, r: number, x: number, y: number, z: number, rotY = 0) {
    const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const k = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${rr.toFixed(3)}`;
    if (!roundCache.has(k)) {
      const g = new RoundedBoxGeometry(w, h, d, 2, rr);
      roundCache.set(k, g);
    }
    tmpM.compose(tmpP.set(x, y, z), tmpQ.setFromAxisAngle(Y, rotY), tmpS.set(1, 1, 1));
    this.add(mat, roundCache.get(k)!, tmpM);
  }

  /** Thin horizontal plane (as a very thin box) — floors, rugs. */
  slab(mat: MatKey, x0: number, z0: number, x1: number, z1: number, y: number, t = 0.01) {
    this.boxMinMax(mat, x0, y - t, z0, x1, y, z1);
  }

  /** Plan-space AABB [x0, z0, x1, z1] of a rectangle given in the current frame. */
  footprint(u0: number, v0: number, u1: number, v1: number): [number, number, number, number] {
    const pts = [
      [u0, v0],
      [u1, v0],
      [u0, v1],
      [u1, v1],
    ].map(([u, v]) => new THREE.Vector3(u, 0, v).applyMatrix4(this.matrix));
    return [
      Math.min(...pts.map((p) => p.x)),
      Math.min(...pts.map((p) => p.z)),
      Math.max(...pts.map((p) => p.x)),
      Math.max(...pts.map((p) => p.z)),
    ];
  }

  /** Inverse-transform a plan point into the current frame (u, v). */
  toLocal(x: number, z: number): [number, number] {
    const p = new THREE.Vector3(x, 0, z).applyMatrix4(this.matrix.clone().invert());
    return [p.x, p.z];
  }

  isEmpty() {
    return this.parts.size === 0;
  }

  /** Merge into one geometry per material, with world-scale UVs. */
  build(uvScale: Partial<Record<MatKey, number>> = {}): Buckets {
    const out: Buckets = new Map();
    for (const [mat, list] of this.parts) {
      const normalized = list.map((g) => (g.index ? g.toNonIndexed() : g));
      for (const g of normalized) {
        for (const name of Object.keys(g.attributes)) {
          if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
        }
        if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
      }
      const merged = mergeGeometries(normalized, false);
      if (!merged) continue;
      boxProjectUV(merged, uvScale[mat] ?? 1);
      merged.computeBoundingSphere();
      merged.computeBoundingBox();
      out.set(mat, merged);
      for (const g of normalized) g.dispose();
    }
    this.parts.clear();
    return out;
  }
}

/** Planar UVs chosen by the dominant normal axis, in world units / scale. */
export function boxProjectUV(geo: THREE.BufferGeometry, scale: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, x / scale, z / scale);
    else if (nx >= nz) uv.setXY(i, z / scale, y / scale);
    else uv.setXY(i, x / scale, y / scale);
  }
  uv.needsUpdate = true;
}

export function disposeBuckets(b: Buckets) {
  for (const g of b.values()) g.dispose();
}
