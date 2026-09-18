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

interface SurfaceFit {
  offset: THREE.Vector3;
  influences: Map<number, number>;
}

const fittedSurfaces = new WeakMap<VRM, (point: THREE.Vector3) => SurfaceFit>();

/** Registered once after source-boundary fitting, and sampled only while constructing garments. */
export function registerAureliaSurface(vrm: VRM, sample: (point: THREE.Vector3) => SurfaceFit) {
  fittedSurfaces.set(vrm, sample);
}

/** Preserve garment ease while applying the same measured shoulder/neck correction as the skin. */
export function fitAureliaGeometry(vrm: VRM, geometry: THREE.BufferGeometry) {
  const sample = fittedSurfaces.get(vrm);
  if (!sample) return geometry;
  const position = geometry.getAttribute('position');
  const point = new THREE.Vector3();
  const indices: number[] = [],
    weights: number[] = [];
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i);
    const fitted = sample(point);
    point.add(fitted.offset);
    position.setXYZ(i, point.x, point.y, point.z);
    const influences = [...fitted.influences]
      .filter(([, weight]) => weight > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const total = influences.reduce((sum, [, weight]) => sum + weight, 0);
    for (let component = 0; component < 4; component++) {
      indices.push(influences[component]?.[0] ?? 0);
      weights.push((influences[component]?.[1] ?? 0) / (total || 1));
    }
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.computeVertexNormals();
  return geometry;
}

/** The same chest/neck field binds the body and fitted clothing without dragging shoulders with the head. */
export function createAureliaSkinSampler(vrm: VRM, fitted = true) {
  const surface = fitted ? fittedSurfaces.get(vrm) : undefined;
  if (surface) return (point: THREE.Vector3) => surface(point).influences;
  const skeleton = getAureliaSkeleton(vrm);
  const anchors = [0.975, 1.065, 1.145, 1.245];
  const names = ['hips', 'spine', 'chest', 'upperChest'] as const;
  const joints = names.map((name, i) => ({
    index: skeleton.bones.findIndex((bone) => bone === vrm.humanoid.getRawBoneNode(name)),
    y: anchors[i],
  }));
  const neck = skeleton.bones.findIndex((bone) => bone === vrm.humanoid.getRawBoneNode('neck'));
  return (position: THREE.Vector3): Map<number, number> => {
    let lower = joints[0],
      upper = joints[1];
    for (let j = 0; j < joints.length - 1; j++) {
      if (position.y >= joints[j].y) {
        lower = joints[j];
        upper = joints[j + 1];
      }
    }
    const t = THREE.MathUtils.smoothstep(position.y, lower.y, upper.y);
    const neckWeight =
      THREE.MathUtils.smoothstep(position.y, 1.292, 1.337) *
      (1 - THREE.MathUtils.smoothstep(Math.abs(position.x), 0.025, 0.075));
    return new Map([
      [lower.index, (1 - t) * (1 - neckWeight)],
      [upper.index, t * (1 - neckWeight)],
      [neck, neckWeight],
    ]);
  };
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
  const sample = createAureliaSkinSampler(vrm);
  const hips = skeleton.bones.findIndex((bone) => bone === vrm.humanoid.getRawBoneNode('hips'));
  if (!geometry.hasAttribute('skinIndex') || !geometry.hasAttribute('skinWeight')) {
    const position = geometry.getAttribute('position');
    const indices: number[] = [],
      weights: number[] = [];
    const point = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      const influences = (mode === 'hips' ? [[hips, 1]] : [...sample(point.fromBufferAttribute(position, i))])
        .filter(([, weight]) => weight > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const total = influences.reduce((sum, [, weight]) => sum + weight, 0);
      for (let component = 0; component < 4; component++) {
        indices.push(influences[component]?.[0] ?? 0);
        weights.push((influences[component]?.[1] ?? 0) / (total || 1));
      }
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  }
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = name;
  mesh.frustumCulled = false;
  vrm.scene.add(mesh);
  mesh.bind(skeleton, new THREE.Matrix4());
  return mesh;
}
