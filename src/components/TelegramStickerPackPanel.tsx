import React from 'react';
import { BadgeCheck, Download, Package, Sparkles } from 'lucide-react';
import { AvatarConfig } from '../types';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { downloadBlob } from '../lib/avatarExport';
import {
  createTelegramStickerPack,
  TELEGRAM_STICKER_DURATION_SECONDS,
  TELEGRAM_STICKER_FPS,
  TELEGRAM_STICKER_MAX_TGS_BYTES,
  TELEGRAM_STICKER_SIZE,
  TELEGRAM_STICKER_SPECS,
} from '../lib/telegramStickers';

interface TelegramStickerPackPanelProps {
  config: AvatarConfig;
  fileBaseName: string;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

export const TelegramStickerPackPanel: React.FC<TelegramStickerPackPanelProps> = ({ config, fileBaseName }) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const copy = t.rightSidebar.telegramStickers;
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastExport, setLastExport] = React.useState<{ count: number; maxSize: number } | null>(null);

  const exportPack = async () => {
    setError(null);
    setIsExporting(true);
    try {
      const pack = await createTelegramStickerPack(config, fileBaseName);
      downloadBlob(pack.zipBlob, pack.fileName);
      setLastExport({
        count: pack.manifest.stickers.length,
        maxSize: Math.max(...pack.manifest.stickers.map((sticker) => sticker.sizeBytes)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failed);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section
      className={`space-y-3 rounded-sm border p-4 ${
        theme === 'dark' ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50/70 border-sky-200'
      }`}
    >
      <div>
        <h5
          className={`text-[11px] font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          <Sparkles className="w-4 h-4 text-sky-500" />
          <span>{copy.title}</span>
        </h5>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1 leading-relaxed">{copy.sub}</p>
      </div>

      <div
        className={`grid grid-cols-2 gap-2 text-center font-mono text-[9px] ${
          theme === 'dark' ? 'text-white/55' : 'text-slate-500'
        }`}
      >
        <div
          className={`rounded-sm border px-2 py-2 ${theme === 'dark' ? 'border-white/10 bg-black/15' : 'border-slate-200 bg-white/70'}`}
        >
          <span className="block uppercase tracking-wider">{copy.format}</span>
          <strong className="block mt-1 text-slate-800 dark:text-white/85">TGS/Lottie</strong>
        </div>
        <div
          className={`rounded-sm border px-2 py-2 ${theme === 'dark' ? 'border-white/10 bg-black/15' : 'border-slate-200 bg-white/70'}`}
        >
          <span className="block uppercase tracking-wider">{copy.canvas}</span>
          <strong className="block mt-1 text-slate-800 dark:text-white/85">
            {TELEGRAM_STICKER_SIZE}x{TELEGRAM_STICKER_SIZE}
          </strong>
        </div>
        <div
          className={`rounded-sm border px-2 py-2 ${theme === 'dark' ? 'border-white/10 bg-black/15' : 'border-slate-200 bg-white/70'}`}
        >
          <span className="block uppercase tracking-wider">{copy.animation}</span>
          <strong className="block mt-1 text-slate-800 dark:text-white/85">
            {TELEGRAM_STICKER_DURATION_SECONDS}s / {TELEGRAM_STICKER_FPS}fps
          </strong>
        </div>
        <div
          className={`rounded-sm border px-2 py-2 ${theme === 'dark' ? 'border-white/10 bg-black/15' : 'border-slate-200 bg-white/70'}`}
        >
          <span className="block uppercase tracking-wider">{copy.background}</span>
          <strong className="block mt-1 text-emerald-600 dark:text-emerald-400">{copy.transparent}</strong>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {TELEGRAM_STICKER_SPECS.map((spec) => (
          <div
            key={spec.slug}
            className={`rounded-sm border px-2 py-1.5 text-[10px] font-semibold flex items-center gap-1.5 ${
              theme === 'dark' ? 'border-white/10 bg-white/5 text-white/75' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <span>{spec.emoji}</span>
            <span className="truncate">{spec.label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void exportPack()}
        disabled={isExporting}
        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
      >
        {isExporting ? <Package className="w-3.5 h-3.5 animate-pulse" /> : <Download className="w-3.5 h-3.5" />}
        <span>{isExporting ? copy.exporting : copy.download}</span>
      </button>

      <p className="text-[9px] text-slate-500 dark:text-white/45 font-mono leading-relaxed">
        {copy.note.replace('{max}', formatBytes(TELEGRAM_STICKER_MAX_TGS_BYTES))}
      </p>

      {lastExport && (
        <p
          className="rounded-sm border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5"
          role="status"
        >
          <BadgeCheck className="w-3.5 h-3.5" />
          <span>
            {copy.ready.replace('{count}', String(lastExport.count)).replace('{size}', formatBytes(lastExport.maxSize))}
          </span>
        </p>
      )}

      {error && (
        <p
          className="rounded-sm border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-600 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );
};
