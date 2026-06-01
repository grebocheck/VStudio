import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const MODEL_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_ASSET =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export interface FaceTracking {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  /** MediaPipe FaceLandmarker instance (typed loosely to avoid a hard import). */
  faceLandmarkerRef: React.MutableRefObject<any>;
  isModelLoading: boolean;
  devices: MediaDeviceInfo[];
  refreshDevices: () => Promise<void>;
}

/**
 * While `enabled`, opens the webcam, mounts it onto `videoRef`, and lazily
 * loads the MediaPipe FaceLandmarker (kept across toggles). The animation
 * engine reads `videoRef`/`faceLandmarkerRef` each frame. `onError` fires if
 * the camera can't be opened so the caller can fall back to another mode.
 */
export function useFaceTracking(enabled: boolean, deviceId: string, onError?: (err: unknown) => void): FaceTracking {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      setDevices([]);
      return;
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices.filter((device) => device.kind === 'videoinput'));
    } catch (err) {
      console.error('Failed to enumerate camera devices:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.addEventListener) return;

    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let attachedVideo: HTMLVideoElement | null = null;

    (async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API is not available in this browser.');
        }

        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 320 },
          height: { ideal: 240 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' as const }),
        };
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraStreamRef.current = stream;
        void refreshDevices();

        // Wait for the <video> element to mount (avoids a render race).
        let attempts = 0;
        while (!videoRef.current && attempts < 15 && !cancelled) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          attachedVideo = videoRef.current;
          attachedVideo.srcObject = stream;
          attachedVideo.onloadedmetadata = () => {
            attachedVideo?.play().catch(() => {});
          };
        }

        if (!faceLandmarkerRef.current) {
          setIsModelLoading(true);
          try {
            const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
            const filesetResolver = await FilesetResolver.forVisionTasks(MODEL_WASM);
            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
              baseOptions: { modelAssetPath: MODEL_ASSET, delegate: 'GPU' },
              runningMode: 'VIDEO',
              outputFaceBlendshapes: true,
              outputFacialTransformationMatrixes: false,
            });
          } catch (e) {
            console.error('Failed to load MediaPipe FaceLandmarker:', e);
          } finally {
            if (!cancelled) setIsModelLoading(false);
          }
        }
      } catch (err) {
        console.error('Webcam tracking activation failed:', err);
        onErrorRef.current?.(err);
      }
    })();

    return () => {
      cancelled = true;
      if (attachedVideo && attachedVideo.srcObject === cameraStreamRef.current) {
        attachedVideo.srcObject = null;
      }
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    };
  }, [deviceId, enabled, refreshDevices]);

  return { videoRef, faceLandmarkerRef, isModelLoading, devices, refreshDevices };
}
