import * as THREE from 'three';
import { MToonMaterial, type VRM } from '@pixiv/three-vrm';

const TAU = Math.PI * 2;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const path = (points: number[][]) =>
  new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => V(x, y, z)),
    false,
    'centripetal',
  );

/** Closed, lenticular locks have a soft ridge and fine edges rather than cylindrical strands. */
class SculptedLocks {
  private positions: number[] = [];
  private colors: number[] = [];
  private indices: number[] = [];

  add(
    center: (t: number) => THREE.Vector3,
    normal: (t: number) => THREE.Vector3,
    width: (t: number) => number,
    depth: (t: number) => number,
    tone = 1,
    rows = 56,
  ) {
    const columns = 12;
    const offset = this.positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const t = row / rows;
      const p = center(t);
      const tangent = center(Math.min(1, t + 0.001))
        .sub(center(Math.max(0, t - 0.001)))
        .normalize();
      const outward = normal(t);
      outward.addScaledVector(tangent, -outward.dot(tangent)).normalize();
      const across = new THREE.Vector3().crossVectors(tangent, outward).normalize();
      for (let col = 0; col <= columns; col++) {
        const a = (col / columns) * TAU;
        const edge = Math.cos(a);
        const face = Math.sin(a);
        p.clone()
          .addScaledVector(across, edge * Math.max(0.00006, width(t)))
          .addScaledVector(outward, face * Math.max(0.00005, depth(t)) * (1 + Math.cos(edge * 19) * 0.04))
          .toArray(this.positions, this.positions.length);
        const light = tone * (0.92 + Math.max(0, face) * 0.075 + Math.cos(edge * 22 + t) * 0.018);
        this.colors.push(light, light, light);
        if (row < rows && col < columns) {
          const i = offset + row * (columns + 1) + col;
          this.indices.push(i, i + columns + 1, i + 1, i + 1, i + columns + 1, i + columns + 2);
        }
      }
    }
  }

  mesh(material: THREE.Material, name: string) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setIndex(this.indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
  }
}

function softTaper(t: number, power = 0.48) {
  return Math.pow(Math.max(0, Math.sin(Math.PI * t)), power);
}

