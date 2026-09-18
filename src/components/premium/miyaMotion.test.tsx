import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { VTuberAvatar } from '../VTuberAvatar';
import { applyAvatarFrameTransforms } from '../../lib/avatarFrame';
import { INITIAL_RIG, MIYA_NOCTURNE_PRESET } from '../../presets';
import type { AvatarConfig, Emotion, RigParams } from '../../types';
import { miyaFrame } from './miyaMotion';

const config = MIYA_NOCTURNE_PRESET.config;
const emotions: Emotion[] = [
  'none',
  'happy',
  'angry',
  'cry',
  'shocked',
  'smug',
  'love',
  'starry',
  'squint',
  'depressed',
  'dizzy',
  'cool',
  'scared',
  'sleepy',
  'shy',
  'relaxed',
];

function renderAvatar(rig: RigParams = INITIAL_RIG, overrides: Partial<AvatarConfig> = {}) {
  const { document } = parseHTML(
    renderToStaticMarkup(<VTuberAvatar config={{ ...config, ...overrides }} rig={rig} transparent />),
  );
  return document.querySelector('svg') as unknown as SVGSVGElement;
}

function frameAttributes(svg: SVGSVGElement) {
  return Object.fromEntries(
    Array.from(svg.querySelectorAll('[data-miya-node]'), (node) => [
      node.getAttribute('data-miya-node'),
      Object.fromEntries(
        ['transform', 'd', 'opacity']
          .filter((name) => node.hasAttribute(name))
          .map((name) => [name, node.getAttribute(name)]),
      ),
    ]),
  );
}

