// End-to-end check of the hill chart interactions (mouse and touch). Run with the dev server up.
import { chromium } from 'playwright';
const BASE = 'http://localhost:5305/';
const out = process.argv[2] || 'reference/shots';
const browser = await chromium.launch();
const log = (...a) => console.log(...a);
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1; };

async function dotInfo(page, name) {
  return page.evaluate((name) => {
    const g = [...document.querySelectorAll('.hillbox .hill__dot')].find((g) => g.querySelector('text')?.textContent === name);
    if (!g) return null;
    const c = g.querySelector('.hill__circle');
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, val: g.getAttribute('aria-valuenow'), faded: g.classList.contains('hill__dot--faded') };
  }, name);
}

// ---------- desktop, mouse ----------
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => fail('page error ' + e.message));
  await page.goto(BASE + '#/p/harbor-shop/todos');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  if (!(await page.getByText('Drag each dot to adjust its position on the chart').isVisible())) fail('edit mode text');
  const before = await dotInfo(page, 'Launch');
  log('Launch before', before);
  const svgBox = await page.locator('.hillbox .hill').boundingBox();
  const targetX = svgBox.x + svgBox.width * 0.32;
  await page.mouse.move(before.x, before.y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(before.x + ((targetX - before.x) * i) / 12, before.y - 40, { steps: 2 });
  const mid = await dotInfo(page, 'Launch');
  log('Launch while dragging', mid);
  if (!mid.faded) fail('label should fade while dragging');
  await page.mouse.up();
  const after = await dotInfo(page, 'Launch');
  log('Launch after', after);
  if (!(Number(after.val) > 20 && Number(after.val) < 40)) fail('mouse drag did not move dot to ~30');
  await page.screenshot({ path: `${out}/i-edit-1440.png` });
  // keyboard: focus a dot and nudge it
  await page.locator('.hillbox .hill__dot[aria-label="Content load & QA"]').focus();
  const k0 = Number(await page.locator('.hillbox .hill__dot[aria-label="Content load & QA"]').getAttribute('aria-valuenow'));
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  const k1 = Number(await page.locator('.hillbox .hill__dot[aria-label="Content load & QA"]').getAttribute('aria-valuenow'));
  log('keyboard', k0, '->', k1);
  if (k1 !== k0 + 8) fail('keyboard nudging');
  await page.getByRole('button', { name: 'Save this update' }).click();
  await page.getByPlaceholder('Write a note about this update…').fill('Launch planning has started: redirects list drafted.');
  await page.screenshot({ path: `${out}/i-note-1440.png` });
  await page.getByRole('button', { name: 'Add this note' }).click();
  const pager = await page.locator('.hillbox__pager').innerText();
  const status = await page.locator('.hillbox__status').innerText();
  log('pager', pager.replace(/\s+/g, ' '), '| status', status);
  if (!pager.includes('6/6')) fail('pager should show 6/6');
  if (!status.includes('a second ago')) fail('status should say a second ago');
  // step back to the previous snapshot
  await page.getByRole('button', { name: 'Previous update' }).click();
  await page.waitForTimeout(900);
  const back = await page.evaluate(() => {
    const g = [...document.querySelectorAll('.hillbox .hill__dot')].find((g) => g.querySelector('text')?.textContent === 'Launch');
    return g.querySelector('.hill__circle').getAttribute('cx');
  });
  const prevStatus = await page.locator('.hillbox__status').innerText();
  log('after stepping back: Launch cx', back, '| status', prevStatus);
  if (!prevStatus.includes('Monday')) fail('previous snapshot should be Monday');
  await page.getByRole('button', { name: 'Next update' }).click();
  await page.waitForTimeout(900);
  // history page shows the note first
  await page.getByRole('link', { name: 'See history' }).click();
  await page.waitForTimeout(500);
  const firstNote = await page.locator('.hcard__note').first().innerText();
  log('history first note:', firstNote);
  if (!firstNote.startsWith('Launch planning')) fail('note missing in history');
  const day = await page.locator('.hday__title').first().innerText();
  log('first day heading', day);
  // discuss
  await page.locator('.hcard').first().getByRole('button', { name: 'Discuss' }).click();
  await page.locator('.hcard').first().getByPlaceholder('Add a comment…').fill('Nice progress.');
  await page.locator('.hcard').first().getByRole('button', { name: 'Add this comment' }).click();
  if ((await page.locator('.hcard').first().locator('.comment:not(.comment--new)').count()) !== 1) fail('comment not added');
  await page.screenshot({ path: `${out}/i-history-1440.png` });
  // track / untrack and new list
  await page.goto(BASE + '#/p/harbor-shop/todos');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Options for Launch' }).click();
  await page.getByRole('menuitem', { name: 'Stop tracking on the Hill Chart' }).click();
  await page.waitForTimeout(800);
  if (await dotInfo(page, 'Launch')) fail('untracked list still on chart');
  await page.getByRole('button', { name: 'New list' }).click();
  await page.getByLabel('List name').fill('Wholesale portal');
  await page.getByRole('button', { name: 'Add this list' }).click();
  await page.waitForTimeout(800);
  const nl = await dotInfo(page, 'Wholesale portal');
  log('new tracked list dot', nl);
  if (!nl) fail('new tracked list should appear on the chart');
  // to-do toggling and adding
  const cp = page.locator('#h-checkout');
  const doneBefore = await cp.locator('.todo-completed').innerText();
  await cp.getByRole('checkbox', { name: 'Connect the live payment account' }).click();
  const doneAfter = await cp.locator('.todo-completed').innerText();
  log('completed', doneBefore, '->', doneAfter);
  if (doneBefore === doneAfter) fail('toggle did not change completed count');
  await cp.getByRole('button', { name: 'Add a to-do' }).click();
  await cp.getByLabel('To-do').fill('Receipt emails for refunds');
  await cp.getByRole('button', { name: 'Add this to-do' }).click();
  if (!(await cp.getByText('Receipt emails for refunds').isVisible())) fail('to-do not added');
  // persistence across reload
  await page.reload();
  await page.waitForTimeout(500);
  if (!(await page.locator('.hillbox__pager').innerText()).includes('6/6')) fail('snapshot not persisted');
  if (!(await dotInfo(page, 'Wholesale portal'))) fail('new list not persisted');
  await page.screenshot({ path: `${out}/i-after-1440.png`, fullPage: false });
  await page.close();
}

