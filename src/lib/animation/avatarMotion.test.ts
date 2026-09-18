import { describe, expect, it } from 'vitest';
import { INITIAL_RIG } from '../../presets';
import type { RigParams } from '../../types';
import {
  advanceAvatarMotion,
  advanceEmotionTransition,
  createAvatarMotionState,
  MAX_MOTION_ELAPSED_MS,
  responseForElapsed,
  type AvatarMotionInput,
} from './avatarMotion';

function simulate(fps: number, seconds: number, input: AvatarMotionInput = { mode: 'auto' }) {
  let rig = { ...INITIAL_RIG };
  let state = createAvatarMotionState(rig);
  const frames: RigParams[] = [];
  for (let frame = 0; frame < fps * seconds; frame++) {
    ({ rig, state } = advanceAvatarMotion(state, rig, input, 1000 / fps));
    frames.push(rig);
  }
  return { rig, state, frames };
}

describe('avatar motion timeline', () => {
  it('produces the same gaze, breathing, blinks and secondary motion at 30, 60, 120 and 144 Hz', () => {
    const reference = simulate(120, 20);
    for (const fps of [30, 60, 144]) {
      const actual = simulate(fps, 20);
      for (const key of Object.keys(reference.rig) as (keyof RigParams)[]) {
        const value = reference.rig[key];
        if (typeof value === 'number') expect(actual.rig[key], `${fps}Hz ${key}`).toBeCloseTo(value, 9);
      }
      expect(actual.state.blinkCount).toBe(reference.state.blinkCount);
      expect(actual.state.gazeCount).toBe(reference.state.gazeCount);
      expect(actual.state.random).toBe(reference.state.random);
    }
  });

  it('lets eyes acquire a cursor target before the head and torso, without snapping the pose', () => {
    const rig = { ...INITIAL_RIG };
    const first = advanceAvatarMotion(
      createAvatarMotionState(rig),
      rig,
      { mode: 'mouse', pointer: { x: 1, y: -0.5 } },
      75,
    );
    expect(first.rig.pupilX).toBeGreaterThan(0.5);
    expect(first.rig.angleX).toBeGreaterThan(0);
    expect(first.rig.angleX).toBeLessThan(8);
    expect(first.rig.pupilX / 0.95).toBeGreaterThan(first.rig.angleX / 26);
    expect(first.rig.angleX / 26).toBeGreaterThan(first.rig.bodyX / 8);
    const settled = simulate(120, 2, { mode: 'mouse', pointer: { x: 1, y: -0.5 } });
    expect(settled.rig.angleX).toBeGreaterThan(24);
    expect(settled.rig.bodyX).toBeGreaterThan(5);
    expect(Math.abs(settled.rig.hairSwayX!)).toBeGreaterThan(1);
  });

  it('schedules short asymmetric blinks and occasional doubles while holding irregular gaze targets', () => {
    const { frames, state } = simulate(120, 60);
    const blinkStarts: number[] = [];
    let blinking = false;
    let asymmetric = false;
    let previousStart = 0;
    const durations: number[] = [];
    frames.forEach((rig, index) => {
      const active = rig.eyeLOpen < 0.95 || rig.eyeROpen < 0.95;
      if (active && !blinking) {
        blinkStarts.push(index / 120);
        previousStart = index / 120;
      }
      if (!active && blinking) durations.push(index / 120 - previousStart);
      if (Math.abs(rig.eyeLOpen - rig.eyeROpen) > 0.1) asymmetric = true;
      blinking = active;
    });
    expect(asymmetric).toBe(true);
    expect(durations.length).toBeGreaterThan(8);
    expect(durations.every((duration) => duration >= 0.12 && duration <= 0.3)).toBe(true);
    expect(blinkStarts.some((time, index) => index > 0 && time - blinkStarts[index - 1] < 0.6)).toBe(true);
    expect(state.gazeCount).toBeGreaterThan(12);
    expect(state.gazeCount).toBeLessThan(30);
    expect(frames.some((rig) => rig.eyeLOpen === 0 && rig.eyeROpen === 0)).toBe(true);
  });

  it('freezes the timeline and pose on pause, then resumes without consuming paused time', () => {
    const running = simulate(120, 1);
    const paused = advanceAvatarMotion(running.state, running.rig, { mode: 'manual', paused: true }, 60_000);
    expect(paused.state).toBe(running.state);
    expect(paused.rig).toBe(running.rig);
    const resumed = advanceAvatarMotion(paused.state, paused.rig, { mode: 'auto' }, 1000 / 60);
    const uninterrupted = advanceAvatarMotion(running.state, running.rig, { mode: 'auto' }, 1000 / 60);
    expect(resumed).toEqual(uninterrupted);
  });

  it('bounds tab-resume stalls and ignores zero or invalid elapsed time', () => {
    const running = simulate(120, 1);
    const input = { mode: 'mouse', pointer: { x: -1, y: 1 } } as const;
    const resumed = advanceAvatarMotion(running.state, running.rig, input, 120_000);
    expect(resumed).toEqual(advanceAvatarMotion(running.state, running.rig, input, MAX_MOTION_ELAPSED_MS));
    expect(Math.abs(resumed.rig.angleX - running.rig.angleX)).toBeLessThan(8);
    for (const elapsed of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const unchanged = advanceAvatarMotion(running.state, running.rig, input, elapsed);
      expect(unchanged.state).toBe(running.state);
      expect(unchanged.rig).toBe(running.rig);
    }
  });

  it('smooths speech attack and release, suppresses room noise and keeps quiet idle mouths closed', () => {
    const state = createAvatarMotionState(INITIAL_RIG);
    const speech = advanceAvatarMotion(state, INITIAL_RIG, { mode: 'auto', voice: 1 }, 1000 / 60);
    expect(speech.rig.mouthOpen).toBeGreaterThan(0.1);
    expect(speech.rig.mouthOpen).toBeLessThan(0.5);
    const release = advanceAvatarMotion(speech.state, speech.rig, { mode: 'auto', voice: 0 }, 1000 / 60);
    expect(release.rig.mouthOpen).toBeGreaterThan(0);
    expect(release.rig.mouthOpen).toBeLessThan(speech.rig.mouthOpen);
    expect(simulate(60, 2, { mode: 'auto', voice: 0.04 }).rig.mouthOpen).toBe(0);
    expect(simulate(60, 10).frames.every((rig) => rig.mouthOpen === 0)).toBe(true);
  });

  it('leaves camera facial pose under camera control and preserves the 60 Hz calibration response', () => {
    const rig = { ...INITIAL_RIG, angleX: 18, angleY: -4, eyeLOpen: 0.2, mouthOpen: 0.7 };
    const output = advanceAvatarMotion(createAvatarMotionState(rig), rig, { mode: 'camera' }, 75);
    expect(output.rig.angleX).toBe(rig.angleX);
    expect(output.rig.angleY).toBe(rig.angleY);
    expect(output.rig.eyeLOpen).toBe(rig.eyeLOpen);
    expect(output.rig.mouthOpen).toBe(rig.mouthOpen);
    expect(responseForElapsed(0.2, 1000 / 60)).toBeCloseTo(0.2);
    const twiceAt120 = 1 - (1 - responseForElapsed(0.2, 1000 / 120)) ** 2;
    expect(twiceAt120).toBeCloseTo(responseForElapsed(0.2, 1000 / 60));
  });
});

