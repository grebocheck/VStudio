# V-Studio — Аудит проєкту та план переходу MVP → продакшн-інструмент

> Документ описує поточний стан проєкту **VTuber Customizer & Live Rigging Studio**, виявлені проблеми та покроковий план розвитку до повноцінного інструменту для кріейторів (стрімерів, VTuber-ів).
>
> Дата аудиту: 2026-06-01 · Гілка: `main`

---

## 1. Що це за проєкт

Веб-застосунок для створення та анімації 2D VTuber-аватарів у браузері:

- **Стек:** React 19 + TypeScript + Vite 6 + Tailwind 4, Express-сервер (SSR-проксі до Gemini), MediaPipe Tasks Vision для трекінгу обличчя.
- **Рендер аватара:** SVG (`viewBox 0 0 400 400`), процедурна анімація через `requestAnimationFrame` у [useAnimationEngine.ts](src/hooks/useAnimationEngine.ts), а частий rig-frame стейт локалізовано в [LiveRigWorkspace.tsx](src/components/LiveRigWorkspace.tsx). Transform-рух SVG застосовується через `ref` на кожному кадрі, важчі React shape-render-и обмежено приблизно до 30 fps.
- **Можливості:** конструктор зовнішності (волосся, очі, одяг, аксесуари, пропорції), 7 пресетів, ригінг-слайдери, 4 режими трекінгу (auto / mouse / mic / camera), ШІ-генерація стилю через Gemini, експорт PNG/SVG/JSON, Telegram `.tgs` стікерпак, запис WebM/GIF, OBS overlay, емоут-хоткеї, калібрування камери, двомовний UI (uk/en), темна/світла тема.

**Загальний вердикт:** фази 0 і 2 виконані, а фаза 1 суттєво просунута: критичні блокери прибрані, додано персистентність, експорт, запис кліпів, OBS overlay, тести та CI. Найближчий фокус — завершити інженерний фундамент і рухати продуктивність, доступність, адаптив та онбординг із фази 3.

---

## 2. Закриті критичні проблеми ✅

### 2.1. ✅ Модель Gemini

[server.ts](src/server.ts) використовує `GEMINI_MODEL` з env із валідним стабільним fallback `gemini-2.5-flash`; змінну задокументовано в [.env.example](.env.example).

### 2.2. ✅ Безпечний ШІ-конфіг

Схему розширено, а відповіді ШІ проходять merge/clamp через [sanitizeConfig.ts](src/lib/sanitizeConfig.ts), тому часткова або некоректна відповідь не ламає аватар.

### 2.3. ✅ Локалізація пресетів

Вбудовані пресети мають стабільні `id`, а [localizePreset()](src/presets.ts) використовує синхронізовані ключі `uk`/`en`.

### 2.4. ✅ Невалідні Tailwind-класи

Невалідні значення палітри замінено на підтримувані класи Tailwind.

### 2.5. ✅ Персистентність проєкту

[useAvatarStore.ts](src/hooks/useAvatarStore.ts) зберігає поточний конфіг і кастомні пресети в `localStorage`, а також підтримує експорт/імпорт `.vstudio.json`.

---

## 3. Архітектурні та якісні проблеми 🟠

### 3.1. 🟡 SVG-render переведено на гібридний pipeline

Частий стейт винесено з `App` у [LiveRigWorkspace.tsx](src/components/LiveRigWorkspace.tsx): shell, ліва панель і закриті вкладки редактора більше не рендеряться на кожен rig-кадр. Фон сцени, emote-панель і dossier-картка ізольовані через `React.memo` у [CenterStageStatic.tsx](src/components/CenterStageStatic.tsx). Формули руху винесено в [avatarFrame.ts](src/lib/avatarFrame.ts): transform-и голови, волосся, торса, parallax і аксесуарів мутуються напряму через SVG `ref` на кожному `requestAnimationFrame`, а React-стан для shape-змін очей, рота й емоцій публікується приблизно 30 fps.

- **Наступний напрям:** перевести деформацію очей і рота на цільові SVG `ref`-мутації або рендерити аватар на `<canvas>`; виміряти CPU/GPU профіль разом із MediaPipe.

### 3.2. ✅ Узгоджені типи `TrackingMode` / `Emotion`

