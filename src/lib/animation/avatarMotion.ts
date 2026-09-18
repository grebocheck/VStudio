import type { Emotion, RigParams, TrackingMode } from '../../types';

/** Animation runs on a small fixed timestep, independent of display refresh rate. */
export const MOTION_STEP_SECONDS = 1 / 120;
export const MAX_MOTION_ELAPSED_MS = 80;
const TAU = Math.PI * 2;

type SpringChannel = 'angleX' | 'angleY' | 'angleZ' | 'bodyX' | 'hairSwayX' | 'hairSwayY';

export interface AvatarMotionState {
  time: number;
  remainder: number;
  random: number;
  nextGazeAt: number;
  gazeX: number;
  gazeY: number;
  gazeCount: number;
  nextBlinkAt: number;
  blinkStartedAt: number;
  blinkDuration: number;
  blinkLag: number;
  doubleBlinkAt: number;
  blinkCount: number;
  velocities: Record<SpringChannel, number>;
  previousAngleX: number;
  previousAngleY: number;
}

export interface AvatarMotionInput {
  mode: TrackingMode;
  /** Normalized screen position, recorded by pointer events and consumed by RAF. */
  pointer?: { x: number; y: number };
  /** Normalized microphone envelope. Undefined leaves camera/manual mouth alone. */
  voice?: number;
  paused?: boolean;
}

const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, Number.isFinite(value) ? value : 0));

/** Convert a response tuned at 60 Hz into a frame-rate-independent response. */
export function responseForElapsed(response: number, elapsedMs: number): number {
  const elapsed = clamp(elapsedMs, 0, MAX_MOTION_ELAPSED_MS);
  return 1 - (1 - clamp(response, 0, 1)) ** (elapsed / (1000 / 60));
}

/** Expression identity stays stable during release, then the next expression enters. */
export function advanceEmotionTransition(
  previous: { activeEmotion?: Emotion; emotionStrength?: number },
  target: Emotion,
  elapsedMs: number,
): { activeEmotion: Emotion; emotionStrength: number } {
  let emotion = previous.activeEmotion ?? 'none';
  let strength = emotion === 'none' ? 0 : clamp(previous.emotionStrength ?? 1, 0, 1);
  let remaining = clamp(elapsedMs, 0, MAX_MOTION_ELAPSED_MS) / 1000;
  if (emotion !== 'none' && emotion !== target) {
    const releaseRemaining = strength * 0.24;
    if (remaining < releaseRemaining) return { activeEmotion: emotion, emotionStrength: strength - remaining / 0.24 };
    remaining -= releaseRemaining;
    emotion = 'none';
    strength = 0;
  }
  if (target !== 'none') {
    emotion = target;
    strength = Math.min(1, strength + remaining / 0.14);
  }
  return { activeEmotion: emotion, emotionStrength: strength };
}

export function createAvatarMotionState(rig: RigParams, seed = 0x6d2b79f5): AvatarMotionState {
  return {
    time: 0,
    remainder: 0,
    random: seed >>> 0,
    nextGazeAt: 0.85,
    gazeX: 0.18,
    gazeY: -0.06,
    gazeCount: 0,
    nextBlinkAt: 2.4,
    blinkStartedAt: -100,
    blinkDuration: 0.22,
    blinkLag: 0.012,
    doubleBlinkAt: Number.POSITIVE_INFINITY,
    blinkCount: 0,
    velocities: { angleX: 0, angleY: 0, angleZ: 0, bodyX: 0, hairSwayX: 0, hairSwayY: 0 },
    previousAngleX: rig.angleX,
    previousAngleY: rig.angleY,
  };
}

function random(state: AvatarMotionState): number {
  state.random = (Math.imul(1664525, state.random) + 1013904223) >>> 0;
  return state.random / 4294967296;
}

