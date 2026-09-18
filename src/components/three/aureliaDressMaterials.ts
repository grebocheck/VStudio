import * as THREE from 'three';

type Fabric = 'bodice' | 'skirt' | 'petals';
type DrawPath = (context: CanvasRenderingContext2D) => void;
const SIZE = 1024;

function canvas(size = SIZE) {
  if (typeof document === 'undefined') return null;
  const element = document.createElement('canvas');
  element.width = element.height = size;
  const context = element.getContext('2d');
  return context ? { element, context } : null;
}

function texture(element: HTMLCanvasElement, color = false) {
  const result = new THREE.CanvasTexture(element);
  result.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  result.wrapS = THREE.RepeatWrapping;
  result.anisotropy = 4;
  return result;
}

/** Thread colour, raised stitching and metallic thread share one authored pattern. */
function embroideredFabric(kind: Fabric) {
  const color = canvas(),
    relief = canvas(),
    metal = canvas();
  if (!color || !relief || !metal) return {};
  const context = color.context;
  for (let x = 0; x < SIZE; x++) {
    const phi = (x / SIZE) * Math.PI * 2;
    const ivory = new THREE.Color(kind === 'petals' ? '#9690bd' : '#eee3cf');
    const accent = new THREE.Color(kind === 'bodice' ? '#7d7bab' : kind === 'petals' ? '#8076af' : '#b7b2d6');
    const blend =
      kind === 'bodice'
        ? 1 - THREE.MathUtils.smoothstep(Math.abs(Math.cos(phi)), 0.32, 0.78)
        : kind === 'petals'
          ? 0.22 + 0.16 * Math.cos(phi * 6)
          : 0.17 + 0.12 * Math.cos(phi * 6);
    context.fillStyle = `#${ivory.lerp(accent, blend).getHexString()}`;
    context.fillRect(x, 0, 1, SIZE);
  }
  // Fine warp and weft are quiet at a distance and remain visible in close portraits.
  for (let i = 0; i < SIZE; i += 3) {
    context.fillStyle = 'rgba(255,255,255,0.055)';
    context.fillRect(i, 0, 1, SIZE);
    context.fillStyle = 'rgba(74,57,104,0.025)';
    context.fillRect(0, i, SIZE, 1);
  }
  relief.context.fillStyle = '#777777';
  relief.context.fillRect(0, 0, SIZE, SIZE);
  metal.context.fillStyle = '#000000';
  metal.context.fillRect(0, 0, SIZE, SIZE);
  const contexts = [color.context, relief.context, metal.context];
  contexts.forEach((ctx) => {
    ctx.translate(0, SIZE);
    ctx.scale(SIZE, -SIZE);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  });
  const embroider = (path: DrawPath, width = 0.0019, tint = '#99723e') => {
    contexts.forEach((ctx, i) => {
      ctx.beginPath();
      path(ctx);
      ctx.lineWidth = width;
      ctx.strokeStyle = i === 0 ? tint : i === 1 ? '#eeeeee' : '#dddddd';
      ctx.stroke();
    });
  };
  const dot = (u: number, v: number, radius = 0.0016) => {
    contexts.forEach((ctx, i) => {
      ctx.beginPath();
      ctx.arc(u, v, radius, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#ead6ab' : '#eeeeee';
      ctx.fill();
    });
  };
  const flower = (u: number, v: number, radius: number) => {
    for (let petal = 0; petal < 6; petal++) {
      const angle = (petal * Math.PI) / 3,
        x = Math.cos(angle),
        y = Math.sin(angle);
      embroider((ctx) => {
        ctx.moveTo(u, v);
        ctx.bezierCurveTo(
          u + (x - y * 0.55) * radius,
          v + (y + x * 0.55) * radius,
          u + (x + y * 0.55) * radius,
          v + (y - x * 0.55) * radius,
          u,
          v,
        );
      }, 0.00125);
    }
    dot(u, v, 0.0025);
  };
  const vine = (u: number, start: number, height: number, width: number) => {
    const stem = (t: number) => u + Math.sin(t * Math.PI * 2) * width * 0.22;
    embroider((ctx) => {
      ctx.moveTo(stem(0), start);
      for (let step = 1; step <= 30; step++) {
        const t = step / 30;
        ctx.lineTo(stem(t), start + t * height);
      }
    });
    for (let leaf = 1; leaf <= 5; leaf++) {
      const t = leaf / 7,
        x = stem(t),
        y = start + t * height;
      for (const side of [-1, 1]) {
        embroider((ctx) => {
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + side * width * 0.9, y, x + side * width, y + height * 0.14, x, y + height * 0.055);
          ctx.bezierCurveTo(
            x + side * width * 0.48,
            y + height * 0.035,
            x + side * width * 0.7,
            y + height * 0.065,
            x,
            y,
          );
        }, 0.0011);
      }
    }
    flower(stem(0.94), start + height * 0.94, width * 0.7);
  };
  const border = (v: number, scallops: number, depth: number) => {
    embroider((ctx) => {
      ctx.moveTo(0, v);
      for (let step = 1; step <= 256; step++) {
        const u = step / 256;
        ctx.lineTo(u, v + (1 - Math.cos(u * Math.PI * 2 * scallops)) * depth);
      }
    }, 0.0021);
    for (let i = 0; i < scallops * 4; i++) dot(i / (scallops * 4), v - 0.013);
  };
  if (kind === 'bodice') {
    border(0.1, 16, 0.009);
    border(0.91, 20, 0.012);
    for (const u of [0, 0.5, 1]) vine(u, 0.19, 0.63, 0.049);
    for (const u of [0.14, 0.36, 0.64, 0.86]) vine(u, 0.23, 0.49, 0.018);
    for (const u of [0.19, 0.31, 0.69, 0.81]) {
      embroider((ctx) => {
        ctx.moveTo(u, 0.12);
        ctx.lineTo(u, 0.9);
      }, 0.0026);
      for (let i = 0; i < 22; i++) dot(u + 0.006, 0.14 + i * 0.034, 0.0012);
    }
  } else {
    border(0.08, 24, 0.008);
    border(0.87, 24, 0.015);
    border(0.95, 24, 0.009);
    for (let panel = 0; panel <= 6; panel++) {
      const u = panel / 6;
      vine(u, kind === 'petals' ? 0.17 : 0.45, kind === 'petals' ? 0.57 : 0.33, 0.028);
      for (let i = 1; i < 9; i++) {
        const v = 0.13 + i * 0.076;
        dot(u + 0.067 + 0.008 * Math.sin(v * Math.PI), v);
        dot(u - 0.067 - 0.008 * Math.sin(v * Math.PI), v);
      }
    }
    for (let i = 0; i < 24; i++) flower((i + 0.5) / 24, 0.825, 0.011);
  }
  return {
    map: texture(color.element, true),
    bumpMap: texture(relief.element),
    metalnessMap: texture(metal.element),
  };
}

