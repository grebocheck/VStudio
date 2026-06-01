import React, { useState } from 'react';
import { Download, FileCode2, ImageDown } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import {
  avatarExportFileName,
  avatarSvgToPngBlob,
  downloadBlob,
  serializeAvatarSvg,
} from '../lib/avatarExport';

interface AvatarExportPanelProps {
  sourceRef: React.RefObject<SVGSVGElement | null>;
  fileBaseName: string;
}

export const AvatarExportPanel: React.FC<AvatarExportPanelProps> = ({ sourceRef, fileBaseName }) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const copy = t.rightSidebar.avatarExport;
  const [isExporting, setIsExporting] = useState<'png' | 'svg' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getSourceSvg = () => {
    if (!sourceRef.current) {
      throw new Error(copy.notReady);
    }
    return sourceRef.current;
  };

  const exportSvg = () => {
    setError(null);
    setIsExporting('svg');
    try {
      const serialized = serializeAvatarSvg(getSourceSvg(), {
        width: 800,
        height: 800,
        transparent: true,
      });
      downloadBlob(
        new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }),
        avatarExportFileName(fileBaseName, 'svg'),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failed);
    } finally {
      setIsExporting(null);
    }
  };

  const exportPng = async () => {
    setError(null);
    setIsExporting('png');
    try {
      const blob = await avatarSvgToPngBlob(getSourceSvg(), {
        width: 800,
        height: 800,
        transparent: true,
      });
      downloadBlob(blob, avatarExportFileName(fileBaseName, 'png'));
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.failed);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <section className={`space-y-3 rounded-sm border p-4 ${
      theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/70 border-indigo-200'
    }`}>
      <div>
        <h5 className={`text-[11px] font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <Download className="w-4 h-4 text-indigo-500" />
          <span>{copy.title}</span>
        </h5>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1 leading-relaxed">
          {copy.sub}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void exportPng()}
          disabled={isExporting !== null}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ImageDown className="w-3.5 h-3.5" />
          <span>{isExporting === 'png' ? copy.exporting : copy.png}</span>
        </button>
        <button
          type="button"
          onClick={exportSvg}
          disabled={isExporting !== null}
          className={`w-full py-2.5 rounded-sm border font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none ${
            theme === 'dark'
              ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>{isExporting === 'svg' ? copy.exporting : copy.svg}</span>
        </button>
      </div>

      <p className="text-[9px] text-slate-500 dark:text-white/45 font-mono leading-relaxed">
        {copy.note}
      </p>

      {error && (
        <p className="rounded-sm border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
};
