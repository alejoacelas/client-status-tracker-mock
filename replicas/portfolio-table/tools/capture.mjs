// Render a public page headlessly, save a full-page screenshot, its text and image URLs.
// Usage: node tools/capture.mjs <url> <outPrefix> [width]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, width = '1440'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.error('goto', e.message));
await page.waitForTimeout(4000);
for (let y = 0; y < 20000; y += 800) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(150); }
const text = await page.evaluate(() => document.body.innerText);
const imgs = await page.locator("img").evaluateAll(els => els.map(i => ({ src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight })).filter(i => !/cookielaw|EC_|\.svg/.test(i.src)));
fs.writeFileSync(out + '.txt', text);
fs.writeFileSync(out + '.imgs.json', JSON.stringify(imgs, null, 1));
await page.screenshot({ path: out + '.png', fullPage: false });
console.log(out, text.length, 'chars', imgs.length, 'imgs');
await browser.close();
