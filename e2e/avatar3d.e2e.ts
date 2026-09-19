import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function openAurelia(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('vstudio_onboarding_complete', 'true');
    localStorage.setItem('vstudio_desktop_notice_dismissed', 'true');
    localStorage.setItem('vstudio_lang', 'en');
    localStorage.setItem(
      'vstudio_config',
      JSON.stringify({
        modelId: 'aurelia-3d',
        name: 'Aurelia',
        modelFraming: 'portrait',
        motionIntensity: 1,
      }),
    );
  });
  await page.goto('/');
  const canvas = page.locator('.avatar-viewport canvas[data-avatar3d="true"]');
  await expect(canvas).toBeVisible({ timeout: 45_000 });
  await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 45_000 });
  await expect(page.locator('.avatar-viewport svg[data-model="aurelia-3d"]')).toHaveCount(1);
  const pause = page.getByRole('button', { name: 'Pause animation', exact: true });
  if (await pause.count()) await pause.click();
  return canvas;
}

async function pixels(canvas: Locator) {
  return canvas.evaluate((source: HTMLCanvasElement) => {
    const context = source.getContext('webgl2');
    const sample = document.createElement('canvas');
    sample.width = sample.height = 96;
    const painter = sample.getContext('2d')!;
    painter.drawImage(source, 0, 0, 96, 96);
    const rgba = Array.from(painter.getImageData(0, 0, 96, 96).data);
    const colors = new Set<number>();
    let visible = 0;
    for (let index = 0; index < rgba.length; index += 4) {
      if (rgba[index + 3] < 32) continue;
      visible++;
      colors.add((rgba[index] >> 4) * 256 + (rgba[index + 1] >> 4) * 16 + (rgba[index + 2] >> 4));
    }
    return { rgba, visible, colors: colors.size, webgl: Boolean(context && !context.isContextLost()) };
  });
}

function changedPixels(first: number[], second: number[], foregroundOnly = false): number {
  let changed = 0;
  let samples = 0;
  for (let index = 0; index < first.length; index += 4) {
    if (foregroundOnly && first[index + 3] < 32 && second[index + 3] < 32) continue;
    samples++;
    const difference =
      Math.abs(first[index] - second[index]) +
      Math.abs(first[index + 1] - second[index + 1]) +
      Math.abs(first[index + 2] - second[index + 2]) +
      Math.abs(first[index + 3] - second[index + 3]);
    if (difference > 70) changed++;
  }
  return changed / Math.max(1, samples);
}

async function orbitQuarterTurn(page: Page, canvas: Locator) {
  const bounds = (await canvas.boundingBox())!;
  const startX = bounds.x + bounds.width * 0.3;
  const y = bounds.y + bounds.height * 0.5;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  // OrbitControls normalizes azimuth by the canvas's CSS height.
  await page.mouse.move(startX + bounds.height / 4, y, { steps: 16 });
  await page.mouse.up();
  // Let the visible control's damped orbit settle before inspecting its rendered view.
  await page.waitForTimeout(650);
}

test('renders a volumetric WebGL avatar from front, side and back and exposes working view controls', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const canvas = await openAurelia(page);
  await page.locator('.avatar-viewport').getByRole('button', { name: 'Front view', exact: true }).click();
  await page.waitForTimeout(350);
  const front = await pixels(canvas);
  expect(front.webgl).toBe(true);
  expect(front.visible).toBeGreaterThan(700);
  expect(front.colors).toBeGreaterThan(35);
  await canvas.screenshot({ path: testInfo.outputPath('aurelia-front.png') });

  await orbitQuarterTurn(page, canvas);
  const side = await pixels(canvas);
  expect(side.visible).toBeGreaterThan(500);
  expect(changedPixels(front.rgba, side.rgba)).toBeGreaterThan(0.08);
  await canvas.screenshot({ path: testInfo.outputPath('aurelia-side.png') });

  await orbitQuarterTurn(page, canvas);
  const back = await pixels(canvas);
  expect(back.visible).toBeGreaterThan(500);
  expect(changedPixels(front.rgba, back.rgba)).toBeGreaterThan(0.08);
  expect(changedPixels(side.rgba, back.rgba)).toBeGreaterThan(0.08);
  await canvas.screenshot({ path: testInfo.outputPath('aurelia-back.png') });

  await page.locator('.avatar-viewport').getByRole('button', { name: 'Front view', exact: true }).click();
  await page.waitForTimeout(650);
  const returned = await pixels(canvas);
  expect(changedPixels(front.rgba, returned.rgba)).toBeLessThan(0.08);

  await page.locator('.avatar-viewport').getByRole('button', { name: 'Wireframe', exact: true }).click();
  // Judge the model's pixels, not the transparent margins of a wide responsive viewport.
  await expect.poll(async () => changedPixels(returned.rgba, (await pixels(canvas)).rgba, true)).toBeGreaterThan(0.15);
  await page.locator('.avatar-viewport').getByRole('button', { name: 'Wireframe', exact: true }).click();
  await page.locator('.avatar-viewport').getByRole('button', { name: 'Turntable', exact: true }).click();
  await expect
    .poll(async () => changedPixels(returned.rgba, (await pixels(canvas)).rgba), { timeout: 5_000 })
    .toBeGreaterThan(0.03);
  await page.locator('.avatar-viewport').getByRole('button', { name: 'Turntable', exact: true }).click();
  expect(errors).toEqual([]);
});

