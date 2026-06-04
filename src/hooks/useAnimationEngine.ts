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
import {
  AUTO_LOOK,
  BLINK,
  BREATHING,
  CAMERA,
  DIZZINESS,
  DROWSINESS,
  EMOTION_STABILIZATION,
  EXPRESSION,
  MIC,
  MOUSE,
  PITCH_COMPENSATION,
} from '../engine/constants';

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
  const previousCheekDistRef = useRef<number | null>(null);
  const starryTriggeredUntilRef = useRef<number>(0);

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

      dizzinessAccumulatorRef.current = Math.max(
        0,
        dizzinessAccumulatorRef.current - elapsed / DIZZINESS.DECAY_DIVISOR,
      );
      drowsinessAccumulatorRef.current = Math.max(
        0,
        drowsinessAccumulatorRef.current - elapsed / DROWSINESS.DECAY_DIVISOR,
      );

      const updated = (() => {
        const prev = rigRef.current;
        const updated = { ...prev };
        updated.activeEmotion = 'none';

        // 1. Breathing
        updated.breath = (timeSec * BREATHING.PHASE_SPEED) % 1.0;

        // 2. Procedural blinking (off in camera mode — eyes are user-driven)
        if (trackingMode !== 'camera') {
          blinkTimer.current += elapsed;
          if (!isBlinking.current && blinkTimer.current > Math.random() * BLINK.IDLE_RANDOM_MS + BLINK.IDLE_BASE_MS) {
            isBlinking.current = true;
            blinkPhase.current = 1;
          }
          if (isBlinking.current) {
            if (blinkPhase.current === 1) {
              updated.eyeLOpen = Math.max(0, updated.eyeLOpen - BLINK.CLOSE_STEP);
              updated.eyeROpen = Math.max(0, updated.eyeROpen - BLINK.CLOSE_STEP);
              if (updated.eyeLOpen === 0) blinkPhase.current = 2;
            } else if (blinkPhase.current === 2) {
              updated.eyeLOpen = Math.min(1.0, updated.eyeLOpen + BLINK.OPEN_STEP);
              updated.eyeROpen = Math.min(1.0, updated.eyeROpen + BLINK.OPEN_STEP);
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
          const volumeOpenVal = Math.min(1, average / MIC.VOLUME_FULL_OPEN);
          updated.mouthOpen = volumeOpenVal;
          updated.mouthForm = MIC.FORM_BASE + volumeOpenVal * MIC.FORM_VOLUME_GAIN;
        }

        // 4. AFK auto-look
        if (trackingMode === 'auto') {
          updated.angleX = Math.sin(timeSec * AUTO_LOOK.YAW_FREQ) * AUTO_LOOK.YAW_AMP;
          updated.angleY = Math.cos(timeSec * AUTO_LOOK.PITCH_FREQ) * AUTO_LOOK.PITCH_AMP;
          updated.angleZ = Math.sin(timeSec * AUTO_LOOK.ROLL_FREQ) * AUTO_LOOK.ROLL_AMP;
          updated.bodyX = Math.sin(timeSec * AUTO_LOOK.BODY_FREQ) * AUTO_LOOK.BODY_AMP;
          updated.pupilX = Math.sin(timeSec * AUTO_LOOK.PUPIL_X_FREQ) * AUTO_LOOK.PUPIL_X_AMP;
          updated.pupilY = Math.cos(timeSec * AUTO_LOOK.PUPIL_Y_FREQ) * AUTO_LOOK.PUPIL_Y_AMP;
          if (!micActive)
            updated.mouthOpen = Math.max(0, Math.sin(timeSec * AUTO_LOOK.MOUTH_FREQ) * AUTO_LOOK.MOUTH_AMP);
        }

        if (trackingMode !== 'camera') {
          previousCheekDistRef.current = null;
          starryTriggeredUntilRef.current = 0;
        }

        // 5. MediaPipe camera tracking + emotion classifier
        const video = videoRef.current;
        const landmarker = faceLandmarkerRef.current;
        if (trackingMode === 'camera' && video && video.readyState >= 2 && video.videoWidth > 0 && landmarker) {
          try {
            const results = landmarker.detectForVideo(video, performance.now());
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];
              let isLeaningIn = false;
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

                const elapsedSec = elapsed / 1000;
                if (previousCheekDistRef.current !== null && cheekDist > 0.05 && elapsedSec > 0.001) {
                  const distVelocity = (cheekDist - previousCheekDistRef.current) / elapsedSec;
                  if (distVelocity > 0.22) {
                    starryTriggeredUntilRef.current = now + 2500;
                  }
                }
                previousCheekDistRef.current = cheekDist;
                isLeaningIn = now < starryTriggeredUntilRef.current;
                const currentYaw = ((pNose.x - cheekMidX) / (cheekDist || 1)) * CAMERA.YAW_SCALE;

                const faceMidY = (pForehead.y + pChin.y) / 2;
                const verticalHeight = Math.abs(pChin.y - pForehead.y);
                const currentPitch =
                  -((pNose.y - faceMidY) / (verticalHeight || 1) - CAMERA.PITCH_BIAS) * CAMERA.PITCH_SCALE;

                const targetYaw = clamp(
                  currentYaw * headSensitivity - cameraCalibration.yawOffset,
                  -CAMERA.YAW_LIMIT,
                  CAMERA.YAW_LIMIT,
                );
                const targetPitch = clamp(
                  currentPitch * headSensitivity - cameraCalibration.pitchOffset,
                  -CAMERA.PITCH_LIMIT,
                  CAMERA.PITCH_LIMIT,
                );
                const targetRoll = clamp(
                  currentRoll * headSensitivity - cameraCalibration.rollOffset,
                  -CAMERA.ROLL_LIMIT,
                  CAMERA.ROLL_LIMIT,
                );

                updated.angleX += (targetYaw - updated.angleX) * cameraResponse;
                updated.angleY += (targetPitch - updated.angleY) * cameraResponse;
                updated.angleZ += (targetRoll - updated.angleZ) * cameraResponse;

                updated.pupilX = (updated.angleX / CAMERA.YAW_LIMIT) * CAMERA.PUPIL_X_FACTOR;
                updated.pupilY = (updated.angleY / CAMERA.PITCH_LIMIT) * CAMERA.PUPIL_Y_FACTOR;
                updated.bodyX += (updated.angleX * CAMERA.BODY_FOLLOW - updated.bodyX) * CAMERA.BODY_RESPONSE;
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

                const targetEyeLOpen = clamp(
                  1.0 - eyeBlinkLeft * EXPRESSION.EYE_BLINK_GAIN * expressionSensitivity,
                  0,
                  1,
                );
                const targetEyeROpen = clamp(
                  1.0 - eyeBlinkRight * EXPRESSION.EYE_BLINK_GAIN * expressionSensitivity,
                  0,
                  1,
                );
                updated.eyeLOpen += (targetEyeLOpen - updated.eyeLOpen) * expressionResponse;
                updated.eyeROpen += (targetEyeROpen - updated.eyeROpen) * expressionResponse;

                const smileAvg = (mouthSmileLeft + mouthSmileRight) / 2;
                if (!micActive) {
                  const targetMouthOpen = clamp(jawOpen * EXPRESSION.MOUTH_OPEN_GAIN * expressionSensitivity, 0, 1);
                  updated.mouthOpen += (targetMouthOpen - updated.mouthOpen) * expressionResponse;
                  const targetMouthForm =
                    (smileAvg * EXPRESSION.SMILE_GAIN - mouthPucker * EXPRESSION.PUCKER_GAIN) * expressionSensitivity;
                  const finalMouthForm = clamp(targetMouthForm, -1, 1);
                  updated.mouthForm += (finalMouthForm - updated.mouthForm) * expressionResponse;
                }

                const browUpFactor = browInnerUp * EXPRESSION.BROW_UP_GAIN * expressionSensitivity;
                const browDownFactor =
                  ((browDownLeft + browDownRight) / 2) * -EXPRESSION.BROW_DOWN_GAIN * expressionSensitivity;
                const targetEyebrowRange = clamp(
                  browUpFactor + browDownFactor,
                  -EXPRESSION.BROW_RANGE,
                  EXPRESSION.BROW_RANGE,
                );
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
                if (headVelocity > DIZZINESS.VELOCITY_THRESHOLD) {
                  dizzinessAccumulatorRef.current = Math.min(
                    DIZZINESS.MAX,
                    dizzinessAccumulatorRef.current + headVelocity * DIZZINESS.VELOCITY_GAIN,
                  );
                }
                if (dizzinessAccumulatorRef.current > DIZZINESS.TRIGGER) {
                  dizzinessLockedUntilRef.current = Math.max(dizzinessLockedUntilRef.current, now + DIZZINESS.LOCK_MS);
                }
                const isDizzy = now < dizzinessLockedUntilRef.current || eyeLookInAvg > DIZZINESS.EYE_LOOK_IN_THRESHOLD;

                const pitchCompensation =
                  updated.angleY < 0
                    ? Math.min(PITCH_COMPENSATION.MAX, -updated.angleY / PITCH_COMPENSATION.DIVISOR)
                    : 0;
                const adjustedAngryAvg = angryAvg - pitchCompensation;

                if (blinkAvg > DROWSINESS.BLINK_MIN && blinkAvg < DROWSINESS.BLINK_MAX) {
                  drowsinessAccumulatorRef.current = Math.min(
                    DROWSINESS.MAX,
                    drowsinessAccumulatorRef.current + DROWSINESS.GAIN,
                  );
                }
                const isTrulySleepy =
                  drowsinessAccumulatorRef.current > DROWSINESS.TRIGGER &&
                  eyeLookDownAvg > DROWSINESS.EYE_LOOK_DOWN_THRESHOLD;

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
                  isLeaningIn,
                });

                // Debounce / hysteresis via per-emotion frame counters
                const counters = emotionFrameCountersRef.current;
                ALL_EMOTIONS.forEach((emo) => {
                  if (counters[emo] === undefined) counters[emo] = 0;
                  counters[emo] =
                    emo === detected
                      ? Math.min(EMOTION_STABILIZATION.COUNTER_MAX, counters[emo] + 1)
                      : Math.max(0, counters[emo] - 1);
                });

                const currentTime = Date.now();
                const currentStabilized = lastStabilizedEmotionRef.current;
                let winner = currentStabilized;

                let highConfidenceEmotion: Emotion = 'none';
                let maxCount = 0;
                ALL_EMOTIONS.forEach((emo) => {
                  if (
                    emo !== 'none' &&
                    counters[emo] >= EMOTION_STABILIZATION.CONFIDENCE_THRESHOLD &&
                    counters[emo] > maxCount
                  ) {
                    maxCount = counters[emo];
                    highConfidenceEmotion = emo;
                  }
                });

                const timeSpentInExpression = currentTime - emotionLockTimeRef.current;
                const canTransition =
                  currentStabilized === 'none' ||
                  timeSpentInExpression > EMOTION_STABILIZATION.MIN_DWELL_MS ||
                  (highConfidenceEmotion !== 'none' &&
                    counters[highConfidenceEmotion] >= EMOTION_STABILIZATION.STRONG_CONFIDENCE);

                if (canTransition) {
                  if (highConfidenceEmotion !== 'none') {
                    if (currentStabilized !== highConfidenceEmotion) {
                      winner = highConfidenceEmotion;
                      emotionLockTimeRef.current = currentTime;
                    }
                  } else if (counters['none'] >= EMOTION_STABILIZATION.NONE_THRESHOLD && currentStabilized !== 'none') {
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
        angleX: dx * MOUSE.YAW,
        angleY: -dy * MOUSE.PITCH,
        angleZ: dx * MOUSE.ROLL,
        pupilX: dx * MOUSE.PUPIL_X,
        pupilY: dy * MOUSE.PUPIL_Y,
        bodyX: dx * MOUSE.BODY_X,
      };
      rigRef.current = updated;
      onFrameRef.current?.(updated);
      setRig(updated);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trackingMode, rigRef, setRig]);
}