describe('expression transitions', () => {
  it('fades into an expression over 140 ms and releases it over 240 ms at different refresh rates', () => {
    for (const fps of [30, 60, 120]) {
      let frame = { activeEmotion: 'none' as const, emotionStrength: 0 } as ReturnType<typeof advanceEmotionTransition>;
      for (let i = 0; i < fps / 10; i++) frame = advanceEmotionTransition(frame, 'happy', 1000 / fps);
      expect(frame.activeEmotion).toBe('happy');
      expect(frame.emotionStrength).toBeCloseTo(0.1 / 0.14);
      for (let i = 0; i < fps / 10; i++) frame = advanceEmotionTransition(frame, 'happy', 1000 / fps);
      expect(frame.emotionStrength).toBe(1);
      for (let i = 0; i < fps / 10; i++) frame = advanceEmotionTransition(frame, 'none', 1000 / fps);
      expect(frame.activeEmotion).toBe('happy');
      expect(frame.emotionStrength).toBeCloseTo(1 - 0.1 / 0.24);
      for (let i = 0; i < fps / 5; i++) frame = advanceEmotionTransition(frame, 'none', 1000 / fps);
      expect(frame).toEqual({ activeEmotion: 'none', emotionStrength: 0 });
    }
  });

  it('releases the old expression before introducing the new one and consumes remaining frame time', () => {
    const first = advanceEmotionTransition({ activeEmotion: 'angry', emotionStrength: 0.25 }, 'love', 40);
    expect(first.activeEmotion).toBe('angry');
    expect(first.emotionStrength).toBeCloseTo(0.25 - 0.04 / 0.24);
    const second = advanceEmotionTransition(first, 'love', 40);
    expect(second.activeEmotion).toBe('love');
    expect(second.emotionStrength).toBeCloseTo(0.02 / 0.14);
  });
});
