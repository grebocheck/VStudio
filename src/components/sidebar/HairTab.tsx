import React from 'react';
import { AvatarConfig } from '../../types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

const HAIR_SWATCHES = [
  '#e11d48',
  '#d97706',
  '#059669',
  '#2563eb',
  '#1e1b4b',
  '#7c3aed',
  '#ec4899',
  '#db2777',
  '#18181b',
  '#ffffff',
];

export interface HairTabProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
}

export const HairTab: React.FC<HairTabProps> = ({ config, setConfig }) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h4
          className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          {t.rightSidebar.hairTitle}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">{t.rightSidebar.hairSub}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="character-name"
            className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}
          >
            {isEn ? 'Front Hair (Bangs Style)' : 'Спереду (Чубчик)'}
          </label>
          <select
            value={config.hairStyleBang}
            onChange={(e) => setConfig((prev) => ({ ...prev, hairStyleBang: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="classic">{t.rightSidebar.bangsOptions.classic}</option>
            <option value="side">{t.rightSidebar.bangsOptions.side}</option>
            <option value="center-part">{t.rightSidebar.bangsOptions.center}</option>
            <option value="short">{t.rightSidebar.bangsOptions.short}</option>
            <option value="hime">{t.rightSidebar.bangsOptions.hime}</option>
            <option value="spiky">{t.rightSidebar.bangsOptions.spiky}</option>
            <option value="curly-bangs">{isEn ? 'Curly Bangs' : 'Кучерява чілка (завитушки)'}</option>
            <option value="cross-bangs">{isEn ? 'Cross Strands (Anime)' : 'Хрестоподібна чілка (аніме)'}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Back Hair (Length Style)' : 'Позаду (Задня довжина)'}
          </label>
          <select
            value={config.hairStyleBack}
            onChange={(e) => setConfig((prev) => ({ ...prev, hairStyleBack: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="straight">{t.rightSidebar.backOptions.straight}</option>
            <option value="tails">{t.rightSidebar.backOptions.tails}</option>
            <option value="drill-tails">
              {isEn ? 'Spiralled Drill Tails (Curls)' : 'Спіральні хвостики (завитушки)'}
            </option>
            <option value="curly">{t.rightSidebar.backOptions.curly}</option>
            <option value="wavy">{isEn ? 'Fluffy Wavy Curls' : 'Пишні кучері (завитушки)'}</option>
            <option value="short">{t.rightSidebar.backOptions.short}</option>
            <option value="braids">{t.rightSidebar.backOptions.braids}</option>
            <option value="hime-long">{t.rightSidebar.backOptions.himeLong}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Hair Gradient Effect' : 'Ефект Градієнту волосся'}
          </label>
          <select
            value={config.hairGradient || 'none'}
            onChange={(e) => setConfig((prev) => ({ ...prev, hairGradient: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
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
            {isEn ? 'Primary Color & Neon Highlight' : 'Основний колір & Свічення'}
          </label>
          <div
            className={`flex items-center space-x-2 p-2 rounded border ${
              theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            <input
              type="color"
              value={config.hairColor}
              onChange={(e) => setConfig((p) => ({ ...p, hairColor: e.target.value }))}
              className={`w-10 h-8 rounded-sm cursor-pointer ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
              title="Primary"
            />
            <input
              type="color"
              value={config.hairHighlightColor}
              onChange={(e) => setConfig((p) => ({ ...p, hairHighlightColor: e.target.value }))}
              className={`w-10 h-8 rounded-sm cursor-pointer ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
              title="Gradient"
            />
            <span className="text-[10px] font-mono text-slate-500 dark:text-white/50">
              {config.hairColor} / {config.hairHighlightColor}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="text-[9px] uppercase font-mono tracking-wider text-slate-400 dark:text-white/40 block">
            {isEn ? 'Quick Hair Palette Suggestions' : 'Швидка Палітра волосся'}
          </label>
          <div
            className={`flex flex-wrap gap-1.5 p-2 rounded border ${
              theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            {HAIR_SWATCHES.map((color) => (
              <button
                key={color}
                onClick={() => setConfig((p) => ({ ...p, hairColor: color, hairHighlightColor: color + '55' }))}
                className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-all cursor-pointer"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
