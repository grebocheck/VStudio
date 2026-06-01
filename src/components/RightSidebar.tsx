import React from 'react';
import { AvatarConfig, RigParams, PresetAvatar, TrackingMode, SidebarTab } from '../types';
import { RiggingSliderPanel } from './RiggingSliderPanel';
import { Palette, Sparkles, Tv, Loader2, Info } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

const HAIR_SWATCHES = [
  '#e11d48', '#d97706', '#059669', '#2563eb', '#1e1b4b', 
  '#7c3aed', '#ec4899', '#db2777', '#18181b', '#ffffff'
];

interface RightSidebarProps {
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

export const RightSidebar: React.FC<RightSidebarProps> = ({
  activeSidebarTab,
  config,
  setConfig,
  rig,
  handleRigChange,
  handleResetRig,
  trackingMode,
  setTrackingMode,
  micActive,
  setMicActive,
  onScreenBuster,
  setScreenBuster,
  aiPrompt,
  setAiPrompt,
  aiGenerating,
  aiError,
  handleAiGenerate,
  customPresets,
  PRESETS,
  activePresetKey,
  onApplyPreset,
  onDeleteCustomPreset,
  overlayCount,
}) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const [copied, setCopied] = React.useState(false);
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay` : '/overlay';
  const copyOverlayUrl = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const getPresetName = (presetId: string, defaultName: string) => {
    const key = `${presetId}_name`;
    if (key in t.presetStats) {
      return (t.presetStats as any)[key];
    }
    return defaultName;
  };

  return (
    <aside className={`w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col justify-between overflow-y-auto ${
      theme === 'dark'
        ? 'border-white/10 bg-[#0f0f12]/95 text-white'
        : 'border-slate-200 bg-white text-slate-800'
    }`} id="right-sidebar">
      
      {/* Header of Active Editor Section */}
      <div className={`p-4 border-b flex items-center space-x-2.5 shrink-0 ${
        theme === 'dark' ? 'border-white/10 bg-[#121217]' : 'border-slate-200 bg-slate-50'
      }`}>
         <Palette className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
         <div className="text-left">
           <h3 className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
             {t.rightSidebar.params} {
               activeSidebarTab === 'presets' ? t.leftSidebar.tabs.presets :
               activeSidebarTab === 'hair' ? t.leftSidebar.tabs.hair :
               activeSidebarTab === 'face' ? t.leftSidebar.tabs.face :
               activeSidebarTab === 'clothes' ? t.leftSidebar.tabs.clothes :
               activeSidebarTab === 'metadata' ? t.leftSidebar.tabs.metadata :
               activeSidebarTab === 'rigging' ? t.leftSidebar.tabs.rigging :
               activeSidebarTab === 'ai' ? t.leftSidebar.tabs.ai : t.leftSidebar.tabs.obs
             }
           </h3>
           <p className="text-[9px] text-slate-500 dark:text-white/50">{t.rightSidebar.activeSec}</p>
         </div>
      </div>

      {/* Form Editing options container */}
      <div className="p-5 flex-grow space-y-5 text-left leading-relaxed">
        
        {/* TABS EDITORS: 1. PRESETS */}
        {activeSidebarTab === 'presets' && (
          <div className="space-y-4">
            <div className="pb-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {t.rightSidebar.presetsTitle}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">
                {t.rightSidebar.presetsSub}
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              {PRESETS.map((p) => {
                const isActive = activePresetKey === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onApplyPreset(p)}
                    className={`p-3 text-left rounded-sm border transition-all cursor-pointer block w-full ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold'
                        : theme === 'dark'
                          ? 'bg-[#0a0a0c] border-white/10 text-white/65 hover:bg-white/5 hover:text-white hover:border-white/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-bold text-xs block ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-800 dark:text-white/90'}`}>
                      {getPresetName(p.id, p.name)}
                    </span>
                    <span className="text-[9px] font-mono opacity-60 block truncate mt-1">
                      {p.config.clothingStyle} · {p.config.hairStyleBack}
                    </span>
                  </button>
                );
              })}

              {customPresets.map((p) => {
                const isActive = activePresetKey === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-3 text-left rounded-sm border transition-all flex items-center gap-2 w-full ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold'
                        : theme === 'dark'
                          ? 'bg-[#0a0a0c] border-white/10 text-white/65 hover:bg-white/5 hover:text-white hover:border-white/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <button onClick={() => onApplyPreset(p)} className="flex-1 text-left cursor-pointer min-w-0">
                      <span className={`font-bold text-xs block truncate ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-800 dark:text-white/90'}`}>
                        🌟 {p.name}
                      </span>
                      <span className="text-[9px] font-mono opacity-60 block truncate mt-1">
                        {t.presets.customSaved}
                      </span>
                    </button>
                    <button
                      onClick={() => onDeleteCustomPreset(p.id)}
                      className="shrink-0 text-rose-500 hover:text-rose-400 text-sm px-1 cursor-pointer"
                      title={isEn ? 'Delete' : 'Видалити'}
                      aria-label={isEn ? 'Delete preset' : 'Видалити пресет'}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {customPresets.length === 0 && (
                <p className={`text-[10px] italic text-center py-4 rounded border ${
                  theme === 'dark' ? 'text-white/40 bg-[#08080a] border-white/5' : 'text-slate-400 bg-slate-50 border-slate-200'
                }`}>
                  {t.presets.noCustomPresets}
                </p>
              )}
            </div>
          </div>
        )}

        {/* TABS EDITORS: 2. HAIR */}
        {activeSidebarTab === 'hair' && (
          <div className="space-y-4">
            <div className="pb-1">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {t.rightSidebar.hairTitle}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">
                {t.rightSidebar.hairSub}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Front Hair (Bangs Style)" : "Спереду (Чубчик)"}
                </label>
                <select
                  value={config.hairStyleBang}
                  onChange={(e) => setConfig(prev => ({ ...prev, hairStyleBang: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="classic">{t.rightSidebar.bangsOptions.classic}</option>
                  <option value="side">{t.rightSidebar.bangsOptions.side}</option>
                  <option value="center-part">{t.rightSidebar.bangsOptions.center}</option>
                  <option value="short">{t.rightSidebar.bangsOptions.short}</option>
                  <option value="hime">{t.rightSidebar.bangsOptions.hime}</option>
                  <option value="spiky">{t.rightSidebar.bangsOptions.spiky}</option>
                  <option value="curly-bangs">{isEn ? "Curly Bangs" : "Кучерява чілка (завитушки)"}</option>
                  <option value="cross-bangs">{isEn ? "Cross Strands (Anime)" : "Хрестоподібна чілка (аніме)"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Back Hair (Length Style)" : "Позаду (Задня довжина)"}
                </label>
                <select
                  value={config.hairStyleBack}
                  onChange={(e) => setConfig(prev => ({ ...prev, hairStyleBack: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="straight">{t.rightSidebar.backOptions.straight}</option>
                  <option value="tails">{t.rightSidebar.backOptions.tails}</option>
                  <option value="drill-tails">{isEn ? "Spiralled Drill Tails (Curls)" : "Спіральні хвостики (завитушки)"}</option>
                  <option value="curly">{t.rightSidebar.backOptions.curly}</option>
                  <option value="wavy">{isEn ? "Fluffy Wavy Curls" : "Пишні кучері (завитушки)"}</option>
                  <option value="short">{t.rightSidebar.backOptions.short}</option>
                  <option value="braids">{t.rightSidebar.backOptions.braids}</option>
                  <option value="hime-long">{t.rightSidebar.backOptions.himeLong}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Hair Gradient Effect" : "Ефект Градієнту волосся"}
                </label>
                <select
                  value={config.hairGradient || 'none'}
                  onChange={(e) => setConfig(prev => ({ ...prev, hairGradient: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="none">{t.rightSidebar.gradientOptions.none}</option>
                  <option value="linear">{t.rightSidebar.gradientOptions.linear}</option>
                  <option value="sunset">{t.rightSidebar.gradientOptions.sunset}</option>
                  <option value="indigo-fade">{t.rightSidebar.gradientOptions.indigo}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Primary Color & Neon Highlight" : "Основний колір & Свічення"}
                </label>
                <div className={`flex items-center space-x-2 p-2 rounded border ${
                  theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <input
                    type="color"
                    value={config.hairColor}
                    onChange={(e) => setConfig(p => ({ ...p, hairColor: e.target.value }))}
                    className={`w-10 h-8 rounded-sm cursor-pointer ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
                    title="Primary"
                  />
                  <input
                    type="color"
                    value={config.hairHighlightColor}
                    onChange={(e) => setConfig(p => ({ ...p, hairHighlightColor: e.target.value }))}
                    className={`w-10 h-8 rounded-sm cursor-pointer ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
                    title="Gradient"
                  />
                  <span className="text-[10px] font-mono text-slate-500 dark:text-white/50">{config.hairColor} / {config.hairHighlightColor}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400 dark:text-white/40 block">
                  {isEn ? "Quick Hair Palette Suggestions" : "Швидка Палітра волосся"}
                </label>
                <div className={`flex flex-wrap gap-1.5 p-2 rounded border ${
                  theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  {HAIR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => setConfig(p => ({ ...p, hairColor: color, hairHighlightColor: color + '55' }))}
                      className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-all cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS EDITORS: 3. FACE */}
        {activeSidebarTab === 'face' && (
          <div className="space-y-4">
            <div className="pb-1">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {t.rightSidebar.faceTitle}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">
                {t.rightSidebar.faceSub}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Design Group / Painting Art Style" : "Група Дизайну / Стиль Малювання"}
                </label>
                <select
                  value={config.artStyle || 'classic'}
                  onChange={(e) => setConfig(prev => ({ ...prev, artStyle: e.target.value as any }))}
                  className={`w-full text-xs font-semibold p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'
                  }`}
                >
                  <option value="classic">{isEn ? "Classic (Universal Vector)" : "Класичний (Classic)"}</option>
                  <option value="anime">{isEn ? "Japanese Anime (Manga Sparks)" : "Японське Аніме (Anime Style)"}</option>
                  <option value="retro">{isEn ? "1930s Mickey Retro (Rubber Hose)" : "Ретро-Мультфільм 1930х (Retro Style)"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Blush Opacity & Makeup Accent" : "Стиль Макіяжу / Рум’янцю (Blush)"}
                </label>
                <div className={`flex items-center space-x-3 p-2.5 rounded border ${
                  theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.blushOpacity ?? 0.25}
                    onChange={(e) => setConfig(prev => ({ ...prev, blushOpacity: parseFloat(e.target.value) }))}
                    className="flex-1 accent-indigo-500 cursor-pointer h-1.5"
                  />
                  <input
                    type="color"
                    value={config.blushColor ?? '#ff4d6d'}
                    onChange={(e) => setConfig(p => ({ ...p, blushColor: e.target.value }))}
                    className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border-slate-200'}`}
                  />
                  <span className="text-[10px] font-mono whitespace-nowrap text-slate-500 dark:text-white/50 w-8 text-right">{Math.round((config.blushOpacity ?? 0.25) * 100)}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Cosplay Ears Style" : "Стиль Вушок (Ear Type)"}
                </label>
                <select
                  value={config.earStyle || 'normal'}
                  onChange={(e) => setConfig(prev => ({ ...prev, earStyle: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="normal">{t.rightSidebar.earOptions.normal}</option>
                  <option value="elf">{t.rightSidebar.earOptions.elf}</option>
                  <option value="pointy">{t.rightSidebar.earOptions.pointy}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Pupils Pattern Shape (Iris Rig)" : "Форма Зіниць (Pupils Rig)"}
                </label>
                <select
                  value={config.pupilStyle}
                  onChange={(e) => setConfig(prev => ({ ...prev, pupilStyle: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="round">{t.rightSidebar.pupilOptions.round}</option>
                  <option value="star">{t.rightSidebar.pupilOptions.star}</option>
                  <option value="heart">{t.rightSidebar.pupilOptions.heart}</option>
                  <option value="slit">{t.rightSidebar.pupilOptions.slit}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Eyebrows Style" : "Форма Брів (Eyebrows Style)"}
                </label>
                <select
                  value={config.eyebrowStyle}
                  onChange={(e) => setConfig(prev => ({ ...prev, eyebrowStyle: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="normal">{t.rightSidebar.eyebrowOptions.normal}</option>
                  <option value="thin">{t.rightSidebar.eyebrowOptions.thin}</option>
                  <option value="thick">{t.rightSidebar.eyebrowOptions.thick}</option>
                  <option value="none">{t.rightSidebar.eyebrowOptions.none}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Mouth & Teeth Visual Options" : "Зовнішній вигляд Рота"}
                </label>
                <div className={`flex items-center space-x-2.5 h-10 px-3 rounded border ${
                  theme === 'dark' ? 'bg-[#0a0a0c]/80 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    id="fangs-drawer-checkbox"
                    checked={config.hasFangs ?? false}
                    onChange={(e) => setConfig(prev => ({ ...prev, hasFangs: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer accent-indigo-500"
                  />
                  <label htmlFor="fangs-drawer-checkbox" className={`text-xs cursor-pointer select-none font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                    {isEn ? "Show Sharp Vampire Fangs" : "Показувати гострі Ікла (Fangs)"}
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Active Emotional Overlays" : "Емоційний стан & Оверлеї"}
                </label>
                <select
                  value={config.activeEmotion || 'none'}
                  onChange={(e) => setConfig(prev => ({ ...prev, activeEmotion: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="none">{isEn ? "None (Calm)" : "Немає (Спокій)"}</option>
                  <option value="happy">{isEn ? "Happy (Floating Hearts)" : "Радість (Рожеві сердечка)"}</option>
                  <option value="angry">{isEn ? "Angry Pop (Pulsing Vein)" : "Гнів (Червона вена)"}</option>
                  <option value="cry">{isEn ? "Cry (Streaming Teardrops)" : "Сльози (Потоки сліз)"}</option>
                  <option value="shocked">{isEn ? "Shocked Bubble (! Alert)" : "Шок (Увага !)"}</option>
                  <option value="smug">{isEn ? "Smug Twinkle (Playful Cross)" : "Хитрість (Сяйво)"}</option>
                  <option value="squint">{isEn ? "Squint / Squeezed Shut (>_<)" : "Замружений (>_<)"}</option>
                  <option value="love">{isEn ? "Love (Heart Eyes)" : "Кохання (Очі-сердечка)"}</option>
                  <option value="starry">{isEn ? "Starry (Excitement / Sparkly)" : "Зоряний (Захоплення / Іскри)"}</option>
                  <option value="depressed">{isEn ? "Depressed (Gloom vertical lines)" : "Пригніченість (Темні смуги)"}</option>
                  <option value="dizzy">{isEn ? "Dizzy (Spinning Spiral @_@)" : "Запаморочення (Спіралі @_@)"}</option>
                  <option value="cool">{isEn ? "Cool (Stylish Sunglasses)" : "Крутий (Окуляри й ноти)"}</option>
                  <option value="scared">{isEn ? "Scared (Panicked Shivering)" : "Переляк (Дрижання)"}</option>
                  <option value="sleepy">{isEn ? "Sleepy (Yawning Bubble Zzz)" : "Сонливість (Бульбашка й Zzz)"}</option>
                  <option value="shy">{isEn ? "Shy / Embarrassed (Red Cheeks)" : "Сором'язливість (Красні щоки)"}</option>
                  <option value="relaxed">{isEn ? "Relaxed / Chill (Blossom Petals)" : "Розслаблення (Пелюстки сакури)"}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 dark:text-white/40 block font-mono uppercase font-bold">{isEn ? "Skin tone" : "Шкіра / тіло"}</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={config.skinColor}
                      onChange={(e) => setConfig(p => ({ ...p, skinColor: e.target.value }))}
                      className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-250'}`}
                    />
                    <span className="text-[9px] font-mono text-slate-500 dark:text-white/50">{config.skinColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 dark:text-white/40 block font-mono uppercase font-bold">{isEn ? "Eyes Iris" : "Райдужка ока"}</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={config.eyeColor}
                      onChange={(e) => setConfig(p => ({ ...p, eyeColor: e.target.value }))}
                      className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-250'}`}
                    />
                    <span className="text-[9px] font-mono text-slate-500 dark:text-white/50">{config.eyeColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS EDITORS: 4. CLOTHES */}
        {activeSidebarTab === 'clothes' && (
          <div className="space-y-4">
            <div className="pb-1">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {t.rightSidebar.clothesTitle}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">
                {t.rightSidebar.clothesSub}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Outfit Uniform Style" : "Стиль Стрімерського Одягу"}
                </label>
                <select
                  value={config.clothingStyle}
                  onChange={(e) => setConfig(prev => ({ ...prev, clothingStyle: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="hoodie">{t.rightSidebar.outfitOptions.hoodie}</option>
                  <option value="kimono">{t.rightSidebar.outfitOptions.kimono}</option>
                  <option value="suit">{t.rightSidebar.outfitOptions.suit}</option>
                  <option value="cyber-armor">{t.rightSidebar.outfitOptions.cyber}</option>
                  <option value="goth-dress">{t.rightSidebar.outfitOptions.goth}</option>
                  <option value="druid-cloak">{t.rightSidebar.outfitOptions.druid}</option>
                  <option value="sailor-fuku">{isEn ? "High School Sailor Suit" : "Матроска (Sailor Uniform)"}</option>
                  <option value="sweater">{isEn ? "Cozy Winter Sweater" : "Теплий в'язаний светр"}</option>
                  <option value="maid">{isEn ? "Graceful Maid Dress" : "Костюм покоївки (Maid Dress)"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Clothing Chest Print / Stamp" : "Прінт на Одязі (Chest Print)"}
                </label>
                <select
                  value={config.clothingPrint || 'none'}
                  onChange={(e) => setConfig(prev => ({ ...prev, clothingPrint: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="none">{isEn ? "None (Plain)" : "Немає (Однотонний)"}</option>
                  <option value="cat">{isEn ? "Neko Cat Paw Print 🐾" : "Котик 🐾"}</option>
                  <option value="star">{isEn ? "Mystical Shiny Star ⭐" : "Зірка ⭐"}</option>
                  <option value="heart">{isEn ? "Lovely Pink Heart 💖" : "Сердечко 💖"}</option>
                  <option value="cyber">{isEn ? "Cyber Matrix Circuit ⚡" : "Кібер Мережа ⚡"}</option>
                  <option value="cross">{isEn ? "Gothic Lolita Cross ✙" : "Хрест ✙"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Head Accessory & Gear" : "Аксесуар Голови"}
                </label>
                <select
                  value={config.accessoryStyle}
                  onChange={(e) => setConfig(prev => ({ ...prev, accessoryStyle: e.target.value as any }))}
                  className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="none">{t.rightSidebar.decorOptions.none}</option>
                  <option value="headphones">{t.rightSidebar.decorOptions.headphones}</option>
                  <option value="horns">{t.rightSidebar.decorOptions.horns}</option>
                  <option value="glasses">{t.rightSidebar.decorOptions.glasses}</option>
                  <option value="neko-ears">{t.rightSidebar.decorOptions.neko}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Clothing Palette (Primary / Accents)" : "Кольори Одягу (Первинний / Другорядний)"}
                </label>
                <div className={`flex items-center space-x-2 p-2 rounded border ${
                  theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  <input
                    type="color"
                    value={config.clothingColor1}
                    onChange={(e) => setConfig(p => ({ ...p, clothingColor1: e.target.value }))}
                    className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
                    title="Primary clothing"
                  />
                  <input
                    type="color"
                    value={config.clothingColor2}
                    onChange={(e) => setConfig(p => ({ ...p, clothingColor2: e.target.value }))}
                    className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
                    title="Accents detail"
                  />
                  <span className="text-[10px] font-mono text-slate-500 dark:text-white/50">{config.clothingColor1} / {config.clothingColor2}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "LED Glow Accessory Highlights" : "Аксесуар Свічення (LED Glow)"}
                </label>
                <div className={`flex items-center space-x-2.5 h-10 px-3 rounded border ${
                  theme === 'dark' ? 'bg-[#0a0a0c]/80 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    id="glow-drawer-checkbox"
                    checked={config.accessoryGlow ?? false}
                    onChange={(e) => setConfig(prev => ({ ...prev, accessoryGlow: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer accent-indigo-500"
                  />
                  <label htmlFor="glow-drawer-checkbox" className={`text-xs cursor-pointer select-none font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                    {isEn ? "Enable Neon Aura-Glow Backlighting" : "Увімкнути неонову тінь-свічення"}
                  </label>
                </div>
              </div>

              <div className={`mt-4 p-4 rounded-sm border space-y-4 ${
                theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 block font-mono">
                  {isEn ? "Body Anatomy & Proportions" : "Анатомічні пропорції тіла"}
                </span>

                {/* 1. Head Size */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>{isEn ? "Head Scaling" : "Розмір голови (Head)"}</span>
                    <span className="text-indigo-500">{Math.round((config.headSize ?? 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.85"
                    max="1.15"
                    step="0.01"
                    value={config.headSize ?? 1.0}
                    onChange={(e) => setConfig(prev => ({ ...prev, headSize: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5"
                  />
                </div>

                {/* 2. Neck Width */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>{isEn ? "Neck Thickness" : "Ширина шиї (Neck Width)"}</span>
                    <span className="text-indigo-500">{Math.round((config.neckWidth ?? 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="1.25"
                    step="0.01"
                    value={config.neckWidth ?? 1.0}
                    onChange={(e) => setConfig(prev => ({ ...prev, neckWidth: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5"
                  />
                </div>

                {/* 3. Neck Height */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>{isEn ? "Neck Height" : "Висота шиї (Neck Height)"}</span>
                    <span className="text-indigo-500">{Math.round((config.neckHeight ?? 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.70"
                    max="1.25"
                    step="0.01"
                    value={config.neckHeight ?? 1.0}
                    onChange={(e) => setConfig(prev => ({ ...prev, neckHeight: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5"
                  />
                </div>

                {/* 4. Shoulder Width */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>{isEn ? "Shoulders Width" : "Ширина плечей (Shoulders)"}</span>
                    <span className="text-indigo-500">{Math.round((config.shoulderWidth ?? 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="1.25"
                    step="0.01"
                    value={config.shoulderWidth ?? 1.0}
                    onChange={(e) => setConfig(prev => ({ ...prev, shoulderWidth: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {isEn ? "Backdrop Studio Environment" : "Задній Фон Студії (Backdrop)"}
                </label>
                <div className={`grid grid-cols-2 gap-2 p-2 rounded border ${
                  theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
                }`}>
                  {[
                    { id: 'gaming', label: t.rightSidebar.backdropOptions.gaming },
                    { id: 'nebula', label: t.rightSidebar.backdropOptions.nebula },
                    { id: 'dark-studio', label: t.rightSidebar.backdropOptions.darkStudio },
                    { id: 'green-screen', label: t.rightSidebar.backdropOptions.greenScreen },
                  ].map((bg) => {
                    const isActive = config.backgroundStyle === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setConfig(prev => ({ ...prev, backgroundStyle: bg.id as any }))}
                        className={`px-2 py-2 text-[10px] font-semibold rounded-sm border transition-all cursor-pointer truncate ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-indigo-600/25 border-indigo-500 text-white font-bold'
                              : 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                            : theme === 'dark'
                              ? 'bg-[#0a0a0c] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {bg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS EDITORS: 5. METADATA */}
        {activeSidebarTab === 'metadata' && (
          <div className="space-y-4">
            <div className="pb-1">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {t.rightSidebar.metadataTitle}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">
                {t.rightSidebar.metadataSub}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {t.rightSidebar.charName}
                </label>
                <input
                  type="text"
                  value={config.name || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.rightSidebar.charNamePlaceholder}
                  className={`w-full text-xs p-3 rounded-sm border focus:outline-none focus:border-indigo-500 placeholder:text-slate-400/55 dark:placeholder:text-white/20 font-medium font-sans ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-white border-white/10' : 'bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
                  {t.rightSidebar.charLore}
                </label>
                <textarea
                  value={config.lore || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, lore: e.target.value }))}
                  placeholder={t.rightSidebar.charLorePlaceholder}
                  className={`w-full text-xs p-3 rounded-sm border focus:outline-none focus:border-indigo-500 placeholder:text-slate-400/55 dark:placeholder:text-white/20 h-44 resize-none font-sans leading-relaxed ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* TABS EDITORS: 6. RIGGING Sliders calibration */}
        {activeSidebarTab === 'rigging' && (
          <div className="space-y-4">
            <div className="pb-1">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {t.rightSidebar.riggingTitle}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">
                {t.rightSidebar.riggingSub}
              </p>
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
            />
          </div>
        )}

        {/* TABS EDITORS: 7. SHI GEMINI AI CONCEPT DESIGNER */}
        {activeSidebarTab === 'ai' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-sm border ${
              theme === 'dark' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-500/5 border-yellow-300'
            }`}>
              <h4 className="text-xs font-bold text-yellow-600 dark:text-yellow-500 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>{t.rightSidebar.aiTitle}</span>
              </h4>
              <p className={`text-[10px] leading-relaxed mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                {t.rightSidebar.aiSub}
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={t.rightSidebar.aiPlaceholder}
                className={`w-full text-xs p-3 rounded-sm border placeholder:text-slate-400/55 dark:placeholder:text-white/20 focus:outline-none focus:border-yellow-500/55 h-32 resize-none leading-relaxed font-sans ${
                  theme === 'dark' ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10' : 'bg-slate-50 text-slate-800 border-slate-205'
                }`}
              />
            </div>

            {aiError && (
              <div className="flex items-start space-x-2 p-3 bg-red-950/20 border border-red-500/20 rounded-sm text-red-500 dark:text-red-300 text-[10px]">
                <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                id="generate-ai-btn"
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] text-white disabled:opacity-40 font-bold text-xs rounded-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:pointer-events-none uppercase tracking-wider"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{t.rightSidebar.aiBtnGenerating}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>{t.rightSidebar.aiBtnActive}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TABS EDITORS: 8. OBS EXPORT INTEGRATION */}
        {activeSidebarTab === 'obs' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-sm border ${
              theme === 'dark' ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-cyan-500/5 border-cyan-300'
            }`}>
              <h4 className="text-xs font-bold text-cyan-500 dark:text-cyan-400 flex items-center space-x-2">
                <Tv className="w-4 h-4 text-cyan-500" />
                <span>{t.rightSidebar.obsTitle}</span>
              </h4>
              <p className={`text-[10px] leading-relaxed mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                {t.rightSidebar.obsSub}
              </p>
            </div>

            {/* Live Browser Source (recommended) */}
            <div className="space-y-3 font-sans">
              <div>
                <h5 className={`text-[11px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {t.rightSidebar.obsOverlay.title}
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1 leading-relaxed">
                  {t.rightSidebar.obsOverlay.sub}
                </p>
              </div>

              <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400 dark:text-white/40 block">
                {t.rightSidebar.obsOverlay.urlLabel}
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={overlayUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`flex-1 min-w-0 text-[10px] font-mono p-2 rounded-sm border focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark' ? 'bg-[#0a0a0c] text-cyan-300 border-white/10' : 'bg-slate-50 text-cyan-700 border-slate-200'
                  }`}
                />
                <button
                  onClick={copyOverlayUrl}
                  className="shrink-0 px-2.5 py-2 text-[10px] font-bold rounded-sm bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer"
                >
                  {copied ? t.rightSidebar.obsOverlay.copied : t.rightSidebar.obsOverlay.copy}
                </button>
              </div>

              <a
                href={overlayUrl}
                target="_blank"
                rel="noreferrer"
                className={`w-full block text-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ↗ {t.rightSidebar.obsOverlay.open}
              </a>

              {/* Live connection status */}
              <div className={`flex items-center gap-2 text-[10px] font-mono px-3 py-2 rounded-sm border ${
                overlayCount > 0
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : theme === 'dark' ? 'border-white/10 bg-white/5 text-white/40' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${overlayCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {overlayCount > 0 ? `${overlayCount} ${t.rightSidebar.obsOverlay.connected}` : t.rightSidebar.obsOverlay.none}
              </div>

              <div className={`space-y-2 pt-1 divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                {(['1', '2', '3'] as const).map((step) => (
                  <div key={step} className="flex gap-2.5 text-[10px] pt-3 text-left">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold font-mono shrink-0 text-[9px]">{step}</span>
                    <div>
                      <p className={`font-bold text-[10.5px] ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>{t.rightSidebar.obsOverlay.steps[step].title}</p>
                      <p className={`mt-0.5 leading-relaxed text-[9px] ${theme === 'dark' ? 'text-[#d1d1d1]/55' : 'text-slate-500'}`}>{t.rightSidebar.obsOverlay.steps[step].text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternative: Window Capture + Chroma Key */}
            <div className={`space-y-2 font-sans pt-4 mt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
              <h5 className={`text-[11px] font-bold ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                {t.rightSidebar.obsAltTitle}
              </h5>
              <button
                id="obs-chromakey-shortcut"
                onClick={() => {
                  setConfig(prev => ({ ...prev, backgroundStyle: 'green-screen' }));
                  alert(t.rightSidebar.obsAlert);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                {t.rightSidebar.obsBtnChroma}
              </button>

              <div className={`space-y-2 pt-2 divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                {(['1', '2', '3'] as const).map((step) => (
                  <div key={step} className="flex gap-2.5 text-[10px] pt-3 text-left">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold font-mono shrink-0 text-[9px]">{step}</span>
                    <div>
                      <p className={`font-bold text-[10.5px] ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>{t.rightSidebar.obsSteps[step].title}</p>
                      <p className={`mt-0.5 leading-relaxed text-[9px] ${theme === 'dark' ? 'text-[#d1d1d1]/55' : 'text-slate-500'}`}>{t.rightSidebar.obsSteps[step].text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Sidebar Footer detailing the calibration ratio values in real-time */}
      <div className={`p-4 border-t font-mono text-[10px] flex items-center justify-between shrink-0 ${
        theme === 'dark' ? 'border-white/10 bg-[#0c0c10] text-[#d1d1d1]/40' : 'border-slate-200 bg-slate-50 text-slate-500'
      }`}>
        <span>{t.rightSidebar.footerLabel}: {config.name || (isEn ? 'Personal' : 'Особистий')}</span>
        <span>{t.rightSidebar.footerTotal}</span>
      </div>

    </aside>
  );
};
