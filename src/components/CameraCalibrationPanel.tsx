import React from 'react';
import { Camera, RefreshCw, RotateCcw, SlidersHorizontal, Target, Video } from 'lucide-react';
import { CameraCalibrationProfile, TrackingMode } from '../types';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

interface CameraCalibrationPanelProps {
  trackingMode: TrackingMode;
  setTrackingMode: (mode: TrackingMode) => void;
  devices: MediaDeviceInfo[];
  profile: CameraCalibrationProfile;
  setProfile: React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>;
  onRefreshDevices: () => void | Promise<void>;
  onCalibrateNeutral: () => void;
  onResetProfile: () => void;
}

interface SliderRowProps {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  accentColor: string;
}

const SliderRow: React.FC<SliderRowProps> = ({ label, valueLabel, min, max, value, onChange, accentColor }) => (
  <label className="block space-y-1">
    <span className="flex justify-between gap-3 text-[11px] font-mono">
      <span className="text-slate-500 dark:text-white/45 truncate">{label}</span>
      <span className="text-slate-800 dark:text-white/85 font-bold shrink-0">{valueLabel}</span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
      style={{ accentColor }}
    />
  </label>
);

export const CameraCalibrationPanel: React.FC<CameraCalibrationPanelProps> = ({
  trackingMode,
  setTrackingMode,
  devices,
  profile,
  setProfile,
  onRefreshDevices,
  onCalibrateNeutral,
  onResetProfile,
}) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const copy = t.riggingPanel.cameraCalibration;
  const isCameraActive = trackingMode === 'camera';
  const hasSavedMissingDevice = profile.deviceId && !devices.some((device) => device.deviceId === profile.deviceId);

  const stepCircle = (step: number, active = true) => (
    <span
      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${
        active
          ? 'bg-rose-500/15 border-rose-500/50 text-rose-500 dark:text-rose-300'
          : 'border-slate-300 dark:border-white/10 text-slate-400 dark:text-white/35'
      }`}
    >
      {step}
    </span>
  );

  return (
    <section
      className={`p-4 rounded border space-y-4 ${
        theme === 'dark' ? 'bg-[#0a0a0c] border-rose-500/15' : 'bg-rose-50/40 border-rose-200/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-300 tracking-widest font-mono flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{copy.title}</span>
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-white/50 mt-1 leading-relaxed">{copy.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setTrackingMode(isCameraActive ? 'auto' : 'camera')}
          aria-pressed={isCameraActive}
          className={`px-2.5 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isCameraActive
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-500 dark:text-rose-300'
              : theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>{isCameraActive ? copy.live : copy.enable}</span>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2.5">
          {stepCircle(1)}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="camera-device-select"
                className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-white/45"
              >
                {copy.device}
              </label>
              <button
                type="button"
                onClick={() => void onRefreshDevices()}
                className="text-[9px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-300 flex items-center gap-1 cursor-pointer hover:opacity-80"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{copy.refresh}</span>
              </button>
            </div>
            <select
              id="camera-device-select"
              value={profile.deviceId}
              onChange={(event) => setProfile((prev) => ({ ...prev, deviceId: event.target.value }))}
              className={`w-full text-xs rounded-sm border px-2.5 py-2 focus:outline-none focus:border-rose-500 ${
                theme === 'dark'
                  ? 'bg-[#050507] border-white/10 text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="">{copy.defaultDevice}</option>
              {hasSavedMissingDevice && <option value={profile.deviceId}>{copy.savedDeviceMissing}</option>}
              {devices.map((device, index) => (
                <option key={device.deviceId || `camera-${index}`} value={device.deviceId}>
                  {device.label || `${copy.cameraFallback} ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          {stepCircle(2)}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-white/45">
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
              <span>{copy.tuning}</span>
            </div>
            <SliderRow
              label={copy.headSensitivity}
              valueLabel={`${Math.round(profile.headSensitivity * 100)}%`}
              min={50}
              max={180}
              value={Math.round(profile.headSensitivity * 100)}
              onChange={(value) => setProfile((prev) => ({ ...prev, headSensitivity: value / 100 }))}
              accentColor="#e11d48"
            />
            <SliderRow
              label={copy.expressionSensitivity}
              valueLabel={`${Math.round(profile.expressionSensitivity * 100)}%`}
              min={70}
              max={180}
              value={Math.round(profile.expressionSensitivity * 100)}
              onChange={(value) => setProfile((prev) => ({ ...prev, expressionSensitivity: value / 100 }))}
              accentColor="#db2777"
            />
            <SliderRow
              label={copy.smoothing}
              valueLabel={`${Math.round(profile.smoothing)}%`}
              min={0}
              max={100}
              value={Math.round(profile.smoothing)}
              onChange={(value) => setProfile((prev) => ({ ...prev, smoothing: value }))}
              accentColor="#6366f1"
            />
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          {stepCircle(3, isCameraActive)}
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-white/45">
                {copy.neutralTitle}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-white/50 mt-0.5 leading-relaxed">{copy.neutralHelp}</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono text-center">
              <span className="px-1 py-1 rounded-sm bg-white/60 dark:bg-white/5 text-slate-600 dark:text-white/55">
                Yaw {Math.round(profile.yawOffset)}°
              </span>
              <span className="px-1 py-1 rounded-sm bg-white/60 dark:bg-white/5 text-slate-600 dark:text-white/55">
                Pitch {Math.round(profile.pitchOffset)}°
              </span>
              <span className="px-1 py-1 rounded-sm bg-white/60 dark:bg-white/5 text-slate-600 dark:text-white/55">
                Roll {Math.round(profile.rollOffset)}°
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCalibrateNeutral}
                disabled={!isCameraActive}
                className="px-2.5 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 disabled:bg-slate-400/40 disabled:text-white/60 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Target className="w-3.5 h-3.5" />
                <span>{copy.setNeutral}</span>
              </button>
              <button
                type="button"
                onClick={onResetProfile}
                className={`px-2.5 py-2 rounded-sm border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-white/10 text-white/70 hover:bg-white/5'
                    : 'border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{copy.reset}</span>
              </button>
            </div>
            {!isCameraActive && (
              <p className="text-[9px] text-amber-600 dark:text-amber-300 font-mono" role="status">
                {copy.activateHint}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
