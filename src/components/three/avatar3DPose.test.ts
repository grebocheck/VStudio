import { describe, expect, it } from 'vitest';
import { INITIAL_RIG } from '../../presets';
import type { Emotion, RigParams } from '../../types';
import { calculateAvatar3DPose, poseToVrmExpressions } from './avatar3DPose';

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
const DEG = Math.PI / 180;

function numbers(value: unknown): number[] {
  if (typeof value === 'number') return [value];
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(numbers);
  return [];
}

describe('shared 3D avatar pose', () => {
  it('has identity skeletal transforms at rest and preserves the authored face pose', () => {
    const pose = calculateAvatar3DPose({}, INITIAL_RIG);
    for (const vector of [
      pose.headRotation,
      pose.bodyRotation,
      pose.bodyOffset,
      pose.eyeRotation,
      pose.hairLeftRotation,
      pose.hairRightRotation,
      pose.armLeftRotation,
      pose.armRightRotation,
    ])
      expect(vector).toEqual({ x: 0, y: 0, z: 0 });
    expect(pose.chestScaleY).toBe(1);
    expect(pose.eyeLeftOpen).toBe(1);
    expect(pose.eyeRightOpen).toBe(1);
    expect(pose.mouthOpen).toBe(0);
    expect(pose.jawRotation).toBe(0);
    expect(pose.mouthSmile).toBe(INITIAL_RIG.mouthForm);
  });

  it('looks right and up, tilts clockwise, and moves brows upward using the shared tracking convention', () => {
    const pose = calculateAvatar3DPose(
      {},
      {
        ...INITIAL_RIG,
        angleX: 15,
        angleY: 10,
        angleZ: 5,
        bodyX: 8,
        pupilX: 0.5,
        pupilY: 0.5,
        eyebrowY: 2,
      },
    );
    expect(pose.headRotation.y + pose.bodyRotation.y).toBeCloseTo(15 * DEG);
    expect(pose.headRotation.x + pose.bodyRotation.x).toBeLessThan(0);
    expect(pose.headRotation.z + pose.bodyRotation.z).toBeLessThan(0);
    expect(pose.eyeRotation.y).toBeGreaterThan(0);
    // Positive screen-space gaze Y looks down, unlike positive tracked head pitch.
    expect(pose.eyeRotation.x).toBeGreaterThan(0);
    expect(pose.bodyOffset.x).toBeGreaterThan(0);
    expect(pose.browLeft.lift).toBeGreaterThan(0);
  });

  it('caps physical movement after intensity scaling and bounds mouth, gaze, blink and tongue', () => {
    const pose = calculateAvatar3DPose(
      { motionIntensity: 500 },
      {
        ...INITIAL_RIG,
        angleX: 900,
        angleY: -900,
        angleZ: 900,
        bodyX: -900,
        eyeLOpen: -900,
        eyeROpen: 900,
        pupilX: 900,
        pupilY: -900,
        mouthOpen: 900,
        mouthForm: -900,
        hairSwayX: 900,
        hairSwayY: -900,
        tongueOut: 900,
      },
    );
    expect(pose.headRotation.y + pose.bodyRotation.y).toBeCloseTo(30 * DEG);
    expect(pose.headRotation.x + pose.bodyRotation.x).toBeCloseTo(20 * DEG);
    expect(pose.headRotation.z + pose.bodyRotation.z).toBeCloseTo(-8 * DEG);
    expect(Math.abs(pose.bodyOffset.x)).toBeLessThanOrEqual(0.033);
    expect(pose.eyeLeftOpen).toBe(0);
    expect(pose.eyeRightOpen).toBe(1);
    expect(pose.mouthOpen).toBe(1);
    expect(pose.mouthSmile).toBe(-1);
    expect(pose.tongueOut).toBe(1);
    expect(Math.abs(pose.eyeRotation.y)).toBeCloseTo(18 * DEG);
    expect(Math.abs(pose.hairLeftRotation.z)).toBeLessThanOrEqual(8 * DEG);
  });

  it('never produces NaN or infinite transforms from malformed tracker samples', () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      const rig = Object.fromEntries(Object.keys(INITIAL_RIG).map((key) => [key, value])) as unknown as RigParams;
      rig.hairSwayX = value;
      rig.hairSwayY = value;
      rig.emotionStrength = value;
      rig.activeEmotion = 'shocked';
      const pose = calculateAvatar3DPose({ motionIntensity: value }, rig);
      expect(numbers(pose).every(Number.isFinite)).toBe(true);
      expect(numbers(poseToVrmExpressions(pose)).every(Number.isFinite)).toBe(true);
    }
  });

  it('preserves independent full blinks inside expressions and leaves face tracking unaffected by intensity', () => {
    const rig = { ...INITIAL_RIG, eyeLOpen: 0, eyeROpen: 1, activeEmotion: 'angry' as const, mouthOpen: 0.6 };
    const quiet = calculateAvatar3DPose({ motionIntensity: 0.35 }, rig);
    const expressive = calculateAvatar3DPose({ motionIntensity: 1.5 }, rig);
    expect(quiet.eyeLeftOpen).toBe(0);
    expect(quiet.eyeRightOpen).toBeGreaterThan(0.5);
    expect(quiet.proceduralBlinkLeft).toBe(1);
    expect(quiet.proceduralBlinkRight).toBe(0);
    expect(quiet.eyeLeftOpen).toBe(expressive.eyeLeftOpen);
    expect(quiet.eyeRightOpen).toBe(expressive.eyeRightOpen);
    expect(quiet.mouthOpen).toBe(expressive.mouthOpen);
    expect(quiet.browLeft).toEqual(expressive.browLeft);
  });

  it('blends emotion effects to zero without disturbing raw pose and gives selected static emotions full strength', () => {
    const raw = { ...INITIAL_RIG, mouthOpen: 0.12, eyeLOpen: 0.4, eyebrowY: 1 };
    const neutral = calculateAvatar3DPose({}, raw);
    const starting = calculateAvatar3DPose({}, { ...raw, activeEmotion: 'shocked', emotionStrength: 0 });
    for (const key of ['mouthOpen', 'mouthSmile', 'eyeLeftOpen', 'eyeRightOpen', 'blush'] as const) {
      expect(starting[key]).toBe(neutral[key]);
    }
    expect(starting.browLeft).toEqual(neutral.browLeft);
    const halfway = calculateAvatar3DPose({}, { ...raw, activeEmotion: 'shocked', emotionStrength: 0.5 });
    const complete = calculateAvatar3DPose({}, { ...raw, activeEmotion: 'shocked' });
    expect(halfway.mouthOpen).toBeCloseTo((neutral.mouthOpen + complete.mouthOpen) / 2);
    const selected = calculateAvatar3DPose({ activeEmotion: 'shocked' }, { ...raw, emotionStrength: 0 });
    expect(selected).toEqual(complete);
  });

  it('passes secondary hair lag into separate sides and keeps bounded breathing around the rest height', () => {
    const pose = calculateAvatar3DPose({}, { ...INITIAL_RIG, hairSwayX: 12, hairSwayY: -5, breath: 0.25 });
    expect(pose.hairLeftRotation.z).toBeLessThan(0);
    expect(pose.hairRightRotation.z).toBeLessThan(0);
    expect(pose.hairLeftRotation.x).toBeLessThan(0);
    expect(pose.hairLeftRotation).not.toEqual(pose.hairRightRotation);
    expect(pose.bodyOffset.y).toBeCloseTo(0.003);
    expect(pose.chestScaleY).toBeCloseTo(1.007);
    expect(pose.armLeftRotation.z).toBe(-pose.armRightRotation.z);
  });
});

