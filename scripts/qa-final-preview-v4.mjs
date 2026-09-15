import { chromium, request } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = (process.env.TARGET_URL || '').replace(/\/$/, '');
if (!base) throw new Error('TARGET_URL is required');
const outDir = process.env.QA_OUT || 'qa-artifacts';
await fs.mkdir(outDir, { recursive: true });

const report = { target: base, startedAt: new Date().toISOString(), checks: [], browserErrors: [], networkErrors: [] };
const check = (name, ok, detail = '') => {
  report.checks.push({ name, ok, detail });
  if (!ok) console.error(`FAIL ${name}: ${detail}`);
  else console.log(`PASS ${name}${detail ? ` — ${detail}` : ''}`);
};
const esc = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const detailOf = (error) => error instanceof Error ? (error.stack || error.message) : String(error);

const browser = await chromium.launch({
  headless: true,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});

async function scenario(name, fn) {
  try {
    await fn();
  } catch (error) {
    check(name, false, detailOf(error));
  }
}

async function hideNetlifyDrawer(page) {
  await page.addStyleTag({ content: `
    iframe[title="Netlify Drawer"],
    [data-netlify-deploy-id],
    [data-netlify-site-id] { display:none!important; pointer-events:none!important; visibility:hidden!important; }
  ` }).catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll('iframe[title="Netlify Drawer"], [data-netlify-deploy-id], [data-netlify-site-id]').forEach((el) => el.remove());
  }).catch(() => {});
}

async function openPage(width = 390, height = 844, { waitSplash = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.grantPermissions(['microphone'], { origin: base }).catch(() => {});
  const page = await context.newPage();
  page.on('pageerror', (error) => report.browserErrors.push({ width, message: error.message }));
  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith(base) && response.status() === 404) report.networkErrors.push({ width, status: 404, url });
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.startsWith(base)) report.networkErrors.push({ width, failed: true, url, reason: req.failure()?.errorText || '' });
  });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await hideNetlifyDrawer(page);
  if (waitSplash) {
    await page.locator('.otto-splash-screen').waitFor({ state: 'detached', timeout: 10000 }).catch(async () => page.waitForTimeout(7200));
  } else {
    await page.addStyleTag({ content: '.otto-splash-screen{display:none!important}' }).catch(() => {});
    await page.waitForTimeout(450);
  }
  await hideNetlifyDrawer(page);
  return { page, context };
}

async function assertNoOverflow(page, label) {
  const m = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  const max = Math.max(m.scrollWidth, m.bodyScrollWidth);
  check(`${label}: no horizontal overflow`, max <= m.clientWidth + 2, JSON.stringify(m));
}

async function screenshot(page, name, fullPage = true) {
  await hideNetlifyDrawer(page);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage });
}

async function bottom(page, text) {
  await hideNetlifyDrawer(page);
  const btn = page.getByRole('button', { name: new RegExp(`^${esc(text)}$`, 'i') }).last();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click({ force: true });
  await page.waitForTimeout(450);
}

async function openModule(page, name) {
  await bottom(page, 'Разделы');
  await hideNetlifyDrawer(page);
  const button = page.locator('button.otto-module-row').filter({ hasText: name }).first();
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click({ force: true });
  await page.waitForTimeout(700);
}

async function afterReload(page) {
  await page.addStyleTag({ content: '.otto-splash-screen{display:none!important}' }).catch(() => {});
  await hideNetlifyDrawer(page);
  await page.waitForTimeout(350);
}

await scenario('home and responsive layout', async () => {
  const { page, context } = await openPage(390, 844, { waitSplash: true });
  check('splash exits to app', await page.locator('.otto-approved-dashboard').isVisible().catch(() => false));
  check('approved Otto hero image visible', await page.locator('.otto-approved-otto-image').isVisible().catch(() => false));
  await assertNoOverflow(page, 'home 390');
  await screenshot(page, 'home-390');
  await context.close();

  for (const [width, height] of [[320, 760], [375, 812], [430, 932], [1440, 1000]]) {
    const opened = await openPage(width, height);
    await assertNoOverflow(opened.page, `home ${width}`);
    await screenshot(opened.page, `home-${width}`);
    await opened.context.close();
  }
});

await scenario('daily plans 5/15/30', async () => {
  for (const minutes of [5, 15, 30]) {
    const { page, context } = await openPage(390, 844);
    const button = page.locator('.otto-roadmap-duration button').filter({ hasText: String(minutes) }).first();
    await button.click({ force: true });
    await page.waitForTimeout(450);
    check(`${minutes} min opens separate daily plan`, await page.getByText('Ваша тренировка на сегодня', { exact: false }).first().isVisible().catch(() => false));
    await assertNoOverflow(page, `daily ${minutes}`);
    const gap = await page.evaluate(() => {
      const list = document.querySelector('.otto-roadmap-plan-list');
      const start = document.querySelector('.otto-roadmap-start');
      if (!list || !start) return null;
      return Math.round(start.getBoundingClientRect().top - list.getBoundingClientRect().bottom);
    });
    check(`${minutes} min has no artificial empty hole`, gap !== null && gap >= 0 && gap < 80, `gap=${gap}`);
    await screenshot(page, `daily-${minutes}`);
    await context.close();
  }
});

