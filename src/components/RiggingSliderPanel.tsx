import React from 'react';
import { CameraCalibrationProfile, RigParams, TrackingMode } from '../types';
import { Camera, RotateCcw, Smile, HelpCircle, Eye } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { CameraCalibrationPanel } from './CameraCalibrationPanel';

interface RiggingSliderPanelProps {
  rig: RigParams;
  onChange: (updates: Partial<RigParams>) => void;
  onReset: () => void;
  trackingMode: TrackingMode;
  setTrackingMode: (mode: TrackingMode) => void;
  micSupported: boolean;
  micActive: boolean;
  toggleMic: () => void;
  onScreenBuster: boolean;
  setScreenBuster: (val: boolean) => void;
  cameraDevices: MediaDeviceInfo[];
  cameraCalibration: CameraCalibrationProfile;
  setCameraCalibration: React.Dispatch<React.SetStateAction<CameraCalibrationProfile>>;
  refreshCameraDevices: () => void | Promise<void>;
  onCalibrateCameraNeutral: () => void;
  onResetCameraCalibration: () => void;
}

export const RiggingSliderPanel: React.FC<RiggingSliderPanelProps> = ({
  rig,
  onChange,
  onReset,
  trackingMode,
  setTrackingMode,
  micSupported,
  micActive,
  toggleMic,
  onScreenBuster,
  setScreenBuster,
  cameraDevices,
  cameraCalibration,
  setCameraCalibration,
  refreshCameraDevices,
  onCalibrateCameraNeutral,
  onResetCameraCalibration,
}) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';

  const applyExpressionPreset = (preset: string) => {
    switch (preset) {
      case 'smile':
        onChange({
          eyeLOpen: 1.0,
          eyeROpen: 1.0,
          mouthOpen: 0.1,
          mouthForm: 1.0,
          eyebrowY: 2,
          pupilX: 0,
          pupilY: 0,
        });
        break;
      case 'blink':
        onChange({
          eyeLOpen: 0.0,
          eyeROpen: 0.0,
          mouthForm: 0.2,
          eyebrowY: -1,
        });
        break;
      case 'surprised':
        onChange({
          eyeLOpen: 1.0,
          eyeROpen: 1.0,
          mouthOpen: 0.95,
          mouthForm: 0.0,
          eyebrowY: 4,
          pupilX: 0,
          pupilY: -0.2,
        });
        break;
      case 'angry':
        onChange({
          eyeLOpen: 0.8,
          eyeROpen: 0.8,
          mouthOpen: 0.2,
          mouthForm: -0.9,
          eyebrowY: -4,
          pupilX: 0,
          pupilY: 0.3,
        });
        break;
      case 'wink':
        onChange({
          eyeLOpen: 0.0,
          eyeROpen: 1.0,
          mouthOpen: 0.3,
          mouthForm: 0.9,
          eyebrowY: 1,
        });
        break;
      case 'sleepy':
        onChange({
          eyeLOpen: 0.25,
          eyeROpen: 0.25,
          mouthOpen: 0.15,
          mouthForm: -0.2,
          eyebrowY: -1,
          pupilY: 0.5,
        });
        break;
      default:
        onReset();
    }
  };

  const expressions = [
    { id: 'smile', label: isEn ? '😊 Smile' : '😊 Посмішка' },
    { id: 'wink', label: isEn ? '😉 Wink' : '😉 Підмигування' },
    { id: 'surprised', label: isEn ? '😮 Surprised' : '😮 Шокований' },
    { id: 'angry', label: isEn ? '😠 Angry' : '😠 Розлючений' },
    { id: 'sleepy', label: isEn ? '😴 Sleepy' : '😴 Сонний' },
    { id: 'blink', label: isEn ? '😑 Closed Eyes' : '😑 Закриті Очі' },
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Expression Presets */}
      <div>
        <h4 className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 tracking-widest mb-3 flex items-center space-x-1.5 font-mono">
          <Smile className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
          <span>{isEn ? "Emotion Controls (Live2D Presets)" : "Керування Емоціями (Live2D Presets)"}</span>
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {expressions.map((item) => (
            <button
              key={item.id}
              onClick={() => applyExpressionPreset(item.id)}
              className={`px-2.5 py-2 text-[11px] font-semibold rounded-sm border transition-all text-center cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0a0a0c] hover:bg-white/5 text-white/90 border-white/10'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-205'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controller Mode Selection */}
      <div className={`p-4 rounded border shadow-inner ${
        theme === 'dark' ? 'bg-[#0a0a0c] border-white/10' : 'bg-slate-100/50 border-slate-200'
      }`}>
        <h4 className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 tracking-widest mb-3 font-mono">
          {isEn ? "INTERACTIVE RIG TRACKING ENGINE SOURCE" : "ДЖЕРЕЛО ІНТЕРАКТИВНОГО РУХУ"}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTrackingMode('manual')}
            className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-all cursor-pointer ${
              trackingMode === 'manual'
                ? theme === 'dark'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                : theme === 'dark'
                  ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isEn ? "🎛️ Manual Sliders" : "🎛️ Ручні повзунки"}
          </button>
          
          <button
            onClick={() => setTrackingMode('mouse')}
            className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-all cursor-pointer ${
              trackingMode === 'mouse'
                ? theme === 'dark'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                : theme === 'dark'
                  ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.riggingPanel.mouseCursorMode}
          </button>
          
          <button
            onClick={() => setTrackingMode('auto')}
            className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-all cursor-pointer ${
              trackingMode === 'auto'
                ? theme === 'dark'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                : theme === 'dark'
                  ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.riggingPanel.autoTrackMode}
          </button>
          
          <button
            onClick={toggleMic}
            disabled={!micSupported}
            className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              micActive
                ? theme === 'dark'
                  ? 'bg-emerald-600/20 border-emerald-500/65 text-white font-bold'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-850 font-bold'
                : theme === 'dark'
                  ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{micActive ? (isEn ? '🎤 Voice Active' : '🎤 Голос Активний') : (isEn ? '🎤 Voice Sync' : '🎤 Синхр. з голосом')}</span>
          </button>

          <button
            onClick={() => setTrackingMode(trackingMode === 'camera' ? 'auto' : 'camera')}
            className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              trackingMode === 'camera'
                ? theme === 'dark'
                  ? 'bg-rose-600/20 border-rose-500/65 text-white font-bold'
                  : 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                : theme === 'dark'
                  ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>{t.riggingPanel.cameraMode}</span>
          </button>
        </div>

        {/* Informational tracking notice */}
        {trackingMode === 'mouse' && (
          <p className="text-[11px] text-slate-500 dark:text-white/50 mt-2.5 flex items-center space-x-1">
            <Eye className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>{isEn ? "The avatar will smoothly follow mouse coordinates inside the viewport." : "Аватар плавно слідкуватиме очима та головою за рухом миші у зоні перегляду."}</span>
          </p>
        )}
        {micActive && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2.5 flex items-center space-x-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{isEn ? "The avatar's mouth opens and flaps automatically based on microphone audio volume!" : "Рот аватара автоматично відкриватиметься під гучність вашого мікрофону!"}</span>
          </p>
        )}
      </div>

      <CameraCalibrationPanel
        trackingMode={trackingMode}
        setTrackingMode={setTrackingMode}
        devices={cameraDevices}
        profile={cameraCalibration}
        setProfile={setCameraCalibration}
        onRefreshDevices={refreshCameraDevices}
        onCalibrateNeutral={onCalibrateCameraNeutral}
        onResetProfile={onResetCameraCalibration}
      />

      {/* Manual Rigging Sliders */}
      <div className={`space-y-4 ${trackingMode !== 'manual' ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">
            {isEn ? "MANUAL RIGGING SIMULATION" : "ПОВЗУНКИ СИМУЛЯЦІЇ RIGGING"}
          </span>
          <button
            onClick={onReset}
            disabled={trackingMode !== 'manual'}
            className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center space-x-1 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isEn ? "Reset All" : "Скинути"}</span>
          </button>
        </div>

        {/* Head rotations */}
        <div className={`space-y-3 p-3 rounded border ${
          theme === 'dark' ? 'bg-[#0a0a0c] border-white/5' : 'bg-white border-slate-200'
        }`}>
          <h5 className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest font-mono">{isEn ? "HEAD ORIENTATION & SWAY" : "ОРІЄНТАЦІЯ ГОЛОВИ"}</h5>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-white/40">{t.riggingPanel.headMovement}</span>
              <span className="text-slate-800 dark:text-white/80 font-bold">{rig.angleX}°</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={rig.angleX}
              onChange={(e) => onChange({ angleX: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
              style={{ accentColor: '#6366f1' }}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-white/40">{t.riggingPanel.headPitch}</span>
              <span className="text-slate-800 dark:text-white/80 font-bold">{rig.angleY}°</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              value={rig.angleY}
              onChange={(e) => onChange({ angleY: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
              style={{ accentColor: '#6366f1' }}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-white/40">{t.riggingPanel.headRoll}</span>
              <span className="text-slate-800 dark:text-white/80 font-bold">{rig.angleZ}°</span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              value={rig.angleZ}
              onChange={(e) => onChange({ angleZ: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
              style={{ accentColor: '#6366f1' }}
            />
          </div>
        </div>

        {/* Eyes controls */}
        <div className={`space-y-3 p-3 rounded border ${
          theme === 'dark' ? 'bg-[#0a0a0c] border-white/5' : 'bg-white border-slate-200'
        }`}>
          <h5 className="text-[10px] text-pink-500 font-bold uppercase tracking-widest font-mono">{isEn ? "EYES & PUPILS DEVIATION" : "ОЧІ & ЗІНИЦІ"}</h5>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-white/40 text-[10px] truncate">{isEn ? "Left eye" : "Ліве око"}</span>
                <span className="text-slate-800 dark:text-white/85 font-mono">{Math.round(rig.eyeLOpen * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rig.eyeLOpen * 100}
                onChange={(e) => onChange({ eyeLOpen: parseInt(e.target.value) / 100 })}
                className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
                style={{ accentColor: '#ec4899' }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-white/40 text-[10px] truncate">{isEn ? "Right eye" : "Праве око"}</span>
                <span className="text-slate-800 dark:text-white/85 font-mono">{Math.round(rig.eyeROpen * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rig.eyeROpen * 100}
                onChange={(e) => onChange({ eyeROpen: parseInt(e.target.value) / 100 })}
                className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
                style={{ accentColor: '#ec4899' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-white/40 text-[10px] truncate">{isEn ? "Pupil X" : "Зіниці X"}</span>
                <span className="text-slate-800 dark:text-white/85 font-mono">{rig.pupilX}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={rig.pupilX * 100}
                onChange={(e) => onChange({ pupilX: parseInt(e.target.value) / 100 })}
                className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
                style={{ accentColor: '#ec4899' }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-white/40 text-[10px] truncate">{isEn ? "Pupil Y" : "Зіниці Y"}</span>
                <span className="text-slate-800 dark:text-white/85 font-mono">{rig.pupilY}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={rig.pupilY * 100}
                onChange={(e) => onChange({ pupilY: parseInt(e.target.value) / 100 })}
                className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
                style={{ accentColor: '#ec4899' }}
              />
            </div>
          </div>
        </div>

        {/* Mouth controls */}
        <div className={`space-y-3 p-3 rounded border ${
          theme === 'dark' ? 'bg-[#0a0a0c] border-white/5' : 'bg-white border-slate-200'
        }`}>
          <h5 className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest font-mono">{isEn ? "MOUTH RIG & ARTICULATION" : "РОТ & ВИРАЗ"}</h5>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-white/40">{t.riggingPanel.mouthOpen}</span>
              <span className="text-slate-800 dark:text-white/80 font-bold">{Math.round(rig.mouthOpen * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rig.mouthOpen * 100}
              onChange={(e) => onChange({ mouthOpen: parseInt(e.target.value) / 100 })}
              className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
              style={{ accentColor: '#0d9488' }}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-500 dark:text-white/40">{t.riggingPanel.mouthForm}</span>
              <span className="text-slate-800 dark:text-white/80 font-bold">
                {rig.mouthForm > 0 ? (isEn ? `Smile (+${rig.mouthForm})` : `Посмішка (+${rig.mouthForm})`) : (isEn ? `Sad (${rig.mouthForm})` : `Смуток (${rig.mouthForm})`)}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={rig.mouthForm * 100}
              onChange={(e) => onChange({ mouthForm: parseInt(e.target.value) / 100 })}
              className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-sm appearance-none cursor-pointer"
              style={{ accentColor: '#0d9488' }}
            />
          </div>
        </div>
      </div>

      {/* ScreenBuster toggle */}
      <div className={`p-3.5 rounded border flex items-center justify-between ${
        theme === 'dark' ? 'bg-[#0a0a0c] border-white/5' : 'bg-white border-slate-200 shadow-inner'
      }`}>
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4.5 h-4.5 text-slate-400 dark:text-white/40 shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-white/90">
              {isEn ? "Show Calibration Frame" : "Показати Сітку Деформації"}
            </p>
            <p className="text-[9px] text-slate-500 dark:text-white/45 font-mono">
              {isEn ? "Live2D vector mesh skeleton visual lines" : "Візуальний режим Live2D скелету"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setScreenBuster(!onScreenBuster)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            onScreenBuster ? 'bg-indigo-600' : 'bg-[#1c1c24] dark:bg-[#1a1a24] bg-slate-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              onScreenBuster ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Interactive Expression Trigger Guide Card */}
      <div className={`p-4 rounded border text-left space-y-3 ${
        theme === 'dark' ? 'bg-[#0e0e13] border-indigo-500/10' : 'bg-slate-50 border-slate-200 shadow-inner'
      }`}>
        <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-250/25 dark:border-white/5">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
          <h4 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase font-sans tracking-wide">
            {isEn ? "📸 EXPRESSION TRIGGER GUIDE" : "📸 КЕРУВАННЯ ТА ТРИГЕРИ ЖЕСТІВ"}
          </h4>
        </div>
        
        <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
          {isEn
            ? "Your camera captures high-fidelity micro-expressions! Maintain solid, even lighting and face your screen directly. Below are custom camera gesture triggers:"
            : "Камера зчитує ваші мікровирази обличчя! Забезпечте рівномірне освітлення та дивіться прямо в екран. Спробуйте наступні тригери:"}
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {/* Dizzy */}
          <div className="p-2 rounded bg-yellow-500/5 border border-yellow-500/10 text-[10px]">
            <p className="font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-between">
              <span>{isEn ? "🌀 Dizzy State (Spinning Spirals)" : "🌀 Запаморочення (Спіралі в очах)"}</span>
              <span className="text-[9px] px-1 bg-yellow-500/10 rounded">@_@</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Rotate or shake your head left/right very quickly OR cross your eyes!" 
                : "Швидко покрутіть або похитайте головою вліво-вправо АБО зведіть очі до носа (скосіть очі)!"}
            </p>
          </div>

          {/* Sleepy */}
          <div className="p-2 rounded bg-indigo-500/5 border border-indigo-500/10 text-[10px]">
            <p className="font-bold text-indigo-500 flex items-center justify-between">
              <span>{isEn ? "😴 Sleepy State (Zzz Bubbles)" : "😴 Сонливість (Бульбашка та Zzz)"}</span>
              <span className="text-[9px] px-1 bg-indigo-500/10 rounded">Zzz</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Look down deeply, tilt your head slightly down, and let your eyelids droop." 
                : "Подивіться глибоко вниз, нахиліть трохи голову та прикрийте наполовину очі."}
            </p>
          </div>

          {/* Scared */}
          <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-[10px]">
            <p className="font-bold text-amber-600 dark:text-amber-500 flex items-center justify-between">
              <span>{isEn ? "😨 Scared (Panicked Shivering)" : "😨 Переляк (Панічне дрижання)"}</span>
              <span className="text-[9px] px-1 bg-amber-500/10 rounded">! !</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Open your eyes extremely wide (surprised look) and drop your jaw down!" 
                : "Дуже широко розплющте очі (здивований погляд) та сильно опустіть/відкрийте рота!"}
            </p>
          </div>

          {/* Shy */}
          <div className="p-2 rounded bg-rose-500/5 border border-rose-500/10 text-[10px]">
            <p className="font-bold text-rose-500 flex items-center justify-between">
              <span>{isEn ? "😳 Shy / Embarrassed (Red Cheeks)" : "😳 Сором'язливість (Червоні щоки)"}</span>
              <span className="text-[10px] px-1 bg-rose-500/10 rounded">Blush</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Make a very subtle, small closed smile while raising your cheek muscles." 
                : "Легко й ніжно посміхніться із закритим ротом, піднімаючи вилиці (cheek squint)."}
            </p>
          </div>

          {/* Relaxed */}
          <div className="p-2 rounded bg-red-400/5 border border-red-400/10 text-[10px]">
            <p className="font-bold text-red-500 flex items-center justify-between">
              <span>{isEn ? "🌸 Relaxed / Chill (Sakura Petals)" : "🌸 Розслаблення (Пелюстки сакури)"}</span>
              <span className="text-[9px] px-1 bg-red-400/10 rounded">Chill</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Relax your eyebrows, look down slightly, and make a soft warm smile." 
                : "Розслабте та опустіть брови, подивіться трохи вниз та тепло посміхніться."}
            </p>
          </div>

          {/* Love */}
          <div className="p-2 rounded bg-pink-500/5 border border-pink-500/10 text-[10px]">
            <p className="font-bold text-pink-500 flex items-center justify-between">
              <span>{isEn ? "💖 Love (Pulsing Heart Eyes)" : "💖 Кохання (Сердечка в очах)"}</span>
              <span className="text-[9px] px-1 bg-pink-500/10 rounded">Kiss</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Pucker / fold your lips in a puckered shape or pretend to blow a kiss!" 
                : "Складіть губи трубочкою (pucker) або покажіть повітряний поцілунок!"}
            </p>
          </div>

          {/* Starry */}
          <div className="p-2 rounded bg-purple-500/5 border border-purple-500/10 text-[10px]">
            <p className="font-bold text-purple-500 flex items-center justify-between">
              <span>{isEn ? "⭐ Starry Excitement (Sparks)" : "⭐ Захоплення (Очі-зірочки)"}</span>
              <span className="text-[9px] px-1 bg-purple-500/10 rounded">✨</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Raise your eyebrows high up and smile widely (showing teeth)!" 
                : "Високо підніміть очі та брови вгору і водночас широко радісно посміхніться!"}
            </p>
          </div>

          {/* Tongue Out */}
          <div className="p-2 rounded bg-teal-500/5 border border-teal-500/10 text-[10px]">
            <p className="font-bold text-teal-600 dark:text-teal-400 flex items-center justify-between">
              <span>{isEn ? "👅 Tongue Out (Playful / Wink)" : "👅 Показування язика (Ahegao)"}</span>
              <span className="text-[9px] px-1 bg-teal-500/10 rounded">Ahegao</span>
            </p>
            <p className="text-slate-500 dark:text-white/50 mt-0.5 leading-snug">
              {isEn 
                ? "Stick your tongue out! Works best with winking & looking down." 
                : "Просто висуньте язик у кадрі! Особливо ефектно виглядає під час підморгування."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
