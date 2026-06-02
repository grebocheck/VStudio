import { Emotion } from '../../types';

export const TELEGRAM_STICKER_SIZE = 512;
export const TELEGRAM_STICKER_FPS = 60;
export const TELEGRAM_STICKER_DURATION_SECONDS = 3;
export const TELEGRAM_STICKER_MAX_TGS_BYTES = 64 * 1024;

const TELEGRAM_STICKER_CANVAS = `${TELEGRAM_STICKER_SIZE}x${TELEGRAM_STICKER_SIZE}` as const;

export type TelegramStickerSlug = 'happy' | 'love' | 'starry' | 'smug' | 'shocked' | 'angry' | 'cry' | 'cool' | 'dizzy';

export interface TelegramStickerSpec {
  emotion: Extract<Emotion, 'happy' | 'love' | 'starry' | 'smug' | 'shocked' | 'angry' | 'cry' | 'cool' | 'dizzy'>;
  emoji: string;
  label: string;
  slug: TelegramStickerSlug;
}

export const TELEGRAM_STICKER_SPECS: TelegramStickerSpec[] = [
  { emotion: 'happy', emoji: '😊', label: 'Happy', slug: 'happy' },
  { emotion: 'love', emoji: '😍', label: 'Love', slug: 'love' },
  { emotion: 'starry', emoji: '🤩', label: 'Starry', slug: 'starry' },
  { emotion: 'smug', emoji: '😏', label: 'Smug', slug: 'smug' },
  { emotion: 'shocked', emoji: '😮', label: 'Shocked', slug: 'shocked' },
  { emotion: 'angry', emoji: '😠', label: 'Angry', slug: 'angry' },
  { emotion: 'cry', emoji: '😭', label: 'Cry', slug: 'cry' },
  { emotion: 'cool', emoji: '😎', label: 'Cool', slug: 'cool' },
  { emotion: 'dizzy', emoji: '😵', label: 'Dizzy', slug: 'dizzy' },
];

export type TelegramStickerValidationSeverity = 'error' | 'warning';

export interface TelegramStickerValidationIssue {
  severity: TelegramStickerValidationSeverity;
  code: string;
  message: string;
  path?: string;
}

type LottieValue = Record<string, unknown>;
type Vec2 = [number, number];
type Vec3 = [number, number, number];
type ScalarKey = [frame: number, value: number];
type OffsetKey = [frame: number, x: number, y: number];
type ScaleKey = [frame: number, x: number, y?: number];

interface ZipEntry {
  name: string;
  data: Uint8Array | string;
}

interface StickerLayerMotion {
  anchor: Vec2;
  position?: OffsetKey[];
  scale?: ScaleKey[];
  rotation?: ScalarKey[];
  opacity?: ScalarKey[];
}

export interface TelegramEmotionAnimationPreset {
  slug: TelegramStickerSlug;
  label: string;
  timing: {
    fps: typeof TELEGRAM_STICKER_FPS;
    durationSeconds: typeof TELEGRAM_STICKER_DURATION_SECONDS;
    durationFrames: number;
    loop: true;
  };
  body: StickerLayerMotion;
  hair: StickerLayerMotion;
  head: StickerLayerMotion;
  eyes: StickerLayerMotion;
  expression: StickerLayerMotion;
  blush: StickerLayerMotion;
  accessory: StickerLayerMotion;
  overlay: StickerLayerMotion;
}

interface TelegramStickerFile {
  name: string;
  slug: TelegramStickerSlug;
  emoji: string;
  emotion: Emotion;
  sizeBytes: number;
  validation: {
    passed: boolean;
    errorCount: number;
    warningCount: number;
    issueCodes: string[];
  };
}

export interface TelegramStickerPack {
  fileName: string;
  zipBlob: Blob;
  manifest: {
    name: string;
    format: 'tgs';
    canvas: typeof TELEGRAM_STICKER_CANVAS;
    fps: typeof TELEGRAM_STICKER_FPS;
    durationSeconds: typeof TELEGRAM_STICKER_DURATION_SECONDS;
    background: 'transparent';
    maxTgsBytes: number;
    validated: true;
    stickers: TelegramStickerFile[];
    note: string;
  };
}

const FRAME_COUNT = TELEGRAM_STICKER_FPS * TELEGRAM_STICKER_DURATION_SECONDS;
const BASE_SIZE = 400;
const SCALE = TELEGRAM_STICKER_SIZE / BASE_SIZE;
const CURVE_BOUNDS_MARGIN = 88;
// Gradient fills/strokes (gf/gs) are supported by rlottie, so the avatar's
// gradients survive into stickers. Merges, trim paths, repeaters and rounded
// corners stay forbidden — rlottie handles them poorly.
const FORBIDDEN_SHAPE_TYPES = new Set(['mm', 'tm', 'rp', 'sr']);
const ALLOWED_SHAPE_TYPES = new Set(['el', 'fl', 'gf', 'gs', 'gr', 'rc', 'sh', 'st', 'tr']);

const px = (value: number) => Math.round(value * SCALE * 100) / 100;
const scaledPoint = ([x, y]: Vec2): Vec2 => [px(x), px(y)];
const scaledVec3 = ([x, y, z]: Vec3): Vec3 => [px(x), px(y), z];

const timing = {
  fps: TELEGRAM_STICKER_FPS,
  durationSeconds: TELEGRAM_STICKER_DURATION_SECONDS,
  durationFrames: FRAME_COUNT,
  loop: true,
} as const;

export {
  TELEGRAM_STICKER_CANVAS,
  FRAME_COUNT,
  BASE_SIZE,
  SCALE,
  CURVE_BOUNDS_MARGIN,
  FORBIDDEN_SHAPE_TYPES,
  ALLOWED_SHAPE_TYPES,
  px,
  scaledPoint,
  scaledVec3,
  timing,
};
export type {
  LottieValue,
  Vec2,
  Vec3,
  ScalarKey,
  OffsetKey,
  ScaleKey,
  ZipEntry,
  StickerLayerMotion,
  TelegramStickerFile,
};
