import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';

const sculptedMeshes = new WeakSet<THREE.Mesh>();
const smooth = THREE.MathUtils.smoothstep;
const bell = (value: number, center: number, radius: number) => Math.exp(-Math.pow((value - center) / radius, 2));

/** A continuous sculpt in the shipped avatar's bind-world coordinates (metres, +Z forward). */
function sculpt(point: THREE.Vector3, result: THREE.Vector3): THREE.Vector3 {
  const { x, y, z } = point;
  const ax = Math.abs(x);
  const side = Math.sign(x);
  // Keep the neck, ear attachments, back of the skull and hairline fitted to the original rig.
  const face = smooth(z, -0.025, 0.027) * smooth(y, 1.34, 1.365) * (1 - smooth(y, 1.493, 1.523));
  if (face === 0) return result.copy(point);

  const eyes =
    smooth(ax, 0.011, 0.022) * (1 - smooth(ax, 0.069, 0.091)) * smooth(y, 1.409, 1.427) * (1 - smooth(y, 1.463, 1.476));
  // Keep the authored eye opening expressive; a gentle outer lift gives her a separate identity.
  // Apply this to the entire socket and its targets so the lids still meet during a full blink.
  let dx = side * (ax - 0.04) * 0.024 * eyes;
  let dy = (-(y - 1.443) * 0.025 + (ax - 0.04) * 0.045) * eyes;
  let dz = 0;

  // A softly oval lower face: lightly tailored jaw, full cheek transition and a shorter rounded chin.
  dx -= x * 0.029 * bell(y, 1.391, 0.03) * smooth(ax, 0.014, 0.054);
  dx += side * 0.00065 * bell(y, 1.432, 0.023) * smooth(ax, 0.042, 0.072);
  dx += side * 0.0013 * bell(y, 1.365, 0.014) * smooth(ax, 0.002, 0.015) * (1 - smooth(ax, 0.033, 0.056));
  dy += 0.003 * bell(y, 1.357, 0.023) * (1 - smooth(ax, 0.025, 0.067));
  dz += 0.00065 * bell(y, 1.412, 0.021) * bell(ax, 0.053, 0.023);

  // The bridge and lips keep their original soft profile instead of sharpening into a pointed nose.
  const nose = bell(x, 0, 0.012) * bell(y, 1.424, 0.02);
  dx -= x * 0.015 * nose;
  dz += 0.00065 * nose;
  const mouth = bell(x, 0, 0.027) * bell(y, 1.389, 0.013);
  dx += x * 0.07 * mouth;
  dy += 0.00035 * mouth;
  dz += 0.0004 * mouth;

  const brow = bell(y, 1.481, 0.008) * smooth(ax, 0.014, 0.025) * (1 - smooth(ax, 0.068, 0.086));
  dy += (0.0006 + (ax - 0.04) * 0.018) * brow;
  return result.set(x + dx * face, y + dy * face, z + dz * face);
}

/** The inverse-transpose Jacobian carries authored smooth normals through the nonlinear sculpt. */
function normalTransform(point: THREE.Vector3, matrix: THREE.Matrix3): THREE.Matrix3 {
  const step = 0.00001;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const offset = point.clone();
  const columns: number[] = [];
  for (const axis of ['x', 'y', 'z'] as const) {
    offset.copy(point)[axis] += step;
    sculpt(offset, a);
    offset.copy(point)[axis] -= step;
    sculpt(offset, b);
    a.sub(b)
      .multiplyScalar(0.5 / step)
      .toArray(columns, columns.length);
  }
  return matrix.fromArray(columns).invert().transpose();
}

/** Give Seraphine her own facial proportions without changing skeleton or expression bindings. */
export function sculptSeraphineFace(vrm: VRM): void {
  vrm.scene.updateMatrixWorld(true);
  const cache = new Map<THREE.BufferGeometry, { matrix: THREE.Matrix4; geometry: THREE.BufferGeometry }[]>();
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || sculptedMeshes.has(object)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (!materials.some((material) => /^(Face|Eye)|SKIN/.test(material.name))) return;
    const original = object.geometry;
    const shared = cache.get(original)?.find(({ matrix }) => matrix.equals(object.matrixWorld));
    if (shared) {
      object.geometry = shared.geometry;
      sculptedMeshes.add(object);
      return;
    }

    const geometry = original.clone();
    const position = geometry.getAttribute('position');
    if (!position) return;
    const normal = geometry.getAttribute('normal');
    const toWorld = object.matrixWorld;
    const toLocal = toWorld.clone().invert();
    const normalToWorld = new THREE.Matrix3().getNormalMatrix(toWorld);
    const normalToLocal = new THREE.Matrix3().getNormalMatrix(toLocal);
    const point = new THREE.Vector3();
    const base = new THREE.Vector3();
    const deformedBase = new THREE.Vector3();
    const deformed = new THREE.Vector3();
    const sourceNormal = new THREE.Vector3();
    const deformedNormal = new THREE.Vector3();
    const baseNormal = new THREE.Vector3();
    const baseJacobian = new THREE.Matrix3();
    const targetJacobian = new THREE.Matrix3();
    const morphPositions = geometry.morphAttributes.position ?? [];
    const morphNormals = geometry.morphAttributes.normal ?? [];

    for (let i = 0; i < position.count; i++) {
      base.fromBufferAttribute(position, i);
      point.copy(base).applyMatrix4(toWorld);
      sculpt(point, deformedBase).applyMatrix4(toLocal);
      normalTransform(point, baseJacobian);
      if (normal) {
        sourceNormal.fromBufferAttribute(normal, i);
        deformedNormal
          .copy(sourceNormal)
          .applyMatrix3(normalToWorld)
          .applyMatrix3(baseJacobian)
          .applyMatrix3(normalToLocal)
          .normalize();
        baseNormal.copy(deformedNormal);
      }

      for (let target = 0; target < morphPositions.length; target++) {
        const morphPosition = morphPositions[target];
        point.fromBufferAttribute(morphPosition, i);
        if (geometry.morphTargetsRelative) point.add(base);
        point.applyMatrix4(toWorld);
        sculpt(point, deformed).applyMatrix4(toLocal);
        if (geometry.morphTargetsRelative) deformed.sub(deformedBase);
        morphPosition.setXYZ(i, deformed.x, deformed.y, deformed.z);
        const morphNormal = morphNormals[target];
        if (normal && morphNormal) {
          normalTransform(point, targetJacobian);
          deformedNormal.fromBufferAttribute(morphNormal, i);
          if (geometry.morphTargetsRelative) deformedNormal.add(sourceNormal);
          deformedNormal
            .applyMatrix3(normalToWorld)
            .applyMatrix3(targetJacobian)
            .applyMatrix3(normalToLocal)
            .normalize();
          if (geometry.morphTargetsRelative) deformedNormal.sub(baseNormal);
          morphNormal.setXYZ(i, deformedNormal.x, deformedNormal.y, deformedNormal.z);
        }
      }
      position.setXYZ(i, deformedBase.x, deformedBase.y, deformedBase.z);
      normal?.setXYZ(i, baseNormal.x, baseNormal.y, baseNormal.z);
    }
    for (const attribute of [position, normal, ...morphPositions, ...morphNormals]) {
      if (attribute) attribute.needsUpdate = true;
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    object.geometry = geometry;
    sculptedMeshes.add(object);
    const entries = cache.get(original) ?? [];
    entries.push({ matrix: toWorld.clone(), geometry });
    cache.set(original, entries);
  });
}
