import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MToonMaterial, type VRM } from '@pixiv/three-vrm';
import { addSeraphineWardrobe } from './seraphineWardrobe';
interface SourceDocument {
  scene: number;
  scenes: { nodes: number[] }[];
  nodes: {
    name: string;
    translation?: number[];
    rotation?: number[];
    scale?: number[];
    children?: number[];
    mesh?: number;
    skin?: number;
  }[];
  meshes: { primitives: { attributes: Record<string, number>; indices: number; material: number }[] }[];
  materials: { name: string }[];
  skins: { joints: number[]; inverseBindMatrices: number }[];
  accessors: { bufferView: number; byteOffset?: number; count: number; type: string; componentType: number }[];
  bufferViews: { byteOffset?: number; byteStride?: number }[];
  extensions: { VRMC_vrm: { humanoid: { humanBones: Record<string, { node: number }> } } };
}

/** Decode only the shipped skin and its real skeleton; textures and a browser are unnecessary. */
function sourceFixture() {
  const bytes = readFileSync(new URL('../../../public/models/aurelia-3d/base.vrm', import.meta.url));
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString()) as SourceDocument;
  const binary = bytes.subarray(28 + jsonLength);
  const accessor = (index: number) => {
    const attribute = document.accessors[index];
    const view = document.bufferViews[attribute.bufferView];
    const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[attribute.type]!;
    const componentBytes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[attribute.componentType]!;
    const values: number[] = [];
    for (let i = 0; i < attribute.count; i++) {
      for (let component = 0; component < size; component++) {
        const offset =
          (view.byteOffset ?? 0) +
          (attribute.byteOffset ?? 0) +
          i * (view.byteStride ?? size * componentBytes) +
          component * componentBytes;
        values.push(
          attribute.componentType === 5126
            ? binary.readFloatLE(offset)
            : attribute.componentType === 5123
              ? binary.readUInt16LE(offset)
              : attribute.componentType === 5121
                ? binary.readUInt8(offset)
                : binary.readUInt32LE(offset),
        );
      }
    }
    return { values, size };
  };
  const nodes = document.nodes.map((node) => {
    const bone = new THREE.Bone();
    bone.name = node.name;
    bone.position.fromArray(node.translation ?? [0, 0, 0]);
    bone.quaternion.fromArray(node.rotation ?? [0, 0, 0, 1]);
    bone.scale.fromArray(node.scale ?? [1, 1, 1]);
    return bone;
  });
  document.nodes.forEach((node, i) => node.children?.forEach((child) => nodes[i].add(nodes[child])));
  const scene = new THREE.Group();
  for (const node of document.scenes[document.scene ?? 0].nodes) scene.add(nodes[node]);
  const skinMaterial = document.materials.findIndex((material) => material.name === 'Body_00_SKIN');
  const meshIndex = document.meshes.findIndex((mesh) => mesh.primitives.some((p) => p.material === skinMaterial));
  const nodeIndex = document.nodes.findIndex((node) => node.mesh === meshIndex);
  const primitive = document.meshes[meshIndex].primitives.find((p) => p.material === skinMaterial)!;
  const geometry = new THREE.BufferGeometry();
  for (const [name, key] of Object.entries({
    position: 'POSITION',
    normal: 'NORMAL',
    skinIndex: 'JOINTS_0',
    skinWeight: 'WEIGHTS_0',
  })) {
    const { values, size } = accessor(primitive.attributes[key]);
    geometry.setAttribute(
      name,
      name === 'skinIndex'
        ? new THREE.Uint16BufferAttribute(values, size)
        : new THREE.Float32BufferAttribute(values, size),
    );
  }
  geometry.setIndex(accessor(primitive.indices).values);
  const skin = document.skins[document.nodes[nodeIndex].skin!];
  const inverses = accessor(skin.inverseBindMatrices).values;
  const skeleton = new THREE.Skeleton(
    skin.joints.map((joint) => nodes[joint]),
    skin.joints.map((_, i) => new THREE.Matrix4().fromArray(inverses, i * 16)),
  );
  const material = new MToonMaterial();
  material.name = 'Body_00_SKIN';
  const source = new THREE.SkinnedMesh(geometry, material);
  nodes[nodeIndex].add(source);
  scene.updateMatrixWorld(true);
  source.bind(skeleton, new THREE.Matrix4());
  const bone = (name: string) => nodes[document.extensions.VRMC_vrm.humanoid.humanBones[name].node];
  const vrm = { scene, humanoid: { getRawBoneNode: bone } } as unknown as VRM;
  return { source, vrm, scene, skeleton, bone };
}

