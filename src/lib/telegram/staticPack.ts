import type { AvatarConfig } from '../../types';
import { drawSerializedSvgToCanvas, safeExportFileName } from '../avatarExport';
import { avatarToSvgElement, stickerRig } from './avatarSvg';
import { TELEGRAM_STICKER_SIZE, TELEGRAM_STICKER_SPECS, type TelegramStickerSpec } from './core';
import { createZipBlob } from './zip';
import { encodePalettePng } from './png';
import { is3DModel } from '../avatarModel';

// https://core.telegram.org/import-stickers#static-stickers
export const TELEGRAM_STICKER_MAX_PNG_BYTES = 512 * 1024;
export type StickerExportErrorCode = 'empty' | 'canvas' | 'render' | 'encode' | 'size' | 'transparency' | 'pixels';
export class StickerExportError extends Error {
  constructor(
    public readonly code: StickerExportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'StickerExportError';
  }
}

export interface StaticSticker {
  spec: TelegramStickerSpec;
  fileName: string;
  blob: Blob;
}
export interface StaticStickerPack {
  fileName: string;
  zipBlob: Blob;
  stickers: StaticSticker[];
  manifest: {
    name: string;
    format: 'png';
    canvas: { width: number; height: number };
    background: 'transparent';
    maxFileBytes: number;
    validation: 'local-format-size-and-alpha-checks';
    telegramPublished: false;
    stickers: Array<{ fileName: string; emoji: string; emotion: string; sizeBytes: number }>;
  };
}

/** Isolated image documents avoid conflicting SVG IDs across the preview grid. */
export function buildStaticStickerSvg(config: AvatarConfig, spec: TelegramStickerSpec): string {
  const svg = avatarToSvgElement(config, spec);
  svg.setAttribute('width', '400');
  svg.setAttribute('height', '400');
  svg.setAttribute('x', '0');
  svg.setAttribute('y', '0');
  svg.setAttribute('overflow', 'hidden');
  svg.removeAttribute('class');
  svg.querySelectorAll('[class]').forEach((node) => node.removeAttribute('class'));
  const artwork = new XMLSerializer().serializeToString(svg);
  return frameStickerArtwork(artwork);
}

