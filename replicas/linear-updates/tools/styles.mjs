// Dump computed styles for elements whose own text matches given strings.
// Usage: node tools/styles.mjs <url> <scrollY> "text1|text2|..."
import { chromium } from 'playwright';
const [url, scrollY, texts] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.evaluate((v) => window.scrollTo(0, +v), scrollY);
await page.waitForTimeout(2500);
const out = await page.evaluate((list) => {
  const res = [];
  const want = list.split('|');
  const all = document.querySelectorAll('body *');
  for (const t of want) {
    let found = null;
    for (const el of all) {
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      if (own === t) { found = el; break; }
    }
    if (!found) { res.push({ t, missing: true }); continue; }
    const chain = [];
    let el = found;
    for (let i = 0; i < 6 && el; i++, el = el.parentElement) {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      chain.push({ tag: el.tagName, cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 60),
        box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        color: cs.color, bg: cs.backgroundColor, font: `${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.slice(0, 40)}`, ls: cs.letterSpacing,
        pad: cs.padding, radius: cs.borderRadius, border: cs.borderTopWidth !== '0px' || cs.borderBottomWidth !== '0px' ? `${cs.borderTop} | ${cs.borderBottom}` : '', gap: cs.gap, shadow: cs.boxShadow === 'none' ? '' : cs.boxShadow.slice(0, 120), opacity: cs.opacity });
    }
    res.push({ t, chain });
  }
  return res;
}, texts);
console.log(JSON.stringify(out, null, 1));
await browser.close();
