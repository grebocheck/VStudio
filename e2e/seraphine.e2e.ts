import { expect, test, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function imagePixels(canvas: Locator) {
  return canvas.evaluate((source: HTMLCanvasElement) => {
    const sample = document.createElement('canvas');
    sample.width = sample.height = 96;
    const context = sample.getContext('2d')!;
    context.drawImage(source, 0, 0, 96, 96);
    return Array.from(context.getImageData(0, 0, 96, 96).data);
  });
}

test('switches between distinct 3D characters and exports the knight with armor, skinning and facial morphs', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vstudio_onboarding_complete', 'true');
    localStorage.setItem('vstudio_desktop_notice_dismissed', 'true');
    localStorage.setItem('vstudio_lang', 'en');
    localStorage.setItem(
      'vstudio_config',
      JSON.stringify({ modelId: 'aurelia-3d', name: 'Aurelia', modelFraming: 'portrait' }),
    );
  });
  await page.goto('/');
  const canvas = page.locator('.avatar-viewport canvas[data-avatar3d]');
  await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  const aurelia = await imagePixels(canvas);
  await page.getByRole('button', { name: 'Seraphine', exact: true }).click();
  await expect(page.locator('.avatar-viewport svg[data-model="seraphine-3d"]')).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  await expect(canvas).toHaveAccessibleName('Seraphine Dawnwarden interactive 3D avatar');
  const knight = await imagePixels(canvas);
  expect(knight.filter((value, index) => Math.abs(value - aurelia[index]) > 45).length).toBeGreaterThan(2000);
  await page.getByRole('button', { name: 'Full body', exact: true }).click();
  await canvas.screenshot({ path: testInfo.outputPath('seraphine-full.png') });

  const downloaded = page.waitForEvent('download', { timeout: 90_000 });
  await page.locator('.avatar-viewport').getByRole('button', { name: 'Download GLB', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('seraphine-dawnwarden.glb');
  const bytes = await readFile((await download.path())!);
  expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8')) as {
    nodes: { name?: string }[];
    skins: { joints: number[] }[];
    meshes: { primitives: { targets?: unknown[] }[] }[];
  };
  expect(gltf.nodes.filter((node) => node.name?.startsWith('Seraphine_')).length).toBeGreaterThan(15);
  expect(gltf.skins.some((skin) => skin.joints.length >= 15)).toBe(true);
  expect(gltf.meshes.some((mesh) => mesh.primitives.some((primitive) => (primitive.targets?.length ?? 0) >= 5))).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Aurelia', exact: true }).click();
  await expect(page.locator('.avatar-viewport svg[data-model="aurelia-3d"]')).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  expect(errors).toEqual([]);
});

test('offscreen PNG renderer changes geometry when the selected 3D model changes', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vstudio_onboarding_complete', 'true');
    localStorage.setItem('vstudio_desktop_notice_dismissed', 'true');
    localStorage.setItem('vstudio_lang', 'en');
  });
  await page.goto('/');
  const images: number[][] = [];
  for (const name of ['Aurelia', 'Seraphine', 'Aurelia']) {
    await page.getByRole('button', { name: 'Characters', exact: true }).click();
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: 'Portrait', exact: true }).click();
    await page.getByRole('button', { name: 'Telegram stickers', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Telegram sticker builder' });
    await expect(panel.getByRole('img')).toHaveCount(9, { timeout: 60_000 });
    await expect(panel.getByRole('alert')).toHaveCount(0);
    images.push(
      await panel
        .getByRole('img')
        .first()
        .evaluate(async (image: HTMLImageElement) => {
          await image.decode();
          const sample = document.createElement('canvas');
          sample.width = sample.height = 128;
          const context = sample.getContext('2d')!;
          context.drawImage(image, 0, 0, 128, 128);
          return Array.from(context.getImageData(0, 0, 128, 128).data);
        }),
    );
  }
  const difference = (a: number[], b: number[]) =>
    a.reduce((sum, value, index) => sum + (Math.abs(value - b[index]) > 40 ? 1 : 0), 0);
  expect(difference(images[0], images[1])).toBeGreaterThan(2500);
  expect(difference(images[0], images[2])).toBeLessThan(500);
});