/** Exact damped spring solution for a constant target over the simulation step. */
function spring(position: number, velocity: number, target: number, frequency: number, damping: number) {
  const dt = MOTION_STEP_SECONDS;
  const omega = TAU * frequency;
  const decay = omega * damping;
  const oscillation = omega * Math.sqrt(1 - damping * damping);
  const offset = position - target;
  const b = (velocity + decay * offset) / oscillation;
  const sine = Math.sin(oscillation * dt);
  const cosine = Math.cos(oscillation * dt);
  const envelope = Math.exp(-decay * dt);
  return {
    position: target + envelope * (offset * cosine + b * sine),
    velocity: envelope * ((b * oscillation - decay * offset) * cosine - (offset * oscillation + decay * b) * sine),
  };
}

function moveSpring(
  state: AvatarMotionState,
  rig: RigParams,
  channel: SpringChannel,
  target: number,
  frequency: number,
  damping: number,
) {
  const next = spring(rig[channel] ?? 0, state.velocities[channel], target, frequency, damping);
  rig[channel] = next.position;
  state.velocities[channel] = next.velocity;
}

const smooth = (current: number, target: number, rate: number) =>
  current + (target - current) * (1 - Math.exp(-rate * MOTION_STEP_SECONDS));

/** Fast closure, a short lid contact, and a slower release; no per-frame jumps. */
function blinkOpenness(age: number, duration: number): number {
  const phase = age / duration;
  if (phase < 0 || phase >= 1) return 1;
  const ease = (value: number) => value * value * (3 - 2 * value);
  if (phase < 0.28) return 1 - ease(phase / 0.28);
  if (phase < 0.4) return 0;
  return ease((phase - 0.4) / 0.6);
}

function scheduleIntent(state: AvatarMotionState) {
  if (state.time >= state.nextGazeAt) {
    state.gazeCount += 1;
    // Regular returns to the viewer punctuate longer, irregular off-axis holds.
    const facingViewer = state.gazeCount % 3 === 0;
    state.gazeX = facingViewer ? (random(state) - 0.5) * 0.14 : (random(state) - 0.5) * 1.5;
    state.gazeY = facingViewer ? (random(state) - 0.5) * 0.1 : (random(state) - 0.5) * 0.85;
    state.nextGazeAt = state.time + 1.6 + random(state) * 3.1;
  }
  if (state.time >= state.doubleBlinkAt || state.time >= state.nextBlinkAt) {
    const isDouble = state.time >= state.doubleBlinkAt;
    state.blinkStartedAt = state.time;
    state.blinkDuration = isDouble ? 0.17 + random(state) * 0.035 : 0.2 + random(state) * 0.065;
    state.blinkLag = (random(state) > 0.5 ? 1 : -1) * (0.007 + random(state) * 0.012);
    state.blinkCount += 1;
    state.doubleBlinkAt = !isDouble && random(state) < 0.22 ? state.time + state.blinkDuration + 0.105 : Infinity;
    state.nextBlinkAt = state.time + 2.5 + random(state) * 4.1;
  }
}

