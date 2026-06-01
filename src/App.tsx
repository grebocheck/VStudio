import React, { useState, useEffect, useRef } from 'react';
import { AvatarConfig, RigParams, PresetAvatar } from './types';
import { LeftSidebar } from './components/LeftSidebar';
import { CenterStage } from './components/CenterStage';
import { RightSidebar } from './components/RightSidebar';
import { useI18n } from './i18n';
import { useTheme } from './theme/ThemeContext';

// Initial calibration points
const INITIAL_RIG: RigParams = {
  eyeLOpen: 1.0,
  eyeROpen: 1.0,
  mouthOpen: 0.0,
  mouthForm: 0.5,
  eyebrowY: 0,
  pupilX: 0,
  pupilY: 0,
  angleX: 0,
  angleY: 0,
  angleZ: 0,
  breath: 0,
  bodyX: 0,
  tongueOut: 0.0
};

// Default presets for the VTuber studio representing creative characters
const PRESETS: PresetAvatar[] = [
  {
    id: 'cyber-neko',
    name: 'Мія (Cyber Neko)',
    config: {
      skinColor: '#f5f3ff',
      eyeColor: '#06b6d4',
      pupilStyle: 'round',
      pupilColor: '#f43f5e',
      eyebrowStyle: 'normal',
      eyebrowColor: '#4f46e5',
      hairStyleBang: 'side',
      hairStyleBack: 'drill-tails',
      hairColor: '#4f46e5',
      hairHighlightColor: '#a855f7',
      clothingStyle: 'cyber-armor',
      clothingColor1: '#111827',
      clothingColor2: '#22d3ee',
      accessoryStyle: 'neko-ears',
      accessoryColor: '#f43f5e',
      backgroundStyle: 'gaming',
      name: 'Мія',
      lore: 'Кібернетична дівчинка-кішка, яка веде стріми з віртуального неонового Токіо. Хоч вона інколи буває забудькувата, її життєрадісність та драйв притягують тисячі глядачів!',
      blushOpacity: 0.25,
      blushColor: '#ff4d6d',
      hasFangs: false,
      earStyle: 'normal',
      hairGradient: 'sunset',
      accessoryGlow: true,
      
      // Personalized delicate proportions (making the neck elegant and beautiful)
      headSize: 1.05,
      neckWidth: 0.82,
      neckHeight: 0.9,
      shoulderWidth: 0.94,
      clothingPrint: 'cyber',
      activeEmotion: 'smug',
      artStyle: 'anime'
    }
  },
  {
    id: 'vampire-princess',
    name: 'Міцукі (Goth Vampire)',
    config: {
      skinColor: '#fafaf9',
      eyeColor: '#f43f5e',
      pupilStyle: 'heart',
      pupilColor: '#ffe4e6',
      eyebrowStyle: 'thin',
      eyebrowColor: '#18181b',
      hairStyleBang: 'hime',
      hairStyleBack: 'hime-long',
      hairColor: '#18181b',
      hairHighlightColor: '#be123c',
      clothingStyle: 'goth-dress',
      clothingColor1: '#18181b',
      clothingColor2: '#f43f5e',
      accessoryStyle: 'horns',
      accessoryColor: '#f43f5e',
      backgroundStyle: 'dark-studio',
      name: 'Міцукі',
      lore: 'Готична вампірська лоліта, яка замість сну в склепі до світанку затято розгадує головоломки та проходить хардкорні RPG. Обожнює кажанів, чай з журавлини та іклавий рум’янець.',
      blushOpacity: 0.45,
      blushColor: '#e11d48',
      hasFangs: true,
      earStyle: 'pointy',
      hairGradient: 'sunset',
      accessoryGlow: true,
      
      // Visual proportions for gothic/vampire theme
      headSize: 1.08,
      neckWidth: 0.76,
      neckHeight: 0.88,
      shoulderWidth: 0.9,
      clothingPrint: 'cross',
      activeEmotion: 'angry',
      artStyle: 'classic'
    }
  },
  {
    id: 'astral-elf',
    name: 'Луна (Astral Star Elf)',
    config: {
      skinColor: '#f0fdfa',
      eyeColor: '#8b5cf6',
      pupilStyle: 'star',
      pupilColor: '#fef08a',
      eyebrowStyle: 'normal',
      eyebrowColor: '#7c3aed',
      hairStyleBang: 'curly-bangs',
      hairStyleBack: 'wavy',
      hairColor: '#6d28d9',
      hairHighlightColor: '#a78bfa',
      clothingStyle: 'sweater',
      clothingColor1: '#2e1065',
      clothingColor2: '#a78bfa',
      accessoryStyle: 'glasses',
      accessoryColor: '#fef08a',
      backgroundStyle: 'nebula',
      name: 'Луна',
      lore: 'Ельфійська хранителька бібліотеки зіркового світла. Вона обожнює слухати ASMR звуки нічного космосу, ховатися в теплий в’язаний светр і розповідати казки про далекі туманності.',
      blushOpacity: 0.2,
      blushColor: '#ec4899',
      hasFangs: false,
      earStyle: 'elf',
      hairGradient: 'indigo-fade',
      accessoryGlow: false,
      
      // Fairytale cozy proportions
      headSize: 1.0,
      neckWidth: 0.8,
      neckHeight: 1.0,
      shoulderWidth: 0.94,
      clothingPrint: 'heart',
      activeEmotion: 'none',
      artStyle: 'classic'
    }
  },
  {
    id: 'anime-idol',
    name: 'Кіра (Crimson Star)',
    config: {
      skinColor: '#fff5f5',
      eyeColor: '#06b6d4',
      pupilStyle: 'round',
      pupilColor: '#0f172a',
      eyebrowStyle: 'thin',
      eyebrowColor: '#e11d48',
      hairStyleBang: 'hime',
      hairStyleBack: 'hime-long',
      hairColor: '#e11d48',
      hairHighlightColor: '#fda4af',
      clothingStyle: 'goth-dress',
      clothingColor1: '#0f172a',
      clothingColor2: '#ffffff',
      accessoryStyle: 'neko-ears',
      accessoryColor: '#e11d48',
      backgroundStyle: 'nebula',
      name: 'Кіра',
      lore: 'Червоноволоса аніме-кішкодівчина в стилі High School DxD. Її шовковисте волосся кольору багряного серця прикрашає грайливий ахоге (пасмо), а сяючі аквамаринові очі та класична школа-самурайка підкорюють серця.',
      blushOpacity: 0.35,
      blushColor: '#f43f5e',
      hasFangs: false,
      earStyle: 'normal',
      hairGradient: 'sunset',
      accessoryGlow: false,
      headSize: 1.04,
      neckWidth: 0.72,
      neckHeight: 0.95,
      shoulderWidth: 0.90,
      clothingPrint: 'heart',
      activeEmotion: 'happy',
      artStyle: 'anime'
    }
  },
  {
    id: 'koneko-dxd',
    name: 'Конеко (White Kitten)',
    config: {
      skinColor: '#fffaf8',
      eyeColor: '#f59e0b',
      pupilStyle: 'round',
      pupilColor: '#3c1e02',
      eyebrowStyle: 'thin',
      eyebrowColor: '#7c2d12',
      hairStyleBang: 'classic',
      hairStyleBack: 'short',
      hairColor: '#e5e7eb',
      hairHighlightColor: '#ffffff',
      clothingStyle: 'maid',
      clothingColor1: '#0f172a',
      clothingColor2: '#ffffff',
      accessoryStyle: 'neko-ears',
      accessoryColor: '#e5e7eb',
      backgroundStyle: 'dark-studio',
      name: 'Конеко',
      lore: 'Срібноволоса дівчина-кішка в стилі легендарної Конеко з High School DxD. Завжди спокійна й незворушна зовні, вона постає перед вами в чарівному готичному костюмі покоївки із шовковистими білими вушками та сяючими золотими очками, що підкорять ваше серце!',
      blushOpacity: 0.4,
      blushColor: '#ff2e55',
      hasFangs: false,
      earStyle: 'normal',
      hairGradient: 'none',
      accessoryGlow: false,
      headSize: 1.05,
      neckWidth: 0.74,
      neckHeight: 0.94,
      shoulderWidth: 0.92,
      clothingPrint: 'heart',
      activeEmotion: 'none',
      artStyle: 'anime'
    }
  },
  {
    id: 'retro-pip',
    name: 'Піп (1930s Rubber Hose)',
    config: {
      skinColor: '#f5efe0',
      eyeColor: '#111111',
      pupilStyle: 'round',
      pupilColor: '#000000',
      eyebrowStyle: 'thick',
      eyebrowColor: '#111111',
      hairStyleBang: 'short',
      hairStyleBack: 'short',
      hairColor: '#18181b',
      hairHighlightColor: '#3f3f46',
      clothingStyle: 'suit',
      clothingColor1: '#111111',
      clothingColor2: '#ffffff',
      accessoryStyle: 'none',
      accessoryColor: '#111111',
      backgroundStyle: 'dark-studio',
      name: 'Піп',
      lore: 'Класичний чорно-білий мультиплікаційний герой епохи 1930-х. Він постійно весело пружинить і коливається під уявні джазові синкопи, носить стильний круглий фрак та робить комічні очі!',
      blushOpacity: 0.15,
      blushColor: '#000000',
      hasFangs: false,
      earStyle: 'pointy',
      hairGradient: 'none',
      accessoryGlow: false,
      headSize: 1.1,
      neckWidth: 0.7,
      neckHeight: 0.85,
      shoulderWidth: 0.85,
      clothingPrint: 'cross',
      activeEmotion: 'shocked',
      artStyle: 'retro'
    }
  }
];

