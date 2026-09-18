import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import { bindAureliaGeometry, getAureliaSkeleton } from './aureliaSkinning';
import { addAureliaBody } from './aureliaBody';
import { addAureliaFootwear } from './aureliaFootwear';
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
  const skeleton = getAureliaSkeleton(vrm);
  const hips = vrm.humanoid.getRawBoneNode('hips')!;
  const hipIndex = skeleton.bones.findIndex((bone) => bone === hips);
  const animated: AnimatedGeometry[] = [];
  const weighted = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string, skirt = false) => {
    const mesh = bindAureliaGeometry(vrm, geometry, material, name, skirt ? 'hips' : 'torso');
    mesh.userData.aureliaOuterGarment = true;
    return mesh;
  };
  const silk = new THREE.MeshPhysicalMaterial({
    name: 'Aurelia_midnight_silk',
    color: '#263859',
    roughness: 0.66,
    metalness: 0,
    sheen: 0.42,
    sheenColor: '#8c83a8',
    sheenRoughness: 0.72,
    side: THREE.DoubleSide,
  });
  const bodiceMaterial = silk.clone();
  bodiceMaterial.name = 'Aurelia_tailored_brocade';
  bodiceMaterial.color.set('white');
  bodiceMaterial.vertexColors = true;
  const satin = new THREE.MeshPhysicalMaterial({
    name: 'Aurelia_ivory_satin',
    color: '#e6dbc9',
    roughness: 0.61,
    sheen: 0.5,
    sheenColor: '#efddc6',
    sheenRoughness: 0.55,
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: 'Aurelia_fine_gold_embroidery',
    color: '#cba564',
    metalness: 0.67,
    roughness: 0.35,
  });
  const navy = new THREE.Color('#253959'),
    ivory = new THREE.Color('#e8decb');
  const bodice = surface(96, 40, (u, v) => bodiceSurface(u * TAU, v));
  const colors: number[] = [];
  const bodiceUV = bodice.getAttribute('uv');
  for (let i = 0; i < bodiceUV.count; i++) {
    const phi = bodiceUV.getX(i) * TAU;
    const panel = THREE.MathUtils.smoothstep(Math.cos(phi), 0.47, 0.6);
    const color = navy.clone().lerp(ivory, panel);
    colors.push(color.r, color.g, color.b);
  }
  bodice.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  weighted(bodice, bodiceMaterial, 'Aurelia_Sculpted_Bodice');
  animated.push({ geometry: bodice, rest: Float32Array.from(bodice.getAttribute('position').array) });

  const choker = surface(64, 4, (u, v) => chokerSurface(u * TAU, v));
  weighted(choker, silk, 'Aurelia_Velvet_Choker');
  for (const side of [-1, 1]) {
    const strap = surface(8, 32, (u, v) => shoulderStrap(side, v, (u - 0.5) * 2), side < 0);
    weighted(strap, silk, `Aurelia_Shoulder_Strap_${side}`);
    animated.push({ geometry: strap, rest: Float32Array.from(strap.getAttribute('position').array) });
  }
  const seam = (
    points: THREE.Vector3[],
    radius: number,
    name: string,
    clothCoordinates?: { u: number; v: number }[],
  ) => {
    const curve = new THREE.CatmullRomCurve3(points);
    const segments = Math.max(32, points.length * 2);
    const geometry = new THREE.TubeGeometry(curve, segments, radius, 5, false);
    weighted(geometry, gold, name, Boolean(clothCoordinates));
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
      animated.push({ geometry, rest, cloth: bindings });
    } else animated.push({ geometry, rest });
  };
  for (const v of [0, 1])
    seam(
      Array.from({ length: 65 }, (_, i) => chokerSurface((i / 64) * TAU, v)),
      0.00065,
      `Aurelia_Choker_Binding_${v}`,
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
  addSkirt('Aurelia_Cloth_Skirt', silk, 0);
  addSkirt('Aurelia_Satin_Lining', satin, 1);
  for (const v of [0.015, 0.035, 0.965]) {
    const coords = Array.from({ length: 97 }, (_, i) => ({ u: i / 96, v }));
    seam(
      coords.map(({ u, v }) => skirtSurface(u * TAU, v).multiply(new THREE.Vector3(1.012, 1, 1.012))),
      v < 0.1 ? 0.0015 : 0.0018,
      `Aurelia_Cloth_Binding_${v}`,
      coords,
    );
  }
  // Repeating stitched constellations are attached to material coordinates, not separate bones.
  for (let i = 0; i < 12; i++) {
    const u = i / 12,
      v = 0.81;
    for (const vertical of [true, false]) {
      const coords = vertical
        ? [
            { u, v: v - 0.018 },
            { u, v: v + 0.018 },
          ]
        : [
            { u: u - 0.0038, v },
            { u: u + 0.0038, v },
          ];
      seam(
        coords.map(({ u, v }) => skirtSurface(u * TAU, v).multiply(new THREE.Vector3(1.013, 1, 1.013))),
        0.00095,
        `Aurelia_Cloth_Stitch_${i}_${vertical}`,
        coords,
      );
    }
  }
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
