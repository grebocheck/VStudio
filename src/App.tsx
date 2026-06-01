import React, { useCallback, useRef, useState } from 'react';
import { TrackingMode, SidebarTab } from './types';
import { LeftSidebar } from './components/LeftSidebar';
import { LiveRigWorkspace } from './components/LiveRigWorkspace';
import { useI18n } from './i18n';
import { useTheme } from './theme/ThemeContext';
import { useAvatarStore } from './hooks/useAvatarStore';
import { useMicrophone } from './hooks/useMicrophone';
import { useFaceTracking } from './hooks/useFaceTracking';
import { useCameraCalibration } from './hooks/useCameraCalibration';
import { useFpsMeter } from './hooks/useFpsMeter';
import { DesktopNotice } from './components/DesktopNotice';
import { OnboardingTour } from './components/OnboardingTour';
import { loadJSON, saveJSON, STORAGE_KEYS } from './lib/storage';
import { CircleHelp, Download, Upload } from 'lucide-react';

export default function App() {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isEn = language === 'en';

  const store = useAvatarStore();
  const { config } = store;

  const [trackingMode, setTrackingMode] = useState<TrackingMode>('auto');
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('presets');
  const [onScreenBuster, setScreenBuster] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [rigResetKey, setRigResetKey] = useState(0);
  const [tourOpen, setTourOpen] = useState(() => !loadJSON(STORAGE_KEYS.onboardingComplete, false));
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const cameraCalibration = useCameraCalibration();
  const fps = useFpsMeter();

  // Capture devices stay in the shell; live rig frames are owned below.
  const handleMicrophoneError = useCallback(() => {
    setMicActive(false);
    alert(
      isEn
        ? 'Failed to access microphone. Please verify sound input permissions in your browser.'
        : 'Не вдалося отримати доступ до мікрофону. Перевірте дозволи вашого браузера.',
    );
  }, [isEn]);
  const mic = useMicrophone(micActive, handleMicrophoneError);

  const handleCameraError = useCallback(() => {
    setTrackingMode('auto');
    alert(
      isEn
        ? 'Failed to open camera. Please make sure camera permissions are enabled.'
        : 'Не вдалося увімкнути камеру. Будь ласка, переконайтеся в наданні дозволу на камеру.',
    );
  }, [isEn]);
  const face = useFaceTracking(trackingMode === 'camera', cameraCalibration.profile.deviceId, handleCameraError);
  const openTour = useCallback(() => {
    setActiveSidebarTab('presets');
    setTourOpen(true);
  }, []);
  const closeTour = useCallback(() => {
    saveJSON(STORAGE_KEYS.onboardingComplete, true);
    setTourOpen(false);
  }, []);
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
      setRigResetKey((previous) => previous + 1);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown import error.';
      alert(isEn ? `Import failed: ${message}` : `Не вдалося імпортувати проект: ${message}`);
    }
  };

  return (
    <div
      className={`min-h-screen lg:h-screen lg:overflow-hidden flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative ${
        theme === 'dark' ? 'bg-[#07070a] text-[#d1d1d1]' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Sophisticated Fluid Navigation Bar */}
      <header
        className={`h-14 border-b flex items-center justify-between px-6 shrink-0 z-50 ${
          theme === 'dark' ? 'border-white/10 bg-[#0f0f12]' : 'border-slate-200 bg-white'
        }`}
        aria-label={isEn ? 'V-Studio toolbar' : 'Панель інструментів V-Studio'}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <h1
            className={`font-serif italic text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          >
            V-Studio
            <span className="text-[10px] font-sans not-italic text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-sm ml-1.5 font-bold">
              {t.header.tag}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <input
            ref={importInputRef}
            type="file"
            accept=".vstudio.json,application/json"
            onChange={handleImportProject}
            className="hidden"
          />

          {/* Reopenable first-run guide */}
          <button
            type="button"
            onClick={openTour}
            className={`flex items-center gap-1.5 rounded-sm border p-2 text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            aria-label={t.onboarding.open}
            title={t.onboarding.open}
          >
            <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xl:inline text-[10px] uppercase tracking-wider">{t.onboarding.tour}</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-sm border transition-all cursor-pointer text-xs flex items-center gap-1.5 font-bold ${
              theme === 'dark'
                ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
            title={isEn ? 'Toggle Theme' : 'Змінити тему'}
            aria-label={isEn ? 'Toggle color theme' : 'Змінити колірну тему'}
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-wider">
              {theme === 'dark' ? (isEn ? 'Light' : 'Світла') : isEn ? 'Dark' : 'Темна'}
            </span>
          </button>

          {/* Language Selector Controls */}
          <div
            className={`flex items-center rounded-sm border overflow-hidden p-0.5 ${
              theme === 'dark' ? 'bg-[#07070a] border-white/10' : 'bg-slate-100 border-slate-200'
            }`}
            role="group"
            aria-label={isEn ? 'Interface language' : 'Мова інтерфейсу'}
          >
            <button
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              className={`px-2 py-1 text-[9px] font-bold rounded-sm transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-white/65 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('uk')}
              aria-pressed={language === 'uk'}
              className={`px-2 py-1 text-[9px] font-bold rounded-sm transition-all cursor-pointer ${
                language === 'uk'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-white/65 hover:text-slate-700 dark:hover:text-white'
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
            aria-label={isEn ? 'Export project as JSON' : 'Експортувати проєкт як JSON'}
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
            aria-label={isEn ? 'Import a V-Studio JSON project' : 'Імпортувати JSON-проєкт V-Studio'}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{importSuccess ? t.header.imported : t.header.importProject}</span>
          </button>

          <button
            onClick={handleSaveLocalPreset}
            aria-label={isEn ? 'Save current avatar as a local preset' : 'Зберегти поточний аватар як локальний пресет'}
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
          fps={fps}
        />

        <LiveRigWorkspace
          key={rigResetKey}
          activeSidebarTab={activeSidebarTab}
          config={config}
          setConfig={store.editConfig}
          mergeIntoConfig={store.mergeIntoConfig}
          trackingMode={trackingMode}
          setTrackingMode={setTrackingMode}
          micActive={micActive}
          setMicActive={setMicActive}
          onScreenBuster={onScreenBuster}
          setScreenBuster={setScreenBuster}
          cameraCalibration={cameraCalibration.profile}
          setCameraCalibration={cameraCalibration.setProfile}
          calibrateCameraNeutral={cameraCalibration.calibrateNeutral}
          onResetCameraCalibration={cameraCalibration.resetProfile}
          mic={mic}
          face={face}
          customPresets={store.customPresets}
          activePresetKey={store.activePresetKey}
          onApplyPreset={store.applyPreset}
          onDeleteCustomPreset={store.deleteCustomPreset}
          fps={fps}
        />
      </div>

      {/* Persistent Workspace Footer with dynamic localization settings */}
      <footer
        className={`border-t px-6 py-4 text-center text-[10px] font-mono flex flex-col md:flex-row md:justify-between items-center space-y-2 md:space-y-0 shrink-0 z-10 animate-fade-in ${
          theme === 'dark'
            ? 'border-white/10 bg-[#07070a] text-[#d1d1d1]/65'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <p>{t.footer.copyright}</p>
        <div className="flex space-x-3 text-slate-500 dark:text-white/50">
          <span className="hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer">
            {t.footer.help}
          </span>
          <span className="hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer">
            {t.footer.apache}
          </span>
          <span className="hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer font-bold text-indigo-500 dark:text-indigo-400">
            {t.footer.obs}
          </span>
        </div>
      </footer>

      <DesktopNotice />
      <OnboardingTour open={tourOpen} onClose={closeTour} onSelectTab={setActiveSidebarTab} />
    </div>
  );
}
