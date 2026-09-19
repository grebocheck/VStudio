import { AvatarConfig } from '../../types';
import { is3DModel } from '../avatarModel';
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
  if (is3DModel(config.modelId)) {
    throw new Error('This is a 3D model. Export PNG stickers; TGS supports vector artwork only.');
  }
  if (config.modelId === 'miya-nocturne') {
    throw new Error('Miya Nocturne uses illustrated artwork. Export PNG stickers; TGS supports vectors only.');
  }
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
    validationScope: 'local-structure-and-size',
    telegramPublished: false,
    stickers: stickerFiles,
    note: 'Experimental vector export. Local checks do not guarantee Telegram acceptance or visual fidelity. Extract the ZIP and upload individual .tgs files with @Stickers /newanimated.',
  };

  zipEntries.unshift(
    { name: 'manifest.json', data: JSON.stringify(manifest, null, 2) },
    {
      name: 'README.txt',
      data: `EXPERIMENTAL TGS / ЕКСПЕРИМЕНТАЛЬНИЙ TGS
The vector conversion may differ from the avatar preview. Local validation is not Telegram approval.
Векторна конвертація може відрізнятися від прев’ю. Локальна перевірка не є схваленням Telegram.

1. Extract the ZIP / Розпакуйте ZIP.
2. Open https://t.me/Stickers and send /newanimated, then a title.
   Відкрийте @Stickers та надішліть /newanimated, потім назву.
3. Send each .tgs as a document, then its emoji. Do not mix PNG and TGS in one set.
   Надішліть кожен .tgs як документ, потім його емодзі. Не змішуйте PNG і TGS в одному наборі.
4. /publish → /skip for optional icon → choose an available short name.
   /publish → /skip для необов’язкової іконки → оберіть вільне коротке ім’я.
Follow the current bot prompts / Дотримуйтеся актуальних підказок бота.

${stickerFiles.map((file) => `${file.name} → ${file.emoji}`).join('\n')}

If Telegram rejects a TGS, use the PNG pack in a new /newpack set.
Якщо Telegram не приймає TGS, скористайтеся PNG-набором через /newpack.
https://core.telegram.org/stickers
`,
    },
  );

  return {
    fileName: `${safeName}-telegram-tgs-pack.zip`,
    zipBlob: createZipBlob(zipEntries, date),
    manifest,
  };
}
