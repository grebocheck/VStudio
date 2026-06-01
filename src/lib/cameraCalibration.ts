import { CameraCalibrationProfile, RigParams } from '../types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finiteNumber = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;

export const DEFAULT_CAMERA_CALIBRATION: CameraCalibrationProfile = {
  deviceId: '',
  headSensitivity: 1,
  expressionSensitivity: 1,
  smoothing: 55,
  yawOffset: 0,
  pitchOffset: 0,
  rollOffset: 0,
};

export function sanitizeCameraCalibration(input: unknown): CameraCalibrationProfile {
  if (!input || typeof input !== 'object') return DEFAULT_CAMERA_CALIBRATION;

  const raw = input as Partial<Record<keyof CameraCalibrationProfile, unknown>>;

  return {
    deviceId: typeof raw.deviceId === 'string' ? raw.deviceId.slice(0, 220) : DEFAULT_CAMERA_CALIBRATION.deviceId,
    headSensitivity: finiteNumber(raw.headSensitivity, DEFAULT_CAMERA_CALIBRATION.headSensitivity, 0.5, 1.8),
    expressionSensitivity: finiteNumber(raw.expressionSensitivity, DEFAULT_CAMERA_CALIBRATION.expressionSensitivity, 0.7, 1.8),
    smoothing: finiteNumber(raw.smoothing, DEFAULT_CAMERA_CALIBRATION.smoothing, 0, 100),
    yawOffset: finiteNumber(raw.yawOffset, DEFAULT_CAMERA_CALIBRATION.yawOffset, -30, 30),
    pitchOffset: finiteNumber(raw.pitchOffset, DEFAULT_CAMERA_CALIBRATION.pitchOffset, -20, 20),
    rollOffset: finiteNumber(raw.rollOffset, DEFAULT_CAMERA_CALIBRATION.rollOffset, -15, 15),
  };
}

export function cameraResponseFromSmoothing(smoothing: number): number {
  const safeSmoothing = finiteNumber(smoothing, DEFAULT_CAMERA_CALIBRATION.smoothing, 0, 100);
  return clamp(0.42 - safeSmoothing * 0.0034, 0.08, 0.42);
}

export function expressionResponseFromSmoothing(smoothing: number): number {
  return clamp(cameraResponseFromSmoothing(smoothing) * 1.35, 0.12, 0.55);
}

export function withNeutralCameraOffset(
  profile: CameraCalibrationProfile,
  rig: Pick<RigParams, 'angleX' | 'angleY' | 'angleZ'>,
): CameraCalibrationProfile {
  return sanitizeCameraCalibration({
    ...profile,
    yawOffset: profile.yawOffset + rig.angleX,
    pitchOffset: profile.pitchOffset + rig.angleY,
    rollOffset: profile.rollOffset + rig.angleZ,
  });
}
