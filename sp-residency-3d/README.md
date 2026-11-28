# Shan Poornam Residence: Interactive 3D Website

An interactive 3D showroom for **Shan Poornam Residence (SP Residence)** in Visalakshipuram, Madurai. The project has 26 boutique residences across 5 floors, plus a stilt level and a terrace. Everything on the site comes from the project brochure (`source-assets/brochure/SPR-Brochure-11-05-2026.pdf`).

What visitors get:

1. **A cinematic opening.** The camera glides over a sea of clouds with the logo, dives through the clouds, and reveals a stylised Madurai skyline before arriving at the building. There is a *Skip intro* button, and returning visitors skip it automatically. They can replay it from the hero.
2. **An interactive 3D building.** Visitors can rotate it, zoom in and out, and move floor by floor by scrolling. Each floor opens as a cutaway that shows the **original brochure floor plan**.
3. **Residences they can click**, in the 3D model, on the 2D plans, or in the lists. All three stay in sync. Each residence opens a detail panel with its areas, Vastu orientation, room sizes, the **original unit plan**, and the brochure interior images.
4. **The rest of the website:** floor plans viewer (zoom and pan), original gallery, the 21 amenities, full specifications, location and distances, and contact/enquiry.
5. **Phones, tablets and older devices.** The site works on mobile with touch, has an automatic *Performance mode*, and still works without 3D (on the original 2D plans).

---

## 1. See the website in 2 minutes (no installation)

1. Open the ZIP **`SP-Residence-Website-Ready-To-Upload.zip`**. It contains a finished `dist` folder.
2. Go to **https://app.netlify.com/drop** (free).
3. Drag the `dist` folder onto that page.
4. Netlify gives you a web address. Open it on your computer or phone.

> A built website **cannot** be opened by double-clicking `index.html`, because browsers block 3D/JavaScript files opened from disk. Use Netlify Drop (above) or the steps below.

## 2. Run it on your computer (for editing)

You need **Node.js** once. Download the "LTS" version from https://nodejs.org and install it with the default options.

Then, in the project folder (`sp-residency-3d`), open a terminal (Windows: *right-click → Open in Terminal*; Mac: *Terminal* app) and run:

```bash
npm install
```

```bash
npm run dev
```

Open **http://localhost:5173** in Chrome, Edge or Safari. Press `Ctrl + C` in the terminal to stop.

## 3. Change apartment details, photos, contact info (no coding)

While `npm run dev` is running, open **http://localhost:5173/#/editor** (there is also an *Edit project data* link in the footer).

| Tab | What you can change |
|---|---|
| **Residences** | Official flat numbers, availability status (Available / Booked / Sold / Blocked), floor, unit type, notes |
| **Unit types** | Areas (carpet, super built-up, balcony, UDS), Vastu facing, entries, room sizes, plan image |
| **Project** | Name (e.g. "SP Residency" if you prefer that), tagline, intro line, unit mix; price / possession / RERA number (empty = hidden) |
| **Contact** | Phone, WhatsApp, email, website, address |
| **Location** | Address, map link, nearby places and distances |
| **Gallery** | Captions, order, add original photos (upload) |

Press **Save** and the website updates immediately. Your changes are stored in `src/data/project-data.json`, and the previous version is kept as `project-data.json.bak`.

**Rule of thumb:** if a fact is not confirmed, leave the field **empty**. The website then hides it instead of showing an invented value.

You can also edit `src/data/project-data.json` directly in any text editor.

## 4. Publish the website

```bash
npm run build
```

This creates the `dist` folder. Upload the **contents of `dist`** to any web host: Netlify, Vercel, GitHub Pages, Hostinger, GoDaddy or cPanel. No server software or database is needed. The site works from any folder or sub-path.

## 5. Useful options

| Address | Effect |
|---|---|
| `…/?quality=high` | Force the richest 3D (soft shadows and ambient occlusion). Good for presentations on a powerful computer |
| `…/?quality=low` | Force Performance mode |
| `…/?mode=2d` | Website without 3D (plans and photos only) |
| `…/#/editor` | Data editor |

The **High quality / Performance** button at the top right switches modes. The site picks Performance mode automatically on phones, and when a computer can't keep the 3D smooth.

## 6. What is in the folder

```
sp-residency-3d/
├── source-assets/              Original brochure PDF + every image extracted from it (unaltered)
├── public/media/               Web-optimised copies of those originals (WebP)
├── public/brand/               Logo, extracted from the brochure's vector artwork
├── src/data/project-data.json  ← ALL project information (edit this or use the editor)
├── src/data/plan-geometry.json Unit outlines traced from the brochure's typical floor plan
├── src/scenes/                 3D sky, clouds, city, camera choreography
├── src/building/               3D building, assembled from the traced plan
├── src/floors/ src/apartments/ Floor explorer, 2D plans, apartment detail panel
├── src/components/             Page sections (intro, hero, gallery, amenities, location, contact…)
├── src/editor/                 The data editor
├── tools/                      Scripts that extracted the assets and traced the plan (Python)
├── tests/e2e.cjs               Automated browser tests (38 checks)
└── docs/PROJECT-REPORT.md      Asset inventory, verified data, contradictions and missing information
```

## 7. Accuracy and honesty

* **Images:** only the brochure's own images are used, at their original proportions. There are no stock or AI-generated images. They are the developer's *artist's impressions* and are labelled as such. The brochure prints captions for the amenity images (pp.11–12). The interior images (pp.24–25) have no captions, so the site describes them neutrally and does not assign them to a unit type.
* **3D model:** the footprint and unit outlines are traced from the brochure's typical floor plan. They are scaled from its printed 28'4" halls, with a 10' floor-to-floor height (printed). The brochure gives **no CAD files, no overall dimensions and no stilt height**, so the model is a faithful *visualisation*, **not a survey or construction model**. The site always shows the printed areas and dimensions, never measurements taken from the model.
* **5th floor:** the brochure confirms it holds 1 × 4 BHK and 1 × 3 BHK (from the unit totals), but **publishes no plan**. The site shows "layout not published" and invents nothing.
* **Flat numbers, prices, availability, possession date and RERA number** are not in the brochure. They are empty, and hidden, until you enter them.
* **Madurai city & temple towers** are stylised atmosphere and do not show real buildings or positions. Distances and landmarks come only from the brochure (pp.6–7).
* Full details are in **`docs/PROJECT-REPORT.md`**.

## 8. For developers

* Stack: React 19, TypeScript 5.9, Vite 7, three.js r182, React Three Fiber 9, drei 10, @react-three/postprocessing 3, GSAP 3, lucide-react. Fonts are self-hosted (Cormorant Garamond, Manrope).
* `npm run typecheck` · `npm run lint` · `npm run build` · `npm run preview`
* Tests: `npm run build && npm run preview`, then in a second terminal run `npm run test:e2e`. This needs Playwright: `npm i -D playwright && npx playwright install chromium`.
* Rebuild assets from the PDF: `npm run assets`. This needs Python 3 with Pillow and numpy, plus poppler-utils.
* `npm run zip` creates the two ZIP files in `release/`.
