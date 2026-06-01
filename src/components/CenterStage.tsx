import React from 'react';
import { AvatarConfig, RigParams, TrackingMode, Emotion } from '../types';
import { VTuberAvatar } from './VTuberAvatar';
import { Shuffle, User } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { localizePreset } from '../presets';
import { EMOTES } from '../hooks/useEmotes';

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
}) => {
  const { t } = useI18n();
  const { theme } = useTheme();

  // Built-in presets are translated by their stable id; custom/AI/edited
  // avatars carry their own name + lore inside the config.
  const localized = localizePreset(activePresetKey, t);
  const name = localized?.name || config.name || t.presets.customSaved;
  const lore = localized?.lore || config.lore || t.centerStage.defaultLore;

  return (
    <main className={`flex-grow flex flex-col p-4 lg:p-6 space-y-6 overflow-y-auto ${
      theme === 'dark' ? 'bg-[#07070a]/40 text-[#d1d1d1]' : 'bg-slate-100/50 text-slate-800'
    }`} id="center-stage-container">
      
      {/* Main Visual Frame holding our VTuber */}
      <div className={`p-4.5 rounded-lg border flex flex-col shadow-2xl relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-[#0f0f12] border-white/10' 
          : 'bg-white border-slate-200'
      }`} id="stage-monitoring-frame">
        
        {/* Viewport bar of the monitor */}
        <div className={`w-full flex items-center justify-between mb-4 border-b pb-3 ${
          theme === 'dark' ? 'border-white/5' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-red-600 absolute" />
            <span className={`text-[10px] font-bold uppercase tracking-wider pl-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {t.centerStage.title}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-500 dark:text-indigo-400 rounded-sm font-mono uppercase tracking-wide">
              {t.centerStage.liveRatio}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              id="shuffle-hair-style"
              onClick={() => {
                const rands = ['classic','side','center-part','short','hime','spiky'] as const;
                const rBack = ['straight','tails','curly','short','braids','hime-long'] as const;
                setConfig(prev => ({
                  ...prev,
                  hairStyleBang: rands[Math.floor(Math.random() * rands.length)],
                  hairStyleBack: rBack[Math.floor(Math.random() * rBack.length)],
                  hairColor: '#' + Math.floor(Math.random()*16777215).toString(16),
                  eyeColor: '#' + Math.floor(Math.random()*16777215).toString(16),
                }));
              }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-sm flex items-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider ${
                theme === 'dark'
                  ? 'text-white bg-[#07070a] border border-white/10 hover:bg-white/5 hover:border-white/20'
                  : 'text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title="Швидкий мікс"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-500 rotate-12" />
              <span>{t.centerStage.quickMix}</span>
            </button>
          </div>
        </div>

        {/* Simulated Live Stage viewport */}
        <div className={`relative w-full h-[525px] flex items-center justify-center rounded border select-none overflow-hidden shadow-inner ${
          theme === 'dark' ? 'bg-[#101015] border-white/5' : 'bg-slate-50 border-slate-200/80'
        }`} id="interactive-rig-stage">
          
          {/* Backdrops based on selection state */}
          {config.backgroundStyle === 'green-screen' ? (
            <div className="absolute inset-0 bg-[#00ff00]" />
          ) : config.backgroundStyle === 'nebula' ? (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#12071f] via-[#080314] to-[#04081c]">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-15" />
              <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse" />
            </div>
          ) : config.backgroundStyle === 'gaming' ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c0512] via-[#06040a] to-[#010a12]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
              <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full filter blur-3xl animate-pulse" />
              <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse" />
            </div>
          ) : (
            /* dark studio led stand */
            <div className={`absolute inset-0 bg-gradient-to-b ${
              theme === 'dark' ? 'from-[#141419] to-[#07070a]' : 'from-slate-200/30 to-slate-100'
            }`}>
              <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-indigo-500/5 to-transparent filter blur-md" />
            </div>
          )}

          {/* Grid dots visualizer overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          
          {/* Massive scale rendering for outstanding visual impact */}
          <div className="relative z-10 w-full h-full flex items-center justify-center transform scale-110">
            <VTuberAvatar config={config} rig={rig} onScreenBuster={onScreenBuster} svgRef={avatarSvgRef} />
          </div>

          {/* Status and coordination log overlaid on the stage border */}
          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10 z-20 font-mono text-[9px] text-white/50 flex items-center gap-3" id="hud-telemetry">
            <span className="text-white/80 block">{t.centerStage.calibration}</span>
            <span className="text-indigo-400">Yaw {Math.round(rig.angleX)}°</span>
            <span className="text-pink-400">Pitch {Math.round(rig.angleY)}°</span>
            <span className="text-rose-400">Roll {Math.round(rig.angleZ)}°</span>
          </div>
        </div>

        {/* Quick stats and action parameters at the footer of viewport */}
        <div className={`mt-3 text-[10px] font-mono flex justify-between items-center p-3 rounded border ${
          theme === 'dark'
            ? 'text-white/40 bg-[#07070a] border-white/5'
            : 'text-slate-500 bg-slate-50 border-slate-200/60'
        }`} id="engine-telemetry">
          <span>{t.centerStage.telemetrySquish}</span>
          <span>{t.centerStage.telemetryOrganic}</span>
          <span className="text-emerald-500 dark:text-emerald-400">
            {trackingMode === 'auto' ? t.centerStage.autopilotActive : t.centerStage.cursorTrackingActive}
          </span>
        </div>
      </div>

      {/* Emote trigger bar — manual expression control for streamers */}
      <div className={`p-3 rounded-lg border shadow-xl ${
        theme === 'dark' ? 'bg-[#0f0f12] border-white/10' : 'bg-white border-slate-200'
      }`} id="emote-trigger-bar">
        <div className="flex items-center space-x-2 text-slate-400 dark:text-white/40 text-[10px] uppercase font-bold tracking-widest mb-2.5">
          <span className="text-indigo-500 dark:text-indigo-400">⚡</span>
          <span>{t.centerStage.emotesTitle}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EMOTES.map((emote) => {
            const isActive = activeEmote === emote.emotion;
            return (
              <button
                key={emote.emotion}
                onClick={() => onEmote(emote.emotion)}
                title={`${(t.centerStage.emotes as Record<string, string>)[emote.emotion]} (${emote.key})`}
                aria-label={(t.centerStage.emotes as Record<string, string>)[emote.emotion]}
                aria-pressed={isActive}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-md border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 scale-105 shadow-inner'
                    : theme === 'dark'
                      ? 'bg-[#07070a] border-white/10 hover:bg-white/5 hover:border-white/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span className="text-xl leading-none">{emote.icon}</span>
                <span className={`text-[8px] font-mono mt-1 ${isActive ? 'text-indigo-500 dark:text-indigo-300 font-bold' : 'text-slate-400 dark:text-white/40'}`}>
                  {emote.key}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dossier Card under the central canvas */}
      <div className={`p-5 rounded-lg border relative overflow-hidden shadow-xl ${
        theme === 'dark' 
          ? 'bg-[#0f0f12] border-white/10 text-[#d1d1d1]/85' 
          : 'bg-white border-slate-200 text-slate-700'
      }`} id="character-lore-dossier-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl"></div>
        
        <div className="flex items-center space-x-2 text-slate-400 dark:text-white/40 text-[10px] uppercase font-bold tracking-widest mb-3">
          <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>{t.centerStage.dossierTitle}</span>
        </div>

        <h3 className="text-base font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
          <span>{name}</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-sm uppercase tracking-wide">
            {t.centerStage.liveIndicator}
          </span>
        </h3>

        <p className={`text-xs leading-relaxed font-sans italic border-l-2 border-indigo-500/40 pl-3.5 mt-3 ${
          theme === 'dark' ? 'text-[#d1d1d1]/85' : 'text-slate-600'
        }`}>
          "{lore}"
        </p>
      </div>

    </main>
  );
};
