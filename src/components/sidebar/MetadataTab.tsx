import React from 'react';
import { AvatarConfig } from '../../types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface MetadataTabProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
}

export const MetadataTab: React.FC<MetadataTabProps> = ({ config, setConfig }) => {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h4
          className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          {t.rightSidebar.metadataTitle}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">{t.rightSidebar.metadataSub}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {t.rightSidebar.charName}
          </label>
          <input
            id="character-name"
            type="text"
            value={config.name || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t.rightSidebar.charNamePlaceholder}
            className={`w-full text-xs p-3 rounded-sm border focus:outline-none focus:border-indigo-500 placeholder:text-slate-400/55 dark:placeholder:text-white/20 font-medium font-sans ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-white border-white/10'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="character-lore"
            className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}
          >
            {t.rightSidebar.charLore}
          </label>
          <textarea
            id="character-lore"
            value={config.lore || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, lore: e.target.value }))}
            placeholder={t.rightSidebar.charLorePlaceholder}
            className={`w-full text-xs p-3 rounded-sm border focus:outline-none focus:border-indigo-500 placeholder:text-slate-400/55 dark:placeholder:text-white/20 h-44 resize-none font-sans leading-relaxed ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
