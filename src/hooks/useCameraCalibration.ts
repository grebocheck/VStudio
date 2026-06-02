import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { CameraCalibrationProfile, NamedCameraCalibrationProfile, RigParams } from '../types';
import {
  createCameraCalibrationProfileId,
  DEFAULT_CAMERA_CALIBRATION,
  sanitizeCameraCalibration,
  sanitizeCameraCalibrationProfileName,
  sanitizeNamedCameraCalibrationProfiles,
  withNeutralCameraOffset,
} from '../lib/cameraCalibration';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../lib/storage';

interface CameraCalibrationApi {
  profile: CameraCalibrationProfile;
  profiles: NamedCameraCalibrationProfile[];
  activeProfileId: string | null;
  setProfile: React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>;
  resetProfile: () => void;
  calibrateNeutral: (rig: Pick<RigParams, 'angleX' | 'angleY' | 'angleZ'>) => void;
  applyProfile: (id: string) => void;
  saveProfile: (name: string) => void;
  updateActiveProfile: () => void;
  deleteProfile: (id: string) => void;
}

export function useCameraCalibration(): CameraCalibrationApi {
  const [profile, setProfileState] = useState<CameraCalibrationProfile>(() =>
    sanitizeCameraCalibration(loadJSON<unknown>(STORAGE_KEYS.cameraCalibration, DEFAULT_CAMERA_CALIBRATION)),
  );
  const [profiles, setProfiles] = useState<NamedCameraCalibrationProfile[]>(() =>
    sanitizeNamedCameraCalibrationProfiles(loadJSON<unknown>(STORAGE_KEYS.cameraCalibrationProfiles, [])),
  );
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    const stored = loadJSON<unknown>(STORAGE_KEYS.activeCameraCalibrationProfile, null);
    return typeof stored === 'string' && stored ? stored : null;
  });
  const effectiveActiveProfileId =
    activeProfileId && profiles.some((saved) => saved.id === activeProfileId) ? activeProfileId : null;

  useEffect(() => {
    saveJSON(STORAGE_KEYS.cameraCalibration, profile);
  }, [profile]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.cameraCalibrationProfiles, profiles);
  }, [profiles]);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.activeCameraCalibrationProfile, effectiveActiveProfileId);
  }, [effectiveActiveProfileId]);

  const setProfile = useCallback<React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>>((next) => {
    setProfileState((prev) => sanitizeCameraCalibration(typeof next === 'function' ? next(prev) : next));
  }, []);

  const resetProfile = useCallback(() => {
    setProfileState(DEFAULT_CAMERA_CALIBRATION);
    setActiveProfileId(null);
  }, []);

  const calibrateNeutral = useCallback((rig: Pick<RigParams, 'angleX' | 'angleY' | 'angleZ'>) => {
    setProfileState((prev) => withNeutralCameraOffset(prev, rig));
  }, []);

  const applyProfile = useCallback(
    (id: string) => {
      const saved = profiles.find((item) => item.id === id);
      if (!saved) return;
      setProfileState(saved.profile);
      setActiveProfileId(saved.id);
    },
    [profiles],
  );

  const saveProfile = useCallback(
    (name: string) => {
      const saved: NamedCameraCalibrationProfile = {
        id: createCameraCalibrationProfileId(),
        name: sanitizeCameraCalibrationProfileName(name),
        profile,
      };
      setProfiles((prev) => sanitizeNamedCameraCalibrationProfiles([saved, ...prev]));
      setActiveProfileId(saved.id);
    },
    [profile],
  );

  const updateActiveProfile = useCallback(() => {
    if (!effectiveActiveProfileId) return;
    setProfiles((prev) =>
      prev.map((saved) =>
        saved.id === effectiveActiveProfileId ? { ...saved, profile: sanitizeCameraCalibration(profile) } : saved,
      ),
    );
  }, [effectiveActiveProfileId, profile]);

  const deleteProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => prev.filter((saved) => saved.id !== id));
      if (activeProfileId === id) setActiveProfileId(null);
    },
    [activeProfileId],
  );

  return {
    profile,
    profiles,
    activeProfileId: effectiveActiveProfileId,
    setProfile,
    resetProfile,
    calibrateNeutral,
    applyProfile,
    saveProfile,
    updateActiveProfile,
    deleteProfile,
  };
}
