import type { Emotion, RigParams } from '../types';
import { INITIAL_RIG } from '../presets';

const ranges = {
  angleX: [-30, 30],
  angleY: [-30, 30],
  angleZ: [-15, 15],
  eyeLOpen: [0, 1],
  eyeROpen: [0, 1],
  pupilX: [-1, 1],
  pupilY: [-1, 1],
  mouthOpen: [0, 1],
  mouthForm: [-1, 1],
  eyebrowY: [-5, 5],
  breath: [0, 1],
  bodyX: [-15, 15],
  hairSwayX: [-30, 30],
  hairSwayY: [-30, 30],
  tongueOut: [0, 1],
  emotionStrength: [0, 1],
} as const;
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

/** A paired client may still send malformed data; never feed it into SVG transforms. */
export function sanitizeOverlayRig(value: unknown): RigParams | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const rig: RigParams = { ...INITIAL_RIG };
  for (const field of Object.keys(ranges) as (keyof typeof ranges)[]) {
    const candidate = source[field];
    if (candidate === undefined) continue;
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return null;
    const [min, max] = ranges[field];
    rig[field] = Math.max(min, Math.min(max, candidate));
  }
  if (source.activeEmotion !== undefined) {
    if (!emotions.includes(source.activeEmotion as Emotion)) return null;
    rig.activeEmotion = source.activeEmotion as Emotion;
  }
  return rig;
}
