import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';

export function getAureliaSkeleton(vrm: VRM) {
  let skeleton: THREE.Skeleton | undefined;
  const hips = vrm.humanoid.getRawBoneNode('hips');
  vrm.scene.traverse((object) => {
    if (!skeleton && object instanceof THREE.SkinnedMesh && object.skeleton.bones.some((bone) => bone === hips))
      skeleton = object.skeleton;
  });
  if (!skeleton) throw new Error('Aurelia requires a humanoid skeleton.');
  return skeleton;
}

/** Shared bind-space weights keep skin, straps and cloth seams on the same deforming surface. */
export function bindAureliaGeometry(
  vrm: VRM,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  name: string,
  mode: 'torso' | 'hips' = 'torso',
) {
  const skeleton = getAureliaSkeleton(vrm);
  const anchors = [0.975, 1.065, 1.145, 1.245, 1.337];
  const names = ['hips', 'spine', 'chest', 'upperChest', 'neck'] as const;
  const joints = names.map((name, i) => ({
    index: skeleton.bones.findIndex((bone) => bone === vrm.humanoid.getRawBoneNode(name)),
    y: anchors[i],
  }));
  const position = geometry.getAttribute('position');
  const indices: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < position.count; i++) {
    let lower = joints[0],
      upper = joints[1];
    const y = position.getY(i);
    for (let j = 0; j < joints.length - 1; j++)
      if (y >= joints[j].y) {
        lower = joints[j];
        upper = joints[j + 1];
      }
    const t = THREE.MathUtils.smoothstep(y, lower.y, upper.y);
    indices.push(
      mode === 'hips' ? joints[0].index : lower.index,
      mode === 'hips' ? joints[0].index : upper.index,
      0,
      0,
    );
    weights.push(mode === 'hips' ? 1 : 1 - t, mode === 'hips' ? 0 : t, 0, 0);
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = name;
  mesh.frustumCulled = false;
  vrm.scene.add(mesh);
  mesh.bind(skeleton, new THREE.Matrix4());
  return mesh;
}
