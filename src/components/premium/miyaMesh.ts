import type { AvatarConfig, RigParams } from '../../types';

export type Point = readonly [number, number];
export type MeshPart = 'body' | 'head' | 'neck' | 'hair-left' | 'hair-right';
export interface MeshTriangle {
  points: readonly [Point, Point, Point];
  clip: string;
}

const limit = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : 0));
const smooth = (n: number) => {
  const t = limit(n, 0, 1);
  return t * t * (3 - 2 * t);
};
const number = (n: number) => Number(n.toFixed(5));

function grid(xs: number[], ys: number[]): MeshTriangle[] {
  const triangles: MeshTriangle[] = [];
  const add = (points: [Point, Point, Point]) => {
    // Subpixel overlap eliminates antialias cracks between independently painted triangles.
    const center: Point = [points.reduce((n, p) => n + p[0], 0) / 3, points.reduce((n, p) => n + p[1], 0) / 3];
    const clip = points
      .map(([x, y]) => {
        const d = Math.hypot(x - center[0], y - center[1]);
        return `${number(x + ((x - center[0]) / d) * 0.55)},${number(y + ((y - center[1]) / d) * 0.55)}`;
      })
      .join(' ');
    triangles.push({ points, clip });
  };
  for (let y = 0; y < ys.length - 1; y++)
    for (let x = 0; x < xs.length - 1; x++) {
      const a: Point = [xs[x], ys[y]],
        b: Point = [xs[x + 1], ys[y]],
        c: Point = [xs[x + 1], ys[y + 1]],
        d: Point = [xs[x], ys[y + 1]];
      add([a, b, c]);
      add([a, c, d]);
    }
  return triangles;
}

/** Authored topology: more vertices around face and shoulder joints, fewer in transparent margins. */
export const MIYA_MESH: Record<MeshPart, MeshTriangle[]> = {
  head: grid([0, 280, 370, 440, 512, 584, 654, 744, 1024], [-30, 85, 170, 240, 300, 355, 418]),
  neck: grid([442, 512, 587], [375, 418, 465, 500]),
  body: grid([0, 250, 380, 512, 644, 774, 1024], [360, 440, 560, 740, 960, 1200, 1596]),
  'hair-left': grid([0, 230, 340, 445], [405, 480, 600, 760, 960, 1160, 1430]),
  'hair-right': grid([589, 684, 794, 1024], [405, 480, 600, 760, 960, 1160, 1430]),
};

export interface Deformation {
  yaw: number;
  pitch: number;
  breath: number;
  swayX: number;
  swayY: number;
  intensity: number;
  body: number;
  jaw: number;
}

export function deformationFor(config: Pick<AvatarConfig, 'motionIntensity'>, rig: RigParams): Deformation {
  const intensity = limit(config.motionIntensity ?? 1, 0.35, 1.5);
  return {
    yaw: limit(rig.angleX, -30, 30) * intensity,
    pitch: limit(rig.angleY, -30, 30) * intensity,
    breath: Math.sin(limit(rig.breath, 0, 1) * Math.PI * 2),
    swayX: limit(rig.hairSwayX ?? 0, -18, 18) * intensity,
    swayY: limit(rig.hairSwayY ?? 0, -18, 18) * intensity,
    body: limit(rig.bodyX, -15, 15) * intensity,
    jaw: limit(rig.mouthOpen, 0, 1),
    intensity,
  };
}

/** A continuous depth field gives nose/cheeks more parallax than the hair silhouette. */
export function deformHead([x, y]: Point, pose: Deformation): Point {
  const face = Math.exp(-Math.pow((x - 512) / 215, 2)) * Math.sin(Math.PI * smooth((y - 90) / 420));
  const taper = 1 - smooth((y - 385) / 130);
  const turn = (pose.yaw * Math.PI) / 180;
  const ear = (1 - smooth((y - 85) / 100)) * smooth(Math.abs(x - 512) / 240);
  const jaw = smooth((y - 330) / 85) * (1 - smooth((y - 415) / 60)) * Math.exp(-Math.pow((x - 512) / 120, 2));
  return [
    512 +
      (x - 512) * (1 - (1 - Math.cos(turn * 0.6)) * taper) +
      Math.sin(turn) * 38 * face * taper +
      ear * pose.swayX * 0.3,
    y -
      pose.pitch * 0.27 * face * taper +
      (x - 512) * pose.yaw * 0.0007 * taper +
      ear * pose.swayY * 0.25 +
      jaw * pose.jaw * 6,
  ];
}

export function deformPoint(point: Point, part: MeshPart, pose: Deformation): Point {
  const [x, y] = point;
  if (part === 'head' || part === 'neck') return deformHead(point, pose);
  if (part === 'body') {
    const shoulder = Math.exp(-Math.pow((y - 540) / 250, 2));
    const waist = smooth((y - 1000) / 560);
    return [
      x + (x - 512) * pose.breath * 0.008 * shoulder + pose.body * 0.3 * (1 - waist),
      y - pose.breath * 3.4 * shoulder + (x - 512) * pose.body * 0.0008 * shoulder,
    ];
  }
  const root = deformHead([x, Math.min(y, 418)], pose);
  const length = smooth((y - 410) / 850);
  const side = part === 'hair-left' ? -1 : 1;
  const wave = Math.sin(length * Math.PI * 1.35);
  return [
    x +
      (root[0] - x) * (1 - length) +
      pose.swayX * (1.4 * length + 0.65 * wave) -
      pose.yaw * 0.28 * length +
      side * pose.breath * 2.5 * wave,
    y + (root[1] - Math.min(y, 418)) * (1 - length) + pose.swayY * 0.7 * length + pose.breath * 1.8 * wave,
  ];
}

/** Affine map of a source triangle to its deformed vertices (shared by live SVG and exports). */
export function triangleTransform(triangle: MeshTriangle, part: MeshPart, pose: Deformation): string {
  const [p, q, r] = triangle.points;
  const [a, b, c] = triangle.points.map((point) => deformPoint(point, part, pose));
  const ux = q[0] - p[0],
    uy = q[1] - p[1],
    vx = r[0] - p[0],
    vy = r[1] - p[1];
  const det = ux * vy - uy * vx;
  const m00 = ((b[0] - a[0]) * vy - (c[0] - a[0]) * uy) / det;
  const m01 = ((c[0] - a[0]) * ux - (b[0] - a[0]) * vx) / det;
  const m10 = ((b[1] - a[1]) * vy - (c[1] - a[1]) * uy) / det;
  const m11 = ((c[1] - a[1]) * ux - (b[1] - a[1]) * vx) / det;
  return `matrix(${[m00, m10, m01, m11, a[0] - m00 * p[0] - m01 * p[1], a[1] - m10 * p[0] - m11 * p[1]].map(number).join(' ')})`;
}

/** Local tangent for painted face patches keeps them attached to the deforming skin. */
export function featureTransform(x: number, y: number, pose: Deformation): string {
  const triangle: MeshTriangle = {
    points: [
      [x, y],
      [x + 1, y],
      [x, y + 1],
    ],
    clip: '',
  };
  return triangleTransform(triangle, 'head', pose);
}
