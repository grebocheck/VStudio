import type { AvatarConfig, Emotion, RigParams } from '../../types';

export interface PoseVector3 {
  x: number;
  y: number;
  z: number;
}

export interface Avatar3DPose {
  /** Local Euler XYZ radians. Body is the head's parent; neutral rotations are zero. */
  headRotation: PoseVector3;
  bodyRotation: PoseVector3;
  /** Offset from the authored rest position, in meters for a ~1.72 m character. */
  bodyOffset: PoseVector3;
  chestScaleY: number;
  eyeLeftOpen: number;
  eyeRightOpen: number;
  /** Raw tracked closure for VRM presets, whose authored emotions already shape eyes. */
  proceduralBlinkLeft: number;
  proceduralBlinkRight: number;
  /** Local eyeball rotation, independent of head rotation. */
  eyeRotation: PoseVector3;
  mouthOpen: number;
  mouthSmile: number;
  jawRotation: number;
  /** Lift is a local +Y displacement in meters; rotation is around local +Z. */
  browLeft: { lift: number; rotation: number };
  browRight: { lift: number; rotation: number };
  hairLeftRotation: PoseVector3;
  hairRightRotation: PoseVector3;
  /** Additive rotations relative to authored relaxed shoulder/arm poses. */
  armLeftRotation: PoseVector3;
  armRightRotation: PoseVector3;
  emotion: Emotion;
  expressionStrength: number;
  blush: number;
  tongueOut: number;
}

type PoseConfig = Pick<AvatarConfig, 'motionIntensity' | 'activeEmotion'>;
const DEG = Math.PI / 180;
const clamp = (value: number, low: number, high: number, fallback = 0) =>
  Math.min(high, Math.max(low, Number.isFinite(value) ? value : fallback));
const mix = (from: number, to: number, weight: number) => from + (to - from) * weight;
const vector = (x = 0, y = 0, z = 0): PoseVector3 => ({ x: x || 0, y: y || 0, z: z || 0 });
const validEmotions = new Set<Emotion>([
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
]);

/**
 * Maps the shared tracking rig to a real, meter-scale 3D skeleton and facial rig.
 * +Y is up and the face looks along +Z toward a front camera. Positive tracking
 * yaw looks screen-right, positive pitch looks up, and positive roll is clockwise
 * in that camera view. Left/right retain the shared rig's facial channel labels.
 * This is stateless: timing and spring lag come from the shared animation runtime.
 */
