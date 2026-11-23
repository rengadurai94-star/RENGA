"use client";

import * as THREE from "three";

/**
 * Procedural surface textures generated on a canvas — real, tileable wood
 * grain and stone veining without shipping image assets.
 */

const cache = new Map<string, THREE.Texture>();

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const size = 256;
  const grid = new Float32Array(size * size).map(() => rand());
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const at = (x: number, y: number) => grid[((y & (size - 1)) * size + (x & (size - 1))) | 0];
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x: number, y: number, octaves = 4) => {
    let v = 0;
    let amp = 0.5;
    let f = 1;
    for (let i = 0; i < octaves; i++) {
      v += amp * noise(x * f, y * f);
      f *= 2;
      amp *= 0.5;
    }
    return v;
  };
}

/** Parse #rrggbb as raw sRGB bytes (THREE.Color would linearise them). */
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function finalize(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Vertical wood grain tinted to `hex`. */
export function woodTexture(hex: string, seed = 7): THREE.Texture {
  const key = `wood:${hex}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const w = 256;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const fbm = makeNoise(seed);
  const [r, g, b] = hexToRgb(hex);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Mostly straight grain with gentle cathedral figure.
      const warp = fbm(x * 0.006, y * 0.0018, 3) * 5.5 + Math.sin(y * 0.004 + x * 0.002) * 0.8;
      const ring = Math.sin(x * 0.16 + warp);
      const band = Math.pow(ring * 0.5 + 0.5, 3);
      const streak = fbm(x * 0.5, y * 0.004, 2);
      const pore = fbm(x * 1.6, y * 0.08, 1) > 0.8 ? 0.05 : 0;
      const shade = 1.05 - band * 0.13 - streak * 0.1 - pore;
      const i = (y * w + x) * 4;
      img.data[i] = Math.min(255, r * shade);
      img.data[i + 1] = Math.min(255, g * shade);
      img.data[i + 2] = Math.min(255, b * shade);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = finalize(canvas);
  cache.set(key, tex);
  return tex;
}

/** Marble / quartz veining. */
export function stoneTexture(hex: string, veinHex: string, seed = 11): THREE.Texture {
  const key = `stone:${hex}:${veinHex}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const s = 512;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(s, s);
  const fbm = makeNoise(seed);
  const [r, g, b] = hexToRgb(hex);
  const [vr, vg, vb] = hexToRgb(veinHex);

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const n = fbm(x * 0.006, y * 0.006, 5);
      const v = Math.abs(Math.sin((x * 0.7 + y) * 0.012 + n * 9));
      const vein = Math.pow(1 - v, 14) * 0.85 + Math.pow(1 - v, 60) * 0.15;
      const speck = fbm(x * 0.4, y * 0.4, 1) * 0.06;
      const t = Math.min(1, vein);
      const i = (y * s + x) * 4;
      img.data[i] = r * (1 - t) + vr * t - speck * 40;
      img.data[i + 1] = g * (1 - t) + vg * t - speck * 40;
      img.data[i + 2] = b * (1 - t) + vb * t - speck * 40;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = finalize(canvas);
  cache.set(key, tex);
  return tex;
}

/** Floor boards for room scenes. */
export function floorTexture(hex = "#cdb699", seed = 3): THREE.Texture {
  const key = `floor:${hex}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const s = 512;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const base = woodTexture(hex, seed).image as HTMLCanvasElement;
  const rand = mulberry32(seed);
  const plank = s / 4;
  for (let i = 0; i < 4; i++) {
    const offset = rand() * s;
    const tint = 0.92 + rand() * 0.12;
    ctx.save();
    ctx.filter = `brightness(${tint})`;
    ctx.drawImage(base, 0, 0, base.width, base.height, i * plank, -offset, plank, s * 1.5);
    ctx.drawImage(base, 0, 0, base.width, base.height, i * plank, -offset + s * 1.5, plank, s * 1.5);
    ctx.restore();
    ctx.fillStyle = "rgba(60,40,25,0.35)";
    ctx.fillRect(i * plank, 0, 1.5, s);
    ctx.fillRect(i * plank, (offset * 0.7) % s, plank, 1.5);
  }
  const tex = finalize(canvas);
  cache.set(key, tex);
  return tex;
}
