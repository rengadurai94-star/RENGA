/**
 * Procedural materials. All textures are generated at runtime on a <canvas>
 * so the prototype needs no downloaded assets. Drop real PBR textures into
 * /public/assets/textures and swap them in here when available.
 */
import * as THREE from "three";

export type MatKey =
  // exterior
  | "render"
  | "frame"
  | "concrete"
  | "stoneDark"
  | "bronze"
  | "metalDark"
  | "glass"
  | "railGlass"
  | "soffit"
  | "paving"
  | "grass"
  | "water"
  | "trunk"
  | "foliage"
  | "foliageDark"
  | "road"
  | "context"
  | "solar"
  // interior
  | "wall"
  | "ceiling"
  | "floorMarble"
  | "floorWood"
  | "floorTile"
  | "deck"
  | "skirting"
  | "door"
  | "walnut"
  | "oak"
  | "lacquer"
  | "counter"
  | "fabric"
  | "fabricDark"
  | "fabricAccent"
  | "linen"
  | "leather"
  | "ceramic"
  | "chrome"
  | "mirror"
  | "black"
  | "screen"
  | "glow"
  | "plant"
  | "soil"
  | "pot"
  | "rug"
  | "brass"
  | "stone"
  | "glassInterior"
  | "art1"
  | "art2";

