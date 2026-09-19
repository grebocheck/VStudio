import React from 'react';
import { Check, Download, ExternalLink, LoaderCircle, Package, Send } from 'lucide-react';
import type { AvatarConfig } from '../types';
import { is3DModel } from '../lib/avatarModel';
import { useI18n } from '../i18n';
import { downloadBlob, safeExportFileName } from '../lib/avatarExport';
import { TELEGRAM_STICKER_SPECS, type TelegramStickerSlug } from '../lib/telegram/core';
import {
  createStaticTelegramStickerPack,
  renderStaticSticker,
  renderStaticStickerPreview,
  StickerExportError,
  type StaticStickerPack,
} from '../lib/telegram/staticPack';

interface TelegramStickerPackPanelProps {
  config: AvatarConfig;
  fileBaseName: string;
}

const ukLabels: Record<TelegramStickerSlug, string> = {
  happy: 'Радість',
  love: 'Любов',
  starry: 'Захват',
  smug: 'Хитрість',
  shocked: 'Подив',
  angry: 'Злість',
  cry: 'Сльози',
  cool: 'Крутість',
  dizzy: 'Запаморочення',
};
const checkerboard = {
  backgroundImage: 'conic-gradient(#94a3b815 25%, transparent 0 50%, #94a3b815 0 75%, transparent 0)',
  backgroundSize: '16px 16px',
};

