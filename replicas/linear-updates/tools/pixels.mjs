// Top colours in a rectangle of a local image: node tools/pixels.mjs <png> x y w h
import { chromium } from 'playwright';
import fs from 'fs';
const [file, x, y, w, h] = process.argv.slice(2);
const b64 = fs.readFileSync(file).toString('base64');
const browser = await chromium.launch();
const page = await browser.newPage();
const res = await page.evaluate(async ({ b64, x, y, w, h }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(+x, +y, +w, +h).data; const m = new Map();
  for (let i = 0; i < d.length; i += 4) { const k = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); m.set(k, (m.get(k) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}, { b64, x, y, w, h });
console.log(res.map(([k, n]) => `${k}:${n}`).join(' '));
await browser.close();