/** Seeded PRNG so textures look the same on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!] as const;
}

function toTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

function noise(ctx: CanvasRenderingContext2D, size: number, base: string, amp: number, seed: number, cell = 1) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const n = (r() - 0.5) * amp;
      for (let yy = 0; yy < cell; yy++)
        for (let xx = 0; xx < cell; xx++) {
          const i = ((y + yy) * size + (x + xx)) * 4;
          d[i] += n;
          d[i + 1] += n;
          d[i + 2] += n;
        }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function blotches(ctx: CanvasRenderingContext2D, size: number, color: string, count: number, seed: number, alpha = 0.05) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = (0.05 + r() * 0.25) * size;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha * (0.5 + r());
    ctx.fillStyle = g;
    for (const ox of [-size, 0, size])
      for (const oy of [-size, 0, size]) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        ctx.restore();
      }
  }
  ctx.globalAlpha = 1;
}

const textures = {
  plaster() {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 14, 11);
    blotches(ctx, 256, "#b9b2a6", 18, 12, 0.06);
    return toTexture(c);
  },
  concrete() {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 22, 21, 2);
    blotches(ctx, 256, "#8f8a82", 26, 22, 0.08);
    return toTexture(c);
  },
  stone() {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 18, 31);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    for (let y = 0; y <= 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 64 : 0;
      for (let x = off; x <= 256; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, row * 64);
        ctx.lineTo(x, row * 64 + 64);
        ctx.stroke();
      }
    }
    return toTexture(c);
  },
  marble() {
    const [c, ctx] = makeCanvas(512);
    noise(ctx, 512, "#ffffff", 8, 41);
    blotches(ctx, 512, "#d9d2c7", 30, 42, 0.12);
    const r = rng(43);
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = `rgba(120,112,100,${0.08 + r() * 0.18})`;
      ctx.lineWidth = 0.6 + r() * 1.8;
      ctx.beginPath();
      let x = r() * 512;
      let y = r() * 512;
      ctx.moveTo(x, y);
      for (let k = 0; k < 8; k++) {
        const nx = x + (r() - 0.3) * 160;
        const ny = y + (r() - 0.5) * 120;
        ctx.quadraticCurveTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 80, nx, ny);
        x = nx;
        y = ny;
      }
      ctx.stroke();
    }
    // tile joints every 1.2m (texture covers 2.4m)
    ctx.strokeStyle = "rgba(150,140,128,0.35)";
    ctx.lineWidth = 1.5;
    for (const p of [0, 256, 512]) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }
    return toTexture(c);
  },
  woodFloor() {
    const [c, ctx] = makeCanvas(512);
    const r = rng(51);
    const plankH = 512 / 8;
    for (let row = 0; row < 8; row++) {
      let x = -r() * 300;
      while (x < 512) {
        const len = 220 + r() * 260;
        const tone = 0.86 + r() * 0.22;
        ctx.fillStyle = `rgb(${Math.round(255 * tone)},${Math.round(236 * tone)},${Math.round(214 * tone)})`;
        ctx.fillRect(x, row * plankH, len, plankH);
        ctx.strokeStyle = "rgba(60,40,20,0.08)";
        for (let g = 0; g < 9; g++) {
          ctx.lineWidth = 0.5 + r();
          ctx.beginPath();
          const gy = row * plankH + r() * plankH;
          ctx.moveTo(x, gy);
          ctx.bezierCurveTo(x + len * 0.3, gy + (r() - 0.5) * 6, x + len * 0.6, gy + (r() - 0.5) * 6, x + len, gy);
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(40,25,10,0.35)";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, row * plankH, len, plankH);
        x += len;
      }
    }
    return toTexture(c);
  },
  tile() {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 10, 61);
    ctx.strokeStyle = "rgba(110,100,90,0.45)";
    ctx.lineWidth = 2;
    for (let p = 0; p <= 256; p += 128) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 256);
      ctx.moveTo(0, p);
      ctx.lineTo(256, p);
      ctx.stroke();
    }
    return toTexture(c);
  },
  grain(seed: number) {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 10, seed);
    const r = rng(seed + 1);
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = `rgba(70,45,20,${0.04 + r() * 0.1})`;
      ctx.lineWidth = 0.5 + r() * 1.5;
      ctx.beginPath();
      const y = r() * 256;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(85, y + (r() - 0.5) * 12, 170, y + (r() - 0.5) * 12, 256, y);
      ctx.stroke();
    }
    return toTexture(c);
  },
  fabric() {
    const [c, ctx] = makeCanvas(128);
    noise(ctx, 128, "#ffffff", 26, 71);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#000";
    for (let i = 0; i < 128; i += 2) ctx.fillRect(0, i, 128, 1);
    ctx.globalAlpha = 1;
    return toTexture(c);
  },
  grass() {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 40, 81, 2);
    blotches(ctx, 256, "#5a6b3a", 30, 82, 0.12);
    return toTexture(c);
  },
  paving() {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 16, 91);
    ctx.strokeStyle = "rgba(90,85,78,0.35)";
    ctx.lineWidth = 1.5;
    for (let p = 0; p <= 256; p += 64) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 256);
      ctx.stroke();
    }
    for (let p = 0; p <= 256; p += 128) {
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(256, p);
      ctx.stroke();
    }
    return toTexture(c);
  },
  deck() {
    const [c, ctx] = makeCanvas(256);
    const r = rng(101);
    for (let i = 0; i < 8; i++) {
      const tone = 0.9 + r() * 0.15;
      ctx.fillStyle = `rgb(${Math.round(255 * tone)},${Math.round(235 * tone)},${Math.round(210 * tone)})`;
      ctx.fillRect(0, i * 32, 256, 30);
      ctx.fillStyle = "rgba(30,20,10,0.6)";
      ctx.fillRect(0, i * 32 + 30, 256, 2);
    }
    return toTexture(c);
  },
  rug() {
    const [c, ctx] = makeCanvas(256);
    noise(ctx, 256, "#ffffff", 30, 111);
    ctx.strokeStyle = "rgba(90,70,50,0.25)";
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, 228, 228);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, 200, 200);
    return toTexture(c);
  },
  art(seed: number) {
    const [c, ctx] = makeCanvas(256);
    const r = rng(seed);
    ctx.fillStyle = "#efe9df";
    ctx.fillRect(0, 0, 256, 256);
    const palette = ["#a8835c", "#2b2a29", "#c9a27a", "#8a8f8c", "#d9cbb6", "#5d5853"];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = palette[Math.floor(r() * palette.length)];
      ctx.globalAlpha = 0.85;
      if (r() > 0.5) ctx.fillRect(r() * 180, r() * 180, 30 + r() * 120, 20 + r() * 120);
      else {
        ctx.beginPath();
        ctx.arc(60 + r() * 140, 60 + r() * 140, 20 + r() * 60, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    return toTexture(c);
  },
  solar() {
    const [c, ctx] = makeCanvas(128);
    ctx.fillStyle = "#1d2a3a";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "rgba(200,210,220,0.35)";
    for (let p = 0; p <= 128; p += 16) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 128);
      ctx.moveTo(0, p);
      ctx.lineTo(128, p);
      ctx.stroke();
    }
    return toTexture(c);
  },
};

/** World-unit size that one texture tile covers, per material (used for UVs). */
export const UV_SCALE: Partial<Record<MatKey, number>> = {
  render: 4,
  frame: 4,
  concrete: 3,
  stoneDark: 2.4,
  soffit: 1.2,
  paving: 4,
  grass: 6,
  road: 8,
  wall: 3,
  ceiling: 3,
  floorMarble: 2.4,
  floorWood: 2.2,
  floorTile: 1.2,
  deck: 1.6,
  walnut: 1.2,
  oak: 1.2,
  fabric: 0.6,
  fabricDark: 0.6,
  fabricAccent: 0.6,
  linen: 0.8,
  rug: 2.4,
  counter: 1.5,
  stone: 2,
  solar: 1.0,
  art1: 1.0,
  art2: 1.0,
};

