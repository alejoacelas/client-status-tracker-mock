// Smoke test for the deployed gallery: loads every design through the wrapper,
// checks navigation, the help popup, side arrows, link names and the comments
// panel, and fails on console errors, page errors or failed requests.
//
//   node scripts/check-gallery.mjs [base-url] [screenshot-dir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = (process.argv[2] ?? 'https://status-tracker-designs.vercel.app').replace(/\/$/, '');
const shots = process.argv[3];
if (shots) mkdirSync(shots, { recursive: true });
const order = ['now-next-later', 'statuspage', 'delivery-tracker', 'linear-updates', 'github-roadmap', 'hill-chart', 'portfolio-table'];
const problems = [];
const fail = (msg) => { problems.push(msg); console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

function watch(page, label) {
  page.on('console', (m) => { if (m.type() === 'error') fail(`${label}: console error: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => fail(`${label}: page error: ${e.message.slice(0, 200)}`));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('favicon')) fail(`${label}: ${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => fail(`${label}: request failed ${r.url()} (${r.failure()?.errorText})`));
}

async function frameReady(page, slug) {
  const frame = page.frameLocator('#frame');
  await page.waitForFunction((s) => document.getElementById('frame').getAttribute('src') === `/${s}/`, slug);
  await frame.locator('body').waitFor();
  await page.waitForTimeout(1200);
  const text = await frame.locator('body').innerText();
  return text.trim().length;
}

const browser = await chromium.launch();
for (const [width, height, tag] of [[1440, 900, 'desktop'], [390, 844, 'phone']]) {
  console.log(`\n${tag} (${width}px)`);
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  watch(page, tag);
  await page.goto(`${base}/`);

  if (await page.locator('#hint.open').isVisible()) ok('help popup shows on first visit'); else fail('help popup missing on first visit');
  await page.click('#close');
  if (await page.locator('#hint.open').isVisible()) fail('help popup did not close');

  const first = await page.textContent('#name');
  first === 'Now / Next / Later' ? ok('landing design is Now / Next / Later') : fail(`landing design is ${first}`);
  for (const id of ['#side-prev', '#side-next']) {
    if (!(await page.locator(id).isVisible())) fail(`${id} not visible`);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) fail('wrapper scrolls horizontally');

  for (const [i, slug] of order.entries()) {
    const chars = await frameReady(page, slug);
    chars > 50 ? ok(`${slug} renders (${chars} chars)`) : fail(`${slug} looks empty`);
    const count = await page.textContent('#count');
    if (count !== `${i + 1} / ${order.length}`) fail(`counter shows ${count} on ${slug}`);
    if (shots) await page.screenshot({ path: `${shots}/${tag}-${i + 1}-${slug}.png` });
    await page.click('#side-next');
  }
  await frameReady(page, order[0]);
  ok('side arrow wraps back to the first design');

  await page.keyboard.press('ArrowLeft');
  await frameReady(page, order.at(-1));
  ok('left arrow key goes back');

  await page.goto(`${base}/varun#hill-chart`);
  await frameReady(page, 'hill-chart');
  await page.click('#comments-btn');
  await page.waitForSelector('#drawer.open');
  const as = await page.textContent('#c-as');
  as === 'Commenting as Varun' ? ok('/varun names the commenter Varun') : fail(`link name shows "${as}"`);
  if (await page.locator('#c-name-label').isVisible()) fail('name field still visible with a link name');
  await page.waitForFunction(() => !document.getElementById('list').textContent.includes('Loading'));
  ok(`comments panel loads: "${(await page.textContent('#list')).slice(0, 40)}"`);
  await page.focus('#c-text');
  await page.keyboard.press('ArrowRight');
  if ((await page.textContent('#name')) !== 'Hill chart') fail('arrow keys switch designs while typing a comment');
  await page.click('#drawer-close');

  await page.goto(`${base}/varun/`);
  await frameReady(page, order[0]);
  ok('/varun/ (trailing slash) loads');

  for (const slug of order) {
    const p = await context.newPage();
    watch(p, `${tag} full ${slug}`);
    await p.goto(`${base}/${slug}/`);
    await p.waitForTimeout(1000);
    const chars = (await p.locator('body').innerText()).trim().length;
    chars > 50 ? ok(`full page ${slug}`) : fail(`full page ${slug} looks empty`);
    await p.close();
  }
  await context.close();
}
await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll checks passed');
process.exit(problems.length ? 1 : 0);