export function calculateAvatar3DPose(config: PoseConfig, rig: RigParams): Avatar3DPose {
  const intensity = clamp(config.motionIntensity ?? 1, 0.35, 1.5, 1);
  const active = rig.activeEmotion && validEmotions.has(rig.activeEmotion) && rig.activeEmotion !== 'none';
  const emotion = active
    ? rig.activeEmotion!
    : config.activeEmotion && validEmotions.has(config.activeEmotion)
      ? config.activeEmotion
      : 'none';
  const expressionStrength = emotion === 'none' ? 0 : active ? clamp(rig.emotionStrength ?? 1, 0, 1) : 1;

  const yaw = clamp(clamp(rig.angleX, -30, 30) * intensity, -30, 30) * DEG;
  const pitch = -clamp(clamp(rig.angleY, -30, 30) * intensity, -20, 20) * DEG;
  const roll = -clamp(clamp(rig.angleZ, -15, 15) * 0.65 * intensity, -8, 8) * DEG;
  const body = clamp(clamp(rig.bodyX, -15, 15) * intensity, -15, 15);
  const breathing = Math.sin(clamp(rig.breath, 0, 1) * Math.PI * 2) * intensity;
  const bodyRotation = vector(pitch * 0.055, body * 0.28 * DEG, roll * 0.1);

  const baseLeftEye = clamp(rig.eyeLOpen, 0, 1, 1);
  const baseRightEye = clamp(rig.eyeROpen, 0, 1, 1);
  const baseMouth = clamp(rig.mouthOpen, 0, 1);
  const baseSmile = clamp(rig.mouthForm, -1, 1);
  // Camera browInnerUp produces positive eyebrowY; raising a brow is local +Y.
  const baseBrow = clamp(rig.eyebrowY, -5, 5) * 0.0022;
  let eyeLeft = baseLeftEye;
  let eyeRight = baseRightEye;
  let mouth = baseMouth;
  let smile = baseSmile;
  let leftLift = baseBrow;
  let rightLift = baseBrow;
  let leftBrowRotation = 0;
  let rightBrowRotation = 0;
  let blush = 0;

  switch (emotion) {
    case 'happy':
      eyeLeft *= 0.88;
      eyeRight *= 0.88;
      smile = 0.92;
      mouth = Math.max(mouth, 0.22);
      leftLift += 0.004;
      rightLift += 0.004;
      blush = 0.1;
      break;
    case 'love':
      eyeLeft *= 0.8;
      eyeRight *= 0.8;
      smile = 0.9;
      mouth = Math.max(mouth, 0.16);
      leftLift += 0.003;
      rightLift += 0.003;
      blush = 0.48;
      break;
    case 'starry':
      smile = 0.72;
      mouth = Math.max(mouth, 0.25);
      leftLift += 0.011;
      rightLift += 0.011;
      break;
    case 'squint':
      eyeLeft *= 0.08;
      eyeRight *= 0.08;
      smile = 0.72;
      leftLift -= 0.003;
      rightLift -= 0.003;
      break;
    case 'angry':
      eyeLeft *= 0.73;
      eyeRight *= 0.73;
      smile = -0.68;
      leftLift -= 0.007;
      rightLift -= 0.007;
      leftBrowRotation = -0.18;
      rightBrowRotation = 0.18;
      blush = 0.18;
      break;
    case 'cry':
      eyeLeft *= 0.62;
      eyeRight *= 0.62;
      smile = -0.62;
      mouth = Math.max(mouth, 0.2);
      leftLift += 0.007;
      rightLift += 0.007;
      leftBrowRotation = 0.16;
      rightBrowRotation = -0.16;
      blush = 0.12;
      break;
    case 'depressed':
      eyeLeft *= 0.58;
      eyeRight *= 0.58;
      smile = -0.45;
      leftLift -= 0.002;
      rightLift -= 0.002;
      leftBrowRotation = 0.1;
      rightBrowRotation = -0.1;
      break;
    case 'shocked':
      mouth = Math.max(mouth, 0.82);
      smile = -0.1;
      leftLift += 0.014;
      rightLift += 0.014;
      break;
    case 'scared':
      mouth = Math.max(mouth, 0.52);
      smile = -0.78;
      leftLift += 0.01;
      rightLift += 0.01;
      leftBrowRotation = 0.13;
      rightBrowRotation = -0.13;
      break;
    case 'smug':
      eyeLeft *= 0.55;
      eyeRight *= 0.88;
      smile = 0.68;
      leftLift += 0.009;
      rightLift -= 0.002;
      leftBrowRotation = -0.08;
      break;
    case 'cool':
      eyeLeft *= 0.76;
      eyeRight *= 0.76;
      smile = 0.32;
      rightLift += 0.006;
      rightBrowRotation = 0.07;
      break;
    case 'sleepy':
      eyeLeft *= 0.25;
      eyeRight *= 0.29;
      smile = -0.12;
      leftLift -= 0.004;
      rightLift -= 0.004;
      break;
    case 'relaxed':
      eyeLeft *= 0.68;
      eyeRight *= 0.68;
      smile = 0.24;
      mouth *= 0.4;
      break;
    case 'shy':
      eyeLeft *= 0.82;
      eyeRight *= 0.82;
      smile = 0.42;
      mouth *= 0.4;
      blush = 0.65;
      leftBrowRotation = 0.05;
      rightBrowRotation = -0.05;
      break;
    case 'dizzy':
      eyeLeft *= 0.58;
      eyeRight *= 0.82;
      mouth = Math.max(mouth, 0.32);
      smile = -0.25;
      leftLift += 0.006;
      rightLift -= 0.004;
      break;
  }

  const mouthOpen = mix(baseMouth, mouth, expressionStrength);
  const hairX = clamp(rig.hairSwayX ?? 0, -18, 18) * intensity;
  const hairY = clamp(rig.hairSwayY ?? 0, -12, 12) * intensity;
  const hairPitch = clamp(hairY * 0.38, -6, 6) * DEG;
  const hairRoll = clamp(-hairX * 0.42, -8, 8) * DEG;
  return {
    // Subtract the small parent-body rotation so head angles stay near tracking intent.
    headRotation: vector(pitch - bodyRotation.x, yaw - bodyRotation.y, roll - bodyRotation.z),
    bodyRotation,
    bodyOffset: vector(body * 0.0022, breathing * 0.003, 0),
    chestScaleY: 1 + breathing * 0.007,
    eyeLeftOpen: mix(baseLeftEye, eyeLeft, expressionStrength),
    eyeRightOpen: mix(baseRightEye, eyeRight, expressionStrength),
    proceduralBlinkLeft: 1 - baseLeftEye,
    proceduralBlinkRight: 1 - baseRightEye,
    eyeRotation: vector(clamp(rig.pupilY, -1, 1) * 12 * DEG, clamp(rig.pupilX, -1, 1) * 18 * DEG, 0),
    mouthOpen,
    mouthSmile: mix(baseSmile, smile, expressionStrength),
    jawRotation: mouthOpen * 14 * DEG,
    browLeft: {
      lift: clamp(mix(baseBrow, leftLift, expressionStrength), -0.018, 0.022),
      rotation: leftBrowRotation * expressionStrength,
    },
    browRight: {
      lift: clamp(mix(baseBrow, rightLift, expressionStrength), -0.018, 0.022),
      rotation: rightBrowRotation * expressionStrength,
    },
    hairLeftRotation: vector(hairPitch, hairRoll * 0.14, hairRoll),
    hairRightRotation: vector(hairPitch * 0.88, -hairRoll * 0.14, hairRoll * 0.92),
    armLeftRotation: vector(breathing * 0.003, 0, -bodyRotation.z * 0.45 - breathing * 0.004),
    armRightRotation: vector(breathing * 0.003, 0, -bodyRotation.z * 0.45 + breathing * 0.004),
    emotion,
    expressionStrength,
    blush: blush * expressionStrength,
    tongueOut: clamp(rig.tongueOut ?? 0, 0, 1),
  };
}

