import React from 'react';
import {
  Users,
  Scissors,
  Eye,
  Shirt,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Sticker,
  Monitor,
  MousePointer2,
  Mic,
  Camera,
  ChevronRight,
} from 'lucide-react';
import { useI18n } from '../i18n';
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
  fps?: number | null;
}

const LeftSidebarComponent: React.FC<LeftSidebarProps> = ({
  activeSidebarTab,
  setActiveSidebarTab,
  trackingMode,
  setTrackingMode,
  micActive,
  setMicActive,
  videoRef,
  isModelLoading = false,
}) => {
  const { t, language } = useI18n();
  const en = language === 'en';
  const groups = [
    {
      title: en ? 'CREATE' : 'СТВОРЕННЯ',
      tabs: [
        { id: 'presets', label: en ? 'Characters' : 'Персонажі', icon: Users },
        { id: 'hair', label: en ? 'Hair & colour' : 'Волосся та колір', icon: Scissors },
        { id: 'face', label: en ? 'Face & expression' : 'Обличчя та міміка', icon: Eye },
        { id: 'clothes', label: en ? 'Outfit & accessories' : 'Одяг та аксесуари', icon: Shirt },
        { id: 'metadata', label: en ? 'Name & story' : 'Ім’я та історія', icon: FileText },
        { id: 'ai', label: en ? 'AI stylist' : 'ШІ-стиліст', icon: Sparkles },
      ],
    },
    {
      title: en ? 'MAKE IT YOURS' : 'ВИКОРИСТАННЯ',
      tabs: [
        { id: 'stickers', label: en ? 'Telegram stickers' : 'Стікери Telegram', icon: Sticker },
        { id: 'rigging', label: en ? 'Rigging & Calibration' : 'Ригінг та калібрування', icon: SlidersHorizontal },
        { id: 'obs', label: en ? 'OBS Integration' : 'Інтеграція з OBS', icon: Monitor },
      ],
    },
  ];
  return (
    <aside id="left-sidebar" className="studio-nav" aria-label={en ? 'Studio settings' : 'Налаштування студії'}>
      <nav aria-label={t.leftSidebar.menuTitle}>
        {groups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p className="eyebrow">{group.title}</p>
            <div className="nav-items">
              {group.tabs.map(({ id, label, icon: Icon }) => (
                <button
                  id={`tab-btn-${id}`}
                  key={id}
                  onClick={() => setActiveSidebarTab(id as SidebarTab)}
                  aria-current={activeSidebarTab === id ? 'page' : undefined}
                  className={`nav-item ${activeSidebarTab === id ? 'active' : ''}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{label}</span>
                  {activeSidebarTab === id && <ChevronRight size={14} className="nav-chevron" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="live-controls">
        <p className="eyebrow">{en ? 'BRING IT TO LIFE' : 'ОЖИВІТЬ ПЕРСОНАЖА'}</p>
        <div className="tracking-buttons">
          <button
            id="toggle-tracking-cmd"
            className="tracking-button"
            aria-pressed={trackingMode === 'mouse'}
            onClick={() => setTrackingMode(trackingMode === 'mouse' ? 'auto' : 'mouse')}
          >
            <MousePointer2 size={17} />
            <span>{en ? 'Cursor' : 'Курсор'}</span>
          </button>
          <button
            id="toggle-mic-cmd"
            className="tracking-button"
            aria-pressed={micActive}
            onClick={() => setMicActive(!micActive)}
          >
            <Mic size={17} />
            <span>{en ? 'Voice' : 'Голос'}</span>
          </button>
          <button
            id="toggle-camera-cmd"
            className="tracking-button"
            aria-pressed={trackingMode === 'camera'}
            onClick={() => setTrackingMode(trackingMode === 'camera' ? 'auto' : 'camera')}
          >
            <Camera size={17} />
            <span>{en ? 'Camera' : 'Камера'}</span>
          </button>
        </div>
        <p className="nav-hint">
          {en
            ? 'Camera and voice tracking stay on your device.'
            : 'Обробка камери й голосу відбувається на вашому пристрої.'}
        </p>
        {trackingMode === 'camera' && (
          <div className="camera-preview">
            <video ref={videoRef} muted playsInline aria-label={en ? 'Camera preview' : 'Попередній перегляд камери'} />
            {isModelLoading && <p role="status">{en ? 'Loading face tracker…' : 'Завантаження трекера…'}</p>}
          </div>
        )}
      </div>
    </aside>
  );
};
export const LeftSidebar = React.memo(LeftSidebarComponent);
