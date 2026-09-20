import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import { getAureliaSkeleton } from './aureliaSkinning';

/** A construction-time copy of the joined skin, including the source deltoids. */
export class AureliaShoulderFit {
  private readonly skin: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

  get available() {
    return this.skin.geometry.getAttribute('position').count > 0;
  }

  constructor(vrm: VRM) {
    const skeleton = getAureliaSkeleton(vrm);
    const positions: number[] = [],
      indices: number[] = [],
      weights: number[] = [];
    vrm.scene.updateMatrixWorld(true);
    vrm.scene.traverse((object) => {
      if (!(object instanceof THREE.SkinnedMesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const isSkin = (index: number) => {
        const material = materials[index];
        return (
          material?.visible &&
          ['Body_00_SKIN', 'Aurelia_Continuous_Body_Skin'].includes(material.name) &&
          !('isOutline' in material && material.isOutline)
        );
      };
      if (!materials.some((_, i) => isSkin(i))) return;
      const geometry = object.geometry,
        position = geometry.getAttribute('position');
      const skinIndex = geometry.getAttribute('skinIndex'),
        skinWeight = geometry.getAttribute('skinWeight');
      const index = geometry.getIndex();
      if (!position || !skinIndex || !skinWeight) return;
      const vertices = Array.from({ length: position.count }, (_, i) =>
        new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld),
      );
      const bones = object.skeleton.bones.map((bone) => skeleton.bones.indexOf(bone));
      const groups = geometry.groups.length
        ? geometry.groups
        : [{ start: 0, count: index?.count ?? position.count, materialIndex: 0 }];
      for (const group of groups) {
        if (!isSkin(group.materialIndex ?? 0)) continue;
        for (let i = group.start; i < group.start + group.count; i += 3) {
          const triangle = [0, 1, 2].map((offset) => (index ? index.getX(i + offset) : i + offset));
          if (triangle.every((v) => vertices[v].y < 1.16 || vertices[v].y > 1.35 || Math.abs(vertices[v].x) > 0.32))
            continue;
          for (const vertex of triangle) {
            vertices[vertex].toArray(positions, positions.length);
            for (let component = 0; component < 4; component++) {
              const bone = bones[skinIndex.getComponent(vertex, component)];
              indices.push(Math.max(0, bone));
              weights.push(bone < 0 ? 0 : skinWeight.getComponent(vertex, component));
            }
          }
        }
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
    this.skin = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  }

  /** Preserve fullness, lift intersecting cloth, and inherit the skin's blended shoulder weights. */
  fit(
    geometry: THREE.BufferGeometry,
    clearance: number | ((point: THREE.Vector3) => number) = 0.004,
    center = (point: THREE.Vector3) => new THREE.Vector3(point.x, Math.min(point.y, 1.245), -0.015),
  ) {
    if (!this.available) return;
    const position = geometry.getAttribute('position');
    const indices = geometry.getAttribute('skinIndex'),
      weights = geometry.getAttribute('skinWeight');
    const bodyPosition = this.skin.geometry.getAttribute('position');
    const bodyIndices = this.skin.geometry.getAttribute('skinIndex'),
      bodyWeights = this.skin.geometry.getAttribute('skinWeight');
    const ray = new THREE.Raycaster(),
      point = new THREE.Vector3(),
      direction = new THREE.Vector3();
    const triangle = new THREE.Triangle(),
      barycentric = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i);
      const origin = center(point);
      direction.subVectors(point, origin).normalize();
      ray.set(origin.clone().addScaledVector(direction, 0.3), direction.clone().negate());
      ray.far = 0.3;
      const hit = ray.intersectObject(this.skin, false)[0];
      if (!hit?.face) continue;
      const radius = point.distanceTo(origin),
        skinRadius = hit.point.distanceTo(origin);
      const ease = typeof clearance === 'number' ? clearance : clearance(point);
      if (radius < skinRadius + ease) {
        point.copy(origin).addScaledVector(direction, skinRadius + ease);
        position.setXYZ(i, point.x, point.y, point.z);
      }
      const vertices = [hit.face.a, hit.face.b, hit.face.c];
      triangle.setFromAttributeAndIndices(bodyPosition, ...(vertices as [number, number, number]));
      triangle.getBarycoord(hit.point, barycentric);
      const influences = new Map<number, number>();
      vertices.forEach((vertex, corner) => {
        for (let component = 0; component < 4; component++) {
          const bone = bodyIndices.getComponent(vertex, component);
          const weight = bodyWeights.getComponent(vertex, component) * barycentric.getComponent(corner);
          influences.set(bone, (influences.get(bone) ?? 0) + weight);
        }
      });
      const sorted = [...influences]
        .filter(([, weight]) => weight > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const total = sorted.reduce((sum, [, weight]) => sum + weight, 0);
      for (let component = 0; component < 4; component++) {
        indices.setComponent(i, component, sorted[component]?.[0] ?? 0);
        weights.setComponent(i, component, (sorted[component]?.[1] ?? 0) / (total || 1));
      }
    }
    position.needsUpdate = indices.needsUpdate = weights.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  dispose() {
    this.skin.geometry.dispose();
    this.skin.material.dispose();
  }
}
