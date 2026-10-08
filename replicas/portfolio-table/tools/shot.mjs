// Screenshot the running replica: node tools/shot.mjs <hash> <out.png> [width] [height] [script.js]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [hash, out, width = '1440', height = '900', script] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: +height }, deviceScaleFactor: Number(process.env.DPR ?? 1) });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5307/#' + hash);
await page.waitForTimeout(400);
if (script) {
  const fn = new Function('page', 'return (async () => {' + fs.readFileSync(script, 'utf8') + '})()');
  await fn(page);
  await page.waitForTimeout(300);
}
await page.screenshot({ path: out });
if (errors.length) console.log('ERRORS:', errors.join('\n'));
await browser.close();
