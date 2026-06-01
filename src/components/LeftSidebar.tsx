import React from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { TrackingMode, SidebarTab } from '../types';

interface LeftSidebarProps {
  activeSidebarTab: SidebarTab;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  trackingMode: TrackingMode;
  setTrackingMode: (mode: TrackingMode) => void;
  micActive: boolean;
  setMicActive: (active: boolean) => void;
  onScreenBuster: boolean;
  setScreenBuster: (val: boolean) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isModelLoading?: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeSidebarTab,
  setActiveSidebarTab,
  trackingMode,
  setTrackingMode,
  micActive,
  setMicActive,
  onScreenBuster,
  setScreenBuster,
  videoRef,
  isModelLoading = false,
}) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();

  return (
    <aside className={`w-full lg:w-76 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col justify-between p-4 gap-4 overflow-y-auto ${
      theme === 'dark' 
        ? 'border-white/10 bg-[#0f0f12]/95 text-[#d1d1d1]' 
        : 'border-slate-200 bg-white text-slate-800'
    }`} id="left-sidebar">
      <div className="space-y-4">
        <span className="text-[9px] uppercase font-bold text-indigo-500 dark:text-indigo-400 tracking-widest block font-mono pl-1">
          {t.leftSidebar.menuTitle}
        </span>
        
        <nav className="flex flex-col gap-1">
          {[
            { id: 'presets', label: t.leftSidebar.tabs.presets },
            { id: 'hair', label: t.leftSidebar.tabs.hair },
            { id: 'face', label: t.leftSidebar.tabs.face },
            { id: 'clothes', label: t.leftSidebar.tabs.clothes },
            { id: 'metadata', label: t.leftSidebar.tabs.metadata },
            { id: 'rigging', label: t.leftSidebar.tabs.rigging },
            { id: 'ai', label: t.leftSidebar.tabs.ai },
            { id: 'obs', label: t.leftSidebar.tabs.obs },
          ].map((tab) => (
            <button
              id={`tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveSidebarTab(tab.id as any)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-xs font-semibold transition-all cursor-pointer text-left ${
                activeSidebarTab === tab.id
                  ? theme === 'dark'
                    ? 'bg-indigo-600/20 border-l-2 border-indigo-500 text-white shadow-inner font-bold'
                    : 'bg-indigo-50 border-l-2 border-indigo-600 text-indigo-700 font-bold'
                  : theme === 'dark'
                    ? 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-medium'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {activeSidebarTab === tab.id && <Check className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 ml-1" />}
            </button>
          ))}
        </nav>
      </div>

      <div className={`pt-4 border-t flex flex-col gap-4 shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-white/30 tracking-widest pl-1 block font-mono mb-2">
            {t.leftSidebar.quickModes}
          </span>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <button
                id="toggle-tracking-cmd"
                onClick={() => setTrackingMode(trackingMode === 'mouse' ? 'auto' : 'mouse')}
                className={`py-2 px-1 rounded-sm border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  trackingMode === 'mouse'
                    ? theme === 'dark'
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                      : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/10'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={t.leftSidebar.cursorTracking}
              >
                <span className="text-sm">🖱️</span>
                <span>{t.leftSidebar.cursorTracking}</span>
              </button>

              <button
                id="toggle-mic-cmd"
                onClick={() => setMicActive(!micActive)}
                className={`py-2 px-1 rounded-sm border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  micActive
                    ? theme === 'dark'
                      ? 'bg-emerald-600/20 border-emerald-500/60 text-white'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/10'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={t.leftSidebar.voiceMatch}
              >
                <span className="text-sm">{micActive ? '🎙️' : '🎤'}</span>
                <span>{t.leftSidebar.voiceMatch}</span>
              </button>
            </div>

            <button
              id="toggle-camera-cmd"
              onClick={() => setTrackingMode(trackingMode === 'camera' ? 'auto' : 'camera')}
              className={`w-full py-2.5 rounded-sm border flex items-center justify-center gap-2 text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider ${
                trackingMode === 'camera'
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 font-bold'
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/10'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={t.leftSidebar.cameraTracking || "Camera Tracking"}
            >
              <span className="text-sm">📹</span>
              <span>{t.leftSidebar.cameraTracking || (language === 'uk' ? "Захват камери" : "Camera tracking")}</span>
            </button>

             {trackingMode === 'camera' && (
              <div className="relative mt-1 rounded-sm overflow-hidden border border-rose-500/30 aspect-video bg-black/40">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute top-1.5 left-1.5 bg-rose-600 text-[8px] font-mono font-bold text-white px-1 py-0.5 rounded-sm flex items-center gap-1 shadow-md z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  CAM RIGGING
                </div>
                
                {isModelLoading && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3 text-center transition-all backdrop-blur-xs z-20">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500/40 border-t-indigo-400 animate-spin mb-2" />
                    <span className="text-[9px] text-white/90 font-bold uppercase tracking-wider animate-pulse">
                      {language === 'uk' ? 'Ініціалізація ШІ трекера...' : 'Initializing Tracking Model...'}
                    </span>
                    <span className="text-[7.5px] text-white/50 font-mono mt-1 block max-w-[160px] leading-relaxed">
                      {language === 'uk' ? 'Завантаження MediaPipe Face Mesh (~5MB) із CDN для високоточного захоплення очей та міміки.' : 'Loading MediaPipe Face Mesh (~5MB) model for high-precision live tracking.'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          id="toggle-mesh-cmd"
          onClick={() => setScreenBuster(!onScreenBuster)}
          className={`w-full py-2.5 border rounded-sm text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer text-center ${
            onScreenBuster
              ? 'bg-amber-600/25 border-amber-500/60 text-amber-300'
              : theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {onScreenBuster ? t.leftSidebar.diagnosticOn : t.leftSidebar.vectorMesh}
        </button>
        
        <div className={`p-2.5 rounded-sm border text-[9px] font-mono space-y-1 ${
          theme === 'dark'
            ? 'bg-white/5 border-white/5 text-white/40'
            : 'bg-slate-50 border-slate-200/60 text-slate-500'
        }`} id="diagnostics-monitor">
          <span className={`block uppercase text-[8px] font-bold tracking-wide ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>{t.leftSidebar.engineResources}</span>
          <div className="flex justify-between"><span>{t.leftSidebar.fps}</span> <span className="text-emerald-500 dark:text-emerald-400 font-bold">60.0 FPS</span></div>
          <div className="flex justify-between"><span>{t.leftSidebar.updated}</span> <span className="text-indigo-500 dark:text-indigo-400">{t.centerStage.liveIndicator}</span></div>
        </div>
      </div>
    </aside>
  );
};

