import { AvatarConfig } from '../types';

/**
 * Allowed enum values per field, mirroring the unions in AvatarConfig.
 * Used to defensively merge untrusted partial configs (AI output, imported
 * JSON) without letting invalid values break the SVG renderer.
 */
const ENUMS = {
  pupilStyle: [
    'round',
    'star',
    'heart',
    'slit',
    'diamond',
    'cross',
    'flower',
    'spiral',
    'crescent',
    'infinity',
    'cat-vertical',
  ],
  eyebrowStyle: ['normal', 'thick', 'thin', 'sad', 'none'],
  hairStyleBang: [
    'classic',
    'side',
    'center-part',
    'short',
    'hime',
    'spiky',
    'curly-bangs',
    'cross-bangs',
    'wolf-cut',
    'curtain-bangs',
    'asymmetric',
    'blunt-bangs',
    'messy',
    'braided-bangs',
  ],
  hairStyleBack: [
    'straight',
    'tails',
    'short',
    'curly',
    'braids',
    'hime-long',
    'drill-tails',
    'wavy',
    'ponytail',
    'bun',
    'side-tail',
    'twintail-long',
    'messy-bun',
    'fishtail-braid',
    'layered',
  ],
  clothingStyle: [
    'hoodie',
    'kimono',
    'suit',
    'cyber-armor',
    'goth-dress',
    'druid-cloak',
    'sailor-fuku',
    'sweater',
    'maid',
    'idol-stage',
    'witch-robe',
    'royal-knight',
    'cyber-ninja',
    'lolita-dress',
    'school-blazer',
    'chinese-dress',
    'pirate-coat',
    'angel-dress',
    'punk-jacket',
  ],
  accessoryStyle: [
    'none',
    'headphones',
    'horns',
    'glasses',
    'neko-ears',
    'angel-halo',
    'fox-mask',
    'witch-hat',
    'crown',
    'bunny-ears',
    'eye-patch',
    'flower-crown',
    'hair-ribbons',
    'choker',
    'earrings',
    'tiara',
    'demon-wings',
    'scarf',
  ],
  backgroundStyle: ['gaming', 'nebula', 'green-screen', 'dark-studio'],
  earStyle: ['normal', 'elf', 'pointy'],
  hairGradient: ['none', 'linear', 'sunset', 'indigo-fade'],
  clothingPrint: ['none', 'cat', 'star', 'heart', 'cyber', 'cross'],
  artStyle: ['classic', 'anime', 'retro'],
  faceShape: ['default', 'sharp', 'round', 'chubby', 'mature'],
  eyeShape: ['default', 'almond', 'droopy', 'sharp', 'cat-eye'],
  beautyMark: ['none', 'left-cheek', 'right-cheek', 'under-eye', 'chin'],
  facePaint: ['none', 'tribal', 'cat-whiskers', 'butterfly', 'under-eye-stripe'],
  eyelashStyle: ['natural', 'glamour', 'minimal', 'none'],
  irisStyle: ['solid', 'organic', 'gemstone', 'galaxy'],
  eyeHighlightStyle: ['standard', 'double-spark', 'star-glint', 'none'],
  mouthShape: ['default', 'small', 'wide', 'pouty', 'thin'],
  lipStyle: ['natural', 'glossy', 'dark', 'gradient'],
  toothStyle: ['normal', 'fangs', 'gap-tooth', 'braces', 'sharp-teeth'],
  faceScar: ['none', 'cheek-slash', 'eye-scar', 'cross-forehead'],
  earDecoration: ['none', 'piercing', 'cuff', 'feather'],
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
  for (const key of [
    'skinColor',
    'eyeColor',
    'pupilColor',
    'eyebrowColor',
    'hairColor',
    'hairHighlightColor',
    'clothingColor1',
    'clothingColor2',
    'accessoryColor',
    'blushColor',
    'frecklesColor',
    'eyeColorRight',
    'lipColor',
  ] as const) {
    if (isHex(p[key])) out[key] = (p[key] as string).trim();
  }

  // Free text (trimmed, length-capped)
  if (typeof p.name === 'string') out.name = p.name.slice(0, 60);
  if (typeof p.lore === 'string') out.lore = p.lore.slice(0, 1200);

  // Booleans
  if (typeof p.hasFangs === 'boolean') out.hasFangs = p.hasFangs;
  if (typeof p.accessoryGlow === 'boolean') out.accessoryGlow = p.accessoryGlow;
  if (typeof p.freckles === 'boolean') out.freckles = p.freckles;
  if (typeof p.heterochromia === 'boolean') out.heterochromia = p.heterochromia;

  // Numeric ranges
  if (typeof p.blushOpacity === 'number') out.blushOpacity = clamp(p.blushOpacity, 0, 1);
  if (typeof p.headSize === 'number') out.headSize = clamp(p.headSize, 0.8, 1.2);
  if (typeof p.neckWidth === 'number') out.neckWidth = clamp(p.neckWidth, 0.6, 1.4);
  if (typeof p.neckHeight === 'number') out.neckHeight = clamp(p.neckHeight, 0.4, 1.4);
  if (typeof p.shoulderWidth === 'number') out.shoulderWidth = clamp(p.shoulderWidth, 0.7, 1.3);
  if (typeof p.frecklesDensity === 'number') out.frecklesDensity = clamp(p.frecklesDensity, 0.3, 1.0);

  return out;
}
