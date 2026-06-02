import React from 'react';
import { CameraCalibrationProfile, NamedCameraCalibrationProfile, RigParams, TrackingMode } from '../../types';
import { RiggingSliderPanel } from '../RiggingSliderPanel';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface RiggingTabProps {
  rig: RigParams;
  handleRigChange: (updates: Partial<RigParams>) => void;
  handleResetRig: () => void;
  trackingMode: TrackingMode;
  setTrackingMode: (mode: TrackingMode) => void;
  micActive: boolean;
  setMicActive: (active: boolean) => void;
  onScreenBuster: boolean;
  setScreenBuster: (val: boolean) => void;
  cameraDevices: MediaDeviceInfo[];
  cameraCalibration: CameraCalibrationProfile;
  cameraCalibrationProfiles: NamedCameraCalibrationProfile[];
  activeCameraCalibrationProfileId: string | null;
  setCameraCalibration: React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>;
  refreshCameraDevices: () => void | Promise<void>;
  onCalibrateCameraNeutral: () => void;
  onResetCameraCalibration: () => void;
  onApplyCameraCalibrationProfile: (id: string) => void;
  onSaveCameraCalibrationProfile: (name: string) => void;
  onUpdateCameraCalibrationProfile: () => void;
  onDeleteCameraCalibrationProfile: (id: string) => void;
}

export const RiggingTab: React.FC<RiggingTabProps> = ({
  rig,
  handleRigChange,
  handleResetRig,
  trackingMode,
  setTrackingMode,
  micActive,
  setMicActive,
  onScreenBuster,
  setScreenBuster,
  cameraDevices,
  cameraCalibration,
  cameraCalibrationProfiles,
  activeCameraCalibrationProfileId,
  setCameraCalibration,
  refreshCameraDevices,
  onCalibrateCameraNeutral,
  onResetCameraCalibration,
  onApplyCameraCalibrationProfile,
  onSaveCameraCalibrationProfile,
  onUpdateCameraCalibrationProfile,
  onDeleteCameraCalibrationProfile,
}) => {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h4
          className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          {t.rightSidebar.riggingTitle}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">{t.rightSidebar.riggingSub}</p>
      </div>
      <RiggingSliderPanel
        rig={rig}
        onChange={handleRigChange}
        onReset={handleResetRig}
        trackingMode={trackingMode}
        setTrackingMode={setTrackingMode}
        micSupported={true}
        micActive={micActive}
        toggleMic={() => setMicActive(!micActive)}
        onScreenBuster={onScreenBuster}
        setScreenBuster={setScreenBuster}
        cameraDevices={cameraDevices}
        cameraCalibration={cameraCalibration}
        cameraCalibrationProfiles={cameraCalibrationProfiles}
        activeCameraCalibrationProfileId={activeCameraCalibrationProfileId}
        setCameraCalibration={setCameraCalibration}
        refreshCameraDevices={refreshCameraDevices}
        onCalibrateCameraNeutral={onCalibrateCameraNeutral}
        onResetCameraCalibration={onResetCameraCalibration}
        onApplyCameraCalibrationProfile={onApplyCameraCalibrationProfile}
        onSaveCameraCalibrationProfile={onSaveCameraCalibrationProfile}
        onUpdateCameraCalibrationProfile={onUpdateCameraCalibrationProfile}
        onDeleteCameraCalibrationProfile={onDeleteCameraCalibrationProfile}
      />
    </div>
  );
};
