import { applyPalette, quantize } from 'gifenc';
import { crc32 } from './zip';

function chunk(name: string, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(data.length + 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  bytes.set(new TextEncoder().encode(name), 4);
  bytes.set(data, 8);
  view.setUint32(bytes.length - 4, crc32(bytes.subarray(4, bytes.length - 4)));
  return bytes;
}

/** Stored deflate blocks keep the fallback available without CompressionStream. */
function storeZlib(data: Uint8Array): Uint8Array {
  const blocks = Math.ceil(data.length / 65535);
  const bytes = new Uint8Array(2 + data.length + blocks * 5 + 4);
  const view = new DataView(bytes.buffer);
  bytes.set([0x78, 0x01]);
  let offset = 2;
  for (let start = 0; start < data.length; start += 65535) {
    const length = Math.min(65535, data.length - start);
    bytes[offset] = start + length === data.length ? 1 : 0;
    view.setUint16(offset + 1, length, true);
    view.setUint16(offset + 3, ~length & 0xffff, true);
    bytes.set(data.subarray(start, start + length), offset + 5);
    offset += length + 5;
  }
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  view.setUint32(offset, ((b << 16) | a) >>> 0);
  return bytes;
}

/**
 * Size fallback only: 8-bit indexed PNG with RGBA palette and soft transparency.
 * At 512² even uncompressed indices fit Telegram's 512 KiB budget.
 * PNG chunk layout: https://www.w3.org/TR/png-3/#11Chunks
 */
export async function encodePalettePng(pixels: Uint8ClampedArray, width: number, height: number): Promise<Blob> {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    pixels.length !== width * height * 4
  ) {
    throw new Error('PNG pixels must match the requested image dimensions.');
  }
  // Reserve a transparent entry so quantization can never turn the background opaque.
  const palette = quantize(pixels, 255, { format: 'rgba4444', oneBitAlpha: false });
  let transparentIndex = palette.findIndex((color) => color[3] === 0);
  if (transparentIndex === -1) {
    transparentIndex = palette.length;
    palette.push([0, 0, 0, 0]);
  }
  const indices = applyPalette(pixels, palette, 'rgba4444');
  for (let i = 0; i < indices.length; i++) {
    if (pixels[i * 4 + 3] === 0) indices[i] = transparentIndex;
  }
  const rows = new Uint8Array((width + 1) * height);
  for (let row = 0; row < height; row++) {
    // The first byte of each row is the PNG "None" filter.
    rows.set(indices.subarray(row * width, (row + 1) * width), row * (width + 1) + 1);
  }
  let compressed: Uint8Array;
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([rows]).stream().pipeThrough(new CompressionStream('deflate'));
    compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  } else {
    compressed = storeZlib(rows);
  }
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, width);
  headerView.setUint32(4, height);
  header[8] = 8;
  header[9] = 3;
  const colors = new Uint8Array(palette.length * 3);
  const alpha = new Uint8Array(palette.length);
  palette.forEach((color, index) => {
    colors.set(color.slice(0, 3), index * 3);
    alpha[index] = color[3] ?? 255;
  });
  return new Blob(
    [
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', header),
      chunk('PLTE', colors),
      chunk('tRNS', alpha),
      chunk('IDAT', compressed),
      chunk('IEND', new Uint8Array()),
    ],
    { type: 'image/png' },
  );
}
