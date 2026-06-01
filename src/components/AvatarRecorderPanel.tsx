import React from 'react';
import { Download, Trash2, Video, Square } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes, formatRecordingDuration, useAvatarRecorder } from '../hooks/useAvatarRecorder';
import { avatarExportFileName } from '../lib/avatarExport';

interface AvatarRecorderPanelProps {
  sourceRef: React.RefObject<SVGSVGElement | null>;
  fileBaseName: string;
}

export const AvatarRecorderPanel: React.FC<AvatarRecorderPanelProps> = ({ sourceRef, fileBaseName }) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const recorder = useAvatarRecorder(sourceRef);
  const copy = t.rightSidebar.recording;
  const downloadName = avatarExportFileName(fileBaseName, 'webm');

  return (
    <section className={`space-y-3 rounded-sm border p-4 ${
      theme === 'dark' ? 'bg-fuchsia-500/5 border-fuchsia-500/20' : 'bg-fuchsia-50/70 border-fuchsia-200'
    }`}>
      <div>
        <h5 className={`text-[11px] font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <Video className="w-4 h-4 text-fuchsia-500" />
          <span>{copy.title}</span>
        </h5>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1 leading-relaxed">
          {copy.sub}
        </p>
      </div>

      <div className={`grid grid-cols-3 gap-2 text-center font-mono text-[9px] ${
        theme === 'dark' ? 'text-white/55' : 'text-slate-500'
      }`}>
        <div className={`rounded-sm border px-2 py-2 ${theme === 'dark' ? 'border-white/10 bg-black/15' : 'border-slate-200 bg-white/70'}`}>
          <span className="block uppercase tracking-wider">{copy.status}</span>
          <strong className={`block mt-1 ${recorder.isRecording ? 'text-rose-500 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {recorder.isRecording ? copy.recording : recorder.clip ? copy.ready : copy.idle}
          </strong>
        </div>
        <div className={`rounded-sm border px-2 py-2 ${theme === 'dark' ? 'border-white/10 bg-black/15' : 'border-slate-200 bg-white/70'}`}>
          <span className="block uppercase tracking-wider">{copy.duration}</span>
          <strong className="block mt-1 text-slate-800 dark:text-white/85">
            {formatRecordingDuration(recorder.elapsedMs)}
          </strong>
        </div>
        <div className={`rounded-sm border px-2 py-2 ${theme === 'dark' ? 'border-white/10 bg-black/15' : 'border-slate-200 bg-white/70'}`}>
          <span className="block uppercase tracking-wider">{copy.format}</span>
          <strong className="block mt-1 text-slate-800 dark:text-white/85">WebM</strong>
        </div>
      </div>

      {!recorder.isSupported && (
        <p className="rounded-sm border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-700 dark:text-amber-300">
          {copy.unsupported}
        </p>
      )}

      {recorder.error && (
        <p className="rounded-sm border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[10px] text-rose-600 dark:text-rose-300">
          {recorder.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {recorder.isRecording ? (
          <button
            type="button"
            onClick={recorder.stopRecording}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{copy.stop}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void recorder.startRecording()}
            disabled={!recorder.isSupported || recorder.isSaving}
            className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{recorder.isSaving ? copy.saving : copy.start}</span>
          </button>
        )}

        {recorder.clip ? (
          <a
            href={recorder.clip.url}
            download={downloadName}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{copy.download}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 bg-slate-400/40 text-white/70 rounded-sm font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{copy.download}</span>
          </button>
        )}
      </div>

      {recorder.clip && (
        <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 dark:text-white/50">
          <span>{formatBytes(recorder.clip.sizeBytes)} · {formatRecordingDuration(recorder.clip.durationMs)}</span>
          <button
            type="button"
            onClick={recorder.clearClip}
            className="text-rose-600 dark:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>{copy.clear}</span>
          </button>
        </div>
      )}
    </section>
  );
};
