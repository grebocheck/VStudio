import React from 'react';
import { PresetAvatar } from '../../types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface PresetsTabProps {
  customPresets: PresetAvatar[];
  PRESETS: PresetAvatar[];
  activePresetKey: string | null;
  onApplyPreset: (preset: PresetAvatar) => void;
  onDeleteCustomPreset: (id: string) => void;
}

export const PresetsTab: React.FC<PresetsTabProps> = ({
  customPresets,
  PRESETS,
  activePresetKey,
  onApplyPreset,
  onDeleteCustomPreset,
}) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const getPresetName = (presetId: string, defaultName: string) => {
    const key = `${presetId}_name`;
    if (key in t.presetStats) {
      return (t.presetStats as any)[key];
    }
    return defaultName;
  };

  return (
    <div className="space-y-4">
      <div className="pb-2">
        <h4
          className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          {t.rightSidebar.presetsTitle}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">{t.rightSidebar.presetsSub}</p>
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
              <span
                className={`font-bold text-xs block ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-800 dark:text-white/90'}`}
              >
                {getPresetName(p.id, p.name)}
              </span>
              <span className="text-[9px] font-mono text-slate-600 dark:text-white/70 block truncate mt-1">
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
                <span
                  className={`font-bold text-xs block truncate ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-800 dark:text-white/90'}`}
                >
                  🌟 {p.name}
                </span>
                <span className="text-[9px] font-mono text-slate-600 dark:text-white/70 block truncate mt-1">
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
          <p
            className={`text-[10px] italic text-center py-4 rounded border ${
              theme === 'dark'
                ? 'text-white/65 bg-[#08080a] border-white/5'
                : 'text-slate-600 bg-slate-50 border-slate-200'
            }`}
          >
            {t.presets.noCustomPresets}
          </p>
        )}
      </div>
    </div>
  );
};
