import * as THREE from 'three';
import { MToonMaterial, type VRM } from '@pixiv/three-vrm';

const TAU = Math.PI * 2;
type Influence = { index: number; weight: number };
type HairChain = { index: number; position: THREE.Vector3 }[];

interface LockOptions {
  center: (t: number) => THREE.Vector3;
  normal: (t: number) => THREE.Vector3;
  width: (t: number) => number;
  depth: (t: number) => number;
  weights: (point: THREE.Vector3) => Influence[];
  rows?: number;
  columns?: number;
  strandDetail?: boolean;
  tone?: number;
}

/** Lenticular cross-sections give each lock a broad face, a rounded ridge and a fine edge. */
class HairGeometry {
  private positions: number[] = [];
  private colors: number[] = [];
  private uvs: number[] = [];
  private indices: number[] = [];
  private skinIndices: number[] = [];
  private skinWeights: number[] = [];

  lock(options: LockOptions) {
    const rows = options.rows ?? 64;
    const columns = options.columns ?? 12;
    const offset = this.positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const t = row / rows;
      const center = options.center(t);
      const tangent = options
        .center(Math.min(1, t + 0.001))
        .sub(options.center(Math.max(0, t - 0.001)))
        .normalize();
      const normal = options.normal(t);
      normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
      const across = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      const width = Math.max(0.00012, options.width(t));
      const depth = Math.max(0.0001, options.depth(t));
      const weights = options.weights(center);
      for (let column = 0; column <= columns; column++) {
        const angle = (column / columns) * TAU;
        const face = Math.sin(angle);
        const edge = Math.cos(angle);
        const grooves = options.strandDetail ? 1 + Math.cos(edge * 15 + t * 1.5) * 0.075 : 1;
        center
          .clone()
          .addScaledVector(across, edge * width)
          .addScaledVector(normal, face * depth * grooves)
          .toArray(this.positions, this.positions.length);
        const strandLight = options.strandDetail ? Math.cos(edge * 29 + t * 2) * 0.025 : 0;
        const pigment = (options.tone ?? 1) * (0.93 + Math.max(0, face) * 0.075 + strandLight);
        this.colors.push(pigment, pigment, pigment);
        this.uvs.push(column / columns, t);
        for (let i = 0; i < 4; i++) {
          this.skinIndices.push(weights[i]?.index ?? 0);
          this.skinWeights.push(weights[i]?.weight ?? 0);
        }
        if (row < rows && column < columns) {
          const a = offset + row * (columns + 1) + column;
          const b = a + 1;
          const c = a + columns + 1;
          this.indices.push(a, c, b, b, c, c + 1);
        }
      }
    }
  }

  geometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.skinWeights, 4));
    geometry.setIndex(this.indices);
    geometry.computeVertexNormals();
    return geometry;
  }
}

function chainWeights(point: THREE.Vector3, chain: HairChain, head: number): Influence[] {
  if (!chain.length) return [{ index: head, weight: 1 }];
  if (point.y >= chain[0].position.y) {
    const headWeight = THREE.MathUtils.smoothstep(point.y, chain[0].position.y, chain[0].position.y + 0.075);
    return [
      { index: head, weight: headWeight },
      { index: chain[0].index, weight: 1 - headWeight },
    ];
  }
  for (let i = 0; i < chain.length - 1; i++) {
    const a = chain[i];
    const b = chain[i + 1];
    if (point.y < b.position.y) continue;
    const t = THREE.MathUtils.smoothstep(point.y, b.position.y, a.position.y);
    return [
      { index: a.index, weight: t },
      { index: b.index, weight: 1 - t },
    ];
  }
  return [{ index: chain[chain.length - 1].index, weight: 1 }];
}

function curve(points: number[][]) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
  );
}

