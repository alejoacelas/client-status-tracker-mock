// Viewport screenshots at successive scroll positions: node tools/capture-scroll.mjs <url> <name> [width] [steps]
import { chromium } from 'playwright';
const [url, name, width = '1440', steps = '12'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: 900 }, colorScheme: 'dark' });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
for (let i = 0; i < +steps; i++) {
  await page.evaluate((v) => window.scrollTo(0, v), i * 800);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `reference/shots/${name}_s${String(i).padStart(2, '0')}.png` });
}
await browser.close();
