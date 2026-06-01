import React from 'react';
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
  const { t } = useI18n();
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

      <div className="space-y-2">
        <textarea
          id="ai-avatar-prompt"
          aria-label={t.rightSidebar.aiPlaceholder}
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder={t.rightSidebar.aiPlaceholder}
          className={`w-full text-xs p-3 rounded-sm border placeholder:text-slate-400/55 dark:placeholder:text-white/20 focus:outline-none focus:border-yellow-500/55 h-32 resize-none leading-relaxed font-sans ${
            theme === 'dark'
              ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
              : 'bg-slate-50 text-slate-800 border-slate-205'
          }`}
        />
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
          disabled={aiGenerating || !aiPrompt.trim()}
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
