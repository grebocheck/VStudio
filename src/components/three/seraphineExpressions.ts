import * as THREE from 'three';
import { VRMExpression, VRMExpressionMorphTargetBind, type VRM } from '@pixiv/three-vrm';
import type { Emotion, RigParams } from '../../types';
import { poseToVrmExpressions, type Avatar3DPose, type VrmExpressionWeights } from './avatar3DPose';

const channels = {
  browAngry: 'Fcl_BRW_Angry',
  browWarm: 'Fcl_BRW_Fun',
  browHappy: 'Fcl_BRW_Joy',
  browSad: 'Fcl_BRW_Sorrow',
  browRaised: 'Fcl_BRW_Surprised',
  smile: 'Fcl_MTH_Fun',
  frown: 'Fcl_MTH_Angry',
  joyLeft: 'Fcl_EYE_Joy_L',
  joyRight: 'Fcl_EYE_Joy_R',
} as const;
type Channel = keyof typeof channels;
type FacialInput = Pick<RigParams, 'mouthOpen' | 'eyebrowY'>;
export type SeraphineExpressionWeights = VrmExpressionWeights & Record<Channel, number>;
const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, Number.isFinite(value) ? value : 0));
const vowels = ['aa', 'ih', 'ou', 'ee', 'oh'] as const;

// These use the authored facial regions instead of full-face presets, whose joy,
// sorrow and relaxation shapes also force the mouth open and override speech.
const moods: Record<Emotion, Partial<Record<Channel | 'open', number>>> = {
  none: {},
  happy: { browHappy: 0.42, smile: 0.62 },
  love: { browHappy: 0.32, browSad: 0.08, smile: 0.5 },
  angry: { browAngry: 0.72, frown: 0.4 },
  cry: { browSad: 0.78, frown: 0.42, open: 0.12 },
  shocked: { browRaised: 0.78, open: 0.56 },
  smug: { browWarm: 0.4, smile: 0.48 },
  starry: { browRaised: 0.52, browHappy: 0.16, smile: 0.5, open: 0.12 },
  squint: { browHappy: 0.3, smile: 0.55 },
  depressed: { browSad: 0.62, frown: 0.42 },
  dizzy: { browRaised: 0.3, browSad: 0.26, open: 0.18 },
  cool: { browWarm: 0.3, smile: 0.3 },
  scared: { browSad: 0.46, browRaised: 0.4, frown: 0.24, open: 0.34 },
  sleepy: { browWarm: 0.16, browSad: 0.1, smile: 0.1 },
  shy: { browSad: 0.22, browHappy: 0.12, smile: 0.34 },
  relaxed: { browWarm: 0.3, smile: 0.34 },
};

/** Region budgets keep full eyelid closure and speech independent of the selected mood. */
export function poseToSeraphineExpressions(pose: Avatar3DPose, input: FacialInput): SeraphineExpressionWeights {
  const source = poseToVrmExpressions(pose);
  const result = Object.fromEntries(
    [...Object.keys(source), ...Object.keys(channels)].map((name) => [name, 0]),
  ) as SeraphineExpressionWeights;
  const strength = clamp(pose.expressionStrength);
  const mood = moods[pose.emotion] ?? moods.none;
  for (const name of Object.keys(channels) as Channel[]) result[name] = (mood[name] ?? 0) * strength;

  // A happy closed lid curves upward; sleep and focused moods use the ordinary
  // closure. Tracked blinks replace either shape at their authored sealed endpoint.
  const happyLids = ['happy', 'love', 'starry', 'squint', 'shy'].includes(pose.emotion);
  for (const side of ['Left', 'Right'] as const) {
    const tracked = clamp(pose[`proceduralBlink${side}`]);
    const closure = clamp(1 - pose[`eye${side}Open`]);
    const expressiveClosure = Math.max(0, closure - tracked);
    result[`blink${side}`] = happyLids ? tracked : closure;
    result[`joy${side}`] = happyLids ? expressiveClosure : 0;
  }

  const open = Math.max(clamp(input.mouthOpen), (mood.open ?? 0) * strength);
  const sourceOpen = vowels.reduce((sum, name) => sum + source[name], 0);
  for (const name of vowels) result[name] = sourceOpen > 0 ? (source[name] / sourceOpen) * open : 0;
  if (sourceOpen === 0) result.aa = open;
  // Smiles and frowns spend only the remaining mouth budget, avoiding intersecting
  // lip corners when lip sync reaches a fully open vowel.
  result.smile *= 1 - open;
  result.frown *= 1 - open;
  const trackedBrow = clamp(input.eyebrowY, -5, 5) / 5;
  result.browRaised += Math.max(0, trackedBrow) * 0.5;
  result.browAngry += Math.max(0, -trackedBrow) * 0.35;
  const browNames = ['browAngry', 'browWarm', 'browHappy', 'browSad', 'browRaised'] as const;
  const browTotal = browNames.reduce((sum, name) => sum + result[name], 0);
  if (browTotal > 1) for (const name of browNames) result[name] /= browTotal;
  return result;
}

/** Register bindings only on this loaded Seraphine instance; source morphs stay exportable. */
export function createSeraphineExpressions(vrm: VRM) {
  const manager = vrm.expressionManager;
  for (const [name, suffix] of Object.entries(channels)) {
    const expressionName = `seraphine_${name}`;
    if (!manager || manager.getExpression(expressionName)) continue;
    const expression = new VRMExpression(expressionName);
    vrm.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const entry = Object.entries(object.morphTargetDictionary ?? {}).find(([target]) => target.endsWith(suffix));
      if (entry)
        expression.addBind(new VRMExpressionMorphTargetBind({ primitives: [object], index: entry[1], weight: 1 }));
    });
    manager.registerExpression(expression);
  }
  return {
    apply(pose: Avatar3DPose, input: FacialInput) {
      const weights = poseToSeraphineExpressions(pose, input);
      for (const [name, value] of Object.entries(weights))
        manager?.setValue(name in channels ? `seraphine_${name}` : name, value);
    },
  };
}
