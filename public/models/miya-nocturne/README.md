# Miya Nocturne — artwork and rig

Original character artwork generated for VStudio using the built-in OpenAI image generation tool, then assembled into a custom SVG 2D puppet rig. All four PNG sources retain transparency and their original generated pixels (1024 × 1536).

## Files

- `portrait.png`: original character illustration; painted eyes, eyebrows and neutral mouth are sampled from this image at runtime.
- `head-hair.png`: separated head, blank face, neck and hair. Runtime clip regions provide head and secondary hair motion.
- `body.png`: separated costume and torso; neck reconstruction is layered behind the collar.
- `face-underpaint.png`: intermediate clean-face source, retained for further art work; not loaded by the renderer.
- `prompts.json`: the exact generation/edit prompts used for the source artwork.

## Runtime registration

The rig uses artwork coordinates in a square export canvas. Body registration: x=0, y=60, width=1024, height=1536. Head/hair registration: x=85.333, y=0, width=853.333, height=1280. Painted face features are registered against the original illustration. See `src/components/premium/MiyaNocturne.tsx` and `miyaMotion.ts` for clip regions and motion parameters.

## Supported scope

This is a layered illustrated 2D puppet with independent blinking, gaze, lip sync, brows, expression overlays, subtle head/body motion and secondary hair movement. It is not a Cubism project, PSD with individually painted hair strands, or a fully deformable model for large head turns. The complete artwork ends at the upper thighs. Framing options show portrait, half-length or the complete artwork.

PNG and self-contained SVG exports embed the artwork. Telegram packs use transparent 512 × 512 PNGs with a 512 KiB cap. TGS is intentionally unavailable for this raster-based character. Existing parametric models remain editable and retain their separate export options.
