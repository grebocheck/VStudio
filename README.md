# V-Studio — Character & Sticker Studio

A browser studio for expressive anime characters, Telegram sticker packs, and live avatars on stream. New studios open **Aurelia**, a full 3D avatar with skinned geometry, a humanoid skeleton, facial expressions, and a camera you can rotate around the model. The studio and exports work without an AI account.

## Meet Aurelia

1. Choose **Aurelia** at the top of the character library. Drag in the viewer to orbit the model through 360°; scroll to zoom.
2. Switch between **Portrait**, **Half-length**, and **Full body** framing. **Front view** resets the camera; **Turntable** rotates it automatically; **Wireframe** reveals the actual model geometry.
3. Try expression buttons, cursor, voice or camera tracking. Appearance tabs offer **Quiet**, **Natural**, and **Expressive** motion energy; her hairstyle and outfit remain one consistent design.
4. Save her name, story and settings, capture a transparent PNG, build a Telegram PNG pack, or use **Download GLB** in the viewer to save the 3D asset.

Aurelia uses pixiv's licensed VRM sample foundation. Its anatomy, base skinned geometry, textures, facial morph targets and spring-bone rig were authored by pixiv; V-Studio adds material styling and volumetric accessories. [Model provenance and license](public/models/aurelia-3d/README.md) identify the source, preserved metadata and export limitations. This is not a claim that the underlying anatomy was built from scratch.

GLB exports contain geometry, skeleton, skin weights, embedded textures and morph targets. They use portable PBR materials, which look different from the live MToon shading, and do not preserve VRM expression bindings, spring-bone extensions or V-Studio's animation controller. The 3D model supports PNG capture and GLB export; SVG and TGS are unavailable for this model.

## Meet Miya Nocturne

**Miya Nocturne** remains available as a separate illustrated 2D model. Her renderer combines illustrated body and head/hair assets with separately animated eyes, brows, mouth, hair sections, and expression details. Head movement, gaze, blinking, breathing, mouth opening, and hair motion respond to the shared live rig.

1. Choose **Miya Nocturne** below Aurelia in the character library.
2. Open an appearance tab to choose **Portrait**, **Half body**, or **Full model** framing and optional moonlight glow. Full model shows the full available illustration; it does not generate an unseen body or viewing angle. Framing is saved with the character and used by exports and OBS.
3. Try reactions, cursor tracking, voice or camera input. Pause to hold a pose; preview backgrounds and viewport zoom do not alter exported artwork.
4. Set her name and story, save a variant to the collection, download a transparent **1600 × 1600 PNG**, or open **Telegram stickers**.

Miya's hair, face and outfit form one authored design. Her appearance tabs expose presentation settings rather than interchangeable costume parts. The separate **customizable characters** collection retains the original parametric SVG editor: hair, face, outfit, accessories, colours and **Surprise me** remain available for those models. Surprise me switches to a customizable character.

Existing saved characters and project files retain their original renderer, including saved Miya projects. A missing `modelId` in an older file is treated as parametric; it is never silently reinterpreted as Aurelia or Miya.

## Save and edit

**Undo / redo:** Ctrl/⌘ Z and Ctrl/⌘ Shift Z (also Ctrl Y). History keeps 60 changes; continuous edits to one control are grouped. Typing in a field uses the field's native undo. Applying a preset, importing a project and changing your saved collection can also be undone.

Characters and settings are saved in this browser. **Project file** downloads a `.vstudio.json` backup; **Open** restores the character and adds the saved collection. Imports are validated and limited to 2 MiB / 50 saved characters. Clearing browser storage removes local work, so keep a project backup.

## Telegram stickers

The default export uses the actual avatar artwork, including its colours, costume and face details.

- Nine reaction previews with selection controls and individual PNG downloads.
- Transparent **512 × 512 PNG**, white outline and padding; each file is checked for visible pixels, transparency and the **512 KiB** size limit.
- A ZIP containing the selected images, `manifest.json`, emoji mappings and bilingual instructions.
- Export progress and actionable errors. Nothing is uploaded automatically.

