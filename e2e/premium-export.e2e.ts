import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { inspectPng, unzipStoredFiles } from './sticker-helpers';

async function openPremium(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vstudio_onboarding_complete', 'true');
    localStorage.setItem('vstudio_lang', 'en');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Characters', exact: true }).click();
  await page.getByRole('button', { name: 'Miya Nocturne', exact: true }).click();
  await expect(page.locator('.avatar-viewport svg[data-model="miya-nocturne"]')).toBeVisible();
}

test('illustrated SVG export embeds each source once and opens without network access', async ({ page }) => {
  test.setTimeout(60_000);
  await openPremium(page);
  await page.getByRole('button', { name: /OBS Integration/i }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG file', exact: true }).click();
  const download = await downloaded;
  const source = await readFile((await download.path())!, 'utf8');
  expect(source).not.toContain('/models/');
  await page.context().setOffline(true);
  const inspected = await page.evaluate(async (svg) => {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const images = Array.from(doc.querySelectorAll('image'));
    const hrefs = images.map((image) => image.getAttribute('href'));
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 200;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, 200, 200);
    const pixels = context.getImageData(0, 0, 200, 200).data;
    let visible = 0;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) visible++;
      else transparent++;
    }
    URL.revokeObjectURL(url);
    return { hrefs, visible, transparent, references: doc.querySelectorAll('use').length };
  }, source);
  expect(inspected.hrefs).toHaveLength(3);
  expect(new Set(inspected.hrefs).size).toBe(3);
  expect(inspected.hrefs.every((href) => href?.startsWith('data:image/png;base64,'))).toBe(true);
  expect(inspected.references).toBeGreaterThan(3);
  expect(inspected.visible).toBeGreaterThan(12000);
  expect(inspected.transparent).toBeGreaterThan(1000);
});

test('retries an unavailable artwork layer without leaving broken preview images', async ({ page }) => {
  test.setTimeout(60_000);
  await openPremium(page);
  let failArtwork = true;
  await page.route('**/models/miya-nocturne/portrait.png', (route) => {
    if (failArtwork && route.request().resourceType() === 'fetch')
      return route.fulfill({ status: 503, body: 'Temporarily unavailable' });
    return route.continue();
  });
  await page.getByRole('button', { name: /Telegram stickers/i }).click();
  const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
  await expect(panel.getByRole('alert')).toContainText('Could not load the artwork previews');
  failArtwork = false;
  await panel.getByRole('button', { name: 'Retry previews', exact: true }).click();
  await expect(panel.getByRole('img')).toHaveCount(9, { timeout: 45_000 });
  await expect(panel.getByRole('alert')).toHaveCount(0);
});

test('premium reactions have compact previews and export nine distinct transparent Telegram PNGs', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openPremium(page);
  await page.getByRole('button', { name: /Telegram stickers/i }).click();
  const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
  await expect(panel.getByRole('img')).toHaveCount(9, { timeout: 45_000 });
  await expect
    .poll(
      () =>
        panel
          .getByRole('img')
          .evaluateAll((images: HTMLImageElement[]) =>
            images.every((image) => image.complete && image.naturalWidth === 160),
          ),
      { timeout: 15_000 },
    )
    .toBe(true);
  const thumbnails = await panel.getByRole('img').evaluateAll(async (images: HTMLImageElement[]) =>
    Promise.all(
      images.map(async (image) => {
        const blob = await (await fetch(image.src)).blob();
        return { type: blob.type, bytes: blob.size };
      }),
    ),
  );
  expect(thumbnails.every((thumbnail) => thumbnail.type === 'image/png' && thumbnail.bytes < 100_000)).toBe(true);
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await panel.getByText('Experimental animation · TGS', { exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Download experimental TGS ZIP', exact: true })).toBeDisabled();
  await expect(panel.getByText(/TGS supports vector artwork only/)).toBeVisible();
  const downloaded = page.waitForEvent('download', { timeout: 90_000 });
  await panel.getByRole('button', { name: 'Download PNG pack (9)' }).click();
  const download = await downloaded;
  await download.saveAs(testInfo.outputPath('miya-nocturne-telegram-png-pack.zip'));
  const files = unzipStoredFiles(await readFile((await download.path())!));
  const pngs = [...files.entries()].filter(([name]) => name.endsWith('.png'));
  expect(pngs).toHaveLength(9);
  for (const [name, data] of pngs) {
    const pixels = await inspectPng(page, data);
    expect(pixels.width, name).toBe(512);
    expect(pixels.height, name).toBe(512);
    expect(pixels.transparent, name).toBeGreaterThan(10000);
    expect(pixels.visible, name).toBeGreaterThan(30000);
    expect(pixels.coloredPixels, name).toBeGreaterThan(10000);
    expect(pixels.edgeVisible, name).toBe(0);
  }
  expect(new Set(pngs.map(([, data]) => data.toString('base64'))).size).toBe(9);
  await expect(panel.getByRole('status')).toContainText('9 PNG files prepared');
  expect(errors).toEqual([]);
});
