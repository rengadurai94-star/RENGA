import * as THREE from 'three';
import { FLOOR_H, SLAB } from './planGeometry';

/** Deterministic PRNG so the procedural city is identical on every visit. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

export const WALL_H = FLOOR_H - SLAB;
export const FACADE_TILE_W = 4.2;

let facadeCache: { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture; rough: THREE.CanvasTexture } | null = null;

/**
 * Facade tile after the brochure renders (p.4, p.26): warm plaster, a grey cladding strip,
 * near floor-to-ceiling glazing with slim white frames, and a shadow line under each slab.
 * One tile = 4.2 m wide x one storey. Generic - the brochure gives no window schedule.
 */
export function facadeTextures() {
  if (facadeCache) return facadeCache;
  const W = 512;
  const H = Math.round((W * WALL_H) / FACADE_TILE_W);
  const mk2 = () => {
    const c = canvas(W, H);
    return [c, c.getContext('2d')!] as const;
  };
  const [c, g] = mk2();
  const [e, ge] = mk2();
  const [r, gr] = mk2();
  const sx = W / FACADE_TILE_W;
  const sy = H / WALL_H;
  const Y = (mFromBottom: number) => H - mFromBottom * sy;
  // plaster
  g.fillStyle = '#e7e2d9';
  g.fillRect(0, 0, W, H);
  const rnd = mulberry32(7);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${110 + rnd() * 60},${100 + rnd() * 50},${90 + rnd() * 40},${rnd() * 0.05})`;
    g.fillRect(rnd() * W, rnd() * H, 2, 2);
  }
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, W, H);
  gr.fillStyle = 'rgb(235,235,235)';
  gr.fillRect(0, 0, W, H);
  // grey cladding strip
  g.fillStyle = '#a3a6a6';
  g.fillRect(0, 0, 0.62 * sx, H);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0.7; y < WALL_H; y += 0.7) g.fillRect(0, Y(y), 0.62 * sx, 2);
  // glazing
  const x0 = 0.82 * sx, x1 = 3.52 * sx;
  const yTop = Y(2.6), yBot = Y(0.08);
  const grad = g.createLinearGradient(0, yTop, 0, yBot);
  grad.addColorStop(0, '#617783');
  grad.addColorStop(0.5, '#3b4b55');
  grad.addColorStop(1, '#2f3c45');
  g.fillStyle = grad;
  g.fillRect(x0, yTop, x1 - x0, yBot - yTop);
  // interior hint: a warm ceiling strip and curtain tone
  g.fillStyle = 'rgba(255,226,180,0.16)';
  g.fillRect(x0, yTop, x1 - x0, 0.28 * sy);
  g.fillStyle = 'rgba(235,225,205,0.10)';
  g.fillRect(x0 + 0.05 * sx, yTop, 0.45 * sx, yBot - yTop);
  // sky reflection
  const refl = g.createLinearGradient(x0, yTop, x1, yBot);
  refl.addColorStop(0, 'rgba(255,255,255,0)');
  refl.addColorStop(0.42, 'rgba(255,255,255,0.18)');
  refl.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  refl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = refl;
  g.fillRect(x0, yTop, x1 - x0, yBot - yTop);
  // night glow
  const eg = ge.createLinearGradient(0, yTop, 0, yBot);
  eg.addColorStop(0, '#ffe0ae');
  eg.addColorStop(1, '#e89c55');
  ge.fillStyle = eg;
  ge.fillRect(x0, yTop, x1 - x0, yBot - yTop);
  gr.fillStyle = 'rgb(40,40,40)';
  gr.fillRect(x0, yTop, x1 - x0, yBot - yTop);
  // frames & mullions
  g.strokeStyle = '#f6f4ef';
  g.lineWidth = 6;
  g.strokeRect(x0, yTop, x1 - x0, yBot - yTop);
  g.lineWidth = 4;
  ge.strokeStyle = '#000';
  ge.lineWidth = 5;
  for (const m of [1.72, 2.62]) {
    const mx = m * sx;
    g.beginPath(); g.moveTo(mx, yTop); g.lineTo(mx, yBot); g.stroke();
    ge.beginPath(); ge.moveTo(mx, yTop); ge.lineTo(mx, yBot); ge.stroke();
  }
  // shadow line under the slab above
  const sh = g.createLinearGradient(0, 0, 0, 0.35 * sy);
  sh.addColorStop(0, 'rgba(40,32,24,0.28)');
  sh.addColorStop(1, 'rgba(40,32,24,0)');
  g.fillStyle = sh;
  g.fillRect(0, 0, W, 0.35 * sy);

  const mk = (cv: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / FACADE_TILE_W, -1 / WALL_H);
    t.offset.set(0, 1 / WALL_H);
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  facadeCache = { map: mk(c, true), emissive: mk(e, true), rough: mk(r, false) };
  return facadeCache;
}

let cloudTex: THREE.CanvasTexture | null = null;
/** Soft cumulus puff (alpha) used by the instanced cloud billboards. */
export function cloudTexture() {
  if (cloudTex) return cloudTex;
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d')!;
  const rnd = mulberry32(42);
  g.clearRect(0, 0, S, S);
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.pow(rnd(), 0.8) * S * 0.24;
    const x = S / 2 + Math.cos(a) * r;
    const y = S / 2 + Math.sin(a) * r * 0.62 + S * 0.02;
    const rad = S * (0.1 + rnd() * 0.16);
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const shade = 225 + Math.floor(rnd() * 30);
    grd.addColorStop(0, `rgba(${shade},${shade},${shade},0.55)`);
    grd.addColorStop(0.6, `rgba(${shade},${shade},${shade},0.22)`);
    grd.addColorStop(1, `rgba(${shade},${shade},${shade},0)`);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  // soft circular falloff so edges never show
  const img = g.getImageData(0, 0, S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x - S / 2) / (S / 2);
      const dy = (y - S / 2) / (S / 2);
      const d = Math.sqrt(dx * dx + dy * dy);
      const f = Math.max(0, 1 - Math.pow(d, 2.2));
      const i = (y * S + x) * 4 + 3;
      img.data[i] = img.data[i] * f;
    }
  }
  g.putImageData(img, 0, 0);
  cloudTex = new THREE.CanvasTexture(c);
  cloudTex.colorSpace = THREE.SRGBColorSpace;
  return cloudTex;
}

let groundTex: THREE.CanvasTexture | null = null;
export function groundTexture() {
  if (groundTex) return groundTex;
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d')!;
  g.fillStyle = '#cbbfa9';
  g.fillRect(0, 0, S, S);
  const rnd = mulberry32(3);
  for (let i = 0; i < 4000; i++) {
    const v = rnd();
    g.fillStyle = v > 0.5 ? `rgba(255,250,240,${rnd() * 0.08})` : `rgba(90,80,60,${rnd() * 0.07})`;
    g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  groundTex = new THREE.CanvasTexture(c);
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(60, 60);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  return groundTex;
}

/** Loads an SVG/bitmap into a CanvasTexture (used for the brand emblem on the roof pylon). */
export function imageTexture(url: string, size = 512): THREE.CanvasTexture {
  const c = canvas(size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d')!;
    const r = Math.min(size / img.width, size / img.height) * 0.86;
    const w = img.width * r;
    const h = img.height * r;
    g.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    tex.needsUpdate = true;
  };
  img.src = url;
  return tex;
}
