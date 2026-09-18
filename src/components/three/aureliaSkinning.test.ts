import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import {
  bindAureliaGeometry,
  createAureliaSkinSampler,
  fitAureliaGeometry,
  registerAureliaSurface,
} from './aureliaSkinning';

function humanoid() {
  const names = ['hips', 'spine', 'chest', 'upperChest', 'neck'] as const;
  const heights = [0.975, 1.065, 1.145, 1.245, 1.313];
  const scene = new THREE.Group();
  const bones = names.map((name, i) => {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.y = heights[i] - (i ? heights[i - 1] : 0);
    return bone;
  });
  bones.forEach((bone, i) => (i ? bones[i - 1] : scene).add(bone));
  scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const source = new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
  source.bind(skeleton, new THREE.Matrix4());
  scene.add(source);
  const vrm = {
    scene,
    humanoid: { getRawBoneNode: (name: string) => bones[names.indexOf(name as (typeof names)[number])] },
  } as unknown as VRM;
  return { vrm, bones, scene };
}

describe('Aurelia shared skinning', () => {
  it('keeps the shoulders still when the neck turns while allowing the medial neck to follow', () => {
    const { vrm, bones, scene } = humanoid();
    const shoulder = new THREE.Vector3(0.11, 1.29, 0);
    const neck = new THREE.Vector3(0.01, 1.34, 0);
    const sample = createAureliaSkinSampler(vrm, false);
    expect(sample(shoulder).get(4)).toBe(0);
    expect(sample(neck).get(4)).toBe(1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([...shoulder.toArray(), ...neck.toArray()], 3));
    const mesh = bindAureliaGeometry(vrm, geometry, new THREE.MeshBasicMaterial(), 'test skin');
    bones[4].rotation.z = 0.25;
    scene.updateMatrixWorld(true);
    expect(mesh.getVertexPosition(0, new THREE.Vector3()).distanceTo(shoulder)).toBeLessThan(1e-7);
    expect(mesh.getVertexPosition(1, new THREE.Vector3()).distanceTo(neck)).toBeGreaterThan(0.005);
  });

  it('uses one surface correspondence for both garment position and skin weights', () => {
    const { vrm } = humanoid();
    registerAureliaSurface(vrm, (point) => ({
      offset: new THREE.Vector3(0.03, 0, 0),
      influences: new Map([[point.x < 0.12 ? 3 : 4, 1]]),
    }));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0.1, 1.29, 0.003], 3));
    fitAureliaGeometry(vrm, geometry);
    bindAureliaGeometry(vrm, geometry, new THREE.MeshBasicMaterial(), 'fitted strap');
    expect(geometry.getAttribute('position').getX(0)).toBeCloseTo(0.13, 6);
    expect(geometry.getAttribute('skinIndex').getX(0)).toBe(3);
    expect(geometry.getAttribute('skinWeight').getX(0)).toBe(1);
  });
});
