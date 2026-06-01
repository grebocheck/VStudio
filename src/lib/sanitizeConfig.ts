import { AvatarConfig } from '../types';

/**
 * Allowed enum values per field, mirroring the unions in AvatarConfig.
 * Used to defensively merge untrusted partial configs (AI output, imported
 * JSON) without letting invalid values break the SVG renderer.
 */
const ENUMS = {
  pupilStyle: ['round', 'star', 'heart', 'slit'],
  eyebrowStyle: ['normal', 'thick', 'thin', 'sad'],
  hairStyleBang: ['classic', 'side', 'center-part', 'short', 'hime', 'spiky', 'curly-bangs', 'cross-bangs'],
  hairStyleBack: ['straight', 'tails', 'short', 'curly', 'braids', 'hime-long', 'drill-tails', 'wavy'],
  clothingStyle: ['hoodie', 'kimono', 'suit', 'cyber-armor', 'goth-dress', 'druid-cloak', 'sailor-fuku', 'sweater', 'maid'],
  accessoryStyle: ['none', 'headphones', 'horns', 'glasses', 'neko-ears', 'angel-halo', 'fox-mask'],
  backgroundStyle: ['gaming', 'nebula', 'green-screen', 'dark-studio'],
  earStyle: ['normal', 'elf', 'pointy'],
  hairGradient: ['none', 'linear', 'sunset', 'indigo-fade'],
  clothingPrint: ['none', 'cat', 'star', 'heart', 'cyber', 'cross'],
  artStyle: ['classic', 'anime', 'retro'],
} as const;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const isHex = (v: unknown): v is string => typeof v === 'string' && HEX_RE.test(v.trim());

/**
 * Merge an untrusted partial config onto a trusted base. Every field is
 * validated/clamped; anything invalid falls back to the base value, so the
 * result is always a fully-valid AvatarConfig safe to render.
 */
export function mergeConfig(base: AvatarConfig, partial: Partial<AvatarConfig> | null | undefined): AvatarConfig {
  if (!partial || typeof partial !== 'object') return base;
  const out: AvatarConfig = { ...base };
  const p = partial as Record<string, unknown>;

  // Enum fields
  for (const key of Object.keys(ENUMS) as (keyof typeof ENUMS)[]) {
    const allowed = ENUMS[key] as readonly string[];
    const val = p[key];
    if (typeof val === 'string' && allowed.includes(val)) {
      (out as unknown as Record<string, unknown>)[key] = val;
    }
  }

  // Color fields (HEX only)
  for (const key of ['skinColor', 'eyeColor', 'pupilColor', 'eyebrowColor', 'hairColor', 'hairHighlightColor', 'clothingColor1', 'clothingColor2', 'accessoryColor', 'blushColor'] as const) {
    if (isHex(p[key])) out[key] = (p[key] as string).trim();
  }

  // Free text (trimmed, length-capped)
  if (typeof p.name === 'string') out.name = p.name.slice(0, 60);
  if (typeof p.lore === 'string') out.lore = p.lore.slice(0, 1200);

  // Booleans
  if (typeof p.hasFangs === 'boolean') out.hasFangs = p.hasFangs;
  if (typeof p.accessoryGlow === 'boolean') out.accessoryGlow = p.accessoryGlow;

  // Numeric ranges
  if (typeof p.blushOpacity === 'number') out.blushOpacity = clamp(p.blushOpacity, 0, 1);
  if (typeof p.headSize === 'number') out.headSize = clamp(p.headSize, 0.8, 1.2);
  if (typeof p.neckWidth === 'number') out.neckWidth = clamp(p.neckWidth, 0.6, 1.4);
  if (typeof p.neckHeight === 'number') out.neckHeight = clamp(p.neckHeight, 0.6, 1.4);
  if (typeof p.shoulderWidth === 'number') out.shoulderWidth = clamp(p.shoulderWidth, 0.7, 1.3);

  return out;
}