/** Baked pigment keeps the authored pupil/highlights and survives standard GLB export. */
function recolorMap(material: MToonMaterial, kind: 'iris' | 'brow') {
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
  const dark = new THREE.Color('#082d32');
  const emerald = new THREE.Color('#39bea1');
  const gold = new THREE.Color('#a5e4b4');
  const white = new THREE.Color('white');
  const color = new THREE.Color();
  for (let i = 0; i < pixels.data.length; i += 4) {
    color.setRGB(pixels.data[i] / 255, pixels.data[i + 1] / 255, pixels.data[i + 2] / 255, THREE.SRGBColorSpace);
    const value = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
    if (kind === 'brow') {
      color.set('#956b3f').multiplyScalar(0.72 + value * 0.28);
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
  material.shadeMultiplyTexture = null;
  material.color.set('white');
  material.needsUpdate = true;
}

function sculptedUpdo(vrm: VRM) {
  const head = vrm.humanoid.getRawBoneNode('head');
  if (!head) return;
  vrm.scene.updateMatrixWorld(true);
  const group = new THREE.Group();
  group.name = 'Seraphine_Braided_Knight_Updo';
  // Author in the source bind-pose world coordinates and follow the animated raw head thereafter.
  group.applyMatrix4(head.matrixWorld.clone().invert());
  head.add(group);
  const blonde = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Champagne_Blonde_Sculpted_Hair',
    color: '#d6b773',
    roughness: 0.48,
    metalness: 0,
    sheen: 0.4,
    sheenColor: '#fff2cb',
    sheenRoughness: 0.45,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const satin = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Sapphire_Satin_Hair_Ribbon',
    color: '#142a58',
    roughness: 0.43,
    sheen: 0.65,
    sheenColor: '#809bdf',
    sheenRoughness: 0.5,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: 'Seraphine_Engraved_Hair_Gold',
    color: '#d9b777',
    metalness: 0.73,
    roughness: 0.29,
    vertexColors: true,
  });
  const solidBlonde = blonde.clone();
  solidBlonde.vertexColors = false;
  const solidGold = gold.clone();
  solidGold.vertexColors = false;

  // A complete curved scalp closes the crown and nape; its hairline opens around the face and ears.
  const scalpPosition = (a: number, t: number) => {
    const back = (1 - Math.cos(a)) / 2;
    const bottom = 1.31 + 1.07 * Math.pow(back, 0.64);
    const polar = t * bottom;
    return V(
      Math.sin(a) * Math.sin(polar) * 0.106,
      1.486 + Math.cos(polar) * 0.127,
      -0.027 + Math.cos(a) * Math.sin(polar) * 0.119,
    );
  };
  const scalpPositions: number[] = [],
    scalpColors: number[] = [],
    scalpIndices: number[] = [];
  const meridians = 96,
    parallels = 32;
  for (let y = 0; y <= parallels; y++) {
    for (let x = 0; x <= meridians; x++) {
      const a = (x / meridians) * TAU;
      scalpPosition(a, y / parallels).toArray(scalpPositions, scalpPositions.length);
      const tone = 0.92 + Math.cos(a * 24 + (y / parallels) * 1.5) * 0.025;
      scalpColors.push(tone, tone, tone);
      if (y < parallels && x < meridians) {
        const i = y * (meridians + 1) + x;
        scalpIndices.push(i, i + meridians + 1, i + 1, i + 1, i + meridians + 1, i + meridians + 2);
      }
    }
  }
  const scalp = new THREE.BufferGeometry();
  scalp.setAttribute('position', new THREE.Float32BufferAttribute(scalpPositions, 3));
  scalp.setAttribute('color', new THREE.Float32BufferAttribute(scalpColors, 3));
  scalp.setIndex(scalpIndices);
  scalp.computeVertexNormals();
  const scalpMesh = new THREE.Mesh(scalp, blonde);
  scalpMesh.name = 'Seraphine_Complete_Scalp_and_Nape';
  group.add(scalpMesh);

  const locks = new SculptedLocks();
  const ribbons = new SculptedLocks();
  const edging = new SculptedLocks();
  // Drawn back overlapping panels form readable, continuous hair flow around the whole crown.
  for (let i = 0; i < 22; i++) {
    const a = 0.6 + (i / 21) * (TAU - 1.2);
    const center = (t: number) => {
      const p = scalpPosition(a + Math.sin(Math.PI * t) * (a < Math.PI ? 0.16 : -0.16), 0.12 + t * 0.86);
      return p.add(
        V(p.x, (p.y - 1.486) * 0.55, p.z + 0.027)
          .normalize()
          .multiplyScalar(-0.0008),
      );
    };
    locks.add(
      center,
      (t) => {
        const p = center(t);
        return V(p.x, (p.y - 1.486) * 0.55, p.z + 0.027).normalize();
      },
      (t) => 0.011 * softTaper(t, 0.35),
      (t) => 0.002 * softTaper(t),
      0.99 + (i % 3) * 0.013,
    );
  }

  // An asymmetric fan of sculpted fringe sweeps out from an off-center part, clear of both eyes.
  for (const side of [-1, 1]) {
    const count = side > 0 ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      const sweep = path([
        [-0.018 + side * f * 0.006, 1.59 - f * 0.008, 0.035 + f * 0.006],
        [side * (0.017 + f * 0.025), 1.572 - f * 0.012, 0.078 + f * 0.007],
        [side * (0.033 + f * 0.042), 1.526 - f * 0.011, 0.099 - f * 0.012],
        [side * (0.045 + f * 0.044), 1.481 - f * 0.007 + (side < 0 ? 0.018 : 0), 0.079 - f * 0.027],
      ]);
      locks.add(
        (t) => sweep.getPoint(t),
        () => V(0, 0.12, 1),
        (t) => (side > 0 ? 0.016 : 0.014) * softTaper(t, 0.3) * Math.pow(1 - t, 0.4),
        (t) => 0.0028 * softTaper(t),
        1.005 + f * 0.035,
      );
    }

    // Face-framing pointed locks stop at the jaw, preserving an entirely short silhouette.
    for (let layer = 0; layer < 2; layer++) {
      const temple = path([
        [side * 0.075, 1.552, 0.037],
        [side * (0.096 + layer * 0.003), 1.497, 0.035 - layer * 0.008],
        [side * (0.098 + layer * 0.003), 1.436, 0.016 - layer * 0.005],
        [side * (0.081 + layer * 0.014), 1.407 + layer * 0.018, 0.015 - layer * 0.011],
      ]);
      locks.add(
        (t) => temple.getPoint(t),
        () => V(side * 0.4, 0, 1).normalize(),
        (t) => (0.01 - layer * 0.003) * softTaper(t, 0.55),
        (t) => 0.0035 * softTaper(t),
        1 + layer * 0.035,
      );
    }

    const braid = path([
      [side * 0.066, 1.551, 0.048],
      [side * 0.1, 1.523, -0.011],
      [side * 0.102, 1.484, -0.083],
      [side * 0.065, 1.464, -0.142],
      [side * 0.02, 1.47, -0.163],
    ]);
    // Three continuous flattened strands cross over and under each other, not a string of beads.
    for (let strand = 0; strand < 3; strand++) {
      const phase = (strand / 3) * TAU;
      locks.add(
        (t) => {
          const p = braid.getPoint(t);
          const tangent = braid.getTangent(t);
          const outward = V(p.x, 0, p.z + 0.027).normalize();
          const cross = new THREE.Vector3().crossVectors(tangent, outward).normalize();
          const weave = t * TAU * 6.5 + phase;
          return p
            .addScaledVector(cross, Math.sin(weave) * 0.006 * softTaper(t, 0.2))
            .addScaledVector(outward, Math.cos(weave) * 0.0033);
        },
        (t) => {
          const p = braid.getPoint(t);
          return V(p.x, 0, p.z + 0.027).normalize();
        },
        (t) => 0.0052 * softTaper(t, 0.25),
        (t) => 0.0026 * softTaper(t, 0.3),
        1.03 + strand * 0.016,
        112,
      );
    }

    const loop = path([
      [side * 0.004, 1.477, -0.205],
      [side * 0.045, 1.497, -0.212],
      [side * 0.065, 1.485, -0.216],
      [side * 0.044, 1.464, -0.219],
      [side * 0.006, 1.473, -0.211],
    ]);
    const width = (t: number) => 0.009 * (0.72 + Math.sin(Math.PI * t) * 0.28);
    ribbons.add(
      (t) => loop.getPoint(t),
      () => V(0, 0, -1),
      width,
      () => 0.0008,
    );
    for (const edge of [-1, 1]) {
      edging.add(
        (t) =>
          loop
            .getPoint(t)
            .addScaledVector(
              new THREE.Vector3().crossVectors(loop.getTangent(t), V(0, 0, -1)).normalize(),
              width(t) * edge,
            )
            .add(V(0, 0, -0.0006)),
        () => V(0, 0, -1),
        () => 0.0005,
        () => 0.0004,
        1,
        40,
      );
    }
    const tail = path([
      [side * 0.006, 1.474, -0.214],
      [side * 0.022, 1.451, -0.211],
      [side * 0.028, 1.425, -0.195],
      [side * 0.04, 1.414, -0.185],
    ]);
    ribbons.add(
      (t) => tail.getPoint(t),
      () => V(0, 0, -1),
      (t) => 0.01 * (1 - t * 0.3),
      () => 0.0007,
    );
  }

  // The low coiled chignon has nested curved locks and a solid center from every camera angle.
  const bunCore = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), solidBlonde);
  bunCore.name = 'Seraphine_Low_Coiled_Chignon_Core';
  bunCore.position.set(0, 1.485, -0.159);
  bunCore.scale.set(0.055, 0.049, 0.041);
  group.add(bunCore);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    locks.add(
      (t) => {
        const theta = a + t * Math.PI * 0.78;
        const radius = 0.92 - t * 0.66;
        return V(
          Math.sin(theta) * 0.061 * radius,
          1.485 + Math.cos(theta) * 0.055 * radius,
          -0.172 - Math.sin((t * Math.PI) / 2) * 0.035,
        );
      },
      () => V(0, 0, -1),
      (t) => 0.01 * softTaper(t, 0.24),
      (t) => 0.004 * softTaper(t),
      0.99 + (i % 3) * 0.02,
    );
  }
  group.add(locks.mesh(blonde, 'Seraphine_Swept_Fringe_Woven_Braids_and_Coiled_Locks'));
  group.add(ribbons.mesh(satin, 'Seraphine_Sapphire_Bow_and_Short_Ribbons'));
  group.add(edging.mesh(gold, 'Seraphine_Gold_Ribbon_Embroidery'));
  const knotMaterial = satin.clone();
  knotMaterial.vertexColors = false;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), knotMaterial);
  knot.name = 'Seraphine_Satin_Bow_Knot';
  knot.position.set(0, 1.477, -0.215);
  knot.scale.set(0.012, 0.009, 0.008);
  group.add(knot);

  // A small laurel comb reads as a knightly insignia above the left temple.
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), solidGold);
    leaf.name = `Seraphine_Laurel_Comb_Leaf_${i}`;
    leaf.position.set(-0.078 - i * 0.004, 1.534 - i * 0.0065, 0.05 - i * 0.006);
    leaf.scale.set(0.004, 0.009, 0.0018);
    leaf.rotation.z = 0.65;
    group.add(leaf);
  }
  const setting = new THREE.Mesh(new THREE.OctahedronGeometry(0.008), solidGold);
  setting.name = 'Seraphine_Hair_Ruby_Gold_Setting';
  setting.position.set(-0.087, 1.521, 0.044);
  setting.scale.set(0.75, 1.2, 0.48);
  group.add(setting);
  const ruby = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.006),
    new THREE.MeshStandardMaterial({
      name: 'Seraphine_Hair_Ruby',
      color: '#9d1532',
      roughness: 0.2,
      metalness: 0.34,
    }),
  );
  ruby.name = 'Seraphine_Ruby_Laurel_Comb';
  ruby.position.set(-0.087, 1.521, 0.048);
  ruby.scale.set(0.7, 1.2, 0.45);
  group.add(ruby);
}

