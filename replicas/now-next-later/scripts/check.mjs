// Interaction smoke test for the replica. Run with the dev server up: node scripts/check.mjs
import { chromium } from 'playwright';

const base = process.env.BASE || 'http://localhost:5304/';
const browser = await chromium.launch();
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
};

async function fresh(width = 1440, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => ok(false, 'page error: ' + e.message));
  await page.goto(base + '#/portfolio/roadmap', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  return { ctx, page };
}

const titles = (page, col) => page.$$eval(`[data-drop-column="${col}"] [data-card-id] .card__title`, (els) => els.map((e) => e.textContent));

async function drag(page, fromSel, toSel, where = 'top') {
  await page.locator(fromSel).first().scrollIntoViewIfNeeded();
  const a = await page.locator(fromSel).first().boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + 20);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + 30, { steps: 3 });
  // Let the edge auto-scroll bring the target into view.
  for (let n = 0; n < 80; n++) {
    const b = await page.locator(toSel).first().boundingBox();
    if (b.y >= 0 && b.y + 20 <= 900) break;
    await page.mouse.move(a.x + a.width / 2, b.y < 0 ? 20 : 880, { steps: 2 });
    await page.waitForTimeout(40);
  }
  // Park the pointer mid-screen so the auto-scroll stops before measuring the target.
  await page.mouse.move(a.x + a.width / 2, 450, { steps: 2 });
  await page.waitForTimeout(150);
  const b = await page.locator(toSel).first().boundingBox();
  const ty = where === 'top' ? b.y + 10 : b.y + b.height / 2;
  await page.mouse.move(b.x + b.width / 2, ty, { steps: 12 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(150);
}

{
  const { ctx, page } = await fresh();
  ok((await titles(page, 'now')).length === 4 && (await titles(page, 'next')).length === 4 && (await titles(page, 'later')).length === 6, 'board loads 4 / 4 / 6 cards');

  // Move a card between columns, onto the top of Now.
  await drag(page, '[data-card-id="i-202"]', '[data-drop-column="now"] [data-card-id="i-201"]');
  let now = await titles(page, 'now');
  ok(now[0] === 'Content load and QA' && now.length === 5, 'drag Next → top of Now');
  ok(!(await page.locator('.overlay').count()), 'drag does not open the card');

  // Reorder inside a column: last card of Now to the top.
  await drag(page, '[data-drop-column="now"] [data-card-id="i-601"]', '[data-drop-column="now"] [data-card-id="i-202"]');
  now = await titles(page, 'now');
  ok(now[0] === 'Docs audit', 'reorder within Now');

  // Drop on the Completed segment opens the completion dialog.
  await drag(page, '[data-card-id="i-401"]', '.segmented button:first-child', 'mid');
  ok(await page.locator('[aria-label="Complete initiative"]').isVisible(), 'drop on Completed asks for outcome');
  await page.fill('#co', 'Board picked direction B.');
  await page.click('text=Complete initiative >> nth=-1');
  await page.waitForTimeout(120);
  ok(!(await titles(page, 'now')).includes('Client feedback on round two'), 'completed card leaves the board');
  await page.click('.segmented button:first-child');
  await page.waitForTimeout(120);
  ok((await page.locator('.card--complete').count()) === 12, 'Completed view shows 12 initiatives');
  ok((await page.locator('.card--complete .card__title').first().textContent()) === 'Client feedback on round two', 'newest completion listed first');
  await page.click('.segmented >> text=Candidates');
  await page.waitForTimeout(120);
  ok((await page.locator('.card--candidate').count()) === 3, 'Candidates view shows 3');
  await page.click('.segmented >> text=Roadmap');
  await page.waitForTimeout(120);

  // Open the canvas, edit, move with the Roadmap picker, close.
  await page.click('[data-card-id="i-301"]');
  await page.waitForTimeout(120);
  ok(await page.locator('.canvas').isVisible(), 'clicking a card opens the canvas');
  ok(page.url().includes('i=i-301'), 'canvas is linkable via the URL');
  await page.click('.canvas__title');
  await page.waitForTimeout(120);
  await page.fill('textarea.title-input', 'EHR integration (CareStack)');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  await page.click('.roadmap-select__btn');
  await page.waitForTimeout(120);
  await page.click('.dropdown >> text=Next');
  await page.waitForTimeout(120);
  await page.click('[aria-label="Make public"]');
  await page.waitForTimeout(120);
  await page.fill('.comment-box input', 'Escalated to Sam.');
  await page.click('.comment-box button');
  await page.waitForTimeout(120);
  ok((await page.locator('.update').count()) === 5, 'comment added');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);
  ok(!(await page.locator('.canvas').count()), 'Escape closes the canvas');
  ok((await titles(page, 'next'))[0] === 'EHR integration (CareStack)', 'title edit and column move persist on the board');

  // Filters.
  await page.click('text=Filters');
  await page.waitForTimeout(120);
  await page.click('.filter-group >> text=Refresh the Lumen brand');
  await page.waitForTimeout(120);
  const all = await page.$$eval('[data-card-id] .card__product', (els) => els.map((e) => e.textContent));
  ok(all.length > 0 && all.every((t) => t.endsWith('Brand refresh')), 'objective filter narrows to Lumen cards');
  await page.click('text=Reset');
  await page.waitForTimeout(120);
  ok((await page.locator('[data-drop-column] [data-card-id]').count()) === 13, 'reset filters shows all 13 roadmap cards');
  await page.fill('.filters-panel input.text-input', 'launch');
  ok((await page.locator('[data-drop-column] [data-card-id]').count()) === 1, 'title search filter');
  await page.click('text=Reset');
  await page.waitForTimeout(120);
  await page.click('.pill-btn >> text=Filters');
  await page.waitForTimeout(120);

  // Display options.
  await page.click('text=Display options');
  await page.waitForTimeout(120);
  await page.click('.dropdown >> text=Collapsed');
  await page.waitForTimeout(120);
  ok((await page.locator('.card__desc').count()) === 0, 'Collapsed view hides descriptions');
  await page.click('.dropdown >> text=Detailed');
  await page.waitForTimeout(120);
  ok((await page.locator('.card__ideas').count()) > 0, 'Detailed view lists linked ideas');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(120);

  // Group by objective.
  await page.click('[aria-label="Group by objective"]');
  await page.waitForTimeout(120);
  ok((await page.locator('.gbo-row').count()) >= 5, 'group by objective shows objective rows');
  await page.click('[aria-label="Group by objective"]');
  await page.waitForTimeout(120);

  // Persistence.
  await page.reload({ waitUntil: 'networkidle' });
  ok((await titles(page, 'next'))[0] === 'EHR integration (CareStack)', 'changes persist after reload');

  // Published page: EHR integration was made internal above, so the client no longer sees it.
  await page.goto(base + '#/p/VHw8sw4Rlx83', { waitUntil: 'networkidle' });
  const pub = await page.$$eval('.pub-card__title', (els) => els.map((e) => e.textContent));
  ok(pub.length > 0 && !pub.some((t) => t.startsWith('EHR')), 'published page hides internal initiatives');
  ok(!(await page.content()).includes('CareStack still'), 'published page never shows internal notes');
  ok((await page.locator('.side-nav').count()) === 0, 'published page has no app chrome');
  await page.goto(base + '#/p/nope', { waitUntil: 'networkidle' });
  ok(await page.locator('text=Roadmap not found').isVisible(), 'unknown token shows not-found');
  await ctx.close();
}