function simulateStep(state: AvatarMotionState, rig: RigParams, input: AvatarMotionInput) {
  state.time += MOTION_STEP_SECONDS;
  scheduleIntent(state);
  const time = state.time;
  // 4.6-second breathing, subtly varied without resetting phase when a mode changes.
  rig.breath = (rig.breath + MOTION_STEP_SECONDS * (0.215 + Math.sin(time * 0.21) * 0.012)) % 1;

  if (input.mode !== 'camera') {
    const age = time - state.blinkStartedAt;
    rig.eyeLOpen = blinkOpenness(age - Math.max(0, state.blinkLag), state.blinkDuration);
    rig.eyeROpen = blinkOpenness(age - Math.max(0, -state.blinkLag), state.blinkDuration);
  }

  if (input.mode === 'auto' || input.mode === 'mouse') {
    const pointer = input.pointer ?? { x: 0, y: 0 };
    const lookingAtPointer = input.mode === 'mouse';
    const gazeX = lookingAtPointer ? clamp(pointer.x, -1, 1) : state.gazeX;
    const gazeY = lookingAtPointer ? clamp(pointer.y, -1, 1) : state.gazeY;
    const driftX = Math.sin(time * 0.73) * 1.6 + Math.sin(time * 0.29 + 0.7) * 0.7;
    const driftY = Math.sin(time * 0.59 + 0.4) * 1.1;
    const yawTarget = gazeX * (lookingAtPointer ? 26 : 13) + driftX;
    const pitchTarget = -gazeY * (lookingAtPointer ? 16 : 9) + driftY;
    // Eyes arrive first. Head and torso catch up with successively slower springs.
    rig.pupilX = smooth(rig.pupilX, clamp(gazeX * 0.95 - rig.angleX * 0.014, -1, 1), 24);
    rig.pupilY = smooth(rig.pupilY, clamp(gazeY * 0.8 + rig.angleY * 0.012, -1, 1), 21);
    moveSpring(state, rig, 'angleX', yawTarget, 1.3, 0.9);
    moveSpring(state, rig, 'angleY', pitchTarget, 1.15, 0.92);
    moveSpring(state, rig, 'angleZ', -gazeX * 3.8 + Math.sin(time * 0.47) * 1.2, 0.9, 0.86);
    moveSpring(state, rig, 'bodyX', rig.angleX * 0.3 + Math.sin(time * 0.37) * 1.4, 0.62, 0.88);
    rig.eyebrowY = smooth(rig.eyebrowY, Math.sin(time * 0.38) * 0.28, 3);
    rig.tongueOut = smooth(rig.tongueOut ?? 0, 0, 8);
    if (input.voice === undefined) {
      // Quiet breathing does not look like constant, unexplained talking.
      rig.mouthOpen = smooth(rig.mouthOpen, 0, 10);
      rig.mouthForm = smooth(rig.mouthForm, 0.36 + Math.sin(time * 0.31) * 0.1, 2.2);
    }
  }

  if (input.voice !== undefined) {
    const voice = clamp(input.voice, 0, 1);
    // Remove room noise; quick consonant attack and slower releases avoid chatter.
    const target = voice < 0.055 ? 0 : (voice - 0.055) / 0.945;
    rig.mouthOpen = smooth(rig.mouthOpen, target, target > rig.mouthOpen ? 22 : 11);
    rig.mouthForm = smooth(rig.mouthForm, 0.32 + target * 0.42, 9);
  }

  const deltaX = rig.angleX - state.previousAngleX;
  const deltaY = rig.angleY - state.previousAngleY;
  state.velocities.hairSwayX -= deltaX * 11;
  state.velocities.hairSwayY -= deltaY * 7;
  moveSpring(state, rig, 'hairSwayX', -rig.angleX * 0.48 - rig.angleZ * 0.5, 1.65, 0.64);
  moveSpring(state, rig, 'hairSwayY', rig.angleY * 0.12 + Math.sin(time * 1.35) * 0.22, 1.9, 0.65);
  state.previousAngleX = rig.angleX;
  state.previousAngleY = rig.angleY;
}

/** Pure runtime shared by cursor, idle and voice modes; camera still owns its pose. */
export function advanceAvatarMotion(
  previous: AvatarMotionState,
  rig: RigParams,
  input: AvatarMotionInput,
  elapsedMs: number,
): { state: AvatarMotionState; rig: RigParams } {
  if (input.paused) return { state: previous, rig };
  const elapsed = clamp(elapsedMs, 0, MAX_MOTION_ELAPSED_MS) / 1000;
  if (elapsed === 0) return { state: previous, rig };
  const state = { ...previous, velocities: { ...previous.velocities } };
  const next = { ...rig };
  state.remainder += elapsed;
  while (state.remainder + 1e-10 >= MOTION_STEP_SECONDS) {
    simulateStep(state, next, input);
    state.remainder = Math.max(0, state.remainder - MOTION_STEP_SECONDS);
  }
  return { state, rig: next };
}
