import { useCallback, useState } from 'react';
import type React from 'react';
import { AvatarConfig, RigParams } from '../types';

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

export function useAiGenerate({ mergeIntoConfig, setRig }: AiGenerateDeps): AiGenerate {
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
        throw new Error(
          isRecord(data) && typeof data.error === 'string' ? data.error : 'Не вдалося згенерувати аватар з ШІ.',
        );
      }
      if (!isRecord(data)) {
        throw new Error('ШІ повернув некоректну конфігурацію аватара.');
      }

      mergeIntoConfig(data as Partial<AvatarConfig>);
      setRig((prev) => ({ ...prev, mouthForm: 0.9, mouthOpen: 0.15, eyebrowY: 2, angleY: 5 }));
      setPrompt('');
    } catch (err) {
      console.error('AI avatar generation failed:', err);
      setError(err instanceof Error ? err.message : 'Синтаксична помилка.');
    } finally {
      setGenerating(false);
    }
  }, [mergeIntoConfig, prompt, setRig]);

  return {
    prompt,
    setPrompt,
    generating,
    error,
    generate,
  };
}
