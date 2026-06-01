import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CAMERA_CALIBRATION,
  cameraResponseFromSmoothing,
  sanitizeCameraCalibration,
  withNeutralCameraOffset,
} from './cameraCalibration';

describe('camera calibration profile', () => {
  it('returns defaults for invalid profile payloads', () => {
    expect(sanitizeCameraCalibration(null)).toEqual(DEFAULT_CAMERA_CALIBRATION);
    expect(sanitizeCameraCalibration('broken')).toEqual(DEFAULT_CAMERA_CALIBRATION);
  });

  it('clamps numeric values and preserves a selected device id', () => {
    const profile = sanitizeCameraCalibration({
      deviceId: 'camera-1',
      headSensitivity: 20,
      expressionSensitivity: 0.1,
      smoothing: 999,
      yawOffset: -80,
      pitchOffset: 80,
      rollOffset: Number.NaN,
    });

    expect(profile.deviceId).toBe('camera-1');
    expect(profile.headSensitivity).toBe(1.8);
    expect(profile.expressionSensitivity).toBe(0.7);
    expect(profile.smoothing).toBe(100);
    expect(profile.yawOffset).toBe(-30);
    expect(profile.pitchOffset).toBe(20);
    expect(profile.rollOffset).toBe(0);
  });

  it('maps higher smoothing to a slower camera response', () => {
    expect(cameraResponseFromSmoothing(0)).toBeGreaterThan(cameraResponseFromSmoothing(100));
  });

  it('captures neutral offsets from the current rendered rig pose', () => {
    const profile = withNeutralCameraOffset(DEFAULT_CAMERA_CALIBRATION, {
      angleX: 8,
      angleY: -3,
      angleZ: 2,
    });

    expect(profile.yawOffset).toBe(8);
    expect(profile.pitchOffset).toBe(-3);
    expect(profile.rollOffset).toBe(2);
  });
});
