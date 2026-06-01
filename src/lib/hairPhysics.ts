import { HAIR_PHYSICS } from '../engine/constants';

export interface HairPhysicsState {
  swayX: number;
  velocityX: number;
  swayY: number;
  velocityY: number;
  previousAngleX: number;
  previousAngleY: number;
}

export interface HairPhysicsInput {
  angleX: number;
  angleY: number;
  angleZ: number;
}

export const INITIAL_HAIR_PHYSICS: HairPhysicsState = {
  swayX: 0,
  velocityX: 0,
  swayY: 0,
  velocityY: 0,
  previousAngleX: 0,
  previousAngleY: 0,
};

/**
 * Advance one spring-mass frame for secondary hair motion. Kept pure so the
 * animation engine can remain lightweight while the tuning stays testable.
 */
export function advanceHairPhysics(state: HairPhysicsState, input: HairPhysicsInput): HairPhysicsState {
  const deltaX = input.angleX - state.previousAngleX;
  const deltaY = input.angleY - state.previousAngleY;

  let velocityX = state.velocityX - deltaX * HAIR_PHYSICS.IMPULSE_X;
  let velocityY = state.velocityY + Math.abs(deltaY) * HAIR_PHYSICS.IMPULSE_Y;

  const targetSwayX = -input.angleX * HAIR_PHYSICS.TARGET_X_FROM_YAW - input.angleZ * HAIR_PHYSICS.TARGET_X_FROM_ROLL;
  const forceX = (targetSwayX - state.swayX) * HAIR_PHYSICS.STIFFNESS_X;
  velocityX = (velocityX + forceX) * HAIR_PHYSICS.DAMPING_X;
  const swayX = state.swayX + velocityX;

  const targetSwayY = Math.abs(input.angleY) * HAIR_PHYSICS.TARGET_Y_FROM_PITCH;
  const forceY = (targetSwayY - state.swayY) * HAIR_PHYSICS.STIFFNESS_Y;
  velocityY = (velocityY + forceY) * HAIR_PHYSICS.DAMPING_Y;
  const swayY = state.swayY + velocityY;

  return {
    swayX,
    velocityX,
    swayY,
    velocityY,
    previousAngleX: input.angleX,
    previousAngleY: input.angleY,
  };
}
