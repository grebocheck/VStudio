import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

import { inspectPng, unzipStoredFiles } from './sticker-helpers';

async function openStickers(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('vstudio_onboarding_complete', 'true');
    localStorage.setItem('vstudio_lang', 'en');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Characters', exact: true }).click();
  await page.locator('.preset-card').first().click();
  await page.getByRole('button', { name: /Telegram stickers/i }).click();
  await expect(page.getByRole('region', { name: 'Telegram sticker builder' })).toBeVisible();
}

test('downloads all nine real-avatar PNGs with transparent padding and import instructions', async ({ page }) => {
  await openStickers(page);
  const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
  await expect(panel.getByRole('img')).toHaveCount(9);
  await expect(panel.getByRole('button', { name: /^Include:/ }).first()).toHaveAttribute('aria-pressed', 'true');
  const downloadPromise = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Download PNG pack (9)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/-telegram-png-pack\.zip$/);
  const files = unzipStoredFiles(await readFile((await download.path())!));
  expect(files.size).toBe(11);
  const readme = files.get('README.txt')!.toString('utf8');
  expect(readme).toContain('/newpack');
  expect(readme).toContain('як ФАЙЛ');
  expect(readme).toContain('does not import ZIP');
  const manifest = JSON.parse(files.get('manifest.json')!.toString('utf8'));
  expect(manifest.format).toBe('png');
  expect(manifest.telegramPublished).toBe(false);
  expect(manifest.stickers).toHaveLength(9);
  const pngs = [...files.entries()].filter(([name]) => name.endsWith('.png'));
  expect(new Set(pngs.map(([, file]) => file.toString('base64'))).size).toBe(9);
  for (const [name, file] of pngs) {
    const pixels = await inspectPng(page, file);
    expect(pixels.width, name).toBe(512);
    expect(pixels.height, name).toBe(512);
    expect(pixels.transparent, name).toBeGreaterThan(10000);
    expect(pixels.visible, name).toBeGreaterThan(30000);
    expect(pixels.coloredPixels, name).toBeGreaterThan(10000);
    expect(pixels.edgeVisible, name).toBe(0);
  }
  await expect(panel.getByRole('status')).toContainText('9 PNG files prepared');
  await expect(panel.getByRole('link', { name: 'Open @Stickers' })).toHaveAttribute('href', 'https://t.me/Stickers');
});

test('selection affects ZIP contents and individual PNG downloads remain available', async ({ page }) => {
  await openStickers(page);
  const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
  await panel.getByRole('button', { name: 'Clear selection' }).click();
  await expect(panel.getByRole('button', { name: 'Download PNG pack (0)' })).toBeDisabled();
  await panel.getByRole('button', { name: 'Include: Love', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Download PNG pack (1)' }).click();
  const packDownload = await downloadPromise;
  const files = unzipStoredFiles(await readFile((await packDownload.path())!));
  expect([...files.keys()].filter((name) => name.endsWith('.png'))).toHaveLength(1);
  expect([...files.keys()].some((name) => name.endsWith('-love.png'))).toBe(true);

  const pngPromise = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Download Happy PNG', exact: true }).click();
  const pngDownload = await pngPromise;
  expect(pngDownload.suggestedFilename()).toMatch(/-happy\.png$/);
  const pixels = await inspectPng(page, await readFile((await pngDownload.path())!));
  expect(pixels.width).toBe(512);
  expect(pixels.transparent).toBeGreaterThan(10000);
});

test('exports every curated character and reflects customization in the actual PNG', async ({ page }) => {
  test.setTimeout(90_000);
  await openStickers(page);
  await page.getByRole('button', { name: 'Characters', exact: true }).click();
  const presetNames = await page
    .locator('.preset-card')
    .evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')!));
  expect(presetNames.length).toBeGreaterThan(0);
  const rendered = new Set<string>();
  let original: Buffer | undefined;
  for (const name of presetNames) {
    await page.getByRole('button', { name: 'Characters', exact: true }).click();
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: /Telegram stickers/i }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Happy PNG', exact: true }).click();
    const download = await downloadPromise;
    const png = await readFile((await download.path())!);
    original ??= png;
    rendered.add(png.toString('base64'));
    const pixels = await inspectPng(page, png);
    expect(pixels.width, name).toBe(512);
    expect(pixels.visible, name).toBeGreaterThan(30000);
    expect(pixels.transparent, name).toBeGreaterThan(10000);
    expect(pixels.edgeVisible, name).toBe(0);
  }
  expect(rendered.size).toBe(presetNames.length);
  await page.getByRole('button', { name: 'Characters', exact: true }).click();
  await page.getByRole('button', { name: presetNames[0], exact: true }).click();
  await page.getByRole('button', { name: 'Hair & colour', exact: true }).click();
  await page.locator('input[type="color"]').first().fill('#ff2400');
  await page.getByRole('button', { name: /Telegram stickers/i }).click();
  const changedPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Happy PNG', exact: true }).click();
  const changed = await changedPromise;
  expect(await readFile((await changed.path())!)).not.toEqual(original);
});

test('exports experimental TGS with explicit local-validation scope after SVG ID namespacing', async ({ page }) => {
  await openStickers(page);
  const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
  await panel.getByText('Experimental animation · TGS', { exact: true }).click();
  await expect(panel.getByText(/Local checks do not guarantee Telegram acceptance/)).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Download experimental TGS ZIP', exact: true }).click();
  const download = await downloadPromise;
  const files = unzipStoredFiles(await readFile((await download.path())!));
  const manifest = JSON.parse(files.get('manifest.json')!.toString('utf8'));
  expect(manifest.validationScope).toBe('local-structure-and-size');
  expect(manifest.telegramPublished).toBe(false);
  const animations = [...files.entries()].filter(([name]) => name.endsWith('.tgs'));
  expect(animations).toHaveLength(9);
  for (const [name, file] of animations) {
    expect(file.length, name).toBeLessThanOrEqual(64 * 1024);
    const lottie = JSON.parse(gunzipSync(file).toString('utf8'));
    expect(lottie.w, name).toBe(512);
    expect(lottie.h, name).toBe(512);
    expect(lottie.fr, name).toBe(60);
    expect(lottie.layers.length, name).toBeGreaterThan(3);
  }
  expect(files.get('README.txt')!.toString('utf8')).toContain('/newanimated');
});

test('shows an actionable encoding error and allows a successful retry', async ({ page }) => {
  await page.addInitScript(() => {
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      if (this.width === 512) callback(null);
      else originalToBlob.call(this, callback, type, quality);
    };
    window.addEventListener('restore-sticker-canvas', () => {
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
    });
  });
  await openStickers(page);
  const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
  await panel.getByRole('button', { name: 'Clear selection' }).click();
  await panel.getByRole('button', { name: 'Include: Happy', exact: true }).click();
  await panel.getByRole('button', { name: 'Download PNG pack (1)' }).click();
  await expect(panel.getByRole('alert')).toContainText('Could not encode PNG');
  await expect(panel.getByRole('button', { name: 'Download PNG pack (1)' })).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event('restore-sticker-canvas')));
  const downloadPromise = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Download PNG pack (1)' }).click();
  await downloadPromise;
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await expect(panel.getByRole('status')).toContainText('1 PNG files prepared');
});
