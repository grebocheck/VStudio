import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { inspectPng, unzipStoredFiles } from './sticker-helpers';

async function openAurelia(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vstudio_onboarding_complete', 'true');
    localStorage.setItem('vstudio_lang', 'en');
    localStorage.setItem(
      'vstudio_config',
      JSON.stringify({ modelId: 'aurelia-3d', name: 'Aurelia', modelFraming: 'portrait' }),
    );
  });
  await page.goto('/');
  await expect(page.locator('.avatar-viewport canvas[data-avatar3d="true"]')).toHaveAttribute('data-ready', 'true', {
    timeout: 60_000,
  });
}

function gifTiming(bytes: Buffer) {
  expect(bytes.subarray(0, 6).toString()).toMatch(/^GIF8[79]a$/);
  const width = bytes.readUInt16LE(6),
    height = bytes.readUInt16LE(8);
  let offset = 13 + (bytes[10] & 0x80 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
  let durationMs = 0,
    frames = 0,
    transparency = false;
  const skipBlocks = () => {
    while (bytes[offset]) offset += bytes[offset] + 1;
    offset++;
  };
  while (offset < bytes.length && bytes[offset] !== 0x3b) {
    const marker = bytes[offset++];
    if (marker === 0x21) {
      const type = bytes[offset++];
      if (type === 0xf9) {
        transparency ||= Boolean(bytes[offset + 1] & 1);
        durationMs += bytes.readUInt16LE(offset + 2) * 10;
      }
      skipBlocks();
    } else if (marker === 0x2c) {
      const packed = bytes[offset + 8];
      offset += 9 + (packed & 0x80 ? 3 * 2 ** ((packed & 7) + 1) : 0);
      offset++;
      skipBlocks();
      frames++;
    } else throw new Error(`Invalid GIF block ${marker}`);
  }
  return { width, height, durationMs, frames, transparency };
}

async function inspectMedia(page: Page, bytes: Buffer, type: 'image/gif' | 'video/webm') {
  return page.evaluate(
    async ({ data, type }) => {
      const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type }));
      try {
        let source: CanvasImageSource, width: number, height: number;
        if (type === 'video/webm') {
          const video = document.createElement('video');
          video.muted = true;
          video.src = url;
          await new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve();
            video.onerror = () => reject(new Error('WebM decoding failed'));
            video.load();
          });
          const presented = new Promise<void>((resolve) => video.requestVideoFrameCallback(() => resolve()));
          await video.play();
          await presented;
          video.pause();
          source = video;
          width = video.videoWidth;
          height = video.videoHeight;
        } else {
          const image = new Image();
          image.src = url;
          await image.decode();
          source = image;
          width = image.width;
          height = image.height;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d')!;
        context.drawImage(source, 0, 0);
        const rgba = context.getImageData(0, 0, width, height).data;
        let visible = 0,
          transparent = 0,
          colored = 0;
        for (let i = 0; i < rgba.length; i += 4) {
          if (rgba[i + 3] === 0) transparent++;
          else {
            visible++;
            if (Math.max(rgba[i], rgba[i + 1], rgba[i + 2]) - Math.min(rgba[i], rgba[i + 1], rgba[i + 2]) > 20)
              colored++;
          }
        }
        return { width, height, visible, transparent, colored };
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    { data: [...bytes], type },
  );
}