/** A half-up princess style, sharing the source's existing spring chains and humanoid bind pose. */
export function addAureliaHair(vrm: VRM): void {
  const head = vrm.humanoid.getRawBoneNode('head');
  if (!head) return;
  const sources: THREE.SkinnedMesh[] = [];
  let pigment: MToonMaterial | undefined;
  vrm.scene.updateMatrixWorld(true);
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const hair = materials.find(
      (material) => material instanceof MToonMaterial && material.name.includes('HAIR') && !material.isOutline,
    );
    if (!(hair instanceof MToonMaterial)) return;
    sources.push(object);
    if (!pigment || hair.name === 'Hair_00_HAIR') pigment = hair;
  });
  const source = sources.find((mesh) => mesh.skeleton.bones.some((bone) => bone.name === 'J_Sec_Hair1_07'));
  if (!source || !pigment) return;
  const skeleton = source.skeleton;
  const headIndex = skeleton.bones.findIndex((bone) => bone === head);
  if (headIndex < 0) return;
  const headWeights = () => [{ index: headIndex, weight: 1 }];
  const chain = (suffix: string): HairChain =>
    skeleton.bones
      .map((bone, index) => ({ bone, index }))
      .filter(({ bone }) => new RegExp(`^J_Sec_Hair\\d+_${suffix}(?:_end)?$`).test(bone.name))
      .map(({ bone, index }) => ({ index, position: bone.getWorldPosition(new THREE.Vector3()) }))
      .sort((a, b) => b.position.y - a.position.y);
  const surfacePoint = (angle: number, y: number) => {
    const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const center = new THREE.Vector3(0, y, -0.03);
    const ray = new THREE.Raycaster(
      center.clone().addScaledVector(direction, 0.24),
      direction.clone().negate(),
      0,
      0.24,
    );
    const hit = ray.intersectObjects(sources, false)[0];
    return (hit?.point ?? center.addScaledVector(direction, 0.098)).addScaledVector(direction, 0.003);
  };
  const hair = new HairGeometry();
  const ribbon = new HairGeometry();
  const embroidery = new HairGeometry();

  for (const side of [-1, 1]) {
    // The two braids sweep behind the ears and meet at the half-up clasp, below the tiara.
    const samples = Array.from({ length: 41 }, (_, i) => {
      const t = i / 40;
      return surfacePoint(side * THREE.MathUtils.lerp(0.45, Math.PI - 0.12, t), 1.547 - 0.078 * t);
    });
    const braid = new THREE.CatmullRomCurve3(samples, false, 'centripetal');
    for (let strand = 0; strand < 3; strand++) {
      const phase = (strand / 3) * TAU;
      hair.lock({
        center(t) {
          const point = braid.getPoint(t);
          const outward = new THREE.Vector3(point.x, 0, point.z + 0.03).normalize();
          const envelope = Math.pow(Math.sin(Math.PI * t), 0.35);
          const weave = t * TAU * 7 + phase;
          point.y += Math.sin(weave) * 0.0068 * envelope;
          return point.addScaledVector(outward, Math.cos(weave * 2) * 0.0023 * envelope + 0.0028);
        },
        normal(t) {
          const p = braid.getPoint(t);
          return new THREE.Vector3(p.x, 0, p.z + 0.03).normalize();
        },
        width: (t) => 0.0044 * Math.pow(Math.sin(Math.PI * t), 0.3),
        depth: (t) => 0.0029 * Math.pow(Math.sin(Math.PI * t), 0.3),
        weights: headWeights,
        rows: 112,
        columns: 8,
        strandDetail: true,
        tone: 1.025 + strand * 0.016,
      });
    }

    const frontChain = chain(side < 0 ? '11' : '12');
    // A wide soft curl establishes the silhouette; a finer overlapping lock gives it separation.
    for (let layer = 0; layer < 2; layer++) {
      const path = curve([
        [side * (0.082 + layer * 0.005), 1.505, 0.045],
        [side * (0.109 + layer * 0.005), 1.441, 0.036],
        [side * (0.121 + layer * 0.009), 1.368, 0.042],
        [side * (0.137 + layer * 0.008), 1.297, 0.064],
        [side * (0.143 + layer * 0.011), 1.229 + layer * 0.016, 0.085],
        [side * (0.122 + layer * 0.008), 1.16 + layer * 0.027, 0.113],
      ]);
      hair.lock({
        center: (t) => path.getPoint(t),
        normal: () => new THREE.Vector3(side * 0.25, 0, 1).normalize(),
        width: (t) => (layer ? 0.008 : 0.013) * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.76)), 0.6),
        depth: (t) => (layer ? 0.0032 : 0.0048) * Math.pow(Math.sin(Math.PI * t), 0.55),
        weights: (point) => chainWeights(point, frontChain, headIndex),
        rows: 64,
        strandDetail: true,
        tone: layer ? 1.05 : 0.98,
      });
    }

    // Broad, staggered waterfall locks add depth to the existing long hair without replacing its rig.
    for (let layer = 0; layer < 2; layer++) {
      const rearChain = chain(side < 0 ? (layer ? '09' : '08') : layer ? '05' : '06');
      const path = curve([
        [side * (0.014 + layer * 0.025), 1.479, -0.154],
        [side * (0.042 + layer * 0.033), 1.393, -0.166],
        [side * (0.069 + layer * 0.038), 1.311, -0.179],
        [side * (0.071 + layer * 0.047), 1.225, -0.193 + layer * 0.018],
        [side * (0.044 + layer * 0.066), 1.142, -0.197 + layer * 0.025],
        [side * (0.047 + layer * 0.045), 1.075 + layer * 0.015, -0.164],
      ]);
      hair.lock({
        center: (t) => path.getPoint(t),
        normal: () => new THREE.Vector3(side * 0.25, 0, -1).normalize(),
        width: (t) => (layer ? 0.017 : 0.022) * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.75)), 0.5),
        depth: (t) => 0.0055 * Math.pow(Math.sin(Math.PI * t), 0.5),
        weights: (point) => chainWeights(point, rearChain, headIndex),
        rows: 72,
        strandDetail: true,
        tone: layer ? 1.01 : 1.07,
      });
    }

    const loop = curve([
      [side * 0.004, 1.473, -0.17],
      [side * 0.039, 1.494, -0.177],
      [side * 0.057, 1.488, -0.18],
      [side * 0.043, 1.463, -0.186],
      [side * 0.006, 1.467, -0.179],
    ]);
    const ribbonWidth = (t: number) => 0.0095 * (0.55 + Math.sin(Math.PI * t) * 0.45);
    ribbon.lock({
      center: (t) => loop.getPoint(t),
      normal: () => new THREE.Vector3(0, 0, -1),
      width: ribbonWidth,
      depth: () => 0.00065,
      weights: headWeights,
      rows: 40,
      columns: 8,
    });
    for (const edge of [-1, 1]) {
      embroidery.lock({
        center(t) {
          const tangent = loop.getTangent(t);
          const across = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, -1)).normalize();
          return loop
            .getPoint(t)
            .addScaledVector(across, ribbonWidth(t) * edge)
            .add(new THREE.Vector3(0, 0, -0.0003));
        },
        normal: () => new THREE.Vector3(0, 0, -1),
        width: () => 0.00055,
        depth: () => 0.0004,
        weights: headWeights,
        rows: 40,
        columns: 6,
      });
    }
    const backChain = chain(side < 0 ? '08' : '06');
    const tail = curve([
      [side * 0.009, 1.469, -0.179],
      [side * 0.017, 1.412, -0.184],
      [side * 0.029, 1.351, -0.191],
      [side * 0.038, 1.287, -0.191],
    ]);
    ribbon.lock({
      center: (t) => tail.getPoint(t),
      normal: () => new THREE.Vector3(0, 0, -1),
      width: (t) => 0.008 * (1 - t * 0.23),
      depth: () => 0.00065,
      weights: (point) => chainWeights(point, backChain, headIndex),
      rows: 40,
      columns: 8,
    });
  }

  const hairMaterial = pigment.clone();
  hairMaterial.name = 'Aurelia_Princess_Sculpted_Hair';
  hairMaterial.map = null;
  hairMaterial.normalMap = null;
  hairMaterial.shadeMultiplyTexture = null;
  hairMaterial.color.set('#c7bddf');
  hairMaterial.shadeColorFactor.set('#8e80aa');
  hairMaterial.shadingToonyFactor = 0.48;
  hairMaterial.shadingShiftFactor = -0.08;
  hairMaterial.vertexColors = true;
  hairMaterial.outlineWidthFactor = 0;
  hairMaterial.isOutline = false;
  hairMaterial.side = THREE.DoubleSide;
  const satin = new THREE.MeshPhysicalMaterial({
    name: 'Aurelia_Princess_Hair_Ribbon_Satin',
    color: '#716993',
    roughness: 0.52,
    metalness: 0,
    sheen: 0.64,
    sheenColor: '#eadcf9',
    sheenRoughness: 0.55,
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: 'Aurelia_Princess_Hair_Ribbon_Embroidery',
    color: '#d6b466',
    roughness: 0.37,
    metalness: 0.65,
  });
  const bind = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.name = name;
    mesh.frustumCulled = false;
    mesh.userData.aureliaLayer = 'hair';
    vrm.scene.add(mesh);
    mesh.bind(skeleton, new THREE.Matrix4());
  };
  bind(hair.geometry(), hairMaterial, 'Aurelia_Princess_Braids_and_Layered_Locks');
  bind(ribbon.geometry(), satin, 'Aurelia_Princess_Half_Up_Bow_and_Ribbons');
  bind(embroidery.geometry(), gold, 'Aurelia_Princess_Ribbon_Edging');
  const clasp = new THREE.OctahedronGeometry(0.008, 1);
  clasp.scale(0.8, 1.2, 0.55);
  clasp.translate(0, 1.472, -0.187);
  const count = clasp.getAttribute('position').count;
  clasp.setAttribute(
    'skinIndex',
    new THREE.Uint16BufferAttribute(
      Array.from({ length: count * 4 }, (_, i) => (i % 4 === 0 ? headIndex : 0)),
      4,
    ),
  );
  clasp.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute(
      Array.from({ length: count * 4 }, (_, i) => (i % 4 === 0 ? 1 : 0)),
      4,
    ),
  );
  bind(
    clasp,
    new THREE.MeshStandardMaterial({
      name: 'Aurelia_Princess_Hair_Clasp_Pearl',
      color: '#f4eaff',
      roughness: 0.26,
      metalness: 0.12,
    }),
    'Aurelia_Princess_Pearl_Clasp',
  );
}
