import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import { sculptSeraphineFace } from './seraphineFace';

interface SourceDocument {
  materials: { name: string }[];
  meshes: {
    name: string;
    extras?: { targetNames?: string[] };
    primitives: {
      material: number;
      attributes: Record<string, number>;
      indices: number;
      targets?: Record<string, number>[];
    }[];
  }[];
  accessors: {
    bufferView?: number;
    byteOffset?: number;
    count: number;
    type: string;
    componentType: number;
    sparse?: {
      count: number;
      indices: { bufferView: number; byteOffset?: number; componentType: number };
      values: { bufferView: number; byteOffset?: number };
    };
  }[];
  bufferViews: { byteOffset?: number; byteStride?: number }[];
}

/** Read the actual facial surfaces and sparse morph deltas without requiring browser texture decoding. */
function sourceFace() {
  const bytes = readFileSync(new URL('../../../public/models/aurelia-3d/base.vrm', import.meta.url));
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString()) as SourceDocument;
  const binary = bytes.subarray(28 + jsonLength);
  const componentSize = (type: number) => (type === 5123 ? 2 : type === 5121 ? 1 : 4);
  const read = (offset: number, type: number) =>
    type === 5126
      ? binary.readFloatLE(offset)
      : type === 5123
        ? binary.readUInt16LE(offset)
        : type === 5121
          ? binary.readUInt8(offset)
          : binary.readUInt32LE(offset);
  const accessor = (index: number) => {
    const a = document.accessors[index];
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type]!;
    const values = new Float32Array(a.count * size);
    if (a.bufferView !== undefined) {
      const view = document.bufferViews[a.bufferView];
      for (let i = 0; i < a.count; i++)
        for (let c = 0; c < size; c++)
          values[i * size + c] = read(
            (view.byteOffset ?? 0) +
              (a.byteOffset ?? 0) +
              i * (view.byteStride ?? size * componentSize(a.componentType)) +
              c * componentSize(a.componentType),
            a.componentType,
          );
    }
    if (a.sparse) {
      const { indices, values: sparseValues, count } = a.sparse;
      const indexOffset = (document.bufferViews[indices.bufferView].byteOffset ?? 0) + (indices.byteOffset ?? 0);
      const valueOffset =
        (document.bufferViews[sparseValues.bufferView].byteOffset ?? 0) + (sparseValues.byteOffset ?? 0);
      for (let i = 0; i < count; i++) {
        const vertex = read(indexOffset + i * componentSize(indices.componentType), indices.componentType);
        for (let c = 0; c < size; c++)
          values[vertex * size + c] = read(valueOffset + (i * size + c) * 4, a.componentType);
      }
    }
    return new THREE.BufferAttribute(values, size);
  };
  const scene = new THREE.Group();
  const meshes = new Map<string, THREE.Mesh>();
  for (const mesh of document.meshes) {
    for (const primitive of mesh.primitives) {
      const name = document.materials[primitive.material].name;
      if (mesh.name !== 'Face' && name !== 'Body_00_SKIN') continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', accessor(primitive.attributes.POSITION));
      geometry.setAttribute('normal', accessor(primitive.attributes.NORMAL));
      geometry.setIndex(Array.from(accessor(primitive.indices).array));
      geometry.morphTargetsRelative = true;
      for (const [name, key] of [
        ['position', 'POSITION'],
        ['normal', 'NORMAL'],
      ] as const)
        geometry.morphAttributes[name] = (primitive.targets ?? []).map((target, i) => {
          const result =
            target[key] === undefined
              ? new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute('position').count * 3), 3)
              : accessor(target[key]);
          result.name = mesh.extras?.targetNames?.[i] ?? String(i);
          return result;
        });
      const material = new THREE.MeshBasicMaterial();
      material.name = name;
      const object = new THREE.Mesh(geometry, material);
      object.name = name;
      scene.add(object);
      meshes.set(name, object);
    }
  }
  return { scene, meshes, vrm: { scene } as unknown as VRM };
}