test('3D stickers render nine real poses with transparent margins while unsupported vector exports are disabled', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await openAurelia(page);
  await page.getByRole('button', { name: 'OBS Integration', exact: true }).click();
  await expect(page.getByRole('button', { name: 'SVG file', exact: true })).toBeDisabled();
  await expect(page.getByText(/SVG is not available for 3D scenes/)).toBeVisible();
  await page.getByRole('button', { name: 'Telegram stickers', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
  await expect(panel.getByRole('img')).toHaveCount(9, { timeout: 60_000 });
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await panel.getByText('Experimental animation · TGS', { exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Download experimental TGS ZIP' })).toBeDisabled();
  const pending = page.waitForEvent('download', { timeout: 60_000 });
  await panel.getByRole('button', { name: 'Download PNG pack (9)' }).click();
  const download = await pending;
  await download.saveAs(testInfo.outputPath('aurelia-telegram-png-pack.zip'));
  const files = unzipStoredFiles(await readFile((await download.path())!));
  const pngs = [...files.entries()].filter(([name]) => name.endsWith('.png'));
  expect(pngs).toHaveLength(9);
  for (const [name, bytes] of pngs) {
    const pixels = await inspectPng(page, bytes);
    expect(pixels.width, name).toBe(512);
    expect(pixels.height, name).toBe(512);
    expect(pixels.transparent, name).toBeGreaterThan(10000);
    expect(pixels.visible, name).toBeGreaterThan(20000);
    expect(pixels.coloredPixels, name).toBeGreaterThan(4000);
    expect(pixels.edgeVisible, name).toBe(0);
  }
  expect(new Set(pngs.map(([, bytes]) => bytes.toString('base64'))).size).toBe(9);
});

test('records real 3D pixels into WebM and a transparent two-second GIF', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openAurelia(page);
  await page.getByRole('button', { name: 'OBS Integration', exact: true }).click();
  await page.getByRole('button', { name: 'Start recording', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  const webmEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download', exact: true }).click();
  const webm = await webmEvent;
  await webm.saveAs(testInfo.outputPath('aurelia.webm'));
  const movie = await inspectMedia(page, await readFile((await webm.path())!), 'video/webm');
  expect(movie.width).toBe(800);
  expect(movie.height).toBe(800);
  expect(movie.visible).toBeGreaterThan(20000);
  expect(movie.colored).toBeGreaterThan(5000);
  await page.getByRole('button', { name: 'Export GIF', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download GIF', exact: true })).toBeVisible({ timeout: 45_000 });
  const gifEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download GIF', exact: true }).click();
  const gif = await gifEvent;
  await gif.saveAs(testInfo.outputPath('aurelia.gif'));
  const bytes = await readFile((await gif.path())!);
  const timing = gifTiming(bytes);
  expect(timing).toMatchObject({ width: 400, height: 400, durationMs: 2000, transparency: true });
  expect(timing.frames).toBeGreaterThan(1);
  const animation = await inspectMedia(page, bytes, 'image/gif');
  expect(animation.visible).toBeGreaterThan(5000);
  expect(animation.transparent).toBeGreaterThan(5000);
  expect(errors).toEqual([]);
});

test('handles an unavailable encoder and stops abandoned recording streams', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const Original = window.MediaRecorder;
    window.MediaRecorder = class {
      static isTypeSupported = Original.isTypeSupported.bind(Original);
      constructor() {
        throw new Error('Encoder unavailable for this test');
      }
    } as unknown as typeof MediaRecorder;
    window.addEventListener('restore-encoder', () => {
      window.MediaRecorder = Original;
    });
    const capture = HTMLCanvasElement.prototype.captureStream;
    const tracks: MediaStreamTrack[] = [];
    HTMLCanvasElement.prototype.captureStream = function (...args) {
      const stream = capture.apply(this, args);
      tracks.push(...stream.getTracks());
      return stream;
    };
    Object.assign(window, { recordingTracks: tracks });
  });
  await openAurelia(page);
  await page.getByRole('button', { name: 'OBS Integration', exact: true }).click();
  await page.getByRole('button', { name: 'Start recording', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Encoder unavailable');
  expect(
    await page.evaluate(() =>
      (window as unknown as { recordingTracks: MediaStreamTrack[] }).recordingTracks.every(
        (track) => track.readyState === 'ended',
      ),
    ),
  ).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('restore-encoder')));
  await page.getByRole('button', { name: 'Start recording', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Characters', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { recordingTracks: MediaStreamTrack[] }).recordingTracks.every(
          (track) => track.readyState === 'ended',
        ),
      ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
