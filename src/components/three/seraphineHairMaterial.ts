import * as THREE from 'three';

function randomAt(index: number, seed: number) {
  let value = Math.imul(index ^ seed, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

/** Smooth, repeatable noise with no regularly spaced light/dark bands. */
function strandNoise(coordinate: number, cells: number, seed: number) {
  const wrapped = ((coordinate % cells) + cells) % cells;
  const cell = Math.floor(wrapped);
  const fraction = wrapped - cell;
  const blend = fraction * fraction * (3 - 2 * fraction);
  return THREE.MathUtils.lerp(randomAt(cell, seed), randomAt((cell + 1) % cells, seed), blend) * 2 - 1;
}

function createFibreTextures() {
  const width = 256;
  const height = 512;
  const pigment = document.createElement('canvas');
  const normals = document.createElement('canvas');
  pigment.width = normals.width = width;
  pigment.height = normals.height = height;
  const pigmentContext = pigment.getContext('2d')!;
  const normalContext = normals.getContext('2d')!;
  const colorData = pigmentContext.createImageData(width, height);
  const normalData = normalContext.createImageData(width, height);

  // Different scales and irregular spacing suggest individual fibres without
  // carving the large grooves that made the previous material look moulded.
  const fibre = (u: number, v: number) => {
    const drift = strandNoise(v * 4.1, 11, 47) * 0.002;
    const position = u + drift;
    return (
      strandNoise(position * 97, 97, 731) * 0.15 +
      strandNoise(position * 43, 43, 193) * 0.3 +
      strandNoise(position * 17, 17, 659) * 0.45 +
      strandNoise(position * 7 + v * 0.19, 7, 971) * 0.1
    );
  };

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const detail = fibre(u, v);
      const light = Math.round(241 + detail * 15);
      const across = (fibre(u + 1 / width, v) - fibre(u - 1 / width, v)) * 11;
      const along = (fibre(u, v + 1 / height) - fibre(u, v - 1 / height)) * 11;
      const index = (y * width + x) * 4;
      colorData.data.set([light, light, light, 255], index);
      normalData.data.set([Math.round(128 - across), Math.round(128 - along), 255, 255], index);
    }
  }
  pigmentContext.putImageData(colorData, 0, 0);
  normalContext.putImageData(normalData, 0, 0);

  // Canvas-backed textures remain portable through GLTFExporter, including its
  // normal-scale conversion. Native physical properties need no custom shader.
  const map = new THREE.CanvasTexture(pigment);
  map.name = 'Seraphine_Woven_Golden_Hair_Pigment';
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(normals);
  normalMap.name = 'Seraphine_Longitudinal_Hair_Fibres';
  for (const texture of [map, normalMap]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;
  }
  return { map, normalMap };
}

export function createSeraphineHairMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Champagne_Blonde_Sculpted_Hair',
    color: '#a88d65',
    ...createFibreTextures(),
    normalScale: new THREE.Vector2(0.13, 0.1),
    roughness: 0.7,
    metalness: 0,
    ior: 1.45,
    specularIntensity: 0.24,
    anisotropy: 0,
    anisotropyRotation: Math.PI / 2,
    sheen: 0.09,
    sheenColor: '#e4d3af',
    sheenRoughness: 0.86,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
}

