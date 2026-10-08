// Dump text leaves and boxed elements within the first element matching a selector.
// Usage: node tools/dump.mjs <url> <scrollY> <css selector> [index]
import { chromium } from 'playwright';
const [url, scrollY, sel, idx = '0'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
for (let y = 0; y <= +scrollY; y += 400) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
await page.waitForTimeout(2500);
const out = await page.evaluate(({ sel, idx }) => {
  let root;
  if (sel.startsWith('text=')) {
    const t = sel.slice(5);
    for (const el of document.querySelectorAll('body *')) { const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); if (own === t) { root = el; break; } }
    for (let i = 0; i < +idx && root; i++) root = root.parentElement;
  } else root = document.querySelectorAll(sel)[+idx];
  if (!root) return 'no root';
  const R = root.getBoundingClientRect();
  const lines = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const boxed = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px' || cs.borderBottomWidth !== '0px' || cs.boxShadow !== 'none';
    if (!own && !boxed && el.tagName !== 'svg') continue;
    const cls = typeof el.className === 'string' ? el.className.replace(/sc-\w+ /,'').slice(0, 40) : '';
    let s = `${el.tagName.toLowerCase()}.${cls} [${Math.round(r.x - R.x)},${Math.round(r.y - R.y)} ${Math.round(r.width)}x${Math.round(r.height)}]`;
    if (own) s += ` "${own.slice(0, 50)}" ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.color}${cs.letterSpacing !== 'normal' ? ' ls' + cs.letterSpacing : ''}`;
    if (el.tagName === 'svg') s += ` svg color=${cs.color} fill=${el.getAttribute('fill')}`;
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') s += ` bg=${cs.backgroundColor}`;
    if (cs.borderTopWidth !== '0px' || cs.borderBottomWidth !== '0px') s += ` border=${cs.borderTop}|${cs.borderBottom}`;
    if (cs.borderRadius !== '0px') s += ` r=${cs.borderRadius}`;
    if (cs.padding !== '0px') s += ` pad=${cs.padding}`;
    if (cs.boxShadow !== 'none') s += ` sh=${cs.boxShadow.slice(0, 100)}`;
    if (cs.opacity !== '1') s += ` op=${cs.opacity}`;
    lines.push(s);
  }
  return lines.join('\n');
}, { sel, idx });
console.log(out);
await browser.close();
