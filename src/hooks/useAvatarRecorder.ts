import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { drawAvatarSvgToCanvas } from '../lib/avatarExport';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 800;
const DEFAULT_FPS = 30;
const DEFAULT_VIDEO_BITRATE = 5_000_000;
const GIF_WIDTH = 400;
const GIF_HEIGHT = 400;
const GIF_FPS = 12;
const GIF_DURATION_MS = 2000;
const GIF_FRAME_DELAY_MS = 1000 / GIF_FPS;

export interface RecordedClip {
  url: string;
  sizeBytes: number;
  durationMs: number;
  mimeType: string;
}

export interface AvatarRecorder {
  isSupported: boolean;
  isRecording: boolean;
  isSaving: boolean;
  isGifEncoding: boolean;
  gifProgress: number;
  elapsedMs: number;
  error: string | null;
  clip: RecordedClip | null;
  gifClip: RecordedClip | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  exportGifClip: () => Promise<void>;
  clearClip: () => void;
  clearGifClip: () => void;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }

  return (
    ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) =>
      MediaRecorder.isTypeSupported(type),
    ) ?? ''
  );
}

export function formatRecordingDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPercent(value: number): string {
  return `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useAvatarRecorder(sourceRef: RefObject<SVGSVGElement | null>): AvatarRecorder {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGifEncoding, setIsGifEncoding] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<RecordedClip | null>(null);
  const [gifClip, setGifClip] = useState<RecordedClip | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const drawingRef = useRef(false);
  const clipUrlRef = useRef<string | null>(null);
  const gifUrlRef = useRef<string | null>(null);

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (typeof MediaRecorder === 'undefined') return false;
    if (typeof HTMLCanvasElement === 'undefined') return false;
    return typeof HTMLCanvasElement.prototype.captureStream === 'function';
  }, []);

  const stopFrameLoop = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  }, []);

  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const clearClip = useCallback(() => {
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    clipUrlRef.current = null;
    setClip(null);
  }, []);

  const clearGifClip = useCallback(() => {
    if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current);
    gifUrlRef.current = null;
    setGifClip(null);
    setGifProgress(0);
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.requestData();
      recorder.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('MediaRecorder is not supported in this browser.');
      return;
    }

    const sourceSvg = sourceRef.current;
    if (!sourceSvg) {
      setError('Avatar SVG is not mounted yet.');
      return;
    }

    clearClip();
    setError(null);
    setElapsedMs(0);
    setIsSaving(false);

    const canvas = document.createElement('canvas');
    canvas.width = DEFAULT_WIDTH;
    canvas.height = DEFAULT_HEIGHT;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      setError('Could not create recording canvas.');
      return;
    }

    try {
      await drawAvatarSvgToCanvas(sourceSvg, canvas, ctx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render the first frame.');
      return;
    }

    const stream = canvas.captureStream(DEFAULT_FPS);
    canvasStreamRef.current = stream;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: DEFAULT_VIDEO_BITRATE,
    });

    chunksRef.current = [];
    recorderRef.current = recorder;
    startTimeRef.current = performance.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onerror = () => {
      setError('Recording failed. Try a shorter clip or another browser.');
      stopFrameLoop();
      clearElapsedTimer();
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setIsSaving(false);
    };

    recorder.onstop = () => {
      stopFrameLoop();
      clearElapsedTimer();
      stream.getTracks().forEach((track) => track.stop());
      canvasStreamRef.current = null;
      recorderRef.current = null;
      setIsRecording(false);
      setIsSaving(true);

      const durationMs = performance.now() - startTimeRef.current;
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      chunksRef.current = [];

      if (!blob.size) {
        setError('No video data was captured.');
        setIsSaving(false);
        return;
      }

      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      const url = URL.createObjectURL(blob);
      clipUrlRef.current = url;
      setClip({ url, sizeBytes: blob.size, durationMs, mimeType: blob.type || 'video/webm' });
      setElapsedMs(durationMs);
      setIsSaving(false);
    };

    let lastFrameAt = 0;
    const frameInterval = 1000 / DEFAULT_FPS;
    const drawLoop = (now: number) => {
      if (recorder.state === 'recording') {
        if (!drawingRef.current && now - lastFrameAt >= frameInterval) {
          lastFrameAt = now;
          drawingRef.current = true;
          void drawAvatarSvgToCanvas(sourceSvg, canvas, ctx)
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to render SVG frame.'))
            .finally(() => {
              drawingRef.current = false;
            });
        }
        frameIdRef.current = requestAnimationFrame(drawLoop);
      }
    };

    recorder.start(250);
    setIsRecording(true);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startTimeRef.current);
    }, 100);
    frameIdRef.current = requestAnimationFrame(drawLoop);
  }, [clearClip, clearElapsedTimer, isSupported, sourceRef, stopFrameLoop]);

  const exportGifClip = useCallback(async () => {
    const sourceSvg = sourceRef.current;
    if (!sourceSvg) {
      setError('Avatar SVG is not mounted yet.');
      return;
    }

    clearGifClip();
    setError(null);
    setIsGifEncoding(true);
    setGifProgress(0);

    const startedAt = performance.now();
    const canvas = document.createElement('canvas');
    canvas.width = GIF_WIDTH;
    canvas.height = GIF_HEIGHT;
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!ctx) {
      setError('Could not create GIF canvas.');
      setIsGifEncoding(false);
      return;
    }

    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const gif = GIFEncoder();
      const frameCount = Math.max(1, Math.round(GIF_DURATION_MS / GIF_FRAME_DELAY_MS));

      for (let frame = 0; frame < frameCount; frame++) {
        const frameStart = performance.now();
        await drawAvatarSvgToCanvas(sourceSvg, canvas, ctx, { transparent: true });

        const imageData = ctx.getImageData(0, 0, GIF_WIDTH, GIF_HEIGHT);
        const palette = quantize(imageData.data, 256, {
          format: 'rgba4444',
          oneBitAlpha: 127,
          clearAlpha: true,
          clearAlphaThreshold: 1,
        });
        const index = applyPalette(imageData.data, palette, 'rgba4444');
        const transparentIndex = palette.findIndex((color) => (color[3] ?? 255) === 0);

        gif.writeFrame(index, GIF_WIDTH, GIF_HEIGHT, {
          palette,
          delay: GIF_FRAME_DELAY_MS,
          repeat: 0,
          transparent: transparentIndex >= 0,
          transparentIndex: transparentIndex >= 0 ? transparentIndex : 0,
          dispose: transparentIndex >= 0 ? 2 : -1,
        });

        setGifProgress((frame + 1) / frameCount);

        const renderTime = performance.now() - frameStart;
        if (frame < frameCount - 1) {
          await wait(Math.max(0, GIF_FRAME_DELAY_MS - renderTime));
        }
      }

      gif.finish();
      const bytes = gif.bytes();
      const blob = new Blob([bytes], { type: 'image/gif' });
      if (!blob.size) throw new Error('No GIF data was encoded.');

      if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current);
      const url = URL.createObjectURL(blob);
      gifUrlRef.current = url;
      setGifClip({
        url,
        sizeBytes: blob.size,
        durationMs: performance.now() - startedAt,
        mimeType: 'image/gif',
      });
      setGifProgress(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GIF export failed.');
    } finally {
      setIsGifEncoding(false);
    }
  }, [clearGifClip, sourceRef]);

  useEffect(() => {
    return () => {
      stopFrameLoop();
      clearElapsedTimer();
      canvasStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current);
    };
  }, [clearElapsedTimer, stopFrameLoop]);

  return {
    isSupported,
    isRecording,
    isSaving,
    isGifEncoding,
    gifProgress,
    elapsedMs,
    error,
    clip,
    gifClip,
    startRecording,
    stopRecording,
    exportGifClip,
    clearClip,
    clearGifClip,
  };
}