const vertex = (geometry: THREE.BufferGeometry, index: number, morph?: number) => {
  const point = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), index);
  if (morph !== undefined)
    point.add(new THREE.Vector3().fromBufferAttribute(geometry.morphAttributes.position[morph], index));
  return point;
};

describe('Seraphine facial sculpt on the shipped VRM', () => {
  let source: ReturnType<typeof sourceFace>;
  let originals: Map<string, THREE.BufferGeometry>;
  beforeAll(() => {
    source = sourceFace();
    originals = new Map([...source.meshes].map(([name, mesh]) => [name, mesh.geometry]));
    sculptSeraphineFace(source.vrm);
  });

  it('keeps open expressive eyes and a soft shorter lower face while retaining the fitted skull and neck', () => {
    const iris = source.meshes.get('EyeIris_00_EYE')!.geometry;
    const originalIris = originals.get('EyeIris_00_EYE')!;
    iris.computeBoundingBox();
    originalIris.computeBoundingBox();
    const height = iris.boundingBox!.max.y - iris.boundingBox!.min.y;
    const originalHeight = originalIris.boundingBox!.max.y - originalIris.boundingBox!.min.y;
    expect(height).toBeLessThan(originalHeight);
    expect(height).toBeGreaterThan(originalHeight * 0.95);
    const face = source.meshes.get('Face_00_SKIN')!.geometry;
    const originalFace = originals.get('Face_00_SKIN')!;
    let narrowed = 0;
    let roundedChin = 0;
    let preserved = 0;
    for (let i = 0; i < face.getAttribute('position').count; i++) {
      const before = vertex(originalFace, i);
      const after = vertex(face, i);
      if (before.y > 1.384 && before.y < 1.404 && Math.abs(before.x) > 0.048 && before.z > 0.027) {
        expect(Math.abs(after.x)).toBeLessThan(Math.abs(before.x) * 0.995);
        expect(Math.abs(after.x)).toBeGreaterThan(Math.abs(before.x) * 0.97);
        narrowed++;
      }
      if (before.y < 1.371 && before.y > 1.35 && Math.abs(before.x) < 0.016 && before.z > 0.027) {
        expect(after.y - before.y).toBeGreaterThan(0.0001);
        expect(after.y - before.y).toBeLessThan(0.003);
        roundedChin++;
      }
      if (before.y >= 1.523 || before.z <= -0.025) {
        expect(after.distanceTo(before)).toBeLessThan(1e-7);
        preserved++;
      }
    }
    expect(narrowed).toBeGreaterThan(10);
    expect(roundedChin).toBeGreaterThan(3);
    expect(preserved).toBeGreaterThan(100);
    const body = source.meshes.get('Body_00_SKIN')!.geometry;
    for (let i = 0; i < body.getAttribute('position').count; i++) {
      const before = vertex(originals.get('Body_00_SKIN')!, i);
      if (before.y <= 1.34) expect(vertex(body, i).distanceTo(before)).toBeLessThan(1e-7);
    }
  });

  it('keeps shared eyelid and sclera vertices together in neutral and all blink endpoints', () => {
    const originalSkin = originals.get('Face_00_SKIN')!;
    const originalWhite = originals.get('EyeWhite_00_EYE')!;
    const skin = source.meshes.get('Face_00_SKIN')!.geometry;
    const white = source.meshes.get('EyeWhite_00_EYE')!.geometry;
    for (const suffix of [undefined, 'Fcl_EYE_Close', 'Fcl_EYE_Close_L', 'Fcl_EYE_Close_R']) {
      const morph =
        suffix === undefined
          ? undefined
          : originalSkin.morphAttributes.position.findIndex((attribute) => attribute.name.endsWith(suffix));
      const whiteVertices = Array.from({ length: originalWhite.getAttribute('position').count }, (_, i) =>
        vertex(originalWhite, i, morph),
      );
      let connections = 0;
      for (let i = 0; i < originalSkin.getAttribute('position').count; i++) {
        const point = vertex(originalSkin, i, morph);
        const match = whiteVertices.findIndex((whitePoint) => point.distanceToSquared(whitePoint) < 1e-12);
        if (match < 0) continue;
        expect(vertex(skin, i, morph).distanceTo(vertex(white, match, morph))).toBeLessThan(0.000002);
        connections++;
      }
      expect(connections).toBeGreaterThan(20);
    }
  });

  it('retains all 57 facial morphs, finite geometry and smooth unit normals without mutating source buffers', () => {
    for (const [name, mesh] of source.meshes) {
      const original = originals.get(name)!;
      expect(mesh.geometry).not.toBe(original);
      expect(mesh.geometry.getAttribute('position').array).not.toBe(original.getAttribute('position').array);
      if (name !== 'Body_00_SKIN') expect(mesh.geometry.morphAttributes.position).toHaveLength(57);
      for (const [key, attributes] of Object.entries(mesh.geometry.morphAttributes)) {
        expect(attributes.map((attribute) => attribute.name)).toEqual(
          original.morphAttributes[key as 'position' | 'normal'].map((attribute) => attribute.name),
        );
        expect(attributes.every((attribute) => Array.from(attribute.array).every(Number.isFinite))).toBe(true);
      }
      const normals = mesh.geometry.getAttribute('normal');
      for (let i = 0; i < normals.count; i++) {
        const length = new THREE.Vector3().fromBufferAttribute(normals, i).length();
        expect(length === 0 || Math.abs(length - 1) < 1e-6).toBe(true);
      }
    }
    const pristine = sourceFace();
    for (const [name, original] of originals)
      expect(original.getAttribute('position').array).toEqual(
        pristine.meshes.get(name)!.geometry.getAttribute('position').array,
      );
  });

  it('is idempotent so repeated appearance setup cannot compound the sculpt', () => {
    const geometries = [...source.meshes.values()].map((mesh) => mesh.geometry);
    sculptSeraphineFace(source.vrm);
    expect([...source.meshes.values()].map((mesh) => mesh.geometry)).toEqual(geometries);
  });
});

