import { useEffect, useState } from 'react';

const DEFAULT_SAMPLE_WINDOW_MS = 1_000;

export function calculateFps(frameCount: number, elapsedMs: number): number {
  if (frameCount <= 0 || elapsedMs <= 0) return 0;
  return Math.round((frameCount * 10_000) / elapsedMs) / 10;
}

export function useFpsMeter(sampleWindowMs = DEFAULT_SAMPLE_WINDOW_MS): number | null {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    let animationFrameId = 0;
    let frameCount = 0;
    let sampleStartedAt = performance.now();

    const measure = (now: number) => {
      frameCount += 1;
      const elapsedMs = now - sampleStartedAt;

      if (elapsedMs >= sampleWindowMs) {
        setFps(calculateFps(frameCount, elapsedMs));
        frameCount = 0;
        sampleStartedAt = now;
      }

      animationFrameId = requestAnimationFrame(measure);
    };

    animationFrameId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animationFrameId);
  }, [sampleWindowMs]);

  return fps;
}
