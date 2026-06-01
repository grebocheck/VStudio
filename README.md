# V-Studio — VTuber Customizer & Live-Rigging Studio

An interactive browser studio for building 2D VTuber avatars and driving them live.
Design a character (hair, eyes, outfit, accessories, proportions), then animate it
with **camera face-tracking**, **microphone mouth-sync**, **mouse tracking**, or an
**idle auto-loop** — and pipe it into OBS as a stream overlay.

> Status: actively being hardened from MVP toward a production tool. See [ROADMAP.md](ROADMAP.md).

## Features

- **Avatar builder** — hairstyles, eyes/pupils, eyebrows, outfits, accessories, blush, fangs, ears, body proportions, art styles (classic / anime / retro).
- **Live rigging** — MediaPipe FaceLandmarker drives head yaw/pitch/roll, blinks, gaze, mouth, eyebrows, and a 16-state emotion classifier with hysteresis.
- **Tracking modes** — `camera`, `mic` (amplitude → mouth flap), `mouse`, and `auto` (AFK idle motion). Camera device selection, neutral-pose calibration, sensitivity, and smoothing are saved locally.
- **AI styling** — describe a character in natural language; a server-side Gemini call returns a full avatar config (validated + clamped before applying).
- **Presets & persistence** — built-in characters, plus save/export/import your own avatars (`localStorage` + `.vstudio.json`).
- **Exports, OBS & clips** — transparent PNG/SVG avatar exports, transparent Browser Source overlay, chroma-key fallback, short WebM recording, and transparent GIF loops.
- **i18n + theming** — Ukrainian / English, dark / light.

## Architecture

```
src/
  App.tsx                  thin orchestrator (state + composition)
  presets.ts               built-in characters, INITIAL_RIG, localizePreset()
  types.ts                 shared unions (AvatarConfig, RigParams, Emotion, TrackingMode…)
  hooks/
    useAvatarStore.ts      config + custom presets + persistence + import/export
    useMicrophone.ts       mic capture graph → analyser refs
    useFaceTracking.ts     webcam + MediaPipe FaceLandmarker lifecycle
    useCameraCalibration.ts persisted camera tracking profile
    useAvatarRecorder.ts   SVG → canvas → MediaRecorder WebM clips
    useAnimationEngine.ts  the per-frame rAF loop (blink, mic, auto, camera, emotions, hair)
    useAiGenerate.ts       Gemini request lifecycle + defensive response handling
  lib/
    avatarExport.ts        SVG serialization + transparent PNG export
    hairPhysics.ts         pure spring-mass secondary hair motion
    sanitizeConfig.ts      defensive merge/clamp for untrusted configs (AI / import)
    storage.ts             safe localStorage helpers
  components/              UI (sidebars, stage) + components/avatar (SVG parts)
  i18n/                    en / uk dictionaries
  server.ts                Express: Gemini proxy, rate-limit, health, static serve
```

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env      # set GEMINI_API_KEY for AI styling (optional)
npm run dev               # http://localhost:3000
```

## Scripts

| Script                 | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Dev server (Express + Vite middleware, HMR)                |
| `npm run build`        | Build client (Vite) + server (esbuild → `dist/server.cjs`) |
| `npm run start`        | Serve the production build                                 |
| `npm run typecheck`    | `tsc --noEmit`                                             |
| `npm run lint`         | ESLint                                                     |
| `npm test`             | Run unit tests (Vitest)                                    |
| `npm run format`       | Prettier write                                             |
| `npm run format:check` | Verify Prettier formatting                                 |

## Environment

| Variable                | Purpose                                                       | Default            |
| ----------------------- | ------------------------------------------------------------- | ------------------ |
| `GEMINI_API_KEY`        | Enables AI style generation (omit to disable the AI endpoint) | —                  |
| `GEMINI_MODEL`          | Model used for generation                                     | `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_MS`     | Timeout for each Gemini request attempt                       | `25000`            |
| `GEMINI_RETRY_ATTEMPTS` | Maximum Gemini attempts, including the initial request        | `2`                |
| `PORT`                  | Server port                                                   | `3000`             |

## Docker

```bash
docker compose up --build    # serves on :3000
```

## Health check

`GET /healthz` → `{ "status": "ok", "ai": <bool> }`
