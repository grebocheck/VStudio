import * as THREE from 'three';

export const TAU = Math.PI * 2;

/** A UV surface in metre-scale bind space. Periodic edges share their lighting normals. */
export function armorSurface(
  columns: number,
  rows: number,
  sample: (u: number, v: number) => THREE.Vector3,
  reverse = false,
) {
  const points: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      sample(column / columns, row / rows).toArray(points, points.length);
      uv.push(column / columns, row / rows);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column,
          b = a + 1,
          c = a + columns + 1;
        indices.push(...(reverse ? [a, c, b, b, c, c + 1] : [a, b, c, b, c + 1, c]));
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normal = geometry.getAttribute('normal');
  for (let row = 0; row <= rows; row++) {
    const first = row * (columns + 1),
      last = first + columns;
    if (
      new THREE.Vector3().fromArray(points, first * 3).distanceTo(new THREE.Vector3().fromArray(points, last * 3)) >
      1e-7
    )
      continue;
    const average = new THREE.Vector3()
      .fromBufferAttribute(normal, first)
      .add(new THREE.Vector3().fromBufferAttribute(normal, last))
      .normalize();
    normal.setXYZ(first, average.x, average.y, average.z);
    normal.setXYZ(last, average.x, average.y, average.z);
  }
  return geometry;
}

export function armorTube(points: THREE.Vector3[], radius = 0.0012, segments = Math.max(20, points.length * 2)) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 5, false);
}

/** Extruded pointed escutcheons and plate edges have a bevel, rather than paper-thin outlines. */
export function armorPlaque(points: [number, number][], depth = 0.003, bevel = 0.001) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelThickness: bevel,
    bevelSize: bevel,
    curveSegments: 12,
  });
}

export function sunburst(radius: number, rays = 8) {
  const outline = Array.from({ length: rays * 2 }, (_, i): [number, number] => {
    const angle = Math.PI / 2 + (i * Math.PI) / rays;
    const r = i % 2 === 0 ? radius * (i % 4 === 0 ? 1 : 0.74) : radius * 0.3;
    return [Math.cos(angle) * r, Math.sin(angle) * r];
  });
  return armorPlaque(outline, 0.002, 0.00055);
}

/** Dark blue damask with a woven normal field: deterministic and exportable as ordinary PBR textures. */
export function seraphineTextiles() {
  const size = 128;
  const weave = new Uint8Array(size * size * 4);
  const pattern = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const warp = Math.sin((x * Math.PI) / 2),
        weft = Math.cos((y * Math.PI) / 2);
      weave[i] = 128 + Math.round(warp * 19);
      weave[i + 1] = 128 + Math.round(weft * 19);
      weave[i + 2] = 251;
      weave[i + 3] = 255;
      const u = (x / size) * TAU,
        v = (y / size) * TAU;
      const diamond = Math.abs(Math.cos(u) * Math.cos(v));
      const petal = Math.abs(Math.sin(u * 2) * Math.sin(v * 2));
      const value = 218 + Math.round(diamond ** 10 * 20 + petal ** 14 * 9 + warp * weft * 3);
      pattern[i] = pattern[i + 1] = pattern[i + 2] = value;
      pattern[i + 3] = 255;
    }
  }
  const textureFrom = (pixels: Uint8Array): THREE.Texture => {
    // The GLB exporter rescales normal maps through drawImage; its browser path needs a canvas source.
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      if (context) {
        const image = context.createImageData(size, size);
        image.data.set(pixels);
        context.putImageData(image, 0, 0);
        return new THREE.CanvasTexture(canvas);
      }
    }
    return new THREE.DataTexture(pixels, size, size);
  };
  const normal = textureFrom(weave);
  const map = textureFrom(pattern);
  for (const texture of [normal, map]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }
  normal.repeat.set(7, 9);
  map.repeat.set(6, 7);
  map.colorSpace = THREE.SRGBColorSpace;
  return { normal, map };
}
