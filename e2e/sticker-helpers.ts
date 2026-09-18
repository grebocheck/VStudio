import { expect, type Page } from '@playwright/test';

export function unzipStoredFiles(bytes: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    expect(bytes.readUInt16LE(offset + 8)).toBe(0);
    const length = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString('utf8');
    const start = offset + 30 + nameLength + extraLength;
    entries.set(name, bytes.subarray(start, start + length));
    offset = start + length;
  }
  expect(bytes.readUInt32LE(offset)).toBe(0x02014b50);
  expect(bytes.readUInt32LE(bytes.length - 22)).toBe(0x06054b50);
  expect(bytes.readUInt16LE(bytes.length - 12)).toBe(entries.size);
  return entries;
}

export async function inspectPng(page: Page, buffer: Buffer) {
  expect(buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(buffer.length).toBeLessThanOrEqual(512 * 1024);
  return page.evaluate(
    async (bytes) => {
      const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
      let transparent = 0;
      let visible = 0;
      let edgeVisible = 0;
      let coloredPixels = 0;
      for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
          const offset = (y * image.width + x) * 4;
          const alpha = pixels[offset + 3];
          const rgb = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
          if (alpha > 200 && Math.max(...rgb) - Math.min(...rgb) > 30) coloredPixels++;
          if (alpha === 0) transparent++;
          if (alpha > 0) {
            visible++;
            if (x === 0 || y === 0 || x === image.width - 1 || y === image.height - 1) edgeVisible++;
          }
        }
      }
      image.close();
      return { width: canvas.width, height: canvas.height, transparent, visible, edgeVisible, coloredPixels };
    },
    [...buffer],
  );
}
