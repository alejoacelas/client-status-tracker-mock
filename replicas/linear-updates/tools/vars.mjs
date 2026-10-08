// Print CSS custom properties defined on :root for a theme: node tools/vars.mjs <url> <dark|light>
import { chromium } from 'playwright';
const [url, theme] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
const vars = await page.evaluate(() => {
  const names = new Set();
  for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch { continue; }
    const walk = (rs) => { for (const r of rs) { if (r.style) for (const p of r.style) if (p.startsWith('--')) names.add(p); if (r.cssRules) walk(r.cssRules); } }; walk(rules); }
  const cs = getComputedStyle(document.documentElement);
  return [...names].sort().map(n => `${n}: ${cs.getPropertyValue(n).trim()}`).filter(l => !l.endsWith(': ')).join('\n');
});
console.log(vars);
await browser.close();
