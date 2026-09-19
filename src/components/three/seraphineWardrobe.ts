import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { addAureliaBody } from './aureliaBody';
import { bindAureliaGeometry, getAureliaSkeleton } from './aureliaSkinning';
import { bodySurface } from './aureliaGarmentShape';
import { armorPlaque, armorSurface, armorTube, seraphineTextiles, sunburst, TAU } from './seraphineArmorGeometry';

type Binding = VRMHumanBoneName | 'torso' | 'cloth';
type Sample = (u: number, v: number) => THREE.Vector3;
interface Batch {
  pieces: THREE.BufferGeometry[];
  material: THREE.Material;
  binding: Binding;
  name: string;
}

/** Seraphine's original ceremonial field armour, made in the Aurelia foundation's rest pose. */
export function addSeraphineWardrobe(vrm: VRM): { update(delta: number, breath: number): void } {
  const sourceMeshes: THREE.SkinnedMesh[] = [];
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => /Tops|Bottoms|Shoes/.test(material.name))) object.visible = false;
    if (materials.some((material) => material.name === 'Body_00_SKIN')) sourceMeshes.push(object);
  });
  const body = addAureliaBody(vrm);
  if (body) {
    body.torso.name = 'Seraphine_Continuous_Torso';
    body.shorts.name = 'Seraphine_Fitted_Underlayer';
  }
  vrm.scene.updateMatrixWorld(true);
  const skeleton = getAureliaSkeleton(vrm);
  const { normal, map } = seraphineTextiles();
  const silver = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Moonsteel',
    color: '#b9cedb',
    metalness: 0.82,
    roughness: 0.27,
    clearcoat: 0.48,
    clearcoatRoughness: 0.22,
    side: THREE.DoubleSide,
  });
  const bright = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Polished_Plate_Edges',
    color: '#ecf0ea',
    metalness: 0.87,
    roughness: 0.2,
    clearcoat: 0.5,
    side: THREE.DoubleSide,
  });
  const shadowSteel = new THREE.MeshStandardMaterial({
    name: 'Seraphine_Blued_Steel',
    color: '#34495f',
    metalness: 0.72,
    roughness: 0.36,
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: 'Seraphine_Champagne_Inlay',
    color: '#d4b574',
    metalness: 0.83,
    roughness: 0.28,
    side: THREE.DoubleSide,
  });
  const blue = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Royal_Damask',
    color: '#173654',
    map,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.2, 0.2),
    roughness: 0.77,
    sheen: 0.48,
    sheenColor: '#547ba7',
    sheenRoughness: 0.54,
    side: THREE.DoubleSide,
  });
  const ivory = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Ivory_Silk_Lining',
    color: '#e6dfcc',
    normalMap: normal,
    normalScale: new THREE.Vector2(0.13, 0.13),
    roughness: 0.65,
    sheen: 0.48,
    sheenColor: '#fff3d9',
    side: THREE.DoubleSide,
  });
  const dark = new THREE.MeshStandardMaterial({
    name: 'Seraphine_Midnight_Underarmour',
    color: '#131e32',
    normalMap: normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const ruby = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Garnet',
    color: '#9d1838',
    emissive: '#340714',
    emissiveIntensity: 0.14,
    metalness: 0.38,
    roughness: 0.19,
    clearcoat: 0.8,
  });
  const batches = new Map<string, Batch>();
  const cloth: { geometry: THREE.BufferGeometry; rest: Float32Array }[] = [];
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, binding: Binding, name: string) => {
    geometry.name = `Seraphine_${name}`;
    // All geometry is normalized before merging; there is one draw call per material and articulated bone.
    if (!geometry.index) {
      const count = geometry.getAttribute('position').count;
      geometry.setIndex(Array.from({ length: count }, (_, i) => i));
    }
    if (!geometry.hasAttribute('uv'))
      geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 2), 2),
      );
    for (const key of Object.keys(geometry.attributes))
      if (key !== 'position' && key !== 'normal' && key !== 'uv') geometry.deleteAttribute(key);
    const key = `${binding}:${material.name}`;
    if (!batches.has(key))
      batches.set(key, {
        pieces: [],
        material,
        binding,
        name: `Seraphine_${binding}_${material.name.replace('Seraphine_', '')}`,
      });
    batches.get(key)!.pieces.push(geometry);
  };
  const line = (points: THREE.Vector3[], material: THREE.Material, binding: Binding, name: string, radius = 0.0012) =>
    add(armorTube(points, radius), material, binding, name);
  const sampleLine = (
    sample: (t: number) => THREE.Vector3,
    material: THREE.Material,
    binding: Binding,
    name: string,
    radius = 0.0012,
    count = 40,
  ) =>
    line(
      Array.from({ length: count + 1 }, (_, i) => sample(i / count)),
      material,
      binding,
      name,
      radius,
    );
  const rivet = (point: THREE.Vector3, binding: Binding, size = 0.0022) => {
    const geometry = new THREE.SphereGeometry(size, 8, 5);
    geometry.translate(point.x, point.y, point.z);
    add(geometry, gold, binding, 'Flush_Rivet');
  };
  const jewel = (point: THREE.Vector3, binding: Binding, radius: number, ratio = 1.4) => {
    const bezel = new THREE.OctahedronGeometry(radius * 1.14, 0);
    bezel.scale(1, ratio, 0.4);
    bezel.translate(point.x, point.y, point.z);
    add(bezel, gold, binding, 'Gem_Bezel');
    const stone = new THREE.OctahedronGeometry(radius, 0);
    stone.scale(1, ratio, 0.46);
    stone.translate(point.x, point.y, point.z + radius * 0.21);
    add(stone, ruby, binding, 'Faceted_Garnet');
  };

  // A source-skinned cloth underlayer follows fingers, knees and elbows exactly. The source body remains complete.
  const underlayer = (source: THREE.SkinnedMesh, include: (p: THREE.Vector3) => boolean, name: string) => {
    const geometry = source.geometry.clone();
    const position = geometry.getAttribute('position'),
      normals = geometry.getAttribute('normal');
    const index = geometry.getIndex();
    const world = Array.from({ length: position.count }, (_, i) =>
      new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(source.matrixWorld),
    );
    const visible: number[] = [];
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const triangle = [0, 1, 2].map((n) => (index ? index.getX(i + n) : i + n));
      if (triangle.every((v) => include(world[v]))) visible.push(...triangle);
    }
    for (let i = 0; i < position.count; i++) {
      const p = new THREE.Vector3()
        .fromBufferAttribute(position, i)
        .addScaledVector(new THREE.Vector3().fromBufferAttribute(normals, i), 0.0018);
      position.setXYZ(i, p.x, p.y, p.z);
    }
    geometry.setIndex(visible);
    geometry.clearGroups();
    const mesh = new THREE.SkinnedMesh(geometry, dark);
    mesh.name = `Seraphine_${name}`;
    mesh.position.copy(source.position);
    mesh.quaternion.copy(source.quaternion);
    mesh.scale.copy(source.scale);
    mesh.frustumCulled = false;
    source.parent!.add(mesh);
    mesh.bind(source.skeleton, source.bindMatrix);
  };
  // The second source mesh can be an MToon outline pass, which does not need a duplicate underlayer.
  if (sourceMeshes[0]) underlayer(sourceMeshes[0], (p) => p.y < 1.31, 'Fitted_Arming_Suit');
  if (body) underlayer(body.torso, (p) => p.y < 1.315, 'Quilted_Gorget_Underlayer');

  const lerp = THREE.MathUtils.lerp;
  const profile = (t: number, values: number[]) => {
    const segment = Math.min(values.length - 2, Math.floor(t * (values.length - 1)));
    const f = THREE.MathUtils.smoothstep(t * (values.length - 1) - segment, 0, 1);
    return lerp(values[segment], values[segment + 1], f);
  };
  const cuirass: Sample = (u, v) => {
    const phi = u * TAU,
      s = Math.sin(phi),
      c = Math.cos(phi);
    const lower = 1.052 - 0.027 * Math.max(0, c) ** 8;
    const upper = 1.276 - 0.043 * Math.abs(s) ** 8 + 0.009 * Math.max(0, -c);
    const y = lerp(lower, upper, v);
    const width = profile(v, [0.108, 0.115, 0.14, 0.145, 0.139]);
    const front = profile(v, [0.137, 0.162, 0.176, 0.15, 0.105]);
    const rear = profile(v, [0.069, 0.081, 0.091, 0.087, 0.074]);
    // A continuous, shallow central keel is characteristic of a forged breastplate.
    const ridge = Math.max(0, 1 - Math.abs(s) / 0.26) ** 2 * Math.max(0, c) * Math.sin(v * Math.PI) * 0.013;
    return new THREE.Vector3(s * width, y, 0.008 + c * (c >= 0 ? front : rear) + ridge);
  };
  add(armorSurface(112, 42, cuirass), silver, 'torso', 'Forged_Closed_Cuirass');
  for (const v of [0, 1]) {
    sampleLine((u) => cuirass(u, v), gold, 'torso', `Cuirass_Rolled_Edge_${v}`, 0.0022, 112);
    add(
      armorSurface(112, 3, (u, t) => {
        const p = cuirass(u, v === 0 ? t * 0.022 : 1 - t * 0.024);
        return p.add(new THREE.Vector3(Math.sin(u * TAU) * 0.0007, 0, Math.cos(u * TAU) * 0.0007));
      }),
      bright,
      'torso',
      'Polished_Cuirass_Bevel',
    );
  }
  for (const side of [-1, 1]) {
    const phi = side * 0.93;
    sampleLine(
      (v) => cuirass(phi / TAU, v).add(new THREE.Vector3(side * 0.0014, 0, 0.0012)),
      gold,
      'torso',
      'Cuirass_Engraved_Flute',
      0.0012,
    );
    for (let i = 0; i < 5; i++) {
      const p = cuirass((side * 1.55) / TAU, 0.11 + i * 0.165);
      rivet(p, 'torso', 0.0021);
    }
  }
  sampleLine((v) => cuirass(0, v).add(new THREE.Vector3(0, 0, 0.0011)), bright, 'torso', 'Cuirass_Central_Keel', 0.001);

  // Sweeping chased laurel filigree sits on the plate itself, including the back plate.
  for (const rear of [false, true]) {
    const facing = rear ? -1 : 1;
    const onPlate = (x: number, y: number, lift = 0.0018) => {
      const v = THREE.MathUtils.clamp((y - 1.04) / 0.235, 0, 1);
      const phi = Math.asin(THREE.MathUtils.clamp(x / profile(v, [0.108, 0.115, 0.14, 0.145, 0.139]), -0.96, 0.96));
      const p = cuirass((rear ? Math.PI - phi : phi) / TAU, v);
      return p.set(x, y, p.z + facing * lift);
    };
    for (const side of [-1, 1]) {
      sampleLine(
        (t) => onPlate(side * (0.032 + 0.07 * Math.sin(t * Math.PI * 0.62)), 1.108 + t * 0.115),
        gold,
        'torso',
        'Chased_Laurel_Stem',
        0.00115,
        28,
      );
      for (let leaf = 0; leaf < 6; leaf++) {
        const t = 0.13 + leaf * 0.135;
        const x = side * (0.032 + 0.07 * Math.sin(t * Math.PI * 0.62)),
          y = 1.108 + t * 0.115;
        for (const direction of [-1, 1]) {
          sampleLine(
            (f) => onPlate(x + side * direction * Math.sin(f * Math.PI) * 0.008 + side * f * 0.003, y + f * 0.013),
            gold,
            'torso',
            'Chased_Laurel_Leaf',
            0.00065,
            8,
          );
        }
      }
      sampleLine(
        (t) => {
          const angle = t * Math.PI * 2.2,
            radius = (1 - t) * 0.014;
          return onPlate(side * (0.047 + Math.cos(angle) * radius), 1.078 + Math.sin(angle) * radius);
        },
        gold,
        'torso',
        'Waist_Volute',
        0.0009,
        26,
      );
    }
    const crest = sunburst(rear ? 0.022 : 0.028);
    if (rear) crest.rotateY(Math.PI);
    const center = onPlate(0, rear ? 1.197 : 1.212, 0.003);
    crest.translate(center.x, center.y, center.z);
    add(crest, gold, 'torso', 'Order_Of_The_Dawn_Crest');
    if (!rear) jewel(center.add(new THREE.Vector3(0, 0, 0.004)), 'torso', 0.008, 1.25);
  }

  // Separate rising gorget and shoulder straps fill the neck/arm cut-outs without forcing a rigid neck.
  const gorget: Sample = (u, v) => {
    const phi = u * TAU;
    const p = bodySurface(phi, lerp(1.273, 1.325, v));
    p.x += Math.sin(phi) * 0.011;
    p.z += Math.cos(phi) * 0.011;
    p.y -= (1 - v) * 0.006 * Math.max(0, Math.cos(phi));
    return p;
  };
  add(armorSurface(88, 14, gorget), shadowSteel, 'torso', 'Articulated_Gorget');
  for (const v of [0, 0.36, 1])
    sampleLine((u) => gorget(u, v), v === 0.36 ? bright : gold, 'torso', 'Gorget_Lames', 0.0014, 88);
  jewel(new THREE.Vector3(0, 1.301, 0.042), 'torso', 0.007, 1.45);

  const waist: Sample = (u, v) => {
    const phi = u * TAU;
    return new THREE.Vector3(
      Math.sin(phi) * (0.13 + (1 - v) * 0.02),
      lerp(0.954, 1.044, v),
      0.014 + Math.cos(phi) * (0.099 + (1 - v) * 0.02),
    );
  };
  add(armorSurface(96, 10, waist), blue, 'hips', 'Silk_Cummerbund');
  for (let lame = 0; lame < 3; lame++) {
    const shell: Sample = (u, v) => {
      const p = waist(u, 0.28 + lame * 0.23 + v * 0.25);
      const phi = u * TAU;
      p.x += Math.sin(phi) * 0.004;
      p.z += Math.cos(phi) * 0.005;
      p.y -= Math.max(0, Math.cos(phi)) ** 4 * 0.011;
      return p;
    };
    add(armorSurface(96, 5, shell), lame === 0 ? shadowSteel : silver, 'hips', 'Overlapping_Fauld_Lame');
    sampleLine((u) => shell(u, 0), gold, 'hips', 'Fauld_Rolled_Rim', 0.0015, 96);
  }
  const belt: Sample = (u, v) => {
    const phi = u * TAU;
    return new THREE.Vector3(
      Math.sin(phi) * 0.143,
      0.973 + v * 0.022 - Math.cos(phi) * 0.007,
      0.014 + Math.cos(phi) * 0.113,
    );
  };
  add(armorSurface(112, 4, belt), dark, 'hips', 'Sword_Belt');
  for (const v of [0, 1]) sampleLine((u) => belt(u, v), gold, 'hips', 'Sword_Belt_Stitching', 0.0009, 96);
  const buckle = armorPlaque(
    [
      [-0.026, 0.013],
      [0, 0.024],
      [0.026, 0.013],
      [0.02, -0.013],
      [0, -0.028],
      [-0.02, -0.013],
    ],
    0.004,
    0.0015,
  );
  buckle.translate(0, 0.983, 0.131);
  add(buckle, gold, 'hips', 'Heraldic_Belt_Buckle');
  jewel(new THREE.Vector3(0, 0.983, 0.137), 'hips', 0.01, 1.4);

  // The ivory underskirt and four split blue panels have independent thickness, rolled hems and real pleats.
  const skirt = (phi: number, v: number, layer = 0) => {
    const fullness = Math.pow(v, 0.81);
    const front = Math.max(0, Math.cos(phi));
    const hem = 0.51 + front * 0.07 - Math.max(0, -Math.cos(phi)) * 0.045;
    const folds = (Math.cos(phi * 16 + v * 0.32) * 0.007 + Math.cos(phi * 32) * 0.0015) * v ** 1.3;
    return new THREE.Vector3(
      Math.sin(phi) * (lerp(0.141, 0.255 + layer, fullness) + folds),
      lerp(0.963, hem + layer * 3, v),
      0.01 + Math.cos(phi) * (lerp(0.112, 0.21 + layer, fullness) + folds * 0.8),
    );
  };
  add(
    armorSurface(144, 32, (u, v) => skirt(u * TAU, v, -0.011), true),
    ivory,
    'cloth',
    'Ivory_Pleated_Underskirt',
  );
  sampleLine((u) => skirt(u * TAU, 1, -0.011), gold, 'cloth', 'Ivory_Hem_Binding', 0.0012, 144);
  const spans = [
    [0.22, 1.49],
    [1.65, 2.98],
    [3.3, 4.63],
    [4.8, TAU - 0.22],
  ];
  spans.forEach(([start, end], panel) => {
    const surface: Sample = (u, v) => {
      const phi = lerp(start, end, u);
      const p = skirt(phi, v);
      p.y += 0.033 * Math.sin(u * Math.PI) ** 2 * v ** 5;
      return p;
    };
    add(armorSurface(34, 32, surface, true), blue, 'cloth', `Split_Damask_Panel_${panel}`);
    for (const edge of [0, 1]) sampleLine((v) => surface(edge, v), gold, 'cloth', 'Damask_Panel_Edge', 0.00145, 36);
    sampleLine((u) => surface(u, 1), gold, 'cloth', 'Damask_Panel_Hem', 0.0016, 40);
    sampleLine(
      (u) =>
        surface(u, 0.94).add(
          new THREE.Vector3(Math.sin(lerp(start, end, u)) * 0.001, 0, Math.cos(lerp(start, end, u)) * 0.001),
        ),
      gold,
      'cloth',
      'Double_Embroidered_Hem',
      0.0008,
      40,
    );
    // Repeated open diamonds form a restrained embroidered border above the hem.
    for (let motif = 0; motif < 9; motif++) {
      const u = 0.08 + motif * 0.105;
      const points = [
        [u, 0.86],
        [u + 0.024, 0.89],
        [u, 0.92],
        [u - 0.024, 0.89],
        [u, 0.86],
      ].map(([a, b]) =>
        surface(a, b).add(
          new THREE.Vector3(Math.sin(lerp(start, end, a)) * 0.0015, 0, Math.cos(lerp(start, end, a)) * 0.0015),
        ),
      );
      line(points, gold, 'cloth', 'Hem_Lozenges', 0.00065);
    }
  });
  const tabard: Sample = (u, v) => {
    const x = (u - 0.5) * 2;
    const width = lerp(0.065, 0.077, Math.sin(v * Math.PI * 0.65));
    const y = lerp(0.964, 0.527 + Math.abs(x) * 0.07, v);
    return new THREE.Vector3(
      x * width,
      y,
      lerp(0.133, 0.235, v ** 0.8) + Math.cos(x * Math.PI * 2) * 0.002 * v + Math.sin(v * Math.PI) * 0.007,
    );
  };
  add(armorSurface(24, 34, tabard), blue, 'cloth', 'Pointed_Heraldic_Tabard');
  for (const u of [0, 1])
    sampleLine((v) => tabard(u, v).add(new THREE.Vector3(0, 0, 0.001)), gold, 'cloth', 'Tabard_Braided_Edge', 0.002);
  sampleLine((u) => tabard(u, 1), gold, 'cloth', 'Tabard_Point_Binding', 0.002);
  // The heraldic blade / wing crest is stitched onto the tabard as a raised ivory appliqué.
  const motif = armorPlaque(
    [
      [0, 0.071],
      [0.011, 0.038],
      [0.008, -0.018],
      [0.033, -0.029],
      [0.032, -0.038],
      [0.007, -0.032],
      [0, -0.072],
      [-0.007, -0.032],
      [-0.032, -0.038],
      [-0.033, -0.029],
      [-0.008, -0.018],
      [-0.011, 0.038],
    ],
    0.0012,
    0.0003,
  );
  // A gentle lean follows the tabard's actual drape.
  motif.rotateX(-0.22);
  motif.translate(0, 0.741, 0.203);
  add(motif, ivory, 'cloth', 'Tabard_Dawnblade_Applique');
  for (const side of [-1, 1]) {
    for (let feather = 0; feather < 4; feather++) {
      const y = 0.771 - feather * 0.015;
      line(
        [
          new THREE.Vector3(side * 0.014, y - 0.022, 0.207),
          new THREE.Vector3(side * (0.046 - feather * 0.005), y, 0.207),
        ],
        gold,
        'cloth',
        'Tabard_Wing_Embroidery',
        0.0012,
      );
    }
  }

  // Three overlapping, pointed tassets protect each hip, above the flowing skirt.
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 3; tier++) {
      const plate: Sample = (u, v) => {
        const phi = side * lerp(0.51, 1.37, u);
        const across = Math.sin(u * Math.PI);
        const y = 0.95 - tier * 0.048 - v * (0.067 + across * 0.012);
        const radiusX = 0.18 + tier * 0.019 + v * 0.018;
        const radiusZ = 0.147 + tier * 0.018 + v * 0.023;
        return new THREE.Vector3(Math.sin(phi) * radiusX, y, 0.009 + Math.cos(phi) * radiusZ);
      };
      add(armorSurface(30, 10, plate), silver, 'hips', 'Articulated_Hip_Tasset');
      for (const v of [0, 1])
        sampleLine((u) => plate(u, v), v === 0 ? shadowSteel : gold, 'hips', 'Tasset_Rolled_Border', 0.0016, 30);
      for (const u of [0, 1]) sampleLine((v) => plate(u, v), gold, 'hips', 'Tasset_Side_Border', 0.0012, 10);
      for (const u of [0.12, 0.88]) rivet(plate(u, 0.17), 'hips');
      sampleLine(
        (v) => plate(0.5, v).add(new THREE.Vector3(side * 0.0015, 0, 0.0015)),
        bright,
        'hips',
        'Tasset_Pressed_Ridge',
        0.0008,
        16,
      );
    }
  }

  const bone = (name: VRMHumanBoneName) => vrm.humanoid.getRawBoneNode(name);
  const frame = (start: VRMHumanBoneName, end: VRMHumanBoneName) => {
    const a = bone(start),
      b = bone(end);
    if (!a || !b) return null;
    const origin = a.getWorldPosition(new THREE.Vector3());
    const axis = b.getWorldPosition(new THREE.Vector3()).sub(origin);
    const length = axis.length();
    axis.normalize();
    const forward = new THREE.Vector3(0, 0, 1).addScaledVector(axis, -axis.z).normalize();
    const lateral = new THREE.Vector3().crossVectors(axis, forward).normalize();
    if (lateral.y < -0.1) lateral.negate();
    return {
      length,
      point(phi: number, distance: number, radius: number, flatten = 1) {
        return origin
          .clone()
          .addScaledVector(axis, distance)
          .addScaledVector(forward, Math.cos(phi) * radius)
          .addScaledVector(lateral, Math.sin(phi) * radius * flatten);
      },
    };
  };
  for (const side of ['left', 'right'] as const) {
    const upperArm = `${side}UpperArm` as const,
      lowerArm = `${side}LowerArm` as const;
    const hand = `${side}Hand` as const,
      lowerLeg = `${side}LowerLeg` as const,
      foot = `${side}Foot` as const;
    const arm = frame(upperArm, lowerArm),
      forearm = frame(lowerArm, hand),
      leg = frame(lowerLeg, foot);
    if (arm && forearm) {
      // A shaped shell across the shoulder plus three lames: an actual pauldron silhouette, not a sphere.
      const pauldron: Sample = (u, v) => {
        const phi = lerp(-0.18, Math.PI + 0.18, u);
        const distance = -0.018 + v * 0.133;
        const radius = profile(v, [0.045, 0.073, 0.07, 0.047]);
        return arm.point(phi, distance, radius, 1.04);
      };
      add(armorSurface(48, 24, pauldron), silver, upperArm, 'Forged_Pauldron_Cap');
      for (const v of [0, 1]) sampleLine((u) => pauldron(u, v), gold, upperArm, 'Pauldron_Rolled_Rim', 0.002, 48);
      for (const u of [0, 1]) sampleLine((v) => pauldron(u, v), gold, upperArm, 'Pauldron_Front_Back_Rim', 0.0018, 32);
      for (let tier = 0; tier < 3; tier++) {
        const plate: Sample = (u, v) =>
          arm.point(
            lerp(-0.3, Math.PI + 0.3, u),
            0.087 + tier * 0.022 + v * 0.034,
            0.053 - tier * 0.006 + Math.sin(v * Math.PI) * 0.003,
          );
        add(armorSurface(40, 8, plate), tier % 2 === 0 ? silver : bright, upperArm, 'Pauldron_Overlapping_Lames');
        sampleLine((u) => plate(u, 1), gold, upperArm, 'Pauldron_Lame_Edge', 0.0013, 36);
        for (const u of [0.1, 0.9]) rivet(plate(u, 0.35), upperArm, 0.002);
      }
      for (const front of [0.12, 0.88]) {
        sampleLine(
          (t) => pauldron(front + Math.sin(t * Math.PI) * (front < 0.5 ? 0.09 : -0.09), 0.16 + t * 0.55),
          gold,
          upperArm,
          'Pauldron_Engraved_Leaf',
          0.0009,
          24,
        );
      }
      jewel(pauldron(0.07, 0.45).add(new THREE.Vector3(0, 0, 0.002)), upperArm, 0.007, 1.2);
      const rerebrace: Sample = (u, v) => arm.point(u * TAU, lerp(0.132, arm.length - 0.019, v), lerp(0.034, 0.031, v));
      add(armorSurface(40, 10, rerebrace), shadowSteel, upperArm, 'Upper_Arm_Rerebrace');
      for (const v of [0, 1]) sampleLine((u) => rerebrace(u, v), gold, upperArm, 'Rerebrace_Binding', 0.0011);
      const elbow: Sample = (u, v) =>
        forearm.point(
          u * TAU,
          -0.012 + v * 0.048,
          0.032 + Math.sin(v * Math.PI) * 0.009 + Math.max(0, Math.cos(u * TAU)) ** 8 * 0.01,
        );
      add(armorSurface(44, 12, elbow), silver, lowerArm, 'Pointed_Elbow_Couter');
      for (const v of [0, 1]) sampleLine((u) => elbow(u, v), gold, lowerArm, 'Couter_Border', 0.0013);
      const vambrace: Sample = (u, v) => {
        const phi = u * TAU;
        return forearm.point(
          phi,
          lerp(0.03, forearm.length - 0.018, v),
          lerp(0.039, 0.026, v) + Math.max(0, Math.cos(phi)) ** 10 * 0.004,
        );
      };
      add(armorSurface(48, 22, vambrace), silver, lowerArm, 'Tapered_Fluted_Vambrace');
      for (const v of [0, 1]) sampleLine((u) => vambrace(u, v), gold, lowerArm, 'Vambrace_Edge', 0.0014, 48);
      for (const u of [0, 0.14, 0.86])
        sampleLine((v) => vambrace(u, v), u === 0 ? bright : gold, lowerArm, 'Vambrace_Engraved_Flutes', 0.00085);
      for (let tier = 0; tier < 3; tier++) {
        const cuff: Sample = (u, v) =>
          forearm.point(u * TAU, forearm.length - 0.028 + tier * 0.011 + v * 0.014, 0.026 + tier * 0.0015);
        add(armorSurface(36, 4, cuff), tier === 2 ? shadowSteel : bright, lowerArm, 'Sliding_Wrist_Lames');
        sampleLine((u) => cuff(u, 1), gold, lowerArm, 'Wrist_Lame_Rim', 0.0008, 36);
      }
      const palm = frame(hand, `${side}MiddleProximal`);
      if (palm) {
        const backhand: Sample = (u, v) =>
          palm.point(
            lerp(-Math.PI / 2, Math.PI / 2, u),
            v * Math.max(0.055, palm.length),
            0.024 + Math.sin(v * Math.PI) * 0.007,
            0.82,
          );
        add(armorSurface(32, 12, backhand), silver, hand, 'Metacarpal_Gauntlet_Plate');
        for (const u of [0, 1]) sampleLine((v) => backhand(u, v), gold, hand, 'Gauntlet_Side_Border', 0.001);
        for (const v of [0, 1]) sampleLine((u) => backhand(u, v), gold, hand, 'Gauntlet_Rim', 0.001);
        for (const u of [0.25, 0.5, 0.75])
          sampleLine((v) => backhand(u, v), bright, hand, 'Gauntlet_Finger_Flutes', 0.0008, 20);
      }
      for (const digit of ['Index', 'Middle', 'Ring', 'Little'] as const) {
        for (const [joint, next] of [
          ['Proximal', 'Intermediate'],
          ['Intermediate', 'Distal'],
        ] as const) {
          const name = `${side}${digit}${joint}` as VRMHumanBoneName;
          const finger = frame(name, `${side}${digit}${next}` as VRMHumanBoneName);
          if (!finger) continue;
          const plate: Sample = (u, v) => finger.point(lerp(-1.32, 1.32, u), 0.001 + v * finger.length * 0.86, 0.008);
          add(armorSurface(12, 4, plate), silver, name, 'Articulated_Finger_Plate');
        }
      }
    }
    if (leg) {
      const greave: Sample = (u, v) => {
        const phi = u * TAU;
        const radius = profile(v, [0.052, 0.062, 0.058, 0.048, 0.043]);
        const ridge = Math.max(0, Math.cos(phi)) ** 12 * 0.006;
        const p = leg.point(phi, lerp(0.025, leg.length - 0.025, v), radius + ridge, 0.94);
        // The calf muscle sits behind the knee-to-ankle bone axis in the actual source skin.
        p.z -= profile(v, [0.013, 0.027, 0.026, 0.016, 0.007]);
        p.x += (side === 'left' ? 1 : -1) * Math.sin(v * Math.PI) * 0.004;
        return p;
      };
      add(armorSurface(64, 28, greave), silver, lowerLeg, 'Sculpted_Calf_Greave');
      for (const v of [0, 1]) sampleLine((u) => greave(u, v), gold, lowerLeg, 'Greave_Rolled_Rim', 0.0016, 64);
      for (const u of [0, 0.125, 0.875])
        sampleLine(
          (v) => greave(u, v),
          u === 0 ? bright : gold,
          lowerLeg,
          'Greave_Engraved_Flute',
          u === 0 ? 0.001 : 0.0009,
        );
      const knee: Sample = (u, v) => {
        const phi = lerp(-1.65, 1.65, u);
        const across = Math.sin(u * Math.PI);
        return leg.point(phi, -0.022 + v * 0.08 - across * 0.02 * (1 - v), 0.049 + Math.sin(v * Math.PI) * 0.014, 0.93);
      };
      add(armorSurface(40, 16, knee), bright, lowerLeg, 'Pointed_Knee_Poleyn');
      for (const v of [0, 1]) sampleLine((u) => knee(u, v), gold, lowerLeg, 'Poleyn_Rim', 0.0017, 40);
      for (const u of [0, 1]) sampleLine((v) => knee(u, v), gold, lowerLeg, 'Poleyn_Side_Rim', 0.0013, 20);
      jewel(knee(0.5, 0.46).add(new THREE.Vector3(0, 0, 0.002)), lowerLeg, 0.0065, 1.45);
      for (const v of [0.22, 0.76]) {
        const strap: Sample = (u, t) => {
          const p = greave(u, v + t * 0.021);
          const phi = u * TAU;
          return p.add(new THREE.Vector3(Math.sin(phi) * 0.001, 0, Math.cos(phi) * 0.001));
        };
        add(armorSurface(48, 3, strap), shadowSteel, lowerLeg, 'Greave_Leather_Retention_Band');
      }
      const footBone = bone(foot)!;
      const x = footBone.getWorldPosition(new THREE.Vector3()).x;
      const footprint = (phi: number) =>
        new THREE.Vector3(x + Math.sin(phi) * (0.047 + Math.cos(phi) * 0.005), 0.024, 0.031 + Math.cos(phi) * 0.137);
      const sabaton: Sample = (u, v) => {
        const phi = u * TAU;
        const toe = footprint(phi);
        const ankle = new THREE.Vector3(
          x + Math.sin(phi) * 0.031,
          0.12 - Math.max(0, Math.cos(phi)) * 0.022,
          -0.029 + Math.cos(phi) * 0.039,
        );
        const p = toe.lerp(ankle, v);
        p.y += Math.sin(v * Math.PI) * 0.024 * Math.max(0, Math.cos(phi));
        return p;
      };
      add(armorSurface(72, 20, sabaton), shadowSteel, foot, 'Sabatons_Closed_Foot_Shell');
      const sole: Sample = (u, v) => {
        const p = footprint(u * TAU);
        p.y = lerp(0.009, 0.025, v);
        return p;
      };
      add(armorSurface(72, 4, sole), dark, foot, 'Sabatons_Leather_Sole');
      add(
        armorSurface(72, 4, (u, v) => {
          const p = footprint(u * TAU);
          p.x = lerp(x, p.x, v);
          p.z = lerp(0.031, p.z, v);
          p.y = 0.009;
          return p;
        }),
        dark,
        foot,
        'Sabatons_Closed_Underside',
      );
      for (let tier = 0; tier < 5; tier++) {
        const plate: Sample = (u, v) => {
          const phi = lerp(-1.53, 1.53, u);
          const p = sabaton(phi / TAU, 0.05 + tier * 0.158 + v * 0.185);
          p.y += 0.0018;
          p.z += Math.cos(phi) * 0.0018;
          return p;
        };
        add(armorSurface(32, 8, plate), tier % 2 === 0 ? silver : bright, foot, 'Overlapping_Sabaton_Lame');
        sampleLine((u) => plate(u, 0), gold, foot, 'Sabaton_Lame_Rim', 0.0011, 32);
      }
      sampleLine((u) => footprint(u * TAU), gold, foot, 'Sabaton_Welt', 0.0014, 72);
    }
  }

  // A complete scabbarded sword is suspended outside the left skirt; its weight follows the pelvis.
  const swordOrigin = new THREE.Vector3(0.215, 0.965, 0.035);
  const swordRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.21);
  const swordPoint = (x: number, y: number, z: number) =>
    new THREE.Vector3(x, y, z).applyQuaternion(swordRotation).add(swordOrigin);
  const swordPart = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
    geometry.applyQuaternion(swordRotation);
    geometry.translate(swordOrigin.x, swordOrigin.y, swordOrigin.z);
    add(geometry, material, 'hips', name);
  };
  const scabbard = armorPlaque(
    [
      [-0.023, -0.004],
      [0.023, -0.004],
      [0.02, -0.48],
      [0, -0.535],
      [-0.02, -0.48],
    ],
    0.016,
    0.003,
  );
  scabbard.translate(0, 0, -0.008);
  swordPart(scabbard, blue, 'Dawnblade_Blue_Leather_Scabbard');
  for (const side of [-1, 1])
    line(
      [swordPoint(side * 0.021, -0.006, 0.01), swordPoint(side * 0.019, -0.475, 0.01), swordPoint(0, -0.532, 0.01)],
      gold,
      'hips',
      'Scabbard_Gold_Welt',
      0.0015,
    );
  for (const y of [-0.017, -0.083, -0.445]) {
    const band = armorPlaque(
      [
        [-0.025, 0.008],
        [0.025, 0.008],
        [0.025, -0.008],
        [-0.025, -0.008],
      ],
      0.022,
      0.001,
    );
    band.translate(0, y, -0.011);
    swordPart(band, gold, 'Scabbard_Filigree_Locket');
  }
  const chape = armorPlaque(
    [
      [-0.026, -0.461],
      [0.026, -0.461],
      [0.022, -0.492],
      [0, -0.542],
      [-0.022, -0.492],
    ],
    0.028,
    0.001,
  );
  chape.translate(0, 0, -0.014);
  swordPart(chape, silver, 'Scabbard_Steel_Chape');
  const guard = armorPlaque(
    [
      [-0.074, -0.007],
      [-0.06, 0.018],
      [-0.022, 0.032],
      [0, 0.021],
      [0.022, 0.032],
      [0.06, 0.018],
      [0.074, -0.007],
      [0.049, 0.005],
      [0.015, 0.008],
      [0, -0.007],
      [-0.015, 0.008],
      [-0.049, 0.005],
    ],
    0.018,
    0.002,
  );
  guard.translate(0, 0.009, -0.009);
  swordPart(guard, gold, 'Dawnblade_Winged_Crossguard');
  const grip = new THREE.CylinderGeometry(0.009, 0.011, 0.098, 12);
  grip.translate(0, 0.078, 0);
  swordPart(grip, dark, 'Dawnblade_Leather_Grip');
  sampleLine(
    (t) => swordPoint(Math.cos(t * TAU * 9) * 0.0102, 0.03 + t * 0.094, Math.sin(t * TAU * 9) * 0.0102),
    gold,
    'hips',
    'Grip_Helical_Gold_Wire',
    0.0008,
    108,
  );
  const pommel = sunburst(0.02, 4);
  pommel.translate(0, 0.142, -0.003);
  swordPart(pommel, gold, 'Dawnblade_Sun_Pommel');
  jewel(swordPoint(0, 0.142, 0.002), 'hips', 0.007, 1.1);
  jewel(swordPoint(0, 0.02, 0.013), 'hips', 0.008, 1.2);
  for (const y of [-0.028, -0.099]) {
    line(
      [new THREE.Vector3(0.133, 0.98, 0.059), swordPoint(-0.022, y, 0.007)],
      dark,
      'hips',
      'Sword_Suspension_Strap',
      0.006,
    );
    line(
      [new THREE.Vector3(0.137, 0.98, 0.064), swordPoint(-0.022, y, 0.012)],
      gold,
      'hips',
      'Sword_Suspension_Stitch',
      0.0008,
    );
  }

  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.pieces);
    if (!geometry) throw new Error(`Seraphine geometry batch failed: ${batch.name}`);
    batch.pieces.forEach((part) => part.dispose());
    let mesh: THREE.SkinnedMesh;
    if (batch.binding === 'torso' || batch.binding === 'cloth') {
      mesh = bindAureliaGeometry(
        vrm,
        geometry,
        batch.material,
        batch.name,
        batch.binding === 'cloth' ? 'hips' : 'torso',
      );
    } else {
      const joint = bone(batch.binding);
      const jointIndex = skeleton.bones.findIndex((candidate) => candidate === joint);
      if (jointIndex < 0) {
        geometry.dispose();
        continue;
      }
      const count = geometry.getAttribute('position').count;
      const indices = new Uint16Array(count * 4),
        weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        indices[i * 4] = jointIndex;
        weights[i * 4] = 1;
      }
      geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
      geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
      mesh = new THREE.SkinnedMesh(geometry, batch.material);
      mesh.name = batch.name;
      vrm.scene.add(mesh);
      mesh.bind(skeleton, new THREE.Matrix4());
    }
    mesh.frustumCulled = false;
    mesh.userData.aureliaOuterGarment = true;
    if (batch.binding === 'cloth')
      cloth.push({ geometry, rest: Float32Array.from(geometry.getAttribute('position').array) });
  }
  let time = 0;
  return {
    update(delta, breath) {
      time += THREE.MathUtils.clamp(delta, 0, 0.05);
      for (const { geometry, rest } of cloth) {
        const position = geometry.getAttribute('position');
        for (let i = 0; i < position.count; i++) {
          const x = rest[i * 3],
            y = rest[i * 3 + 1],
            z = rest[i * 3 + 2];
          const fall = THREE.MathUtils.clamp((0.956 - y) / 0.46, 0, 1) ** 2;
          position.setXYZ(
            i,
            x + fall * (Math.sin(time * 1.4 + z * 6) * 0.0034 + Math.sin(time * 2.1 + y * 10) * 0.0012),
            y,
            z + fall * Math.sin(time * 1.7 + x * 8) * 0.0032 + fall * breath * 0.0012,
          );
        }
        position.needsUpdate = true;
        geometry.computeVertexNormals();
      }
    },
  };
}
