import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import { registerAureliaSurface } from './aureliaSkinning';
import { addAureliaWardrobe } from './aureliaWardrobe';

// The seam field is registered explicitly below; loading the source anatomy is outside this regression.
vi.mock('./aureliaBody', () => ({ addAureliaBody: vi.fn() }));

afterEach(() => vi.restoreAllMocks());

function fittedHumanoid() {
  const names = [
    'hips',
    'spine',
    'chest',
    'upperChest',
    'neck',
    'leftUpperLeg',
    'leftLowerLeg',
    'rightUpperLeg',
    'rightLowerLeg',
  ];
  const heights = [0.948, 1.065, 1.145, 1.245, 1.313, 0.88, 0.51, 0.88, 0.51];
  const scene = new THREE.Group();
  const bones = names.map((name, i) => {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.set(name.startsWith('left') ? 0.077 : name.startsWith('right') ? -0.077 : 0, heights[i], 0);
    scene.add(bone);
    return bone;
  });
  scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const source = new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
  source.bind(skeleton, new THREE.Matrix4());
  scene.add(source);
  const vrm = {
    scene,
    humanoid: { getRawBoneNode: (name: string) => bones[names.indexOf(name)] },
  } as unknown as VRM;
  registerAureliaSurface(vrm, () => ({
    offset: new THREE.Vector3(0, 0, 0.02),
    influences: new Map([[3, 1]]),
  }));
  return { vrm, scene };
}

describe('Aurelia fitted wardrobe goldwork', () => {
  it('retains fitted torso trim and separate hip/cloth batches without geometry merge errors', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { vrm, scene } = fittedHumanoid();
    const wardrobe = addAureliaWardrobe(vrm);
    const names = ['Aurelia_Bodice_Goldwork', 'Aurelia_Sash_Goldwork', 'Aurelia_Cloth_Goldwork'];
    const meshes = names.map((name) => {
      const mesh = scene.getObjectByName(name);
      expect(mesh, `${name} must remain visible after fitting`).toBeInstanceOf(THREE.SkinnedMesh);
      const skinned = mesh as THREE.SkinnedMesh;
      expect(skinned.visible).toBe(true);
      expect(skinned.geometry.getAttribute('position').count).toBeGreaterThan(0);
      return skinned;
    });
    expect(errors.mock.calls).toEqual([]);
    meshes.forEach((mesh, batch) => {
      const indices = mesh.geometry.getAttribute('skinIndex'),
        weights = mesh.geometry.getAttribute('skinWeight');
      for (let vertex = 0; vertex < indices.count; vertex++) {
        expect(indices.getX(vertex)).toBe(batch === 0 ? 3 : 0);
        expect(weights.getX(vertex)).toBe(1);
      }
    });
    const torsoBefore = Float32Array.from(meshes[0].geometry.getAttribute('position').array);
    const sashBefore = Float32Array.from(meshes[1].geometry.getAttribute('position').array);
    wardrobe.update(0, 0);
    // Animation must start from fitted positions, rather than silently restoring pre-fit tubes.
    expect(meshes[0].geometry.getAttribute('position').array).toEqual(torsoBefore);
    expect(meshes[1].geometry.getAttribute('position').array).toEqual(sashBefore);
    expect(errors.mock.calls).toEqual([]);
  });
});
