import React, { useCallback, useRef, useState } from 'react';
import { INITIAL_RIG, PRESETS } from '../presets';
import { AvatarConfig, CameraCalibrationProfile, PresetAvatar, RigParams, SidebarTab, TrackingMode } from '../types';
import type { FaceTracking } from '../hooks/useFaceTracking';
import type { MicRefs } from '../hooks/useMicrophone';
import { useAiGenerate } from '../hooks/useAiGenerate';
import { useAnimationEngine } from '../hooks/useAnimationEngine';
import { useEmotes } from '../hooks/useEmotes';
import { useOverlayBroadcast } from '../hooks/useOverlaySync';
import { applyAvatarFrameTransforms } from '../lib/avatarFrame';
import { CenterStage } from './CenterStage';
import { RightSidebar } from './RightSidebar';

interface LiveRigWorkspaceProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  mergeIntoConfig: (partial: Partial<AvatarConfig>) => void;
  activeSidebarTab: SidebarTab;
  trackingMode: TrackingMode;
  setTrackingMode: (mode: TrackingMode) => void;
  micActive: boolean;
  setMicActive: (active: boolean) => void;
  onScreenBuster: boolean;
  setScreenBuster: (active: boolean) => void;
  cameraCalibration: CameraCalibrationProfile;
  setCameraCalibration: React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>;
  calibrateCameraNeutral: (rig: Pick<RigParams, 'angleX' | 'angleY' | 'angleZ'>) => void;
  onResetCameraCalibration: () => void;
  mic: MicRefs;
  face: FaceTracking;
  customPresets: PresetAvatar[];
  activePresetKey: string | null;
  onApplyPreset: (preset: PresetAvatar) => void;
  onDeleteCustomPreset: (id: string) => void;
  fps?: number | null;
}

/**
 * Owns the high-frequency animation state so live rig frames do not re-render
 * the app shell, toolbar, footer, or studio controls.
 */
export const LiveRigWorkspace: React.FC<LiveRigWorkspaceProps> = ({
  config,
  setConfig,
  mergeIntoConfig,
  activeSidebarTab,
  trackingMode,
  setTrackingMode,
  micActive,
  setMicActive,
  onScreenBuster,
  setScreenBuster,
  cameraCalibration,
  setCameraCalibration,
  calibrateCameraNeutral,
  onResetCameraCalibration,
  mic,
  face,
  customPresets,
  activePresetKey,
  onApplyPreset,
  onDeleteCustomPreset,
  fps = null,
}) => {
  const [rig, setRig] = useState<RigParams>(INITIAL_RIG);
  const rigRef = useRef(rig);
  const avatarSvgRef = useRef<SVGSVGElement | null>(null);
  const applyFrame = useCallback(
    (nextRig: RigParams) => {
      if (avatarSvgRef.current) applyAvatarFrameTransforms(avatarSvgRef.current, config, nextRig);
    },
    [config],
  );
  const commitRig = useCallback<React.Dispatch<React.SetStateAction<RigParams>>>(
    (next) => {
      const updated = typeof next === 'function' ? next(rigRef.current) : next;
      rigRef.current = updated;
      applyFrame(updated);
      setRig(updated);
    },
    [applyFrame],
  );
  const emotes = useEmotes();
  const ai = useAiGenerate({ mergeIntoConfig, setRig: commitRig });

  useAnimationEngine({
    trackingMode,
    micActive,
    mic,
    face,
    cameraCalibration,
    emoteRef: emotes.emoteRef,
    rigRef,
    onFrame: applyFrame,
    setRig,
  });

  const overlayCount = useOverlayBroadcast(config, rig);
  const handleRigChange = useCallback(
    (updates: Partial<RigParams>) => {
      commitRig((previous) => ({ ...previous, ...updates }));
    },
    [commitRig],
  );
  const handleResetRig = useCallback(() => commitRig(INITIAL_RIG), [commitRig]);
  const handleCalibrateCameraNeutral = useCallback(() => {
    calibrateCameraNeutral(rigRef.current);
  }, [calibrateCameraNeutral]);

  return (
    <>
      <CenterStage
        config={config}
        setConfig={setConfig}
        rig={rig}
        onScreenBuster={onScreenBuster}
        trackingMode={trackingMode}
        activePresetKey={activePresetKey}
        activeEmote={emotes.activeEmote}
        onEmote={emotes.triggerEmote}
        avatarSvgRef={avatarSvgRef}
        fps={fps}
      />

      <RightSidebar
        activeSidebarTab={activeSidebarTab}
        config={config}
        setConfig={setConfig}
        rig={rig}
        handleRigChange={handleRigChange}
        handleResetRig={handleResetRig}
        trackingMode={trackingMode}
        setTrackingMode={setTrackingMode}
        micActive={micActive}
        setMicActive={setMicActive}
        onScreenBuster={onScreenBuster}
        setScreenBuster={setScreenBuster}
        cameraDevices={face.devices}
        cameraCalibration={cameraCalibration}
        setCameraCalibration={setCameraCalibration}
        refreshCameraDevices={face.refreshDevices}
        onCalibrateCameraNeutral={handleCalibrateCameraNeutral}
        onResetCameraCalibration={onResetCameraCalibration}
        avatarSvgRef={avatarSvgRef}
        aiPrompt={ai.prompt}
        setAiPrompt={ai.setPrompt}
        aiGenerating={ai.generating}
        aiError={ai.error}
        handleAiGenerate={ai.generate}
        customPresets={customPresets}
        PRESETS={PRESETS}
        activePresetKey={activePresetKey}
        onApplyPreset={onApplyPreset}
        onDeleteCustomPreset={onDeleteCustomPreset}
        overlayCount={overlayCount}
      />
    </>
  );
};