Спільні union-типи винесено в [types.ts](src/types.ts) та використано в компонентах і хуках.

### 3.3. ✅ Магічні числа, рядки помилок і мова коментарів упорядковані

- **Константи рушія:** усі тюнінг-числа — фізика волосся, пороги емоцій, коефіцієнти згладжування, мапінг MediaPipe-blendshape-ів, transform-множники аватара — винесено в [engine/constants.ts](src/engine/constants.ts), згруповано за призначенням і задокументовано англійською. [useAnimationEngine.ts](src/hooks/useAnimationEngine.ts), [hairPhysics.ts](src/lib/hairPhysics.ts), [avatarFrame.ts](src/lib/avatarFrame.ts) і [emotionClassifier.ts](src/lib/emotionClassifier.ts) тепер читаються як намір, а не як арифметика; значення тюняться в одному місці.
- **Рядки помилок:** [server.ts](src/server.ts) повертає стабільні `code` (`rate_limited`, `prompt_empty`, `prompt_too_long`, `ai_unavailable`, `gemini_timeout`, `gemini_error`) з англійським developer-fallback; локалізацію взято на клієнт через секцію `errors` у [en.ts](src/i18n/en.ts)/[uk.ts](src/i18n/uk.ts), а [useAiGenerate.ts](src/hooks/useAiGenerate.ts) резолвить код у повідомлення мовою UI (з інтерполяцією `{max}`).
- **Коментарі:** зведено до англійської; єдиний навмисний україномовний текст у коді — generation-prompt до Gemini (вимагає українського лору) та самі рядки перекладу в `uk.ts`.

### 3.4. ✅ Декомпозиція великих компонентів

[App.tsx](src/App.tsx) вже став тоншим оркестратором завдяки хукам `useFaceTracking`, `useMicrophone`, `useAvatarStore`, `useCameraCalibration`, компоненту [LiveRigWorkspace.tsx](src/components/LiveRigWorkspace.tsx) і memo-блокам [CenterStageStatic.tsx](src/components/CenterStageStatic.tsx).

[RightSidebar.tsx](src/components/RightSidebar.tsx) (~1250 рядків) розбито на тонкий shell + по одному компоненту на вкладку в [src/components/sidebar/](src/components/sidebar/): `PresetsTab`, `HairTab`, `FaceTab`, `ClothesTab`, `MetadataTab`, `RiggingTab`, `AiTab`, `ObsTab`. Вкладки беруть `useI18n`/`useTheme` напряму замість prop-drilling; shell лишився ~170 рядків і зберіг memo-контракт (`areRightSidebarPropsEqual`, юніт-тести зелені).

[VTuberAvatar.tsx](src/components/VTuberAvatar.tsx) зменшено з ~1020 до ~270 рядків і перетворено на композицію SVG-шарів. Фон, defs/градієнти, HUD, debug grid, anime sparkles, face flush і emotion overlays винесено в окремі компоненти в [src/components/avatar/](src/components/avatar/), при цьому `data-rig-node`-контракт для імперативного frame pipeline збережено.

### 3.5. Частково посилений сервер

[server.ts](src/server.ts) має обмеження body та промпту, rate-limit, security headers, `/healthz`, `PORT` з env, Gemini timeout/retry та структуроване JSON-логування. Для горизонтального масштабування лишилися production-grade зовнішні сховища логів і rate-limit store.

---

## 4. Прогалини продукту (чого бракує для «справжнього інструмента») 🟡

