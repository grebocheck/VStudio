import type React from 'react';
import { useEffect, useRef } from 'react';
import { Emotion, RigParams, TrackingMode } from '../types';
import { MicRefs } from './useMicrophone';
import { FaceTracking } from './useFaceTracking';

const ALL_EMOTIONS: Emotion[] = [
  'none', 'happy', 'angry', 'cry', 'shocked', 'smug', 'love', 'starry',
  'squint', 'depressed', 'dizzy', 'cool', 'scared', 'sleepy', 'shy', 'relaxed',
];

interface EngineDeps {
  trackingMode: TrackingMode;
  micActive: boolean;
  mic: MicRefs;
  face: Pick<FaceTracking, 'videoRef' | 'faceLandmarkerRef'>;
  setRig: React.Dispatch<React.SetStateAction<RigParams>>;
}

/**
 * Drives every per-frame avatar motion: breathing, procedural blinking,
 * mic-driven mouth flap, AFK auto-look, MediaPipe camera tracking with an
 * emotion classifier, and spring-mass hair physics. All transient state lives
 * in refs so the loop never re-subscribes mid-animation.
 */
export function useAnimationEngine({ trackingMode, micActive, mic, face, setRig }: EngineDeps): void {
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);

  // Blink state machine
  const blinkTimer = useRef(0);
  const isBlinking = useRef(false);
  const blinkPhase = useRef(0); // 0 idle, 1 closing, 2 opening

  // Spring-mass hair physics
  const hairSwayXRef = useRef(0);
  const hairSwayVelXRef = useRef(0);
  const hairSwayYRef = useRef(0);
  const hairSwayVelYRef = useRef(0);

  // Angular look memory for inertial drag
  const prevAngleXRef = useRef(0);
  const prevAngleYRef = useRef(0);

  // Emotion stabilization / interactive state
  const emotionFrameCountersRef = useRef<Record<string, number>>({});
  const lastStabilizedEmotionRef = useRef<Emotion>('none');
  const emotionLockTimeRef = useRef(0);
  const dizzinessAccumulatorRef = useRef(0);
  const dizzinessLockedUntilRef = useRef(0);
  const drowsinessAccumulatorRef = useRef(0);

  useEffect(() => {
    lastTime.current = Date.now();
    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastTime.current;
      lastTime.current = now;
      const timeSec = now / 1000;

      dizzinessAccumulatorRef.current = Math.max(0, dizzinessAccumulatorRef.current - elapsed / 30);
      drowsinessAccumulatorRef.current = Math.max(0, drowsinessAccumulatorRef.current - elapsed / 12);

      setRig((prev) => {
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
        if (micActive && mic.analyserRef.current && mic.dataArrayRef.current) {
          mic.analyserRef.current.getByteFrequencyData(mic.dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < mic.dataArrayRef.current.length; i++) sum += mic.dataArrayRef.current[i];
          const average = sum / mic.dataArrayRef.current.length;
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
        const video = face.videoRef.current;
        const landmarker = face.faceLandmarkerRef.current;
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

                const targetYaw = Math.max(-30, Math.min(30, currentYaw));
                const targetPitch = Math.max(-20, Math.min(20, currentPitch));
                const targetRoll = Math.max(-15, Math.min(15, currentRoll));

                updated.angleX += (targetYaw - updated.angleX) * 0.2;
                updated.angleY += (targetPitch - updated.angleY) * 0.2;
                updated.angleZ += (targetRoll - updated.angleZ) * 0.2;

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

                updated.tongueOut = (updated.tongueOut ?? 0) + (tongueOut - (updated.tongueOut ?? 0)) * 0.24;

                const targetEyeLOpen = Math.max(0, Math.min(1.0, 1.0 - eyeBlinkLeft * 1.15));
                const targetEyeROpen = Math.max(0, Math.min(1.0, 1.0 - eyeBlinkRight * 1.15));
                updated.eyeLOpen += (targetEyeLOpen - updated.eyeLOpen) * 0.24;
                updated.eyeROpen += (targetEyeROpen - updated.eyeROpen) * 0.24;

                const smileAvg = (mouthSmileLeft + mouthSmileRight) / 2;
                if (!micActive) {
                  const targetMouthOpen = Math.max(0, Math.min(1.0, jawOpen * 1.3));
                  updated.mouthOpen += (targetMouthOpen - updated.mouthOpen) * 0.35;
                  const targetMouthForm = smileAvg * 1.5 - mouthPucker * 0.8;
                  const finalMouthForm = Math.max(-1.0, Math.min(1.0, targetMouthForm));
                  updated.mouthForm += (finalMouthForm - updated.mouthForm) * 0.35;
                }

                const browUpFactor = browInnerUp * 4.0;
                const browDownFactor = ((browDownLeft + browDownRight) / 2) * -4.0;
                const targetEyebrowRange = Math.max(-5, Math.min(5, browUpFactor + browDownFactor));
                updated.eyebrowY += (targetEyebrowRange - updated.eyebrowY) * 0.3;

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

                let detected: Emotion = 'none';

                // Dizziness: only fast deliberate head shaking accumulates
                const headVelocity =
                  Math.abs(updated.angleX - prevAngleXRef.current) +
                  Math.abs(updated.angleY - prevAngleYRef.current);
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

                if (isDizzy) detected = 'dizzy';
                else if (isTrulySleepy) detected = 'sleepy';
                else if (jawOpen > 0.15 && (browInnerUp > 0.3 || eyeWideAvg > 0.3)) detected = 'shocked';
                else if (eyeWideAvg > 0.5 && jawOpen > 0.25) detected = 'scared';
                else if (browOuterUpDiff > 0.45 || browOuterUpAvg > 0.5) detected = 'cool';
                else if (cheekSquintAvg > 0.45 && smileAvg > 0.15 && smileAvg < 0.4 && jawOpen < 0.1) detected = 'shy';
                else if (smileAvg > 0.12 && smileAvg < 0.35 && eyeLookDownAvg > 0.35 && browInnerUp < 0.15 && angryAvg < 0.15) detected = 'relaxed';
                else if (blinkAvg > 0.65 && (cheekSquintAvg > 0.3 || smileAvg > 0.3)) detected = 'squint';
                else if (adjustedAngryAvg > 0.45 && updated.mouthForm < 0.05) detected = 'angry';
                else if (smileAvg > 0.42 && blinkAvg > 0.35) detected = 'smug';
                else if (smileAvg > 0.45) detected = browInnerUp > 0.4 ? 'starry' : 'happy';
                else if (puckerAvg > 0.45) detected = 'love';
                else if (browInnerUp > 0.4 && updated.mouthForm < -0.15) detected = 'depressed';
                else if (updated.mouthForm < -0.3) detected = 'cry';

                // Debounce / hysteresis via per-emotion frame counters
                const counters = emotionFrameCountersRef.current;
                ALL_EMOTIONS.forEach((emo) => {
                  if (counters[emo] === undefined) counters[emo] = 0;
                  counters[emo] = emo === detected
                    ? Math.min(14, counters[emo] + 1)
                    : Math.max(0, counters[emo] - 1);
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
        const deltaX = updated.angleX - prevAngleXRef.current;
        const deltaY = updated.angleY - prevAngleYRef.current;
        prevAngleXRef.current = updated.angleX;
        prevAngleYRef.current = updated.angleY;

        hairSwayVelXRef.current -= deltaX * 0.38;
        hairSwayVelYRef.current += Math.abs(deltaY) * 0.25;

        const targetSwayX = -(updated.angleX * 0.7) - updated.angleZ * 0.6;
        const forceX = (targetSwayX - hairSwayXRef.current) * 0.16;
        hairSwayVelXRef.current = (hairSwayVelXRef.current + forceX) * 0.82;
        hairSwayXRef.current += hairSwayVelXRef.current;
        updated.hairSwayX = hairSwayXRef.current;

        const targetSwayY = Math.abs(updated.angleY) * 0.35;
        const forceY = (targetSwayY - hairSwayYRef.current) * 0.2;
        hairSwayVelYRef.current = (hairSwayVelYRef.current + forceY) * 0.79;
        hairSwayYRef.current += hairSwayVelYRef.current;
        updated.hairSwayY = hairSwayYRef.current;

        return updated;
      });

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [trackingMode, micActive, mic, face, setRig]);

  // Mouse-driven head tracking
  useEffect(() => {
    if (trackingMode !== 'mouse') return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      setRig((prev) => ({
        ...prev,
        angleX: dx * 28,
        angleY: -dy * 16,
        angleZ: dx * -10,
        pupilX: dx * 0.75,
        pupilY: dy * 0.6,
        bodyX: dx * 12,
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trackingMode, setRig]);
}
