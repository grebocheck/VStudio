import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MToonMaterial, type VRM } from '@pixiv/three-vrm';
import { addAureliaBody, type AureliaBody } from './aureliaBody';
import { addAureliaWardrobe } from './aureliaWardrobe';

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

const positionKey = (point: THREE.Vector3) =>
  point
    .toArray()
    .map((value) => Math.round(value * 1e6))
    .join(',');

function joinedEdges(meshes: THREE.SkinnedMesh[]) {
  const vertices = new Map<string, number>();
  const points: THREE.Vector3[] = [];
  const edges = new Map<string, { count: number; a: number; b: number }>();
  for (const mesh of meshes) {
    const position = mesh.geometry.getAttribute('position');
    const index = mesh.geometry.getIndex()!;
    const ids = Array.from({ length: position.count }, (_, i) => {
      const point = new THREE.Vector3().fromBufferAttribute(position, i);
      const key = positionKey(point);
      if (!vertices.has(key)) {
        vertices.set(key, points.length);
        points.push(point);
      }
      return vertices.get(key)!;
    });
    for (let i = 0; i < index.count; i += 3)
      for (let edge = 0; edge < 3; edge++) {
        const a = ids[index.getX(i + edge)],
          b = ids[index.getX(i + ((edge + 1) % 3))];
        const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
        if (!edges.has(key)) edges.set(key, { count: 0, a, b });
        edges.get(key)!.count++;
      }
  }
  return { points, edges: [...edges.values()] };
}

describe('Aurelia continuous body on the shipped VRM', () => {
  let fixture: ReturnType<typeof sourceFixture>;
  let body: AureliaBody;
  beforeAll(() => {
    fixture = sourceFixture();
    body = addAureliaBody(fixture.vrm)!;
    expect(body).toBeDefined();
  });

  it('joins waist, neck and both arm roots without open or overlapping boundary edges', () => {
    const { points, edges } = joinedEdges([fixture.source, body.torso]);
    const openings = edges.filter(
      ({ count, a, b }) => count === 1 && [points[a], points[b]].every((point) => point.y > 1.019 && point.y < 1.345),
    );
    expect(openings).toHaveLength(0);
    expect(edges.filter(({ count }) => count > 2)).toHaveLength(0);
    expect(edges.every(({ a, b }) => a !== b)).toBe(true);
  });

  it('uses compact surface triangles rather than long chords across the curved torso', () => {
    const geometry = body.torso.geometry,
      position = geometry.getAttribute('position'),
      index = geometry.getIndex()!;
    const lengths: number[] = [];
    const a = new THREE.Vector3(),
      b = new THREE.Vector3();
    for (let i = 0; i < index.count; i += 3)
      for (let edge = 0; edge < 3; edge++) {
        a.fromBufferAttribute(position, index.getX(i + edge));
        b.fromBufferAttribute(position, index.getX(i + ((edge + 1) % 3)));
        lengths.push(a.distanceTo(b));
      }
    lengths.sort((a, b) => a - b);
    expect(lengths.every(Number.isFinite)).toBe(true);
    expect(lengths.at(-1)).toBeLessThan(0.035);
    expect(lengths[Math.floor(lengths.length * 0.99)]).toBeLessThan(0.025);
  });

  it('keeps all four source seams coincident during neck turns and relaxed arm poses', () => {
    const sourcePosition = fixture.source.geometry.getAttribute('position');
    const torsoPosition = body.torso.geometry.getAttribute('position');
    const sourceVertices = new Map<string, number>();
    for (const i of fixture.source.geometry.getIndex()!.array)
      sourceVertices.set(positionKey(new THREE.Vector3().fromBufferAttribute(sourcePosition, i)), i);
    const pairs: [number, number][] = [];
    const regions = new Set<string>();
    for (let i = 0; i < torsoPosition.count; i++) {
      const point = new THREE.Vector3().fromBufferAttribute(torsoPosition, i);
      const original = sourceVertices.get(positionKey(point));
      if (original === undefined) continue;
      pairs.push([i, original]);
      regions.add(
        Math.abs(point.y - 1.02) < 1e-5
          ? 'waist'
          : Math.abs(point.y - 1.344) < 1e-5
            ? 'neck'
            : point.x > 0
              ? 'left arm'
              : 'right arm',
      );
    }
    expect(regions.size).toBe(4);
    expect(pairs.length).toBeGreaterThan(100);
    const rest = fixture.skeleton.bones.map((bone) => bone.quaternion.clone());
    let maximumGap = 0;
    for (const angle of [-0.35, 0, 0.35]) {
      fixture.skeleton.bones.forEach((bone, i) => bone.quaternion.copy(rest[i]));
      fixture
        .bone('neck')
        .quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(angle, angle * 0.6, angle * 0.7)));
      fixture
        .bone('spine')
        .quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle * 0.4));
      for (const [side, sign] of [
        ['left', 1],
        ['right', -1],
      ] as const)
        fixture
          .bone(`${side}UpperArm`)
          .quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), sign * 1.18));
      fixture.scene.updateMatrixWorld(true);
      fixture.skeleton.update();
      for (const [replacement, original] of pairs) {
        const a = body.torso.getVertexPosition(replacement, new THREE.Vector3());
        const b = fixture.source.getVertexPosition(original, new THREE.Vector3());
        maximumGap = Math.max(maximumGap, a.distanceTo(b));
      }
    }
    expect(maximumGap).toBeLessThan(1e-6);
  });
});