export default function App() {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isEn = language === 'en';

  const [config, setConfig] = useState<AvatarConfig>(PRESETS[0].config);
  const [rig, setRig] = useState<RigParams>(INITIAL_RIG);
  const [trackingMode, setTrackingMode] = useState<'manual' | 'mouse' | 'mic' | 'auto' | 'camera'>('auto');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'presets' | 'hair' | 'face' | 'clothes' | 'metadata' | 'rigging' | 'ai' | 'obs'>('presets');

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [onScreenBuster, setScreenBuster] = useState(false);
  const [customPresets, setCustomPresets] = useState<PresetAvatar[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Microphone state
  const [micActive, setMicActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera tracking state and references
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const faceLandmarkerRef = useRef<any>(null);

  // Timekeepers for smooth procedural rendering
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef<number>(Date.now());
  const blinkTimer = useRef<number>(0);
  const isBlinking = useRef<boolean>(false);
  const blinkPhase = useRef<number>(0); // 0 idle, 1 closing, 2 opening

  // High-inertia physics engine refs for spring-y hair sway
  const hairSwayXRef = useRef<number>(0);
  const hairSwayVelXRef = useRef<number>(0);
  const hairSwayYRef = useRef<number>(0);
  const hairSwayVelYRef = useRef<number>(0);

  // Angular look memory for secondary inertial drag forces
  const prevAngleXRef = useRef<number>(0);
  const prevAngleYRef = useRef<number>(0);

  // Camera tracking auto-calibration baseline
  const camBaselineXRef = useRef<number | null>(null);
  const camBaselineYRef = useRef<number | null>(null);
  const smoothedCamXRef = useRef<number | null>(null);
  const smoothedCamYRef = useRef<number | null>(null);

  // High-fidelity stabilization & interactive dizziness state refs
  const emotionFrameCountersRef = useRef<Record<string, number>>({});
  const lastStabilizedEmotionRef = useRef<'none' | 'happy' | 'angry' | 'cry' | 'shocked' | 'smug' | 'love' | 'starry' | 'squint' | 'depressed' | 'dizzy' | 'cool' | 'scared' | 'sleepy' | 'shy' | 'relaxed'>('none');
  const emotionLockTimeRef = useRef<number>(0);
  const dizzinessAccumulatorRef = useRef<number>(0);

  // Handle manual rigging updates
  const handleRigChange = (updates: Partial<RigParams>) => {
    setRig(prev => ({ ...prev, ...updates }));
  };

  const handleResetRig = () => {
    setRig(INITIAL_RIG);
  };

  // Sound amplitude tracking
  useEffect(() => {
    if (!micActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      analyserRef.current = null;
      streamRef.current = null;
      audioContextRef.current = null;
      return;
    }

    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      } catch (err) {
        console.error("Microphone activation error:", err);
        setMicActive(false);
        alert(isEn 
          ? "Failed to access microphone. Please verify sound input permissions in your browser." 
          : "Не вдалося отримати доступ до мікрофону. Перевірте дозволи вашого браузера."
        );
      }
    };

    initMicrophone();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [micActive]);

  // Real-Time Camera feed processing for head tracking
  useEffect(() => {
    if (trackingMode !== 'camera') {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      setCameraActive(false);
      camBaselineXRef.current = null;
      camBaselineYRef.current = null;
      smoothedCamXRef.current = null;
      smoothedCamYRef.current = null;
      return;
    }

    const initCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        cameraStreamRef.current = stream;
        setCameraActive(true);
        
        // Wait for video element to mount in LeftSidebar (max 1.5s) to bypass React render race conditions
        let attempts = 0;
        while (!videoRef.current && attempts < 15) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => console.log("Play error ignored", err));
          };
        }

        // Initialize high-fidelity MediaPipe FaceLandmarker
        if (!faceLandmarkerRef.current) {
          setIsModelLoading(true);
          try {
            const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
            const filesetResolver = await FilesetResolver.forVisionTasks(
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
            );
            const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
              baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                delegate: "GPU"
              },
              runningMode: "VIDEO",
              outputFaceBlendshapes: true,
              outputFacialTransformationMatrixes: false
            });
            faceLandmarkerRef.current = landmarker;
          } catch (e) {
            console.error("Failed to load MediaPipe FaceLandmarker:", e);
          } finally {
            setIsModelLoading(false);
          }
        }
      } catch (err) {
        console.error("Webcam tracking activation failed:", err);
        setTrackingMode('auto');
        alert(isEn 
          ? "Failed to open camera. Please make sure camera frame permissions are enabled in metadata.json." 
          : "Не вдалося увімкнути камеру. Будь ласка, переконайтеся в наданні дозволу на камеру."
        );
      }
    };

    initCam();

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      setCameraActive(false);
      camBaselineXRef.current = null;
      camBaselineYRef.current = null;
      smoothedCamXRef.current = null;
      smoothedCamYRef.current = null;
    };
  }, [trackingMode, isEn]);

  // High-performance simulation physics loop
  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      const elapsed = now - lastTime.current;
      lastTime.current = now;

      const timeSec = now / 1000;

      // Smoothly decay dizziness accumulator pool frame by frame (time-delta independent)
      dizzinessAccumulatorRef.current = Math.max(0, dizzinessAccumulatorRef.current - (elapsed / 45));

      setRig(prev => {
        let updated = { ...prev };
        updated.activeEmotion = 'none';

        // 1. Core Breathing physics
        updated.breath = (timeSec * 0.9) % 1.0;

        // 2. Procedural Blinking (disabled in camera mode to allow user-driven eyes tracking)
        if (trackingMode !== 'camera') {
          blinkTimer.current += elapsed;
          if (!isBlinking.current && blinkTimer.current > Math.random() * 4000 + 1500) {
            isBlinking.current = true;
            blinkPhase.current = 1; // start closing
          }

          if (isBlinking.current) {
            if (blinkPhase.current === 1) {
              updated.eyeLOpen = Math.max(0, updated.eyeLOpen - 0.25);
              updated.eyeROpen = Math.max(0, updated.eyeROpen - 0.25);
              if (updated.eyeLOpen === 0) {
                blinkPhase.current = 2; // fully closed, start opening
              }
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

        // 3. Microphone volume integration for mouth-flap sync
        if (micActive && analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          const volumeOpenVal = Math.min(1, average / 45);
          updated.mouthOpen = volumeOpenVal;
          updated.mouthForm = 0.5 + volumeOpenVal * 0.4;
        }

        // 4. Behavioral AFK Tracking Modes
        if (trackingMode === 'auto') {
          updated.angleX = Math.sin(timeSec * 0.6) * 12;
          updated.angleY = Math.cos(timeSec * 0.4) * 6;
          updated.angleZ = Math.sin(timeSec * 0.52) * 5;
          updated.bodyX = Math.sin(timeSec * 0.3) * 6;
          updated.pupilX = Math.sin(timeSec * 0.2) * 0.4;
          updated.pupilY = Math.cos(timeSec * 0.15) * 0.2;
          if (!micActive) {
            updated.mouthOpen = Math.max(0, Math.sin(timeSec * 3) * 0.12);
          }
        }

        // 5. High-Fidelity MediaPipe Face Landmarker Tracking (blinks, squint, smiles, head yaw/pitch/roll)
        if (trackingMode === 'camera' && videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
          if (faceLandmarkerRef.current) {
            try {
              const timestampMs = performance.now();
              const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, timestampMs);

              if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
                let targetYaw = 0;
                let targetPitch = 0;

                const landmarks = results.faceLandmarks[0];
                const pLeftCheek = landmarks[234];
                const pRightCheek = landmarks[454];
                const pNose = landmarks[4];
                const pForehead = landmarks[10];
                const pChin = landmarks[152];

                if (pLeftCheek && pRightCheek && pNose && pForehead && pChin) {
                  // Roll (tilt head from shoulder-to-shoulder, -15 to 15 degrees)
                  const dx = pRightCheek.x - pLeftCheek.x;
                  const dy = pRightCheek.y - pLeftCheek.y;
                  const currentRoll = Math.atan2(dy, dx) * (180 / Math.PI); // roll in degrees

                  // Yaw (shake head left-right, -30 to 30 degrees)
                  const cheekMidX = (pLeftCheek.x + pRightCheek.x) / 2;
                  const cheekDist = Math.hypot(pRightCheek.x - pLeftCheek.x, pRightCheek.y - pLeftCheek.y);
                  const currentYaw = ((pNose.x - cheekMidX) / (cheekDist || 1)) * -110; 

                  // Pitch (look up-down, -30 to 30 degrees)
                  const faceMidY = (pForehead.y + pChin.y) / 2;
                  const verticalHeight = Math.abs(pChin.y - pForehead.y);
                  const currentPitch = -((pNose.y - faceMidY) / (verticalHeight || 1) - 0.05) * 90;

                  // Clamp targets safely
                  targetYaw = Math.max(-30, Math.min(30, currentYaw));
                  targetPitch = Math.max(-20, Math.min(20, currentPitch));
                  const targetRoll = Math.max(-15, Math.min(15, currentRoll));

                  // Smoothly update head look orientation angles
                  updated.angleX += (targetYaw - updated.angleX) * 0.28;
                  updated.angleY += (targetPitch - updated.angleY) * 0.28;
                  updated.angleZ += (targetRoll - updated.angleZ) * 0.28;
                  
                  // Map head rotation to pupil and body movement
                  updated.pupilX = (updated.angleX / 30) * 0.75;
                  updated.pupilY = (updated.angleY / 20) * 0.55;
                  updated.bodyX += (updated.angleX * 0.45 - updated.bodyX) * 0.12;
                }

                // Dynamic Facial Blendshapes extraction
                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                  const categories = results.faceBlendshapes[0].categories;
                  const findScore = (name: string) => {
                    const found = categories.find((c: any) => c.categoryName === name || c.displayName === name);
                    return found ? found.score : 0;
                  };

                  const eyeBlinkLeft = findScore("eyeBlinkLeft");
                  const eyeBlinkRight = findScore("eyeBlinkRight");
                  const jawOpen = findScore("jawOpen");
                  const mouthSmileLeft = findScore("mouthSmileLeft");
                  const mouthSmileRight = findScore("mouthSmileRight");
                  const mouthPucker = findScore("mouthPucker");
                  const browInnerUp = findScore("browInnerUp");
                  const browDownLeft = findScore("browDownLeft");
                  const browDownRight = findScore("browDownRight");
                  const tongueOut = findScore("tongueOut");

                  updated.tongueOut = tongueOut;

                  // Left & Right Eyes (1.0 is wide open, 0.0 is closed / blink)
                  updated.eyeLOpen = Math.max(0, Math.min(1.0, 1.0 - eyeBlinkLeft * 1.15));
                  updated.eyeROpen = Math.max(0, Math.min(1.0, 1.0 - eyeBlinkRight * 1.15));

                  // Mouth Open Analysis (0 to 1)
                  const smileAvg = (mouthSmileLeft + mouthSmileRight) / 2;
                  if (!micActive) {
                    const targetMouthOpen = Math.max(0, Math.min(1.0, jawOpen * 1.3));
                    updated.mouthOpen += (targetMouthOpen - updated.mouthOpen) * 0.35;

                    // Mouth Smile map to mouthForm (-1 to 1)
                    const puckerAvg = mouthPucker;
                    const targetMouthForm = smileAvg * 1.5 - (puckerAvg * 0.8);
                    const finalMouthForm = Math.max(-1.0, Math.min(1.0, targetMouthForm));
                    updated.mouthForm += (finalMouthForm - updated.mouthForm) * 0.35;
                  }

                  // Eyebrow vertical positioning (-5 to 5px)
                  const browUpFactor = browInnerUp * 4.0;
                  const browDownFactor = ((browDownLeft + browDownRight) / 2) * -4.0;
                  const targetEyebrowRange = Math.max(-5, Math.min(5, browUpFactor + browDownFactor));
                  updated.eyebrowY += (targetEyebrowRange - updated.eyebrowY) * 0.3;

                  // High-fidelity Multi-Expression & Emotion classifier matching expanded list of styled overlays
                  const cheekSquintLeft = findScore("cheekSquintLeft");
                  const cheekSquintRight = findScore("cheekSquintRight");
                  const cheekSquintAvg = (cheekSquintLeft + cheekSquintRight) / 2;
                  const blinkAvg = (eyeBlinkLeft + eyeBlinkRight) / 2;
                  const angryAvg = (browDownLeft + browDownRight) / 2;
                  const puckerAvg = mouthPucker;

                  // Newly integrated facial triggers
                  const eyeLookInLeft = findScore("eyeLookInLeft");
                  const eyeLookInRight = findScore("eyeLookInRight");
                  const eyeLookInAvg = (eyeLookInLeft + eyeLookInRight) / 2;

                  const eyeWideLeft = findScore("eyeWideLeft");
                  const eyeWideRight = findScore("eyeWideRight");
                  const eyeWideAvg = (eyeWideLeft + eyeWideRight) / 2;

                  const eyeLookDownLeft = findScore("eyeLookDownLeft");
                  const eyeLookDownRight = findScore("eyeLookDownRight");
                  const eyeLookDownAvg = (eyeLookDownLeft + eyeLookDownRight) / 2;

                  const browOuterUpLeft = findScore("browOuterUpLeft");
                  const browOuterUpRight = findScore("browOuterUpRight");
                  const browOuterUpAvg = (browOuterUpLeft + browOuterUpRight) / 2;
                  const browOuterUpDiff = Math.abs(browOuterUpLeft - browOuterUpRight); // checked diff

                   let detected: 'none' | 'happy' | 'angry' | 'cry' | 'shocked' | 'smug' | 'love' | 'starry' | 'squint' | 'depressed' | 'dizzy' | 'cool' | 'scared' | 'sleepy' | 'shy' | 'relaxed' = 'none';

                  // Measure rapid, sudden head rotation velocities to accumulate dizziness (interactive shaking trigger)
                  const currentYawV = Math.abs(targetYaw - (prevAngleXRef.current || 0));
                  const currentPitchV = Math.abs(targetPitch - (prevAngleYRef.current || 0));
                  const headVelocity = currentYawV + currentPitchV;
                  if (headVelocity > 2.8) {
                    dizzinessAccumulatorRef.current = Math.min(65, dizzinessAccumulatorRef.current + headVelocity * 1.5);
                  }

                  if (dizzinessAccumulatorRef.current > 32 || eyeLookInAvg > 0.42) {
                    // Crossed eyes or rapid head shaking = dizzy!
                    detected = 'dizzy';
                  } else if (eyeWideAvg > 0.35 && jawOpen > 0.2) {
                    // Wide panicked eye-tracking + dropped jaw = scared!
                    detected = 'scared';
                  } else if (eyeLookDownAvg > 0.52 && blinkAvg > 0.25 && blinkAvg < 0.75) {
                    // Downward look + drooping half-lids = sleepy!
                    detected = 'sleepy';
                  } else if (browOuterUpDiff > 0.35 || browOuterUpAvg > 0.4) {
                    // Sassy eyebrow raises / cocked brow = cool!
                    detected = 'cool';
                  } else if (cheekSquintAvg > 0.35 && smileAvg > 0.1 && smileAvg < 0.35 && jawOpen < 0.1) {
                    // Mild smile + high blushing cheek raise = shy!
                    detected = 'shy';
                  } else if (smileAvg > 0.08 && smileAvg < 0.35 && eyeLookDownAvg > 0.25 && browInnerUp < 0.2 && angryAvg < 0.2) {
                    // Soft relaxed smile + looking down slightly + peaceful eyebrows = relaxed/chill!
                    detected = 'relaxed';
                  } else if (blinkAvg > 0.55 && (cheekSquintAvg > 0.25 || smileAvg > 0.25)) {
                    // Closed-eye smile / squeeze shut
                    detected = 'squint';
                  } else if (browInnerUp > 0.38 && jawOpen > 0.3) {
                    // Raised brows + dropped jaw = shocked!
                    detected = 'shocked';
                  } else if (angryAvg > 0.35 && updated.mouthForm < 0.1) {
                    // Angled/furrowed brows + flat/sad mouth = angry!
                    detected = 'angry';
                  } else if (smileAvg > 0.38 && blinkAvg > 0.3) {
                    // Smile + partially closed eyes/wink = smug smirk!
                    detected = 'smug';
                  } else if (smileAvg > 0.4) {
                     // Happy or starry depending on eyebrow height
                    if (browInnerUp > 0.35) {
                      detected = 'starry';
                    } else {
                      detected = 'happy';
                    }
                  } else if (puckerAvg > 0.38) {
                    // Puckered lips / kiss face = love!
                    detected = 'love';
                  } else if (browInnerUp > 0.35 && updated.mouthForm < -0.1) {
                    // Anxious raised inner brows + frowning mouth = depressed!
                    detected = 'depressed';
                  } else if (updated.mouthForm < -0.2) {
                    // Hard sadness = cry cascading tears!
                    detected = 'cry';
                  }

                  // Update frame counters for consecutive detection to prevent high-frequency jitter (Debounce / Hysteresis)
                  const counters = emotionFrameCountersRef.current;
                  const allEmotions: Array<typeof detected> = [
                    'none', 'happy', 'angry', 'cry', 'shocked', 'smug', 
                    'love', 'starry', 'squint', 'depressed', 'dizzy', 
                    'cool', 'scared', 'sleepy', 'shy', 'relaxed'
                  ];
                  
                  allEmotions.forEach(emo => {
                    if (counters[emo] === undefined) {
                      counters[emo] = 0;
                    }
                    if (emo === detected) {
                      counters[emo] = Math.min(8, counters[emo] + 1);
                    } else {
                      counters[emo] = Math.max(0, counters[emo] - 1);
                    }
                  });

                  const currentTime = Date.now();
                  const currentStabilized = lastStabilizedEmotionRef.current;
                  let winner = currentStabilized;

                  // Locate if there's any active high-confidence emotion (sustained for at least 4 contiguous frames)
                  let highConfidenceEmotion: typeof detected = 'none';
                  let maxCount = 0;
                  allEmotions.forEach(emo => {
                    if (emo !== 'none' && counters[emo] >= 4 && counters[emo] > maxCount) {
                      maxCount = counters[emo];
                      highConfidenceEmotion = emo;
                    }
                  });

                  // We tolerate switching if the lock duration of 650ms has expired, 
                  // or if the winner is 'none' (instant response),
                  // or if the incoming expression is extremely strong (>= 6 contiguous frames of detection)
                  const timeSpentInExpression = currentTime - emotionLockTimeRef.current;
                  const canTransition = currentStabilized === 'none' || timeSpentInExpression > 650 || (highConfidenceEmotion !== 'none' && counters[highConfidenceEmotion] >= 6);

                  if (canTransition) {
                    if (highConfidenceEmotion !== 'none') {
                      if (currentStabilized !== highConfidenceEmotion) {
                        winner = highConfidenceEmotion;
                        emotionLockTimeRef.current = currentTime;
                      }
                    } else if (counters['none'] >= 5) {
                      // Return to calm only if no expressions were formed for 5 consecutive frames
                      if (currentStabilized !== 'none') {
                        winner = 'none';
                        emotionLockTimeRef.current = currentTime;
                      }
                    }
                  }

                  lastStabilizedEmotionRef.current = winner;
                  updated.activeEmotion = winner;
                }
              }
            } catch (err) {
              console.error("MediaPipe FaceLandmarker frame detection error:", err);
            }
          }
        }

        // 6. High-fidelity dynamic spring-mass physical hair sways with look velocity impulses
        // Compute turn velocity vectors
        const deltaX = updated.angleX - prevAngleXRef.current;
        const deltaY = updated.angleY - prevAngleYRef.current;
        
        // Save look memory for next tick
        prevAngleXRef.current = updated.angleX;
        prevAngleYRef.current = updated.angleY;

        // Apply inertial impulse force to velocities: quick head turn drags hair in opposite direction
        hairSwayVelXRef.current -= deltaX * 0.38;
        hairSwayVelYRef.current += Math.abs(deltaY) * 0.25;

        const targetSwayX = -(updated.angleX * 0.7) - (updated.angleZ * 0.6); // Trails opposite of look yaw & roll
        const forceX = (targetSwayX - hairSwayXRef.current) * 0.16; // Spring constant
        hairSwayVelXRef.current = (hairSwayVelXRef.current + forceX) * 0.82; // Damping / Elastic deceleration
        hairSwayXRef.current += hairSwayVelXRef.current;
        updated.hairSwayX = hairSwayXRef.current;

        const targetSwayY = Math.abs(updated.angleY) * 0.35; // vertical compression offset
        const forceY = (targetSwayY - hairSwayYRef.current) * 0.20;
        hairSwayVelYRef.current = (hairSwayVelYRef.current + forceY) * 0.79;
        hairSwayYRef.current += hairSwayVelYRef.current;
        
        // Smooth inertial secondary vertical movement only (no auto-bumping from breath)
        updated.hairSwayY = hairSwayYRef.current;

        return updated;
      });

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [trackingMode, micActive]);

  // Mouse move listener for tracking
  useEffect(() => {
    if (trackingMode !== 'mouse') return;

    const handleMouseMove = (e: MouseEvent) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dx = (e.clientX - width / 2) / (width / 2); // -1 to 1
      const dy = (e.clientY - height / 2) / (height / 2); // -1 to 1

      setRig(prev => ({
        ...prev,
        angleX: dx * 28, // Max yaw 28deg
        angleY: -dy * 16, // Max pitch 16deg
        angleZ: dx * -10, // Max roll
        pupilX: dx * 0.75, // Looking left-right
        pupilY: dy * 0.6,
        bodyX: dx * 12
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [trackingMode]);

  // Gemini generative AI style request
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/gemini/generate-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Невдалося згенерувати аватар з ШІ.');
      }

      setConfig(data);
      setRig(prev => ({
        ...prev,
        mouthForm: 0.9,
        mouthOpen: 0.15,
        eyebrowY: 2,
        angleY: 5
      }));
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Синтаксична помилка.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Save custom local pre-made profiles
  const handleSaveLocalPreset = () => {
    const newPreset: PresetAvatar = {
      id: `custom-${Date.now()}`,
      name: `${config.name || 'Особистий'} (Збережений)`,
      config: { ...config }
    };
    setCustomPresets(prev => [...prev, newPreset]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className={`min-h-screen lg:h-screen lg:overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative ${
      theme === 'dark' ? 'bg-[#07070a] text-[#d1d1d1]' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Sophisticated Fluid Navigation Bar */}
      <header className={`h-14 border-b flex items-center justify-between px-6 shrink-0 z-50 ${
        theme === 'dark' ? 'border-white/10 bg-[#0f0f12]' : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <span className={`font-serif italic text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            V-Studio 
            <span className="text-[10px] font-sans not-italic text-indigo-505 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-sm ml-1.5 font-bold">
              LIVE RIG PRO v2.4
            </span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-sm border transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            title={isEn ? "Toggle Theme" : "Змінити тему"}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-wider">
              {theme === 'dark' ? (isEn ? "Light" : "Світла") : (isEn ? "Dark" : "Темна")}
            </span>
          </button>

          {/* Language Selector Controls */}
          <div className={`flex items-center rounded-sm border overflow-hidden p-0.5 ${
            theme === 'dark' ? 'bg-[#07070a] border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-[9px] font-bold rounded-sm transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('uk')}
              className={`px-2 py-1 text-[9px] font-bold rounded-sm transition-all cursor-pointer ${
                language === 'uk'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-705 dark:hover:text-white'
              }`}
            >
              UA
            </button>
          </div>

          <button 
            onClick={handleSaveLocalPreset} 
            className={`px-4 py-1.5 border rounded-sm text-[10px] font-bold tracking-wider transition-all uppercase cursor-pointer ${
              theme === 'dark'
                ? 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white'
                : 'border-indigo-200 hover:border-indigo-350 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            {saveSuccess ? (isEn ? 'SAVED ✓' : 'ЗБЕРЕЖЕНО ✓') : (isEn ? 'SAVE PROJECT' : 'ЗБЕРЕГТИ ПРОЕКТ')}
          </button>
        </div>
      </header>

      {/* Main split workspace layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden w-full relative">
        <LeftSidebar
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={setActiveSidebarTab}
          trackingMode={trackingMode}
          setTrackingMode={setTrackingMode}
          micActive={micActive}
          setMicActive={setMicActive}
          onScreenBuster={onScreenBuster}
          setScreenBuster={setScreenBuster}
          videoRef={videoRef}
          isModelLoading={isModelLoading}
        />

        <CenterStage
          config={config}
          setConfig={setConfig}
          rig={rig}
          onScreenBuster={onScreenBuster}
          trackingMode={trackingMode}
        />

        <RightSidebar
          activeSidebarTab={activeSidebarTab}
          config={config}
          setConfig={setConfig}
          rig={rig}
          handleRigChange={handleRigChange}
          handleResetRig={handleResetRig}
          trackingMode={trackingMode}
          setTrackingMode={setTrackingMode}
          micActive={micActive}
          setMicActive={setMicActive}
          onScreenBuster={onScreenBuster}
          setScreenBuster={setScreenBuster}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          aiGenerating={aiGenerating}
          aiError={aiError}
          handleAiGenerate={handleAiGenerate}
          customPresets={customPresets}
          PRESETS={PRESETS}
        />
      </div>

      {/* Persistent Workspace Footer with dynamic localization settings */}
      <footer className={`border-t px-6 py-4 text-center text-[10px] font-mono flex flex-col md:flex-row md:justify-between items-center space-y-2 md:space-y-0 shrink-0 z-10 animate-fade-in ${
        theme === 'dark' ? 'border-white/10 bg-[#07070a] text-[#d1d1d1]/40' : 'border-slate-150 bg-white text-slate-500'
      }`}>
        <p>{t.footer.copyright}</p>
        <div className="flex space-x-3 text-slate-500 dark:text-white/50">
          <span className="hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer">{t.footer.help}</span>
          <span className="hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer">{t.footer.apache}</span>
          <span className="hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer font-bold text-indigo-500 dark:text-indigo-400">{t.footer.obs}</span>
        </div>
      </footer>

    </div>
  );
}
