#!/usr/bin/env node
/**
 * Build the static, click-through prototype of the Urban Mark Interior site.
 *
 *   npm run prototype            -> prototype/dist/
 *
 * The prototype renders the SAME React components as the Next.js app. esbuild bundles them with
 * small stand-ins for next/image, next/link and next/dynamic (prototype/src/shims), Tailwind is
 * compiled from src/app/globals.css, and only the assets the pages use are copied. Every path is
 * relative, so dist/ works from any folder or static host.
 *
 * Output
 *   dist/index.html      complete document (local preview / any static host)
 *   dist/artifact.html   body-only version for the claude.ai Artifact host (it adds the <head>)
 *   dist/assets/*.js     app bundle + lazily loaded chunks (3D viewer)
 *   dist/images/, dist/models/
 *   dist/files.json      published-path -> source map used to publish the artifact
 */
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = join(here, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "assets"), { recursive: true });

// ---------------------------------------------------------------- JavaScript
const result = await build({
  entryPoints: [join(here, "src/main.tsx")],
  absWorkingDir: root,
  bundle: true,
  splitting: true,
  format: "esm",
  outdir: join(dist, "assets"),
  entryNames: "app",
  chunkNames: "chunk-[hash]",
  minify: true,
  target: ["es2020"],
  jsx: "automatic",
  legalComments: "none",
  metafile: true,
  logLevel: "warning",
  logOverride: { "unsupported-directive": "silent" }, // "use client" is meaningless here
  alias: {
    "next/image": join(here, "src/shims/next-image.tsx"),
    "next/link": join(here, "src/shims/next-link.tsx"),
    "next/dynamic": join(here, "src/shims/next-dynamic.tsx"),
  },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_ASSET_BASE": '""',
    "process.env.NEXT_PUBLIC_PROTOTYPE": '"1"',
    "process.env.NEXT_PUBLIC_MODEL_EXT": '".gltf.json"',
  },
});

// ---------------------------------------------------------------- CSS (Tailwind v4)
const cssSource = join(root, "src/app/globals.css");
const css = await postcss([tailwind({ base: root, optimize: { minify: true } })]).process(
  readFileSync(cssSource, "utf8"),
  { from: cssSource }
);
// next/font normally provides these variables; the prototype loads the same faces from Google Fonts
const fontVars =
  ':root{--font-fraunces:"Fraunces",Georgia,"Times New Roman",serif;--font-inter:"Inter",ui-sans-serif,system-ui,sans-serif;color-scheme:dark}' +
  "html,body{background:#0a0a0a}";

// ---------------------------------------------------------------- assets
const copied = [];
function copyTree(srcRel, filter) {
  const src = join(root, srcRel);
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (filter(name)) {
        const rel = relative(join(root, "public"), p);
        mkdirSync(dirname(join(dist, rel)), { recursive: true });
        cpSync(p, join(dist, rel));
        copied.push(rel);
      }
    }
  };
  walk(src);
}
copyTree("public/images/sp-residency", (n) => n.endsWith(".webp"));
// Models: the Artifact host serves no .glb, so each GLB is repacked as embedded glTF JSON
// (same scene, buffers and textures as a base64 data: URI). three.js' GLTFLoader reads both forms.
const modelDir = join(root, "public/models/sp-residency");
mkdirSync(join(dist, "models/sp-residency"), { recursive: true });
for (const name of readdirSync(modelDir).filter((n) => n.endsWith(".glb"))) {
  const glb = readFileSync(join(modelDir, name));
  if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error(`${name} is not a GLB`);
  let offset = 12;
  let json = null;
  let bin = null;
  while (offset < glb.length) {
    const len = glb.readUInt32LE(offset);
    const type = glb.readUInt32LE(offset + 4);
    const chunk = glb.subarray(offset + 8, offset + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8"));
    else if (type === 0x004e4942) bin = chunk;
    offset += 8 + len;
  }
  if (bin) json.buffers[0].uri = `data:application/octet-stream;base64,${bin.toString("base64")}`;
  const rel = `models/sp-residency/${name.replace(/\.glb$/, ".gltf.json")}`;
  writeFileSync(join(dist, rel), JSON.stringify(json));
  copied.push(rel);
}

// ---------------------------------------------------------------- HTML
const title = "Urban Mark × SP Residency";
const fonts =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&display=swap">';
const body = `<div id="root"></div>\n<script type="module" src="assets/app.js"></script>`;
const style = `<style>${fontVars}${css.css}</style>`;

writeFileSync(
  join(dist, "index.html"),
  `<!doctype html>\n<html lang="en" class="h-full">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title}</title>\n${fonts}\n${style}\n</head>\n<body class="min-h-full">\n${body}\n</body>\n</html>\n`
);
writeFileSync(join(dist, "artifact.html"), `<title>${title}</title>\n${fonts}\n${style}\n${body}\n`);

// ---------------------------------------------------------------- publish map + report
const jsFiles = readdirSync(join(dist, "assets")).map((f) => `assets/${f}`);
const files = {};
for (const rel of [...jsFiles, ...copied]) {
  files[rel] = `prototype/dist/${rel}`;
}
writeFileSync(join(dist, "files.json"), JSON.stringify(files, null, 2) + "\n");

const size = (p) => statSync(join(dist, p)).size;
const total = Object.keys(files).reduce((s, f) => s + size(f), 0) + size("artifact.html");
console.log(`prototype built -> ${relative(root, dist)}`);
console.log(`  js: ${jsFiles.length} files, ${(jsFiles.reduce((s, f) => s + size(f), 0) / 1e6).toFixed(2)} MB`);
console.log(`  css: ${(css.css.length / 1024).toFixed(0)} KB (inlined)`);
console.log(`  assets: ${copied.length} files`);
console.log(`  total: ${Object.keys(files).length + 1} files, ${(total / 1e6).toFixed(1)} MB`);
if (!existsSync(join(dist, "assets/app.js"))) throw new Error("app.js missing");
void result;
