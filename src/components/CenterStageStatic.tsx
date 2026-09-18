import React from 'react';
import { EMOTES } from '../hooks/useEmotes';
import { useI18n } from '../i18n';
import { useTheme, type Theme } from '../theme/ThemeContext';
import { AvatarConfig, Emotion } from '../types';
import { User } from 'lucide-react';

interface StageBackdropProps {
  backgroundStyle: AvatarConfig['backgroundStyle'];
  theme: Theme;
}

export const StageBackdrop = React.memo(({ backgroundStyle, theme }: StageBackdropProps) => (
  <>
    {backgroundStyle === 'green-screen' ? (
      <div className="absolute inset-0 bg-[#00ff00]" />
    ) : backgroundStyle === 'nebula' ? (
      <div className="absolute inset-0 bg-gradient-to-tr from-[#12071f] via-[#080314] to-[#04081c]">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-15" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse" />
      </div>
    ) : backgroundStyle === 'gaming' ? (
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0512] via-[#06040a] to-[#010a12]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse" />
      </div>
    ) : (
      <div
        className={`absolute inset-0 bg-gradient-to-b ${
          theme === 'dark' ? 'from-[#141419] to-[#07070a]' : 'from-slate-200/30 to-slate-100'
        }`}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-indigo-500/5 to-transparent filter blur-md" />
      </div>
    )}

    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04]"
      style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '24px 24px' }}
    />
  </>
));

interface EmoteTriggerBarProps {
  activeEmote: Emotion | null;
  onEmote: (emotion: Emotion) => void;
}

export const EmoteTriggerBar = React.memo(({ activeEmote, onEmote }: EmoteTriggerBarProps) => {
  const { t, language } = useI18n();
  return (
    <section className="expression-panel" id="emote-trigger-bar" aria-label={t.centerStage.emotesTitle}>
      <div className="expression-heading">
        <h3>{language === 'en' ? 'A mood for every moment' : 'Настрій на кожну мить'}</h3>
        <span>{language === 'en' ? 'Try keys 1–9' : 'Клавіші 1–9'}</span>
      </div>
      <div className="expression-buttons">
        {EMOTES.map((emote) => (
          <button
            key={emote.emotion}
            onClick={() => onEmote(emote.emotion)}
            title={`${(t.centerStage.emotes as Record<string, string>)[emote.emotion]} (${emote.key})`}
            aria-label={(t.centerStage.emotes as Record<string, string>)[emote.emotion]}
            aria-pressed={activeEmote === emote.emotion}
          >
            <span>{emote.icon}</span>
            <small>{(t.centerStage.emotes as Record<string, string>)[emote.emotion]}</small>
          </button>
        ))}
      </div>
    </section>
  );
});

interface CharacterDossierProps {
  name: string;
  lore: string;
}

export const CharacterDossier = React.memo(({ name, lore }: CharacterDossierProps) => {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <div
      className={`p-5 rounded-lg border relative overflow-hidden shadow-xl ${
        theme === 'dark' ? 'bg-[#0f0f12] border-white/10 text-[#d1d1d1]/85' : 'bg-white border-slate-200 text-slate-700'
      }`}
      id="character-lore-dossier-card"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl" />

      <div className="flex items-center space-x-2 text-slate-600 dark:text-white/65 text-[10px] uppercase font-bold tracking-widest mb-3">
        <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span>{t.centerStage.dossierTitle}</span>
      </div>

      <h2 className="text-base font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
        <span>{name}</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-sm uppercase tracking-wide">
          {t.centerStage.liveIndicator}
        </span>
      </h2>

      <p
        className={`text-xs leading-relaxed font-sans italic border-l-2 border-indigo-500/40 pl-3.5 mt-3 ${
          theme === 'dark' ? 'text-[#d1d1d1]/85' : 'text-slate-600'
        }`}
      >
        "{lore}"
      </p>
    </div>
  );
});
