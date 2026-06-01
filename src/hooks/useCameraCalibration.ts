import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { CameraCalibrationProfile, RigParams } from '../types';
import {
  DEFAULT_CAMERA_CALIBRATION,
  sanitizeCameraCalibration,
  withNeutralCameraOffset,
} from '../lib/cameraCalibration';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../lib/storage';

interface CameraCalibrationApi {
  profile: CameraCalibrationProfile;
  setProfile: React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>;
  resetProfile: () => void;
  calibrateNeutral: (rig: Pick<RigParams, 'angleX' | 'angleY' | 'angleZ'>) => void;
}

export function useCameraCalibration(): CameraCalibrationApi {
  const [profile, setProfileState] = useState<CameraCalibrationProfile>(() =>
    sanitizeCameraCalibration(loadJSON<unknown>(STORAGE_KEYS.cameraCalibration, DEFAULT_CAMERA_CALIBRATION)),
  );

  useEffect(() => {
    saveJSON(STORAGE_KEYS.cameraCalibration, profile);
  }, [profile]);

  const setProfile = useCallback<React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>>((next) => {
    setProfileState((prev) => sanitizeCameraCalibration(typeof next === 'function' ? next(prev) : next));
  }, []);

  const resetProfile = useCallback(() => {
    setProfileState(DEFAULT_CAMERA_CALIBRATION);
  }, []);

  const calibrateNeutral = useCallback((rig: Pick<RigParams, 'angleX' | 'angleY' | 'angleZ'>) => {
    setProfileState((prev) => withNeutralCameraOffset(prev, rig));
  }, []);

  return { profile, setProfile, resetProfile, calibrateNeutral };
}
