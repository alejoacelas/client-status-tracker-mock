// Capture full-page screenshots of public pages into reference/.
// Usage: node tools/capture.mjs <url> <name> [width] [theme]
import { chromium } from 'playwright';
const [url, name, width = '1440', theme = 'dark'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: 900 }, colorScheme: theme, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(2500);
// scroll to trigger lazy content
for (let y = 0; y < 20000; y += 800) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(150); }
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
await page.screenshot({ path: `reference/shots/${name}.png`, fullPage: true });
const html = await page.content();
const fs = await import('fs');
fs.writeFileSync(`reference/html/${name}.rendered.html`, html);
await browser.close();
