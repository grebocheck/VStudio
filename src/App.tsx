import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { CircleHelp, Download, Upload, Undo2, Redo2, Save, Moon, Sun, Sparkles, X, Check } from 'lucide-react';

export default function App() {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isEn = language === 'en';

  const store = useAvatarStore();
  const { config, undo, redo } = store;

  const [trackingMode, setTrackingMode] = useState<TrackingMode>('auto');
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('presets');
  const selectSidebarTab = useCallback((tab: SidebarTab) => {
    setActiveSidebarTab(tab);
    if (window.innerWidth < 700)
      requestAnimationFrame(() =>
        document.getElementById('right-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
  }, []);
  const [onScreenBuster, setScreenBuster] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [notice, setNotice] = useState<{ message: string; error?: boolean } | null>(null);
  const [rigResetKey, setRigResetKey] = useState(0);
  const [tourOpen, setTourOpen] = useState(() => !loadJSON(STORAGE_KEYS.onboardingComplete, false));
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const cameraCalibration = useCameraCalibration();
  const fps = useFpsMeter();

  // Capture devices stay in the shell; live rig frames are owned below.
  const handleMicrophoneError = useCallback(() => {
    setMicActive(false);
    setNotice({
      error: true,
      message: isEn
        ? 'Failed to access microphone. Please verify sound input permissions in your browser.'
        : 'Не вдалося отримати доступ до мікрофона. Перевірте дозволи браузера.',
    });
  }, [isEn]);
  const mic = useMicrophone(micActive, handleMicrophoneError);

  const handleCameraError = useCallback(() => {
    setTrackingMode('auto');
    setNotice({
      error: true,
      message: isEn
        ? 'Failed to open camera. Please make sure camera permissions are enabled.'
        : 'Не вдалося увімкнути камеру. Перевірте дозволи браузера.',
    });
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
    try {
      store.saveCurrentAsPreset(config.name || (isEn ? 'My character' : 'Мій персонаж'));
      setNotice({ message: isEn ? 'Character saved to your collection.' : 'Персонажа збережено у вашу колекцію.' });
    } catch (error) {
      setNotice({ error: true, message: error instanceof Error ? error.message : String(error) });
    }
  };
  const handleExport = () => {
    try {
      store.exportProject();
    } catch (error) {
      setNotice({ error: true, message: error instanceof Error ? error.message : String(error) });
    }
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (tourOpen || event.defaultPrevented || !(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, tourOpen]);

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      await store.importProject(file);
      setRigResetKey((previous) => previous + 1);
      setNotice({
        message: isEn ? 'Project imported. You can undo this change.' : 'Проєкт імпортовано. Цю зміну можна скасувати.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNotice({
        error: true,
        message: isEn ? `Import failed: ${message}` : `Не вдалося імпортувати проєкт: ${message}`,
      });
    }
  };

  return (
    <div className="studio-shell">
      <header className="studio-header" aria-label={isEn ? 'V-Studio toolbar' : 'Панель інструментів V-Studio'}>
        <div className="studio-brand">
          <span className="brand-symbol">
            <Sparkles size={20} />
          </span>
          <h1>
            V<span>Studio</span>
          </h1>
          <span className="brand-caption">CHARACTER STUDIO</span>
        </div>
        <div className="header-actions">
          <div className="history-controls">
            <button
              className="studio-icon-button"
              onClick={store.undo}
              disabled={!store.canUndo}
              aria-label={isEn ? 'Undo' : 'Скасувати'}
              title={isEn ? 'Undo (Ctrl/⌘ Z)' : 'Скасувати (Ctrl/⌘ Z)'}
            >
              <Undo2 size={17} />
            </button>
            <button
              className="studio-icon-button"
              onClick={store.redo}
              disabled={!store.canRedo}
              aria-label={isEn ? 'Redo' : 'Повторити'}
              title={isEn ? 'Redo (Ctrl/⌘ Shift Z)' : 'Повторити (Ctrl/⌘ Shift Z)'}
            >
              <Redo2 size={17} />
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept=".vstudio.json,application/json"
            onChange={handleImportProject}
            className="hidden"
          />
          <button
            className="studio-button toolbar-file"
            onClick={() => importInputRef.current?.click()}
            aria-label={isEn ? 'Import a V-Studio JSON project' : 'Імпортувати JSON-проєкт V-Studio'}
          >
            <Upload size={15} />
            <span>{isEn ? 'Open' : 'Відкрити'}</span>
          </button>
          <button
            className="studio-button toolbar-file"
            onClick={handleExport}
            aria-label={isEn ? 'Export project as JSON' : 'Експортувати проєкт як JSON'}
          >
            <Download size={15} />
            <span>{isEn ? 'Project file' : 'Файл проєкту'}</span>
          </button>
          <button
            className="studio-button primary"
            onClick={handleSaveLocalPreset}
            aria-label={isEn ? 'Save current avatar as a local preset' : 'Зберегти поточний аватар як локальний пресет'}
          >
            <Save size={15} />
            <span>{isEn ? 'Save character' : 'Зберегти'}</span>
          </button>
          <button
            className="studio-icon-button"
            onClick={openTour}
            aria-label={t.onboarding.open}
            title={t.onboarding.open}
          >
            <CircleHelp size={18} />
          </button>
          <button
            className="studio-icon-button"
            onClick={toggleTheme}
            aria-label={isEn ? 'Toggle color theme' : 'Змінити колірну тему'}
            title={isEn ? 'Toggle color theme' : 'Змінити тему'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="language-toggle"
            onClick={() => setLanguage(isEn ? 'uk' : 'en')}
            aria-label={isEn ? 'Switch to Ukrainian' : 'Switch to English'}
          >
            {isEn ? 'EN' : 'UA'}
          </button>
        </div>
      </header>
      {notice && (
        <div className={`studio-notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}>
          {!notice.error && <Check size={16} />}
          <span>{notice.message}</span>
          <button
            className="studio-icon-button"
            onClick={() => setNotice(null)}
            aria-label={isEn ? 'Dismiss notification' : 'Закрити повідомлення'}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {/* Main split workspace layout */}
      <div className="studio-workspace">
        <LeftSidebar
          activeSidebarTab={activeSidebarTab}
          setActiveSidebarTab={selectSidebarTab}
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
          onRandomize={store.randomizeAvatar}
          onSelectTab={selectSidebarTab}
          setConfig={store.editConfig}
          mergeIntoConfig={store.mergeIntoConfig}
          trackingMode={trackingMode}
          setTrackingMode={setTrackingMode}
          micActive={micActive}
          setMicActive={setMicActive}
          onScreenBuster={onScreenBuster}
          setScreenBuster={setScreenBuster}
          cameraCalibration={cameraCalibration.profile}
          cameraCalibrationProfiles={cameraCalibration.profiles}
          activeCameraCalibrationProfileId={cameraCalibration.activeProfileId}
          setCameraCalibration={cameraCalibration.setProfile}
          calibrateCameraNeutral={cameraCalibration.calibrateNeutral}
          onResetCameraCalibration={cameraCalibration.resetProfile}
          onApplyCameraCalibrationProfile={cameraCalibration.applyProfile}
          onSaveCameraCalibrationProfile={cameraCalibration.saveProfile}
          onUpdateCameraCalibrationProfile={cameraCalibration.updateActiveProfile}
          onDeleteCameraCalibrationProfile={cameraCalibration.deleteProfile}
          mic={mic}
          face={face}
          customPresets={store.customPresets}
          activePresetKey={store.activePresetKey}
          onApplyPreset={store.applyPreset}
          onDeleteCustomPreset={store.deleteCustomPreset}
          fps={fps}
        />
      </div>

      <footer className="studio-footer">
        <span>
          <span className="status-dot" />
          {isEn ? 'Your characters stay in this browser' : 'Ваші персонажі зберігаються у цьому браузері'}
        </span>
        <span>{isEn ? 'Download a project file to keep a backup' : 'Завантажте файл проєкту для резервної копії'}</span>
        <button onClick={openTour}>{isEn ? 'Studio guide' : 'Гід студією'} ↗</button>
      </footer>

      <DesktopNotice />
      <OnboardingTour open={tourOpen} onClose={closeTour} onSelectTab={selectSidebarTab} />
    </div>
  );
}