To create the Telegram set, **extract the ZIP**, open [@Stickers](https://t.me/Stickers), send `/newpack` and a pack title, then upload each PNG **as a file/document** and send the corresponding emoji. Use `/publish` and follow the bot's prompts. Telegram does not import the ZIP itself.

Aurelia and Miya support **Telegram PNG stickers**. Animated **TGS is unavailable for 3D and illustrated models**: this vector-only workflow cannot represent the rendered 3D scene or raster illustration. The legacy parametric models retain an experimental TGS export: SVG filters, clipping and some details can differ after conversion. Local structure/size checks are not a Telegram acceptance test. Use PNG for faithful artwork. Format references: [Telegram sticker requirements](https://core.telegram.org/stickers), [static sticker import specifications](https://core.telegram.org/import-stickers#static-stickers).

## Live animation and OBS

Idle, cursor, microphone and camera tracking remain available, with expression hotkeys 1–9 and camera calibration profiles. Pause holds the pose; resuming restores the previous tracking mode. Camera and microphone capture require browser permissions; face tracking downloads its MediaPipe model on first use. HTTPS or localhost is required for device capture.

The **OBS Integration** panel provides a transparent Browser Source URL, PNG export and WebM/GIF recording. Aurelia captures the actual WebGL scene. SVG is available for the 2D models; Miya's standalone SVG embeds its illustrated assets, so the downloaded file opens without the local server. Keep the studio open while streaming. Use the full paired URL from the panel; each studio has its own overlay session, so separate browsers do not overwrite each other's avatars. Treat the paired URL as private: it grants access to that relay session. Old bare `/overlay` sources need to be replaced with the paired URL.

Miya is a layered 2D illustrated rig with limited pose deformation. It is not a full 3D model or a Live2D Cubism rig: the studio does not import or export `.moc3` models, and it does not reconstruct hidden surfaces during large head turns. The parametric SVG renderer remains available alongside the illustrated renderer.

The source illustration and separated layers were created with the built-in image generation tool. [Artwork notes](public/models/miya-nocturne/README.md) describe the source files and registration; [exact prompts](public/models/miya-nocturne/prompts.json) are preserved for future edits.

## Optional AI stylist

For customizable characters, the stylist uses Gemini to select **existing** parts, colours and character metadata from a description; it does not generate new 3D geometry, illustrated assets or redraw the fixed models. Descriptions are sent to Gemini. A missing server connection is shown before submission, and prompts are limited to 600 characters. No paid AI request is needed for the preset/editor/export workflow.

## Run locally

Node.js 20+:

```bash
npm ci
cp .env.example .env
npm run dev
```

Open **http://localhost:3000**. To enable the optional stylist, set `GEMINI_API_KEY` in `.env`.

```bash
npm run build
npm run start
# Or: docker compose up --build
```

| Variable                | Purpose                     | Default            |
| ----------------------- | --------------------------- | ------------------ |
| `GEMINI_API_KEY`        | Optional AI stylist key     | unset              |
| `GEMINI_MODEL`          | Gemini model                | `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_MS`     | Timeout per request attempt | `25000`            |
| `GEMINI_RETRY_ATTEMPTS` | Maximum attempts            | `2`                |
| `PORT`                  | HTTP port                   | `3000`             |

`GET /healthz` returns `{ "status": "ok", "ai": boolean }`.

## Verification

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

Playwright uses system Chrome (`channel: 'chrome'`). `PORT=3100 npm run test:e2e` can target a separate dev server. Unit coverage includes model compatibility, project recovery/history, renderer references, sanitization, 3D pose mapping, illustrated motion and sticker structure. Browser tests inspect 3D orbit and GLB contents, downloaded PNG/ZIP/TGS bytes, standalone SVG embedding, transparent pixels, reaction differences, project round trips, pause/resume, mobile layout, accessibility, onboarding and OBS pairing. TGS checks apply to parametric models only.

Physical camera/microphone behaviour, real OBS capture and Telegram bot acceptance still need checking on the target devices/accounts; local tests cannot certify those services.

## Local review artifacts

Generated review images and downloads live in `artifacts/review/` (ignored by Git). Current Miya files use the `miya-nocturne-` prefix: studio screenshot, transparent portrait, full artwork and a validated nine-reaction PNG pack. `miya-nocturne.svg` is a standalone embedded composition. Earlier MVP samples in that folder may depict the parametric model. No sample pack has been published to Telegram automatically.

## Code map

- `src/components/avatar/` — SVG artwork and per-avatar paint-server namespaces.
- `src/components/three/` — WebGL scene, VRM skeleton and expression control, viewer and GLB export.
- `public/models/aurelia-3d/` — licensed VRM source, provenance, terms and static library thumbnail.
- `src/components/premium/` — Miya's illustrated renderer and shared live/static pose transforms.
- `public/models/miya-nocturne/` — bundled illustration and separated model artwork.
- `src/presets.ts`, `src/lib/sanitizeConfig.ts` — model selection, fresh-session defaults and backward-compatible configuration.
- `src/components/CenterStage.tsx`, `src/components/sidebar/` — editor, previews and output workflows.
- `src/hooks/useAvatarStore.ts`, `src/lib/avatarHistory.ts`, `src/lib/avatarProject.ts` — document history, persistence and validated imports.
- `src/lib/telegram/staticPack.ts` — faithful PNG rendering, validation and packaging; other Telegram modules handle experimental TGS.
- `src/lib/avatarExport.ts` — image embedding and self-contained SVG/PNG output.
- `src/hooks/useAnimationEngine.ts`, `src/hooks/useOverlaySync.ts` — live pose and OBS transport.
- `src/server.ts` — Gemini proxy, health check, isolated WebSocket relay and static serving.

See [ROADMAP.md](ROADMAP.md) for the current product direction and remaining work.
