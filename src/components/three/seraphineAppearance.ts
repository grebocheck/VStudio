import * as THREE from 'three';
import { MToonMaterial, type VRM } from '@pixiv/three-vrm';

import { addSeraphineHair } from './seraphineHair';
import { sculptSeraphineFace } from './seraphineFace';

/** Baked pigment keeps the authored pupil/highlights and survives standard GLB export. */
function recolorMap(material: MToonMaterial, kind: 'iris' | 'brow' | 'liner') {
  const source = material.map;
  const image = source?.image as CanvasImageSource & { width?: number; height?: number };
  if (!source || !image?.width || !image?.height || typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const dark = new THREE.Color('#052d30');
  const emerald = new THREE.Color('#43bda3');
  const gold = new THREE.Color('#bad6a0');
  const white = new THREE.Color('white');
  const liner = new THREE.Color('#583e36');
  const lid = new THREE.Color('#ddb8a7');
  const color = new THREE.Color();
  for (let i = 0; i < pixels.data.length; i += 4) {
    color.setRGB(pixels.data[i] / 255, pixels.data[i + 1] / 255, pixels.data[i + 2] / 255, THREE.SRGBColorSpace);
    const value = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
    if (kind === 'brow') {
      color.set('#8d7054').multiplyScalar(0.8 + value * 0.2);
    } else if (kind === 'liner') {
      color.copy(liner).lerp(lid, THREE.MathUtils.smoothstep(value, 0.015, 0.52));
    } else {
      color.copy(dark).lerp(emerald, THREE.MathUtils.smoothstep(value, 0.025, 0.22));
      color.lerp(gold, THREE.MathUtils.smoothstep(value, 0.2, 0.5) * 0.38);
      color.multiplyScalar(THREE.MathUtils.smoothstep(value, 0.006, 0.035));
      color.lerp(white, THREE.MathUtils.smoothstep(value, 0.6, 0.93));
    }
    color.convertLinearToSRGB();
    pixels.data[i] = Math.round(THREE.MathUtils.clamp(color.r, 0, 1) * 255);
    pixels.data[i + 1] = Math.round(THREE.MathUtils.clamp(color.g, 0, 1) * 255);
    pixels.data[i + 2] = Math.round(THREE.MathUtils.clamp(color.b, 0, 1) * 255);
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `Seraphine_${kind}_pigment`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = source.flipY;
  texture.wrapS = source.wrapS;
  texture.wrapT = source.wrapT;
  texture.offset.copy(source.offset);
  texture.repeat.copy(source.repeat);
  texture.rotation = source.rotation;
  material.map = texture;
  // MToon shades its dark side with a separate texture slot. Preserve pupils and iris rings there too.
  material.shadeMultiplyTexture = texture;
  material.color.set('white');
  material.needsUpdate = true;
}

/** A separate, exportable identity; the shared source avatar and all facial morphs remain intact. */
export function styleSeraphineAppearance(vrm: VRM): void {
  sculptSeraphineFace(vrm);
  for (const material of vrm.materials ?? []) {
    if (!(material instanceof MToonMaterial)) continue;
    const name = material.name;
    if (name.includes('HAIR')) {
      material.visible = false;
    } else if (name.includes('SKIN')) {
      material.color.set('#fff8ef');
      material.shadeColorFactor.set('#edc0b4');
      material.shadingToonyFactor = 0.34;
      material.shadingShiftFactor = -0.09;
      material.giEqualizationFactor = 0.38;
      material.outlineWidthFactor = 0.00022;
      material.outlineColorFactor.set('#a47c78');
      material.outlineLightingMixFactor = 0.35;
    } else if (name.includes('EyeIris')) {
      recolorMap(material, 'iris');
      material.shadeColorFactor.set('#c7e0d8');
      material.shadingToonyFactor = 0.28;
      material.giEqualizationFactor = 0.55;
    } else if (name.includes('FaceBrow')) {
      recolorMap(material, 'brow');
      material.shadeColorFactor.set('#806649');
    } else if (name.includes('FaceEyeline')) {
      recolorMap(material, 'liner');
      material.shadeColorFactor.set('#c9aea0');
    }
  }
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.every((material) => material.name.includes('HAIR'))) object.visible = false;
  });
  addSeraphineHair(vrm);
}