await scenario('Lesen Teil 2 and persistence', async () => {
  const { page, context } = await openPage(390, 844);
  await openModule(page, 'Lesen');
  const card = page.locator('div.rounded-3xl').filter({ hasText: 'Teil 2' }).filter({ hasText: 'Webseiten & Anzeigen' }).first();
  await card.waitFor({ state: 'visible', timeout: 10000 });
  await card.getByRole('button', { name: /Начать тренировку|Продолжить/i }).click({ force: true });
  await page.waitForTimeout(350);
  const choice = page.locator('button').filter({ hasText: /^A/ }).first();
  await choice.click({ force: true });
  const before = await choice.getAttribute('class');
  check('Lesen choice is neutral before check', !/emerald|rose/.test(before || ''), before || '');
  await page.getByRole('button', { name: 'Проверить' }).click({ force: true });
  await page.waitForTimeout(500);
  const after = await choice.getAttribute('class');
  check('Lesen choice gets checked styling', /emerald|rose/.test(after || ''), after || '');
  await screenshot(page, 'lesen-checked');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await afterReload(page);
  await openModule(page, 'Lesen');
  check('Lesen progress persists after reload', await page.getByText(/Выполнено:\s*1\/50/i).first().isVisible().catch(() => false));
  await context.close();
});

await scenario('Hören interaction and persistence', async () => {
  const { page, context } = await openPage(390, 844);
  await openModule(page, 'Hören');
  check('Hören audio player visible', await page.locator('audio').isVisible().catch(() => false));
  check('Hören transcript hidden initially', !(await page.getByText('Deutsch', { exact: true }).isVisible().catch(() => false)));
  const transcript = page.getByRole('button', { name: /Показать текст диалога/i }).first();
  if (await transcript.isVisible().catch(() => false)) {
    await transcript.click({ force: true });
    await page.waitForTimeout(1000);
    check('Hören transcript opens', await page.getByText('Deutsch', { exact: true }).isVisible().catch(() => false));
  }
  const choice = page.locator('section button').filter({ hasText: /^A\./ }).first();
  if (await choice.count()) await choice.click({ force: true });
  else await page.locator('section button').filter({ hasText: 'Richtig' }).first().click({ force: true });
  await page.getByRole('button', { name: 'Проверить' }).click({ force: true });
  await page.waitForTimeout(400);
  await screenshot(page, 'horen-checked');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await afterReload(page);
  await openModule(page, 'Hören');
  check('Hören progress persists after reload', await page.getByText(/выполнено\s+1/i).first().isVisible().catch(() => false));
  await context.close();
});

await scenario('Schreiben example', async () => {
  const { page, context } = await openPage(390, 844);
  await openModule(page, 'Schreiben');
  const continueBtn = page.locator('button').filter({ hasText: 'Продолжить Schreiben' }).first();
  if (await continueBtn.isVisible().catch(() => false)) {
    await continueBtn.click({ force: true });
    await page.waitForTimeout(350);
  }
  const show = page.getByRole('button', { name: /Показать пример/i }).first();
  check('Schreiben example button present', await show.isVisible().catch(() => false));
  if (await show.isVisible().catch(() => false)) {
    await show.click({ force: true });
    const close = page.getByRole('button', { name: /Закрыть пример/i }).first();
    await close.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {});
    check('Schreiben example loads from backend', await close.isVisible().catch(() => false));
  }
  await screenshot(page, 'schreiben-example');
  await context.close();
});

await scenario('Sprechen microphone', async () => {
  const { page, context } = await openPage(390, 844);
  await openModule(page, 'Sprechen');
  const t1 = page.locator('button').filter({ hasText: 'Sich vorstellen' }).first();
  await t1.click({ force: true });
  await page.waitForTimeout(350);
  const record = page.getByRole('button', { name: /Записать ответ/i }).first();
  await record.click({ force: true });
  await page.waitForTimeout(1300);
  const stop = page.getByRole('button', { name: /Остановить запись/i }).first();
  const recordingWorked = await stop.isVisible().catch(() => false);
  check('Sprechen microphone starts recording', recordingWorked);
  if (recordingWorked) {
    await stop.click({ force: true });
    await page.waitForTimeout(1000);
  }
  check('Sprechen creates playable recording', await page.locator('audio').isVisible().catch(() => false));
  await screenshot(page, 'sprechen-microphone');
  await context.close();
});