/** A separate, exportable identity; the shared source avatar and all facial morphs remain intact. */
export function styleSeraphineAppearance(vrm: VRM): void {
  for (const material of vrm.materials ?? []) {
    if (!(material instanceof MToonMaterial)) continue;
    const name = material.name;
    if (name.includes('HAIR')) {
      material.visible = false;
    } else if (name.includes('SKIN')) {
      material.color.set('#fff5e9');
      material.shadingToonyFactor = 0.54;
      material.shadingShiftFactor = -0.06;
      material.giEqualizationFactor = 0.76;
      material.outlineWidthFactor *= 0.75;
    } else if (name.includes('EyeIris')) {
      recolorMap(material, 'iris');
      material.shadeColorFactor.set('#93c9ba');
      material.shadingToonyFactor = 0.36;
    } else if (name.includes('FaceBrow')) {
      recolorMap(material, 'brow');
      material.shadeColorFactor.set('#886845');
    } else if (name.includes('FaceEyeline')) {
      material.color.set('#554338');
    }
  }
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.every((material) => material.name.includes('HAIR'))) object.visible = false;
    // A restrained brow tilt lends the new face composure while preserving the authored morph deltas.
    if (materials.some((material) => material.name.includes('FaceBrow')) && materials.length === 1) {
      const geometry = object.geometry.clone();
      const positions = geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++) {
        positions.setY(
          i,
          positions.getY(i) + THREE.MathUtils.clamp((Math.abs(positions.getX(i)) - 0.024) * 0.07, -0.0005, 0.0026),
        );
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      object.geometry = geometry;
    }
  });
  sculptedUpdo(vrm);
}
