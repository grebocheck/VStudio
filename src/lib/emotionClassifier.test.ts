import { describe, it, expect } from 'vitest';
import { classifyEmotion, EmotionFeatures } from './emotionClassifier';

const neutral: EmotionFeatures = {
  jawOpen: 0,
  browInnerUp: 0,
  eyeWideAvg: 0,
  browOuterUpAvg: 0,
  browOuterUpDiff: 0,
  cheekSquintAvg: 0,
  smileAvg: 0,
  eyeLookDownAvg: 0,
  angryAvg: 0,
  adjustedAngryAvg: 0,
  blinkAvg: 0,
  puckerAvg: 0,
  mouthForm: 0,
  isDizzy: false,
  isTrulySleepy: false,
};

const f = (over: Partial<EmotionFeatures>): EmotionFeatures => ({ ...neutral, ...over });

describe('classifyEmotion', () => {
  it('returns none for a neutral face', () => {
    expect(classifyEmotion(neutral)).toBe('none');
  });

  it('prioritizes dizzy and sleepy gates above everything', () => {
    expect(classifyEmotion(f({ isDizzy: true, smileAvg: 0.9 }))).toBe('dizzy');
    expect(classifyEmotion(f({ isTrulySleepy: true, smileAvg: 0.9 }))).toBe('sleepy');
  });

  it('detects shocked when jaw is open with raised brows or wide eyes', () => {
    expect(classifyEmotion(f({ jawOpen: 0.2, browInnerUp: 0.4 }))).toBe('shocked');
    expect(classifyEmotion(f({ jawOpen: 0.2, eyeWideAvg: 0.4 }))).toBe('shocked');
  });

  it('KNOWN QUIRK: scared is shadowed by shocked (shocked gate is looser)', () => {
    // shocked fires at jawOpen>0.15 && eyeWideAvg>0.3, so the stricter scared
    // condition (eyeWideAvg>0.5 && jawOpen>0.25) is currently unreachable.
    // Documented here so a future reorder is a deliberate, tested change.
    expect(classifyEmotion(f({ jawOpen: 0.3, eyeWideAvg: 0.55, browInnerUp: 0 }))).toBe('shocked');
  });

  it('detects happy vs starry by inner-brow raise', () => {
    expect(classifyEmotion(f({ smileAvg: 0.6 }))).toBe('happy');
    expect(classifyEmotion(f({ smileAvg: 0.6, browInnerUp: 0.5 }))).toBe('starry');
  });

  it('detects smug for a smaller smile with squinted eyes', () => {
    expect(classifyEmotion(f({ smileAvg: 0.43, blinkAvg: 0.4 }))).toBe('smug');
  });

  it('detects angry only when not smiling', () => {
    expect(classifyEmotion(f({ adjustedAngryAvg: 0.5, mouthForm: 0 }))).toBe('angry');
    expect(classifyEmotion(f({ adjustedAngryAvg: 0.5, mouthForm: 0.5 }))).not.toBe('angry');
  });

  it('detects love (pucker) and cry (frown)', () => {
    expect(classifyEmotion(f({ puckerAvg: 0.5 }))).toBe('love');
    expect(classifyEmotion(f({ mouthForm: -0.5 }))).toBe('cry');
  });
});
