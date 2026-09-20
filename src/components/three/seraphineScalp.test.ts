import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';
import { createSeraphineScalpSurface } from './seraphineScalp';

interface SourceDocument {
  materials: { name: string }[];
  meshes: { primitives: { material: number; attributes: { POSITION: number }; indices: number }[] }[];
  accessors: {
    bufferView: number;
    byteOffset?: number;
    count: number;
    type: 'SCALAR' | 'VEC3';
    componentType: number;
  }[];
  bufferViews: { byteOffset?: number; byteStride?: number }[];
}

/** Decode the shipped neutral skin without loading browser-only VRM textures. */
function sourceSkull(): THREE.Group {
  const bytes = readFileSync(new URL('../../../public/models/aurelia-3d/base.vrm', import.meta.url));
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString()) as SourceDocument;
  const binary = bytes.subarray(28 + jsonLength);
  const accessor = (index: number) => {
    const a = document.accessors[index];
    const view = document.bufferViews[a.bufferView];
    const size = a.type === 'SCALAR' ? 1 : 3;
    const componentSize = a.componentType === 5123 ? 2 : 4;
    const values: number[] = [];
    for (let i = 0; i < a.count; i++)
      for (let c = 0; c < size; c++) {
        const offset =
          (view.byteOffset ?? 0) +
          (a.byteOffset ?? 0) +
          i * (view.byteStride ?? size * componentSize) +
          c * componentSize;
        values.push(
          a.componentType === 5126
            ? binary.readFloatLE(offset)
            : a.componentType === 5123
              ? binary.readUInt16LE(offset)
              : binary.readUInt32LE(offset),
        );
      }
    return values;
  };
  const scene = new THREE.Group();
  for (const mesh of document.meshes)
    for (const primitive of mesh.primitives) {
      const name = document.materials[primitive.material].name;
      if (!/^(Face|Body).*SKIN$/.test(name)) continue;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(accessor(primitive.attributes.POSITION), 3));
      geometry.setIndex(accessor(primitive.indices));
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      material.name = name;
      scene.add(new THREE.Mesh(geometry, material));
    }
  return scene;
}

describe('Seraphine scalp fitting', () => {
  let scene: THREE.Group;
  let sample: ReturnType<typeof createSeraphineScalpSurface>;
  beforeAll(() => {
    scene = sourceSkull();
    sample = createSeraphineScalpSurface({ scene } as VRM);
  });

  it('stays a few millimetres outside the actual crown, forehead, temples and rear skull', () => {
    const center = new THREE.Vector3(0, 1.486, -0.027);
    const raycaster = new THREE.Raycaster();
    for (const angle of [0.017, 0.72, 1.57, 2.41, Math.PI, 4.11, 5.77]) {
      for (const polar of [0, 0.37, 0.81, 1.12, 1.31, 1.57, 1.94]) {
        // Stay above the haircut's sloping temple line instead of sampling the eye sockets.
        if (Math.cos(angle) > 0.6 && polar > 1.31) continue;
        if (Math.cos(angle) > -0.3 && polar > 1.7) continue;
        const hair = sample(angle, polar);
        const direction = hair.clone().sub(center).normalize();
        raycaster.set(center.clone().addScaledVector(direction, 0.35), direction.clone().negate());
        const skin = raycaster.intersectObjects(scene.children, false)[0].point;
        const clearance = hair.distanceTo(center) - skin.distanceTo(center);
        expect(clearance).toBeGreaterThan(0.0027);
        expect(clearance, `angle ${angle}, polar ${polar}`).toBeLessThan(0.0055);
      }
    }
    // The shipped skull is substantially lower than the previous 1.613 m analytic hair cap.
    expect(sample(0, 0).y).toBeLessThan(1.6);
    expect(sample(0, 0).y).toBeGreaterThan(1.594);
  });

  it('joins the angular seam and crown without a discontinuity', () => {
    for (const polar of [0, 0.35, 0.81, 1.47, 2.13]) {
      expect(sample(-0.000001, polar).distanceTo(sample(0.000001, polar))).toBeLessThan(0.000001);
      expect(sample(0.73, polar).distanceTo(sample(0.73 + Math.PI * 2, polar))).toBeLessThan(1e-12);
    }
    for (let angle = 0; angle < Math.PI * 2; angle += 0.31)
      expect(sample(angle, 0).distanceTo(sample(0, 0))).toBeLessThan(1e-12);
  });

  it('ignores expanded outline meshes and does not change skin geometry', () => {
    const originals = scene.children.map((object) =>
      (object as THREE.Mesh).geometry.getAttribute('position').array.slice(),
    );
    const outlineGeometry = new THREE.SphereGeometry(0.18, 16, 12);
    outlineGeometry.translate(0, 1.486, -0.027);
    const outlineMaterial = new THREE.MeshBasicMaterial();
    outlineMaterial.name = 'Face_00_SKIN';
    Object.assign(outlineMaterial, { isOutline: true });
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    scene.add(outline);
    const withOutline = createSeraphineScalpSurface({ scene } as VRM);
    expect(withOutline(0.4, 1.1).distanceTo(sample(0.4, 1.1))).toBeLessThan(1e-12);
    scene.remove(outline);
    scene.children.forEach((object, index) => {
      expect((object as THREE.Mesh).geometry.getAttribute('position').array).toEqual(originals[index]);
    });
  });

  it('provides a finite fallback when the optional skin surfaces are absent', () => {
    const fallback = createSeraphineScalpSurface({ scene: new THREE.Group() } as VRM);
    for (const angle of [-Math.PI, 0, Math.PI / 2, Math.PI * 4])
      for (const polar of [0, 1, 2.13]) expect(fallback(angle, polar).toArray().every(Number.isFinite)).toBe(true);
  });
});
