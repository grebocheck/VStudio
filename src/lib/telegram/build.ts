import { AvatarConfig } from '../../types';
import { TELEGRAM_EMOTION_ANIMATION_PRESETS } from './presets';
import {
  buildHairShapes,
  buildFrontHairShapes,
  buildBodyShapes,
  buildHeadShapes,
  buildEyes,
  buildBrows,
  buildMouth,
  buildBlushShapes,
  buildAccessoryShapes,
  buildEmotionOverlayLayers,
} from './shapes';
import { layer } from './lottie';
import { TELEGRAM_STICKER_FPS, TELEGRAM_STICKER_SIZE, FRAME_COUNT } from './core';
import type { LottieValue, TelegramStickerSpec } from './core';

export function buildTelegramStickerLottie(config: AvatarConfig, spec: TelegramStickerSpec): LottieValue {
  const preset = TELEGRAM_EMOTION_ANIMATION_PRESETS[spec.slug];
  const stickerConfig = { ...config, activeEmotion: spec.emotion, backgroundStyle: 'dark-studio' as const };

  // Authored back-to-front: back hair sits behind the body, the head base
  // behind the face, front hair (bangs/sidelocks) frames the face, and emotion
  // overlays (hearts, sparkles, tears) sit on top.
  const backToFront = [
    layer(1, 'back-hair', buildHairShapes(stickerConfig), preset.hair),
    layer(2, 'body', buildBodyShapes(stickerConfig), preset.body),
    layer(3, 'head-base', buildHeadShapes(stickerConfig), preset.head),
    layer(4, 'face-eyes', buildEyes(stickerConfig, spec.emotion), preset.eyes),
    layer(
      5,
      'face-expression',
      [...buildBrows(stickerConfig, spec.emotion), ...buildMouth(stickerConfig, spec.emotion)],
      preset.expression,
    ),
    layer(6, 'face-blush', buildBlushShapes(stickerConfig, spec.emotion), preset.blush),
    layer(7, 'front-hair', buildFrontHairShapes(stickerConfig), preset.hair),
    layer(8, 'accessory', buildAccessoryShapes(stickerConfig), preset.accessory),
    ...buildEmotionOverlayLayers(spec, preset, 9),
  ].filter((item) => Array.isArray(item.shapes) && item.shapes.length > 0);

  // Lottie paints the FIRST layer in the array on top, so emit front-to-back
  // (the reverse of the authored stack) and renumber `ind` to stay unique.
  const layers = backToFront.reverse().map((item, index) => ({ ...item, ind: index + 1 }));

  return {
    v: '5.7.4',
    fr: TELEGRAM_STICKER_FPS,
    ip: 0,
    op: FRAME_COUNT,
    w: TELEGRAM_STICKER_SIZE,
    h: TELEGRAM_STICKER_SIZE,
    nm: `${config.name || 'V-Studio'} ${spec.label} Telegram sticker`,
    ddd: 0,
    assets: [],
    layers,
    markers: [],
  };
}
