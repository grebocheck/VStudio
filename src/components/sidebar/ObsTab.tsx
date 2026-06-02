import React from 'react';
import { AvatarConfig } from '../../types';
import { AvatarExportPanel } from '../AvatarExportPanel';
import { AvatarRecorderPanel } from '../AvatarRecorderPanel';
import { TelegramStickerPackPanel } from '../TelegramStickerPackPanel';
import { Tv } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface ObsTabProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  avatarSvgRef: React.RefObject<SVGSVGElement | null>;
  overlayCount: number;
}

export const ObsTab: React.FC<ObsTabProps> = ({ config, setConfig, avatarSvgRef, overlayCount }) => {
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

  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-sm border ${
          theme === 'dark' ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-cyan-500/5 border-cyan-300'
        }`}
      >
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

        <label
          htmlFor="obs-overlay-url"
          className="text-[9px] uppercase font-mono tracking-wider text-slate-400 dark:text-white/40 block"
        >
          {t.rightSidebar.obsOverlay.urlLabel}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="obs-overlay-url"
            readOnly
            value={overlayUrl}
            onFocus={(e) => e.currentTarget.select()}
            className={`flex-1 min-w-0 text-[10px] font-mono p-2 rounded-sm border focus:outline-none focus:border-cyan-500 ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-cyan-300 border-white/10'
                : 'bg-slate-50 text-cyan-700 border-slate-200'
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
        <div
          className={`flex items-center gap-2 text-[10px] font-mono px-3 py-2 rounded-sm border ${
            overlayCount > 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : theme === 'dark'
                ? 'border-white/10 bg-white/5 text-white/40'
                : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
          role="status"
          aria-live="polite"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${overlayCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
          />
          {overlayCount > 0 ? `${overlayCount} ${t.rightSidebar.obsOverlay.connected}` : t.rightSidebar.obsOverlay.none}
        </div>

        <div className={`space-y-2 pt-1 divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
          {(['1', '2', '3'] as const).map((step) => (
            <div key={step} className="flex gap-2.5 text-[10px] pt-3 text-left">
              <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold font-mono shrink-0 text-[9px]">
                {step}
              </span>
              <div>
                <p className={`font-bold text-[10.5px] ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>
                  {t.rightSidebar.obsOverlay.steps[step].title}
                </p>
                <p
                  className={`mt-0.5 leading-relaxed text-[9px] ${theme === 'dark' ? 'text-[#d1d1d1]/55' : 'text-slate-500'}`}
                >
                  {t.rightSidebar.obsOverlay.steps[step].text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AvatarExportPanel sourceRef={avatarSvgRef} fileBaseName={config.name || (isEn ? 'Personal' : 'Особистий')} />

      <TelegramStickerPackPanel config={config} fileBaseName={config.name || (isEn ? 'Personal' : 'Особистий')} />

      <AvatarRecorderPanel sourceRef={avatarSvgRef} fileBaseName={config.name || (isEn ? 'Personal' : 'Особистий')} />

      {/* Alternative: Window Capture + Chroma Key */}
      <div
        className={`space-y-2 font-sans pt-4 mt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
      >
        <h5 className={`text-[11px] font-bold ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
          {t.rightSidebar.obsAltTitle}
        </h5>
        <button
          id="obs-chromakey-shortcut"
          onClick={() => {
            setConfig((prev) => ({ ...prev, backgroundStyle: 'green-screen' }));
            alert(t.rightSidebar.obsAlert);
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
        >
          {t.rightSidebar.obsBtnChroma}
        </button>

        <div className={`space-y-2 pt-2 divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
          {(['1', '2', '3'] as const).map((step) => (
            <div key={step} className="flex gap-2.5 text-[10px] pt-3 text-left">
              <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold font-mono shrink-0 text-[9px]">
                {step}
              </span>
              <div>
                <p className={`font-bold text-[10.5px] ${theme === 'dark' ? 'text-white/90' : 'text-slate-800'}`}>
                  {t.rightSidebar.obsSteps[step].title}
                </p>
                <p
                  className={`mt-0.5 leading-relaxed text-[9px] ${theme === 'dark' ? 'text-[#d1d1d1]/55' : 'text-slate-500'}`}
                >
                  {t.rightSidebar.obsSteps[step].text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
