import { describe, expect, it } from 'vitest';
import { advanceHairPhysics, INITIAL_HAIR_PHYSICS } from './hairPhysics';

describe('advanceHairPhysics', () => {
  it('adds an inertial impulse opposite a sudden horizontal head turn', () => {
    const next = advanceHairPhysics(INITIAL_HAIR_PHYSICS, {
      angleX: 10,
      angleY: 0,
      angleZ: 0,
    });

    expect(next.swayX).toBeLessThan(0);
    expect(next.velocityX).toBeLessThan(0);
    expect(next.previousAngleX).toBe(10);
  });

  it('adds positive vertical bounce for vertical motion in either direction', () => {
    const lookingUp = advanceHairPhysics(INITIAL_HAIR_PHYSICS, {
      angleX: 0,
      angleY: 8,
      angleZ: 0,
    });
    const lookingDown = advanceHairPhysics(INITIAL_HAIR_PHYSICS, {
      angleX: 0,
      angleY: -8,
      angleZ: 0,
    });

    expect(lookingUp.swayY).toBeGreaterThan(0);
    expect(lookingDown.swayY).toBe(lookingUp.swayY);
  });

  it('damps motion over repeated neutral frames', () => {
    let state = advanceHairPhysics(INITIAL_HAIR_PHYSICS, {
      angleX: 12,
      angleY: 6,
      angleZ: 0,
    });
    const initialMagnitude = Math.abs(state.swayX) + Math.abs(state.swayY);

    for (let frame = 0; frame < 120; frame += 1) {
      state = advanceHairPhysics(state, { angleX: 0, angleY: 0, angleZ: 0 });
    }

    expect(Math.abs(state.swayX) + Math.abs(state.swayY)).toBeLessThan(initialMagnitude);
    expect(Math.abs(state.swayX)).toBeLessThan(0.01);
    expect(Math.abs(state.swayY)).toBeLessThan(0.01);
  });
});
