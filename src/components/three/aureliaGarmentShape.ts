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
  [1.25, 0.142, 0.092, 0.072],
  [1.275, 0.122, 0.076, 0.058],
  [1.3, 0.084, 0.052, 0.045],
  [1.325, 0.033, 0.036, 0.036],
  [1.344, 0.0332, 0.0356, 0.0356],
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

/** Anatomical bind-space surface shared by the full torso and its fitted garments. */
export function bodySurface(phi: number, y: number, out = new THREE.Vector3()) {
  const sin = Math.sin(phi),
    cos = Math.cos(phi);
  const x = sin * section(y, 1);
  const neck = THREE.MathUtils.smoothstep(y, 1.24, 1.325);
  const centerZ = THREE.MathUtils.lerp(0.004, -0.027, neck);
  let z = centerZ + cos * section(y, cos >= 0 ? 2 : 3);
  if (cos > 0 && y > 1.09 && y < 1.245) {
    const u = (y - 1.09) / 0.155;
    // Broad lower fullness and a long, shallow upper transition form a modest pear profile.
    const peak = 1.05 / (1.05 + 1.75);
    const vertical = (Math.pow(u, 1.05) * Math.pow(1 - u, 1.75)) / (Math.pow(peak, 1.05) * Math.pow(1 - peak, 1.75));
    const width = 0.066 * (1 - 0.32 * THREE.MathUtils.smoothstep(u, 0.48, 1));
    let fullness = 0;
    for (const side of [-1, 1]) {
      const q = (x - side * (0.054 - 0.008 * u)) / width;
      fullness = Math.max(fullness, 0.031 * vertical * Math.pow(Math.max(0, 1 - q * q), 1.35));
    }
    z += fullness * smooth(cos / 0.45);
  }
  return out.set(x, y, z);
}

export function bodyNormal(phi: number, y: number, out = new THREE.Vector3()) {
  const tangent = bodySurface(phi + 0.0005, y).sub(bodySurface(phi - 0.0005, y));
  const vertical = bodySurface(phi, y + 0.0001).sub(bodySurface(phi, y - 0.0001));
  return out.crossVectors(tangent, vertical).normalize();
}

/** A gently draped shell with ease, a centre bridge and shallow material folds. */
export function bodiceSurface(phi: number, t: number, out = new THREE.Vector3()) {
  const y = THREE.MathUtils.lerp(GARMENT_WAIST, bodiceTop(phi), t);
  bodySurface(phi, y, out);
  const cos = Math.cos(phi),
    sin = Math.sin(phi);
  out.x += sin * 0.0045;
  out.z += cos * 0.0055;
  if (cos > 0) {
    const width = section(y, 1);
    const anchorPhi = Math.asin(Math.min(0.054 / width, 0.9));
    const bridge = bodySurface(anchorPhi, y).z + 0.006;
    const span = 1 - THREE.MathUtils.smoothstep(Math.abs(out.x), 0.038, 0.082);
    const upperDrape = THREE.MathUtils.smoothstep(y, 1.04, 1.095) * (1 - THREE.MathUtils.smoothstep(y, 1.2, 1.245));
    out.z += Math.max(0, bridge - out.z) * span * upperDrape;
    const ease = 0.006 * Math.exp(-Math.pow((y - 1.068) / 0.058, 2));
    const foldEnvelope = Math.sin(Math.PI * t) ** 2 * smooth(cos / 0.5);
    const folds = 0.0013 * (1 + Math.cos(phi * 18 + (y - 1) * 32)) * foldEnvelope;
    out.z += ease * smooth(cos / 0.65) + folds;
  }
  return out;
}

export function chokerSurface(phi: number, v: number, out = new THREE.Vector3()) {
  const y = 1.331 + v * 0.009;
  return bodySurface(phi, y, out).addScaledVector(bodyNormal(phi, y), 0.0016);
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
  // Follow the shoulder surface with constant clearance, including both attachment edges.
  const phi = side * THREE.MathUtils.lerp(0.78, Math.PI - 0.78, t) + across * 0.115;
  const end = bodiceTop(phi);
  const y = THREE.MathUtils.lerp(end, 1.29, Math.sin(Math.PI * t));
  bodySurface(phi, y, out).addScaledVector(bodyNormal(phi, y), 0.0022);
  const edge = Math.pow(Math.abs(2 * t - 1), 8);
  const attach = bodiceSurface(phi, 1);
  const bodyAtEdge = bodySurface(phi, end).addScaledVector(bodyNormal(phi, end), 0.0022);
  return out.addScaledVector(attach.sub(bodyAtEdge), edge);
}

export function skirtCoordinates(point: THREE.Vector3) {
  const phi = Math.atan2(point.x / 0.255, (point.z - 0.004) / 0.178);
  return {
    u: (((phi / TAU) % 1) + 1) % 1,
    v: THREE.MathUtils.clamp((GARMENT_WAIST - point.y) / (GARMENT_WAIST - skirtSurface(phi, 1).y), 0, 1),
  };
}
