import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';
import { VTuberAvatar } from '../VTuberAvatar';
import { INITIAL_RIG, PRESETS } from '../../presets';
import type { Emotion } from '../../types';

const SVG_PRESETS = PRESETS.filter((preset) => preset.config.modelId !== 'aurelia-3d');

function unresolvedReferences(svg: Element) {
  const ids = new Set(Array.from(svg.querySelectorAll('[id]'), (element) => element.id));
  return Array.from(svg.querySelectorAll('*')).flatMap((element) =>
    Array.from(element.attributes).flatMap((attribute) =>
      Array.from(attribute.value.matchAll(/url\(#([^)]+)\)/g), (match) => match[1]).filter((id) => !ids.has(id)),
    ),
  );
}

describe('avatar SVG composition', () => {
  it('keeps each preview’s palette and clipping independent when several avatars share the page', () => {
    const { document } = parseHTML(
      renderToStaticMarkup(
        <div>
          {SVG_PRESETS.map((preset) => (
            <VTuberAvatar key={preset.id} config={preset.config} rig={INITIAL_RIG} />
          ))}
        </div>,
      ),
    );
    const definitions = Array.from(
      document.querySelectorAll('linearGradient, radialGradient, clipPath, filter'),
      (element) => element.id,
    );
    expect(new Set(definitions).size).toBe(definitions.length);
    // Illustrated models contain an inner SVG for art-space framing.
    const avatars = Array.from(document.querySelectorAll('svg[role="img"]'));
    expect(avatars).toHaveLength(SVG_PRESETS.length);
    for (const svg of avatars) expect(unresolvedReferences(svg)).toEqual([]);
    // The front hair must resolve to the gradient belonging to its own character.
    SVG_PRESETS.forEach((preset, index) => {
      if (preset.config.modelId === 'miya-nocturne') return;
      const gradient = avatars[index].querySelector('[id$="-front-hair-gradient-id"]');
      expect(gradient?.querySelectorAll('stop')[1].getAttribute('stop-color')).toBe(preset.config.hairColor);
    });
  });

  it('exports self-contained SVGs for every starter character and reaction', () => {
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
    for (const preset of SVG_PRESETS) {
      for (const emotion of emotions) {
        const { document } = parseHTML(
          renderToStaticMarkup(
            <VTuberAvatar config={preset.config} rig={{ ...INITIAL_RIG, activeEmotion: emotion }} transparent />,
          ),
        );
        expect(unresolvedReferences(document.querySelector('svg')!), `${preset.id}: ${emotion}`).toEqual([]);
      }
    }
  });

  it('renders the same reaction frame independently of wall-clock time', () => {
    const scene = (
      <VTuberAvatar
        config={SVG_PRESETS[0].config}
        rig={{ ...INITIAL_RIG, activeEmotion: 'scared', breath: 0.4, mouthOpen: 0.7, tongueOut: 0.8 }}
        transparent
      />
    );
    const clock = vi.spyOn(Date, 'now');
    try {
      clock.mockReturnValue(100);
      const first = renderToStaticMarkup(scene);
      clock.mockReturnValue(100_000);
      expect(renderToStaticMarkup(scene)).toBe(first);
    } finally {
      clock.mockRestore();
    }
  });
});
