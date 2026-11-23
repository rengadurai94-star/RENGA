/**
 * Builds a single self-contained HTML file of the BOXES app for hosted demos.
 * Usage: node demo/build.mjs [outFile]
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.resolve(process.argv[2] ?? path.join(root, "demo/dist/boxes-demo.html"));
const tmp = path.join(root, "demo/dist");
mkdirSync(tmp, { recursive: true });
mkdirSync(path.dirname(out), { recursive: true });

const shims = {
  "next/link": "demo/shims/next-link.tsx",
  "next/navigation": "demo/shims/next-navigation.ts",
  "next/dynamic": "demo/shims/next-dynamic.tsx",
  "@/lib/pricing/client": "demo/shims/pricing-client.ts",
};

const result = await build({
  entryPoints: [path.join(root, "demo/main.tsx")],
  bundle: true,
  minify: process.env.DEMO_MINIFY !== "0",
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  define: { "process.env.NODE_ENV": process.env.DEMO_MINIFY === "0" ? "\"development\"" : "\"production\"" },
  legalComments: "none",
  plugins: [
    {
      name: "aliases",
      setup(b) {
        b.onResolve({ filter: /^(next\/(link|navigation|dynamic)|@\/lib\/pricing\/client)$/ }, (a) => ({
          path: path.join(root, shims[a.path]),
        }));
        b.onResolve({ filter: /^@\// }, async (a) =>
          b.resolve("./" + a.path.slice(2), { resolveDir: path.join(root, "src"), kind: a.kind }),
        );
      },
    },
  ],
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

// Tailwind v4: compile globals.css against the app + demo sources.
const cssOut = path.join(tmp, "app.css");
execFileSync("npx", ["@tailwindcss/cli", "-i", "src/app/globals.css", "-o", cssOut, "--minify"], { cwd: root, stdio: "inherit" });
const css = readFileSync(cssOut, "utf8");

const html = `<title>BOXES</title>
<meta name="description" content="BOXES — modular furniture design platform demo">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap">
<style>:root{--font-manrope:"Manrope",ui-sans-serif,system-ui,sans-serif;--font-inter:"Inter",ui-sans-serif,system-ui,sans-serif;color-scheme:light}html,body{background:#f4f0e8;color:#1d1d1b}</style>
<style>${css}</style>
<div id="boxes-root"></div>
<script>${js}</script>
`;
writeFileSync(out, html);
console.log(`Wrote ${out} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