test('keeps an opaque torso, shorts and both complete legs when the dress is hidden and restored', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const canvas = await openAurelia(page);
  const stage = page.locator('.avatar-viewport');
  await page.getByRole('button', { name: 'Full body', exact: true }).click();
  await stage.getByRole('button', { name: 'Front view', exact: true }).click();
  await page.waitForTimeout(400);
  const dressed = await pixels(canvas);
  expect(dressed.webgl).toBe(true);
  await canvas.screenshot({ path: testInfo.outputPath('aurelia-dress-visible.png') });

  await stage.getByRole('button', { name: 'Hide dress', exact: true }).click();
  await expect(stage.getByRole('button', { name: 'Show dress', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => changedPixels(dressed.rgba, (await pixels(canvas)).rgba)).toBeGreaterThan(0.015);
  const hidden = await pixels(canvas);
  const coverage = await canvas.evaluate((source: HTMLCanvasElement) => {
    const size = 384;
    const sample = document.createElement('canvas');
    sample.width = sample.height = size;
    const context = sample.getContext('2d')!;
    context.drawImage(source, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    const opaque = (x: number, y: number) => data[(y * size + x) * 4 + 3] >= 230;
    let minX = size,
      minY = size,
      maxX = -1,
      maxY = -1;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        if (!opaque(x, y)) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    const width = maxX - minX + 1,
      height = maxY - minY + 1,
      center = (minX + maxX) / 2;
    const row = (fraction: number) => Math.round(minY + height * fraction);
    const column = (fraction: number) => Math.round(center + width * fraction);
    const count = (y: number, from: number, to: number) => {
      let result = 0;
      for (let x = from; x <= to; x++) if (opaque(x, y)) result++;
      return result;
    };
    // A central strip avoids side hair and arms, which could conceal a missing torso in total-alpha checks.
    const torsoLeft = column(-0.1),
      torsoRight = column(0.1);
    let minimumTorsoRow = 1;
    for (let y = row(0.28); y <= row(0.48); y++)
      minimumTorsoRow = Math.min(minimumTorsoRow, count(y, torsoLeft, torsoRight) / (torsoRight - torsoLeft + 1));

    // From the upper thighs downward, both halves need an opaque leg on every row, including the knees.
    let minimumLeftLeg = size,
      minimumRightLeg = size;
    for (let y = row(0.48); y <= row(0.91); y++) {
      minimumLeftLeg = Math.min(minimumLeftLeg, count(y, column(-0.32), column(-0.015)));
      minimumRightLeg = Math.min(minimumRightLeg, count(y, column(0.015), column(0.32)));
    }
    // The permanent navy shorts must remain over the opaque hips when the outer garment is removed.
    let shortsSamples = 0,
      darkOpaqueShorts = 0;
    for (let y = row(0.42); y <= row(0.47); y++)
      for (let x = torsoLeft; x <= torsoRight; x++) {
        const offset = (y * size + x) * 4;
        shortsSamples++;
        if (opaque(x, y) && (data[offset] + data[offset + 1] + data[offset + 2]) / 3 < 130) darkOpaqueShorts++;
      }
    return {
      visibleHeight: height / size,
      minimumTorsoRow,
      minimumLeftLeg: minimumLeftLeg / width,
      minimumRightLeg: minimumRightLeg / width,
      shortsCoverage: darkOpaqueShorts / shortsSamples,
    };
  });
  await testInfo.attach('aurelia-body-coverage', { body: JSON.stringify(coverage), contentType: 'application/json' });
  expect(coverage.visibleHeight).toBeGreaterThan(0.7);
  expect(coverage.minimumTorsoRow, 'every central torso row stays opaque').toBeGreaterThan(0.95);
  expect(coverage.minimumLeftLeg, 'left leg has no missing horizontal section').toBeGreaterThan(0.035);
  expect(coverage.minimumRightLeg, 'right leg has no missing horizontal section').toBeGreaterThan(0.035);
  expect(coverage.shortsCoverage, 'navy shorts remain on the hips').toBeGreaterThan(0.8);
  await canvas.screenshot({ path: testInfo.outputPath('aurelia-dress-hidden.png') });

  await stage.getByRole('button', { name: 'Show dress', exact: true }).click();
  await expect(stage.getByRole('button', { name: 'Hide dress', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => changedPixels(hidden.rgba, (await pixels(canvas)).rgba)).toBeGreaterThan(0.015);
  await expect.poll(async () => changedPixels(dressed.rgba, (await pixels(canvas)).rgba)).toBeLessThan(0.006);
  expect(errors).toEqual([]);
});

interface GlbDocument {
  asset: { version: string };
  nodes: { mesh?: number; skin?: number }[];
  skins: { joints: number[]; inverseBindMatrices?: number }[];
  meshes: {
    primitives: { attributes: Record<string, number>; targets?: Record<string, number>[]; material?: number }[];
  }[];
  materials: unknown[];
  accessors: { count: number; type: string; bufferView?: number }[];
  buffers: { byteLength: number; uri?: string }[];
  bufferViews: { buffer: number; byteOffset?: number; byteLength: number }[];
}

test('downloads a real self-contained GLB with skinned meshes, joints, morph targets and materials', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openAurelia(page);
  const downloaded = page.waitForEvent('download', { timeout: 90_000 });
  await page.locator('.avatar-viewport').getByRole('button', { name: 'Download GLB', exact: true }).click();
  const download = await downloaded;
  await download.saveAs(testInfo.outputPath('aurelia-export.glb'));
  const bytes = await readFile((await download.path())!);
  expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  expect(bytes.length).toBeGreaterThan(100_000);

  let cursor = 12;
  let document: GlbDocument | undefined;
  let binarySize = 0;
  while (cursor < bytes.length) {
    expect(cursor + 8).toBeLessThanOrEqual(bytes.length);
    const length = bytes.readUInt32LE(cursor);
    const type = bytes.readUInt32LE(cursor + 4);
    expect(length % 4).toBe(0);
    expect(cursor + 8 + length).toBeLessThanOrEqual(bytes.length);
    if (type === 0x4e4f534a) document = JSON.parse(bytes.subarray(cursor + 8, cursor + 8 + length).toString('utf8'));
    if (type === 0x004e4942) binarySize += length;
    cursor += 8 + length;
  }
  expect(cursor).toBe(bytes.length);
  expect(document).toBeDefined();
  const gltf = document!;
  expect(gltf.asset.version).toBe('2.0');
  expect(binarySize).toBeGreaterThan(100_000);
  expect(gltf.materials.length).toBeGreaterThan(0);
  expect(gltf.skins.length).toBeGreaterThan(0);
  expect(gltf.skins.some((skin) => skin.joints.length >= 15)).toBe(true);
  for (const skin of gltf.skins) {
    expect(skin.joints.every((joint) => joint >= 0 && joint < gltf.nodes.length)).toBe(true);
    expect(skin.inverseBindMatrices).toBeDefined();
    expect(gltf.accessors[skin.inverseBindMatrices!].count).toBe(skin.joints.length);
  }
  const skinnedNodes = gltf.nodes.filter((node) => node.skin !== undefined && node.mesh !== undefined);
  expect(skinnedNodes.length).toBeGreaterThan(0);
  for (const node of skinnedNodes) {
    expect(gltf.skins[node.skin!]).toBeDefined();
    const primitives = gltf.meshes[node.mesh!].primitives;
    expect(
      primitives.every(
        (primitive) => primitive.attributes.JOINTS_0 !== undefined && primitive.attributes.WEIGHTS_0 !== undefined,
      ),
    ).toBe(true);
  }
  const primitives = gltf.meshes.flatMap((mesh) => mesh.primitives);
  expect(primitives.some((primitive) => (primitive.targets?.length ?? 0) >= 5)).toBe(true);
  expect(primitives.some((primitive) => gltf.accessors[primitive.attributes.POSITION].count > 1_000)).toBe(true);
  expect(
    primitives.every(
      (primitive) => primitive.material !== undefined && gltf.materials[primitive.material] !== undefined,
    ),
  ).toBe(true);
  expect(gltf.buffers.every((buffer) => !buffer.uri && buffer.byteLength <= binarySize)).toBe(true);
  expect(
    gltf.bufferViews.every((view) => view.buffer === 0 && (view.byteOffset ?? 0) + view.byteLength <= binarySize),
  ).toBe(true);
  expect(errors).toEqual([]);
});
