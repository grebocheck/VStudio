import React, { Suspense } from 'react';
import type { AvatarConfig } from '../../types';
import { useI18n } from '../../i18n';

const TelegramStickerPackPanel = React.lazy(() =>
  import('../TelegramStickerPackPanel').then((m) => ({ default: m.TelegramStickerPackPanel })),
);

export interface StickersTabProps {
  config: AvatarConfig;
}

export const StickersTab: React.FC<StickersTabProps> = ({ config }) => {
  const { language } = useI18n();
  const isEn = language === 'en';
  return (
    <Suspense
      fallback={
        <div className="animate-pulse text-xs text-slate-500">
          {isEn ? 'Preparing sticker studio…' : 'Готуємо студію стікерів…'}
        </div>
      }
    >
      <TelegramStickerPackPanel config={config} fileBaseName={config.name || 'My-character'} />
    </Suspense>
  );
};
