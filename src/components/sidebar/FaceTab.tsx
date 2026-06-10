import React from 'react';
import { AvatarConfig } from '../../types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface FaceTabProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
}

export const FaceTab: React.FC<FaceTabProps> = ({ config, setConfig }) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h4
          className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          {t.rightSidebar.faceTitle}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">{t.rightSidebar.faceSub}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Design Group / Painting Art Style' : 'Група Дизайну / Стиль Малювання'}
          </label>
          <select
            value={config.artStyle || 'classic'}
            onChange={(e) => setConfig((prev) => ({ ...prev, artStyle: e.target.value as any }))}
            className={`w-full text-xs font-semibold p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark' ? 'bg-[#0a0a0c] text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <option value="classic">{isEn ? 'Classic (Universal Vector)' : 'Класичний (Classic)'}</option>
            <option value="anime">{isEn ? 'Japanese Anime (Manga Sparks)' : 'Японське Аніме (Anime Style)'}</option>
            <option value="retro">
              {isEn ? '1930s Mickey Retro (Rubber Hose)' : 'Ретро-Мультфільм 1930х (Retro Style)'}
            </option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Face Shape Geometry' : 'Геометрія Форми Обличчя'}
          </label>
          <select
            value={config.faceShape || 'default'}
            onChange={(e) => setConfig((prev) => ({ ...prev, faceShape: e.target.value as any }))}
            className={`w-full text-xs font-semibold p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark' ? 'bg-[#0a0a0c] text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <option value="default">{isEn ? 'Default (Classic V-shape)' : 'Стандартна (V-подібна)'}</option>
            <option value="sharp">{isEn ? 'Sharp (Shonen / Shojo)' : 'Гостра (Сьонен / Сьодзьо)'}</option>
            <option value="round">{isEn ? 'Round (Moe / Soft)' : "Кругла (Моє / М'яка)"}</option>
            <option value="chubby">{isEn ? 'Chubby (Full Cheeks)' : 'Пухкі щічки (Ширша)'}</option>
            <option value="mature">{isEn ? 'Mature (Seinen / Long)' : 'Доросла (Подовжена)'}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Eye Eyelash Shape' : 'Форма Очей та Вій'}
          </label>
          <select
            value={config.eyeShape || 'default'}
            onChange={(e) => setConfig((prev) => ({ ...prev, eyeShape: e.target.value as any }))}
            className={`w-full text-xs font-semibold p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark' ? 'bg-[#0a0a0c] text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <option value="default">{isEn ? 'Default (Standard Anime)' : 'Стандартна (Аніме)'}</option>
            <option value="almond">{isEn ? 'Almond (Wide / Symmetrical)' : 'Мигдалеподібна (Широка)'}</option>
            <option value="droopy">{isEn ? 'Droopy (Soft / Shy)' : 'Опущена (Скромна)'}</option>
            <option value="sharp">{isEn ? 'Sharp (Tsundere / Flat Top)' : 'Гостра (Цундере / Пряма)'}</option>
            <option value="cat-eye">{isEn ? 'Cat-Eye (Feline / Winged)' : 'Котяча (Виразні куточки)'}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Blush Opacity & Makeup Accent' : 'Стиль Макіяжу / Рум’янцю (Blush)'}
          </label>
          <div
            className={`flex items-center space-x-3 p-2.5 rounded border ${
              theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.blushOpacity ?? 0.25}
              onChange={(e) => setConfig((prev) => ({ ...prev, blushOpacity: parseFloat(e.target.value) }))}
              className="flex-1 accent-indigo-500 cursor-pointer h-1.5"
            />
            <input
              type="color"
              value={config.blushColor ?? '#ff4d6d'}
              onChange={(e) => setConfig((p) => ({ ...p, blushColor: e.target.value }))}
              className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border-slate-200'}`}
            />
            <span className="text-[10px] font-mono whitespace-nowrap text-slate-500 dark:text-white/50 w-8 text-right">
              {Math.round((config.blushOpacity ?? 0.25) * 100)}%
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Cosplay Ears Style' : 'Стиль Вушок (Ear Type)'}
          </label>
          <select
            value={config.earStyle || 'normal'}
            onChange={(e) => setConfig((prev) => ({ ...prev, earStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="normal">{t.rightSidebar.earOptions.normal}</option>
            <option value="elf">{t.rightSidebar.earOptions.elf}</option>
            <option value="pointy">{t.rightSidebar.earOptions.pointy}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Pupils Pattern Shape (Iris Rig)' : 'Форма Зіниць (Pupils Rig)'}
          </label>
          <select
            value={config.pupilStyle}
            onChange={(e) => setConfig((prev) => ({ ...prev, pupilStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="round">{t.rightSidebar.pupilOptions.round}</option>
            <option value="star">{t.rightSidebar.pupilOptions.star}</option>
            <option value="heart">{t.rightSidebar.pupilOptions.heart}</option>
            <option value="slit">{t.rightSidebar.pupilOptions.slit}</option>
            <option value="diamond">{isEn ? 'Crystal Diamond 💎' : 'Кришталевий Діамант 💎'}</option>
            <option value="cross">{isEn ? 'Gothic Cross ✙' : 'Готичний Хрест ✙'}</option>
            <option value="flower">{isEn ? 'Sakura Flower 🌸' : 'Квітка Сакури 🌸'}</option>
            <option value="spiral">{t.rightSidebar.pupilOptions.spiral}</option>
            <option value="crescent">{t.rightSidebar.pupilOptions.crescent}</option>
            <option value="infinity">{t.rightSidebar.pupilOptions.infinity}</option>
            <option value="cat-vertical">{t.rightSidebar.pupilOptions['cat-vertical']}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Eyebrows Style' : 'Форма Брів (Eyebrows Style)'}
          </label>
          <select
            value={config.eyebrowStyle}
            onChange={(e) => setConfig((prev) => ({ ...prev, eyebrowStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="normal">{t.rightSidebar.eyebrowOptions.normal}</option>
            <option value="thin">{t.rightSidebar.eyebrowOptions.thin}</option>
            <option value="thick">{t.rightSidebar.eyebrowOptions.thick}</option>
            <option value="sad">{isEn ? 'Sad / Worried' : 'Сумні / Хвилюючі'}</option>
            <option value="none">{t.rightSidebar.eyebrowOptions.none}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {t.rightSidebar.toothStyleLabel}
          </label>
          <select
            value={config.toothStyle ?? (config.hasFangs ? 'fangs' : 'normal')}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                toothStyle: e.target.value as any,
                // Keep the legacy boolean in sync for exports/stickers that still read it.
                hasFangs: e.target.value === 'fangs',
              }))
            }
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="normal">{t.rightSidebar.toothOptions.normal}</option>
            <option value="fangs">{t.rightSidebar.toothOptions.fangs}</option>
            <option value="gap-tooth">{t.rightSidebar.toothOptions['gap-tooth']}</option>
            <option value="braces">{t.rightSidebar.toothOptions.braces}</option>
            <option value="sharp-teeth">{t.rightSidebar.toothOptions['sharp-teeth']}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {t.rightSidebar.mouthShapeLabel}
          </label>
          <select
            value={config.mouthShape || 'default'}
            onChange={(e) => setConfig((prev) => ({ ...prev, mouthShape: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="default">{t.rightSidebar.mouthShapeOptions.default}</option>
            <option value="small">{t.rightSidebar.mouthShapeOptions.small}</option>
            <option value="wide">{t.rightSidebar.mouthShapeOptions.wide}</option>
            <option value="pouty">{t.rightSidebar.mouthShapeOptions.pouty}</option>
            <option value="thin">{t.rightSidebar.mouthShapeOptions.thin}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {t.rightSidebar.lipStyleLabel}
          </label>
          <div
            className={`flex items-center space-x-2 p-2 rounded border ${
              theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            <select
              value={config.lipStyle || 'natural'}
              onChange={(e) => setConfig((prev) => ({ ...prev, lipStyle: e.target.value as any }))}
              className={`flex-1 text-xs font-medium p-2 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <option value="natural">{t.rightSidebar.lipStyleOptions.natural}</option>
              <option value="glossy">{t.rightSidebar.lipStyleOptions.glossy}</option>
              <option value="dark">{t.rightSidebar.lipStyleOptions.dark}</option>
              <option value="gradient">{t.rightSidebar.lipStyleOptions.gradient}</option>
            </select>
            {(config.lipStyle ?? 'natural') !== 'natural' && (
              <input
                type="color"
                aria-label={t.rightSidebar.lipColor}
                value={config.lipColor ?? '#d6536d'}
                onChange={(e) => setConfig((p) => ({ ...p, lipColor: e.target.value }))}
                className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border-slate-200'}`}
              />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Active Emotional Overlays' : 'Емоційний стан & Оверлеї'}
          </label>
          <select
            value={config.activeEmotion || 'none'}
            onChange={(e) => setConfig((prev) => ({ ...prev, activeEmotion: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="none">{isEn ? 'None (Calm)' : 'Немає (Спокій)'}</option>
            <option value="happy">{isEn ? 'Happy (Floating Hearts)' : 'Радість (Рожеві сердечка)'}</option>
            <option value="angry">{isEn ? 'Angry Pop (Pulsing Vein)' : 'Гнів (Червона вена)'}</option>
            <option value="cry">{isEn ? 'Cry (Streaming Teardrops)' : 'Сльози (Потоки сліз)'}</option>
            <option value="shocked">{isEn ? 'Shocked Bubble (! Alert)' : 'Шок (Увага !)'}</option>
            <option value="smug">{isEn ? 'Smug Twinkle (Playful Cross)' : 'Хитрість (Сяйво)'}</option>
            <option value="squint">{isEn ? 'Squint / Squeezed Shut (>_<)' : 'Замружений (>_<)'}</option>
            <option value="love">{isEn ? 'Love (Heart Eyes)' : 'Кохання (Очі-сердечка)'}</option>
            <option value="starry">{isEn ? 'Starry (Excitement / Sparkly)' : 'Зоряний (Захоплення / Іскри)'}</option>
            <option value="depressed">
              {isEn ? 'Depressed (Gloom vertical lines)' : 'Пригніченість (Темні смуги)'}
            </option>
            <option value="dizzy">{isEn ? 'Dizzy (Spinning Spiral @_@)' : 'Запаморочення (Спіралі @_@)'}</option>
            <option value="cool">{isEn ? 'Cool (Stylish Sunglasses)' : 'Крутий (Окуляри й ноти)'}</option>
            <option value="scared">{isEn ? 'Scared (Panicked Shivering)' : 'Переляк (Дрижання)'}</option>
            <option value="sleepy">{isEn ? 'Sleepy (Yawning Bubble Zzz)' : 'Сонливість (Бульбашка й Zzz)'}</option>
            <option value="shy">{isEn ? 'Shy / Embarrassed (Red Cheeks)' : "Сором'язливість (Красні щоки)"}</option>
            <option value="relaxed">
              {isEn ? 'Relaxed / Chill (Blossom Petals)' : 'Розслаблення (Пелюстки сакури)'}
            </option>
          </select>
        </div>

        {/* Heterochromia toggle */}
        <div className="space-y-1">
          <div
            className={`flex items-center space-x-2.5 h-10 px-3 rounded border ${
              theme === 'dark' ? 'bg-[#0a0a0c]/80 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="checkbox"
              id="heterochromia-checkbox"
              checked={config.heterochromia ?? false}
              onChange={(e) => setConfig((prev) => ({ ...prev, heterochromia: e.target.checked }))}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer accent-indigo-500"
            />
            <label
              htmlFor="heterochromia-checkbox"
              className={`text-xs cursor-pointer select-none font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}
            >
              {t.rightSidebar.heterochromia}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[9px] text-slate-400 dark:text-white/40 block font-mono uppercase font-bold">
              {isEn ? 'Skin tone' : 'Шкіра / тіло'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.skinColor}
                onChange={(e) => setConfig((p) => ({ ...p, skinColor: e.target.value }))}
                className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-250'}`}
              />
              <span className="text-[9px] font-mono text-slate-500 dark:text-white/50">{config.skinColor}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-slate-400 dark:text-white/40 block font-mono uppercase font-bold">
              {config.heterochromia ? (isEn ? 'Left Eye Iris' : 'Ліва Райдужка') : isEn ? 'Eyes Iris' : 'Райдужка ока'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.eyeColor}
                onChange={(e) => setConfig((p) => ({ ...p, eyeColor: e.target.value }))}
                className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-250'}`}
              />
              <span className="text-[9px] font-mono text-slate-500 dark:text-white/50">{config.eyeColor}</span>
            </div>
          </div>
        </div>

        {config.heterochromia && (
          <div className="space-y-1">
            <label className="text-[9px] text-slate-400 dark:text-white/40 block font-mono uppercase font-bold">
              {t.rightSidebar.eyeColorRight}
            </label>
            <div className="flex items-center space-x-2 p-2 rounded border dark:bg-[#08080a] dark:border-white/5 bg-slate-50 border-slate-200/60">
              <input
                type="color"
                value={config.eyeColorRight ?? '#2563eb'}
                onChange={(e) => setConfig((p) => ({ ...p, eyeColorRight: e.target.value }))}
                className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-250'}`}
              />
              <span className="text-[9px] font-mono text-slate-500 dark:text-white/50">
                {config.eyeColorRight ?? '#2563eb'}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {t.rightSidebar.eyelashStyle}
          </label>
          <select
            value={config.eyelashStyle || 'natural'}
            onChange={(e) => setConfig((prev) => ({ ...prev, eyelashStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="natural">{t.rightSidebar.eyelashOptions.natural}</option>
            <option value="glamour">{t.rightSidebar.eyelashOptions.glamour}</option>
            <option value="minimal">{t.rightSidebar.eyelashOptions.minimal}</option>
            <option value="none">{t.rightSidebar.eyelashOptions.none}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {t.rightSidebar.irisStyleLabel}
          </label>
          <select
            value={config.irisStyle || 'solid'}
            onChange={(e) => setConfig((prev) => ({ ...prev, irisStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="solid">{t.rightSidebar.irisOptions.solid}</option>
            <option value="organic">{t.rightSidebar.irisOptions.organic}</option>
            <option value="gemstone">{t.rightSidebar.irisOptions.gemstone}</option>
            <option value="galaxy">{t.rightSidebar.irisOptions.galaxy}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {t.rightSidebar.eyeHighlightLabel}
          </label>
          <select
            value={config.eyeHighlightStyle || 'standard'}
            onChange={(e) => setConfig((prev) => ({ ...prev, eyeHighlightStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="standard">{t.rightSidebar.eyeHighlightOptions.standard}</option>
            <option value="double-spark">{t.rightSidebar.eyeHighlightOptions['double-spark']}</option>
            <option value="star-glint">{t.rightSidebar.eyeHighlightOptions['star-glint']}</option>
            <option value="none">{t.rightSidebar.eyeHighlightOptions.none}</option>
          </select>
        </div>

        <div
          className={`mt-4 p-4 rounded-sm border space-y-4 ${
            theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 block font-mono">
            {isEn ? 'Cosmetics & Face Details' : 'Косметика та деталі обличчя'}
          </span>

          {/* Freckles Toggle */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="freckles-checkbox"
                checked={config.freckles ?? false}
                onChange={(e) => setConfig((prev) => ({ ...prev, freckles: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer accent-indigo-500"
              />
              <label
                htmlFor="freckles-checkbox"
                className={`text-xs cursor-pointer select-none font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}
              >
                {t.rightSidebar.frecklesLabel}
              </label>
            </div>
          </div>

          {config.freckles && (
            <>
              {/* Freckles Density */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span>{t.rightSidebar.frecklesDensity}</span>
                  <span className="text-indigo-500">{Math.round((config.frecklesDensity ?? 0.6) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={config.frecklesDensity ?? 0.6}
                  onChange={(e) => setConfig((prev) => ({ ...prev, frecklesDensity: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5"
                />
              </div>

              {/* Freckles Color */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 dark:text-white/40 block font-mono uppercase font-bold">
                  {t.rightSidebar.frecklesColor}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={config.frecklesColor ?? '#8b5a2b'}
                    onChange={(e) => setConfig((p) => ({ ...p, frecklesColor: e.target.value }))}
                    className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-250'}`}
                  />
                  <span className="text-[9px] font-mono text-slate-500 dark:text-white/50">
                    {config.frecklesColor ?? '#8b5a2b'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Beauty Mark Selection */}
          <div className="space-y-1">
            <label
              className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}
            >
              {t.rightSidebar.beautyMarkLabel}
            </label>
            <select
              value={config.beautyMark || 'none'}
              onChange={(e) => setConfig((prev) => ({ ...prev, beautyMark: e.target.value as any }))}
              className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <option value="none">{t.rightSidebar.beautyMarkOptions.none}</option>
              <option value="left-cheek">{t.rightSidebar.beautyMarkOptions['left-cheek']}</option>
              <option value="right-cheek">{t.rightSidebar.beautyMarkOptions['right-cheek']}</option>
              <option value="under-eye">{t.rightSidebar.beautyMarkOptions['under-eye']}</option>
              <option value="chin">{t.rightSidebar.beautyMarkOptions.chin}</option>
            </select>
          </div>

          {/* Face Paint Selection */}
          <div className="space-y-1">
            <label
              className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}
            >
              {t.rightSidebar.facePaintLabel}
            </label>
            <select
              value={config.facePaint || 'none'}
              onChange={(e) => setConfig((prev) => ({ ...prev, facePaint: e.target.value as any }))}
              className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <option value="none">{t.rightSidebar.facePaintOptions.none}</option>
              <option value="tribal">{t.rightSidebar.facePaintOptions.tribal}</option>
              <option value="cat-whiskers">{t.rightSidebar.facePaintOptions['cat-whiskers']}</option>
              <option value="butterfly">{t.rightSidebar.facePaintOptions.butterfly}</option>
              <option value="under-eye-stripe">{t.rightSidebar.facePaintOptions['under-eye-stripe']}</option>
            </select>
          </div>

          {/* Face Scar Selection */}
          <div className="space-y-1">
            <label
              className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}
            >
              {t.rightSidebar.faceScarLabel}
            </label>
            <select
              value={config.faceScar || 'none'}
              onChange={(e) => setConfig((prev) => ({ ...prev, faceScar: e.target.value as any }))}
              className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <option value="none">{t.rightSidebar.faceScarOptions.none}</option>
              <option value="cheek-slash">{t.rightSidebar.faceScarOptions['cheek-slash']}</option>
              <option value="eye-scar">{t.rightSidebar.faceScarOptions['eye-scar']}</option>
              <option value="cross-forehead">{t.rightSidebar.faceScarOptions['cross-forehead']}</option>
            </select>
          </div>

          {/* Ear Decoration Selection */}
          <div className="space-y-1">
            <label
              className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}
            >
              {t.rightSidebar.earDecorationLabel}
            </label>
            <select
              value={config.earDecoration || 'none'}
              onChange={(e) => setConfig((prev) => ({ ...prev, earDecoration: e.target.value as any }))}
              className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <option value="none">{t.rightSidebar.earDecorationOptions.none}</option>
              <option value="piercing">{t.rightSidebar.earDecorationOptions.piercing}</option>
              <option value="cuff">{t.rightSidebar.earDecorationOptions.cuff}</option>
              <option value="feather">{t.rightSidebar.earDecorationOptions.feather}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
