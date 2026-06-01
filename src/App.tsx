import React, { useRef, useState } from 'react';
import { RigParams, TrackingMode, SidebarTab, AvatarConfig } from './types';
import { INITIAL_RIG, PRESETS } from './presets';
import { LeftSidebar } from './components/LeftSidebar';
import { CenterStage } from './components/CenterStage';
import { RightSidebar } from './components/RightSidebar';
import { useI18n } from './i18n';
import { useTheme } from './theme/ThemeContext';
import { useAvatarStore } from './hooks/useAvatarStore';
import { useMicrophone } from './hooks/useMicrophone';
import { useFaceTracking } from './hooks/useFaceTracking';
import { useAnimationEngine } from './hooks/useAnimationEngine';
import { useOverlayBroadcast } from './hooks/useOverlaySync';
import { useEmotes } from './hooks/useEmotes';
import { useCameraCalibration } from './hooks/useCameraCalibration';
import { Download, Upload } from 'lucide-react';

export default function App() {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isEn = language === 'en';

  const store = useAvatarStore();
  const { config } = store;

  const [rig, setRig] = useState<RigParams>(INITIAL_RIG);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('auto');
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('presets');
  const [onScreenBuster, setScreenBuster] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const avatarSvgRef = useRef<SVGSVGElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const cameraCalibration = useCameraCalibration();

  // Capture devices + per-frame animation engine.
  const mic = useMicrophone(micActive, () => {
    setMicActive(false);
    alert(isEn
      ? 'Failed to access microphone. Please verify sound input permissions in your browser.'
      : 'Не вдалося отримати доступ до мікрофону. Перевірте дозволи вашого браузера.');
  });
  const face = useFaceTracking(trackingMode === 'camera', cameraCalibration.profile.deviceId, () => {
    setTrackingMode('auto');
    alert(isEn
      ? 'Failed to open camera. Please make sure camera permissions are enabled.'
      : 'Не вдалося увімкнути камеру. Будь ласка, переконайтеся в наданні дозволу на камеру.');
  });
  const emotes = useEmotes();
  useAnimationEngine({
    trackingMode,
    micActive,
    mic,
    face,
    cameraCalibration: cameraCalibration.profile,
    emoteRef: emotes.emoteRef,
    setRig,
  });

  // Stream live state to any connected OBS overlay (see /overlay).
  const overlayCount = useOverlayBroadcast(config, rig);

  const handleRigChange = (updates: Partial<RigParams>) => setRig((prev) => ({ ...prev, ...updates }));
  const handleResetRig = () => setRig(INITIAL_RIG);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      const response = await fetch('/api/gemini/generate-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не вдалося згенерувати аватар з ШІ.');

      store.mergeIntoConfig(data as Partial<AvatarConfig>);
      setRig((prev) => ({ ...prev, mouthForm: 0.9, mouthOpen: 0.15, eyebrowY: 2, angleY: 5 }));
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Синтаксична помилка.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveLocalPreset = () => {
    store.saveCurrentAsPreset(`${config.name || (isEn ? 'Personal' : 'Особистий')} (${isEn ? 'Saved' : 'Збережений'})`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    try {
      await store.importProject(file);
      setRig(INITIAL_RIG);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown import error.';
      alert(isEn ? `Import failed: ${message}` : `Не вдалося імпортувати проект: ${message}`);
    }
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
            <span className="text-[10px] font-sans not-italic text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-sm ml-1.5 font-bold">
              {t.header.tag}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <input
            ref={importInputRef}
            type="file"
            accept=".vstudio.json,application/json"
            onChange={handleImportProject}
            className="hidden"
          />

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-sm border transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            title={isEn ? 'Toggle Theme' : 'Змінити тему'}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-wider">
              {theme === 'dark' ? (isEn ? 'Light' : 'Світла') : (isEn ? 'Dark' : 'Темна')}
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
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              UA
            </button>
          </div>

          <button
            onClick={store.exportProject}
            className={`px-3 py-1.5 border rounded-sm text-[10px] font-bold tracking-wider transition-all uppercase cursor-pointer flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
            title={isEn ? 'Export project as .json' : 'Експортувати проект у .json'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.header.exportProject}</span>
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className={`px-3 py-1.5 border rounded-sm text-[10px] font-bold tracking-wider transition-all uppercase cursor-pointer flex items-center gap-1.5 ${
              importSuccess
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                : theme === 'dark'
                  ? 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
            title={isEn ? 'Import a .vstudio.json project' : 'Імпортувати проект .vstudio.json'}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{importSuccess ? t.header.imported : t.header.importProject}</span>
          </button>

          <button
            onClick={handleSaveLocalPreset}
            className={`px-4 py-1.5 border rounded-sm text-[10px] font-bold tracking-wider transition-all uppercase cursor-pointer ${
              theme === 'dark'
                ? 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white'
                : 'border-indigo-200 hover:border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            {saveSuccess ? t.header.saved : t.header.saveProject}
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
          videoRef={face.videoRef}
          isModelLoading={face.isModelLoading}
        />

        <CenterStage
          config={config}
          setConfig={store.editConfig}
          rig={rig}
          onScreenBuster={onScreenBuster}
          trackingMode={trackingMode}
          activePresetKey={store.activePresetKey}
          activeEmote={emotes.activeEmote}
          onEmote={emotes.triggerEmote}
          avatarSvgRef={avatarSvgRef}
        />

        <RightSidebar
          activeSidebarTab={activeSidebarTab}
          config={config}
          setConfig={store.editConfig}
          rig={rig}
          handleRigChange={handleRigChange}
          handleResetRig={handleResetRig}
          trackingMode={trackingMode}
          setTrackingMode={setTrackingMode}
          micActive={micActive}
          setMicActive={setMicActive}
          onScreenBuster={onScreenBuster}
          setScreenBuster={setScreenBuster}
          cameraDevices={face.devices}
          cameraCalibration={cameraCalibration.profile}
          setCameraCalibration={cameraCalibration.setProfile}
          refreshCameraDevices={face.refreshDevices}
          onCalibrateCameraNeutral={() => cameraCalibration.calibrateNeutral(rig)}
          onResetCameraCalibration={cameraCalibration.resetProfile}
          avatarSvgRef={avatarSvgRef}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          aiGenerating={aiGenerating}
          aiError={aiError}
          handleAiGenerate={handleAiGenerate}
          customPresets={store.customPresets}
          PRESETS={PRESETS}
          activePresetKey={store.activePresetKey}
          onApplyPreset={store.applyPreset}
          onDeleteCustomPreset={store.deleteCustomPreset}
          overlayCount={overlayCount}
        />
      </div>

      {/* Persistent Workspace Footer with dynamic localization settings */}
      <footer className={`border-t px-6 py-4 text-center text-[10px] font-mono flex flex-col md:flex-row md:justify-between items-center space-y-2 md:space-y-0 shrink-0 z-10 animate-fade-in ${
        theme === 'dark' ? 'border-white/10 bg-[#07070a] text-[#d1d1d1]/40' : 'border-slate-200 bg-white text-slate-500'
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
