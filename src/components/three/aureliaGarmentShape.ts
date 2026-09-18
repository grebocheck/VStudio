import * as THREE from 'three';

export const GARMENT_WAIST = 0.948;
export const SKIRT_COLUMNS = 48;
export const SKIRT_ROWS = 17;
const TAU = Math.PI * 2;
const smooth = (x: number) => THREE.MathUtils.smoothstep(x, 0, 1);

/** Smooth, measured cross-sections, in the source humanoid's meter-scale bind space. */
const sections = [
  [0.948, 0.141, 0.104, 0.086],
  [1.015, 0.112, 0.113, 0.078],
  [1.075, 0.107, 0.116, 0.072],
  [1.13, 0.12, 0.121, 0.073],
  [1.185, 0.139, 0.118, 0.077],
  [1.25, 0.145, 0.098, 0.074],
];

function section(y: number, component: number) {
  let index = 0;
  while (index < sections.length - 2 && y > sections[index + 1][0]) index++;
  const a = sections[index],
    b = sections[index + 1];
  const t = THREE.MathUtils.clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
  // Hermite slopes preserve a rounded silhouette across section boundaries.
  const before = sections[Math.max(0, index - 1)],
    after = sections[Math.min(sections.length - 1, index + 2)];
  const span = b[0] - a[0];
  const m0 = ((b[component] - before[component]) / (b[0] - before[0])) * span;
  const m1 = ((after[component] - a[component]) / (after[0] - a[0])) * span;
  return (
    (2 * t * t * t - 3 * t * t + 1) * a[component] +
    (t * t * t - 2 * t * t + t) * m0 +
    (-2 * t * t * t + 3 * t * t) * b[component] +
    (t * t * t - t * t) * m1
  );
}

export function bodiceTop(phi: number) {
  const front = Math.max(0, Math.cos(phi));
  const side = Math.abs(Math.sin(phi));
  return 1.246 - 0.039 * Math.pow(side, 4) - front * 0.018 * Math.exp(-Math.pow(Math.sin(phi) / 0.4, 2));
}

/** A continuous clothed torso with two softly bridged bust volumes, not attached spheres. */
export function bodiceSurface(phi: number, t: number, out = new THREE.Vector3()) {
  const y = THREE.MathUtils.lerp(GARMENT_WAIST, bodiceTop(phi), t);
  const sin = Math.sin(phi),
    cos = Math.cos(phi);
  const x = sin * section(y, 1);
  const front = Math.max(0, cos);
  const upper = Math.exp(-Math.pow((y - 1.176) / 0.057, 2));
  const lobes = Math.exp(-Math.pow((x - 0.059) / 0.052, 2)) + Math.exp(-Math.pow((x + 0.059) / 0.052, 2));
  const volume = 0.069 * upper * lobes * smooth(front / 0.6);
  const z = 0.004 + cos * section(y, cos >= 0 ? 2 : 3) + volume;
  return out.set(x, y, z);
}

/** V=0 is the pinned waist; V=1 is the free, scalloped hem. */
export function skirtSurface(phi: number, v: number, out = new THREE.Vector3()) {
  const fullness = Math.pow(v, 0.78);
  const waist = bodiceSurface(phi, 0);
  const fold = Math.cos(phi * 12) * Math.pow(v, 1.4) * 0.009;
  const hem = 0.627 + 0.004 * Math.cos(phi * 12) + 0.008 * Math.cos(phi);
  return out.set(
    THREE.MathUtils.lerp(waist.x, Math.sin(phi) * 0.255, fullness) + Math.sin(phi) * fold,
    THREE.MathUtils.lerp(GARMENT_WAIST, hem, v),
    THREE.MathUtils.lerp(waist.z, 0.004 + Math.cos(phi) * 0.178, fullness) + Math.cos(phi) * fold * 0.82,
  );
}

export function shoulderStrap(side: number, t: number, across: number, out = new THREE.Vector3()) {
  // Cubic Bezier over the shoulder joins front and rear bodice without sealing the armhole.
  const front = bodiceSurface(side * 0.78, 1);
  const back = bodiceSurface(side * (Math.PI - 0.78), 1);
  const curve = new THREE.CubicBezierCurve3(
    front,
    new THREE.Vector3(side * 0.106, 1.325, 0.072),
    new THREE.Vector3(side * 0.103, 1.325, -0.082),
    back,
  );
  curve.getPoint(t, out);
  out.x += side * across * 0.016;
  return out;
}

export function skirtCoordinates(point: THREE.Vector3) {
  const phi = Math.atan2(point.x / 0.255, (point.z - 0.004) / 0.178);
  return {
    u: (((phi / TAU) % 1) + 1) % 1,
    v: THREE.MathUtils.clamp((GARMENT_WAIST - point.y) / (GARMENT_WAIST - skirtSurface(phi, 1).y), 0, 1),
  };
}
