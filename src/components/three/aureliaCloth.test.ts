import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { AureliaCloth } from './aureliaCloth';
import { bodiceSurface, bodySurface, SKIRT_COLUMNS, SKIRT_ROWS, skirtSurface } from './aureliaGarmentShape';

function create() {
  const points: number[] = [];
  for (let y = 0; y < SKIRT_ROWS; y++)
    for (let x = 0; x < SKIRT_COLUMNS; x++)
      skirtSurface((x / SKIRT_COLUMNS) * Math.PI * 2, y / (SKIRT_ROWS - 1)).toArray(points, points.length);
  return new AureliaCloth(SKIRT_COLUMNS, SKIRT_ROWS, points);
}

describe('tailored garment', () => {
  it('keeps the smaller pear-shaped anatomy symmetric with a fitted waist', () => {
    const a = bodySurface(0.44, 1.16),
      b = bodySurface(-0.44, 1.16),
      waist = bodySurface(0.44, 0.948);
    expect(a.z).toBeGreaterThan(0.13);
    expect(a.z).toBeLessThan(0.155);
    expect(a.x).toBeCloseTo(-b.x, 8);
    expect(a.z).toBeCloseTo(b.z, 8);
    expect(a.z - waist.z).toBeGreaterThan(0.018);
    const atSeam = bodiceSurface(2 * Math.PI, 0.6),
      front = bodiceSurface(0, 0.6);
    expect(atSeam.distanceTo(front)).toBeLessThan(1e-8);
  });
  it('keeps eased cloth outside the complete torso around the entire garment', () => {
    for (let ring = 0; ring <= 32; ring++)
      for (let column = 0; column < 96; column++) {
        const phi = (column / 96) * Math.PI * 2;
        const cloth = bodiceSurface(phi, ring / 32);
        const skin = bodySurface(phi, cloth.y);
        const clearance = (cloth.x - skin.x) * Math.sin(phi) + (cloth.z - skin.z) * Math.cos(phi);
        expect(clearance).toBeGreaterThan(0.0044);
      }
  });
  it('joins the bodice and skirt at the same waist ring around the entire body', () => {
    for (let column = 0; column <= SKIRT_COLUMNS * 2; column++) {
      const phi = (column / (SKIRT_COLUMNS * 2)) * Math.PI * 2;
      expect(bodiceSurface(phi, 0).distanceTo(skirtSurface(phi, 0))).toBeLessThan(1e-10);
    }
  });
  it.each([
    { label: 'stationary settling', moving: false },
    { label: 'continuous translation and rotation', moving: true },
  ])('keeps $label equivalent at 30, 60 and 120 Hz', ({ moving }) => {
    const simulate = (fps: number) => {
      const cloth = create();
      const anchor = new THREE.Matrix4();
      cloth.advance(0, anchor, []);
      for (let frame = 1; frame <= fps * 2; frame++) {
        if (moving) {
          const seconds = frame / fps;
          anchor.makeRotationY(0.12 * Math.sin(seconds * 1.3));
          anchor.setPosition(0.025 * Math.sin(seconds * 2), 0.004 * Math.sin(seconds * 1.4), 0);
        }
        cloth.advance(1 / fps, anchor, []);
      }
      return cloth.position;
    };
    const reference = simulate(120);
    for (const fps of [30, 60]) {
      const positions = simulate(fps);
      let largestDifference = 0;
      for (let i = 0; i < positions.length; i++)
        largestDifference = Math.max(largestDifference, Math.abs(positions[i] - reference[i]));
      // Nonlinear input sampled at different display rates can differ slightly;
      // allow 0.1 mm for motion while identical stationary input stays exact.
      expect(largestDifference).toBeLessThan(moving ? 0.0001 : 1e-10);
    }
  });
  it('keeps the waist attached even before a complete physics step has elapsed', () => {
    const cloth = create();
    const anchor = new THREE.Matrix4();
    cloth.advance(0, anchor, []);
    anchor.makeRotationY(0.08).setPosition(0.012, 0.003, 0);
    cloth.advance(1 / 240, anchor, []);
    const actual = new THREE.Vector3();
    for (let column = 0; column < SKIRT_COLUMNS; column++) {
      const expected = skirtSurface((column / SKIRT_COLUMNS) * Math.PI * 2, 0).applyMatrix4(anchor);
      expect(actual.fromArray(cloth.position, column * 3).distanceTo(expected)).toBeLessThan(1e-10);
    }
  });
  it('keeps the waist pinned, responds with inertia and remains finite after repeated movement', () => {
    const cloth = create(),
      matrix = new THREE.Matrix4();
    cloth.advance(1 / 60, matrix, []);
    for (let i = 0; i < 100; i++) cloth.advance(1 / 60, matrix, []);
    const before = cloth.position.slice();
    matrix.makeTranslation(0.045, 0, 0);
    cloth.advance(1 / 120, matrix, []);
    expect(cloth.position[0] - before[0]).toBeCloseTo(0.045, 6);
    const hem = (SKIRT_ROWS - 1) * SKIRT_COLUMNS * 3;
    expect(cloth.position[hem] - before[hem]).toBeLessThan(0.035);
    for (let i = 0; i < 360; i++) {
      matrix.makeRotationY(Math.sin(i * 0.04) * 0.22);
      matrix.setPosition(Math.sin(i * 0.06) * 0.035, 0, 0);
      cloth.advance(1 / 60, matrix, []);
    }
    expect(Array.from(cloth.position).every(Number.isFinite)).toBe(true);
    const hemY = cloth.position[hem + 1];
    expect(hemY).toBeGreaterThan(0.55);
    expect(hemY).toBeLessThan(0.8);
  });
  it('wraps the back seam, pauses exactly and resets teleports without explosive velocity', () => {
    const cloth = create(),
      matrix = new THREE.Matrix4();
    cloth.advance(1 / 60, matrix, []);
    const a = cloth.sample(0, 0.7, new THREE.Vector3()),
      b = cloth.sample(1, 0.7, new THREE.Vector3());
    expect(a.distanceTo(b)).toBeLessThan(1e-10);
    const before = Array.from(cloth.position);
    cloth.advance(0, matrix, []);
    expect(Array.from(cloth.position)).toEqual(before);
    matrix.makeTranslation(5, 0, 0);
    cloth.advance(1 / 120, matrix, []);
    expect(cloth.position[0]).toBeCloseTo(5, 6);
    expect(Math.max(...cloth.position.filter((_, i) => i % 3 === 0))).toBeLessThan(5.3);
  });
  it('preserves settled folds and moves the waist with a manual pose while paused', () => {
    const cloth = create();
    const beforeAnchor = new THREE.Matrix4().makeRotationY(0.12).setPosition(0.03, 0, 0.02);
    for (let frame = 0; frame < 60; frame++) cloth.advance(1 / 60, beforeAnchor, []);
    const before = cloth.position.slice();
    const materialPoints = [
      [0, 0],
      [0.14, 0.33],
      [0.5, 0.73],
      [0.91, 1],
    ];
    const samples = materialPoints.map(([u, v]) => cloth.sample(u, v, new THREE.Vector3()));
    const afterAnchor = new THREE.Matrix4()
      .makeRotationFromEuler(new THREE.Euler(0.04, -0.3, 0.1))
      .setPosition(-0.12, 0.02, 0.04);
    const rebase = afterAnchor.clone().multiply(beforeAnchor.clone().invert());
    cloth.advance(0, afterAnchor, []);
    const actual = new THREE.Vector3();
    for (let i = 0; i < before.length; i += 3) {
      const expected = new THREE.Vector3().fromArray(before, i).applyMatrix4(rebase);
      expect(actual.fromArray(cloth.position, i).distanceTo(expected)).toBeLessThan(1e-10);
    }
    for (let column = 0; column < SKIRT_COLUMNS; column++) {
      const expected = skirtSurface((column / SKIRT_COLUMNS) * Math.PI * 2, 0).applyMatrix4(afterAnchor);
      expect(actual.fromArray(cloth.position, column * 3).distanceTo(expected)).toBeLessThan(1e-10);
    }
    materialPoints.forEach(([u, v], i) => {
      expect(cloth.sample(u, v, actual).distanceTo(samples[i])).toBeLessThan(1e-10);
    });
    const paused = cloth.position.slice();
    for (let frame = 0; frame < 10; frame++) cloth.advance(0, afterAnchor, []);
    expect(cloth.position).toEqual(paused);
  });
  it('continues settling after each teleport instead of resetting on every frame', () => {
    const cloth = create();
    const matrix = new THREE.Matrix4();
    for (let frame = 0; frame < 30; frame++) cloth.advance(1 / 60, matrix, []);
    for (const x of [5, -3, 7]) {
      matrix.makeTranslation(x, 0, 0);
      cloth.advance(1 / 60, matrix, []);
      const immediatelyAfterTeleport = cloth.position.slice();
      const fresh = create();
      fresh.advance(1 / 60, matrix, []);
      for (let frame = 0; frame < 30; frame++) {
        cloth.advance(1 / 60, matrix, []);
        fresh.advance(1 / 60, matrix, []);
      }
      let settlingDistance = 0;
      for (let i = 0; i < cloth.position.length; i++) {
        expect(Math.abs(cloth.position[i] - fresh.position[i])).toBeLessThan(1e-10);
        settlingDistance = Math.max(settlingDistance, Math.abs(cloth.position[i] - immediatelyAfterTeleport[i]));
      }
      expect(settlingDistance).toBeGreaterThan(0.005);
      expect(cloth.position[0]).toBeCloseTo(x, 8);
    }
  });
  it('projects freely moving cloth out of a leg capsule while preserving waist anchors', () => {
    const cloth = create(),
      matrix = new THREE.Matrix4();
    const capsule = { a: new THREE.Vector3(0.12, 0.75, 0.05), b: new THREE.Vector3(0.12, 0.55, 0.05), radius: 0.09 };
    for (let i = 0; i < 30; i++) cloth.advance(1 / 60, matrix, [capsule]);
    let closest = Infinity;
    for (let id = SKIRT_COLUMNS; id < SKIRT_COLUMNS * SKIRT_ROWS; id++) {
      const p = new THREE.Vector3().fromArray(cloth.position, id * 3);
      const y = THREE.MathUtils.clamp(p.y, 0.55, 0.75);
      closest = Math.min(closest, p.distanceTo(new THREE.Vector3(0.12, y, 0.05)));
    }
    expect(closest).toBeGreaterThanOrEqual(0.08999);
    expect(cloth.position[1]).toBeCloseTo(0.948, 8);
  });
});
