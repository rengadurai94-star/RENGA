/**
 * Builds a static, server-less preview of the BOXES homepage into ./preview:
 *   index.html, boxes.js, boxes.css and the gallery images.
 * Run `npm run build` first (the Tailwind CSS is taken from the Next build).
 * The enquiry form validates but does not submit in this build.
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "preview");
const chunks = join(root, ".next/static/chunks");

let css;
try {
  css = readdirSync(chunks)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(chunks, f), "utf8"))
    .find((c) => c.includes("--color-paper"));
} catch {
  /* handled below */
}
if (!css) {
  console.error("No BOXES stylesheet in .next — run `npm run build` first.");
  process.exit(1);
}
// Self-hosted next/font faces point at Next's media folder; load the same families from Google Fonts instead.
css = css.replace(/@font-face\{[^}]*\}/g, "");
css += `:root{--font-cormorant:"Cormorant Garamond",Georgia,serif;--font-inter-tight:"Inter Tight",ui-sans-serif,system-ui,sans-serif}`;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "boxes.css"), css);

await build({
  entryPoints: [join(root, "src/preview/main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  tsconfig: join(root, "tsconfig.json"),
  alias: { "next/dynamic": join(root, "src/preview/dynamic-shim.tsx") },
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_STATIC_PREVIEW": '"1"',
  },
  logOverride: { "unsupported-directive": "silent" },
  outfile: join(out, "boxes.js"),
});

cpSync(join(root, "public/assets/images/gallery"), join(out, "assets/images/gallery"), { recursive: true });

writeFileSync(
  join(out, "index.html"),
  `<title>BOXES Surya Nagar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Inter+Tight:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="boxes.css">
<div id="boxes-root"></div>
<script src="boxes.js"></script>
`,
);
console.log("Preview written to", out);
