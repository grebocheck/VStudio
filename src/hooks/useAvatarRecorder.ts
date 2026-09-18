import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { drawAvatarLiveFrameToCanvas } from '../lib/avatarExport';

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

export function gifFrameDelay(fromMs: number, toMs: number): number {
  return Math.max(10, (Math.round(toMs / 10) - Math.round(fromMs / 10)) * 10);
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
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clipUrlRef = useRef<string | null>(null);
  const gifUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const operationRef = useRef(0);
  const busyRef = useRef(false);
  const cancelOperation = useCallback(() => {
    operationRef.current++;
  }, []);

  const isSupported = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof HTMLCanvasElement !== 'undefined' &&
      typeof HTMLCanvasElement.prototype.captureStream === 'function',
    [],
  );
  const stopFrameLoop = useCallback(() => {
    if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);
    frameIdRef.current = null;
  }, []);
  const clearElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = null;
  }, []);
  const releaseStream = useCallback(() => {
    canvasStreamRef.current?.getTracks().forEach((track) => track.stop());
    canvasStreamRef.current = null;
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
    if (!recorder || recorder.state === 'inactive') return;
    stopFrameLoop();
    clearElapsedTimer();
    setIsRecording(false);
    setIsSaving(true);
    // stop() flushes the final dataavailable event before onstop.
    recorder.stop();
  }, [clearElapsedTimer, stopFrameLoop]);

  const startRecording = useCallback(async () => {
    if (busyRef.current) return;
    if (!isSupported) {
      setError('MediaRecorder is not supported in this browser.');
      return;
    }
    if (!sourceRef.current) {
      setError('Avatar is not mounted yet.');
      return;
    }
    busyRef.current = true;
    const operation = ++operationRef.current;
    const active = () => mountedRef.current && operationRef.current === operation;
    clearClip();
    setError(null);
    setElapsedMs(0);
    setIsSaving(true);
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let failed = false;
    const chunks: BlobPart[] = [];
    try {
      const canvas = document.createElement('canvas');
      canvas.width = DEFAULT_WIDTH;
      canvas.height = DEFAULT_HEIGHT;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) throw new Error('Could not create recording canvas.');
      await drawAvatarLiveFrameToCanvas(sourceRef.current, canvas, ctx);
      if (!active()) return;
      stream = canvas.captureStream(DEFAULT_FPS);
      canvasStreamRef.current = stream;
      const mimeType = pickMimeType();
      recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: DEFAULT_VIDEO_BITRATE,
      });
      recorderRef.current = recorder;
      const startedAt = performance.now();
      const finish = () => {
        if (!active()) {
          stream?.getTracks().forEach((track) => track.stop());
          return;
        }
        stopFrameLoop();
        clearElapsedTimer();
        releaseStream();
        recorderRef.current = null;
        busyRef.current = false;
        if (active()) {
          setIsRecording(false);
          setIsSaving(false);
        }
      };
      recorder.ondataavailable = (event) => {
        if (active() && event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        failed = true;
        if (active()) setError('Recording failed. Try a shorter clip or another browser.');
        finish();
      };
      recorder.onstop = () => {
        if (!active() || failed) {
          finish();
          return;
        }
        const durationMs = performance.now() - startedAt;
        const blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'video/webm' });
        finish();
        if (!blob.size) {
          setError('No video data was captured.');
          return;
        }
        const url = URL.createObjectURL(blob);
        clipUrlRef.current = url;
        setClip({ url, sizeBytes: blob.size, durationMs, mimeType: blob.type });
        setElapsedMs(durationMs);
      };
      let lastFrameAt = 0;
      let drawing = false;
      const frameInterval = 1000 / DEFAULT_FPS;
      const drawLoop = (now: number) => {
        if (!active() || recorder?.state !== 'recording') return;
        if (!drawing && now - lastFrameAt >= frameInterval) {
          lastFrameAt = now;
          drawing = true;
          const currentSource = sourceRef.current;
          const frame = currentSource
            ? drawAvatarLiveFrameToCanvas(currentSource, canvas, ctx)
            : Promise.reject(new Error('The live avatar is no longer available.'));
          void frame
            .catch((err) => {
              if (active()) {
                setError(err instanceof Error ? err.message : 'Failed to render a recording frame.');
                stopRecording();
              }
            })
            .finally(() => {
              drawing = false;
            });
        }
        frameIdRef.current = requestAnimationFrame(drawLoop);
      };
      recorder.start(250);
      setIsSaving(false);
      setIsRecording(true);
      elapsedTimerRef.current = setInterval(() => {
        if (active()) setElapsedMs(performance.now() - startedAt);
      }, 100);
      frameIdRef.current = requestAnimationFrame(drawLoop);
    } catch (err) {
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        recorder.onerror = null;
      }
      if (!active()) {
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }
      stopFrameLoop();
      clearElapsedTimer();
      releaseStream();
      recorderRef.current = null;
      if (active()) {
        busyRef.current = false;
        setIsRecording(false);
        setIsSaving(false);
        setError(err instanceof Error ? err.message : 'Could not start recording.');
      }
    }
  }, [clearClip, clearElapsedTimer, isSupported, releaseStream, sourceRef, stopFrameLoop, stopRecording]);

  const exportGifClip = useCallback(async () => {
    if (busyRef.current) return;
    if (!sourceRef.current) {
      setError('Avatar is not mounted yet.');
      return;
    }
    busyRef.current = true;
    const operation = ++operationRef.current;
    const active = () => mountedRef.current && operationRef.current === operation;
    clearGifClip();
    setError(null);
    setIsGifEncoding(true);
    setGifProgress(0);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = GIF_WIDTH;
      canvas.height = GIF_HEIGHT;
      const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
      if (!ctx) throw new Error('Could not create GIF canvas.');
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      if (!active()) return;
      const gif = GIFEncoder();
      const frames: Array<{ pixels: Uint8ClampedArray; at: number }> = [];
      const startedAt = performance.now();
      // Capture a real two-second interval. Slow snapshots reduce frame count,
      // not playback duration; expensive palette encoding happens afterwards.
      while (active()) {
        const at = frames.length ? performance.now() - startedAt : 0;
        if (at >= GIF_DURATION_MS - 5) break;
        const source = sourceRef.current;
        if (!source) throw new Error('The live avatar is no longer available.');
        await drawAvatarLiveFrameToCanvas(source, canvas, ctx);
        if (!active()) return;
        frames.push({ pixels: ctx.getImageData(0, 0, GIF_WIDTH, GIF_HEIGHT).data, at });
        setGifProgress(Math.min(0.65, ((performance.now() - startedAt) / GIF_DURATION_MS) * 0.65));
        await wait(Math.max(0, startedAt + at + GIF_FRAME_DELAY_MS - performance.now()));
      }
      if (!active()) return;
      if (!frames.length) throw new Error('No GIF frames were captured.');
      for (let i = 0; i < frames.length; i++) {
        if (!active()) return;
        const frame = frames[i];
        const palette = quantize(frame.pixels, 255, {
          format: 'rgba4444',
          oneBitAlpha: 127,
          clearAlpha: true,
          clearAlphaThreshold: 1,
        });
        let transparentIndex = palette.findIndex((color) => (color[3] ?? 255) === 0);
        if (transparentIndex < 0) {
          transparentIndex = palette.length;
          palette.push([0, 0, 0, 0]);
        }
        const index = applyPalette(frame.pixels, palette, 'rgba4444');
        for (let pixel = 0; pixel < index.length; pixel++) {
          if (frame.pixels[pixel * 4 + 3] <= 127) index[pixel] = transparentIndex;
        }
        const nextAt = frames[i + 1]?.at ?? GIF_DURATION_MS;
        const delay = gifFrameDelay(frame.at, nextAt);
        gif.writeFrame(index, GIF_WIDTH, GIF_HEIGHT, {
          palette,
          delay,
          repeat: 0,
          transparent: true,
          transparentIndex,
          dispose: 2,
        });
        setGifProgress(0.65 + ((i + 1) / frames.length) * 0.35);
        await wait(0);
      }
      if (!active()) return;
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      if (!blob.size) throw new Error('No GIF data was encoded.');
      const url = URL.createObjectURL(blob);
      gifUrlRef.current = url;
      setGifClip({ url, sizeBytes: blob.size, durationMs: GIF_DURATION_MS, mimeType: 'image/gif' });
      setGifProgress(1);
    } catch (err) {
      if (active()) setError(err instanceof Error ? err.message : 'GIF export failed.');
    } finally {
      if (active()) {
        busyRef.current = false;
        setIsGifEncoding(false);
      }
    }
  }, [clearGifClip, sourceRef]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelOperation();
      busyRef.current = false;
      stopFrameLoop();
      clearElapsedTimer();
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        recorder.onerror = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      recorderRef.current = null;
      releaseStream();
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current);
    };
  }, [cancelOperation, clearElapsedTimer, releaseStream, stopFrameLoop]);

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