/** Feather the open lock sheets while keeping their underlying scalp opaque. */
export function createSeraphineHairCardMaterial(base: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const material = base.clone();
  const source = base.map?.image as HTMLCanvasElement | undefined;
  const canvas = document.createElement('canvas');
  canvas.width = source?.width || 256;
  canvas.height = source?.height || 512;
  const context = canvas.getContext('2d')!;
  if (source) {
    context.drawImage(source, 0, 0);
  } else {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    // CanvasTexture flips image rows on upload: UV v=1 is the top image row.
    const v = 1 - y / (canvas.height - 1);
    for (let x = 0; x < canvas.width; x++) {
      const u = x / (canvas.width - 1);
      const edge = THREE.MathUtils.smoothstep(u, 0, 0.1) * THREE.MathUtils.smoothstep(1 - u, 0, 0.1);
      const looseEnds = strandNoise(u * 13, 13, 277) * 0.065 + strandNoise(u * 37, 37, 593) * 0.015;
      const tipEnd = 0.9 + looseEnds;
      const tipStart = 0.75 + looseEnds * 0.3;
      const tip = 1 - THREE.MathUtils.smoothstep(v, tipStart, tipEnd);
      pixels.data[(y * canvas.width + x) * 4 + 3] = Math.round(edge * tip * 255);
    }
  }
  context.putImageData(pixels, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  if (base.map) {
    // Preserve sampling, orientation and export names without sharing the alpha
    // image with the opaque crown or the chignon support volume.
    map.name = base.map.name;
    map.colorSpace = base.map.colorSpace;
    map.wrapS = base.map.wrapS;
    map.wrapT = base.map.wrapT;
    map.anisotropy = base.map.anisotropy;
    map.flipY = base.map.flipY;
  }
  material.map = map;
  material.alphaTest = 0.12;
  material.alphaToCoverage = false;
  material.transparent = false;
  return material;
}

/** A narrow transition of fine roots lets the fitted hairline meet the skin gradually. */
export function createSeraphineScalpMaterial(base: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const material = base.clone();
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 1024;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#f2f0eb';
  context.fillRect(0, 0, canvas.width, canvas.height);
  // Paint the growth direction directly on the fitted surface. Individual fibres
  // can be fine without introducing stacked polygon edges on the crown silhouette.
  const tau = Math.PI * 2;
  for (let i = 0; i < 1900; i++) {
    const angle = ((i + randomAt(i, 19) * 0.65) / 1900) * tau;
    const polar = 1.31 + 0.82 * Math.pow((1 - Math.cos(angle)) / 2, 0.64);
    const start = new THREE.Vector3(
      Math.sin(angle) * Math.sin(polar),
      Math.cos(polar),
      Math.cos(angle) * Math.sin(polar),
    );
    const end = new THREE.Vector3(Math.sin(angle) * 0.065, 0.075, -1).normalize();
    const turn = new THREE.Quaternion().setFromUnitVectors(start, end);
    context.strokeStyle = i % 3 === 0 ? 'rgba(142,126,99,0.20)' : 'rgba(255,254,245,0.40)';
    context.lineWidth = 0.65 + randomAt(i, 71) * 0.65;
    context.beginPath();
    let previousX = -1;
    for (let j = 0; j <= 56; j++) {
      const t = j / 56;
      const d = start.clone().applyQuaternion(new THREE.Quaternion().slerp(turn, t));
      const a = THREE.MathUtils.euclideanModulo(Math.atan2(d.x, d.z), tau);
      const bottom = 1.31 + 0.82 * Math.pow((1 - Math.cos(a)) / 2, 0.64);
      const x = (a / tau) * canvas.width;
      const y = (1 - Math.acos(THREE.MathUtils.clamp(d.y, -1, 1)) / bottom) * canvas.height;
      if (previousX < 0 || Math.abs(x - previousX) > canvas.width / 2) context.moveTo(x, y);
      else context.lineTo(x, y);
      previousX = x;
    }
    context.stroke();
  }
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    const v = 1 - y / (canvas.height - 1);
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width;
      const irregular = strandNoise(u * 67, 67, 193) * 0.012;
      const alpha = 1 - THREE.MathUtils.smoothstep(v, 0.94 + irregular, 1 + irregular);
      pixels.data[(y * canvas.width + x) * 4 + 3] = Math.round(alpha * 255);
    }
  }
  context.putImageData(pixels, 0, 0);
  // Texture.clone shares its Source; allocate a new one so the fitted root map
  // cannot replace the pigment image on loose locks and the chignon.
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = base.map!.colorSpace;
  map.anisotropy = base.map!.anisotropy;
  map.name = 'Seraphine_Soft_Root_Hairline';
  map.wrapS = THREE.RepeatWrapping;
  material.map = map;
  // Matching shallow fibre relief follows the same swept paths as the pigment.
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = canvas.width;
  normalCanvas.height = canvas.height;
  const normalContext = normalCanvas.getContext('2d')!;
  const normals = normalContext.createImageData(canvas.width, canvas.height);
  const value = (x: number, y: number) =>
    pixels.data[(Math.max(0, Math.min(canvas.height - 1, y)) * canvas.width + ((x + canvas.width) % canvas.width)) * 4];
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      normals.data.set(
        [128 + (value(x - 1, y) - value(x + 1, y)) * 0.6, 128 + (value(x, y + 1) - value(x, y - 1)) * 0.6, 255, 255],
        index,
      );
    }
  normalContext.putImageData(normals, 0, 0);
  material.normalMap = new THREE.CanvasTexture(normalCanvas);
  material.normalMap.name = 'Seraphine_Swept_Root_Fibre_Normals';
  material.normalMap.wrapS = THREE.RepeatWrapping;
  material.name = 'Seraphine_Fitted_Soft_Hairline';
  material.transparent = true;
  material.depthWrite = false;
  return material;
}
