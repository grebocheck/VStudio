// Public surface for the Telegram TGS sticker generator. The implementation is
// split under ./telegram/* — see that folder for primitives, motion presets,
// avatar shape builders, Lottie assembly, validation, and packaging.
export {
  TELEGRAM_STICKER_SIZE,
  TELEGRAM_STICKER_FPS,
  TELEGRAM_STICKER_DURATION_SECONDS,
  TELEGRAM_STICKER_MAX_TGS_BYTES,
  TELEGRAM_STICKER_SPECS,
} from './telegram/core';
export type {
  TelegramStickerSlug,
  TelegramStickerSpec,
  TelegramStickerValidationSeverity,
  TelegramStickerValidationIssue,
  TelegramEmotionAnimationPreset,
  TelegramStickerPack,
} from './telegram/core';
export { TELEGRAM_EMOTION_ANIMATION_PRESETS } from './telegram/presets';
export { buildTelegramStickerLottie } from './telegram/build';
export { validateTelegramStickerLottie, validateTelegramStickerSize } from './telegram/validate';
export { createZipBlob } from './telegram/zip';
export { createTelegramStickerPack } from './telegram/pack';
