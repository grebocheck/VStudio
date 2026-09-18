import { expect, test, type Page } from '@playwright/test';
import { MIYA_NOCTURNE_PRESET } from '../src/presets';

async function openStudio(page: Page) {
  await page.addInitScript((miyaConfig) => {
    if (sessionStorage.getItem('editor-seeded')) return;
    localStorage.clear();
    localStorage.setItem('vstudio_config', JSON.stringify(miyaConfig));
    localStorage.setItem('vstudio_active_preset', JSON.stringify('miya-nocturne'));
    localStorage.setItem('vstudio_lang', 'en');
    localStorage.setItem('vstudio_onboarding_complete', 'true');
    localStorage.setItem('vstudio_desktop_notice_dismissed', 'true');
    sessionStorage.setItem('editor-seeded', 'true');
  }, MIYA_NOCTURNE_PRESET.config);
  await page.goto('/');
  await expect(page.locator('.avatar-viewport svg[role="img"]')).toBeVisible();
}
const config = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('vstudio_config') || '{}'));

test('keeps an editable project through history, export, import and reload', async ({ page }) => {
  await openStudio(page);
  const original = await config(page);
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Surprise me' }).click();
  await expect.poll(async () => (await config(page)).hairColor).not.toBe(original.hairColor);
  const variant = await config(page);
  await page.keyboard.press('Control+z');
  await expect.poll(() => config(page)).toEqual(original);
  await page.keyboard.press('Control+Shift+z');
  await expect.poll(() => config(page)).toEqual(variant);
  await page.getByRole('button', { name: 'Save current avatar as a local preset' }).click();
  await expect(page.locator('.saved-preset')).toHaveCount(1);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project as JSON' }).click();
  const download = await downloadEvent;
  const projectFile = await download.path();
  expect(projectFile).toBeTruthy();
  await page.getByRole('button', { name: 'Surprise me' }).click();
  const nextVariant = await config(page);
  await page.locator('input[type=file]').setInputFiles(projectFile!);
  await expect.poll(() => config(page)).toEqual(variant);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(() => config(page)).toEqual(nextVariant);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect.poll(() => config(page)).toEqual(variant);
  await page.reload();
  await expect.poll(() => config(page)).toEqual(variant);
  await expect(page.locator('.saved-preset')).toHaveCount(2);
});

test('rejects a broken import without losing the character', async ({ page }) => {
  await openStudio(page);
  const original = await config(page);
  await page.locator('input[type=file]').setInputFiles({
    name: 'broken.vstudio.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999,"config":null}'),
  });
  await expect(page.getByRole('alert')).toContainText('Import failed');
  expect(await config(page)).toEqual(original);
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeDisabled();
});

test('saves motion energy and restores it through history and reload', async ({ page }) => {
  await openStudio(page);
  await page.locator('#tab-btn-hair').click();
  const editor = page.locator('#right-sidebar');
  await expect(editor.getByRole('button', { name: 'Natural', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await editor.getByRole('button', { name: 'Expressive', exact: true }).click();
  await expect.poll(async () => (await config(page)).motionIntensity).toBe(1.35);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(editor.getByRole('button', { name: 'Natural', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.reload();
  await page.locator('#tab-btn-hair').click();
  await expect(editor.getByRole('button', { name: 'Expressive', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await config(page)).motionIntensity).toBe(1.35);
});

test('holds a paused pose and downloads a transparent full size portrait', async ({ page }) => {
  await openStudio(page);
  await page.locator('#toggle-tracking-cmd').click();
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await page.waitForTimeout(180);
  const portrait = page.locator('.avatar-viewport svg[role="img"]');
  const pausedMarkup = await portrait.innerHTML();
  await page.waitForTimeout(550);
  expect(await portrait.innerHTML()).toBe(pausedMarkup);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download portrait/ }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const data = Buffer.concat(chunks);
  expect(data.readUInt32BE(16)).toBe(1600);
  expect(data.readUInt32BE(20)).toBe(1600);
  expect(data.length).toBeGreaterThan(10_000);
  const pixels = await page.evaluate(async (base64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(img, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0;
    let clear = 0;
    for (let i = 3; i < rgba.length; i += 4) {
      if (rgba[i] === 0) clear++;
      if (rgba[i] === 255) opaque++;
    }
    return { opaque, clear };
  }, data.toString('base64'));
  expect(pixels.opaque).toBeGreaterThan(100_000);
  expect(pixels.clear).toBeGreaterThan(100_000);
  await page.getByRole('button', { name: 'Play animation' }).click();
  await expect(page.locator('#toggle-tracking-cmd')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(100, 100);
  await expect.poll(() => portrait.innerHTML()).not.toBe(pausedMarkup);
});

test('works on a phone without horizontal overflow and brings the selected editor into view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStudio(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('#tab-btn-hair').click();
  await expect.poll(async () => (await page.locator('#right-sidebar').boundingBox())!.y).toBeLessThan(400);
  await expect(page.locator('#right-sidebar').getByRole('button', { name: 'Portrait', exact: true })).toBeInViewport();
  await page.screenshot({ path: 'test-results/editor-mobile.png', fullPage: true });
});

test('explains unavailable AI before a user submits a prompt', async ({ page }) => {
  await page.route('**/healthz', (route) => route.fulfill({ json: { status: 'ok', ai: false } }));
  await openStudio(page);
  await page.locator('.preset-card').first().click();
  await expect.poll(async () => (await config(page)).modelId).toBe('parametric');
  await page.locator('#tab-btn-ai').click();
  await expect(page.getByRole('status')).toContainText('AI styling is not connected');
  await page.locator('#ai-avatar-prompt').fill('Forest elf');
  await expect(page.locator('#generate-ai-btn')).toBeDisabled();
});

test('switches the document language and keeps Ukrainian after reload', async ({ page }) => {
  await openStudio(page);
  await page.getByRole('button', { name: 'Switch to Ukrainian' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await expect(page.getByRole('button', { name: 'Здивуй мене' })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await page.locator('#tab-btn-stickers').click();
  await expect(page.locator('#right-sidebar')).toContainText('512');
  await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();
});
