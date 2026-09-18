import type React from 'react';
import { useEffect, useRef } from 'react';
import { CameraCalibrationProfile, Emotion, RigParams, TrackingMode } from '../types';
import { MicRefs } from './useMicrophone';
import { FaceTracking } from './useFaceTracking';
import { ActiveEmote } from './useEmotes';
import { classifyEmotion } from '../lib/emotionClassifier';
import { cameraResponseFromSmoothing, expressionResponseFromSmoothing } from '../lib/cameraCalibration';
import {
  advanceAvatarMotion,
  advanceEmotionTransition,
  createAvatarMotionState,
  MAX_MOTION_ELAPSED_MS,
  responseForElapsed,
} from '../lib/animation/avatarMotion';
import { shouldPublishRigFrame } from '../lib/avatarFrame';
import {
  CAMERA,
  DIZZINESS,
  DROWSINESS,
  EMOTION_STABILIZATION,
  EXPRESSION,
  MIC,
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

  // Gaze intentions, blink schedules and springs share one refresh-rate-independent clock.
  const motionStateRef = useRef<ReturnType<typeof createAvatarMotionState> | null>(null);
  const pointerTargetRef = useRef({ x: 0, y: 0 });

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
    const paused = trackingMode === 'manual' && !micActive;
    const cameraResponseAt60Hz = cameraResponseFromSmoothing(cameraCalibration.smoothing);
    const expressionResponseAt60Hz = expressionResponseFromSmoothing(cameraCalibration.smoothing);
    const headSensitivity = cameraCalibration.headSensitivity;
    const expressionSensitivity = cameraCalibration.expressionSensitivity;

    lastTime.current = Date.now();
    const loop = () => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.min(MAX_MOTION_ELAPSED_MS, now - lastTime.current));
      lastTime.current = now;
      const cameraResponse = responseForElapsed(cameraResponseAt60Hz, elapsed);
      const expressionResponse = responseForElapsed(expressionResponseAt60Hz, elapsed);
      const frameUnits = elapsed / (1000 / 60);

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

        // A paused/manual pose must not keep breathing, blinking or moving its hair.
        // Preserve identity between expression changes so idle frames do no DOM or
        // React work. Slider updates already publish through commitRig themselves.
        if (paused) {
          const emote = emoteRef.current;
          const emotion = emote && now < emote.until ? emote.emotion : 'none';
          return (prev.activeEmotion ?? 'none') === emotion
            ? prev
            : { ...prev, activeEmotion: emotion, emotionStrength: emotion === 'none' ? 0 : 1 };
        }

        // Sample inputs once; the runtime follows targets without input-event pose jumps.
        let voice: number | undefined;
        if (micActive && analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
          const average = sum / dataArrayRef.current.length;
          voice = Math.min(1, average / MIC.VOLUME_FULL_OPEN);
        }
        const motion = advanceAvatarMotion(
          motionStateRef.current ?? createAvatarMotionState(prev),
          prev,
          { mode: trackingMode, pointer: pointerTargetRef.current, voice },
          elapsed,
        );
        motionStateRef.current = motion.state;
        const updated = { ...motion.rig, activeEmotion: 'none' as Emotion };

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
                updated.bodyX +=
                  (updated.angleX * CAMERA.BODY_FOLLOW - updated.bodyX) *
                  responseForElapsed(CAMERA.BODY_RESPONSE, elapsed);
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
                  (Math.abs(updated.angleX - prev.angleX) + Math.abs(updated.angleY - prev.angleY)) /
                  Math.max(0.01, frameUnits);
                if (headVelocity > DIZZINESS.VELOCITY_THRESHOLD) {
                  dizzinessAccumulatorRef.current = Math.min(
                    DIZZINESS.MAX,
                    dizzinessAccumulatorRef.current + headVelocity * DIZZINESS.VELOCITY_GAIN * frameUnits,
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
                    drowsinessAccumulatorRef.current + DROWSINESS.GAIN * frameUnits,
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

                // Confidence is measured in equivalent 60 Hz frames, not actual RAF count.
                const counters = emotionFrameCountersRef.current;
                ALL_EMOTIONS.forEach((emo) => {
                  if (counters[emo] === undefined) counters[emo] = 0;
                  counters[emo] =
                    emo === detected
                      ? Math.min(EMOTION_STABILIZATION.COUNTER_MAX, counters[emo] + frameUnits)
                      : Math.max(0, counters[emo] - frameUnits);
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

        // Manual emote override (streamer hotkeys / panel) wins while active.
        const emote = emoteRef.current;
        if (emote && now < emote.until) {
          updated.activeEmotion = emote.emotion;
        }

        Object.assign(updated, advanceEmotionTransition(prev, updated.activeEmotion, elapsed));

        return updated;
      })();

      if (updated !== rigRef.current) {
        rigRef.current = updated;
        onFrameRef.current?.(updated);
        // A paused expression changes only once. Publish immediately rather than
        // losing it when it arrives inside the live-animation throttle window.
        if (paused || shouldPublishRigFrame(lastPublishedAt.current, now)) {
          lastPublishedAt.current = now;
          setRig(updated);
        }
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

  // Pointer events set intention only. RAF gives eyes, head and body their own response.
  useEffect(() => {
    if (trackingMode !== 'mouse') return;

    const handleMouseMove = (e: MouseEvent) => {
      pointerTargetRef.current = {
        x: clamp((e.clientX - window.innerWidth / 2) / Math.max(1, window.innerWidth / 2), -1, 1),
        y: clamp((e.clientY - window.innerHeight / 2) / Math.max(1, window.innerHeight / 2), -1, 1),
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trackingMode]);
}
