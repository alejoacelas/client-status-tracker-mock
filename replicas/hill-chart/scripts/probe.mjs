import { chromium } from 'playwright';
import fs from 'fs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('https://basecamp.com/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const el = await page.$('.project');
console.log('found', !!el);
const cands = await page.$$eval('[class*=project]', els => els.slice(0,15).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().width)));
console.log(cands.join('\n'));
if (el) { await el.screenshot({ path: 'reference/bc-project-mock.png' }); fs.writeFileSync('reference/raw/project-mock.html', await el.evaluate(e => e.outerHTML)); }
await browser.close();
