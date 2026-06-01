import React, { useEffect, useState } from 'react';
import { Monitor, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { isDesktopViewport } from '../lib/onboarding';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../lib/storage';
import { useTheme } from '../theme/ThemeContext';

export const DesktopNotice: React.FC = () => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [isNarrow, setIsNarrow] = useState(() => !isDesktopViewport(window.innerWidth));
  const [dismissed, setDismissed] = useState(() => loadJSON(STORAGE_KEYS.desktopNoticeDismissed, false));

  useEffect(() => {
    const onResize = () => setIsNarrow(!isDesktopViewport(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!isNarrow || dismissed) return null;

  return (
    <aside
      className={`fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-xl rounded-lg border p-4 shadow-2xl ${
        theme === 'dark'
          ? 'border-amber-400/35 bg-[#17130a]/95 text-amber-50'
          : 'border-amber-300 bg-amber-50/95 text-amber-950'
      }`}
      role="alert"
      aria-labelledby="desktop-notice-title"
    >
      <div className="flex items-start gap-3">
        <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="desktop-notice-title" className="text-sm font-bold">
            {t.desktopNotice.title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed opacity-80">{t.desktopNotice.body}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            saveJSON(STORAGE_KEYS.desktopNoticeDismissed, true);
            setDismissed(true);
          }}
          className="rounded-sm p-1 opacity-70 transition hover:opacity-100"
          aria-label={t.desktopNotice.dismiss}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
