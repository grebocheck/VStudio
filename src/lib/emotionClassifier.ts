import { Emotion } from '../types';
import { EMOTION_THRESHOLDS as T } from '../engine/constants';

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
  isLeaningIn: boolean;
}

/**
 * Priority-ordered expression classifier: maps per-frame facial features to a
 * single Emotion. Order matters — earlier branches win. Pure and deterministic.
 */
export function classifyEmotion(f: EmotionFeatures): Emotion {
  if (f.isDizzy) return 'dizzy';
  if (f.isTrulySleepy) return 'sleepy';
  if (f.isLeaningIn) return 'starry';
  if (f.jawOpen > T.shocked.jawOpen && (f.browInnerUp > T.shocked.browInnerUp || f.eyeWideAvg > T.shocked.eyeWideAvg))
    return 'shocked';
  if (f.eyeWideAvg > T.scared.eyeWideAvg && f.jawOpen > T.scared.jawOpen) return 'scared';
  if (f.browOuterUpDiff > T.cool.browOuterUpDiff || f.browOuterUpAvg > T.cool.browOuterUpAvg) return 'cool';
  if (
    f.cheekSquintAvg > T.shy.cheekSquintAvg &&
    f.smileAvg > T.shy.smileMin &&
    f.smileAvg < T.shy.smileMax &&
    f.jawOpen < T.shy.jawOpen
  )
    return 'shy';
  if (
    f.smileAvg > T.relaxed.smileMin &&
    f.smileAvg < T.relaxed.smileMax &&
    f.eyeLookDownAvg > T.relaxed.eyeLookDownAvg &&
    f.browInnerUp < T.relaxed.browInnerUp &&
    f.angryAvg < T.relaxed.angryAvg
  )
    return 'relaxed';
  if (f.blinkAvg > T.squint.blinkAvg && (f.cheekSquintAvg > T.squint.cheekSquintAvg || f.smileAvg > T.squint.smileAvg))
    return 'squint';
  if (f.adjustedAngryAvg > T.angry.adjustedAngryAvg && f.mouthForm < T.angry.mouthForm) return 'angry';
  if (f.smileAvg > T.smug.smileAvg && f.blinkAvg > T.smug.blinkAvg) return 'smug';
  if (f.smileAvg > T.happy.smileAvg) return f.browInnerUp > T.happy.starryBrowInnerUp ? 'starry' : 'happy';
  if (f.puckerAvg > T.love.puckerAvg) return 'love';
  if (f.browInnerUp > T.depressed.browInnerUp && f.mouthForm < T.depressed.mouthForm) return 'depressed';
  if (f.mouthForm < T.cry.mouthForm) return 'cry';
  return 'none';
}
