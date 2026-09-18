// Vector TGS path that reuses the real avatar geometry.
//
// The avatar is rendered to a static SVG string per emotion, parsed into a DOM,
// and its `data-rig-node` groups are converted to Lottie shape layers. Sticker
// motion comes from the shared emotion presets, applied to those layers — so the
// detail is the avatar's own art, not a hand-rebuilt approximation.
//
// This module pulls in React + react-dom/server, so it is only imported on the
// vector-export path (browser). The pure assembly lives in ./svgToLottie.
import { avatarToSvgElement } from './avatarSvg';
import { extractRigNodeLayers, lottieFromRigLayers } from './svgToLottie';
import type { LottieValue, TelegramStickerSpec } from './core';
import type { AvatarConfig } from '../../types';

export { avatarToSvgElement } from './avatarSvg';

/** Full vector build: avatar SVG → Lottie, for one emotion. */
export function buildTelegramStickerLottieFromAvatar(config: AvatarConfig, spec: TelegramStickerSpec): LottieValue {
  if (config.modelId === 'aurelia-3d') {
    throw new Error('Aurelia is a 3D model. Export PNG stickers; TGS supports vector artwork only.');
  }
  if (config.modelId === 'miya-nocturne') {
    throw new Error(
      'Miya Nocturne uses illustrated artwork. Export PNG stickers to keep every detail; TGS supports vectors only.',
    );
  }
  const svg = avatarToSvgElement(config, spec);
  if (svg.querySelector('image')) {
    throw new Error('TGS cannot include illustrated image layers. Export this model as PNG stickers.');
  }
  return lottieFromRigLayers(extractRigNodeLayers(svg), config, spec);
}