await scenario('Sprechen Teil 3 archive cards', async () => {
  const { page, context } = await openPage(390, 844);
  await openModule(page, 'Sprechen');
  const t3 = page.locator('button').filter({ hasText: 'Bitten' }).first();
  await t3.waitFor({ state: 'visible', timeout: 10000 });
  await t3.click({ force: true });
  await page.waitForTimeout(450);

  const firstCard = page.locator('[data-teil3-image="1"]');
  check('Sprechen Teil 3 first archive card visible', await firstCard.isVisible().catch(() => false));
  check('Sprechen Teil 3 shows 50-card counter', await page.getByText(/Karte\s+1\s+von\s+50/i).isVisible().catch(() => false));
  const imageLoaded = await page.locator('[data-teil3-image] img').first().evaluate((img) => img.complete && img.naturalWidth > 0).catch(() => false);
  check('Sprechen Teil 3 archive image asset loaded', imageLoaded);
  check('Sprechen Teil 3 recorder present', await page.getByRole('button', { name: /Записать ответ/i }).first().isVisible().catch(() => false));

  const sample = page.getByRole('button', { name: /Показать пример после своего ответа/i }).first();
  await sample.click({ force: true });
  await page.waitForTimeout(200);
  check('Sprechen Teil 3 request sample visible', await page.getByText('Bitte', { exact: true }).isVisible().catch(() => false));
  check('Sprechen Teil 3 reaction sample visible', await page.getByText('Reaktion', { exact: true }).isVisible().catch(() => false));
  check('Sprechen Teil 3 has separate sample audio buttons', await page.getByRole('button', { name: /Прослушать/i }).count() >= 2);

  await assertNoOverflow(page, 'Sprechen Teil 3 390');
  await screenshot(page, 'sprechen-teil3-card-1');

  await page.getByRole('button', { name: /Случайная карточка/i }).click({ force: true });
  await page.waitForTimeout(250);
  const nextIndex = await page.locator('[data-teil3-image]').first().getAttribute('data-teil3-image');
  check('Sprechen Teil 3 random card changes image', Boolean(nextIndex && nextIndex !== '1'), `next=${nextIndex}`);
  await screenshot(page, 'sprechen-teil3-random');
  await context.close();
});

await scenario('account readiness settings and mock', async () => {
  for (const [tab, shot] of [['Кабинет', 'account'], ['Готовность', 'readiness'], ['Настройки', 'settings']]) {
    const { page, context } = await openPage(390, 844);
    await bottom(page, tab);
    await assertNoOverflow(page, shot);
    if (tab === 'Готовность') check('clean account does not show fake readiness percent', await page.getByText(/Недостаточно данных/i).first().isVisible().catch(() => false));
    await screenshot(page, shot);
    await context.close();
  }

  const { page, context } = await openPage(390, 844);
  const mock = page.locator('button').filter({ hasText: 'Попробовать как на экзамене' }).first();
  await mock.click({ force: true });
  await page.waitForTimeout(450);
  for (const name of ['Hören', 'Lesen', 'Schreiben', 'Sprechen']) check(`mock menu has ${name}`, await page.locator('button').filter({ hasText: name }).first().isVisible().catch(() => false));
  check('mock hides section scores before completion', !(await page.getByText(/\/25/).first().isVisible().catch(() => false)));
  await screenshot(page, 'mock-menu');
  await context.close();
});

await scenario('network and backend sanity', async () => {
  const api = await request.newContext();
  try {
    const assetChecks = [
      ['/otto/otto-home-documents.webp?v=2', 'hero asset'],
      ['/otto-icon-192.png?v=2', 'PWA 192 icon'],
      ['/otto-icon-512.png?v=2', 'PWA 512 icon'],
      ['/audio/001.mp3', 'Hören audio 001'],
      ['/sprechen/teil3-requests-user.avif?v=1', 'Sprechen Teil 3 archive asset'],
    ];
    for (const [url, name] of assetChecks) {
      const r = await api.get(base + url);
      check(`${name} reachable`, r.ok(), `status=${r.status()}`);
    }
    const aiStatus = await api.get(base + '/api/check-sprechen');
    check('Sprechen AI endpoint configured', aiStatus.ok(), `status=${aiStatus.status()}`);
    const tr = await api.post(base + '/api/translate-task', { data: { parts: ['Guten Tag'] } });
    check('translation endpoint works', tr.ok(), `status=${tr.status()}`);
    const ex = await api.post(base + '/api/schreiben-example', { data: { situation: 'Sie möchten einen Deutschkurs besuchen. Schreiben Sie an die Sprachschule.', points: ['Wann beginnt der Kurs?', 'Preis', 'Abendkurs?'] } });
    check('Schreiben example endpoint works', ex.ok(), `status=${ex.status()}`);
  } finally {
    await api.dispose();
  }
});

check('no same-origin 404s during browser scenarios', report.networkErrors.filter((x) => x.status === 404).length === 0, JSON.stringify(report.networkErrors.filter((x) => x.status === 404)));
check('no uncaught browser exceptions', report.browserErrors.length === 0, JSON.stringify(report.browserErrors));

report.finishedAt = new Date().toISOString();
report.failures = report.checks.filter((x) => !x.ok).length;
await fs.writeFile(path.join(outDir, 'qa-report.json'), JSON.stringify(report, null, 2));
await browser.close();
if (report.failures) process.exit(1);
