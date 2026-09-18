import React, { useRef, useState } from 'react';
import { AvatarConfig, RigParams, TrackingMode, Emotion, SidebarTab } from '../types';
import { VTuberAvatar } from './VTuberAvatar';
import { Shuffle, Download, Sticker, ArrowUpRight, Play, Pause, Minus, Plus } from 'lucide-react';
import { useI18n } from '../i18n';
import { localizePreset } from '../presets';
import { EmoteTriggerBar } from './CenterStageStatic';
import { avatarSvgToPngBlob, avatarExportFileName, downloadBlob } from '../lib/avatarExport';

interface CenterStageProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  rig: RigParams;
  onScreenBuster: boolean;
  trackingMode: TrackingMode;
  setTrackingMode: (mode: TrackingMode) => void;
  micActive: boolean;
  setMicActive: (active: boolean) => void;
  activePresetKey: string | null;
  activeEmote: Emotion | null;
  onEmote: (emotion: Emotion) => void;
  avatarSvgRef: React.RefObject<SVGSVGElement | null>;
  onRandomize: () => void;
  onSelectTab: (tab: SidebarTab) => void;
  fps?: number | null;
}

export const CenterStage: React.FC<CenterStageProps> = ({
  config,
  setConfig,
  rig,
  onScreenBuster,
  trackingMode,
  setTrackingMode,
  micActive,
  setMicActive,
  activePresetKey,
  activeEmote,
  onEmote,
  avatarSvgRef,
  onRandomize,
  onSelectTab,
}) => {
  const { t, language } = useI18n();
  const en = language === 'en';
  const resumeMode = useRef<{ trackingMode: TrackingMode; micActive: boolean } | null>(null);
  const [backdrop, setBackdrop] = useState('lavender');
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localized = localizePreset(activePresetKey, t);
  const name = localized?.name || config.name || t.presets.customSaved;
  const paused = trackingMode === 'manual' && !micActive;
  const savePng = async () => {
    if (!avatarSvgRef.current) return;
    setExporting(true);
    setError(null);
    try {
      const blob = await avatarSvgToPngBlob(avatarSvgRef.current, { width: 1600, height: 1600, transparent: true });
      downloadBlob(blob, avatarExportFileName(name, 'png'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : en
            ? 'Export failed. Try again.'
            : 'Не вдалося експортувати. Спробуйте ще раз.',
      );
    } finally {
      setExporting(false);
    }
  };
  return (
    <main className="character-workspace" id="center-stage-container" aria-label={t.centerStage.title}>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">{en ? 'YOUR CHARACTER, YOUR WORLD' : 'ВАШ ПЕРСОНАЖ, ВАШ СВІТ'}</p>
          <h2>{name}</h2>
          <p>{en ? 'A little personality. A thousand possibilities.' : 'Трохи характеру. Безліч можливостей.'}</p>
        </div>
        <button
          id="shuffle-hair-style"
          className="studio-button"
          onClick={onRandomize}
          aria-label={en ? 'Surprise me' : 'Здивуй мене'}
        >
          <Shuffle size={16} />
          <span>{en ? 'Surprise me' : 'Здивуй мене'}</span>
        </button>
      </div>
      {(config.modelId === 'miya-nocturne' || config.modelId === 'aurelia-3d') && (
        <div className="premium-framing" role="group" aria-label={en ? 'Model framing' : 'Кадрування моделі'}>
          <span>
            {config.modelId === 'aurelia-3d'
              ? en
                ? 'AURELIA · 3D'
                : 'АВРЕЛІЯ · 3D'
              : en
                ? 'MIYA · NOCTURNE'
                : 'МІЯ · НОКТЮРН'}
          </span>
          {(['portrait', 'halfbody', 'full'] as const).map((value, index) => (
            <button
              key={value}
              aria-pressed={(config.modelFraming ?? 'portrait') === value}
              onClick={() => setConfig((previous) => ({ ...previous, modelFraming: value }))}
            >
              {
                (en
                  ? ['Portrait', 'Half-length', config.modelId === 'aurelia-3d' ? 'Full body' : 'Complete artwork']
                  : ['Портрет', 'До пояса', config.modelId === 'aurelia-3d' ? 'На повний зріст' : 'Повний образ'])[
                  index
                ]
              }
            </button>
          ))}
        </div>
      )}
      <div className={`character-canvas backdrop-${backdrop}`} id="stage-monitoring-frame">
        <div className="canvas-toolbar">
          <span className="canvas-label">
            <span className={`status-dot ${paused ? 'paused' : ''}`} />
            {paused
              ? en
                ? 'Pose preview'
                : 'Перегляд пози'
              : trackingMode === 'camera'
                ? en
                  ? 'Camera tracking'
                  : 'Трекінг камери'
                : trackingMode === 'mouse'
                  ? en
                    ? 'Cursor tracking'
                    : 'Стеження за курсором'
                  : micActive
                    ? en
                      ? 'Voice animation'
                      : 'Голосова анімація'
                    : en
                      ? 'Idle animation'
                      : 'Анімація спокою'}
          </span>
          <button
            className="canvas-icon-button"
            onClick={() => {
              if (paused) {
                setTrackingMode(resumeMode.current?.trackingMode ?? 'auto');
                setMicActive(resumeMode.current?.micActive ?? false);
              } else {
                resumeMode.current = { trackingMode, micActive };
                setTrackingMode('manual');
                setMicActive(false);
              }
            }}
            aria-label={
              paused ? (en ? 'Play animation' : 'Відтворити анімацію') : en ? 'Pause animation' : 'Призупинити анімацію'
            }
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
        <div className="avatar-viewport" id="interactive-rig-stage">
          <div className="avatar-scaling" style={{ transform: `scale(${zoom})` }}>
            <VTuberAvatar config={config} rig={rig} onScreenBuster={onScreenBuster} svgRef={avatarSvgRef} transparent />
          </div>
        </div>
        <div className="canvas-bottom-bar">
          <div
            className="backdrop-swatches"
            role="group"
            aria-label={en ? 'Preview background' : 'Тло попереднього перегляду'}
          >
            {[
              ['lavender', en ? 'Lavender' : 'Лавандове'],
              ['peach', en ? 'Peach' : 'Персикове'],
              ['midnight', en ? 'Midnight' : 'Нічне'],
              ['transparent', en ? 'Transparency grid' : 'Сітка прозорості'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`backdrop-swatch swatch-${value}`}
                onClick={() => setBackdrop(value)}
                aria-pressed={backdrop === value}
                aria-label={label}
                title={label}
              />
            ))}
          </div>
          <span className="preview-hint">{en ? 'Background is preview only' : 'Тло лише для перегляду'}</span>
          <div className="zoom-controls">
            <button
              className="canvas-icon-button"
              onClick={() => setZoom((value) => Math.max(0.7, Math.round((value - 0.1) * 10) / 10))}
              disabled={zoom <= 0.7}
              aria-label={en ? 'Zoom out' : 'Зменшити'}
            >
              <Minus size={14} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              className="canvas-icon-button"
              onClick={() => setZoom((value) => Math.min(1.4, Math.round((value + 0.1) * 10) / 10))}
              disabled={zoom >= 1.4}
              aria-label={en ? 'Zoom in' : 'Збільшити'}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
      <EmoteTriggerBar activeEmote={activeEmote} onEmote={onEmote} />
      <div className="creation-actions">
        <button className="creation-card" onClick={() => onSelectTab('stickers')}>
          <span className="creation-icon">
            <Sticker size={22} />
          </span>
          <span>
            <strong>{en ? 'Make a sticker pack' : 'Створити стікерпак'}</strong>
            <small>{en ? 'Your reactions, ready for Telegram' : 'Ваші емоції для Telegram'}</small>
          </span>
          <ArrowUpRight size={19} />
        </button>
        <button className="creation-card" onClick={() => void savePng()} disabled={exporting}>
          <span className="creation-icon mint">
            <Download size={21} />
          </span>
          <span>
            <strong>
              {exporting ? (en ? 'Preparing…' : 'Підготовка…') : en ? 'Download portrait' : 'Завантажити портрет'}
            </strong>
            <small>{en ? 'Transparent PNG · 1600 × 1600' : 'Прозорий PNG · 1600 × 1600'}</small>
          </span>
          <ArrowUpRight size={19} />
        </button>
      </div>
      {error && (
        <p role="alert" className="studio-notice error">
          {error}
        </p>
      )}
    </main>
  );
};
