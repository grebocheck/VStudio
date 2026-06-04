import React from 'react';
import { AvatarConfig } from '../../types';
import { useI18n } from '../../i18n';
import { useTheme } from '../../theme/ThemeContext';

export interface ClothesTabProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
}

export const ClothesTab: React.FC<ClothesTabProps> = ({ config, setConfig }) => {
  const { t, language } = useI18n();
  const { theme } = useTheme();
  const isEn = language === 'en';

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h4
          className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
        >
          {t.rightSidebar.clothesTitle}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-white/55 mt-1">{t.rightSidebar.clothesSub}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Outfit Uniform Style' : 'Стиль Стрімерського Одягу'}
          </label>
          <select
            value={config.clothingStyle}
            onChange={(e) => setConfig((prev) => ({ ...prev, clothingStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="hoodie">{t.rightSidebar.outfitOptions.hoodie}</option>
            <option value="kimono">{t.rightSidebar.outfitOptions.kimono}</option>
            <option value="suit">{t.rightSidebar.outfitOptions.suit}</option>
            <option value="cyber-armor">{t.rightSidebar.outfitOptions.cyber}</option>
            <option value="goth-dress">{t.rightSidebar.outfitOptions.goth}</option>
            <option value="druid-cloak">{t.rightSidebar.outfitOptions.druid}</option>
            <option value="sailor-fuku">{isEn ? 'High School Sailor Suit' : 'Матроска (Sailor Uniform)'}</option>
            <option value="sweater">{isEn ? 'Cozy Winter Sweater' : "Теплий в'язаний светр"}</option>
            <option value="maid">{isEn ? 'Graceful Maid Dress' : 'Костюм покоївки (Maid Dress)'}</option>
            <option value="idol-stage">{isEn ? 'Sparkling Idol Stage' : 'Блискучий Айдол (Idol Stage)'}</option>
            <option value="witch-robe">{isEn ? 'Mystical Witch Robe' : 'Містичний Плащ Відьми'}</option>
            <option value="royal-knight">{isEn ? 'Royal Knight Armor' : 'Броня Лицаря (Royal Knight)'}</option>
            <option value="cyber-ninja">{isEn ? 'Cyber Ninja Stealth' : 'Кібер-Ніндзя (Cyber Ninja)'}</option>
            <option value="lolita-dress">{isEn ? 'Gothic Lolita Dress' : 'Сукня Лоліти (Lolita Dress)'}</option>
            <option value="school-blazer">{t.rightSidebar.outfitOptions['school-blazer']}</option>
            <option value="chinese-dress">{t.rightSidebar.outfitOptions['chinese-dress']}</option>
            <option value="pirate-coat">{t.rightSidebar.outfitOptions['pirate-coat']}</option>
            <option value="angel-dress">{t.rightSidebar.outfitOptions['angel-dress']}</option>
            <option value="punk-jacket">{t.rightSidebar.outfitOptions['punk-jacket']}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Clothing Chest Print / Stamp' : 'Прінт на Одязі (Chest Print)'}
          </label>
          <select
            value={config.clothingPrint || 'none'}
            onChange={(e) => setConfig((prev) => ({ ...prev, clothingPrint: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="none">{isEn ? 'None (Plain)' : 'Немає (Однотонний)'}</option>
            <option value="cat">{isEn ? 'Neko Cat Paw Print 🐾' : 'Котик 🐾'}</option>
            <option value="star">{isEn ? 'Mystical Shiny Star ⭐' : 'Зірка ⭐'}</option>
            <option value="heart">{isEn ? 'Lovely Pink Heart 💖' : 'Сердечко 💖'}</option>
            <option value="cyber">{isEn ? 'Cyber Matrix Circuit ⚡' : 'Кібер Мережа ⚡'}</option>
            <option value="cross">{isEn ? 'Gothic Lolita Cross ✙' : 'Хрест ✙'}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Head Accessory & Gear' : 'Аксесуар Голови'}
          </label>
          <select
            value={config.accessoryStyle}
            onChange={(e) => setConfig((prev) => ({ ...prev, accessoryStyle: e.target.value as any }))}
            className={`w-full text-xs font-medium p-2.5 rounded-sm border focus:outline-none focus:border-indigo-500 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0a0a0c] text-[#d1d1d1] border-white/10'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="none">{t.rightSidebar.decorOptions.none}</option>
            <option value="headphones">{t.rightSidebar.decorOptions.headphones}</option>
            <option value="horns">{t.rightSidebar.decorOptions.horns}</option>
            <option value="glasses">{t.rightSidebar.decorOptions.glasses}</option>
            <option value="neko-ears">{t.rightSidebar.decorOptions.neko}</option>
            <option value="angel-halo">{t.rightSidebar.decorOptions.angelHalo}</option>
            <option value="fox-mask">{t.rightSidebar.decorOptions.foxMask}</option>
            <option value="witch-hat">{isEn ? 'Witch Hat 🧙' : 'Капелюх Відьми 🧙'}</option>
            <option value="crown">{isEn ? 'Royal Crown 👑' : 'Корона / Тіара 👑'}</option>
            <option value="bunny-ears">{isEn ? 'Bunny Ears 🐰' : 'Кролячі Вушка 🐰'}</option>
            <option value="eye-patch">{t.rightSidebar.decorOptions['eye-patch']}</option>
            <option value="flower-crown">{t.rightSidebar.decorOptions['flower-crown']}</option>
            <option value="hair-ribbons">{t.rightSidebar.decorOptions['hair-ribbons']}</option>
            <option value="choker">{t.rightSidebar.decorOptions.choker}</option>
            <option value="earrings">{t.rightSidebar.decorOptions.earrings}</option>
            <option value="tiara">{t.rightSidebar.decorOptions.tiara}</option>
            <option value="demon-wings">{t.rightSidebar.decorOptions['demon-wings']}</option>
            <option value="scarf">{t.rightSidebar.decorOptions.scarf}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Clothing Palette (Primary / Accents)' : 'Кольори Одягу (Первинний / Другорядний)'}
          </label>
          <div
            className={`flex items-center space-x-2 p-2 rounded border ${
              theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            <input
              type="color"
              value={config.clothingColor1}
              onChange={(e) => setConfig((p) => ({ ...p, clothingColor1: e.target.value }))}
              className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
              title="Primary clothing"
            />
            <input
              type="color"
              value={config.clothingColor2}
              onChange={(e) => setConfig((p) => ({ ...p, clothingColor2: e.target.value }))}
              className={`w-8 h-8 rounded-sm cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-[#0a0a0c] border border-white/10' : 'bg-white border border-slate-200'}`}
              title="Accents detail"
            />
            <span className="text-[10px] font-mono text-slate-500 dark:text-white/50">
              {config.clothingColor1} / {config.clothingColor2}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'LED Glow Accessory Highlights' : 'Аксесуар Свічення (LED Glow)'}
          </label>
          <div
            className={`flex items-center space-x-2.5 h-10 px-3 rounded border ${
              theme === 'dark' ? 'bg-[#0a0a0c]/80 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="checkbox"
              id="glow-drawer-checkbox"
              checked={config.accessoryGlow ?? false}
              onChange={(e) => setConfig((prev) => ({ ...prev, accessoryGlow: e.target.checked }))}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40 w-4 h-4 cursor-pointer accent-indigo-500"
            />
            <label
              htmlFor="glow-drawer-checkbox"
              className={`text-xs cursor-pointer select-none font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}
            >
              {isEn ? 'Enable Neon Aura-Glow Backlighting' : 'Увімкнути неонову тінь-свічення'}
            </label>
          </div>
        </div>

        <div
          className={`mt-4 p-4 rounded-sm border space-y-4 ${
            theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 block font-mono">
            {isEn ? 'Body Anatomy & Proportions' : 'Анатомічні пропорції тіла'}
          </span>

          {/* 1. Head Size */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span>{isEn ? 'Head Scaling' : 'Розмір голови (Head)'}</span>
              <span className="text-indigo-500">{Math.round((config.headSize ?? 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.85"
              max="1.15"
              step="0.01"
              value={config.headSize ?? 1.0}
              onChange={(e) => setConfig((prev) => ({ ...prev, headSize: parseFloat(e.target.value) }))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5"
            />
          </div>

          {/* 2. Neck Width */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span>{isEn ? 'Neck Thickness' : 'Ширина шиї (Neck Width)'}</span>
              <span className="text-indigo-500">{Math.round((config.neckWidth ?? 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.70"
              max="1.25"
              step="0.01"
              value={config.neckWidth ?? 1.0}
              onChange={(e) => setConfig((prev) => ({ ...prev, neckWidth: parseFloat(e.target.value) }))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5"
            />
          </div>

          {/* 3. Neck Height */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span>{isEn ? 'Neck Height' : 'Висота шиї (Neck Height)'}</span>
              <span className="text-indigo-500">{Math.round((config.neckHeight ?? 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.70"
              max="1.25"
              step="0.01"
              value={config.neckHeight ?? 1.0}
              onChange={(e) => setConfig((prev) => ({ ...prev, neckHeight: parseFloat(e.target.value) }))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5"
            />
          </div>

          {/* 4. Shoulder Width */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span>{isEn ? 'Shoulders Width' : 'Ширина плечей (Shoulders)'}</span>
              <span className="text-indigo-500">{Math.round((config.shoulderWidth ?? 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.25"
              step="0.01"
              value={config.shoulderWidth ?? 1.0}
              onChange={(e) => setConfig((prev) => ({ ...prev, shoulderWidth: parseFloat(e.target.value) }))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5"
            />
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <label className={`text-[11px] block font-semibold ${theme === 'dark' ? 'text-white/75' : 'text-slate-700'}`}>
            {isEn ? 'Backdrop Studio Environment' : 'Задній Фон Студії (Backdrop)'}
          </label>
          <div
            className={`grid grid-cols-2 gap-2 p-2 rounded border ${
              theme === 'dark' ? 'bg-[#08080a] border-white/5' : 'bg-slate-50 border-slate-200/60'
            }`}
          >
            {[
              { id: 'gaming', label: t.rightSidebar.backdropOptions.gaming },
              { id: 'nebula', label: t.rightSidebar.backdropOptions.nebula },
              { id: 'dark-studio', label: t.rightSidebar.backdropOptions.darkStudio },
              { id: 'green-screen', label: t.rightSidebar.backdropOptions.greenScreen },
            ].map((bg) => {
              const isActive = config.backgroundStyle === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => setConfig((prev) => ({ ...prev, backgroundStyle: bg.id as any }))}
                  className={`px-2 py-2 text-[10px] font-semibold rounded-sm border transition-all cursor-pointer truncate ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-indigo-600/25 border-indigo-500 text-white font-bold'
                        : 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                      : theme === 'dark'
                        ? 'bg-[#0a0a0c] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {bg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