export type MaterialSet = Record<MatKey, THREE.MeshStandardMaterial>;

let cache: MaterialSet | null = null;

export function getMaterials(): MaterialSet {
  if (cache) return cache;
  const plaster = textures.plaster();
  const concrete = textures.concrete();
  const fabric = textures.fabric();
  const walnutTex = textures.grain(121);
  const oakTex = textures.grain(131);

  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
  const m: MaterialSet = {
    render: std({ color: "#ebe5dc", map: plaster, roughness: 0.92 }),
    frame: std({ color: "#f7f4ee", map: plaster, roughness: 0.85 }),
    concrete: std({ color: "#d8d2c8", map: concrete, roughness: 0.95 }),
    stoneDark: std({ color: "#47433f", map: textures.stone(), roughness: 0.75 }),
    bronze: std({ color: "#8a6644", metalness: 0.75, roughness: 0.35, envMapIntensity: 1.2 }),
    metalDark: std({ color: "#2e2c2a", metalness: 0.6, roughness: 0.4 }),
    glass: std({ color: "#5b676c", metalness: 0.92, roughness: 0.05, envMapIntensity: 1.6 }),
    railGlass: std({
      color: "#c9d6d8",
      metalness: 0.2,
      roughness: 0.05,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
    soffit: std({ color: "#b2865d", map: oakTex, roughness: 0.7 }),
    paving: std({ color: "#d9d3c9", map: textures.paving(), roughness: 0.9 }),
    grass: std({ color: "#7f9160", map: textures.grass(), roughness: 1 }),
    water: std({ color: "#7f9ea6", metalness: 0.85, roughness: 0.08, envMapIntensity: 1.5 }),
    trunk: std({ color: "#6b5644", roughness: 0.9 }),
    foliage: std({ color: "#7b8c5c", roughness: 0.95, flatShading: true }),
    foliageDark: std({ color: "#5e7048", roughness: 0.95, flatShading: true }),
    road: std({ color: "#8e8a85", map: concrete, roughness: 0.95 }),
    context: std({ color: "#e7e2da", map: plaster, roughness: 0.95 }),
    solar: std({ color: "#ffffff", map: textures.solar(), metalness: 0.5, roughness: 0.25 }),

    wall: std({ color: "#f2eee7", map: plaster, roughness: 0.95 }),
    ceiling: std({ color: "#f8f6f2", roughness: 0.95 }),
    floorMarble: std({ color: "#f3efe8", map: textures.marble(), roughness: 0.22, envMapIntensity: 0.8 }),
    floorWood: std({ color: "#b88b62", map: textures.woodFloor(), roughness: 0.55 }),
    floorTile: std({ color: "#d8d3cb", map: textures.tile(), roughness: 0.6 }),
    deck: std({ color: "#9b7451", map: textures.deck(), roughness: 0.75 }),
    skirting: std({ color: "#e9e4dc", roughness: 0.6 }),
    door: std({ color: "#a47c56", map: oakTex, roughness: 0.6 }),
    walnut: std({ color: "#6f4e35", map: walnutTex, roughness: 0.55 }),
    oak: std({ color: "#c9a57d", map: oakTex, roughness: 0.6 }),
    lacquer: std({ color: "#e8e2d8", roughness: 0.4 }),
    counter: std({ color: "#f1ede6", map: textures.marble(), roughness: 0.18, envMapIntensity: 0.9 }),
    fabric: std({ color: "#d9d1c4", map: fabric, roughness: 0.95 }),
    fabricDark: std({ color: "#5d5852", map: fabric, roughness: 0.95 }),
    fabricAccent: std({ color: "#9c7a56", map: fabric, roughness: 0.85 }),
    linen: std({ color: "#f2eee6", map: fabric, roughness: 0.95 }),
    leather: std({ color: "#7d5b3f", roughness: 0.5 }),
    ceramic: std({ color: "#f7f6f3", roughness: 0.15, envMapIntensity: 0.9 }),
    chrome: std({ color: "#d4d7d9", metalness: 1, roughness: 0.12 }),
    mirror: std({ color: "#e9eef0", metalness: 1, roughness: 0.02, envMapIntensity: 1.5 }),
    black: std({ color: "#1f1e1d", roughness: 0.5 }),
    screen: std({ color: "#0e0f10", metalness: 0.4, roughness: 0.15, emissive: "#1a2228", emissiveIntensity: 0.4 }),
    glow: std({ color: "#fff1d6", emissive: "#ffd9a0", emissiveIntensity: 2.2, roughness: 0.6 }),
    plant: std({ color: "#566b3f", roughness: 0.75 }),
    soil: std({ color: "#3b2f25", roughness: 1 }),
    pot: std({ color: "#cbbfae", roughness: 0.85 }),
    rug: std({ color: "#cfc3b1", map: textures.rug(), roughness: 1 }),
    brass: std({ color: "#b08d57", metalness: 0.9, roughness: 0.28 }),
    stone: std({ color: "#9a9188", map: concrete, roughness: 0.8 }),
    glassInterior: std({
      color: "#dfe8ea",
      metalness: 0.1,
      roughness: 0.02,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      envMapIntensity: 1.2,
    }),
    art1: std({ color: "#ffffff", map: textures.art(141), roughness: 0.9 }),
    art2: std({ color: "#ffffff", map: textures.art(151), roughness: 0.9 }),
  };
  for (const [k, mat] of Object.entries(m)) mat.name = k;
  cache = m;
  return m;
}

/** Exterior shell materials that get per-floor clones (for ghosting / fades). */
export const FLOOR_MATS: MatKey[] = [
  "render",
  "frame",
  "concrete",
  "stoneDark",
  "bronze",
  "metalDark",
  "glass",
  "railGlass",
  "soffit",
];

export function cloneForFloor(base: MaterialSet): Partial<MaterialSet> {
  const out: Partial<MaterialSet> = {};
  for (const k of FLOOR_MATS) {
    const c = base[k].clone();
    c.transparent = true;
    c.userData.baseOpacity = base[k].opacity;
    c.userData.baseColor = base[k].color.clone();
    out[k] = c;
  }
  return out;
}

/** Soft round sprite used for the cloud system. */
export function makeCloudTexture(): THREE.Texture {
  const [c, ctx] = makeCanvas(256);
  const r = rng(201);
  ctx.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 28; i++) {
    const x = 128 + (r() - 0.5) * 120;
    const y = 128 + (r() - 0.5) * 70;
    const rad = 30 + r() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "rgba(255,255,255,0.35)");
    g.addColorStop(0.6, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  // fade edges so sprites never show a square border
  const mask = ctx.createRadialGradient(128, 128, 60, 128, 128, 128);
  mask.addColorStop(0, "rgba(0,0,0,1)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Canvas texture with text, used for the rooftop signage. */
export function makeTextTexture(text: string, font: string, color = "#f4efe6"): THREE.Texture {
  const [c, ctx] = makeCanvas(1024);
  c.height = 256;
  ctx.clearRect(0, 0, 1024, 256);
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // letter-spacing via manual layout
  const letters = text.split("");
  const spacing = 70;
  const widths = letters.map((l) => ctx.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (letters.length - 1);
  let x = 512 - total / 2;
  letters.forEach((l, i) => {
    ctx.fillText(l, x + widths[i] / 2, 128);
    x += widths[i] + spacing;
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