function frameStickerArtwork(artwork: string): string {
  // Keep the original portrait framing, plus space for an outline on every edge.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-20 -20 440 440">
    <defs><filter id="sticker-outline" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="expanded"/>
      <feFlood flood-color="white"/><feComposite in2="expanded" operator="in" result="outline"/>
      <feGaussianBlur in="expanded" stdDeviation="1.4" result="shadow"/>
      <feOffset in="shadow" dy="2" result="offset"/>
      <feMerge><feMergeNode in="offset"/><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter></defs><g filter="url(#sticker-outline)">${artwork}</g></svg>`;
}

async function drawStickerArtwork(
  config: AvatarConfig,
  spec: TelegramStickerSpec,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
): Promise<void> {
  if (is3DModel(config.modelId)) {
    const { renderAvatar3DStill } = await import('../../components/three/avatar3DScene');
    const still = await renderAvatar3DStill(config, stickerRig(spec), canvas.width, canvas.height);
    const artwork = `<image href="${still.toDataURL('image/png')}" width="400" height="400"/>`;
    await drawSerializedSvgToCanvas(frameStickerArtwork(artwork), canvas, context);
    return;
  }
  await drawSerializedSvgToCanvas(buildStaticStickerSvg(config, spec), canvas, context);
}

export function validateStickerPixels(pixels: Uint8ClampedArray, width: number, height: number): void {
  if (width !== TELEGRAM_STICKER_SIZE || height !== TELEGRAM_STICKER_SIZE || pixels.length !== width * height * 4) {
    throw new StickerExportError('pixels', 'The sticker must be a complete 512 × 512 image.');
  }
  let visible = false;
  let transparent = false;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] > 0) visible = true;
    if (pixels[i] === 0) transparent = true;
  }
  if (!visible) throw new StickerExportError('pixels', 'The sticker image is empty.');
  if (!transparent) throw new StickerExportError('transparency', 'The sticker needs a transparent background.');
}

export function validateStaticStickerSize(size: number): void {
  if (size <= 0) throw new StickerExportError('encode', 'The PNG file is empty.');
  if (size > TELEGRAM_STICKER_MAX_PNG_BYTES) {
    throw new StickerExportError('size', 'The optimized sticker exceeds 512 KB. Try exporting it again.');
  }
}

export async function renderStaticSticker(config: AvatarConfig, spec: TelegramStickerSpec): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = TELEGRAM_STICKER_SIZE;
  canvas.height = TELEGRAM_STICKER_SIZE;
  const context = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!context) throw new StickerExportError('canvas', 'Could not create a canvas. Try a current browser.');
  try {
    await drawStickerArtwork(config, spec, canvas, context);
  } catch {
    throw new StickerExportError('render', 'Could not render the avatar. Reload the page and try again.');
  }
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  validateStickerPixels(pixels, canvas.width, canvas.height);
  let blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new StickerExportError('encode', 'Could not encode PNG. Try a current browser.'));
    }, 'image/png');
  });
  // Keep full color whenever it fits. Detailed artwork gets a palette only when required.
  if (blob.size > TELEGRAM_STICKER_MAX_PNG_BYTES) {
    blob = await encodePalettePng(pixels, canvas.width, canvas.height);
  }
  validateStaticStickerSize(blob.size);
  return blob;
}

/** Small raster previews avoid retaining nine copies of embedded source layers. */
export async function renderStaticStickerPreview(config: AvatarConfig, spec: TelegramStickerSpec): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new StickerExportError('canvas', 'Could not prepare sticker previews.');
  await drawStickerArtwork(config, spec, canvas, context);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new StickerExportError('encode', 'Could not prepare sticker previews.')),
      'image/png',
    );
  });
}

export function stickerImportReadme(stickers: StaticSticker[], packName: string): string {
  const emojiMap = stickers.map(({ fileName, spec }) => `${fileName} → ${spec.emoji}`).join('\n');
  return `V-Studio — ${packName}\n\nДОДАТИ В TELEGRAM\n1. Розпакуйте цей ZIP. Сам архів Telegram не імпортує.\n2. Відкрийте офіційний @Stickers: https://t.me/Stickers\n3. Створіть набір статичних стікерів у мініапці або надішліть /newpack і назву набору.\n4. Надсилайте PNG з папки stickers по одному як ФАЙЛ (документ), без стиснення. Не як фото.\n5. Після кожного файла надішліть відповідний емодзі з переліку нижче.\n6. Надішліть /publish. Для необов’язкової іконки — /skip. Виберіть вільне коротке ім’я та отримайте посилання.\nЯкщо команди змінилися, дотримуйтеся підказок @Stickers.\n\nADD TO TELEGRAM\n1. Extract this ZIP. Telegram does not import ZIP archives directly.\n2. Open the official @Stickers: https://t.me/Stickers\n3. Create a static sticker set in the mini app, or send /newpack and your pack title.\n4. Send each PNG in stickers as a FILE/document without compression, not as a photo.\n5. Send the matching emoji after each file. See the list below.\n6. Send /publish, use /skip for the optional icon, then choose an available short name to get your pack link.\nFollow @Stickers prompts if the commands change.\n\n${emojiMap}\n\n512 × 512 PNG • transparent background • each file ≤ 512 KB\nChecked locally for size, dimensions and transparency. Publication and acceptance happen in Telegram; this ZIP is not a published sticker set.\nRequirements: https://core.telegram.org/stickers\nImport guide: https://core.telegram.org/import-stickers\n`;
}

export async function createStaticTelegramStickerPack(
  config: AvatarConfig,
  baseName: string,
  options: {
    specs?: TelegramStickerSpec[];
    onProgress?: (completed: number, total: number) => void;
    date?: Date;
  } = {},
): Promise<StaticStickerPack> {
  const specs = options.specs ?? TELEGRAM_STICKER_SPECS;
  if (specs.length === 0) throw new StickerExportError('empty', 'Choose at least one sticker.');
  const uniqueSpecs = [...new Map(specs.map((spec) => [spec.slug, spec])).values()];
  const name = safeExportFileName(baseName || config.name || 'vstudio');
  const stickers: StaticSticker[] = [];
  options.onProgress?.(0, uniqueSpecs.length);
  for (const spec of uniqueSpecs) {
    const blob = await renderStaticSticker(config, spec);
    stickers.push({ spec, fileName: `${name}-${spec.slug}.png`, blob });
    options.onProgress?.(stickers.length, uniqueSpecs.length);
    // Give progress and input events a turn between full-resolution renders.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const manifest: StaticStickerPack['manifest'] = {
    name,
    format: 'png',
    canvas: { width: 512, height: 512 },
    background: 'transparent',
    maxFileBytes: TELEGRAM_STICKER_MAX_PNG_BYTES,
    validation: 'local-format-size-and-alpha-checks',
    telegramPublished: false,
    stickers: stickers.map(({ fileName, spec, blob }) => ({
      fileName: `stickers/${fileName}`,
      emoji: spec.emoji,
      emotion: spec.emotion,
      sizeBytes: blob.size,
    })),
  };
  const entries = await Promise.all(
    stickers.map(async ({ fileName, blob }) => ({
      name: `stickers/${fileName}`,
      data: new Uint8Array(await blob.arrayBuffer()),
    })),
  );
  const zipBlob = createZipBlob(
    [
      { name: 'README.txt', data: stickerImportReadme(stickers, name) },
      { name: 'manifest.json', data: JSON.stringify(manifest, null, 2) },
      ...entries,
    ],
    options.date,
  );
  return { fileName: `${name}-telegram-png-pack.zip`, zipBlob, stickers, manifest };
}
