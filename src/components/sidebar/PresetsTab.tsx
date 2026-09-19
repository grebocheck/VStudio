import React from 'react';
import { Check, Trash2, Bookmark } from 'lucide-react';
import { PresetAvatar } from '../../types';
import { useI18n } from '../../i18n';
import { INITIAL_RIG } from '../../presets';
import { VTuberAvatar } from '../VTuberAvatar';
import { is3DModel } from '../../lib/avatarModel';

export interface PresetsTabProps {
  customPresets: PresetAvatar[];
  PRESETS: PresetAvatar[];
  activePresetKey: string | null;
  onApplyPreset: (preset: PresetAvatar) => void;
  onDeleteCustomPreset: (id: string) => void;
}

const Portrait = React.memo(({ preset }: { preset: PresetAvatar }) => (
  <div
    className="preset-portrait"
    style={{ '--portrait-color': preset.config.hairColor } as React.CSSProperties}
    aria-hidden="true"
  >
    {is3DModel(preset.config.modelId) ? (
      <img src={`/models/${preset.config.modelId}/preview.png`} alt="" className="h-full w-full object-contain" />
    ) : (
      <VTuberAvatar config={preset.config} rig={INITIAL_RIG} transparent />
    )}
  </div>
));

export const PresetsTab: React.FC<PresetsTabProps> = ({
  customPresets,
  PRESETS,
  activePresetKey,
  onApplyPreset,
  onDeleteCustomPreset,
}) => {
  const { t, language } = useI18n();
  const en = language === 'en';
  const names = t.presetStats as Record<string, string>;
  const featuredModels = PRESETS.filter((preset) => is3DModel(preset.config.modelId));
  const illustrated = PRESETS.find((preset) => preset.config.modelId === 'miya-nocturne');
  const editablePresets = PRESETS.filter((preset) => !preset.config.modelId || preset.config.modelId === 'parametric');
  return (
    <div className="character-library">
      <div className="library-intro">
        <span className="eyebrow">{en ? 'CHARACTER COLLECTION' : 'КОЛЕКЦІЯ ПЕРСОНАЖІВ'}</span>
        <h4>{en ? 'A knight to remember.' : 'Лицарка, яку не забути.'}</h4>
        <p>
          {en
            ? 'Meet Seraphine of the Dawnwatch. Golden braids, an emerald gaze and silver armor made for a legend.'
            : 'Знайомтесь: Серафіна зі Світанкової варти. Золоті коси, смарагдовий погляд і срібні лати, гідні легенди.'}
        </p>
      </div>
      {featuredModels.map((featured) => (
        <button
          type="button"
          key={featured.id}
          className={`group relative mt-5 block w-full overflow-hidden rounded-2xl border text-left transition hover:border-violet-400 ${
            activePresetKey === featured.id
              ? 'border-violet-400 ring-1 ring-violet-400/40'
              : 'border-slate-300 dark:border-white/15'
          }`}
          onClick={() => onApplyPreset(featured)}
          aria-pressed={activePresetKey === featured.id}
          aria-label={names[`${featured.id}_name`] || featured.name}
        >
          <div
            className="flex aspect-square w-full items-center justify-center overflow-hidden"
            style={{
              background:
                featured.id === 'seraphine-3d'
                  ? 'radial-gradient(ellipse at 50% 35%, #52637c, #142237 65%, #0b1322)'
                  : 'radial-gradient(ellipse at 50% 40%, #3c4269, #121925 75%)',
            }}
            aria-hidden="true"
          >
            <img
              src={`/models/${featured.config.modelId}/preview.png`}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
          <span className="absolute top-3 left-3 rounded-full border border-white/20 bg-slate-950/65 px-2.5 py-1 text-[9px] font-semibold tracking-[0.14em] text-violet-100 backdrop-blur">
            {featured.id === 'seraphine-3d'
              ? en
                ? 'NEW · DAWNWATCH / 3D'
                : 'НОВИНКА · СВІТАНКОВА ВАРТА / 3D'
              : 'AURELIA / 3D'}
          </span>
          {activePresetKey === featured.id && (
            <span className="preset-check">
              <Check size={13} />
            </span>
          )}
          <span className="block bg-slate-50 px-4 py-3 dark:bg-slate-900">
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">
              {names[`${featured.id}_name`] || featured.name}
            </span>
            <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
              {featured.id === 'seraphine-3d'
                ? en
                  ? 'Royal armor · Golden braids · Emerald eyes'
                  : 'Королівські лати · Золоті коси · Смарагдові очі'
                : en
                  ? '3D model · 360° view · Live expressions'
                  : '3D-модель · Огляд 360° · Жива міміка'}
            </span>
          </span>
        </button>
      ))}
      {illustrated && (
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-violet-400 dark:border-white/15"
          aria-pressed={activePresetKey === illustrated.id}
          aria-label={names[`${illustrated.id}_name`] || illustrated.name}
          onClick={() => onApplyPreset(illustrated)}
        >
          <img
            src="/models/miya-nocturne/portrait.png"
            alt=""
            className="h-14 w-14 rounded-lg object-cover object-top"
          />
          <span>
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
              {names[`${illustrated.id}_name`] || illustrated.name}
            </span>
            <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">
              {en ? 'Illustrated 2D model' : 'Ілюстрована 2D-модель'}
            </span>
          </span>
          {activePresetKey === illustrated.id && <Check size={16} className="ml-auto text-violet-500" />}
        </button>
      )}
      <p className="mt-6 text-[10px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        {en ? 'Customizable characters' : 'Персонажі конструктора'}
      </p>
      <div className="preset-grid">
        {editablePresets.map((preset) => {
          const name = names[`${preset.id}_name`] || preset.name;
          const selected = activePresetKey === preset.id;
          return (
            <button
              className={`preset-card ${selected ? 'selected' : ''}`}
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              aria-pressed={selected}
              aria-label={name}
            >
              <Portrait preset={preset} />
              {selected && (
                <span className="preset-check">
                  <Check size={13} />
                </span>
              )}
              <span className="preset-name">{name.split(' (')[0]}</span>
              <span className="preset-description">
                {name.includes('(')
                  ? name.split('(')[1].replace(')', '')
                  : en
                    ? 'Custom character'
                    : 'Власний персонаж'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="collection-heading">
        <Bookmark size={15} />
        <h4>{en ? 'Your collection' : 'Ваша колекція'}</h4>
        <span>{customPresets.length}</span>
      </div>
      {customPresets.length ? (
        <div className="saved-presets">
          {customPresets.map((preset) => (
            <div key={preset.id} className="saved-preset">
              <button onClick={() => onApplyPreset(preset)} aria-pressed={activePresetKey === preset.id}>
                <Portrait preset={preset} />
                <span>{preset.name}</span>
              </button>
              <button
                className="studio-icon-button"
                onClick={() => onDeleteCustomPreset(preset.id)}
                aria-label={`${en ? 'Delete preset' : 'Видалити пресет'} ${preset.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="collection-empty">
          <Bookmark size={24} />
          <p>{en ? 'A home for your characters' : 'Місце для ваших персонажів'}</p>
          <span>
            {en ? 'Use “Save character” to keep a look here.' : 'Натисніть «Зберегти», щоб додати образ сюди.'}
          </span>
        </div>
      )}
    </div>
  );
};