describe('VRM preset mapping', () => {
  it('maps separate blink channels without adding the shared blink twice', () => {
    const weights = poseToVrmExpressions(calculateAvatar3DPose({}, { ...INITIAL_RIG, eyeLOpen: 0 }));
    expect(weights.blinkLeft).toBe(1);
    expect(weights.blinkRight).toBe(0);
    expect(weights.blink).toBe(0);
    const happy = poseToVrmExpressions(calculateAvatar3DPose({}, { ...INITIAL_RIG, activeEmotion: 'happy' }));
    expect(happy.blinkLeft).toBe(0);
    expect(happy.blinkRight).toBe(0);
    expect(happy.happy).toBeGreaterThan(0);
  });

  it('keeps a single bounded vowel budget and returns every controlled channel to zero at rest', () => {
    for (const emotion of emotions) {
      const pose = calculateAvatar3DPose({}, { ...INITIAL_RIG, activeEmotion: emotion, mouthOpen: 0.7 });
      const weights = poseToVrmExpressions(pose);
      expect(Object.values(weights).every((value) => value >= 0 && value <= 1)).toBe(true);
      expect(weights.aa + weights.ih + weights.ou + weights.ee + weights.oh).toBeCloseTo(pose.mouthOpen);
    }
    expect(
      Object.values(poseToVrmExpressions(calculateAvatar3DPose({}, INITIAL_RIG))).every((weight) => weight === 0),
    ).toBe(true);
  });

  it('produces distinct preset mixtures for every manual emotion and follows transition strength', () => {
    const rendered = emotions.map((activeEmotion) =>
      JSON.stringify(poseToVrmExpressions(calculateAvatar3DPose({}, { ...INITIAL_RIG, activeEmotion }))),
    );
    expect(new Set(rendered).size).toBe(emotions.length);
    const half = poseToVrmExpressions(
      calculateAvatar3DPose(
        {},
        {
          ...INITIAL_RIG,
          activeEmotion: 'angry',
          emotionStrength: 0.5,
        },
      ),
    );
    const full = poseToVrmExpressions(calculateAvatar3DPose({}, { ...INITIAL_RIG, activeEmotion: 'angry' }));
    expect(half.angry).toBeCloseTo(full.angry / 2);
    const reset = poseToVrmExpressions(
      calculateAvatar3DPose(
        {},
        {
          ...INITIAL_RIG,
          activeEmotion: 'angry',
          emotionStrength: 0,
        },
      ),
    );
    expect(reset.angry).toBe(0);
  });
});
