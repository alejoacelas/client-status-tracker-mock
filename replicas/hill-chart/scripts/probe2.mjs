import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('https://basecamp.com/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
for (const v of ['to-dos', 'message-board', 'schedule']) {
  await page.click(`#hero-project-1 .project__open[data-view="${v}"]`, { force: true });
  await page.waitForTimeout(1200);
  await page.$('#hero-project-1').then(e => e.screenshot({ path: `reference/bc-view-${v}.png` }));
  const back = await page.$('#hero-project-1 .project__crumbs a, #hero-project-1 .project__crumbs button');
  if (back) { await back.click({ force: true }); await page.waitForTimeout(800); }
}
await browser.close();
