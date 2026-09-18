import { inflateSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodePalettePng } from './png';
import { TELEGRAM_STICKER_MAX_PNG_BYTES } from './staticPack';

async function decodePng(blob: Blob) {
  const data = new Uint8Array(await blob.arrayBuffer());
  expect(Array.from(data.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks: Record<string, Uint8Array> = {};
  for (let offset = 8; offset < data.length; ) {
    const length = new DataView(data.buffer).getUint32(offset);
    const name = new TextDecoder().decode(data.subarray(offset + 4, offset + 8));
    chunks[name] = data.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;
  }
  const header = new DataView(chunks.IHDR.buffer, chunks.IHDR.byteOffset, chunks.IHDR.byteLength);
  const width = header.getUint32(0);
  const height = header.getUint32(4);
  expect(chunks.IHDR[8]).toBe(8);
  expect(chunks.IHDR[9]).toBe(3);
  const rows = inflateSync(chunks.IDAT);
  const pixels: number[][] = [];
  for (let y = 0; y < height; y++) {
    expect(rows[y * (width + 1)]).toBe(0);
    for (let x = 0; x < width; x++) {
      const index = rows[y * (width + 1) + 1 + x];
      pixels.push([...chunks.PLTE.subarray(index * 3, index * 3 + 3), chunks.tRNS[index]]);
    }
  }
  return { pixels, width, height };
}

describe('PNG fallback for detailed sticker artwork', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips color and both transparent and soft-alpha pixels', async () => {
    const source = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0, 32, 128, 240, 128, 255, 255, 255, 255]);
    const decoded = await decodePng(await encodePalettePng(source, 2, 2));
    expect(decoded.width).toBe(2);
    expect(decoded.height).toBe(2);
    expect(decoded.pixels).toEqual([
      [255, 0, 0, 255],
      [0, 0, 0, 0],
      [32, 128, 240, 128],
      [255, 255, 255, 255],
    ]);
  });

  it('fits detailed 512px artwork below the limit without browser compression support', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    const source = new Uint8ClampedArray(512 * 512 * 4);
    for (let i = 0; i < source.length; i += 4) {
      source[i] = (i / 4) % 256;
      source[i + 1] = Math.floor(i / 2048) % 256;
      source[i + 2] = ((i / 4) * 73) % 256;
      source[i + 3] = i % 2048 ? 255 : 0;
    }
    const png = await encodePalettePng(source, 512, 512);
    expect(png.type).toBe('image/png');
    expect(png.size).toBeLessThan(TELEGRAM_STICKER_MAX_PNG_BYTES);
    const decoded = await decodePng(png);
    expect(decoded.width).toBe(512);
    expect(decoded.height).toBe(512);
    expect(decoded.pixels[0][3]).toBe(0);
    expect(decoded.pixels[1][3]).toBe(255);
  });

  it('rejects incomplete image data', async () => {
    await expect(encodePalettePng(new Uint8ClampedArray(4), 512, 512)).rejects.toThrow('dimensions');
  });
});
