// Screenshots of the replica for visual comparison.
// Usage: node scripts/shoot.mjs [baseUrl] [outDir]
// Requires the dev server (npm run dev) or preview server running.
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5306/';
const out = process.argv[3] ?? 'reference/shots/replica';
fs.mkdirSync(out, { recursive: true });

const shots = [
  ['lookup', '#/'],
  ['harbor-today', '#/track/harbor-shop'],
  ['harbor-step0', '#/track/harbor-shop?step=0'],
  ['harbor-step1', '#/track/harbor-shop?step=1'],
  ['harbor-step2', '#/track/harbor-shop?step=2'],
  ['harbor-step4', '#/track/harbor-shop?step=4'],
  ['harbor-step5', '#/track/harbor-shop?step=5'],
  ['atlas-site-done', '#/track/atlas-site'],
];

const browser = await chromium.launch();
for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: 2 });
  for (const [name, hash] of shots) {
    await page.goto('about:blank');
    await page.goto(base + hash);
    await page.waitForTimeout(3500); // let stage, label and map animations settle
    await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: process.argv.includes('--full') });
  }
  await page.close();
}
await browser.close();
console.log('saved to', out);