function laceMap() {
  const result = canvas(128);
  if (!result) return null;
  const ctx = result.context;
  ctx.strokeStyle = '#f4edde';
  ctx.fillStyle = '#f4edde';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const y of [5, 119]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  for (const x of [0, 64, 128]) {
    ctx.beginPath();
    ctx.moveTo(x, 7);
    ctx.bezierCurveTo(x - 48, 39, x - 36, 97, x, 119);
    ctx.bezierCurveTo(x + 36, 97, x + 48, 39, x, 7);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 11, 62 + Math.sin(a) * 11, 9, 5, a, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, 62, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const map = texture(result.element, true);
  map.repeat.set(18, 1);
  return map;
}

export function createAureliaDressMaterials() {
  const fabric = (kind: Fabric) =>
    new THREE.MeshPhysicalMaterial({
      name: `Aurelia_princess_${kind}_embroidery`,
      color: 'white',
      ...embroideredFabric(kind),
      roughness: 0.59,
      metalness: 0.62,
      bumpScale: 0.00065,
      sheen: 0.58,
      sheenColor: '#ddd3ef',
      sheenRoughness: 0.7,
      side: THREE.DoubleSide,
    });
  return {
    bodice: fabric('bodice'),
    skirt: fabric('skirt'),
    petals: fabric('petals'),
    satin: new THREE.MeshPhysicalMaterial({
      name: 'Aurelia_pearl_satin',
      color: '#e8dfcf',
      roughness: 0.62,
      sheen: 0.65,
      side: THREE.DoubleSide,
    }),
    velvet: new THREE.MeshPhysicalMaterial({
      name: 'Aurelia_periwinkle_velvet',
      color: '#6e709e',
      roughness: 0.74,
      sheen: 0.6,
      sheenColor: '#c7bcdc',
      side: THREE.DoubleSide,
    }),
    lace: new THREE.MeshStandardMaterial({
      name: 'Aurelia_openwork_ivory_lace',
      color: '#eee7da',
      map: laceMap(),
      alphaTest: 0.4,
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    gold: new THREE.MeshStandardMaterial({
      name: 'Aurelia_champagne_gold_binding',
      color: '#c9ae77',
      metalness: 0.73,
      roughness: 0.36,
    }),
  };
}
