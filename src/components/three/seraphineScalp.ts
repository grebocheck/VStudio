import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';

const CENTER = new THREE.Vector3(0, 1.486, -0.027);
const RADII = new THREE.Vector3(0.106, 0.127, 0.119);
const TAU = Math.PI * 2;
const MERIDIANS = 96;
const PARALLELS = 48;
const MAX_POLAR = 2.4;

function radialDirection(angle: number, polar: number): THREE.Vector3 {
  return new THREE.Vector3(
    Math.sin(angle) * Math.sin(polar) * RADII.x,
    Math.cos(polar) * RADII.y,
    Math.cos(angle) * Math.sin(polar) * RADII.z,
  );
}

/** Snapshot only the primary skin so outlines and authored expressions cannot inflate the hair roots. */
function headSurface(vrm: VRM): THREE.Mesh | null {
  const positions: number[] = [];
  const point = new THREE.Vector3();
  vrm.scene.updateMatrixWorld(true);
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const skin = materials.map(
      (material) =>
        /^(Face|Body).*SKIN$/i.test(material.name) && !(material as THREE.Material & { isOutline?: boolean }).isOutline,
    );
    if (!skin.some(Boolean)) return;
    const geometry = object.geometry;
    const vertices = geometry.getAttribute('position');
    if (!vertices) return;
    const worldVertices = Array.from({ length: vertices.count }, (_, i) =>
      point.fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld).clone(),
    );
    const indices = geometry.index;
    const groups = geometry.groups.length
      ? geometry.groups
      : [{ start: 0, count: indices?.count ?? vertices.count, materialIndex: 0 }];
    for (const group of groups) {
      if (!skin[group.materialIndex ?? 0]) continue;
      for (let i = group.start; i < group.start + group.count; i += 3) {
        const triangle = [0, 1, 2].map((offset) => worldVertices[indices?.getX(i + offset) ?? i + offset]);
        // The sampler covers the upper head; lower facial surfaces only add work and possible internal hits.
        if (triangle.every((vertex) => vertex.y < 1.385)) continue;
        for (const vertex of triangle) vertex.toArray(positions, positions.length);
      }
    }
  });
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
}

/**
 * Fit the hair foundation to the actual neutral skull in bind-world coordinates.
 * Raycasts happen once on a small angular grid; strand construction then uses smooth constant-time samples.
 */
export function createSeraphineScalpSurface(vrm: VRM): (angle: number, polar: number) => THREE.Vector3 {
  const surface = headSurface(vrm);
  if (!surface) return (angle, polar) => radialDirection(angle, polar).add(CENTER);

  const radii = new Float64Array(MERIDIANS * (PARALLELS + 1));
  const raycaster = new THREE.Raycaster();
  raycaster.near = 0;
  raycaster.far = 0.35;
  const direction = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const hits: THREE.Intersection[] = [];
  for (let row = 0; row <= PARALLELS; row++) {
    const polar = (row / PARALLELS) * MAX_POLAR;
    for (let col = 0; col < (row === 0 ? 1 : MERIDIANS); col++) {
      const radial = radialDirection((col / MERIDIANS) * TAU, polar);
      direction.copy(radial).normalize();
      origin.copy(CENTER).addScaledVector(direction, 0.35);
      raycaster.set(origin, direction.clone().negate());
      hits.length = 0;
      raycaster.intersectObject(surface, false, hits);
      const hit = hits.find((candidate) => {
        const distance = candidate.point.distanceTo(CENTER);
        return distance > 0.055 && distance < 0.19 && candidate.point.clone().sub(CENTER).dot(direction) > 0;
      });
      // A close, even root layer avoids the floating helmet silhouette of the original analytic cap.
      const clearance = 0.0035 + 0.001 * (1 - THREE.MathUtils.smoothstep(polar, 0.3, 1.3));
      const radius = hit ? hit.point.distanceTo(CENTER) + clearance : radial.length();
      radii[row * MERIDIANS + col] = radius;
    }
    if (row === 0) radii.fill(radii[0], 0, MERIDIANS);
  }
  surface.geometry.dispose();
  (surface.material as THREE.Material).dispose();

  return (angle, polar) => {
    const clampedPolar = THREE.MathUtils.clamp(polar, 0, MAX_POLAR);
    const x = (THREE.MathUtils.euclideanModulo(angle, TAU) / TAU) * MERIDIANS;
    const y = (clampedPolar / MAX_POLAR) * PARALLELS;
    const x0 = Math.floor(x) % MERIDIANS;
    const x1 = (x0 + 1) % MERIDIANS;
    const y0 = Math.floor(y);
    const y1 = Math.min(PARALLELS, y0 + 1);
    const first = THREE.MathUtils.lerp(radii[y0 * MERIDIANS + x0], radii[y0 * MERIDIANS + x1], x - Math.floor(x));
    const second = THREE.MathUtils.lerp(radii[y1 * MERIDIANS + x0], radii[y1 * MERIDIANS + x1], x - Math.floor(x));
    const radius = THREE.MathUtils.lerp(first, second, y - y0);
    return radialDirection(angle, clampedPolar).setLength(radius).add(CENTER);
  };
}
