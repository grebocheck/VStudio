import type React from 'react';
import { useEffect, useRef, useState } from 'react';

const MODEL_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_ASSET =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export interface FaceTracking {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  /** MediaPipe FaceLandmarker instance (typed loosely to avoid a hard import). */
  faceLandmarkerRef: React.MutableRefObject<any>;
  isModelLoading: boolean;
}

/**
 * While `enabled`, opens the webcam, mounts it onto `videoRef`, and lazily
 * loads the MediaPipe FaceLandmarker (kept across toggles). The animation
 * engine reads `videoRef`/`faceLandmarkerRef` each frame. `onError` fires if
 * the camera can't be opened so the caller can fall back to another mode.
 */
export function useFaceTracking(enabled: boolean, onError?: (err: unknown) => void): FaceTracking {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<any>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraStreamRef.current = stream;

        // Wait for the <video> element to mount (avoids a render race).
        let attempts = 0;
        while (!videoRef.current && attempts < 15 && !cancelled) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
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
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    };
  }, [enabled]);

  return { videoRef, faceLandmarkerRef, isModelLoading };
}
