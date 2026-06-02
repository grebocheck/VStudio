import React from 'react';
import {
  AvatarConfig,
  CameraCalibrationProfile,
  NamedCameraCalibrationProfile,
  RigParams,
  PresetAvatar,
  TrackingMode,
  SidebarTab,
} from '../types';
import { Palette } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { PresetsTab } from './sidebar/PresetsTab';
import { HairTab } from './sidebar/HairTab';
import { FaceTab } from './sidebar/FaceTab';
import { ClothesTab } from './sidebar/ClothesTab';
import { MetadataTab } from './sidebar/MetadataTab';
import { RiggingTab } from './sidebar/RiggingTab';
import { AiTab } from './sidebar/AiTab';
import { ObsTab } from './sidebar/ObsTab';

export interface RightSidebarProps {
  activeSidebarTab: SidebarTab;
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
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
  avatarSvgRef: React.RefObject<SVGSVGElement | null>;
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  aiGenerating: boolean;
  aiError: string | null;
  handleAiGenerate: () => void;
  customPresets: PresetAvatar[];
  PRESETS: PresetAvatar[];
  activePresetKey: string | null;
  onApplyPreset: (preset: PresetAvatar) => void;
  onDeleteCustomPreset: (id: string) => void;
  overlayCount: number;
}

const RightSidebarComponent: React.FC<RightSidebarProps> = (props) => {
  const { activeSidebarTab, config } = props;
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';

  return (
    <aside
      className={`w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col justify-between overflow-y-auto ${
        theme === 'dark' ? 'border-white/10 bg-[#0f0f12]/95 text-white' : 'border-slate-200 bg-white text-slate-800'
      }`}
      id="right-sidebar"
      aria-label={isEn ? 'Avatar editor' : 'Редактор аватара'}
    >
      {/* Header of Active Editor Section */}
      <div
        className={`p-4 border-b flex items-center space-x-2.5 shrink-0 ${
          theme === 'dark' ? 'border-white/10 bg-[#121217]' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <Palette className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
        <div className="text-left">
          <h3
            className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          >
            {t.rightSidebar.params} {t.leftSidebar.tabs[activeSidebarTab]}
          </h3>
          <p className="text-[9px] text-slate-500 dark:text-white/50">{t.rightSidebar.activeSec}</p>
        </div>
      </div>

      {/* Form Editing options container */}
      <div className="p-5 flex-grow space-y-5 text-left leading-relaxed">
        {activeSidebarTab === 'presets' && (
          <PresetsTab
            customPresets={props.customPresets}
            PRESETS={props.PRESETS}
            activePresetKey={props.activePresetKey}
            onApplyPreset={props.onApplyPreset}
            onDeleteCustomPreset={props.onDeleteCustomPreset}
          />
        )}
        {activeSidebarTab === 'hair' && <HairTab config={config} setConfig={props.setConfig} />}
        {activeSidebarTab === 'face' && <FaceTab config={config} setConfig={props.setConfig} />}
        {activeSidebarTab === 'clothes' && <ClothesTab config={config} setConfig={props.setConfig} />}
        {activeSidebarTab === 'metadata' && <MetadataTab config={config} setConfig={props.setConfig} />}
        {activeSidebarTab === 'rigging' && (
          <RiggingTab
            rig={props.rig}
            handleRigChange={props.handleRigChange}
            handleResetRig={props.handleResetRig}
            trackingMode={props.trackingMode}
            setTrackingMode={props.setTrackingMode}
            micActive={props.micActive}
            setMicActive={props.setMicActive}
            onScreenBuster={props.onScreenBuster}
            setScreenBuster={props.setScreenBuster}
            cameraDevices={props.cameraDevices}
            cameraCalibration={props.cameraCalibration}
            cameraCalibrationProfiles={props.cameraCalibrationProfiles}
            activeCameraCalibrationProfileId={props.activeCameraCalibrationProfileId}
            setCameraCalibration={props.setCameraCalibration}
            refreshCameraDevices={props.refreshCameraDevices}
            onCalibrateCameraNeutral={props.onCalibrateCameraNeutral}
            onResetCameraCalibration={props.onResetCameraCalibration}
            onApplyCameraCalibrationProfile={props.onApplyCameraCalibrationProfile}
            onSaveCameraCalibrationProfile={props.onSaveCameraCalibrationProfile}
            onUpdateCameraCalibrationProfile={props.onUpdateCameraCalibrationProfile}
            onDeleteCameraCalibrationProfile={props.onDeleteCameraCalibrationProfile}
          />
        )}
        {activeSidebarTab === 'ai' && (
          <AiTab
            aiPrompt={props.aiPrompt}
            setAiPrompt={props.setAiPrompt}
            aiGenerating={props.aiGenerating}
            aiError={props.aiError}
            handleAiGenerate={props.handleAiGenerate}
          />
        )}
        {activeSidebarTab === 'obs' && (
          <ObsTab
            config={config}
            setConfig={props.setConfig}
            avatarSvgRef={props.avatarSvgRef}
            overlayCount={props.overlayCount}
          />
        )}
      </div>

      {/* Sidebar Footer detailing the calibration ratio values in real-time */}
      <div
        className={`p-4 border-t font-mono text-[10px] flex items-center justify-between shrink-0 ${
          theme === 'dark'
            ? 'border-white/10 bg-[#0c0c10] text-[#d1d1d1]/40'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        <span>
          {t.rightSidebar.footerLabel}: {config.name || (isEn ? 'Personal' : 'Особистий')}
        </span>
        <span>{t.rightSidebar.footerTotal}</span>
      </div>
    </aside>
  );
};

/**
 * Live rig frames only affect the manual rigging tab. Keep the heavier editor
 * panels asleep while the avatar continues animating in the center stage.
 */
export const areRightSidebarPropsEqual = (previous: RightSidebarProps, next: RightSidebarProps) => {
  const riggingVisible = previous.activeSidebarTab === 'rigging' || next.activeSidebarTab === 'rigging';

  for (const key of Object.keys(previous) as Array<keyof RightSidebarProps>) {
    if (key === 'rig' && !riggingVisible) continue;
    if (!Object.is(previous[key], next[key])) return false;
  }

  return true;
};

export const RightSidebar = React.memo(RightSidebarComponent, areRightSidebarPropsEqual);
