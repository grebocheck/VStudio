// Vector TGS path that reuses the real avatar geometry.
//
// The avatar is rendered to a static SVG string per emotion, parsed into a DOM,
// and its `data-rig-node` groups are converted to Lottie shape layers. Sticker
// motion comes from the shared emotion presets, applied to those layers — so the
// detail is the avatar's own art, not a hand-rebuilt approximation.
//
// This module pulls in React + react-dom/server, so it is only imported on the
// vector-export path (browser). The pure assembly lives in ./svgToLottie.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VTuberAvatar } from '../../components/VTuberAvatar';
import { INITIAL_RIG } from '../../presets';
import { extractRigNodeLayers, lottieFromRigLayers } from './svgToLottie';
import type { LottieValue, TelegramStickerSpec } from './core';
import type { AvatarConfig } from '../../types';

/** Render the avatar (with the emotion's expression) and return its SVG root. */
export function avatarToSvgElement(config: AvatarConfig, spec: TelegramStickerSpec): Element {
  if (typeof DOMParser === 'undefined') {
    throw new Error('SVG sticker conversion requires a browser (DOM) environment.');
  }
  const rig = { ...INITIAL_RIG, activeEmotion: spec.emotion };
  const markup = renderToStaticMarkup(React.createElement(VTuberAvatar, { config, rig, transparent: true }));
  const svg = new DOMParser().parseFromString(markup, 'text/html').querySelector('svg');
  if (!svg) throw new Error('Avatar did not render an SVG root.');
  return svg;
}

/** Full vector build: avatar SVG → Lottie, for one emotion. */
export function buildTelegramStickerLottieFromAvatar(config: AvatarConfig, spec: TelegramStickerSpec): LottieValue {
  const svg = avatarToSvgElement(config, spec);
  return lottieFromRigLayers(extractRigNodeLayers(svg), config, spec);
}
