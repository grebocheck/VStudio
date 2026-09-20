import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { VRM } from '@pixiv/three-vrm';
import { SeraphineRibbonPhysics, type RibbonCollider } from './seraphineRibbonPhysics';
import { addSeraphineRibbons } from './seraphineRibbons';

const identity = new THREE.Matrix4();
const rest = Array.from({ length: 21 }, (_, i) => new THREE.Vector3(0.01 + i * 0.003, 1.477 - i * 0.017, -0.215));
const shifted = (x: number) => new THREE.Matrix4().makeTranslation(x, 0, 0);
const tip = (ribbon: SeraphineRibbonPhysics) => ribbon.points.at(-1)!;
const settle = (ribbon: SeraphineRibbonPhysics, matrix = identity, seconds = 4) => {
  for (let i = 0; i < seconds * 120; i++) ribbon.update(1 / 120, matrix);
};

describe('Seraphine ribbon cloth spine', () => {
  it('pins the root to the animated knot while the free hem lags behind head motion', () => {
    const ribbon = new SeraphineRibbonPhysics(rest);
    settle(ribbon);
    const before = tip(ribbon).clone();
    ribbon.update(1 / 60, shifted(0.065));
    expect(ribbon.points[0].distanceTo(rest[0].clone().applyMatrix4(shifted(0.065)))).toBeLessThan(1e-10);
    expect(tip(ribbon).x - before.x).toBeLessThan(0.025);
    settle(ribbon, shifted(0.065));
    expect(tip(ribbon).x - before.x).toBeCloseTo(0.065, 2);
  });

  it('settles to rest without perpetual synthetic waving', () => {
    const ribbon = new SeraphineRibbonPhysics(rest);
    for (let i = 0; i < 60; i++) ribbon.update(1 / 60, shifted(Math.sin(i / 8) * 0.08));
    ribbon.update(1 / 60, identity);
    const disturbed = tip(ribbon).clone();
    settle(ribbon, identity, 6);
    const settled = tip(ribbon).clone();
    settle(ribbon, identity, 2);
    expect(tip(ribbon).distanceTo(settled)).toBeLessThan(0.00002);
    expect(disturbed.distanceTo(settled)).toBeGreaterThan(0.005);
  });

  it('keeps finite, bounded segment lengths through fast turns and uneven frame times', () => {
    const ribbon = new SeraphineRibbonPhysics(rest);
    for (let i = 0; i < 400; i++) {
      const transform = new THREE.Matrix4().makeRotationY(Math.sin(i / 9) * 0.6);
      transform.setPosition(Math.sin(i / 13) * 0.08, 0, 0);
      ribbon.update([1 / 144, 1 / 60, 1 / 30, 1 / 90][i % 4], transform);
      for (let j = 1; j < ribbon.points.length; j++) {
        const length = ribbon.points[j].distanceTo(ribbon.points[j - 1]);
        expect(Number.isFinite(length)).toBe(true);
        expect(length).toBeLessThan(ribbon.lengths[j - 1] + 0.007);
      }
      expect(tip(ribbon).distanceTo(ribbon.points[0])).toBeLessThan(0.38);
    }
  });

  it('freezes a paused pose and rebases that pose when the user manually edits the head', () => {
    const ribbon = new SeraphineRibbonPhysics(rest);
    settle(ribbon);
    const before = ribbon.points.map((point) => point.clone());
    for (let i = 0; i < 100; i++) ribbon.update(0, identity);
    expect(ribbon.points.map((point) => point.toArray())).toEqual(before.map((point) => point.toArray()));
    const pose = new THREE.Matrix4().makeRotationY(0.5).setPosition(0.03, 0.01, 0);
    ribbon.update(0, pose);
    ribbon.points.forEach((point, i) => expect(point.distanceTo(before[i].applyMatrix4(pose))).toBeLessThan(1e-10));
  });

  it('resets cleanly after a teleport or a suspended browser frame', () => {
    const ribbon = new SeraphineRibbonPhysics(rest);
    settle(ribbon);
    const jump = shifted(3);
    ribbon.update(1 / 60, jump);
    ribbon.points.forEach((point, i) =>
      expect(point.distanceTo(rest[i].clone().applyMatrix4(jump))).toBeLessThan(1e-10),
    );
    ribbon.update(4, identity);
    expect(ribbon.points.map((point) => point.toArray())).toEqual(rest.map((point) => point.toArray()));
  });

  it('gives equivalent motion at 30, 60, 120 and 144 Hz', () => {
    const run = (fps: number) => {
      const ribbon = new SeraphineRibbonPhysics(rest);
      for (let i = 1; i <= fps * 3; i++) {
        const time = i / fps;
        ribbon.update(1 / fps, shifted(Math.sin(time * 2.1) * 0.045));
      }
      return tip(ribbon);
    };
    const reference = run(120);
    for (const fps of [30, 60, 144]) expect(run(fps).distanceTo(reference)).toBeLessThan(0.0015);
  });

  it('keeps the spine outside a shoulder collision proxy', () => {
    const worldFromUnit = new THREE.Matrix4().compose(
      new THREE.Vector3(0.04, 1.28, -0.17),
      new THREE.Quaternion(),
      new THREE.Vector3(0.07, 0.09, 0.08),
    );
    const collider: RibbonCollider = { worldFromUnit, unitFromWorld: worldFromUnit.clone().invert() };
    const ribbon = new SeraphineRibbonPhysics(rest);
    for (let i = 0; i < 240; i++) ribbon.update(1 / 120, identity, [collider]);
    for (const point of ribbon.points.slice(1))
      expect(point.clone().applyMatrix4(collider.unitFromWorld).length()).toBeGreaterThanOrEqual(1 - 1e-7);
  });
});

