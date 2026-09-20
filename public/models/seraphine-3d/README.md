# Seraphine Dawnwarden — 3D knight

Seraphine is an original anime knight built on the same licensed humanoid foundation as Aurelia. Her silver and champagne-gold plate armor, midnight-blue cloth, ruby details and blonde braided updo are authored as separate 3D geometry. She is a separate library character; saved Aurelia characters retain their original appearance.

## Source and license

The base anatomy, facial mesh and expression morphs, humanoid skeleton and source skinning come from **pixiv Inc.**'s VRM 1.0 sample. Seraphine loads the existing, unmodified [`../aurelia-3d/base.vrm`](../aurelia-3d/base.vrm); the base asset is not duplicated.

The original [source metadata](../aurelia-3d/source.json), [provenance notes](../aurelia-3d/README.md) and bundled [VRM Public License 1.0](../aurelia-3d/VRM-Public-License-1.0.pdf) apply to this derivative and its exports. Added geometry and styling do not replace the source terms. This character is not affiliated with pixiv or the Fate franchise.

## Model and exports

Seraphine has her own softly oval face, open eyes with a gentle outer lift, rounded cheek and chin transitions, and a subtle nose and mouth profile. The sculpt is applied to all 57 facial expression morphs as well as the neutral mesh, preserving blinking, gaze and lip movement. Warm skin and chestnut eye contours accompany emerald irises whose pupils and highlights remain visible in shadow.

Her hairstyle has an asymmetric fringe, swept crown, woven side braids and a coiled low bun. The foundation is fitted to the actual head surface, with rooted fringe curves and a fine transition at the hairline. Matte wheat-blonde shading, continuous fibre textures and loose wisps soften the silhouette. Hair textures and alpha masks are included in GLB exports.

Seraphine's expression controller combines separate brow, eyelid and mouth regions. Closed-mouth smiles, sleepy lids and asymmetric expressions remain distinct, while full blinking and tracked speech retain their own movement budget. Emotion transitions return to the tracked neutral face without changing Aurelia's controller.

The character uses the shared gaze, head tracking and live animation rig. Armor follows the humanoid bones; the hair is attached to the head. Two long sapphire satin ribbons have gold embroidery, split tips and a skinned rig. Their runtime simulation responds to head movement with gravity, inertia, damping and collision proxies around the head, neck and armor. Pausing freezes the simulation.

The viewer supports all angles, transparent PNG capture, Telegram PNG stickers and a portable GLB export containing the actual geometry, skeleton, skin weights and expression morph targets.

GLB uses PBR shading and preserves the ribbon rig and its current pose, but does not include the runtime physics solver, VRM expression bindings or V-Studio's animation controller. SVG and TGS exports are unavailable for 3D characters. Keep the source/license information with redistributed derivatives.

`preview.png` is captured from the actual 3D renderer, rather than a concept illustration.
