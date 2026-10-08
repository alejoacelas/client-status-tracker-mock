// Drive the main interactions and save screenshots: node tools/interact.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const shot = (n) => page.screenshot({ path: `reference/mine/i_${n}.png` });
await page.goto('http://localhost:5303/#/project/lumen-brand/overview', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// 1. composer from latest-update pencil
await page.getByRole('button', { name: 'Write project update' }).click();
await page.locator('.health-pick').click();
await shot('1_health_menu');
await page.getByRole('menuitem', { name: 'At risk' }).click();
await page.locator('.editor').click();
await page.keyboard.type('Board meeting moved to Friday. ');
await page.keyboard.press('Meta+b');
await page.keyboard.type('We expect feedback by Monday.');
await page.keyboard.press('Meta+b');
await page.keyboard.press('Enter');
await page.keyboard.type('- Guidelines start Tuesday');
await shot('2_composer');
await page.keyboard.press('Meta+Enter');
await page.waitForTimeout(300);
await shot('3_posted');
const latest = await page.locator('.latest-card .update-meta').first().innerText();
console.log('latest meta:', latest.replace(/\n/g, ' '));
console.log('latest body:', (await page.locator('.latest-card .prose').first().innerHTML()).slice(0, 200));

// 2. reaction + comment on latest
await page.getByRole('button', { name: 'Add reaction' }).first().click();
await page.locator('.menu .menu-item', { hasText: '🚀' }).click();
await page.getByRole('button', { name: 'Comments' }).first().click();
await page.locator('.reply-input').first().fill('Thanks, I will tell Iris.');
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
await shot('4_react_comment');

// 3. status change via property menu -> appears in updates tab
await page.locator('.props .prop', { hasText: 'In Progress' }).click();
await page.getByRole('menuitem', { name: 'Paused' }).click();
await page.getByRole('tab', { name: 'Updates' }).click();
await page.waitForTimeout(300);
await shot('5_updates_tab');
console.log('activity lines:', await page.locator('.activity-line').count());

// 4. command menu
await page.keyboard.press('Meta+k');
await page.keyboard.type('initi');
await shot('6_cmdk');
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
console.log('after cmdk hash:', await page.evaluate(() => location.hash));

// 5. health popover + arrow nav on initiatives
await page.goto('http://localhost:5303/#/initiatives', { waitUntil: 'networkidle' });
await page.locator('.health-cell').nth(1).click();
await page.waitForTimeout(200);
await shot('7_popover');
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(200);
console.log('popover title after nav:', await page.locator('.upd-pop-head').innerText());
await page.keyboard.press('Escape');

// 6. persistence after reload
await page.goto('http://localhost:5303/#/pulse/recent', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
console.log('first pulse item:', (await page.locator('.feed-item').first().innerText()).slice(0, 120).replace(/\n/g, ' | '));
await shot('8_pulse_after_reload');

// 7. theme toggle
await page.locator('.pill-btn', { hasText: 'theme' }).click();
console.log('theme:', await page.evaluate(() => document.documentElement.dataset.theme));
await page.evaluate(() => localStorage.clear());
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close();
