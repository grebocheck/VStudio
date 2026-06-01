import { Emotion } from '../types';

/**
 * Scalar features derived from MediaPipe blendshapes + head pose for a single
 * frame. Kept as a plain data bag so the classifier is a pure function and can
 * be unit-tested without a webcam.
 */
export interface EmotionFeatures {
  jawOpen: number;
  browInnerUp: number;
  eyeWideAvg: number;
  browOuterUpAvg: number;
  browOuterUpDiff: number;
  cheekSquintAvg: number;
  smileAvg: number;
  eyeLookDownAvg: number;
  angryAvg: number;
  adjustedAngryAvg: number;
  blinkAvg: number;
  puckerAvg: number;
  mouthForm: number;
  /** Stateful gates resolved by the engine before classification. */
  isDizzy: boolean;
  isTrulySleepy: boolean;
}

/**
 * Priority-ordered expression classifier: maps per-frame facial features to a
 * single Emotion. Order matters — earlier branches win. Pure and deterministic.
 */
export function classifyEmotion(f: EmotionFeatures): Emotion {
  if (f.isDizzy) return 'dizzy';
  if (f.isTrulySleepy) return 'sleepy';
  if (f.jawOpen > 0.15 && (f.browInnerUp > 0.3 || f.eyeWideAvg > 0.3)) return 'shocked';
  if (f.eyeWideAvg > 0.5 && f.jawOpen > 0.25) return 'scared';
  if (f.browOuterUpDiff > 0.45 || f.browOuterUpAvg > 0.5) return 'cool';
  if (f.cheekSquintAvg > 0.45 && f.smileAvg > 0.15 && f.smileAvg < 0.4 && f.jawOpen < 0.1) return 'shy';
  if (f.smileAvg > 0.12 && f.smileAvg < 0.35 && f.eyeLookDownAvg > 0.35 && f.browInnerUp < 0.15 && f.angryAvg < 0.15)
    return 'relaxed';
  if (f.blinkAvg > 0.65 && (f.cheekSquintAvg > 0.3 || f.smileAvg > 0.3)) return 'squint';
  if (f.adjustedAngryAvg > 0.45 && f.mouthForm < 0.05) return 'angry';
  if (f.smileAvg > 0.42 && f.blinkAvg > 0.35) return 'smug';
  if (f.smileAvg > 0.45) return f.browInnerUp > 0.4 ? 'starry' : 'happy';
  if (f.puckerAvg > 0.45) return 'love';
  if (f.browInnerUp > 0.4 && f.mouthForm < -0.15) return 'depressed';
  if (f.mouthForm < -0.3) return 'cry';
  return 'none';
}