describe('illustrated Miya model', () => {
  it('loads real high-resolution local art and resolves every mask, clip and gradient in each reaction', () => {
    const images = new Set<string>();
    for (const emotion of emotions) {
      const svg = renderAvatar({ ...INITIAL_RIG, activeEmotion: emotion });
      expect(svg.dataset.model).toBe('miya-nocturne');
      expect(svg.querySelector('[data-avatar-background]')).toBeNull();
      const ids = new Set(Array.from(svg.querySelectorAll('[id]'), (node) => node.id));
      for (const node of svg.querySelectorAll('*')) {
        for (const attribute of Array.from(node.attributes)) {
          for (const reference of attribute.value.matchAll(/url\(#([^)]+)\)/g)) {
            expect(ids.has(reference[1]), `${emotion}: unresolved ${reference[1]}`).toBe(true);
          }
        }
      }
      for (const image of svg.querySelectorAll('image')) images.add(image.getAttribute('href')!);
    }
    expect(images.size).toBeGreaterThanOrEqual(3);
    for (const href of images) {
      expect(href).toMatch(/^\/models\/miya-nocturne\/[a-z-]+\.png$/);
      const png = readFileSync(resolve('public', href.slice(1)));
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(768);
      expect(png.readUInt32BE(20)).toBeGreaterThanOrEqual(1024);
    }
  });

  it('keeps all definitions independent across simultaneous premium previews', () => {
    const { document } = parseHTML(
      renderToStaticMarkup(
        <div>
          {emotions.map((emotion) => (
            <VTuberAvatar key={emotion} config={config} rig={{ ...INITIAL_RIG, activeEmotion: emotion }} />
          ))}
        </div>,
      ),
    );
    const ids = Array.from(document.querySelectorAll('[id]'), (node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('progressively widens the square art framing from portrait to complete artwork', () => {
    const widths = (['portrait', 'halfbody', 'full'] as const).map((modelFraming) => {
      const svg = renderAvatar(INITIAL_RIG, { modelFraming });
      expect(svg.getAttribute('viewBox')).toBe('0 0 400 400');
      const bounds = svg.querySelector('svg')!.getAttribute('viewBox')!.split(/\s+/).map(Number);
      expect(bounds).toHaveLength(4);
      expect(bounds.every(Number.isFinite)).toBe(true);
      expect(bounds[2]).toBe(bounds[3]);
      return bounds[2];
    });
    expect(widths[0]).toBeLessThan(widths[1]);
    expect(widths[1]).toBeLessThan(widths[2]);
  });

  it('gives every selectable reaction a distinct visible expression', () => {
    const renderedStates = emotions.map((activeEmotion) =>
      JSON.stringify(frameAttributes(renderAvatar({ ...INITIAL_RIG, activeEmotion }))),
    );
    expect(new Set(renderedStates).size).toBe(emotions.length);
  });

  it('matches a freshly rendered frame after live motion and emotion updates, then resets cleanly', () => {
    const svg = renderAvatar();
    for (const emotion of [...emotions, 'none'] as Emotion[]) {
      const rig: RigParams = {
        ...INITIAL_RIG,
        activeEmotion: emotion,
        angleX: 30,
        angleY: -30,
        angleZ: 15,
        breath: 0.25,
        hairSwayX: 18,
        bodyX: -15,
        pupilX: -1,
        pupilY: 1,
        eyeLOpen: 0,
        eyeROpen: 0.65,
        mouthOpen: 0.8,
        mouthForm: -0.7,
        eyebrowY: 4,
      };
      applyAvatarFrameTransforms(svg, config, rig);
      expect(frameAttributes(svg), emotion).toEqual(frameAttributes(renderAvatar(rig)));
    }
    applyAvatarFrameTransforms(svg, config, INITIAL_RIG);
    expect(frameAttributes(svg)).toEqual(frameAttributes(renderAvatar()));
  });
});

describe('Miya motion bounds', () => {
  it('clamps tracked values to the supported range and survives non-finite tracker samples', () => {
    const bounded: RigParams = {
      ...INITIAL_RIG,
      angleX: 30,
      angleY: -30,
      angleZ: 15,
      bodyX: -15,
      hairSwayX: 18,
      breath: 1,
      eyeLOpen: 0,
      eyeROpen: 1,
      pupilX: -1,
      pupilY: 1,
      mouthOpen: 1,
      mouthForm: -1,
      eyebrowY: 5,
    };
    const extreme: RigParams = {
      ...bounded,
      angleX: 900,
      angleY: -900,
      angleZ: 900,
      bodyX: -900,
      hairSwayX: 900,
      breath: 900,
      eyeLOpen: -900,
      eyeROpen: 900,
      pupilX: -900,
      pupilY: 900,
      mouthOpen: 900,
      mouthForm: -900,
      eyebrowY: 900,
    };
    expect(miyaFrame(config, extreme)).toEqual(miyaFrame(config, bounded));
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const rig = Object.fromEntries(Object.keys(bounded).map((key) => [key, value])) as unknown as RigParams;
      const frame = miyaFrame(config, rig);
      for (const [key, output] of Object.entries(frame)) {
        if (typeof output === 'number') expect(Number.isFinite(output), key).toBe(true);
        if (typeof output === 'string') expect(output, key).not.toMatch(/NaN|Infinity/);
      }
    }
  });

  it('controls left and right blinks independently and preserves mouth range', () => {
    const open = miyaFrame(config, INITIAL_RIG);
    const wink = miyaFrame(config, { ...INITIAL_RIG, eyeLOpen: 0, mouthOpen: 1 });
    expect(wink.eyeLeft).not.toBe(open.eyeLeft);
    expect(wink.eyeRight).toBe(open.eyeRight);
    expect(wink.eyeLeftOpacity).toBe(0);
    expect(wink.lidLeftOpacity).toBe(1);
    expect(wink.eyeRightOpacity).toBe(1);
    expect(wink.lidRightOpacity).toBe(0);
    expect(wink.mouth).toBe(1);
    expect(open.mouth).toBe(0);
    expect(wink.mouthPath).not.toBe(open.mouthPath);
    expect(wink.mouthHighlight).not.toBe(open.mouthHighlight);
    const squint = miyaFrame(config, { ...INITIAL_RIG, activeEmotion: 'squint' });
    expect(squint.eyeLeft).not.toBe(open.eyeLeft);
    expect(squint.eyeRight).not.toBe(open.eyeRight);
  });

  it('uses a triggered emotion ahead of the selected one and falls back when the trigger ends', () => {
    const selected = { ...config, activeEmotion: 'shy' as const };
    expect(miyaFrame(selected, INITIAL_RIG).emotion).toBe('shy');
    expect(miyaFrame(selected, { ...INITIAL_RIG, activeEmotion: 'angry' }).emotion).toBe('angry');
    expect(miyaFrame(selected, { ...INITIAL_RIG, activeEmotion: 'none' }).emotion).toBe('shy');
  });
});
