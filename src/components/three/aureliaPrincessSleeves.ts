import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { VRM } from '@pixiv/three-vrm';
import { getAureliaSkeleton } from './aureliaSkinning';
import type { AureliaShoulderFit } from './aureliaShoulderFit';

/** Fitted sleeve roots share the skin's shoulder blend; cuffs follow the upper arms. */
export function addAureliaPrincessSleeves(
  vrm: VRM,
  materials: { satin: THREE.Material; velvet: THREE.Material; lace: THREE.Material; gold: THREE.Material },
  shoulderFit: AureliaShoulderFit,
) {
  const skeleton = getAureliaSkeleton(vrm);
  for (const side of ['left', 'right'] as const) {
    const arm = vrm.humanoid.getRawBoneNode(`${side}UpperArm`),
      elbow = vrm.humanoid.getRawBoneNode(`${side}LowerArm`);
    if (!arm || !elbow) continue;
    const index = skeleton.bones.indexOf(arm as THREE.Bone);
    if (index < 0) continue;
    const origin = arm.getWorldPosition(new THREE.Vector3());
    const axis = elbow.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
    const forward = new THREE.Vector3(0, 0, 1).addScaledVector(axis, -axis.z).normalize();
    const up = new THREE.Vector3().crossVectors(forward, axis).normalize();
    const point = (phi: number, distance: number, radius: number) =>
      origin
        .clone()
        .addScaledVector(axis, distance)
        .addScaledVector(up, Math.sin(phi) * radius)
        .addScaledVector(forward, Math.cos(phi) * radius);
    const attach = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
      const count = geometry.getAttribute('position').count;
      const indices = new Uint16Array(count * 4),
        weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        indices[i * 4] = index;
        weights[i * 4] = 1;
      }
      geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
      geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
      const layer = name === 'Gathered_Princess_Sleeve' ? 0 : name === 'Sleeve_Ribbon_Cuff' ? 0.001 : 0.002;
      shoulderFit.fit(
        geometry,
        (p) =>
          layer +
          THREE.MathUtils.lerp(
            0.006,
            0.0025,
            THREE.MathUtils.smoothstep(p.clone().sub(origin).dot(axis), 0.025, 0.085),
          ),
        (p) => origin.clone().addScaledVector(axis, p.clone().sub(origin).dot(axis)),
      );
      const mesh = new THREE.SkinnedMesh(geometry, material);
      mesh.name = `Aurelia_${side}_${name}`;
      mesh.userData.aureliaOuterGarment = true;
      mesh.frustumCulled = false;
      vrm.scene.add(mesh);
      mesh.bind(skeleton, new THREE.Matrix4());
    };
    const shell = (rows: number, sample: (phi: number, v: number) => THREE.Vector3) => {
      const columns = 72,
        positions: number[] = [],
        uv: number[] = [],
        indices: number[] = [];
      for (let row = 0; row <= rows; row++)
        for (let column = 0; column <= columns; column++) {
          sample((column / columns) * Math.PI * 2, row / rows).toArray(positions, positions.length);
          uv.push(column / columns, row / rows);
          if (row < rows && column < columns) {
            const a = row * (columns + 1) + column,
              b = a + 1,
              c = a + columns + 1;
            indices.push(a, b, c, b, c + 1, c);
          }
        }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    };
    attach(
      shell(24, (phi, v) => {
        const fullness = Math.sin(v * Math.PI);
        // A slanted armhole reaches the shoulder cap without burying its underside in the chest.
        const root = 0.03 - 0.024 * (up.y * Math.sin(phi) + forward.y * Math.cos(phi));
        return point(
          phi,
          THREE.MathUtils.lerp(root, 0.095, v),
          0.033 + fullness * (0.019 + Math.cos(phi * 12) * 0.0018),
        );
      }),
      materials.satin,
      'Gathered_Princess_Sleeve',
    );
    attach(
      shell(4, (phi, v) => point(phi, 0.089 + v * 0.014, 0.034 + Math.sin(v * Math.PI) * 0.001)),
      materials.velvet,
      'Sleeve_Ribbon_Cuff',
    );
    attach(
      shell(6, (phi, v) =>
        point(phi, 0.1 + v * (0.013 + Math.cos(phi * 18) * 0.0014), 0.034 + v * (0.004 + Math.cos(phi * 18) * 0.0015)),
      ),
      materials.lace,
      'Sleeve_Openwork_Frill',
    );
    const piping = [0.09, 0.102].map((distance) => {
      const points = Array.from({ length: 73 }, (_, i) => point((i / 72) * Math.PI * 2, distance, 0.0348));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.0009, 5, false);
    });
    const geometry = mergeGeometries(piping);
    if (geometry) attach(geometry, materials.gold, 'Sleeve_Gold_Binding');
    piping.forEach((part) => part.dispose());
  }
}
