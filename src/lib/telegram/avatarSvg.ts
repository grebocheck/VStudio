import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VTuberAvatar } from '../../components/VTuberAvatar';
import { INITIAL_RIG } from '../../presets';
import type { AvatarConfig, RigParams } from '../../types';
import type { TelegramStickerSpec } from './core';

/** A deliberate still pose; independent of tracking, blinking and the live camera. */
export function stickerRig(spec: TelegramStickerSpec): RigParams {
  const expression: Partial<RigParams> = {
    happy: { mouthOpen: 0.38, mouthForm: 0.9 },
    love: { mouthOpen: 0.16, mouthForm: 0.8 },
    starry: { mouthOpen: 0.55, mouthForm: 0.85 },
    smug: { mouthForm: 0.7 },
    shocked: { mouthOpen: 0.8, mouthForm: 0, eyebrowY: -3 },
    angry: { mouthOpen: 0.18, mouthForm: -0.9 },
    cry: { mouthOpen: 0.55, mouthForm: -0.8 },
    cool: { mouthForm: 0.5 },
    dizzy: { mouthOpen: 0.35, mouthForm: -0.2 },
  }[spec.slug];
  return { ...INITIAL_RIG, ...expression, breath: 0, activeEmotion: spec.emotion };
}

/** Shared avatar artwork, including gradients, face details and the chosen outfit. */
export function avatarToSvgElement(config: AvatarConfig, spec: TelegramStickerSpec): SVGSVGElement {
  if (config.modelId === 'aurelia-3d') throw new Error('3D stickers require the asynchronous scene renderer.');
  if (typeof DOMParser === 'undefined') {
    throw new Error('Sticker rendering requires a browser.');
  }
  const markup = renderToStaticMarkup(
    React.createElement(VTuberAvatar, { config, rig: stickerRig(spec), transparent: true }),
  );
  const svg = new DOMParser().parseFromString(markup, 'text/html').querySelector('svg');
  if (!svg) throw new Error('Avatar did not render an SVG root.');
  return svg;
}
