import type React from 'react';
import { Moon, Rotate3D, Sparkles } from 'lucide-react';
import type { AvatarConfig } from '../../types';
import { useI18n } from '../../i18n';

interface PremiumModelTabProps {
  config: AvatarConfig;
  setConfig: React.Dispatch<React.SetStateAction<AvatarConfig>>;
}

/** Presentation controls for the authored illustration, shared by its appearance tabs. */
export function PremiumModelTab({ config, setConfig }: PremiumModelTabProps) {
  const { language } = useI18n();
  const en = language === 'en';
  const is3D = config.modelId === 'aurelia-3d';
  const framing = config.modelFraming ?? 'portrait';
  const motionIntensity = config.motionIntensity ?? 1;
  const motionPresets = [
    { value: 0.55, label: en ? 'Quiet' : 'Спокійно' },
    { value: 1, label: en ? 'Natural' : 'Природно' },
    { value: 1.35, label: en ? 'Expressive' : 'Виразно' },
  ];
  const framings: { value: NonNullable<AvatarConfig['modelFraming']>; label: string }[] = [
    { value: 'portrait', label: en ? 'Portrait' : 'Портрет' },
    { value: 'halfbody', label: en ? 'Half body' : 'До пояса' },
    { value: 'full', label: is3D ? (en ? 'Full body' : 'На весь зріст') : en ? 'Full model' : 'Повний образ' },
  ];

  return (
    <section
      className="space-y-6"
      aria-label={
        is3D
          ? en
            ? 'Aurelia model settings'
            : 'Налаштування Аврелії'
          : en
            ? 'Miya model settings'
            : 'Налаштування моделі Мії'
      }
    >
      <div className="rounded-2xl border border-violet-400/25 bg-violet-400/5 p-4">
        <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-violet-700 dark:text-violet-300">
          {is3D ? <Rotate3D size={14} /> : <Moon size={14} />} {is3D ? 'AURELIA / 3D' : 'NOCTURNE / 01'}
        </span>
        <h4 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
          {is3D
            ? en
              ? 'Aurelia, from every angle.'
              : 'Аврелія з будь-якого боку.'
            : en
              ? 'Miya, in every detail.'
              : 'Мія — у кожній деталі.'}
        </h4>
        <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
          {is3D
            ? en
              ? 'A complete three-dimensional character with a moving skeleton and facial expressions. Rotate her to see her face, hair and costume from every side.'
              : 'Повноцінна тривимірна героїня з рухомим скелетом і мімікою. Обертайте її, щоб роздивитися обличчя, волосся та костюм з усіх боків.'
            : en
              ? 'Silver-lavender strands, a turquoise gaze and embroidered constellations. Her hair, face and wardrobe form one original illustration.'
              : 'Сріблясто-лавандові пасма, бірюзовий погляд і вишиті сузір’я. Волосся, обличчя та вбрання утворюють цілісний авторський образ.'}
        </p>
        <div className="mt-4 flex items-center gap-2" aria-hidden="true">
          {['#c2b9dc', '#5bd5cf', '#17243d', '#f3e9d8', '#c8ab70'].map((color) => (
            <span
              key={color}
              className="h-5 w-5 rounded-full border border-slate-400/30"
              style={{ background: color }}
            />
          ))}
          <span className="ml-auto text-[9px] tracking-widest text-slate-500 dark:text-slate-400">
            MIDNIGHT / IVORY
          </span>
        </div>
      </div>

      {is3D && (
        <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-3 text-xs leading-6 text-slate-600 dark:text-slate-300">
          <p>
            {en
              ? 'Drag the model to look around 360°. Scroll to zoom. Use Front view to return to the camera, or Turntable for an automatic tour.'
              : 'Тягніть модель для огляду на 360°. Колесо миші змінює масштаб. «Вигляд спереду» повертає камеру, а «Обертання навколо» запускає автоматичний огляд.'}
          </p>
          <p className="mt-2">
            {en
              ? 'The viewer also offers a wireframe view and a GLB download of the three-dimensional model.'
              : 'У вікні моделі також доступні перегляд сітки та завантаження тривимірної моделі у GLB.'}
          </p>
        </div>
      )}

      <fieldset>
        <legend className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-100">
          {en ? 'Motion energy' : 'Жвавість рухів'}
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {motionPresets.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              aria-pressed={Math.abs(motionIntensity - value) < 0.01}
              onClick={() => setConfig((previous) => ({ ...previous, motionIntensity: value }))}
              className={`rounded-lg border px-1.5 py-2.5 text-[10px] font-medium transition ${
                Math.abs(motionIntensity - value) < 0.01
                  ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
                  : 'border-slate-200 text-slate-600 hover:border-violet-400 dark:border-white/15 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          {en
            ? 'Choose how much her head, body and hair move. Your choice also carries through to OBS.'
            : 'Оберіть виразність рухів голови, тіла й волосся. Це налаштування також працює в OBS.'}
        </p>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold text-slate-800 dark:text-slate-100">
          {en ? 'Camera framing' : 'Кадрування'}
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {framings.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              aria-pressed={framing === value}
              onClick={() => setConfig((previous) => ({ ...previous, modelFraming: value }))}
              className={`rounded-lg border px-1.5 py-2.5 text-[10px] font-medium transition ${
                framing === value
                  ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-200'
                  : 'border-slate-200 text-slate-600 hover:border-violet-400 dark:border-white/15 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          {en
            ? 'The selected framing also carries through to your portrait and OBS scene.'
            : 'Обране кадрування також застосовується до портрета й сцени OBS.'}
        </p>
      </fieldset>

      {!is3D && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <input
            type="checkbox"
            checked={config.modelGlow ?? false}
            onChange={(event) => {
              const modelGlow = event.target.checked;
              setConfig((previous) => ({ ...previous, modelGlow }));
            }}
            className="mt-1 accent-violet-500"
          />
          <span>
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <Sparkles size={14} /> {en ? 'Moonlight glow' : 'Місячне сяйво'}
            </span>
            <span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {en ? 'A soft halo around her silhouette.' : 'М’який ореол навколо силуету.'}
            </span>
          </span>
        </label>
      )}

      <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
        {is3D
          ? en
            ? 'Expressions, cursor, voice and camera tracking animate this model. Open Rigging & Calibration for pose controls, or Name & Story to personalize her. Aurelia uses a licensed pixiv VRM foundation with custom material styling and accessories.'
            : 'Емоції, курсор, голос і трекінг камери оживляють модель. Пози доступні в розділі «Ригінг та калібрування», власні ім’я та історія — у відповідному розділі. Аврелія використовує ліцензовану основу pixiv VRM із власним оформленням матеріалів та аксесуарами.'
          : en
            ? 'Bring her to life with the expression bar, cursor, voice or camera. Open Rigging & Calibration for pose controls, or Name & Story to make her yours. For interchangeable hair and outfits, choose a customizable character from the collection.'
            : 'Оживіть Мію панеллю емоцій, курсором, голосом або камерою. Пози доступні в розділі «Ригінг та калібрування», власні ім’я та історія — у відповідному розділі. Для зміни зачісок і вбрання оберіть персонажа конструктора в колекції.'}
      </p>
    </section>
  );
}
