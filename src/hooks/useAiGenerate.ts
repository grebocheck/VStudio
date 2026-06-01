import { useCallback, useState } from 'react';
import type React from 'react';
import { AvatarConfig, RigParams } from '../types';
import { useI18n } from '../i18n';
import type { en } from '../i18n/en';

interface AiGenerateDeps {
  mergeIntoConfig: (partial: Partial<AvatarConfig>) => void;
  setRig: React.Dispatch<React.SetStateAction<RigParams>>;
}

interface AiGenerate {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  generating: boolean;
  error: string | null;
  generate: () => Promise<void>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Maps a failed AI response body to a localized message. The server returns a
 * stable `code` (and optional interpolation values such as `max`) so the UI,
 * not the server, owns the user-facing wording in each language.
 */
function resolveServerError(data: unknown, errors: (typeof en)['errors']): string {
  const messages = errors as Record<string, string>;
  if (isRecord(data) && typeof data.code === 'string' && messages[data.code]) {
    const template = messages[data.code];
    return typeof data.max === 'number' ? template.replace('{max}', String(data.max)) : template;
  }
  if (isRecord(data) && typeof data.error === 'string') return data.error;
  return errors.generate_failed;
}

export function useAiGenerate({ mergeIntoConfig, setRig }: AiGenerateDeps): AiGenerate {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/generate-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        setError(resolveServerError(data, t.errors));
        return;
      }
      if (!isRecord(data)) {
        setError(t.errors.invalid_config);
        return;
      }

      mergeIntoConfig(data as Partial<AvatarConfig>);
      setRig((prev) => ({ ...prev, mouthForm: 0.9, mouthOpen: 0.15, eyebrowY: 2, angleY: 5 }));
      setPrompt('');
    } catch (err) {
      console.error('AI avatar generation failed:', err);
      setError(t.errors.network);
    } finally {
      setGenerating(false);
    }
  }, [mergeIntoConfig, prompt, setRig, t]);

  return {
    prompt,
    setPrompt,
    generating,
    error,
    generate,
  };
}
