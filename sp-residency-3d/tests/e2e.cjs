/* End-to-end checks for the Shan Poornam Residence website (PART 17 of the brief).
 *
 * Usage:   npm run build && npm run preview        (in one terminal)
 *          npm run test:e2e                        (in another)
 * Needs:   Playwright with Chromium. If it is not installed:
 *          npm i -D playwright && npx playwright install chromium
 * Env:     BASE_URL (default http://localhost:4173/)
 * Output:  tests/report.md and screenshots in tests/screenshots/
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:4173/';
const OUT = path.join(__dirname, 'screenshots');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'project-data.json'), 'utf8'));
const GEOM = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'plan-geometry.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -  ' + detail : ''}`);
};
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const state = (p) =>
  p.evaluate(() => {
    const s = window.__spr.getState();
    return { introDone: s.introDone, section: s.section, step: s.step, floor: s.floorId, sel: s.selectedUnit, hov: s.hoveredUnit, open: s.detailOpen, ready: s.sceneReady, webgl: s.webgl, quality: s.quality };
  });
const scrollToId = (p, id, off = 0) =>
  p.evaluate(([id, off]) => {
    const el = document.getElementById(id);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + off);
  }, [id, off]);

(async () => {
  const browser = await chromium.launch({ args: GL_ARGS });
  const problems = [];
  const watch = (p, tag) => {
    p.on('console', (m) => m.type() === 'error' && problems.push(`${tag} console: ${m.text().slice(0, 200)}`));
    p.on('pageerror', (e) => problems.push(`${tag} pageerror: ${e.message}`));
    p.on('response', (r) => r.status() >= 400 && problems.push(`${tag} HTTP ${r.status()} ${r.url()}`));
  };

  /* ---------- data checks (source of truth) ---------- */
  const byFloor = {};
  for (const u of DATA.units) byFloor[u.floor] = (byFloor[u.floor] || 0) + 1;
  check('Exactly 26 residences in the project data', DATA.units.length === 26, `${DATA.units.length}`);
  check('Floor-wise distribution = 6/6/6/6 on 1st-4th + 2 on 5th (brochure pp.5, 15-21)', ['f1', 'f2', 'f3', 'f4'].every((f) => byFloor[f] === 6) && byFloor.f5 === 2, JSON.stringify(byFloor));
  const mix = {};
  for (const u of DATA.units) {
    const c = u.configuration || DATA.unitTypes[u.type].configuration;
    mix[c] = (mix[c] || 0) + 1;
  }
  check('Unit mix = 4 BHK x1, 3 BHK x13, 2 BHK x12 (brochure p.5)', mix['4 BHK'] === 1 && mix['3 BHK'] === 13 && mix['2 BHK'] === 12, JSON.stringify(mix));
  check('Typical floor plan traced into 6 residences A-F', ['A', 'B', 'C', 'D', 'E', 'F'].every((k) => GEOM.regions[k]?.polygon_px?.length >= 4));
  check('Seven levels represented (Stilt, 1st-5th, Terrace)', DATA.floors.length === 7, DATA.floors.map((f) => f.label).join(', '));

  /* ---------- desktop, first visit: intro ---------- */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page, 'desktop');
  await page.goto(BASE + '?quality=low', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__spr, null, { timeout: 30000 });
  check('Cinematic intro is shown on first visit', await page.isVisible('[data-testid=intro]'));
  await page.waitForFunction(() => window.__spr.getState().sceneReady, null, { timeout: 90000 });
  const t0 = await page.evaluate(() => window.__spr.introClock.t);
  await page.waitForTimeout(3500);
  const t1 = await page.evaluate(() => window.__spr.introClock.t);
  check('Intro animation is running', t1 > t0, `t ${t0.toFixed(3)} -> ${t1.toFixed(3)}`);
  await page.screenshot({ path: path.join(OUT, '01-intro.png') });
  await page.click('[data-testid=skip-intro]');
  await page.waitForTimeout(1600);
  let s = await state(page);
  check('Skip Intro works', s.introDone && !(await page.isVisible('[data-testid=skip-intro]')));
  check('3D building scene is rendering', s.webgl && s.ready && (await page.locator('[data-testid=stage] canvas').count()) === 1);
  await page.screenshot({ path: path.join(OUT, '02-hero.png') });

  /* ---------- explorer: scroll + buttons ---------- */
  await page.click('[data-testid=explore-building]');
  await page.waitForTimeout(2200);
  s = await state(page);
  check('"Explore Building" opens the 3D explorer', s.section === 'explore');
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(1200);
  const s1 = await state(page);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(1200);
  const s2 = await state(page);
  check('Mouse-wheel scrolling moves between floors', s2.step > s1.step && s1.step >= 1, `steps ${s1.step} -> ${s2.step} (${s1.floor} -> ${s2.floor})`);
  const railCount = await page.locator('[data-testid=floor-rail] .floor-btn').count();
  check('Floor rail lists all 7 levels', railCount === 7, `${railCount}`);
  await page.click('[data-testid=floor-btn-f3]');
  await page.waitForTimeout(2200);
  check('Direct floor selection (3rd Floor)', (await state(page)).floor === 'f3');
  await page.click('[data-testid=floor-next]');
  await page.waitForTimeout(1600);
  check('Next floor button', (await state(page)).floor === 'f4');
  await page.click('[data-testid=floor-prev]');
  await page.waitForTimeout(1600);
  check('Previous floor button', (await state(page)).floor === 'f3');
  const rows = await page.locator('[data-testid=unit-list] .unit-item').count();
  check('3rd floor lists 6 residences', rows === 6, `${rows}`);
  await page.screenshot({ path: path.join(OUT, '03-floor.png') });

  /* ---------- 2D <-> 3D synchronisation ---------- */
  await page.hover('.mini-plan [data-unit="3B"]');
  await page.waitForTimeout(500);
  check('Hover on the 2D plan highlights the same residence (shared state)', (await state(page)).hov === '3B');
  // find a residence in the 3D canvas by scanning for a hover hit
  let hit = null;
  for (let y = 240; y < 820 && !hit; y += 36) {
    for (let x = 240; x < 1010 && !hit; x += 36) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(40);
      const h = (await state(page)).hov;
      if (h && h.startsWith('3')) hit = { x, y, id: h };
    }
  }
  check('Hovering a residence in 3D shows it (raycast hit)', !!hit, hit ? `${hit.id} at ${hit.x},${hit.y}` : 'none');
  if (hit) {
    const planHover = await page.getAttribute(`.mini-plan [data-unit="${hit.id}"]`, 'class');
    check('3D hover is mirrored on the 2D plan', /hover/.test(planHover || ''), planHover || '');
    await page.screenshot({ path: path.join(OUT, '04-3d-hover.png') });
    await page.mouse.click(hit.x, hit.y);
    await page.waitForTimeout(1400);
    s = await state(page);
    check('Clicking a residence in 3D selects it and opens details', s.sel === hit.id && s.open);
    const cls = await page.getAttribute(`#plans [data-unit="${hit.id}"]`, 'class');
    check('3D selection is highlighted on the Floor Plans viewer', /selected/.test(cls || ''), cls || '');
    await page.screenshot({ path: path.join(OUT, '05-detail.png') });
    await page.click('[data-testid=detail-close]');
    await page.waitForTimeout(700);
  }
  await page.click('[data-testid=reset-view]');
  await page.waitForTimeout(1600);
  check('Reset building view', (await state(page)).step === 0);

  /* ---------- details for every unit type ---------- */
  await scrollToId(page, 'plans', -20);
  await page.waitForTimeout(1000);
  for (const k of Object.keys(DATA.unitTypes)) {
    const t = DATA.unitTypes[k];
    await page.click(`[data-testid=plan-tab-f1]`);
    await page.click(`[data-testid=plans-unit-1${k}]`);
    await page.waitForTimeout(900);
    const title = (await page.textContent('[data-testid=detail-title]')) || '';
    const areas = (await page.textContent('[data-testid=detail-areas]')) || '';
    const ok = title.includes(`Type ${k}`) && title.includes(t.configuration) && areas.includes(t.carpetAreaSqft.toLocaleString('en-IN')) && areas.includes(String(t.udsSqft));
    check(`Type ${k} details match the brochure (${t.configuration}, carpet ${t.carpetAreaSqft}, UDS ${t.udsSqft})`, ok, title.trim());
    if (k === 'A') {
      await page.click('[data-testid=detail-plan]');
      await page.waitForTimeout(1000);
      const nat = await page.evaluate(() => document.querySelector('.lightbox img')?.naturalWidth || 0);
      check('Original unit floor plan opens full screen', nat > 1000, `${nat}px wide`);
      await page.screenshot({ path: path.join(OUT, '06-plan-lightbox.png') });
      await page.click('[data-testid=lightbox-close]');
    }
    await page.click('[data-testid=detail-close]');
    await page.waitForTimeout(500);
  }
  await page.click('[data-testid=plan-tab-f5]');
  check('5th floor shows "layout not published" instead of an invented plan', await page.isVisible('[data-testid=f5-not-published]'));

  /* ---------- gallery & images ---------- */
  await scrollToId(page, 'gallery', -20);
  await page.waitForTimeout(800);
  await page.click('[data-testid=gallery-item-bedroom]');
  await page.waitForTimeout(900);
  check('Gallery opens the full-screen viewer', await page.isVisible('[data-testid=lightbox]'));
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.querySelectorAll('img').forEach((i) => (i.loading = 'eager')));
  for (const id of ['overview', 'plans', 'gallery', 'amenities', 'location', 'contact']) {
    await scrollToId(page, id);
    await page.waitForTimeout(500);
  }
  const imgs = await page.evaluate(async () => {
    const all = [...document.querySelectorAll('img')];
    await Promise.all(all.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    return { total: all.length, broken: all.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')) };
  });
  check('All original images load', imgs.broken.length === 0 && imgs.total > 20, `${imgs.total} images, broken: ${imgs.broken.join(', ') || 'none'}`);
  await ctx.close();

  /* ---------- return visit auto-skips the intro ---------- */
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx2.addInitScript(() => localStorage.setItem('spr.introSeen', '1'));
  const p2 = await ctx2.newPage();
  watch(p2, 'return');
  await p2.goto(BASE + '?quality=low', { waitUntil: 'load' });
  await p2.waitForFunction(() => window.__spr && window.__spr.getState().introDone, null, { timeout: 15000 }).catch(() => {});
  check('Return visit skips the intro automatically (Replay intro available)', (await state(p2)).introDone && (await p2.isVisible('[data-testid=replay-intro]')));
  await ctx2.close();

  /* ---------- mobile ---------- */
  const mctx = await browser.newContext({ ...devices['iPhone 13'] });
  await mctx.addInitScript(() => localStorage.setItem('spr.introSeen', '1'));
  const m = await mctx.newPage();
  watch(m, 'mobile');
  await m.goto(BASE, { waitUntil: 'load' });
  await m.waitForFunction(() => window.__spr && window.__spr.getState().introDone);
  check('Mobile starts in performance mode', (await state(m)).quality === 'low');
  await m.tap('[data-testid=explore-building]');
  await m.waitForTimeout(2000);
  await m.tap('[data-testid=floor-btn-f2]');
  await m.waitForTimeout(2000);
  await m.screenshot({ path: path.join(OUT, '07-mobile-floor.png') });
  await m.tap('[data-testid=unit-row-2C]');
  await m.waitForTimeout(1200);
  s = await state(m);
  check('Mobile: tap a residence opens its details', s.sel === '2C' && s.open);
  await m.screenshot({ path: path.join(OUT, '08-mobile-detail.png') });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('Mobile: no horizontal overflow', overflow <= 0, `${overflow}px`);
  await mctx.close();

  /* ---------- no-WebGL fallback ---------- */
  const fctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const f = await fctx.newPage();
  watch(f, 'fallback');
  await f.goto(BASE + '?mode=2d', { waitUntil: 'load' });
  await f.click('[data-testid=skip-intro]');
  await f.click('[data-testid=explore-building]');
  await f.waitForTimeout(1200);
  await f.click('[data-testid=floor-btn-f1]');
  await f.waitForTimeout(1400);
  await f.click('[data-testid=stage-2d] [data-unit="1D"]');
  await f.waitForTimeout(900);
  s = await state(f);
  check('Without WebGL the explorer still works on the original 2D plans', !s.webgl && s.sel === '1D' && s.open);
  await f.screenshot({ path: path.join(OUT, '09-fallback-2d.png') });
  await fctx.close();

  check('No console errors, page errors or failed requests', problems.length === 0, problems.slice(0, 5).join(' | '));
  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  const md = [
    '# Automated test report',
    '',
    `Run: ${new Date().toISOString()} against ${BASE}`,
    '',
    `**${passed} / ${results.length} checks passed.**`,
    '',
    '| Result | Check | Detail |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.ok ? '✅ PASS' : '❌ FAIL'} | ${r.name} | ${String(r.detail).replace(/\|/g, '/')} |`),
    '',
    'Screenshots: `tests/screenshots/`. They are rendered by a software GPU here, so a real device will look sharper and run smoother.',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(__dirname, 'report.md'), md);
  console.log(`\n${passed}/${results.length} passed - report written to tests/report.md`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
