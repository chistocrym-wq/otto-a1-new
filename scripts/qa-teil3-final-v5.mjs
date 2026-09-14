import { chromium, request } from 'playwright';
import fs from 'node:fs/promises';

const base = (process.env.TARGET_URL || '').replace(/\/$/, '');
if (!base) throw new Error('TARGET_URL is required');
const out = process.env.QA_OUT || 'qa-artifacts-v5';
await fs.mkdir(out, { recursive: true });

const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
};

const api = await request.newContext();
for (const n of ['001', '025', '050']) {
  const r = await api.get(`${base}/sprechen/teil3-cards/${n}.webp`);
  check(`Teil 3 ${n}.webp reachable`, r.ok(), `status=${r.status()}`);
  check(`Teil 3 ${n}.webp content type`, (r.headers()['content-type'] || '').includes('image/webp'), r.headers()['content-type'] || '');
}
await api.dispose();

const browser = await chromium.launch({ headless: true, args: ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.grantPermissions(['microphone'], { origin: base }).catch(() => {});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.url().startsWith(base) && r.status() === 404) errors.push(`404 ${r.url()}`); });
await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.addStyleTag({ content: '.otto-splash-screen{display:none!important}' }).catch(() => {});
await page.waitForTimeout(500);

// Open Sprechen directly from the current home skill card. This is more stable
// than routing through the bottom-nav Modules screen, whose label can vary by UI state.
await page.locator('button.otto-premium-skill-card').filter({ hasText: 'Sprechen' }).first().click({ force: true });
await page.waitForTimeout(700);
await page.getByRole('button').filter({ hasText: 'Bitten' }).first().click({ force: true });
await page.waitForTimeout(500);

const img = page.locator('[data-teil3-image="1"] img').first();
check('first card visible', await img.isVisible().catch(() => false));
const src = await img.getAttribute('src');
check('first card uses direct 001 path', Boolean(src?.includes('/sprechen/teil3-cards/001.webp')), src || '');
const loaded = await img.evaluate(el => el.complete && el.naturalWidth > 0 && el.naturalHeight > 0).catch(() => false);
check('first card image decoded', loaded);
check('counter shows 1 of 50', await page.getByText(/Karte\s+1\s+von\s+50/i).first().isVisible().catch(() => false));
check('das Wasser label visible', await page.getByText('das Wasser', { exact: true }).first().isVisible().catch(() => false));

await page.getByRole('button', { name: /Показать пример после своего ответа/i }).first().click({ force: true });
await page.waitForTimeout(200);
check('request example visible', await page.getByText('Geben Sie mir bitte ein Glas Wasser.', { exact: true }).first().isVisible().catch(() => false));
check('reaction label visible', await page.getByText('Reaktion', { exact: true }).first().isVisible().catch(() => false));
await page.screenshot({ path: `${out}/sprechen-teil3-card-001.png`, fullPage: true });

await page.getByRole('button', { name: /Случайная карточка/i }).click({ force: true });
await page.waitForTimeout(300);
const holder = page.locator('[data-teil3-image]').first();
const idx = await holder.getAttribute('data-teil3-image');
const randomSrc = await holder.locator('img').getAttribute('src');
check('random card index changes', Boolean(idx && idx !== '1'), `index=${idx}`);
check('random card uses direct numbered file', Boolean(randomSrc && /\/sprechen\/teil3-cards\/\d{3}\.webp$/.test(randomSrc)), randomSrc || '');
await page.screenshot({ path: `${out}/sprechen-teil3-random.png`, fullPage: true });
check('no browser/404 errors', errors.length === 0, JSON.stringify(errors));

await context.close();
await browser.close();
if (failures.length) process.exit(1);
