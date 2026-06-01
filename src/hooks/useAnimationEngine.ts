import type React from 'react';
import { useEffect, useRef } from 'react';
import { CameraCalibrationProfile, Emotion, RigParams, TrackingMode } from '../types';
import { MicRefs } from './useMicrophone';
import { FaceTracking } from './useFaceTracking';
import { ActiveEmote } from './useEmotes';
import { classifyEmotion } from '../lib/emotionClassifier';
import { cameraResponseFromSmoothing, expressionResponseFromSmoothing } from '../lib/cameraCalibration';
import { advanceHairPhysics, INITIAL_HAIR_PHYSICS } from '../lib/hairPhysics';
import { shouldPublishRigFrame } from '../lib/avatarFrame';

const ALL_EMOTIONS: Emotion[] = [
  'none',
  'happy',
  'angry',
  'cry',
  'shocked',
  'smug',
  'love',
  'starry',
  'squint',
  'depressed',
  'dizzy',
  'cool',
  'scared',
  'sleepy',
  'shy',
  'relaxed',
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface EngineDeps {
  trackingMode: TrackingMode;
  micActive: boolean;
  mic: MicRefs;
  face: Pick<FaceTracking, 'videoRef' | 'faceLandmarkerRef'>;
  cameraCalibration: CameraCalibrationProfile;
  /** Manual emote override (streamer hotkeys/panel); wins over tracking while active. */
  emoteRef: React.MutableRefObject<ActiveEmote | null>;
  /** Latest rig frame used by the engine between throttled React renders. */
  rigRef: React.MutableRefObject<RigParams>;
  /** Applies transform-only SVG motion on every animation frame. */
  onFrame?: (rig: RigParams) => void;
  setRig: React.Dispatch<React.SetStateAction<RigParams>>;
}

/**
 * Drives every per-frame avatar motion: breathing, procedural blinking,
 * mic-driven mouth flap, AFK auto-look, MediaPipe camera tracking with an
 * emotion classifier, and spring-mass hair physics. All transient state lives
 * in refs so the loop never re-subscribes mid-animation.
 */
export function useAnimationEngine({
  trackingMode,
  micActive,
  mic,
  face,
  cameraCalibration,
  emoteRef,
  rigRef,
  onFrame,
  setRig,
}: EngineDeps): void {
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);
  const lastPublishedAt = useRef(0);
  const onFrameRef = useRef(onFrame);
  const { analyserRef, dataArrayRef } = mic;
  const { videoRef, faceLandmarkerRef } = face;

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  // Blink state machine
  const blinkTimer = useRef(0);
  const isBlinking = useRef(false);
  const blinkPhase = useRef(0); // 0 idle, 1 closing, 2 opening

  // Spring-mass hair physics + angular look memory for inertial drag
  const hairPhysicsRef = useRef(INITIAL_HAIR_PHYSICS);

  // Emotion stabilization / interactive state
  const emotionFrameCountersRef = useRef<Record<string, number>>({});
  const lastStabilizedEmotionRef = useRef<Emotion>('none');
  const emotionLockTimeRef = useRef(0);
  const dizzinessAccumulatorRef = useRef(0);
  const dizzinessLockedUntilRef = useRef(0);
  const drowsinessAccumulatorRef = useRef(0);

  useEffect(() => {
    const cameraResponse = cameraResponseFromSmoothing(cameraCalibration.smoothing);
    const expressionResponse = expressionResponseFromSmoothing(cameraCalibration.smoothing);
    const headSensitivity = cameraCalibration.headSensitivity;
    const expressionSensitivity = cameraCalibration.expressionSensitivity;

    lastTime.current = Date.now();
    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastTime.current;
      lastTime.current = now;
      const timeSec = now / 1000;

      dizzinessAccumulatorRef.current = Math.max(0, dizzinessAccumulatorRef.current - elapsed / 30);
      drowsinessAccumulatorRef.current = Math.max(0, drowsinessAccumulatorRef.current - elapsed / 12);

      const updated = (() => {
        const prev = rigRef.current;
        const updated = { ...prev };
        updated.activeEmotion = 'none';

        // 1. Breathing
        updated.breath = (timeSec * 0.9) % 1.0;

        // 2. Procedural blinking (off in camera mode — eyes are user-driven)
        if (trackingMode !== 'camera') {
          blinkTimer.current += elapsed;
          if (!isBlinking.current && blinkTimer.current > Math.random() * 4000 + 1500) {
            isBlinking.current = true;
            blinkPhase.current = 1;
          }
          if (isBlinking.current) {
            if (blinkPhase.current === 1) {
              updated.eyeLOpen = Math.max(0, updated.eyeLOpen - 0.25);
              updated.eyeROpen = Math.max(0, updated.eyeROpen - 0.25);
              if (updated.eyeLOpen === 0) blinkPhase.current = 2;
            } else if (blinkPhase.current === 2) {
              updated.eyeLOpen = Math.min(1.0, updated.eyeLOpen + 0.22);
              updated.eyeROpen = Math.min(1.0, updated.eyeROpen + 0.22);
              if (updated.eyeLOpen === 1.0) {
                isBlinking.current = false;
                blinkTimer.current = 0;
              }
            }
          }
        }

        // 3. Microphone mouth-flap sync
        if (micActive && analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
          const average = sum / dataArrayRef.current.length;
          const volumeOpenVal = Math.min(1, average / 45);
          updated.mouthOpen = volumeOpenVal;
          updated.mouthForm = 0.5 + volumeOpenVal * 0.4;
        }

        // 4. AFK auto-look
        if (trackingMode === 'auto') {
          updated.angleX = Math.sin(timeSec * 0.6) * 12;
          updated.angleY = Math.cos(timeSec * 0.4) * 6;
          updated.angleZ = Math.sin(timeSec * 0.52) * 5;
          updated.bodyX = Math.sin(timeSec * 0.3) * 6;
          updated.pupilX = Math.sin(timeSec * 0.2) * 0.4;
          updated.pupilY = Math.cos(timeSec * 0.15) * 0.2;
          if (!micActive) updated.mouthOpen = Math.max(0, Math.sin(timeSec * 3) * 0.12);
        }

        // 5. MediaPipe camera tracking + emotion classifier
        const video = videoRef.current;
        const landmarker = faceLandmarkerRef.current;
        if (trackingMode === 'camera' && video && video.readyState >= 2 && video.videoWidth > 0 && landmarker) {
          try {
            const results = landmarker.detectForVideo(video, performance.now());
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              const pLeftCheek = landmarks[234];
              const pRightCheek = landmarks[454];
              const pNose = landmarks[4];
              const pForehead = landmarks[10];
              const pChin = landmarks[152];

              if (pLeftCheek && pRightCheek && pNose && pForehead && pChin) {
                const dx = pRightCheek.x - pLeftCheek.x;
                const dy = pRightCheek.y - pLeftCheek.y;
                const currentRoll = Math.atan2(dy, dx) * (180 / Math.PI);

                const cheekMidX = (pLeftCheek.x + pRightCheek.x) / 2;
                const cheekDist = Math.hypot(pRightCheek.x - pLeftCheek.x, pRightCheek.y - pLeftCheek.y);
                const currentYaw = ((pNose.x - cheekMidX) / (cheekDist || 1)) * -110;

                const faceMidY = (pForehead.y + pChin.y) / 2;
                const verticalHeight = Math.abs(pChin.y - pForehead.y);
                const currentPitch = -((pNose.y - faceMidY) / (verticalHeight || 1) - 0.05) * 90;

                const targetYaw = clamp(currentYaw * headSensitivity - cameraCalibration.yawOffset, -30, 30);
                const targetPitch = clamp(currentPitch * headSensitivity - cameraCalibration.pitchOffset, -20, 20);
                const targetRoll = clamp(currentRoll * headSensitivity - cameraCalibration.rollOffset, -15, 15);

                updated.angleX += (targetYaw - updated.angleX) * cameraResponse;
                updated.angleY += (targetPitch - updated.angleY) * cameraResponse;
                updated.angleZ += (targetRoll - updated.angleZ) * cameraResponse;

                updated.pupilX = (updated.angleX / 30) * 0.75;
                updated.pupilY = (updated.angleY / 20) * 0.55;
                updated.bodyX += (updated.angleX * 0.45 - updated.bodyX) * 0.12;
              }

              if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const categories = results.faceBlendshapes[0].categories;
                const findScore = (name: string) => {
                  const found = categories.find((c: any) => c.categoryName === name || c.displayName === name);
                  return found ? found.score : 0;
                };

                const eyeBlinkLeft = findScore('eyeBlinkLeft');
                const eyeBlinkRight = findScore('eyeBlinkRight');
                const jawOpen = findScore('jawOpen');
                const mouthSmileLeft = findScore('mouthSmileLeft');
                const mouthSmileRight = findScore('mouthSmileRight');
                const mouthPucker = findScore('mouthPucker');
                const browInnerUp = findScore('browInnerUp');
                const browDownLeft = findScore('browDownLeft');
                const browDownRight = findScore('browDownRight');
                const tongueOut = findScore('tongueOut');

                const targetTongueOut = clamp(tongueOut * expressionSensitivity, 0, 1);
                updated.tongueOut =
                  (updated.tongueOut ?? 0) + (targetTongueOut - (updated.tongueOut ?? 0)) * expressionResponse;

                const targetEyeLOpen = clamp(1.0 - eyeBlinkLeft * 1.15 * expressionSensitivity, 0, 1);
                const targetEyeROpen = clamp(1.0 - eyeBlinkRight * 1.15 * expressionSensitivity, 0, 1);
                updated.eyeLOpen += (targetEyeLOpen - updated.eyeLOpen) * expressionResponse;
                updated.eyeROpen += (targetEyeROpen - updated.eyeROpen) * expressionResponse;

                const smileAvg = (mouthSmileLeft + mouthSmileRight) / 2;
                if (!micActive) {
                  const targetMouthOpen = clamp(jawOpen * 1.3 * expressionSensitivity, 0, 1);
                  updated.mouthOpen += (targetMouthOpen - updated.mouthOpen) * expressionResponse;
                  const targetMouthForm = (smileAvg * 1.5 - mouthPucker * 0.8) * expressionSensitivity;
                  const finalMouthForm = clamp(targetMouthForm, -1, 1);
                  updated.mouthForm += (finalMouthForm - updated.mouthForm) * expressionResponse;
                }

                const browUpFactor = browInnerUp * 4.0 * expressionSensitivity;
                const browDownFactor = ((browDownLeft + browDownRight) / 2) * -4.0 * expressionSensitivity;
                const targetEyebrowRange = clamp(browUpFactor + browDownFactor, -5, 5);
                updated.eyebrowY += (targetEyebrowRange - updated.eyebrowY) * expressionResponse;

                const cheekSquintAvg = (findScore('cheekSquintLeft') + findScore('cheekSquintRight')) / 2;
                const blinkAvg = (eyeBlinkLeft + eyeBlinkRight) / 2;
                const angryAvg = (browDownLeft + browDownRight) / 2;
                const puckerAvg = mouthPucker;
                const eyeLookInAvg = (findScore('eyeLookInLeft') + findScore('eyeLookInRight')) / 2;
                const eyeWideAvg = (findScore('eyeWideLeft') + findScore('eyeWideRight')) / 2;
                const eyeLookDownAvg = (findScore('eyeLookDownLeft') + findScore('eyeLookDownRight')) / 2;
                const browOuterUpLeft = findScore('browOuterUpLeft');
                const browOuterUpRight = findScore('browOuterUpRight');
                const browOuterUpAvg = (browOuterUpLeft + browOuterUpRight) / 2;
                const browOuterUpDiff = Math.abs(browOuterUpLeft - browOuterUpRight);

                // Dizziness: only fast deliberate head shaking accumulates
                const headVelocity =
                  Math.abs(updated.angleX - hairPhysicsRef.current.previousAngleX) +
                  Math.abs(updated.angleY - hairPhysicsRef.current.previousAngleY);
                if (headVelocity > 4.0) {
                  dizzinessAccumulatorRef.current = Math.min(100, dizzinessAccumulatorRef.current + headVelocity * 2.5);
                }
                if (dizzinessAccumulatorRef.current > 60) {
                  dizzinessLockedUntilRef.current = Math.max(dizzinessLockedUntilRef.current, now + 2500);
                }
                const isDizzy = now < dizzinessLockedUntilRef.current || eyeLookInAvg > 0.6;

                const pitchCompensation = updated.angleY < 0 ? Math.min(0.35, -updated.angleY / 35) : 0;
                const adjustedAngryAvg = angryAvg - pitchCompensation;

                if (blinkAvg > 0.35 && blinkAvg < 0.9) {
                  drowsinessAccumulatorRef.current = Math.min(120, drowsinessAccumulatorRef.current + 1.0);
                }
                const isTrulySleepy = drowsinessAccumulatorRef.current > 80 && eyeLookDownAvg > 0.4;

                const detected: Emotion = classifyEmotion({
                  jawOpen,
                  browInnerUp,
                  eyeWideAvg,
                  browOuterUpAvg,
                  browOuterUpDiff,
                  cheekSquintAvg,
                  smileAvg,
                  eyeLookDownAvg,
                  angryAvg,
                  adjustedAngryAvg,
                  blinkAvg,
                  puckerAvg,
                  mouthForm: updated.mouthForm,
                  isDizzy,
                  isTrulySleepy,
                });

                // Debounce / hysteresis via per-emotion frame counters
                const counters = emotionFrameCountersRef.current;
                ALL_EMOTIONS.forEach((emo) => {
                  if (counters[emo] === undefined) counters[emo] = 0;
                  counters[emo] = emo === detected ? Math.min(14, counters[emo] + 1) : Math.max(0, counters[emo] - 1);
                });

                const currentTime = Date.now();
                const currentStabilized = lastStabilizedEmotionRef.current;
                let winner = currentStabilized;

                let highConfidenceEmotion: Emotion = 'none';
                let maxCount = 0;
                ALL_EMOTIONS.forEach((emo) => {
                  if (emo !== 'none' && counters[emo] >= 7 && counters[emo] > maxCount) {
                    maxCount = counters[emo];
                    highConfidenceEmotion = emo;
                  }
                });

                const timeSpentInExpression = currentTime - emotionLockTimeRef.current;
                const canTransition =
                  currentStabilized === 'none' ||
                  timeSpentInExpression > 1200 ||
                  (highConfidenceEmotion !== 'none' && counters[highConfidenceEmotion] >= 10);

                if (canTransition) {
                  if (highConfidenceEmotion !== 'none') {
                    if (currentStabilized !== highConfidenceEmotion) {
                      winner = highConfidenceEmotion;
                      emotionLockTimeRef.current = currentTime;
                    }
                  } else if (counters['none'] >= 8 && currentStabilized !== 'none') {
                    winner = 'none';
                    emotionLockTimeRef.current = currentTime;
                  }
                }

                lastStabilizedEmotionRef.current = winner;
                updated.activeEmotion = winner;
              }
            }
          } catch (err) {
            console.error('MediaPipe FaceLandmarker frame detection error:', err);
          }
        }

        // 6. Spring-mass hair physics with look-velocity impulses
        const hairPhysics = advanceHairPhysics(hairPhysicsRef.current, updated);
        hairPhysicsRef.current = hairPhysics;
        updated.hairSwayX = hairPhysics.swayX;
        updated.hairSwayY = hairPhysics.swayY;

        // 7. Manual emote override (streamer hotkeys / panel) wins while active.
        const emote = emoteRef.current;
        if (emote && now < emote.until) {
          updated.activeEmotion = emote.emotion;
        }

        return updated;
      })();

      rigRef.current = updated;
      onFrameRef.current?.(updated);
      if (shouldPublishRigFrame(lastPublishedAt.current, now)) {
        lastPublishedAt.current = now;
        setRig(updated);
      }

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    trackingMode,
    micActive,
    analyserRef,
    dataArrayRef,
    videoRef,
    faceLandmarkerRef,
    cameraCalibration,
    emoteRef,
    rigRef,
    setRig,
  ]);

  // Mouse-driven head tracking
  useEffect(() => {
    if (trackingMode !== 'mouse') return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      const updated = {
        ...rigRef.current,
        angleX: dx * 28,
        angleY: -dy * 16,
        angleZ: dx * -10,
        pupilX: dx * 0.75,
        pupilY: dy * 0.6,
        bodyX: dx * 12,
      };
      rigRef.current = updated;
      onFrameRef.current?.(updated);
      setRig(updated);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trackingMode, rigRef, setRig]);
}