export const TelegramStickerPackPanel: React.FC<TelegramStickerPackPanelProps> = ({ config, fileBaseName }) => {
  const { language } = useI18n();
  const isEn = language === 'en';
  const [selected, setSelected] = React.useState<TelegramStickerSlug[]>(TELEGRAM_STICKER_SPECS.map((s) => s.slug));
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState({ completed: 0, total: 0 });
  const [error, setError] = React.useState<string | null>(null);
  const [lastExport, setLastExport] = React.useState<{ key: string; pack: StaticStickerPack } | null>(null);
  const [animatedReady, setAnimatedReady] = React.useState(false);
  const [previewAttempt, setPreviewAttempt] = React.useState(0);
  const [previewResult, setPreviewResult] = React.useState<{
    key: string;
    attempt: number;
    urls: string[];
    failed: boolean;
  } | null>(null);
  const configKey = JSON.stringify(config);
  const illustrated = config.modelId === 'miya-nocturne';
  const is3D = is3DModel(config.modelId);
  const vectorSupported = !illustrated && !is3D;
  const currentPack = lastExport?.key === configKey ? lastExport.pack : null;
  const currentPreview =
    previewResult?.key === configKey && previewResult.attempt === previewAttempt ? previewResult : null;
  const previews = TELEGRAM_STICKER_SPECS.map((spec, index) => ({ spec, src: currentPreview?.urls[index] }));

  React.useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const prepare = async () => {
      try {
        for (const spec of TELEGRAM_STICKER_SPECS) {
          const thumbnail = await renderStaticStickerPreview(config, spec);
          if (cancelled) return;
          urls.push(URL.createObjectURL(thumbnail));
        }
        setPreviewResult({ key: configKey, attempt: previewAttempt, urls, failed: false });
      } catch {
        urls.forEach((url) => URL.revokeObjectURL(url));
        urls.length = 0;
        if (!cancelled) setPreviewResult({ key: configKey, attempt: previewAttempt, urls: [], failed: true });
      }
    };
    void prepare();
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [config, configKey, previewAttempt]);

  const showError = (err: unknown) => {
    if (isEn) {
      setError(err instanceof Error ? err.message : 'Export failed. Try again.');
    } else if (err instanceof StickerExportError) {
      const messages = {
        empty: 'Оберіть хоча б один стікер.',
        canvas: 'Не вдалося створити зображення. Спробуйте оновити браузер.',
        render: 'Не вдалося намалювати аватар. Перезавантажте сторінку та спробуйте ще раз.',
        encode: 'Не вдалося зберегти PNG. Спробуйте оновити браузер.',
        size: 'Стікер після оптимізації перевищує 512 КБ. Спробуйте експортувати його ще раз.',
        transparency: 'Фон стікера не прозорий. Перезавантажте сторінку та спробуйте ще раз.',
        pixels: 'Зображення стікера порожнє або має неправильний розмір. Спробуйте інший пресет.',
      };
      setError(messages[err.code]);
    } else {
      setError(`Не вдалося завершити експорт. ${err instanceof Error ? err.message : 'Спробуйте ще раз.'}`);
    }
  };

  const exportPack = async () => {
    setError(null);
    setBusy(true);
    setAnimatedReady(false);
    try {
      const pack = await createStaticTelegramStickerPack(config, fileBaseName, {
        specs: TELEGRAM_STICKER_SPECS.filter((spec) => selected.includes(spec.slug)),
        onProgress: (completed, total) => setProgress({ completed, total }),
      });
      downloadBlob(pack.zipBlob, pack.fileName);
      setLastExport({ key: configKey, pack });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const exportOne = async (slug: TelegramStickerSlug) => {
    setError(null);
    setBusy(true);
    setProgress({ completed: 0, total: 1 });
    try {
      const spec = TELEGRAM_STICKER_SPECS.find((s) => s.slug === slug)!;
      const existing = currentPack?.stickers.find((s) => s.spec.slug === slug);
      const blob = existing?.blob ?? (await renderStaticSticker(config, spec));
      downloadBlob(blob, existing?.fileName ?? `${safeExportFileName(fileBaseName)}-${slug}.png`);
      setProgress({ completed: 1, total: 1 });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const exportAnimated = async () => {
    if (!vectorSupported) return;
    setError(null);
    setBusy(true);
    setProgress({ completed: 0, total: 9 });
    try {
      const [{ createTelegramStickerPack }, { buildTelegramStickerLottieFromAvatar }] = await Promise.all([
        import('../lib/telegram/pack'),
        import('../lib/telegram/buildFromSvg'),
      ]);
      const pack = await createTelegramStickerPack(
        config,
        fileBaseName,
        undefined,
        buildTelegramStickerLottieFromAvatar,
      );
      downloadBlob(pack.zipBlob, pack.fileName);
      setAnimatedReady(true);
      setProgress({ completed: 9, total: 9 });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4" aria-label={isEn ? 'Telegram sticker builder' : 'Створення стікерів Telegram'}>
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
          <Send className="h-4 w-4" />
          {isEn ? 'Your character. Nine reactions.' : 'Твій персонаж. Дев’ять реакцій.'}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {isEn
            ? 'Pick the reactions you want. Each sticker keeps your character’s outfit, colors and details.'
            : 'Обери потрібні емоції. Кожен стікер зберігає вбрання, кольори й деталі твого персонажа.'}
        </p>
        <p className="mt-3 text-[11px] font-medium text-sky-700 dark:text-sky-300">
          PNG · 512 × 512 · {isEn ? 'Transparent' : 'Прозорий фон'} · ≤ 512 KB
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isEn ? 'Selected' : 'Обрано'}: {selected.length} / {TELEGRAM_STICKER_SPECS.length}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => setSelected(selected.length === 9 ? [] : TELEGRAM_STICKER_SPECS.map((s) => s.slug))}
          className="text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline disabled:opacity-50"
        >
          {selected.length === 9 ? (isEn ? 'Clear selection' : 'Зняти вибір') : isEn ? 'Select all' : 'Обрати всі'}
        </button>
      </div>
      {currentPreview?.failed && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <p>
            {isEn
              ? 'Could not load the artwork previews. Check your connection and try again.'
              : 'Не вдалося завантажити прев’ю. Перевір з’єднання та спробуй ще раз.'}
          </p>
          <button
            type="button"
            onClick={() => setPreviewAttempt((attempt) => attempt + 1)}
            className="mt-2 font-semibold underline"
          >
            {isEn ? 'Retry previews' : 'Повторити завантаження'}
          </button>
        </div>
      )}
      {!currentPreview && (
        <p role="status" className="text-xs text-slate-500 dark:text-slate-400">
          {isEn ? 'Preparing your artwork…' : 'Готуємо ілюстрації…'}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2" aria-busy={!currentPreview}>
        {previews.map(({ spec, src }) => {
          const checked = selected.includes(spec.slug);
          const label = isEn ? spec.label : ukLabels[spec.slug];
          return (
            <div
              key={spec.slug}
              className={`overflow-hidden rounded-xl border ${checked ? 'border-sky-500/60 bg-sky-500/5' : 'border-slate-200 dark:border-white/10'}`}
            >
              <button
                type="button"
                disabled={busy}
                aria-pressed={checked}
                aria-label={`${isEn ? 'Include' : 'Додати'}: ${label}`}
                onClick={() =>
                  setSelected((prev) => (checked ? prev.filter((slug) => slug !== spec.slug) : [...prev, spec.slug]))
                }
                className="relative block w-full p-1 transition hover:bg-sky-500/10 disabled:opacity-50"
              >
                {src ? (
                  <img
                    src={src}
                    alt={label}
                    className="aspect-square w-full rounded-lg"
                    style={checkerboard}
                    onError={() =>
                      setPreviewResult((result) => (result?.key === configKey ? { ...result, failed: true } : result))
                    }
                  />
                ) : (
                  <span
                    className="flex aspect-square w-full items-center justify-center rounded-lg"
                    style={checkerboard}
                  >
                    {!currentPreview?.failed && (
                      <LoaderCircle className="h-5 w-5 animate-spin text-sky-500" aria-hidden="true" />
                    )}
                  </span>
                )}
                <span
                  className={`absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border ${checked ? 'border-sky-500 bg-sky-600 text-white' : 'border-slate-400 bg-white dark:bg-slate-800'}`}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span className="block truncate px-1 pb-1 text-[10px] font-medium text-slate-700 dark:text-slate-200">
                  {spec.emoji} {label}
                </span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void exportOne(spec.slug)}
                aria-label={`${isEn ? 'Download' : 'Завантажити'} ${label} PNG`}
                className="flex w-full items-center justify-center gap-1 border-t border-slate-200/60 py-1.5 text-[10px] font-medium text-sky-700 hover:bg-sky-500/10 disabled:opacity-50 dark:border-white/10 dark:text-sky-300"
              >
                <Download className="h-3 w-3" />
                PNG
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={busy || selected.length === 0}
        onClick={() => void exportPack()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
        {busy
          ? `${isEn ? 'Preparing' : 'Готуємо'} ${progress.completed}/${progress.total}`
          : `${isEn ? 'Download PNG pack' : 'Завантажити PNG-набір'} (${selected.length})`}
      </button>
      {busy && (
        <progress
          aria-label={isEn ? 'Export progress' : 'Прогрес експорту'}
          value={progress.completed}
          max={progress.total || 1}
          className="h-1.5 w-full accent-sky-500"
        />
      )}
      {selected.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isEn ? 'Select at least one reaction to build a pack.' : 'Обери хоча б одну емоцію для набору.'}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-700 dark:text-rose-300"
        >
          {error}
        </p>
      )}
      {currentPack && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300"
        >
          {isEn
            ? `${currentPack.stickers.length} PNG files prepared. Extract the ZIP, then follow the steps below. The README inside includes the emoji list.`
            : `Готово: ${currentPack.stickers.length} PNG. Розпакуй ZIP і виконай кроки нижче. README всередині містить список емодзі.`}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
          {isEn ? 'Add your pack to Telegram' : 'Додай набір у Telegram'}
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <li>{isEn ? 'Extract the ZIP on your device.' : 'Розпакуй ZIP на своєму пристрої.'}</li>
          <li>
            {isEn
              ? 'Open @Stickers and send /newpack, then a name for your pack.'
              : 'Відкрий @Stickers, надішли /newpack і назву набору.'}
          </li>
          <li>
            {isEn
              ? 'Send each PNG as a file, without compression. Send its emoji after each upload.'
              : 'Надсилай кожен PNG як файл, без стиснення. Після кожного додай його емодзі.'}
          </li>
          <li>
            {isEn
              ? 'Send /publish, then /skip for the optional icon. Choose an available short name to get your pack link.'
              : 'Надішли /publish, потім /skip для пропуску іконки. Обери вільне коротке ім’я та отримай посилання.'}
          </li>
        </ol>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {isEn
            ? 'ZIP files cannot be imported directly. Files are checked locally; Telegram confirms acceptance when you upload them. You can also create a set in the @Stickers mini app.'
            : 'ZIP не імпортується напряму. Файли перевіряються локально; прийняття підтверджує Telegram під час завантаження. Набір також можна створити в мініапці @Stickers.'}
        </p>
        <a
          href="https://t.me/Stickers"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:underline dark:text-sky-300"
        >
          {isEn ? 'Open @Stickers' : 'Відкрити @Stickers'}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <details className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
        <summary className="cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
          {isEn ? 'Experimental animation · TGS' : 'Експериментальна анімація · TGS'}
        </summary>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {is3D
            ? isEn
              ? 'Your character’s 3D poses export as PNG stickers. TGS supports vector artwork only.'
              : '3D-пози персонажа експортуються в PNG-стікери. TGS підтримує лише векторну графіку.'
            : illustrated
              ? isEn
                ? 'Miya Nocturne’s illustrated layers are available as detailed PNG stickers. TGS supports vector artwork only.'
                : 'Ілюстровані шари Miya Nocturne експортуються в деталізовані PNG-стікери. Формат TGS підтримує лише векторну графіку.'
              : isEn
                ? 'Exports all nine vector animations. Gradients, glow and some face details may differ from the PNG previews. Local checks do not guarantee Telegram acceptance. Use /newanimated in a separate pack; do not mix these files with the PNG set.'
                : 'Експортує всі дев’ять векторних анімацій. Градієнти, світіння й деталі обличчя можуть відрізнятися від PNG-прев’ю. Локальна перевірка не гарантує прийняття Telegram. Використай /newanimated для окремого набору; не змішуй із PNG.'}
        </p>
        <button
          type="button"
          disabled={busy || !vectorSupported}
          onClick={() => void exportAnimated()}
          className="mt-3 text-xs font-medium text-sky-700 hover:underline disabled:opacity-50 dark:text-sky-300"
        >
          {isEn ? 'Download experimental TGS ZIP' : 'Завантажити експериментальний TGS ZIP'}
        </button>
        {animatedReady && vectorSupported && (
          <p role="status" className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {isEn
              ? 'TGS files prepared. Check their appearance and acceptance in Telegram.'
              : 'TGS-файли готові. Перевір їхній вигляд і прийняття в Telegram.'}
          </p>
        )}
      </details>
    </section>
  );
};