describe('Seraphine armour on the shipped humanoid', () => {
  let fixture: ReturnType<typeof sourceFixture>;
  let wardrobe: ReturnType<typeof addSeraphineWardrobe>;
  let armour: THREE.SkinnedMesh[];
  beforeAll(() => {
    fixture = sourceFixture();
    wardrobe = addSeraphineWardrobe(fixture.vrm);
    armour = [];
    fixture.scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh && object.userData.aureliaOuterGarment) armour.push(object);
    });
  });

  it('exports finite, normalized skinned geometry across the articulated suit', () => {
    expect(armour.length).toBeGreaterThan(30);
    expect(armour.length).toBeLessThan(110);
    for (const mesh of armour) {
      expect(mesh.name.startsWith('Seraphine_')).toBe(true);
      expect(mesh.skeleton).toBe(fixture.skeleton);
      for (const name of ['position', 'normal', 'uv', 'skinWeight']) {
        const attribute = mesh.geometry.getAttribute(name);
        expect(Array.from(attribute.array).every(Number.isFinite), `${mesh.name}:${name}`).toBe(true);
      }
      const weights = mesh.geometry.getAttribute('skinWeight');
      const indices = mesh.geometry.getAttribute('skinIndex');
      for (let vertex = 0; vertex < weights.count; vertex += 31) {
        let total = 0;
        for (let component = 0; component < 4; component++) {
          total += weights.getComponent(vertex, component);
          expect(indices.getComponent(vertex, component)).toBeLessThan(fixture.skeleton.bones.length);
        }
        expect(total).toBeCloseTo(1, 5);
      }
    }
  });

  it('moves a vambrace with its elbow and keeps the forged plate rigid', () => {
    const mesh = armour.find((part) => part.name === 'Seraphine_leftLowerArm_Moonsteel')!;
    expect(mesh).toBeDefined();
    const position = mesh.geometry.getAttribute('position');
    const first = new THREE.Vector3().fromBufferAttribute(position, 0);
    const last = new THREE.Vector3().fromBufferAttribute(position, position.count - 1);
    fixture.scene.updateMatrixWorld(true);
    fixture.skeleton.update();
    const beforeA = mesh.applyBoneTransform(0, first.clone());
    const beforeB = mesh.applyBoneTransform(position.count - 1, last.clone());
    const elbow = fixture.bone('leftLowerArm');
    const initial = elbow.quaternion.clone();
    elbow.rotateZ(0.4);
    fixture.scene.updateMatrixWorld(true);
    fixture.skeleton.update();
    const afterA = mesh.applyBoneTransform(0, first.clone());
    const afterB = mesh.applyBoneTransform(position.count - 1, last.clone());
    expect(afterA.distanceTo(beforeA)).toBeGreaterThan(0.003);
    expect(afterA.distanceTo(afterB)).toBeCloseTo(beforeA.distanceTo(beforeB), 6);
    elbow.quaternion.copy(initial);
    fixture.scene.updateMatrixWorld(true);
    fixture.skeleton.update();
  });

  it('pins the silk to the belt while animating the skirt and its embroidered edges together', () => {
    const mesh = armour.find((part) => part.name === 'Seraphine_cloth_Royal_Damask')!;
    const trim = armour.find((part) => part.name === 'Seraphine_cloth_Champagne_Inlay')!;
    const position = mesh.geometry.getAttribute('position');
    const goldPosition = trim.geometry.getAttribute('position');
    const rest = Float32Array.from(position.array);
    const goldRest = Float32Array.from(goldPosition.array);
    wardrobe.update(0.05, 0.5);
    let pinned = 0,
      moved = 0;
    for (let i = 0; i < position.count; i++) {
      expect(position.getY(i)).toBe(rest[i * 3 + 1]);
      if (rest[i * 3 + 1] >= 0.956) {
        expect(position.getX(i)).toBe(rest[i * 3]);
        expect(position.getZ(i)).toBe(rest[i * 3 + 2]);
        pinned++;
      } else if (Math.abs(position.getX(i) - rest[i * 3]) > 0.0001) moved++;
    }
    expect(pinned).toBeGreaterThan(30);
    expect(moved).toBeGreaterThan(100);
    expect(Array.from(goldPosition.array).some((value, i) => Math.abs(value - goldRest[i]) > 0.0001)).toBe(true);
  });
});
