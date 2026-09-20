import * as THREE from 'three';
import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { SeraphineRibbonPhysics, type RibbonCollider } from './seraphineRibbonPhysics';

const SEGMENTS = 20;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function tangentAt(points: THREE.Vector3[], i: number, out = new THREE.Vector3()) {
  return out.subVectors(points[Math.min(points.length - 1, i + 1)], points[Math.max(0, i - 1)]).normalize();
}

function frame(tangent: THREE.Vector3, across: THREE.Vector3, matrix: THREE.Matrix4, normal: THREE.Vector3) {
  across.addScaledVector(tangent, -across.dot(tangent));
  // A sideways head pose can align its reference axis with a falling tail.
  if (across.lengthSq() < 1e-8) {
    across.set(0, Math.abs(tangent.z) > 0.9 ? 1 : 0, Math.abs(tangent.z) > 0.9 ? 0 : 1);
    across.addScaledVector(tangent, -across.dot(tangent));
  }
  across.normalize();
  normal.crossVectors(across, tangent).normalize();
  return matrix.makeBasis(across, tangent, normal);
}

/** Two tailored satin sheets share their deformation rig with every embroidered edge and tip. */
export function addSeraphineRibbons(vrm: VRM): { update(delta: number): void } {
  const head = vrm.humanoid.getRawBoneNode('head');
  if (!head) return { update() {} };
  vrm.scene.updateMatrixWorld(true);
  const inverseBindHead = head.matrixWorld.clone().invert();
  const root = new THREE.Group();
  root.name = 'Seraphine_Physical_Satin_Ribbons';
  root.applyMatrix4(vrm.scene.matrixWorld.clone().invert());
  vrm.scene.add(root);
  const satin = new THREE.MeshPhysicalMaterial({
    name: 'Seraphine_Woven_Sapphire_Ribbon_Satin',
    color: '#183467',
    roughness: 0.4,
    sheen: 0.8,
    sheenColor: '#9db8f4',
    sheenRoughness: 0.38,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: 'Seraphine_Ribbon_Gold_Woven_Selvedge',
    color: '#d9b777',
    roughness: 0.35,
    metalness: 0.7,
    vertexColors: true,
    side: THREE.DoubleSide,
  });
  const matrix = new THREE.Matrix4();
  const across = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const tails = [-1, 1].map((side) => {
    const curve = new THREE.CatmullRomCurve3(
      [
        V(side * 0.01, 1.477, -0.215),
        V(side * 0.037, 1.435, -0.232),
        V(side * 0.063, 1.352, -0.227),
        V(side * 0.078, 1.25, -0.19),
        V(side * 0.088, side < 0 ? 1.135 : 1.153, -0.198),
      ],
      false,
      'centripetal',
    );
    const rest = curve.getSpacedPoints(SEGMENTS);
    const simulation = new SeraphineRibbonPhysics(rest);
    // GLTFExporter declares skeleton.bones[0] as the skin root. It must be an ancestor
    // of every weighted joint, not the first of several sibling joints.
    const skinRoot = new THREE.Bone();
    skinRoot.name = `Seraphine_Ribbon_${side < 0 ? 'L' : 'R'}_Root`;
    root.add(skinRoot);
    const bones = rest.map((point, i) => {
      const bone = new THREE.Bone();
      bone.name = `Seraphine_Ribbon_${side < 0 ? 'L' : 'R'}_${i.toString().padStart(2, '0')}`;
      bone.position.copy(point);
      skinRoot.add(bone);
      return bone;
    });
    const restFrames = rest.map((_point, i) => {
      tangentAt(rest, i, tangent);
      across.crossVectors(tangent, V(0, 0, -1)).normalize();
      return new THREE.Quaternion().setFromRotationMatrix(frame(tangent, across, matrix, normal)).invert();
    });
    root.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton([skinRoot, ...bones]);
    const sample = (t: number, u: number) => {
      // The center of the free hem is cut back into a shallow swallowtail, rather than a rounded tube tip.
      const cut = 0.042 * (1 - Math.abs(u)) * THREE.MathUtils.smoothstep(t, 0.93, 1);
      const along = Math.max(0, t - cut);
      const scaled = along * SEGMENTS;
      const index = Math.min(SEGMENTS - 1, Math.floor(scaled));
      const fraction = scaled - index;
      const center = rest[index].clone().lerp(rest[index + 1], fraction);
      tangentAt(rest, index, tangent);
      across.crossVectors(tangent, V(0, 0, -1)).normalize();
      const twist = side * (0.12 + Math.sin(along * Math.PI * 1.7) * 0.38 + along * 0.14);
      across.applyAxisAngle(tangent, twist);
      normal.crossVectors(across, tangent).normalize();
      const halfWidth = 0.006 + 0.007 * THREE.MathUtils.smoothstep(along, 0, 0.22);
      // A shallow center fold and a second soft transverse ripple catch the satin's anisotropic-looking sheen.
      const fold = (1 - u * u) * (0.0013 + Math.sin(along * Math.PI * 4 + side) * 0.00075);
      center.addScaledVector(across, u * halfWidth).addScaledVector(normal, fold);
      return { point: center, normal: normal.clone(), along };
    };
    const geometry = (trim: boolean) => {
      const positions: number[] = [],
        colors: number[] = [],
        uvs: number[] = [],
        indices: number[] = [],
        skinIndices: number[] = [],
        skinWeights: number[] = [];
      const panel = (rows: number, columns: number, coordinates: (u: number, v: number) => [number, number]) => {
        const offset = positions.length / 3;
        for (let row = 0; row <= rows; row++) {
          for (let column = 0; column <= columns; column++) {
            const [t, u] = coordinates(column / columns, row / rows);
            const vertex = sample(t, u);
            if (trim) vertex.point.addScaledVector(vertex.normal, 0.0003);
            vertex.point.toArray(positions, positions.length);
            const light = trim ? 1 : 0.94 + Math.cos(u * Math.PI * 3) * 0.025;
            colors.push(light, light, light);
            uvs.push((u + 1) / 2, vertex.along);
            const scaled = vertex.along * SEGMENTS;
            const joint = Math.min(SEGMENTS - 1, Math.floor(scaled));
            const weight = scaled - joint;
            skinIndices.push(joint + 1, joint + 2, 0, 0);
            skinWeights.push(1 - weight, weight, 0, 0);
            if (row < rows && column < columns) {
              const i = offset + row * (columns + 1) + column;
              indices.push(i, i + columns + 1, i + 1, i + 1, i + columns + 1, i + columns + 2);
            }
          }
        }
      };
      if (trim) {
        for (const edge of [-1, 1]) panel(80, 2, (u, v) => [v, edge * (1 - u * 0.095)]);
        panel(2, 16, (u, v) => [1 - v * 0.005, u * 2 - 1]);
        panel(2, 12, (u, v) => [0.892 + v * 0.005, u * 1.84 - 0.92]);
        // A stitched lozenge above the double hem gives the broad surface a small heraldic detail.
        for (const edge of [-1, 1])
          panel(16, 2, (u, v) => [0.815 + v * 0.052, edge * (Math.sin(v * Math.PI) * 0.3 + u * 0.055)]);
      } else panel(80, 12, (u, v) => [v, u * 2 - 1]);
      const result = new THREE.BufferGeometry();
      result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      result.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      result.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      result.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
      result.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
      result.setIndex(indices);
      result.computeVertexNormals();
      return result;
    };
    for (const trim of [false, true]) {
      const mesh = new THREE.SkinnedMesh(geometry(trim), trim ? gold : satin);
      mesh.name = `Seraphine_${side < 0 ? 'Left' : 'Right'}_${trim ? 'Ribbon_Gold_Embroidery' : 'Long_Satin_Ribbon'}`;
      mesh.frustumCulled = false;
      root.add(mesh);
      mesh.bind(skeleton, new THREE.Matrix4());
    }
    return { simulation, bones, restFrames, rest };
  });
  const colliders: (RibbonCollider & { bone: THREE.Object3D; bind: THREE.Matrix4 })[] = [];
  const collider = (name: VRMHumanBoneName, center: THREE.Vector3, radii: THREE.Vector3) => {
    const bone = vrm.humanoid.getRawBoneNode(name);
    if (!bone) return;
    const bind = new THREE.Matrix4().compose(center, new THREE.Quaternion(), radii);
    bind.premultiply(bone.matrixWorld.clone().invert());
    colliders.push({ bone, bind, worldFromUnit: new THREE.Matrix4(), unitFromWorld: new THREE.Matrix4() });
  };
  // Conservative proxies include ribbon half-width, so gold piping stays clear of the gorget and pauldrons.
  collider('head', V(0, 1.49, -0.028), V(0.127, 0.141, 0.138));
  collider('neck', V(0, 1.359, -0.027), V(0.061, 0.105, 0.077));
  collider('upperChest', V(0, 1.218, -0.015), V(0.157, 0.153, 0.126));
  for (const side of [-1, 1])
    collider(side < 0 ? 'rightUpperArm' : 'leftUpperArm', V(side * 0.17, 1.269, -0.025), V(0.106, 0.09, 0.113));
  const transform = new THREE.Matrix4();
  const inverseRoot = new THREE.Matrix4();
  const rootRotation = new THREE.Quaternion();
  const headRotation = new THREE.Quaternion();
  const worldRotation = new THREE.Quaternion();
  const reference = V(1, 0, 0);
  return {
    update(delta) {
      vrm.scene.updateMatrixWorld(true);
      transform.multiplyMatrices(head.matrixWorld, inverseBindHead);
      headRotation.setFromRotationMatrix(matrix.extractRotation(transform));
      inverseRoot.copy(root.matrixWorld).invert();
      root.getWorldQuaternion(rootRotation).invert();
      for (const proxy of colliders) {
        proxy.worldFromUnit.multiplyMatrices(proxy.bone.matrixWorld, proxy.bind);
        proxy.unitFromWorld.copy(proxy.worldFromUnit).invert();
      }
      for (const tail of tails) {
        tail.simulation.update(delta, transform, colliders);
        for (let i = 0; i < tail.bones.length; i++) {
          const bone = tail.bones[i];
          bone.position.copy(tail.simulation.points[i]).applyMatrix4(inverseRoot);
          tangentAt(tail.simulation.points, i, tangent);
          across.copy(reference).applyQuaternion(headRotation);
          worldRotation.setFromRotationMatrix(frame(tangent, across, matrix, normal));
          bone.quaternion.copy(rootRotation).multiply(worldRotation).multiply(tail.restFrames[i]);
        }
      }
      root.updateMatrixWorld(true);
    },
  };
}
