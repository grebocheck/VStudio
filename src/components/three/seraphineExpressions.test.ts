import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { VRMExpression, VRMExpressionManager, VRMExpressionMorphTargetBind, type VRM } from '@pixiv/three-vrm';
import { describe, expect, it } from 'vitest';
import { INITIAL_RIG } from '../../presets';
import type { Emotion, RigParams } from '../../types';
import { calculateAvatar3DPose } from './avatar3DPose';
import { createSeraphineExpressions, poseToSeraphineExpressions } from './seraphineExpressions';

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
const weights = (input: Partial<RigParams> = {}) => {
  const rig = { ...INITIAL_RIG, ...input };
  return poseToSeraphineExpressions(calculateAvatar3DPose({}, rig), rig);
};
const mouthBudget = (result: ReturnType<typeof weights>) => result.aa + result.ih + result.ee + result.ou + result.oh;

describe('Seraphine expression articulation', () => {
  it('gives calm smiles a closed mouth and retains tracked speech inside every emotion', () => {
    for (const activeEmotion of ['happy', 'smug', 'love', 'cool', 'shy', 'relaxed'] as Emotion[]) {
      const closed = weights({ activeEmotion, mouthOpen: 0 });
      expect(mouthBudget(closed)).toBe(0);
      expect(closed.smile).toBeGreaterThan(0);
    }
    for (const activeEmotion of emotions)
      for (const mouthOpen of [0.65, 1]) {
        const speaking = weights({ activeEmotion, mouthOpen });
        expect(mouthBudget(speaking)).toBeCloseTo(mouthOpen);
        expect(mouthBudget(speaking) + speaking.smile + speaking.frown).toBeLessThanOrEqual(1.000001);
        expect(Object.values(speaking).every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true);
      }
  });

  it('reaches each independent authored blink endpoint in every mood without stacking eyelid shapes', () => {
    for (const activeEmotion of emotions) {
      const left = weights({ activeEmotion, eyeLOpen: 0, eyeROpen: 1 });
      expect(left.blinkLeft).toBe(1);
      expect(left.joyLeft).toBe(0);
      expect(left.blinkRight + left.joyRight).toBeLessThan(1);
      const closed = weights({ activeEmotion, eyeLOpen: 0, eyeROpen: 0, mouthOpen: 0.8 });
      expect(closed.blinkLeft).toBe(1);
      expect(closed.blinkRight).toBe(1);
      expect(closed.joyLeft + closed.joyRight).toBe(0);
      expect(closed.blink).toBe(0);
      expect(mouthBudget(closed)).toBeCloseTo(0.8);
    }
  });

  it('visibly closes sleepy eyes and retains the asymmetry of a smug expression', () => {
    const sleepy = weights({ activeEmotion: 'sleepy' });
    expect(sleepy.blinkLeft).toBeGreaterThan(0.7);
    expect(sleepy.blinkRight).toBeGreaterThan(0.7);
    const smug = weights({ activeEmotion: 'smug' });
    expect(smug.blinkLeft - smug.blinkRight).toBeGreaterThan(0.25);
    const squint = weights({ activeEmotion: 'squint' });
    expect(squint.joyLeft).toBeGreaterThan(0.9);
    expect(squint.joyRight).toBeGreaterThan(0.9);
  });

  it('fades every mood back to the tracked neutral face and follows eyebrow input', () => {
    const rig = { eyeLOpen: 0.45, mouthOpen: 0.35, eyebrowY: 1 };
    const neutral = weights(rig);
    for (const activeEmotion of emotions) {
      const reset = weights({ ...rig, activeEmotion, emotionStrength: 0 });
      for (const key of Object.keys(neutral) as (keyof typeof neutral)[]) expect(reset[key]).toBeCloseTo(neutral[key]);
    }
    const half = weights({ activeEmotion: 'happy', emotionStrength: 0.5 });
    const full = weights({ activeEmotion: 'happy' });
    expect(half.smile).toBeCloseTo(full.smile / 2);
    expect(half.joyLeft).toBeCloseTo(full.joyLeft / 2);
    expect(weights({ eyebrowY: 5 }).browRaised).toBeGreaterThan(0);
    expect(weights({ eyebrowY: -5 }).browAngry).toBeGreaterThan(0);
  });
});

it('binds the shipped facial target names through the VRM manager, resets cleanly and leaves other instances alone', () => {
  const binary = readFileSync(new URL('../../../public/models/aurelia-3d/base.vrm', import.meta.url));
  const source = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString());
  const names = source.meshes.find((mesh: { name: string }) => mesh.name === 'Face').extras.targetNames as string[];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  geometry.morphAttributes.position = names.map((name) => {
    const attribute = new THREE.Float32BufferAttribute([0, 0, 0], 3);
    attribute.name = name;
    return attribute;
  });
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  const scene = new THREE.Group();
  scene.add(mesh);
  const manager = new VRMExpressionManager();
  for (const [name, data] of Object.entries(source.extensions.VRMC_vrm.expressions.preset)) {
    const expression = new VRMExpression(name);
    const preset = data as { overrideBlink?: 'blend'; overrideMouth?: 'blend'; morphTargetBinds?: { index: number }[] };
    expression.overrideBlink = preset.overrideBlink ?? 'none';
    expression.overrideMouth = preset.overrideMouth ?? 'none';
    for (const bind of preset.morphTargetBinds ?? [])
      expression.addBind(new VRMExpressionMorphTargetBind({ primitives: [mesh], index: bind.index, weight: 1 }));
    manager.registerExpression(expression);
  }
  const other = new VRMExpressionManager();
  const vrm = { scene, expressionManager: manager } as unknown as VRM;
  const controller = createSeraphineExpressions(vrm);
  const registered = manager.expressions.length;
  createSeraphineExpressions(vrm);
  expect(manager.expressions).toHaveLength(registered);
  expect(other.expressions).toHaveLength(0);
  const rig = { ...INITIAL_RIG, activeEmotion: 'happy' as const, eyeLOpen: 0, mouthOpen: 0.8 };
  controller.apply(calculateAvatar3DPose({}, rig), rig);
  manager.update();
  const target = (suffix: string) => mesh.morphTargetInfluences![names.findIndex((name) => name.endsWith(suffix))];
  expect(target('Fcl_EYE_Close_L')).toBe(1);
  expect(target('Fcl_EYE_Joy_L')).toBe(0);
  expect(target('Fcl_BRW_Joy')).toBeGreaterThan(0);
  expect(target('Fcl_ALL_Joy')).toBe(0);
  expect(['A', 'I', 'U', 'E', 'O'].reduce((sum, vowel) => sum + target(`Fcl_MTH_${vowel}`), 0)).toBeCloseTo(0.8);
  const settled = [...mesh.morphTargetInfluences!];
  for (let frame = 0; frame < 120; frame++) {
    controller.apply(calculateAvatar3DPose({}, rig), rig);
    manager.update();
  }
  expect(mesh.morphTargetInfluences).toEqual(settled);
  controller.apply(calculateAvatar3DPose({}, INITIAL_RIG), INITIAL_RIG);
  manager.update();
  expect(mesh.morphTargetInfluences!.every((value) => value === 0)).toBe(true);
});
