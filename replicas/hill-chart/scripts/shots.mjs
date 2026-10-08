// Usage: node scripts/shots.mjs <outdir> <route>... (routes like /p/harbor-shop/todos)
import { chromium } from 'playwright';
const [outdir, ...routes] = process.argv.slice(2);
const browser = await chromium.launch();
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: w < 600 ? 2 : 1 });
  for (const r of routes) {
    await page.goto(`http://localhost:5305/#${r}`);
    await page.waitForTimeout(900);
    const name = r.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
    await page.screenshot({ path: `${outdir}/${name}-${w}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
