// Click through the replica's main interactions and report failures.
// Usage: node tools/interactions.mjs [baseUrl]
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5307/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const results = [];
async function step(name, fn) {
  try { await fn(); results.push('ok   ' + name); }
  catch (e) { results.push('FAIL ' + name + ': ' + e.message.split('\n')[0]); }
}
const go = async (h) => { await page.goto(base + '#' + h); await page.waitForTimeout(250); };
const cellIn = (rowText, colIndex) => page.locator('.trow', { hasText: rowText }).first().locator('.cell').nth(colIndex);
const colIdx = async (label) => {
  const labels = await page.locator('.thead .th').allInnerTexts();
  const i = labels.findIndex((l) => l.trim() === label);
  if (i < 0) throw new Error('no column ' + label + ' in ' + labels.join('|'));
  return i;
};

await go('/portfolio/all-clients/list');
await page.evaluate(() => localStorage.clear());
await go('/portfolio/all-clients/list');

await step('list renders nested rows', async () => {
  const n = await page.locator('.trow:not(.thead)').count();
  if (n !== 9) throw new Error('expected 9 rows, got ' + n);
});
await step('collapse a client portfolio', async () => {
  await page.locator('.trow', { hasText: 'Harbor & Pine Coffee' }).locator('.expand-btn').click();
  const n = await page.locator('.trow:not(.thead)').count();
  if (n !== 8) throw new Error('rows ' + n);
  await page.locator('.trow', { hasText: 'Harbor & Pine Coffee' }).locator('.expand-btn').click();
});
await step('edit priority inline', async () => {
  const i = await colIdx('Priority');
  await cellIn('Online shop rebuild', i).click();
  await page.locator('.popover .menu-item', { hasText: 'Low' }).click();
  const t = await cellIn('Online shop rebuild', i).innerText();
  if (!t.includes('Low')) throw new Error('got ' + t);
});
await step('change owner', async () => {
  const i = await colIdx('Owner');
  await cellIn('Brand refresh', i).click();
  await page.locator('.popover input').fill('Tom');
  await page.keyboard.press('Enter');
  const t = await cellIn('Brand refresh', i).innerText();
  if (!t.includes('Tom Okafor')) throw new Error('got ' + t);
});
await step('change dates with picker', async () => {
  const i = await colIdx('Due date');
  await cellIn('Developer docs migration', i).click();
  await page.locator('.dp-field', { hasText: 'Dec' }).click();
  await page.locator('.dp-day:not(.out)', { hasText: /^20$/ }).first().click();
  await page.locator('.popover button', { hasText: 'Done' }).click();
  const t = await cellIn('Developer docs migration', i).innerText();
  if (!t.includes('20 Dec')) throw new Error('got ' + t);
});
await step('sort by column header menu', async () => {
  await page.locator('.thead .th', { hasText: 'Task progress' }).locator('.th-label').click();
  await page.locator('.popover .menu-item', { hasText: 'Sort descending' }).click();
  const first = await page.locator('.trow:not(.thead) .name-link').first().innerText();
  if (first !== 'Atlas Robotics' && first !== 'Meridian Family Clinic') throw new Error('first ' + first);
  if (!(await page.locator('.chip-btn', { hasText: 'Sorts: 1' }).count())) throw new Error('no sort chip');
  await page.locator('.chip-btn', { hasText: 'Sorts' }).locator('button').nth(1).click();
});
await step('resize a column', async () => {
  const th = page.locator('.thead .th', { hasText: 'Status' });
  const before = (await th.boundingBox()).width;
  const h = th.locator('.resize-handle');
  const b = await h.boundingBox();
  await page.mouse.move(b.x + 3, b.y + 10);
  await page.mouse.down();
  await page.mouse.move(b.x + 83, b.y + 10, { steps: 5 });
  await page.mouse.up();
  const after = (await th.boundingBox()).width;
  if (after - before < 60) throw new Error(`width ${before} -> ${after}`);
});
await step('add a text field', async () => {
  await page.locator('.add-field-btn').click();
  await page.locator('.popover .menu-item', { hasText: 'Text' }).click();
  await page.locator('.modal input.input').first().fill('Next client call');
  await page.locator('.modal button', { hasText: 'Create field' }).click();
  const i = await colIdx('Next client call');
  await cellIn('Brand refresh', i).click();
  await page.locator('.cell-input').fill('9 Oct board review');
  await page.keyboard.press('Enter');
  const t = await cellIn('Brand refresh', i).innerText();
  if (!t.includes('9 Oct board')) throw new Error('got ' + t);
});
await step('add a single-select field with options', async () => {
  await page.locator('.add-field-btn').click();
  await page.locator('.popover .menu-item', { hasText: 'Single-select' }).click();
  await page.locator('.modal input.input').first().fill('Budget health');
  await page.locator('.modal button', { hasText: 'Create field' }).click();
  const i = await colIdx('Budget health');
  await cellIn('Patient intake portal', i).click();
  await page.locator('.popover .menu-item', { hasText: 'Option 2' }).click();
  const t = await cellIn('Patient intake portal', i).innerText();
  if (!t.includes('Option 2')) throw new Error('got ' + t);
});
await step('hide column via header menu', async () => {
  await page.locator('.thead .th', { hasText: 'Phase' }).locator('.th-caret').click({ force: true });
  await page.locator('.popover .menu-item', { hasText: 'Hide column' }).click();
  if (await page.locator('.thead .th', { hasText: 'Phase' }).count()) throw new Error('still visible');
});
await step('customize pane re-shows column', async () => {
  await page.locator('button', { hasText: 'Customize' }).click();
  const item = page.locator('.field-item', { hasText: 'Phase' });
  await item.locator('.toggle').click();
  if (!(await page.locator('.thead .th', { hasText: 'Phase' }).count())) throw new Error('not shown');
  await page.locator('.customize-pane .pane-head .icon-btn').click();
});
await step('filter by status', async () => {
  await page.locator('.toolbar button', { hasText: 'Filter' }).click();
  await page.locator('.popover button', { hasText: 'Add filter' }).click();
  await page.locator('.popover .select', { hasText: 'Select value' }).click();
  await page.locator('.popover .menu-item', { hasText: 'At risk' }).last().click();
  await page.keyboard.press('Escape');
  const names = await page.locator('.trow:not(.thead) .name-link').allInnerTexts();
  if (names.join() !== 'Meridian Family Clinic,Patient intake portal') throw new Error(names.join());
  await page.locator('.chip-btn', { hasText: 'Filters' }).locator('button').nth(1).click();
});
await step('group by status', async () => {
  await page.locator('.toolbar button', { hasText: 'Group' }).click();
  await page.locator('.popover .menu-item', { hasText: 'Status' }).click();
  const g = await page.locator('.group-row').count();
  if (g < 3) throw new Error('groups ' + g);
  await page.locator('.chip-btn', { hasText: 'Group' }).locator('button').nth(1).click();
});
await step('details pane shows latest status', async () => {
  const row = page.locator('.trow', { hasText: 'Patient intake portal' });
  await row.hover();
  await row.locator('.details-btn').click();
  await page.locator('.details-pane .status-card').waitFor();
  const t = await page.locator('.details-pane .sc-title').innerText();
  if (!t.includes('5 Oct')) throw new Error(t);
  await page.locator('.details-pane button[aria-label="Close details"]').click();
});
await step('rename via context menu', async () => {
  await page.locator('.trow', { hasText: 'Investor website' }).click({ button: 'right' });
  await page.locator('.popover .menu-item', { hasText: 'Rename project' }).click();
  await page.locator('.name-input').fill('Investor website v1');
  await page.keyboard.press('Enter');
  if (!(await page.locator('.name-link', { hasText: 'Investor website v1' }).count())) throw new Error('not renamed');
});
await step('create new project inline', async () => {
  await page.locator('.create-row').click();
  await page.locator('.name-input').fill('Loyalty app');
  await page.keyboard.press('Enter');
  if (!(await page.locator('.name-link', { hasText: 'Loyalty app' }).count())) throw new Error('not created');
});
await step('status cell opens composer and posts', async () => {
  const i = await colIdx('Status');
  await cellIn('Online shop rebuild', i).click();
  await page.locator('.popover .menu-item', { hasText: 'At risk' }).first().click();
  await page.waitForURL(/compose\/project\/harbor-shop\/at_risk/);
  await page.locator('.cs-text').first().fill('Stripe access still pending; checkout testing slips a week.');
  await page.locator('.hl-card', { hasText: 'milestones completed' }).click();
  await page.locator('.composer-bar button', { hasText: 'Post' }).click();
  await page.waitForURL(/project\/harbor-shop/);
  const chip = await page.locator('.ph-status').innerText();
  if (!chip.includes('At risk')) throw new Error('chip ' + chip);
});
await step('posted update visible in detail page', async () => {
  await page.locator('.po-feed a').first().click();
  await page.waitForURL(/update\//);
  const t = await page.locator('.su-text').first().innerText();
  if (!t.includes('Stripe access')) throw new Error(t);
  if (!(await page.locator('.hl-block', { hasText: 'Completed milestones' }).count())) throw new Error('no highlight');
});
await step('like and comment on update', async () => {
  await page.locator('.composer-actions button[aria-label="Like"]').click();
  await page.locator('.comment-input').click();
  await page.locator('.comment-input').fill('Thanks, I will chase Dana.');
  await page.locator('.comment-foot button', { hasText: 'Comment' }).click();
  if (!(await page.locator('.comment-text', { hasText: 'chase Dana' }).count())) throw new Error('no comment');
  if (!(await page.locator('.likes-line').count())) throw new Error('no like');
});
await step('composer requires status', async () => {
  await go('/compose/portfolio/lumen');
  await page.locator('.composer-bar button', { hasText: 'Post' }).click();
  if (!(await page.locator('.form-error', { hasText: 'Status is required' }).count())) throw new Error('no validation');
  await page.locator('.status-picker').click();
  await page.locator('.popover .menu-item', { hasText: 'On hold' }).click();
  await page.locator('.composer-bar button', { hasText: 'Post' }).click();
  await page.waitForURL(/portfolio\/lumen\/progress/);
  const h = await page.locator('.pv-headline').innerText();
  if (!h.includes('on hold')) throw new Error(h);
});
await step('progress count card filters list', async () => {
  await go('/portfolio/all-clients/progress');
  await page.locator('.pv-count', { hasText: 'Project off track' }).click();
  await page.waitForURL(/list/);
  const names = await page.locator('.trow:not(.thead) .name-link').allInnerTexts();
  if (names.length !== 0 && !names.join().includes('Lumen')) throw new Error(names.join());
  await page.locator('.chip-btn', { hasText: 'Filters' }).locator('button').nth(1).click();
});
await step('timeline drag moves a bar', async () => {
  await go('/portfolio/atlas/timeline');
  const bar = page.locator('.tl-bar').nth(1);
  const b = await bar.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + 10);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 70, b.y + 10, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const after = await bar.boundingBox();
  if (Math.abs(after.x - b.x) < 40) throw new Error(`x ${b.x} -> ${after.x}`);
});
await step('timeline zoom to days', async () => {
  await page.locator('.tl-tools button', { hasText: 'Weeks' }).click();
  await page.locator('.popover .menu-item', { hasText: 'Days' }).click();
  if (!(await page.locator('.tl-ms-label').count())) throw new Error('no milestone labels');
});
await step('dashboard remove and re-add chart', async () => {
  await go('/portfolio/all-clients/dashboard');
  const n = await page.locator('.dash-card').count();
  await page.locator('.dash-card').first().locator('.icon-btn').click();
  await page.locator('.popover .menu-item', { hasText: 'Remove chart' }).click();
  if ((await page.locator('.dash-card').count()) !== n - 1) throw new Error('not removed');
  await page.locator('button', { hasText: 'Add chart' }).click();
  await page.locator('.chart-option', { hasText: 'Projects by priority' }).click();
  if ((await page.locator('.dash-card').count()) !== n) throw new Error('not added');
});
await step('sidebar navigation and search', async () => {
  await page.locator('.sidebar a', { hasText: 'Portfolios' }).first().click();
  await page.waitForURL(/portfolios/);
  await page.locator('.topbar-search input').fill('brand');
  await page.locator('.search-pop .menu-item', { hasText: 'Brand refresh' }).click();
  await page.waitForURL(/project\/lumen-brand/);
});
await step('milestone toggle on project page', async () => {
  await page.locator('.ms-toggle').first().waitFor();
  await page.waitForTimeout(200);
  const before = await page.locator('.ms-toggle.done').count();
  await page.locator('.ms-toggle:not(.done)').first().click();
  if ((await page.locator('.ms-toggle.done').count()) !== before + 1) throw new Error('not toggled');
});
await step('edits persist after reload', async () => {
  await page.reload();
  await page.waitForTimeout(300);
  await go('/portfolio/all-clients/list');
  if (!(await page.locator('.name-link', { hasText: 'Loyalty app' }).count())) throw new Error('lost');
});
await step('reset demo data', async () => {
  page.once('dialog', (d) => d.accept());
  await page.locator('.toolbar-right button[aria-label="More options"]').click();
  await page.locator('.popover .menu-item', { hasText: 'Reset demo data' }).click();
  await page.waitForTimeout(200);
  if (await page.locator('.name-link', { hasText: 'Loyalty app' }).count()) throw new Error('not reset');
});

console.log(results.join('\n'));
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
