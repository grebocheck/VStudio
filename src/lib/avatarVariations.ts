import type { AvatarConfig } from '../types';
import { DEFAULT_CONFIG, PARAMETRIC_PRESETS } from '../presets';
import { mergeConfig } from './sanitizeConfig';

/** Matched hair, eye, fabric, and accessory colors, authored as complete palettes. */
const PALETTES = [
  { hair: '#342851', highlight: '#b194db', eyes: '#72c8be', fabric: '#263342', accent: '#a5ded1' },
  { hair: '#713e43', highlight: '#e49ca4', eyes: '#87c7bd', fabric: '#3b2842', accent: '#ecc5ab' },
  { hair: '#e6d9bd', highlight: '#fff3d6', eyes: '#7096c7', fabric: '#34415a', accent: '#d5ac68' },
  { hair: '#263c42', highlight: '#80b3ac', eyes: '#d9aa62', fabric: '#253f3a', accent: '#c6d9aa' },
  { hair: '#32304c', highlight: '#8584c0', eyes: '#d393bb', fabric: '#2e2b41', accent: '#cbb2e7' },
  { hair: '#925b3e', highlight: '#efbd8b', eyes: '#779785', fabric: '#493744', accent: '#dfa28e' },
] as const;

const SKIN_TONES = ['#f7e1d5', '#edd0b4', '#d8ae8e', '#b98265', '#865a49'] as const;

const pick = <T>(values: readonly T[], random: () => number): T =>
  values[Math.min(values.length - 1, Math.max(0, Math.floor(random() * values.length)))];

/** Keep character identity while exploring a coherent starter silhouette and palette. */
export function createAvatarVariation(current: AvatarConfig, random: () => number = Math.random): AvatarConfig {
  const starter = pick(PARAMETRIC_PRESETS, random).config;
  const palette = pick(PALETTES, random);
  return mergeConfig(DEFAULT_CONFIG, {
    ...starter,
    name: current.name,
    lore: current.lore,
    hairColor: palette.hair,
    eyebrowColor: palette.hair,
    hairHighlightColor: palette.highlight,
    hairGradient: 'linear',
    eyeColor: palette.eyes,
    eyeColorRight: palette.eyes,
    pupilColor: '#252033',
    clothingColor1: palette.fabric,
    clothingColor2: palette.accent,
    accessoryColor: palette.accent,
    skinColor: pick(SKIN_TONES, random),
    heterochromia: false,
    accessoryGlow: false,
    blushOpacity: 0.25,
    blushColor: '#df8190',
    artStyle: 'anime',
    irisStyle: 'organic',
    eyeHighlightStyle: 'double-spark',
    activeEmotion: 'none',
  });
}
