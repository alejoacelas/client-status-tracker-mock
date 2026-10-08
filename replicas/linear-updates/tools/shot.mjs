// Screenshot the replica: node tools/shot.mjs <hashRoute> <outName> [width=1440] [theme=dark] [height=900]
import { chromium } from 'playwright';
const [route, name, width = '1440', theme = 'dark', height = '900'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: +height }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript((t) => { try { localStorage.setItem('fw-linear-theme', t); } catch {} }, theme);
await page.goto(`http://localhost:5303/#/${route}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: `reference/mine/${name}.png` });
if (errors.length) console.log('ERRORS:', errors.join('\n'));
await browser.close();
