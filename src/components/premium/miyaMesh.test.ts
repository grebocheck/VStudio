import { describe, expect, it } from 'vitest';
import { INITIAL_RIG, MIYA_NOCTURNE_PRESET } from '../../presets';
import { deformPoint, deformationFor, MIYA_MESH, triangleTransform, type MeshPart } from './miyaMesh';

describe('Miya deformation mesh', () => {
  it('preserves triangle orientation and finite geometry over supported tracking extremes', () => {
    for (const angleX of [-30, 0, 30])
      for (const angleY of [-30, 0, 30])
        for (const sway of [-18, 18]) {
          const pose = deformationFor(
            { motionIntensity: 1.5 },
            { ...INITIAL_RIG, angleX, angleY, hairSwayX: sway, hairSwayY: sway, mouthOpen: 1, breath: 0.25, bodyX: 15 },
          );
          for (const part of Object.keys(MIYA_MESH) as MeshPart[])
            for (const triangle of MIYA_MESH[part]) {
              const transform = triangleTransform(triangle, part, pose);
              const numbers = transform.slice(7, -1).split(' ').map(Number);
              expect(numbers.every(Number.isFinite)).toBe(true);
              // A flipped or collapsed triangle produces texture tears at movement limits.
              expect(numbers[0] * numbers[3] - numbers[1] * numbers[2], `${part}: ${transform}`).toBeGreaterThan(0.55);
            }
        }
  });

  it('keeps adjacent texture triangles joined after deformation', () => {
    const pose = deformationFor(MIYA_NOCTURNE_PRESET.config, {
      ...INITIAL_RIG,
      angleX: 24,
      angleY: -12,
      hairSwayX: 14,
      mouthOpen: 0.8,
    });
    for (const part of Object.keys(MIYA_MESH) as MeshPart[]) {
      const seen = new Map<string, number[]>();
      for (const triangle of MIYA_MESH[part]) {
        const [a, b, c, d, e, f] = triangleTransform(triangle, part, pose).slice(7, -1).split(' ').map(Number);
        for (const [x, y] of triangle.points) {
          const transformed = [a * x + c * y + e, b * x + d * y + f];
          const previous = seen.get(`${x},${y}`);
          if (previous)
            expect(Math.hypot(previous[0] - transformed[0], previous[1] - transformed[1])).toBeLessThan(0.025);
          seen.set(`${x},${y}`, transformed);
        }
      }
    }
  });

  it('bends hair tips more than roots and moves the chin with speech', () => {
    const still = deformationFor({}, INITIAL_RIG);
    const sway = deformationFor({}, { ...INITIAL_RIG, hairSwayX: 10 });
    const root = deformPoint([340, 405], 'hair-left', sway);
    const tip = deformPoint([340, 1250], 'hair-left', sway);
    expect(Math.abs(tip[0] - 340)).toBeGreaterThan(Math.abs(root[0] - 340) + 5);
    const talking = deformationFor({}, { ...INITIAL_RIG, mouthOpen: 1 });
    expect(deformPoint([512, 410], 'head', talking)[1]).toBeGreaterThan(deformPoint([512, 410], 'head', still)[1] + 5);
    expect(deformPoint([512, 140], 'head', talking)).toEqual(deformPoint([512, 140], 'head', still));
  });
});