describe('Aurelia shoulder clothing on the shipped VRM', () => {
  it('keeps straps, lace and sleeves outside the skin through arm poses and breathing', () => {
    const { vrm, source, scene, skeleton, bone } = sourceFixture();
    const wardrobe = addAureliaWardrobe(vrm);
    const torso = scene.getObjectByName('Aurelia_Continuous_Torso') as THREE.SkinnedMesh;
    const skin = [source, torso];
    const collisionSkin = skin.map(
      (mesh) => new THREE.Mesh(mesh.geometry.clone(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })),
    );
    const garments: THREE.SkinnedMesh[] = [];
    scene.traverse((object) => {
      if (
        object instanceof THREE.SkinnedMesh &&
        (/Aurelia_Shoulder_(Strap|Lace)/.test(object.name) || object.name.endsWith('Gathered_Princess_Sleeve'))
      )
        garments.push(object);
    });
    expect(garments).toHaveLength(8);
    for (const mesh of garments.filter((garment) => garment.name.includes('Shoulder_'))) {
      // A shoulder fit must not project rear straps sideways onto the distant upper arm.
      mesh.geometry.computeBoundingBox();
      const bounds = mesh.geometry.boundingBox!;
      expect(Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x))).toBeLessThan(0.15);
    }
    const probes = garments.flatMap((mesh) => {
      const position = mesh.geometry.getAttribute('position');
      const sleeve = mesh.name.endsWith('Gathered_Princess_Sleeve');
      const arm = bone(mesh.name.includes('_left_') ? 'leftUpperArm' : 'rightUpperArm');
      const elbow = bone(mesh.name.includes('_left_') ? 'leftLowerArm' : 'rightLowerArm');
      const origin = arm.getWorldPosition(new THREE.Vector3());
      const axis = elbow.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
      return Array.from({ length: position.count }, (_, i) => {
        const point = new THREE.Vector3().fromBufferAttribute(position, i);
        const center = sleeve
          ? origin.clone().addScaledVector(axis, point.clone().sub(origin).dot(axis))
          : new THREE.Vector3(point.x, Math.min(point.y, 1.245), -0.015);
        return { mesh, vertex: i, center };
      }).filter((_, i) => i % 5 === 0);
    });
    const rest = skeleton.bones.map((joint) => joint.quaternion.clone());
    const ray = new THREE.Raycaster();
    let minimumClearance = Infinity,
      checked = 0;
    let closest: unknown;
    for (const [arms, turn, breath] of [
      [0, 0, 0],
      [1.18, 0, 0],
      [0.5, 0.2, 0.006],
      [1.35, -0.2, -0.006],
    ]) {
      skeleton.bones.forEach((joint, i) => joint.quaternion.copy(rest[i]));
      for (const [side, sign] of [
        ['left', 1],
        ['right', -1],
      ] as const)
        bone(`${side}UpperArm`).quaternion.multiply(
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), sign * arms),
        );
      bone('spine').quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn));
      wardrobe.update(0, breath);
      scene.updateMatrixWorld(true);
      skeleton.update();
      // Bake the actual posed skin once; avoid reskinning it for every collision ray.
      skin.forEach((mesh, index) => {
        const geometry = collisionSkin[index].geometry;
        const positions = geometry.getAttribute('position');
        const point = new THREE.Vector3();
        for (let i = 0; i < positions.count; i++) {
          mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld);
          positions.setXYZ(i, point.x, point.y, point.z);
        }
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
      });
      for (const { mesh, vertex, center } of probes) {
        const inside = mesh.applyBoneTransform(vertex, center.clone());
        const point = mesh.getVertexPosition(vertex, new THREE.Vector3());
        const direction = point.clone().sub(inside).normalize();
        ray.set(inside.clone().addScaledVector(direction, 0.3), direction.negate());
        ray.far = 0.3;
        const hit = ray.intersectObjects(collisionSkin, false).at(-1);
        if (!hit) continue;
        const clearance = point.distanceTo(inside) - hit.point.distanceTo(inside);
        if (clearance < minimumClearance)
          closest = {
            name: mesh.name,
            vertex,
            arms,
            turn,
            breath,
            point: point.toArray(),
            inside: inside.toArray(),
            hit: hit.point.toArray(),
          };
        minimumClearance = Math.min(minimumClearance, clearance);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(3000);
    expect(minimumClearance, JSON.stringify(closest)).toBeGreaterThan(0.0005);
    collisionSkin.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
  }, 30_000);
});