describe('Seraphine ribbon skinning', () => {
  const fixture = () => {
    const scene = new THREE.Group();
    const head = new THREE.Bone();
    head.position.set(0, 1.43, 0);
    scene.add(head);
    const vrm = {
      scene,
      humanoid: { getRawBoneNode: (name: string) => (name === 'head' ? head : undefined) },
    } as unknown as VRM;
    const ribbons = addSeraphineRibbons(vrm);
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.SkinnedMesh) meshes.push(object);
    });
    ribbons.update(0);
    const vertex = (mesh: THREE.SkinnedMesh, i: number) =>
      mesh
        .applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(mesh.geometry.getAttribute('position'), i))
        .applyMatrix4(mesh.matrixWorld);
    return { scene, head, ribbons, meshes, vertex };
  };

  it('exports valid skin roots and normalized joints shared by each satin sheet and its embroidery', () => {
    const { meshes } = fixture();
    expect(meshes).toHaveLength(4);
    for (const mesh of meshes) {
      const { bones } = mesh.skeleton;
      const rootJoint = bones[0];
      const descendants = new Set<THREE.Object3D>();
      rootJoint.traverse((object) => descendants.add(object));
      expect(bones.every((bone) => descendants.has(bone))).toBe(true);
      const weights = mesh.geometry.getAttribute('skinWeight');
      const joints = mesh.geometry.getAttribute('skinIndex');
      for (let i = 0; i < weights.count; i++) {
        let total = 0;
        for (let j = 0; j < 4; j++) {
          total += weights.getComponent(i, j);
          expect(joints.getComponent(i, j)).toBeLessThan(bones.length);
        }
        expect(total).toBeCloseTo(1, 6);
      }
      for (const name of ['position', 'normal', 'uv'])
        expect(Array.from(mesh.geometry.getAttribute(name).array).every(Number.isFinite)).toBe(true);
    }
    expect(meshes[0].skeleton).toBe(meshes[1].skeleton);
    expect(meshes[2].skeleton).toBe(meshes[3].skeleton);
  });

  it('keeps a paused exported surface stable and carries its full geometry with scene edits', () => {
    const { scene, ribbons, meshes, vertex } = fixture();
    const samples = meshes.flatMap((mesh) =>
      [0, 13, mesh.geometry.getAttribute('position').count - 1].map((index) => ({
        mesh,
        index,
        before: vertex(mesh, index),
      })),
    );
    for (let i = 0; i < 20; i++) ribbons.update(0);
    for (const { mesh, index, before } of samples) expect(vertex(mesh, index).distanceTo(before)).toBeLessThan(1e-10);
    scene.position.set(0.3, 0.2, -0.1);
    scene.rotation.set(0.1, 0.3, -0.2);
    scene.scale.setScalar(1.2);
    scene.updateMatrixWorld(true);
    const transform = scene.matrixWorld.clone();
    ribbons.update(0);
    for (const { mesh, index, before } of samples)
      expect(vertex(mesh, index).distanceTo(before.applyMatrix4(transform))).toBeLessThan(1e-7);
  });

  it('keeps the seam attached and the animated surface finite through head turns', () => {
    const { head, ribbons, meshes, vertex } = fixture();
    for (let i = 0; i < 120; i++) {
      head.rotation.set(Math.sin(i / 19) * 0.22, Math.sin(i / 13) * 0.6, Math.sin(i / 17) * 0.3);
      ribbons.update(1 / 60);
    }
    for (const mesh of meshes) {
      const count = mesh.geometry.getAttribute('position').count;
      for (let i = 0; i < count; i += 17) expect(vertex(mesh, i).toArray().every(Number.isFinite)).toBe(true);
      const joint = mesh.skeleton.bones[1];
      const expected = new THREE.Vector3(mesh.name.includes('Left') ? -0.01 : 0.01, 0.047, -0.215).applyMatrix4(
        head.matrixWorld,
      );
      expect(joint.getWorldPosition(new THREE.Vector3()).distanceTo(expected)).toBeLessThan(1e-8);
    }
  });
});