| Область                      | Поточний стан                                                                                             | Потрібно                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Експорт аватара**          | ✅ PNG, SVG, JSON, WebM, GIF, Telegram `.tgs` sticker pack                                                | розширювати формати за потреби                 |
| **Реальна OBS-інтеграція**   | ✅ `/overlay` + WebSocket relay + Browser Source URL                                                      | production-hardening relay                     |
| **Персистентність**          | ✅ автозбереження, бібліотека пресетів, JSON import/export                                                | опційне хмарне збереження                      |
| **Хоткеї та «емоут»-панель** | ✅ клавіші 1–9 + панель                                                                                   | кастомізація bindings                          |
| **Калібрування камери**      | ✅ вибір пристрою, neutral pose, sensitivity, smoothing, іменовані saved profiles                         | розширювати сценарії за потреби                |
| **Профілі трекінгу**         | ✅ локальне збереження налаштувань + іменовані профілі apply/save/update/delete                           | розширювати сценарії за потреби                |
| **Онбординг**                | ✅ first-run тур по пресетах, трекінгу, кастомізації та OBS; повторний запуск із toolbar                  | розширювати контекстними підказками за потреби |
| **Доступність (a11y)**       | 🟡 додано `focus-visible`, reduced-motion, ARIA-ролі/стани, axe-аудит shell обох тем і keyboard flow туру | повна клавіатурна перевірка всіх вкладок       |
| **Адаптив/мобільний**        | ✅ інтерфейс лишається доступним, на вузьких екранах показується явна desktop-рекомендація                | повноцінний мобільний layout за потреби        |

---

## 5. Інженерна гігієна ⚙️

- **Тести:** ✅ Vitest покриває sanitize/merge, класифікатор емоцій, hair-sway фізику, калібрування, експорт, store, рекордер, FPS-розрахунок, memo-компаратор редактора, SVG frame-transform pipeline і навігацію onboarding. Playwright E2E перевіряє first-run tour, mobile desktop-рекомендацію, chrome-free `/overlay`, axe-аудит обох тем і keyboard flow онбордингу.
- **Лінтинг/форматування:** ✅ ESLint + Prettier застосовані до кодової бази; Husky + lint-staged перевіряють staged-файли перед комітом.
- **CI/CD:** ✅ GitHub Actions запускає typecheck, lint, format-check, unit-тести, build, Playwright E2E і docker build.
- **Залежності:** `package.json` має продуктову назву та версію; ще немає Renovate/Dependabot.
- **README:** ✅ описує продукт, архітектуру, запуск, env і Docker.
- **Error boundaries / телеметрія:** ✅ React Error Boundary логгує падіння клієнта, а `useFpsMeter` показує виміряний FPS замість фейкового значення.
- **Безпека ключів:** ✅ `.env*` у `.gitignore`, у git лише `.env.example` — це добре. Зберегти цей інваріант.

---

## 6. Покроковий план (роадмеп)

### Фаза 0 — Стабілізація (1–2 дні) 🔴 _блокери_

Мета: щоб усі заявлені функції реально працювали.

1. ✅ Виправити модель Gemini → `gemini-2.5-flash`, винести в env.
2. ✅ Розширити `responseSchema` + merge-замість-replace + clamp/валідація на клієнті.
3. ✅ Полагодити локалізацію пресетів.
4. ✅ Глобально замінити невалідні Tailwind-класи.
5. ✅ Персистентність у `localStorage` для поточного конфігу + кастомних пресетів.
6. ✅ Узгодити типи `TrackingMode`/`Emotion` у [types.ts](src/types.ts).

**Готовність фази:** ШІ-генерація працює, аватар не ламається, стилі коректні, робота не губиться при перезавантаженні.

### Фаза 1 — Фундамент якості (3–5 днів) 🟠

1. ✅ ESLint + Prettier + lint-staged + Husky; форматування застосовано до наявного коду.
2. ✅ Vitest: юніт-тести на класифікатор емоцій, hair-sway фізику, ШІ-merge/clamp, кольори, експорт, store, рекордер і FPS.
3. ✅ GitHub Actions: `typecheck → lint → format-check → test → build → test:e2e → docker build`.
4. ✅ React Error Boundary + базове логування клієнтських помилок.
5. ✅ `App.tsx` розділено на основні хуки, включно з `useAiGenerate`.
6. ✅ Сервер має max-length, rate-limit, `/healthz`, security headers, env-порт, Gemini timeout/retry та структуроване логування.
7. ✅ README та `package.json` оновлені під реальний продукт.
8. ✅ Playwright E2E: first-run onboarding із повторним запуском, mobile desktop-рекомендація з персистентним dismiss, chrome-free `/overlay`, axe-аудит обох тем і keyboard flow онбордингу.

### Фаза 2 — Ключові фічі кріейтора (1–2 тижні) 🟡