// ---------- phone, touch ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fail('page error ' + e.message));
  await page.goto(BASE + '#/p/meridian-portal/todos');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Update', exact: true }).tap();
  await page.waitForTimeout(200);
  const d = await dotInfo(page, 'EHR integration');
  log('EHR before', d);
  const cdp = await ctx.newCDPSession(page);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  const tp = (x, y) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(d.x, d.y) });
  for (let i = 1; i <= 15; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(d.x + i * 9, d.y + i * 3) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(100);
  const a = await dotInfo(page, 'EHR integration');
  const scrollAfter = await page.evaluate(() => window.scrollY);
  log('EHR after touch drag', a, 'scroll', scrollBefore, '->', scrollAfter);
  if (!(Number(a.val) > Number(d.val) + 20)) fail('touch drag did not move the dot');
  if (scrollAfter !== scrollBefore) fail('page scrolled during touch drag');
  await page.screenshot({ path: `${out}/i-touch-390.png` });
  await page.getByRole('button', { name: 'Save this update' }).tap();
  await page.getByRole('button', { name: 'No thanks' }).tap();
  if (!(await page.locator('.hillbox__pager').innerText()).includes('6/6')) fail('touch save');
  // jump menu
  await page.getByRole('button', { name: /Fieldwork Studio/ }).tap();
  await page.screenshot({ path: `${out}/i-menu-390.png` });
  await page.getByRole('link', { name: /Brand refresh/ }).tap();
  await page.waitForTimeout(300);
  log('menu navigated to', await page.evaluate(() => location.hash));
  await ctx.close();
}
await browser.close();
log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL CHECKS PASSED');
