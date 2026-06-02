import { AvatarConfig } from '../../types';
import { safeExportFileName } from '../avatarExport';
import { buildTelegramStickerLottie } from './build';
import {
  validateTelegramStickerLottie,
  validateTelegramStickerSize,
  summarizeValidation,
  throwIfInvalid,
} from './validate';
import { gzipString, createZipBlob } from './zip';
import {
  TELEGRAM_STICKER_SPECS,
  TELEGRAM_STICKER_FPS,
  TELEGRAM_STICKER_DURATION_SECONDS,
  TELEGRAM_STICKER_MAX_TGS_BYTES,
  TELEGRAM_STICKER_CANVAS,
} from './core';
import type { LottieValue, TelegramStickerFile, TelegramStickerPack, TelegramStickerSpec, ZipEntry } from './core';

/** Produces the Lottie payload for one emotion. Swappable so packs can be built
 *  from the procedural generator or from the live avatar SVG converter. */
export type StickerLottieBuilder = (config: AvatarConfig, spec: TelegramStickerSpec) => LottieValue;

export async function createTelegramStickerPack(
  config: AvatarConfig,
  baseName: string,
  date = new Date(),
  buildLottie: StickerLottieBuilder = buildTelegramStickerLottie,
): Promise<TelegramStickerPack> {
  const safeName = safeExportFileName(baseName || config.name || 'vstudio-sticker-pack');
  const stickerFiles: TelegramStickerFile[] = [];
  const zipEntries: ZipEntry[] = [];

  for (const spec of TELEGRAM_STICKER_SPECS) {
    const lottie = buildLottie(config, spec);
    const structuralIssues = validateTelegramStickerLottie(lottie);
    const fileName = `stickers/${safeName}-${spec.slug}.tgs`;
    throwIfInvalid(fileName, structuralIssues);

    const tgsData = await gzipString(JSON.stringify(lottie));
    const sizeIssues = validateTelegramStickerSize(tgsData.length, fileName);
    const issues = [...structuralIssues, ...sizeIssues];
    throwIfInvalid(fileName, issues);

    stickerFiles.push({
      name: fileName,
      slug: spec.slug,
      emoji: spec.emoji,
      emotion: spec.emotion,
      sizeBytes: tgsData.length,
      validation: summarizeValidation(issues),
    });
    zipEntries.push({ name: fileName, data: tgsData });
  }

  const manifest: TelegramStickerPack['manifest'] = {
    name: safeName,
    format: 'tgs',
    canvas: TELEGRAM_STICKER_CANVAS,
    fps: TELEGRAM_STICKER_FPS,
    durationSeconds: TELEGRAM_STICKER_DURATION_SECONDS,
    background: 'transparent',
    maxTgsBytes: TELEGRAM_STICKER_MAX_TGS_BYTES,
    validated: true,
    stickers: stickerFiles,
    note: 'Upload the .tgs files with @Stickers. The ZIP is only a local bundle; Telegram uses the individual .tgs files.',
  };

  zipEntries.unshift({ name: 'manifest.json', data: JSON.stringify(manifest, null, 2) });

  return {
    fileName: `${safeName}-telegram-tgs-pack.zip`,
    zipBlob: createZipBlob(zipEntries, date),
    manifest,
  };
}
