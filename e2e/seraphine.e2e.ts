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

test('switches between distinct 3D characters and exports the knight with textured hair, skinned ribbons and facial morphs', async ({
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
    nodes: { name?: string; mesh?: number; skin?: number; children?: number[] }[];
    skins: { joints: number[]; skeleton: number; inverseBindMatrices: number }[];
    meshes: {
      extras?: { targetNames?: string[] };
      primitives: { attributes: Record<string, number>; material: number; targets?: Record<string, number>[] }[];
    }[];
    materials: {
      name?: string;
      pbrMetallicRoughness?: { baseColorTexture?: { index: number } };
      normalTexture?: { index: number };
    }[];
    accessors: { count: number; type: string }[];
    textures: { name?: string; source: number }[];
    images: { bufferView: number; mimeType: string }[];
    bufferViews: { byteOffset?: number; byteLength: number }[];
  };
  expect(gltf.nodes.filter((node) => node.name?.startsWith('Seraphine_')).length).toBeGreaterThan(15);

  // The gold hems must travel with the satin after the exported rig is posed in another viewer.
  expect(gltf.nodes.filter((node) => /^Seraphine_Ribbon_[LR]_\d{2}$/.test(node.name ?? ''))).toHaveLength(42);
  for (const [side, prefix] of [
    ['Left', 'L'],
    ['Right', 'R'],
  ]) {
    const rootIndex = gltf.nodes.findIndex((node) => node.name === `Seraphine_Ribbon_${prefix}_Root`);
    expect(rootIndex).toBeGreaterThanOrEqual(0);
    const root = gltf.nodes[rootIndex];
    expect(root.children).toHaveLength(21);
    const expectedJoints = [rootIndex, ...root.children!];
    for (const [part, material] of [
      ['Long_Satin_Ribbon', 'Seraphine_Woven_Sapphire_Ribbon_Satin'],
      ['Ribbon_Gold_Embroidery', 'Seraphine_Ribbon_Gold_Woven_Selvedge'],
    ]) {
      const node = gltf.nodes.find((node) => node.name === `Seraphine_${side}_${part}`);
      expect(node?.mesh).toBeDefined();
      expect(node?.skin).toBeDefined();
      const skin = gltf.skins[node!.skin!];
      expect(skin.skeleton).toBe(rootIndex);
      expect(skin.joints).toEqual(expectedJoints);
      expect(gltf.accessors[skin.inverseBindMatrices]).toMatchObject({ count: 22, type: 'MAT4' });
      for (const primitive of gltf.meshes[node!.mesh!].primitives) {
        expect(gltf.materials[primitive.material].name).toBe(material);
        const vertexCount = gltf.accessors[primitive.attributes.POSITION].count;
        expect(vertexCount).toBeGreaterThan(100);
        for (const attribute of ['JOINTS_0', 'WEIGHTS_0']) {
          expect(primitive.attributes[attribute]).toBeDefined();
          expect(gltf.accessors[primitive.attributes[attribute]]).toMatchObject({
            count: vertexCount,
            type: 'VEC4',
          });
        }
      }
    }
  }

  // Check the maps actually used by the sculpted locks, including the binary images inside the GLB.
  const hair = gltf.nodes.find((node) => node.name === 'Seraphine_Swept_Fringe_Woven_Braids_and_Coiled_Locks');
  expect(hair?.mesh).toBeDefined();
  const hairPrimitive = gltf.meshes[hair!.mesh!].primitives[0];
  expect(hairPrimitive.attributes.TEXCOORD_0).toBeDefined();
  const hairMaterial = gltf.materials[hairPrimitive.material];
  for (const [textureInfo, name] of [
    [hairMaterial.pbrMetallicRoughness?.baseColorTexture, 'Seraphine_Woven_Golden_Hair_Pigment'],
    [hairMaterial.normalTexture, 'Seraphine_Longitudinal_Hair_Fibres'],
  ] as const) {
    expect(textureInfo).toBeDefined();
    const texture = gltf.textures[textureInfo!.index];
    expect(texture.name).toBe(name);
    const image = gltf.images[texture.source];
    expect(image.mimeType).toBe('image/png');
    const view = gltf.bufferViews[image.bufferView];
    expect(view.byteLength).toBeGreaterThan(128);
    const offset = 28 + jsonLength + (view.byteOffset ?? 0);
    expect(offset + view.byteLength).toBeLessThanOrEqual(bytes.length);
    expect(bytes.subarray(offset, offset + 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }

  const faces = gltf.meshes.filter((mesh) => mesh.extras?.targetNames?.includes('Face_Blendshape.Fcl_EYE_Close'));
  expect(faces.length).toBeGreaterThan(0);
  for (const face of faces) {
    expect(face.extras!.targetNames).toHaveLength(57);
    expect(face.extras!.targetNames).toContain('Face_Blendshape.Fcl_MTH_A');
    for (const primitive of face.primitives) {
      expect(primitive.targets).toHaveLength(57);
      for (const target of primitive.targets!)
        expect(gltf.accessors[target.POSITION].count).toBe(gltf.accessors[primitive.attributes.POSITION].count);
    }
  }
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
