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
            <option value="none">{t.rightSidebar.eyebrowOptions.none}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Mouth & Teeth Visual Options' : 'Зовнішній вигляд Рота'}
          </label>
          <div
            className={`flex items-center space-x-2.5 h-10 px-3 rounded border ${
              theme === 'dark' ? 'bg-[#0a0a0c]/80 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="checkbox"
              id="fangs-drawer-checkbox"
              checked={config.hasFangs ?? false}
              onChange={(e) => setConfig((prev) => ({ ...prev, hasFangs: e.target.checked }))}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer accent-indigo-500"
            />
            <label
              htmlFor="fangs-drawer-checkbox"
              className={`text-xs cursor-pointer select-none font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}
            >
              {isEn ? 'Show Sharp Vampire Fangs' : 'Показувати гострі Ікла (Fangs)'}
            </label>
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
              {isEn ? 'Eyes Iris' : 'Райдужка ока'}
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
      </div>
    </div>
  );
};
