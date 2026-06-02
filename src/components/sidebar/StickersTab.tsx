import React from 'react';
import { Sparkles } from 'lucide-react';
import { AvatarConfig } from '../../types';
import { TelegramStickerPackPanel } from '../TelegramStickerPackPanel';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface StickersTabProps {
  config: AvatarConfig;
}

export const StickersTab: React.FC<StickersTabProps> = ({ config }) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';
  const copy = t.rightSidebar.telegramStickers;

  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-sm border ${
          theme === 'dark' ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-500/5 border-sky-300'
        }`}
      >
        <h4 className="text-xs font-bold text-sky-500 dark:text-sky-400 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-sky-500" />
          <span>{copy.title}</span>
        </h4>
        <p className={`text-[10px] leading-relaxed mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
          {copy.sub}
        </p>
      </div>

      <TelegramStickerPackPanel config={config} fileBaseName={config.name || (isEn ? 'Personal' : 'Особистий')} />
    </div>
  );
};
