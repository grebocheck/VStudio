import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Emotion } from '../types';

export interface EmoteDef {
  emotion: Emotion;
  /** Keyboard digit (1-9) that triggers this emote. */
  key: string;
  /** Emoji shown on the panel button. */
  icon: string;
}

/** Curated streamer-facing emotes mapped to number keys. */
export const EMOTES: EmoteDef[] = [
  { emotion: 'happy', key: '1', icon: '😄' },
  { emotion: 'love', key: '2', icon: '😍' },
  { emotion: 'starry', key: '3', icon: '🤩' },
  { emotion: 'smug', key: '4', icon: '😏' },
  { emotion: 'shocked', key: '5', icon: '😲' },
  { emotion: 'angry', key: '6', icon: '😠' },
  { emotion: 'cry', key: '7', icon: '😭' },
  { emotion: 'cool', key: '8', icon: '😎' },
  { emotion: 'dizzy', key: '9', icon: '😵' },
];

const DEFAULT_DURATION_MS = 2500;

export interface ActiveEmote {
  emotion: Emotion;
  until: number;
}

export interface EmotesApi {
  /** Currently held emote (for UI highlight), or null. */
  activeEmote: Emotion | null;
  /** Trigger an emote for `durationMs`; same emote again clears it (toggle). */
  triggerEmote: (emotion: Emotion, durationMs?: number) => void;
  /** Stable ref the animation engine reads each frame to override the emotion. */
  emoteRef: React.MutableRefObject<ActiveEmote | null>;
}

/**
 * Manual emote control for streamers: a panel + number-key hotkeys force the
 * avatar's expression for a short window, overriding tracking/idle emotion.
 * The active emote lives in a ref so the per-frame engine never re-subscribes.
 */
export function useEmotes(): EmotesApi {
  const emoteRef = useRef<ActiveEmote | null>(null);
  const [activeEmote, setActiveEmote] = useState<Emotion | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerEmote = useCallback((emotion: Emotion, durationMs = DEFAULT_DURATION_MS) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);

    // Toggle off if the same emote is already held.
    if (emoteRef.current && emoteRef.current.emotion === emotion && Date.now() < emoteRef.current.until) {
      emoteRef.current = null;
      setActiveEmote(null);
      return;
    }

    emoteRef.current = { emotion, until: Date.now() + durationMs };
    setActiveEmote(emotion);
    clearTimer.current = setTimeout(() => {
      emoteRef.current = null;
      setActiveEmote(null);
    }, durationMs);
  }, []);

  // Number-key hotkeys (ignored while typing in an input/textarea).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const def = EMOTES.find((em) => em.key === e.key);
      if (def) {
        e.preventDefault();
        triggerEmote(def.emotion);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerEmote]);

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    [],
  );

  return { activeEmote, triggerEmote, emoteRef };
}
