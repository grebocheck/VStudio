# Seraphine Dawnwarden — 3D knight

Seraphine is an original anime knight built on the same licensed humanoid foundation as Aurelia. Her silver and champagne-gold plate armor, midnight-blue cloth, ruby details and blonde braided updo are authored as separate 3D geometry. She is a separate library character; saved Aurelia characters retain their original appearance.

## Source and license

The base anatomy, facial mesh and expression morphs, humanoid skeleton and source skinning come from **pixiv Inc.**'s VRM 1.0 sample. Seraphine loads the existing, unmodified [`../aurelia-3d/base.vrm`](../aurelia-3d/base.vrm); the base asset is not duplicated.

The original [source metadata](../aurelia-3d/source.json), [provenance notes](../aurelia-3d/README.md) and bundled [VRM Public License 1.0](../aurelia-3d/VRM-Public-License-1.0.pdf) apply to this derivative and its exports. Added geometry and styling do not replace the source terms. This character is not affiliated with pixiv or the Fate franchise.

## Model and exports

The character uses the shared facial expressions, gaze, head tracking and live animation rig. Armor follows the humanoid bones; the hair is attached to the head. The viewer supports all angles, transparent PNG capture, Telegram PNG stickers and a portable GLB export containing the actual geometry, skeleton, skin weights and expression morph targets.

GLB uses PBR shading and does not retain VRM expression bindings or V-Studio's runtime animation controller. SVG and TGS exports are unavailable for 3D characters. Keep the source/license information with redistributed derivatives.

`preview.png` is captured from the actual 3D renderer, rather than a concept illustration.
