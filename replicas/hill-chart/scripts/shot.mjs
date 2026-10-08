// Usage: node scripts/shot.mjs <url> <out.png> [width] [fullPage]
import { chromium } from 'playwright';
const [url, out, width = '1440', full = '1'] = process.argv.slice(2);
const browser = await chromium.launch();
const w = Number(width);
const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: w < 600 ? 2 : 1 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.error(e.message));
await page.waitForTimeout(1500);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
