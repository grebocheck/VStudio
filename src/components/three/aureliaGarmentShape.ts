import * as THREE from 'three';

export const GARMENT_WAIST = 0.948;
export const SKIRT_COLUMNS = 48;
export const SKIRT_ROWS = 17;
const TAU = Math.PI * 2;
const smooth = (x: number) => THREE.MathUtils.smoothstep(x, 0, 1);

/** Smooth, measured cross-sections, in the source humanoid's meter-scale bind space. */
const sections = [
  [0.948, 0.1245, 0.089, 0.089],
  [1.015, 0.0991, 0.0726, 0.0726],
  [1.055, 0.0895, 0.069, 0.069],
  [1.095, 0.098, 0.077, 0.075],
  [1.14, 0.123, 0.1, 0.075],
  [1.185, 0.126, 0.096, 0.076],
  [1.225, 0.123, 0.087, 0.073],
  [1.255, 0.119, 0.074, 0.065],
  [1.278, 0.108, 0.062, 0.055],
  [1.3, 0.083, 0.047, 0.043],
  [1.318, 0.044, 0.037, 0.037],
  [1.331, 0.0333, 0.0356, 0.0356],
  [1.344, 0.0332, 0.0356, 0.0356],
];

function section(y: number, component: number) {
  let index = 0;
  while (index < sections.length - 2 && y > sections[index + 1][0]) index++;
  const a = sections[index],
    b = sections[index + 1];
  const t = THREE.MathUtils.clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
  // Shape-preserving Hermite tangents avoid overshoot at the waist, ribs and neck.
  const slope = (at: number) => {
    if (at === 0 || at === sections.length - 1) return 0;
    const left = sections[at - 1],
      current = sections[at],
      right = sections[at + 1];
    const d0 = (current[component] - left[component]) / (current[0] - left[0]);
    const d1 = (right[component] - current[component]) / (right[0] - current[0]);
    if (d0 * d1 <= 0) return 0;
    const h0 = current[0] - left[0],
      h1 = right[0] - current[0];
    const w0 = 2 * h1 + h0,
      w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const span = b[0] - a[0];
  const m0 = slope(index) * span,
    m1 = slope(index + 1) * span;
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
  const lowerCenter = 0.014 + 0.03 * THREE.MathUtils.smoothstep(y, 0.948, 1.055);
  const waistCenter = THREE.MathUtils.lerp(lowerCenter, 0.004, THREE.MathUtils.smoothstep(y, 1.065, 1.155));
  const centerZ = THREE.MathUtils.lerp(waistCenter, -0.027, neck);
  let z = centerZ + cos * section(y, cos >= 0 ? 2 : 3);
  if (cos > 0) {
    // C2 compact lobes merge into the rib cage without a centre ridge or a hard lower shelf.
    // Wider lower tissue and a shallower, longer upper pole keep the silhouette modest.
    const upper = THREE.MathUtils.smoothstep(y, 1.14, 1.235);
    const width = THREE.MathUtils.lerp(0.071, 0.051, upper);
    const height = THREE.MathUtils.lerp(0.07, 0.098, THREE.MathUtils.smoothstep(y, 1.13, 1.17));
    const vertical = (y - 1.148) / height;
    let fullness = 0;
    for (const side of [-1, 1]) {
      const center = side * THREE.MathUtils.lerp(0.057, 0.05, upper);
      const horizontal = (x - center) / width;
      const support = Math.max(0, 1 - horizontal * horizontal - vertical * vertical);
      fullness += 0.039 * Math.pow(support, 2.5);
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
  // The lower dress also encloses the fitted shorts and the pelvis' squarer cross-section.
  const hipEase = 0.014 * (1 - THREE.MathUtils.smoothstep(y, 0.995, 1.065));
  out.x += sin * (0.0045 + hipEase);
  out.z += cos * (0.0055 + hipEase);
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
  const fullness = Math.pow(v, 0.88);
  const waist = bodiceSurface(phi, 0);
  const fold =
    (Math.cos(phi * 12 + 0.18 * Math.sin(v * Math.PI)) * 0.009 + Math.cos(phi * 24 - v * 0.45) * 0.0025) *
    Math.pow(v, 1.25);
  const hem = 0.59 + 0.004 * Math.cos(phi * 12) + 0.008 * Math.cos(phi);
  return out.set(
    THREE.MathUtils.lerp(waist.x, Math.sin(phi) * 0.272, fullness) + Math.sin(phi) * fold,
    THREE.MathUtils.lerp(GARMENT_WAIST, hem, v),
    THREE.MathUtils.lerp(waist.z, 0.004 + Math.cos(phi) * 0.19, fullness) + Math.cos(phi) * fold * 0.82,
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
  const phi = Math.atan2(point.x / 0.272, (point.z - 0.004) / 0.19);
  return {
    u: (((phi / TAU) % 1) + 1) % 1,
    v: THREE.MathUtils.clamp((GARMENT_WAIST - point.y) / (GARMENT_WAIST - skirtSurface(phi, 1).y), 0, 1),
  };
}
