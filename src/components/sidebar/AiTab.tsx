import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface AiTabProps {
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  aiGenerating: boolean;
  aiError: string | null;
  handleAiGenerate: () => void;
}

export const AiTab: React.FC<AiTabProps> = ({ aiPrompt, setAiPrompt, aiGenerating, aiError, handleAiGenerate }) => {
  const { t, language } = useI18n();
  const en = language === 'en';
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/healthz', { signal: controller.signal })
      .then((response) => response.json())
      .then((health: { ai?: boolean }) => {
        if (typeof health.ai === 'boolean') setAvailable(health.ai);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const { theme } = useTheme();

  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-sm border ${
          theme === 'dark' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-500/5 border-yellow-300'
        }`}
      >
        <h4 className="text-xs font-bold text-yellow-600 dark:text-yellow-500 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>{t.rightSidebar.aiTitle}</span>
        </h4>
        <p className={`text-[10px] leading-relaxed mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
          {t.rightSidebar.aiSub}
        </p>
      </div>

      {available === false && (
        <p className="rounded-lg border border-slate-400/30 p-3 text-xs leading-relaxed" role="status">
          {en
            ? 'AI styling is not connected on this server. You can still build a complete character using the presets and editor.'
            : 'ШІ-стиліст не підключений на цьому сервері. Ви можете створити персонажа за допомогою пресетів і редактора.'}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {(en
          ? [
              'Cosy cat streamer in a lavender hoodie',
              'Forest elf with mint hair and gold eyes',
              'Gothic vampire in black and burgundy',
            ]
          : [
              'Затишна стримерка-кішка в лавандовому худі',
              'Лісовий ельф із м’ятним волоссям і золотими очима',
              'Готична вампірка у чорному та бордовому',
            ]
        ).map((example) => (
          <button
            className="studio-button text-left"
            key={example}
            onClick={() => setAiPrompt(example)}
            disabled={aiGenerating}
          >
            {example}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <textarea
          id="ai-avatar-prompt"
          aria-label={t.rightSidebar.aiPlaceholder}
          value={aiPrompt}
          maxLength={600}
          disabled={aiGenerating}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder={t.rightSidebar.aiPlaceholder}
          className={`w-full text-xs p-3 rounded-sm border placeholder:text-slate-400/55 dark:placeholder:text-white/20 focus:outline-none focus:border-yellow-500/55 h-32 resize-none leading-relaxed font-sans ${
            theme === 'dark'
              ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
              : 'bg-slate-50 text-slate-800 border-slate-205'
          }`}
        />
        <p className="text-right text-xs text-slate-500 dark:text-slate-400">{aiPrompt.length}/600</p>
      </div>

      {aiError && (
        <div
          className="flex items-start space-x-2 p-3 bg-red-950/20 border border-red-500/20 rounded-sm text-red-500 dark:text-red-300 text-[10px]"
          role="alert"
        >
          <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{aiError}</span>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          id="generate-ai-btn"
          onClick={handleAiGenerate}
          disabled={available === false || aiGenerating || !aiPrompt.trim()}
          aria-busy={aiGenerating}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] text-white disabled:opacity-40 font-bold text-xs rounded-sm flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:pointer-events-none uppercase tracking-wider"
        >
          {aiGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>{t.rightSidebar.aiBtnGenerating}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>{t.rightSidebar.aiBtnActive}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
