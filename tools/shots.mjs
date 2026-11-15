// Loads the site in headless Chromium at several screen shapes and saves a screenshot of each, with the start-up
// timings and any page errors. Serve the site first (npm run serve). Usage:
//   node tools/shots.mjs [base url] [out dir] [WxH,WxH,...] [seconds]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:8080/';
const out = process.argv[3] || 'shots';
const sizes = (process.argv[4] || '1440x900,1280x720,1720x720,900x900,600x900,390x844').split(',').map((s) => s.split('x').map(Number));
const secs = +(process.argv[5] || 14);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + (base.includes('?') ? '&' : '?') + 'seed=7');
  await page.waitForTimeout(secs * 1000);
  const timing = await page.evaluate(() => window.__timing || []);
  await page.screenshot({ path: `${out}/${w}x${h}.png` });
  console.log(`${w}x${h}`, timing.map((e) => `${e[0]} ${e[1]}`).join(' | '), errors.length ? '\n  errors: ' + errors.join('\n  ') : '');
  await page.close();
}
await browser.close();
