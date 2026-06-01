import React from 'react';
import { AvatarConfig, RigParams, TrackingMode, Emotion } from '../types';
import { VTuberAvatar } from './VTuberAvatar';
import { Shuffle } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { localizePreset } from '../presets';
import { CharacterDossier, EmoteTriggerBar, StageBackdrop } from './CenterStageStatic';

interface CenterStageProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  rig: RigParams;
  onScreenBuster: boolean;
  trackingMode: TrackingMode;
  /** Active built-in preset id, or null when the avatar is custom/AI/edited. */
  activePresetKey: string | null;
  activeEmote: Emotion | null;
  onEmote: (emotion: Emotion) => void;
  avatarSvgRef?: React.Ref<SVGSVGElement>;
  fps?: number | null;
}

export const CenterStage: React.FC<CenterStageProps> = ({
  config,
  setConfig,
  rig,
  onScreenBuster,
  trackingMode,
  activePresetKey,
  activeEmote,
  onEmote,
  avatarSvgRef,
  fps = null,
}) => {
  const { t } = useI18n();
  const { theme } = useTheme();

  // Built-in presets are translated by their stable id; custom/AI/edited
  // avatars carry their own name + lore inside the config.
  const localized = localizePreset(activePresetKey, t);
  const name = localized?.name || config.name || t.presets.customSaved;
  const lore = localized?.lore || config.lore || t.centerStage.defaultLore;

  return (
    <main
      className={`flex-grow flex flex-col p-4 lg:p-6 space-y-6 overflow-y-auto ${
        theme === 'dark' ? 'bg-[#07070a]/40 text-[#d1d1d1]' : 'bg-slate-100/50 text-slate-800'
      }`}
      id="center-stage-container"
      aria-label={t.centerStage.title}
    >
      {/* Main Visual Frame holding our VTuber */}
      <div
        className={`p-4.5 rounded-lg border flex flex-col shadow-2xl relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#0f0f12] border-white/10' : 'bg-white border-slate-200'
        }`}
        id="stage-monitoring-frame"
      >
        {/* Viewport bar of the monitor */}
        <div
          className={`w-full flex items-center justify-between mb-4 border-b pb-3 ${
            theme === 'dark' ? 'border-white/5' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-red-600 absolute" />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider pl-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            >
              {t.centerStage.title}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-500 dark:text-indigo-400 rounded-sm font-mono uppercase tracking-wide">
              {fps === null ? '--' : fps.toFixed(1)}fps {t.centerStage.liveRatio}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="shuffle-hair-style"
              onClick={() => {
                const rands = ['classic', 'side', 'center-part', 'short', 'hime', 'spiky'] as const;
                const rBack = ['straight', 'tails', 'curly', 'short', 'braids', 'hime-long'] as const;
                setConfig((prev) => ({
                  ...prev,
                  hairStyleBang: rands[Math.floor(Math.random() * rands.length)],
                  hairStyleBack: rBack[Math.floor(Math.random() * rBack.length)],
                  hairColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
                  eyeColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
                }));
              }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-sm flex items-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider ${
                theme === 'dark'
                  ? 'text-white bg-[#07070a] border border-white/10 hover:bg-white/5 hover:border-white/20'
                  : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title="Швидкий мікс"
              aria-label={t.centerStage.quickMix}
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-500 rotate-12" />
              <span>{t.centerStage.quickMix}</span>
            </button>
          </div>
        </div>

        {/* Simulated Live Stage viewport */}
        <div
          className={`relative w-full h-[525px] flex items-center justify-center rounded border select-none overflow-hidden shadow-inner ${
            theme === 'dark' ? 'bg-[#101015] border-white/5' : 'bg-slate-50 border-slate-200/80'
          }`}
          id="interactive-rig-stage"
        >
          <StageBackdrop backgroundStyle={config.backgroundStyle} theme={theme} />

          {/* Massive scale rendering for outstanding visual impact */}
          <div className="relative z-10 w-full h-full flex items-center justify-center transform scale-110">
            <VTuberAvatar config={config} rig={rig} onScreenBuster={onScreenBuster} svgRef={avatarSvgRef} fps={fps} />
          </div>

          {/* Status and coordination log overlaid on the stage border */}
          <div
            className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10 z-20 font-mono text-[9px] text-white/50 flex items-center gap-3"
            id="hud-telemetry"
          >
            <span className="text-white/80 block">{t.centerStage.calibration}</span>
            <span className="text-indigo-400">Yaw {Math.round(rig.angleX)}°</span>
            <span className="text-pink-400">Pitch {Math.round(rig.angleY)}°</span>
            <span className="text-rose-400">Roll {Math.round(rig.angleZ)}°</span>
          </div>
        </div>

        {/* Quick stats and action parameters at the footer of viewport */}
        <div
          className={`mt-3 text-[10px] font-mono flex justify-between items-center p-3 rounded border ${
            theme === 'dark'
              ? 'text-white/40 bg-[#07070a] border-white/5'
              : 'text-slate-500 bg-slate-50 border-slate-200/60'
          }`}
          id="engine-telemetry"
        >
          <span>{t.centerStage.telemetrySquish}</span>
          <span>{t.centerStage.telemetryOrganic}</span>
          <span className="text-emerald-500 dark:text-emerald-400">
            {trackingMode === 'auto' ? t.centerStage.autopilotActive : t.centerStage.cursorTrackingActive}
          </span>
        </div>
      </div>

      <EmoteTriggerBar activeEmote={activeEmote} onEmote={onEmote} />
      <CharacterDossier name={name} lore={lore} />
    </main>
  );
};