1. ✅ **Експорт:** PNG з прозорим фоном (серіалізація SVG → canvas), експорт SVG, експорт/імпорт проєкту `.json`.
2. ✅ **OBS-режим:** окремий маршрут `/overlay` (тільки аватар, прозорий фон) + синхронізація стану між вкладкою-редактором і overlay через WebSocket relay; інструкція «Browser Source URL».
3. ✅ **Емоут-панель + хоткеї:** ручне тригерення емоцій/поз гарячими клавішами для стріму.
4. ✅ **Калібрування камери:** UI-майстер, вибір пристрою, повзунки чутливості/згладжування, збереження профілю трекінгу.
5. ✅ **Запис анімації:** WebM через `MediaRecorder` + прозорий GIF-loop encoder (для аватар-кліпів).
6. ✅ **Telegram sticker pack:** native vector `.tgs` generator на базі модельки персонажа: 9 емоційних loop-стікерів, `512x512`, `60fps`, до 3 секунд, фон завжди прозорий/вимкнений, ZIP із `.tgs` файлами та manifest для @Stickers.

### Фаза 3 — Полірування та масштаб (постійно) 🟢

1. 🟡 Продуктивність: «config» і «rig-frame» стейти розділено через `LiveRigWorkspace`, статичні панелі ізольовано `React.memo`, transform-рух SVG переведено на 60 fps `ref`-мутації, а важчі React shape-render-и обмежено приблизно до 30 fps; лишилися імперативні деформації очей/рота або `<canvas>` і профілювання з MediaPipe.
2. 🟡 Доступність: додано ARIA-стани, назви основних контролів, `focus-visible` і `prefers-reduced-motion`; axe-аудит shell для обох тем і keyboard flow онбордингу автоматизовано у Playwright, знайдені контрастні порушення виправлено. Лишилася повна клавіатурна перевірка всіх редакторських вкладок.
3. ✅ Адаптив/мобільний: додано явну dismissible desktop-рекомендацію для вузьких екранів; повний mobile layout лишається опційним розширенням.
4. ✅ Онбординг-тур: first-run dialog із локальним збереженням, клавіатурною навігацією, повторним запуском із toolbar і поясненням пресетів, tracking, кастомізації та OBS.
5. ✅ Іменовані профілі трекінгу: camera calibration wizard має saved profiles із apply/save/update/delete, localStorage persistence і sanitize для битих даних.
6. 🟡 Розширення контенту: додано доступ до готових аксесуарів `angel-halo`/`fox-mask` у UI та новий built-in пресет Kitsune Oracle; далі — більше зачісок/одягу й кастомні кольорові градієнти.
7. (Опційно) акаунти + хмарне збереження бібліотеки аватарів.
8. ✅ Реальна телеметрія FPS/перформансу замість захардкоджених значень.

---

## 7. Швидкі перемоги (можна зробити сьогодні)

- [x] Назва моделі Gemini ([server.ts:48](src/server.ts#L48)) — 1 рядок, розблоковує ШІ.
- [x] `setConfig(prev => ({...prev, ...data}))` замість заміни — захист від поламаного аватара.
- [x] Пошук-заміна невалідних Tailwind-класів.
- [x] localStorage для конфігу та кастомних пресетів.
- [x] Винести `TrackingMode`/`Emotion` у спільні типи.
- [x] Оновити README та `package.json`.

---

## 8. Підсумок

Проєкт уже має **сильну продуктову основу**: детальний SVG-аватар, MediaPipe-трекінг, персистентність, експорт, OBS overlay, Telegram `.tgs` стікерпак, кліпи, unit- та E2E-тести й CI. Фаза 1 закрита для поточного масштабу; у фазі 3 локалізовано щокадрові React-render-и, додано гібридний SVG pipeline, декомпоновано великий SVG avatar shell, додано desktop-рекомендацію, доступний first-run тур, іменовані tracking profiles і автоматизований axe-аудит shell. Наступні кроки — профілювання з MediaPipe, цільові ref-деформації очей/рота або `<canvas>`, клавіатурна перевірка всіх редакторських вкладок та production-grade зовнішні сервіси для логів і rate-limit store.

## 9, Мої ідейки

- [x] Генератор стікерів на основі модельки персонажа: реалізовано Telegram-native vector `.tgs` pack із прозорим фоном, 9 емоційними loop-анімаціями та ZIP/manifest експортом для @Stickers.
