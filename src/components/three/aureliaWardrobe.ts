import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { VRM } from '@pixiv/three-vrm';
import { bindAureliaGeometry, fitAureliaGeometry, getAureliaSkeleton } from './aureliaSkinning';
import { addAureliaBody } from './aureliaBody';
import { addAureliaFootwear } from './aureliaFootwear';
import { createAureliaDressMaterials } from './aureliaDressMaterials';
import { addAureliaPrincessSleeves } from './aureliaPrincessSleeves';
import { AureliaShoulderFit } from './aureliaShoulderFit';
import { AureliaCloth, type ClothCapsule } from './aureliaCloth';
import {
  bodiceSurface,
  chokerSurface,
  shoulderStrap,
  SKIRT_COLUMNS,
  SKIRT_ROWS,
  skirtSurface,
} from './aureliaGarmentShape';

const TAU = Math.PI * 2;
interface AnimatedGeometry {
  geometry: THREE.BufferGeometry;
  rest: Float32Array;
  cloth?: { u: number; v: number; offset: THREE.Vector3 }[];
}
interface GoldGeometry extends AnimatedGeometry {
  binding: 'torso' | 'hips' | 'cloth';
}
export interface AureliaWardrobe {
  update(delta: number, breathing: number): void;
}

function surface(columns: number, rows: number, sample: (u: number, v: number) => THREE.Vector3, reverse = false) {
  const points: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= rows; row++)
    for (let column = 0; column <= columns; column++) {
      const u = column / columns,
        v = row / rows;
      sample(u, v).toArray(points, points.length);
      uv.push(u, v);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column,
          b = a + 1,
          c = a + columns + 1,
          d = c + 1;
        indices.push(...(reverse ? [a, c, b, b, c, d] : [a, b, c, b, d, c]));
      }
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Tailored bodice, open shoulders and a separate waist-pinned cloth skirt. */
export function addAureliaWardrobe(vrm: VRM): AureliaWardrobe {
  // Keep a complete body and fitted underlayer before constructing the removable outer dress.
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.name.includes('Tops') || material.name.includes('Bottoms')))
      object.visible = false;
  });
  addAureliaBody(vrm);
  addAureliaFootwear(vrm);
  const shoulderFit = new AureliaShoulderFit(vrm);
  const skeleton = getAureliaSkeleton(vrm);
  const hips = vrm.humanoid.getRawBoneNode('hips')!;
  const hipIndex = skeleton.bones.findIndex((bone) => bone === hips);
  const animated: AnimatedGeometry[] = [];
  const weighted = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    name: string,
    skirt = false,
    fitToBody = !skirt,
  ) => {
    // Fit before skinning and before callers capture animation rest positions.
    if (fitToBody) fitAureliaGeometry(vrm, geometry);
    if (name.startsWith('Aurelia_Shoulder_')) shoulderFit.fit(geometry);
    const mesh = bindAureliaGeometry(vrm, geometry, material, name, skirt ? 'hips' : 'torso');
    mesh.userData.aureliaOuterGarment = true;
    return mesh;
  };
  const materials = createAureliaDressMaterials();
  const { satin, gold, lace, velvet } = materials;
  addAureliaPrincessSleeves(vrm, materials, shoulderFit);
  const bodice = surface(96, 40, (u, v) => bodiceSurface(u * TAU, v));
  weighted(bodice, materials.bodice, 'Aurelia_Sculpted_Bodice');
  animated.push({ geometry: bodice, rest: Float32Array.from(bodice.getAttribute('position').array) });

  const neckline = surface(144, 8, (u, v) => {
    const phi = u * TAU;
    const t = 1 - v * (0.067 + Math.cos(phi * 24) * 0.011);
    return bodiceSurface(phi, t).add(new THREE.Vector3(Math.sin(phi) * 0.0022, 0, Math.cos(phi) * 0.0022));
  });
  weighted(neckline, lace, 'Aurelia_Scalloped_Neckline_Lace');
  animated.push({ geometry: neckline, rest: Float32Array.from(neckline.getAttribute('position').array) });

  const choker = surface(64, 4, (u, v) => chokerSurface(u * TAU, v));
  weighted(choker, velvet, 'Aurelia_Velvet_Choker');
  for (const side of [-1, 1]) {
    const strap = surface(8, 32, (u, v) => shoulderStrap(side, v, (u - 0.5) * 2), side < 0);
    weighted(strap, velvet, `Aurelia_Shoulder_Strap_${side}`);
    animated.push({ geometry: strap, rest: Float32Array.from(strap.getAttribute('position').array) });
    for (const edge of [-1, 1]) {
      const frill = surface(
        6,
        40,
        (u, v) => {
          const across = edge * (1 + u * (0.48 + 0.12 * Math.cos(v * Math.PI * 14)));
          return shoulderStrap(side, v, across).add(new THREE.Vector3(side * 0.001, 0.0015, 0));
        },
        side < 0,
      );
      weighted(frill, lace, `Aurelia_Shoulder_Lace_${side}_${edge}`);
      animated.push({ geometry: frill, rest: Float32Array.from(frill.getAttribute('position').array) });
    }
  }
  const pendingGold: GoldGeometry[] = [];
  const sash = surface(144, 5, (u, v) => {
    const phi = u * TAU;
    return bodiceSurface(phi, v * 0.064).add(new THREE.Vector3(Math.sin(phi) * 0.003, 0, Math.cos(phi) * 0.003));
  });
  weighted(sash, velvet, 'Aurelia_Perwinkle_Waist_Sash', true);
  animated.push({ geometry: sash, rest: Float32Array.from(sash.getAttribute('position').array) });
  const bowCenter = bodiceSurface(Math.PI, 0.03).add(new THREE.Vector3(0, 0, -0.01));
  const bowLoops = [-1, 1].map((side) =>
    surface(8, 32, (u, v) =>
      bowCenter
        .clone()
        .add(
          new THREE.Vector3(
            side * Math.sin(v * Math.PI) * 0.062,
            Math.sin(v * TAU) * 0.011 + (u - 0.5) * 0.018,
            -Math.sin(v * Math.PI) * 0.016 + Math.sin(u * Math.PI) * 0.002,
          ),
        ),
    ),
  );
  const bow = mergeGeometries(bowLoops)!;
  weighted(bow, velvet, 'Aurelia_Back_Sash_Bow', true);
  animated.push({ geometry: bow, rest: Float32Array.from(bow.getAttribute('position').array) });
  bowLoops.forEach((geometry) => geometry.dispose());
  const knot = new THREE.SphereGeometry(0.009, 12, 8);
  knot.scale(0.8, 1.35, 0.65);
  knot.translate(bowCenter.x, bowCenter.y, bowCenter.z - 0.002);
  weighted(knot, satin, 'Aurelia_Back_Bow_Knot', true);
  const seam = (
    points: THREE.Vector3[],
    radius: number,
    name: string,
    clothCoordinates?: { u: number; v: number }[],
    fitToBody = !clothCoordinates,
  ) => {
    const shoulderTrim = shoulderFit.available && name.startsWith('Aurelia_Strap_Binding_');
    if (shoulderTrim) {
      // Fit the centerline first so the gold cord keeps its round cross-section.
      const anchors = new THREE.BufferGeometry().setFromPoints(points);
      fitAureliaGeometry(vrm, anchors);
      shoulderFit.fit(anchors, 0.0052);
      points = points.map((_, i) => new THREE.Vector3().fromBufferAttribute(anchors.getAttribute('position'), i));
      anchors.dispose();
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const segments = Math.max(32, points.length * 2);
    const geometry = new THREE.TubeGeometry(curve, segments, radius, 5, false);
    geometry.name = name;
    // Fit individual torso pieces before batching; hips/cloth trim retains its original anchors.
    if (shoulderTrim) {
      // Bind without reapplying the torso displacement to the fitted cord.
      const count = geometry.getAttribute('position').count;
      const indices = new Uint16Array(count * 4),
        weights = new Float32Array(count * 4);
      const chestIndex = skeleton.bones.findIndex((bone) => bone === vrm.humanoid.getRawBoneNode('upperChest'));
      for (let i = 0; i < count; i++) {
        // Keep a valid chest binding if a ray misses an open source boundary.
        indices[i * 4] = Math.max(0, chestIndex);
        weights[i * 4] = 1;
      }
      geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
      geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
      shoulderFit.fit(geometry, 0.004);
    } else if (fitToBody) fitAureliaGeometry(vrm, geometry);
    const rest = Float32Array.from(geometry.getAttribute('position').array);
    if (clothCoordinates) {
      const bindings = Array.from({ length: geometry.getAttribute('position').count }, (_, i) => {
        const t = Math.floor(i / 6) / segments;
        const index = curve.getUtoTmapping(t, undefined) * (clothCoordinates.length - 1),
          lo = Math.floor(index),
          hi = Math.min(lo + 1, clothCoordinates.length - 1);
        const a = clothCoordinates[lo],
          b = clothCoordinates[hi],
          alpha = index - lo;
        const u = THREE.MathUtils.lerp(a.u, b.u, alpha),
          v = THREE.MathUtils.lerp(a.v, b.v, alpha);
        return { u, v, offset: new THREE.Vector3().fromArray(rest, i * 3).sub(skirtSurface(u * TAU, v)) };
      });
      pendingGold.push({ geometry, rest, cloth: bindings, binding: 'cloth' });
    } else pendingGold.push({ geometry, rest, binding: fitToBody ? 'torso' : 'hips' });
  };
  for (const v of [0, 1])
    seam(
      Array.from({ length: 65 }, (_, i) => chokerSurface((i / 64) * TAU, v)),
      0.00065,
      `Aurelia_Choker_Binding_${v}`,
    );
  for (const t of [0, 0.064])
    seam(
      Array.from({ length: 97 }, (_, i) => {
        const phi = (i / 96) * TAU;
        return bodiceSurface(phi, t).add(new THREE.Vector3(Math.sin(phi) * 0.0038, 0, Math.cos(phi) * 0.0038));
      }),
      0.001,
      `Aurelia_Sash_Gold_Edge_${t}`,
      undefined,
      false,
    );
  seam(
    Array.from({ length: 97 }, (_, i) => bodiceSurface((i / 96) * TAU, 1).add(new THREE.Vector3(0, 0.0008, 0))),
    0.0015,
    'Aurelia_Sweetheart_Binding',
  );
  for (const side of [-1, 1]) {
    seam(
      Array.from({ length: 41 }, (_, i) =>
        bodiceSurface(side * 0.97, i / 40).add(new THREE.Vector3(side * 0.001, 0, 0.0018)),
      ),
      0.0012,
      `Aurelia_Princess_Seam_${side}`,
    );
    for (const edge of [-1, 1])
      seam(
        Array.from({ length: 33 }, (_, i) => shoulderStrap(side, i / 32, edge).add(new THREE.Vector3(0, 0.0008, 0))),
        0.0011,
        `Aurelia_Strap_Binding_${side}_${edge}`,
      );
  }
  // Fine back lacing sits on the rear panel and uses the same chest deformation as the bodice.
  for (let i = 0; i < 6; i++)
    for (const side of [-1, 1]) {
      const t = 0.23 + i * 0.095;
      seam(
        [bodiceSurface(Math.PI + side * 0.24, t), bodiceSurface(Math.PI - side * 0.24, t + 0.085)].map((p) =>
          p.add(new THREE.Vector3(0, 0, -0.002)),
        ),
        0.0011,
        `Aurelia_Back_Lacing_${i}_${side}`,
      );
    }

  const particles: number[] = [];
  for (let row = 0; row < SKIRT_ROWS; row++)
    for (let col = 0; col < SKIRT_COLUMNS; col++)
      skirtSurface((col / SKIRT_COLUMNS) * TAU, row / (SKIRT_ROWS - 1)).toArray(particles, particles.length);
  const cloth = new AureliaCloth(SKIRT_COLUMNS, SKIRT_ROWS, particles);
  const addSkirt = (name: string, material: THREE.Material, inset: number) => {
    const geometry = surface(
      96,
      32,
      (u, v) => {
        const p = skirtSurface(u * TAU, v);
        if (inset) {
          p.x *= 0.977;
          p.z = (p.z - 0.004) * 0.977 + 0.004;
          p.y -= 0.004 * v;
        }
        return p;
      },
      true,
    );
    weighted(geometry, material, name, true);
    const rest = Float32Array.from(geometry.getAttribute('position').array),
      uv = geometry.getAttribute('uv');
    animated.push({
      geometry,
      rest,
      cloth: Array.from({ length: uv.count }, (_, i) => {
        const u = uv.getX(i),
          v = uv.getY(i);
        return { u, v, offset: new THREE.Vector3().fromArray(rest, i * 3).sub(skirtSurface(u * TAU, v)) };
      }),
    });
  };
  addSkirt('Aurelia_Cloth_Skirt', materials.skirt, 0);
  addSkirt('Aurelia_Satin_Lining', satin, 1);
  const petalHem = (u: number) => 0.57 + 0.155 * Math.cos(u * TAU * 6);
  const addClothLayer = (
    name: string,
    material: THREE.Material,
    columns: number,
    rows: number,
    coordinate: (u: number, v: number) => { u: number; v: number },
    shape: (point: THREE.Vector3, u: number, v: number) => THREE.Vector3,
  ) => {
    const geometry = surface(
      columns,
      rows,
      (u, v) => {
        const sample = coordinate(u, v);
        return shape(skirtSurface(sample.u * TAU, sample.v), u, v);
      },
      true,
    );
    weighted(geometry, material, name, true);
    const rest = Float32Array.from(geometry.getAttribute('position').array),
      uv = geometry.getAttribute('uv');
    animated.push({
      geometry,
      rest,
      cloth: Array.from({ length: uv.count }, (_, i) => {
        const sample = coordinate(uv.getX(i), uv.getY(i));
        return {
          ...sample,
          offset: new THREE.Vector3().fromArray(rest, i * 3).sub(skirtSurface(sample.u * TAU, sample.v)),
        };
      }),
    });
  };
  addClothLayer(
    'Aurelia_Embroidered_Petal_Overskirt',
    materials.petals,
    144,
    24,
    (u, v) => ({ u, v: v * petalHem(u) }),
    (point, u, v) =>
      point.add(new THREE.Vector3(Math.sin(u * TAU) * (0.003 + v * 0.004), 0, Math.cos(u * TAU) * (0.003 + v * 0.004))),
  );
  addClothLayer(
    'Aurelia_Petal_Openwork_Edging',
    lace,
    144,
    6,
    (u, v) => ({ u, v: petalHem(u) - 0.012 + v * 0.045 }),
    (point, u, v) =>
      point.add(
        new THREE.Vector3(
          Math.sin(u * TAU) * (0.008 + Math.sin(v * Math.PI) * 0.002),
          0,
          Math.cos(u * TAU) * (0.008 + Math.sin(v * Math.PI) * 0.002),
        ),
      ),
  );
  for (const side of [-1, 1])
    addClothLayer(
      `Aurelia_Back_Bow_Ribbon_${side}`,
      velvet,
      6,
      24,
      (u, v) => ({
        u: 0.5 + side * (0.018 + v * 0.025) + (u - 0.5) * 0.014,
        v: 0.025 + v * (0.28 - 0.025 * (1 - Math.abs(u * 2 - 1))),
      }),
      (point) => point.add(new THREE.Vector3(0, 0, -0.012)),
    );
  addClothLayer(
    'Aurelia_Gathered_Ivory_Hem',
    satin,
    192,
    8,
    (u, v) => ({ u, v: 0.93 + v * 0.07 }),
    (point, u, v) => {
      const radius = 0.003 + v * (0.006 + Math.cos(u * TAU * 48) * 0.003);
      return point.add(new THREE.Vector3(Math.sin(u * TAU) * radius, -v * 0.016, Math.cos(u * TAU) * radius));
    },
  );
  addClothLayer(
    'Aurelia_Scalloped_Hem_Lace',
    lace,
    192,
    8,
    (u, v) => ({ u, v: 0.97 + v * 0.03 }),
    (point, u, v) => {
      const radius = 0.011 + v * (0.003 + Math.cos(u * TAU * 48) * 0.002);
      return point.add(
        new THREE.Vector3(
          Math.sin(u * TAU) * radius,
          -0.011 - v * (0.018 + Math.cos(u * TAU * 24) * 0.002),
          Math.cos(u * TAU) * radius,
        ),
      );
    },
  );
  const petalCoordinates = Array.from({ length: 145 }, (_, i) => ({ u: i / 144, v: petalHem(i / 144) }));
  seam(
    petalCoordinates.map(({ u, v }) =>
      skirtSurface(u * TAU, v).add(new THREE.Vector3(Math.sin(u * TAU) * 0.008, 0, Math.cos(u * TAU) * 0.008)),
    ),
    0.0012,
    'Aurelia_Petal_Gold_Binding',
    petalCoordinates,
  );
  for (const v of [0.015, 0.035, 0.965]) {
    const coords = Array.from({ length: 97 }, (_, i) => ({ u: i / 96, v }));
    seam(
      coords.map(({ u, v }) => skirtSurface(u * TAU, v).multiply(new THREE.Vector3(1.012, 1, 1.012))),
      v < 0.1 ? 0.0015 : 0.0018,
      `Aurelia_Cloth_Binding_${v}`,
      coords,
    );
  }
  // Gold binding is batched by deformation mode: rich detailing without one draw call per stitch.
  for (const { binding, name } of [
    { binding: 'torso', name: 'Aurelia_Bodice_Goldwork' },
    { binding: 'hips', name: 'Aurelia_Sash_Goldwork' },
    { binding: 'cloth', name: 'Aurelia_Cloth_Goldwork' },
  ] as const) {
    const entries = pendingGold.filter((entry) => entry.binding === binding);
    if (!entries.length) continue;
    const geometry = mergeGeometries(entries.map((entry) => entry.geometry));
    if (!geometry) throw new Error(`Could not merge ${name} geometry.`);
    weighted(geometry, gold, name, binding !== 'torso', false);
    animated.push({
      geometry,
      rest: Float32Array.from(geometry.getAttribute('position').array),
      ...(binding === 'cloth' ? { cloth: entries.flatMap((entry) => entry.cloth!) } : {}),
    });
    entries.forEach((entry) => entry.geometry.dispose());
  }
  shoulderFit.dispose();
  const hipTransform = new THREE.Matrix4(),
    scratch = new THREE.Vector3();
  const colliders: ClothCapsule[] = [
    { a: new THREE.Vector3(), b: new THREE.Vector3(), radius: 0.071 },
    { a: new THREE.Vector3(), b: new THREE.Vector3(), radius: 0.071 },
  ];
  const legs = (['left', 'right'] as const).map((side) => ({
    upper: vrm.humanoid.getRawBoneNode(`${side}UpperLeg`)!,
    lower: vrm.humanoid.getRawBoneNode(`${side}LowerLeg`)!,
  }));
  let breath = 0;
  return {
    update(delta, breathing) {
      vrm.scene.updateMatrixWorld(true);
      hipTransform.multiplyMatrices(hips.matrixWorld, skeleton!.boneInverses[hipIndex]);
      legs.forEach((leg, i) => {
        leg.upper.getWorldPosition(colliders[i].a);
        leg.lower.getWorldPosition(colliders[i].b);
      });
      cloth.advance(delta, hipTransform, colliders);
      breath = delta > 0 ? THREE.MathUtils.damp(breath, breathing, 12, Math.min(delta, 0.05)) : breathing;
      for (const entry of animated) {
        const positions = entry.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < positions.count; i++) {
          if (entry.cloth) {
            const binding = entry.cloth[i];
            cloth.sample(binding.u, binding.v, scratch).add(binding.offset);
          } else {
            scratch.fromArray(entry.rest, i * 3);
            const front = THREE.MathUtils.smoothstep(scratch.z, 0.025, 0.13);
            const expansion = Math.exp(-Math.pow((scratch.y - 1.17) / 0.085, 2)) * front;
            scratch.z += breath * 0.18 * expansion;
            scratch.y += breath * 0.12 * expansion;
          }
          positions.setXYZ(i, scratch.x, scratch.y, scratch.z);
        }
        positions.needsUpdate = true;
        entry.geometry.computeVertexNormals();
      }
    },
  };
}
