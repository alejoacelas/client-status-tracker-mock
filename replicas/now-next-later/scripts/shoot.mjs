// Screenshot the replica with headless Playwright.
// Usage: node scripts/shoot.mjs <hash-route> <out.png> [width] [fullPage:0|1]
import { chromium } from 'playwright';
const [route = '', out = 'shots/shot.png', width = '1440', full = '0'] = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:5304/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(base + '#/' + route, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: full === '1' });
if (errors.length) console.log('ERRORS', errors);
await browser.close();