// Touch drag at phone width: long press, then move. Synthetic events drive the same code path
// a phone uses (pointerdown with pointerType "touch", then touchmove/touchend).
{
  const { ctx, page } = await fresh(390, { hasTouch: true, isMobile: true });
  await page.locator('[data-card-id="i-202"]').scrollIntoViewIfNeeded();
  const a = await page.locator('[data-card-id="i-202"]').boundingBox();
  await page.evaluate(([x, y]) => {
    const el = document.querySelector('[data-card-id="i-202"]');
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', isPrimary: true, button: 0, clientX: x, clientY: y }));
  }, [a.x + 50, a.y + 30]);
  await page.waitForTimeout(400);
  ok((await page.locator('.drag-ghost').count()) === 1, 'long press starts a touch drag');
  const touchAt = (x, y, type = 'touchmove') =>
    page.evaluate(([x, y, type]) => {
      const t = new Touch({ identifier: 1, target: document.body, clientX: x, clientY: y });
      window.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], changedTouches: [t] }));
    }, [x, y, type]);
  // Hold near the top edge so the page auto-scrolls up to the Now column.
  for (let n = 0; n < 200; n++) {
    await touchAt(a.x + 50, 20);
    await page.waitForTimeout(20);
    if ((await page.evaluate(() => window.scrollY)) === 0) break;
  }
  await touchAt(a.x + 50, 450);
  await page.waitForTimeout(100);
  const b = await page.locator('[data-drop-column="now"] [data-card-id="i-201"]').boundingBox();
  await touchAt(b.x + 50, b.y + 10);
  await page.waitForTimeout(100);
  await touchAt(b.x + 50, b.y + 10, 'touchend');
  await page.waitForTimeout(200);
  const now = await titles(page, 'now');
  ok(now[0] === 'Content load and QA', `touch drag moves a card to the top of Now at 390px (Now: ${now.join(', ')})`);
  ok(!(await page.locator('.overlay').count()), 'touch drag does not open the card');
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
