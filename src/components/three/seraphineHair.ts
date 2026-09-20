import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import { createSeraphineScalpSurface } from './seraphineScalp';
import {
  createSeraphineHairMaterial,
  createSeraphineHairCardMaterial,
  createSeraphineScalpMaterial,
} from './seraphineHairMaterial';

const TAU = Math.PI * 2;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const path = (points: number[][]) =>
  new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => V(x, y, z)),
    false,
    'centripetal',
  );

/** Rounded satin volumes and shallow hair sheets share a smooth, curved cross-section. */
class SculptedLocks {
  constructor(
    private readonly sheet = false,
    private readonly columns = 12,
  ) {}
  private positions: number[] = [];
  private colors: number[] = [];
  private uvs: number[] = [];
  private indices: number[] = [];

  add(
    center: (t: number) => THREE.Vector3,
    normal: (t: number) => THREE.Vector3,
    width: (t: number) => number,
    depth: (t: number) => number,
    tone = 1,
    rows = 56,
  ) {
    const columns = this.columns;
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
        const a = (col / columns) * (this.sheet ? Math.PI : TAU);
        const edge = Math.cos(a);
        const face = Math.sin(a);
        p.clone()
          .addScaledVector(across, edge * Math.max(this.sheet ? 0.000001 : 0.00006, width(t)))
          .addScaledVector(outward, face * Math.max(0.000015, depth(t)))
          .toArray(this.positions, this.positions.length);
        // Restrained root shading lets fine fibres carry the detail without outlining every clump.
        const root = THREE.MathUtils.smoothstep(t, 0, 0.3);
        const light = tone * (0.9 + root * 0.075);
        this.colors.push(light, light * (0.98 + root * 0.02), light * (0.96 + root * 0.04));
        this.uvs.push(col / columns, t);
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
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
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

export function addSeraphineHair(vrm: VRM) {
  const head = vrm.humanoid.getRawBoneNode('head');
  if (!head) return;
  vrm.scene.updateMatrixWorld(true);
  const fittedScalp = createSeraphineScalpSurface(vrm);
  const fitToHead = (point: THREE.Vector3, clearance = 0) => {
    const direction = V(point.x / 0.106, (point.y - 1.486) / 0.127, (point.z + 0.027) / 0.119).normalize();
    const fitted = fittedScalp(
      Math.atan2(direction.x, direction.z),
      Math.acos(THREE.MathUtils.clamp(direction.y, -1, 1)),
    );
    return fitted.addScaledVector(V(fitted.x, fitted.y - 1.486, fitted.z + 0.027).normalize(), clearance);
  };
  const rootedCurve = (curve: THREE.CatmullRomCurve3, t: number) => {
    const point = curve.getPoint(t);
    return point.clone().lerp(fitToHead(point, 0.001), 1 - THREE.MathUtils.smoothstep(t, 0.05, 0.48));
  };
  const group = new THREE.Group();
  group.name = 'Seraphine_Braided_Knight_Updo';
  // Author in the source bind-pose world coordinates and follow the animated raw head thereafter.
  group.applyMatrix4(head.matrixWorld.clone().invert());
  head.add(group);
  const blonde = createSeraphineHairMaterial();
  const softLocks = createSeraphineHairCardMaterial(blonde);
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
    const bottom = 1.31 + 0.82 * Math.pow(back, 0.64);
    const hairline = (Math.sin(a * 19) + Math.sin(a * 31) * 0.45) * 0.009;
    const polar = t * bottom + hairline * THREE.MathUtils.smoothstep(t, 0.8, 1);
    return fittedScalp(a, polar);
  };
  const scalpPositions: number[] = [],
    scalpColors: number[] = [],
    scalpUvs: number[] = [],
    scalpIndices: number[] = [];
  const meridians = 96,
    parallels = 32;
  for (let y = 0; y <= parallels; y++) {
    for (let x = 0; x <= meridians; x++) {
      const a = (x / meridians) * TAU;
      scalpPosition(a, y / parallels).toArray(scalpPositions, scalpPositions.length);
      const tone = 0.86 + Math.sin((y / parallels) * Math.PI) * 0.07;
      scalpColors.push(tone, tone * 0.99, tone * 0.97);
      scalpUvs.push(x / meridians, y / parallels);
      if (y < parallels && x < meridians) {
        const i = y * (meridians + 1) + x;
        scalpIndices.push(i, i + meridians + 1, i + 1, i + 1, i + meridians + 1, i + meridians + 2);
      }
    }
  }
  const scalp = new THREE.BufferGeometry();
  scalp.setAttribute('position', new THREE.Float32BufferAttribute(scalpPositions, 3));
  scalp.setAttribute('color', new THREE.Float32BufferAttribute(scalpColors, 3));
  scalp.setAttribute('uv', new THREE.Float32BufferAttribute(scalpUvs, 2));
  scalp.setIndex(scalpIndices);
  scalp.computeVertexNormals();
  const scalpMesh = new THREE.Mesh(scalp, createSeraphineScalpMaterial(blonde));
  scalpMesh.name = 'Seraphine_Complete_Scalp_and_Nape';
  group.add(scalpMesh);

  const locks = new SculptedLocks(true);
  const fibres = new SculptedLocks(true, 2);
  const ribbons = new SculptedLocks();
  const edging = new SculptedLocks();
  // A few relaxed central locks bridge the part and break the rigid triangular forehead opening.
  for (let i = 0; i < 3; i++) {
    const sweep = path([
      [-0.025 - i * 0.004, 1.603 - i * 0.002, 0.025],
      [-0.018 - i * 0.012, 1.56, 0.083 + i * 0.0007],
      [-0.008 - i * 0.016, 1.524 - i * 0.003, 0.099 + i * 0.0007],
      [0.017 - i * 0.025, 1.488 + i * 0.006, 0.083],
    ]);
    locks.add(
      (t) => rootedCurve(sweep, t),
      () => V(0, 0.1, 1),
      (t) => (0.011 - i * 0.0015) * softTaper(t, 0.3) * Math.pow(1 - t, 0.9),
      (t) => 0.001 * softTaper(t),
      0.99 + i * 0.008,
      48,
    );
  }
  // An asymmetric fan of sculpted fringe sweeps out from an off-center part, clear of both eyes.
  for (const side of [-1, 1]) {
    const count = side > 0 ? 9 : 7;
    for (let i = 0; i < count; i++) {
      const f = i / (count - 1);
      const tipOffset = Math.sin(i * 2.37 + side) * 0.009;
      const sweep = path([
        [-0.027 + side * f * 0.008, 1.602 - f * 0.008, 0.017 + f * 0.008],
        [side * (0.01 + f * 0.031), 1.57 - f * 0.012, 0.075 + f * 0.004],
        [side * (0.026 + f * 0.048), 1.53 - f * 0.017, 0.093 - f * 0.012],
        [side * (0.032 + f * 0.052), 1.483 - f * 0.021 + (side < 0 ? 0.025 : 0) + tipOffset, 0.075 - f * 0.025],
      ]);
      locks.add(
        (t) => rootedCurve(sweep, t),
        () => V(0, 0.12, 1),
        (t) => (side > 0 ? 0.014 : 0.012) * softTaper(t, 0.28) * Math.pow(1 - t, 1.1),
        (t) => 0.00075 * softTaper(t),
        0.97 + (i % 3) * 0.014,
      );
      // Fine curved wisps soften the transition from a lock to its loose ends.
      for (let strand = 0; strand < 1; strand++) {
        const offset = Math.sin(i * 2.7) * 0.002;
        const end = 0.96 + (strand % 3) * 0.019;
        fibres.add(
          (t) => {
            const along = 0.34 + t * (end - 0.34);
            const p = rootedCurve(sweep, along);
            p.x += offset * Math.sin(Math.PI * t * 0.7);
            p.y -= Math.pow(t, 4) * (0.002 + (strand % 3) * 0.0015);
            p.z += 0.002 + Math.sin(t * Math.PI) * 0.001;
            return p;
          },
          () => V(0, 0, 1),
          (t) => (0.00032 + (strand % 2) * 0.00005) * softTaper(t, 0.7),
          (t) => 0.0001 * softTaper(t, 0.7),
          0.98 + (strand % 3) * 0.012,
          24,
        );
      }
    }

    // Face-framing pointed locks stop at the jaw, preserving an entirely short silhouette.
    for (let layer = 0; layer < 2; layer++) {
      const temple = path([
        [side * 0.075, 1.552, 0.037],
        [side * (0.096 + layer * 0.003), 1.497, 0.035 - layer * 0.008],
        [side * (0.094 + layer * 0.005), 1.444, 0.032 - layer * 0.009],
        [side * (0.078 + layer * 0.016), 1.414 + layer * 0.014, 0.04 - layer * 0.024],
      ]);
      locks.add(
        (t) => rootedCurve(temple, t),
        () => V(side * 0.4, 0, 1).normalize(),
        (t) => (0.01 - layer * 0.003) * softTaper(t, 0.4) * Math.pow(1 - t, 0.9),
        (t) => 0.00085 * softTaper(t),
        0.99 + layer * 0.01,
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
          const p = fitToHead(braid.getPoint(t), 0.0025);
          const tangent = braid.getTangent(t);
          const outward = V(p.x, 0, p.z + 0.027).normalize();
          const cross = new THREE.Vector3().crossVectors(tangent, outward).normalize();
          const weave = t * TAU * 6.5 + phase;
          return p
            .addScaledVector(cross, Math.sin(weave) * 0.005 * softTaper(t, 0.2))
            .addScaledVector(outward, Math.cos(weave) * 0.0015);
        },
        (t) => {
          const p = braid.getPoint(t);
          return V(p.x, 0, p.z + 0.027).normalize();
        },
        (t) => 0.0046 * softTaper(t, 0.25),
        (t) => 0.0012 * softTaper(t, 0.3),
        0.99 + strand * 0.008,
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
  }

  // The low coiled chignon has nested curved locks and a solid center from every camera angle.
  const bunCore = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), solidBlonde);
  bunCore.name = 'Seraphine_Low_Coiled_Chignon_Core';
  bunCore.position.set(0, 1.485, -0.159);
  bunCore.scale.set(0.055, 0.049, 0.041);
  group.add(bunCore);
  // Wrap the chignon's sides into its rear spiral so the support volume never reads as a bare ball.
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * TAU;
    const center = (t: number) => {
      const polar = 0.25 + t * 1.78;
      const twist = angle + t * 0.58;
      return V(
        Math.sin(twist) * Math.sin(polar) * 0.0555,
        1.485 + Math.cos(twist) * Math.sin(polar) * 0.0495,
        -0.159 + Math.cos(polar) * 0.0415,
      );
    };
    locks.add(
      center,
      (t) =>
        center(t)
          .sub(V(0, 1.485, -0.159))
          .normalize(),
      (t) => 0.009 * softTaper(t, 0.32),
      (t) => 0.00065 * softTaper(t),
      0.98 + (i % 3) * 0.012,
      40,
    );
  }
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
      (t) => 0.0012 * softTaper(t),
      0.99 + (i % 3) * 0.01,
    );
  }
  // Short loose hairs interrupt the hairline and soften its silhouette around the ears and nape.
  for (let i = 0; i < 32; i++) {
    const a = 0.9 + ((i + Math.sin(i * 2.4) * 0.25) / 31) * (TAU - 1.8);
    const start = 0.76 + Math.sin(i * 1.7) * 0.07;
    const end = 0.99 + Math.sin(i * 2.3) * 0.036;
    const center = (t: number) => {
      const p = scalpPosition(a + Math.sin(t * Math.PI * 1.3) * 0.055, start + t * (end - start));
      const outward = V(p.x, (p.y - 1.486) * 0.55, p.z + 0.027).normalize();
      return p.addScaledVector(outward, 0.0015 + Math.sin(t * Math.PI) * 0.0018);
    };
    fibres.add(
      center,
      (t) => {
        const p = center(t);
        return V(p.x, p.y - 1.486, p.z + 0.027).normalize();
      },
      (t) => 0.0004 * softTaper(t, 0.65),
      (t) => 0.0001 * softTaper(t),
      0.96 + (i % 5) * 0.012,
      20,
    );
  }
  group.add(locks.mesh(softLocks, 'Seraphine_Swept_Fringe_Woven_Braids_and_Coiled_Locks'));
  const fineFibres = fibres.mesh(blonde, 'Seraphine_Soft_Loose_Hair_Fibres');
  group.add(fineFibres);
  group.add(ribbons.mesh(satin, 'Seraphine_Sapphire_Bow_Loops'));
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