it('bakes absolute and relative targets identically across transformed mesh coordinates', () => {
  const points = [0.041, 1.455, 0.06, 0.05, 1.438, 0.054, 0.014, 1.391, 0.069];
  const deltas = [0.002, -0.02, -0.002, 0, -0.002, -0.001, 0.002, -0.007, -0.002];
  const results: { points: THREE.Vector3[]; targets: THREE.Vector3[] }[] = [];
  for (const relative of [true, false]) {
    const scene = new THREE.Group();
    const group = new THREE.Group();
    if (!relative) {
      group.position.set(0.12, -0.13, 0.09);
      group.rotation.set(0.12, -0.17, 0.06);
      group.scale.set(1.1, 0.9, 1.03);
    }
    scene.add(group);
    scene.updateMatrixWorld(true);
    const inverse = group.matrixWorld.clone().invert();
    const bases: number[] = [];
    const targets: number[] = [];
    for (let i = 0; i < points.length; i += 3) {
      const base = new THREE.Vector3().fromArray(points, i).applyMatrix4(inverse);
      const endpoint = new THREE.Vector3()
        .fromArray(points, i)
        .add(new THREE.Vector3().fromArray(deltas, i))
        .applyMatrix4(inverse);
      base.toArray(bases, i);
      (relative ? endpoint.sub(base) : endpoint).toArray(targets, i);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(bases, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(targets, 3)];
    geometry.morphTargetsRelative = relative;
    const material = new THREE.MeshBasicMaterial();
    material.name = 'Face_00_SKIN';
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    sculptSeraphineFace({ scene } as unknown as VRM);
    results.push({
      points: Array.from({ length: 3 }, (_, i) => vertex(mesh.geometry, i).applyMatrix4(mesh.matrixWorld)),
      targets: Array.from({ length: 3 }, (_, i) => {
        const endpoint = new THREE.Vector3().fromBufferAttribute(mesh.geometry.morphAttributes.position[0], i);
        if (relative) endpoint.add(vertex(mesh.geometry, i));
        return endpoint.applyMatrix4(mesh.matrixWorld);
      }),
    });
  }
  for (const key of ['points', 'targets'] as const)
    for (let i = 0; i < 3; i++) expect(results[0][key][i].distanceTo(results[1][key][i])).toBeLessThan(1e-6);
});
