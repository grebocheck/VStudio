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

  let velocityX = state.velocityX - deltaX * 0.38;
  let velocityY = state.velocityY + Math.abs(deltaY) * 0.25;

  const targetSwayX = -input.angleX * 0.7 - input.angleZ * 0.6;
  const forceX = (targetSwayX - state.swayX) * 0.16;
  velocityX = (velocityX + forceX) * 0.82;
  const swayX = state.swayX + velocityX;

  const targetSwayY = Math.abs(input.angleY) * 0.35;
  const forceY = (targetSwayY - state.swayY) * 0.2;
  velocityY = (velocityY + forceY) * 0.79;
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