export type VrmExpressionName =
  | 'neutral'
  | 'blink'
  | 'blinkLeft'
  | 'blinkRight'
  | 'aa'
  | 'ih'
  | 'ou'
  | 'ee'
  | 'oh'
  | 'happy'
  | 'angry'
  | 'sad'
  | 'surprised'
  | 'relaxed';
export type VrmExpressionWeights = Record<VrmExpressionName, number>;

const vrmEmotionMix: Record<Emotion, Partial<VrmExpressionWeights>> = {
  none: {},
  happy: { happy: 0.72 },
  love: { happy: 0.55, relaxed: 0.2 },
  angry: { angry: 0.82 },
  cry: { sad: 0.8 },
  shocked: { surprised: 0.82 },
  smug: { happy: 0.28, relaxed: 0.18 },
  starry: { surprised: 0.28, happy: 0.5 },
  squint: { happy: 0.5, relaxed: 0.32 },
  depressed: { sad: 0.54, relaxed: 0.15 },
  dizzy: { surprised: 0.32, sad: 0.28 },
  cool: { relaxed: 0.3, happy: 0.12 },
  scared: { surprised: 0.5, sad: 0.3 },
  sleepy: { relaxed: 0.68, sad: 0.1 },
  shy: { happy: 0.26, sad: 0.16 },
  relaxed: { relaxed: 0.62, happy: 0.1 },
};

/**
 * VRM 1.0 preset weights. Apply all returned values with expressionManager.setValue
 * before vrm.update(dt); that manager applies authored mouth/blink override rules.
 * Keep gaze in the VRM look-at/bone path. The base model's look expressions have no
 * morph bindings. Never add a shared `blink` on top of the two independent blinks.
 * Spec: https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/expressions.md
 */
export function poseToVrmExpressions(pose: Avatar3DPose): VrmExpressionWeights {
  const strength = clamp(pose.expressionStrength, 0, 1);
  const open = clamp(pose.mouthOpen, 0, 1);
  const smile = clamp(pose.mouthSmile, -1, 1);
  const surprised = pose.emotion === 'shocked' || pose.emotion === 'scared';
  const roundness = surprised ? 0.72 * strength : Math.max(0, -smile) * 0.45;
  const spread = Math.max(0, smile) * 0.4;
  const weights: VrmExpressionWeights = {
    neutral: 0,
    blink: 0,
    blinkLeft: clamp(pose.proceduralBlinkLeft, 0, 1),
    blinkRight: clamp(pose.proceduralBlinkRight, 0, 1),
    // Distribute a single mouth-open budget rather than stacking five full vowels.
    aa: open * (1 - roundness) * (1 - spread),
    ih: open * (1 - roundness) * spread * 0.65,
    ee: open * (1 - roundness) * spread * 0.35,
    ou: open * roundness * 0.6,
    oh: open * roundness * 0.4,
    happy: 0,
    angry: 0,
    sad: 0,
    surprised: 0,
    relaxed: 0,
  };
  for (const [name, weight] of Object.entries(vrmEmotionMix[pose.emotion] ?? {})) {
    weights[name as VrmExpressionName] = clamp(weight * strength, 0, 1);
  }
  return weights;
}
