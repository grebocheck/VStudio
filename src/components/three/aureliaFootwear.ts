import * as THREE from 'three';
import type { VRM } from '@pixiv/three-vrm';

const TAU = Math.PI * 2;

function surface(columns: number, rows: number, point: (u: number, v: number) => THREE.Vector3) {
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let row = 0; row <= rows; row++)
    for (let column = 0; column <= columns; column++) {
      point(column / columns, row / rows).toArray(positions, positions.length);
      uv.push(column / columns, row / rows);
    }
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column,
        b = a + 1,
        c = a + columns + 1;
      indices.push(a, c, b, b, c, c + 1);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  const start = new THREE.Vector3(),
    end = new THREE.Vector3();
  for (let row = 0; row <= rows; row++) {
    const first = row * (columns + 1),
      last = first + columns;
    if (start.fromArray(positions, first * 3).distanceTo(end.fromArray(positions, last * 3)) > 1e-7) continue;
    start.fromBufferAttribute(normals, first).add(end.fromBufferAttribute(normals, last)).normalize();
    normals.setXYZ(first, start.x, start.y, start.z);
    normals.setXYZ(last, start.x, start.y, start.z);
  }
  return geometry;
}

/** Fitted leather shoes and knitted socks, authored in the source VRM's metre-scale rest pose. */
export function addAureliaFootwear(vrm: VRM): void {
  let skin: THREE.SkinnedMesh | undefined;
  vrm.scene.updateMatrixWorld(true);
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.name.includes('Shoes'))) object.visible = false;
    if (materials.some((material) => material.name === 'Body_00_SKIN')) skin = object;
  });
  if (!skin) return;
  const source = skin,
    skeleton = source.skeleton;
  const leather = new THREE.MeshPhysicalMaterial({
    name: 'Aurelia_navy_kid_leather',
    color: '#263d61',
    roughness: 0.34,
    clearcoat: 0.24,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });
  const soleMaterial = new THREE.MeshStandardMaterial({
    name: 'Aurelia_ink_leather_sole',
    color: '#18253b',
    roughness: 0.68,
    side: THREE.DoubleSide,
  });
  const ivory = new THREE.MeshPhysicalMaterial({
    name: 'Aurelia_ivory_knit',
    color: '#efe8d9',
    roughness: 0.91,
    sheen: 0.35,
    sheenColor: '#fff5e2',
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: 'Aurelia_champagne_shoe_hardware',
    color: '#c8a879',
    metalness: 0.75,
    roughness: 0.31,
  });
  const stitch = new THREE.MeshStandardMaterial({ color: '#8793a9', roughness: 0.85 });
  const bind = (geometry: THREE.BufferGeometry, material: THREE.Material, bone: THREE.Object3D, name: string) => {
    const index = skeleton.bones.indexOf(bone as THREE.Bone);
    const count = geometry.getAttribute('position').count;
    const indices = new Uint16Array(count * 4),
      weights = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      indices[i * 4] = index;
      weights[i * 4] = 1;
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.name = name;
    mesh.frustumCulled = false;
    vrm.scene.add(mesh);
    mesh.bind(skeleton, new THREE.Matrix4());
    return mesh;
  };

  // Preserve the source ankle/instep anatomy and its lower-leg/foot skinning.
  // The cuff covers the irregular topology boundary, so there is no clipped edge to see.
  const socks = source.geometry.clone(),
    sourceIndex = socks.getIndex();
  if (sourceIndex) {
    const positions = socks.getAttribute('position') as THREE.BufferAttribute;
    const normals = socks.getAttribute('normal');
    const visible: number[] = [],
      world: THREE.Vector3[] = [];
    for (let i = 0; i < positions.count; i++) {
      world.push(source.localToWorld(source.getVertexPosition(i, new THREE.Vector3())));
      positions.setXYZ(
        i,
        positions.getX(i) + normals.getX(i) * 0.0017,
        positions.getY(i) + normals.getY(i) * 0.0017,
        positions.getZ(i) + normals.getZ(i) * 0.0017,
      );
    }
    for (let i = 0; i < sourceIndex.count; i += 3) {
      const a = sourceIndex.getX(i),
        b = sourceIndex.getX(i + 1),
        c = sourceIndex.getX(i + 2);
      if ((world[a].y + world[b].y + world[c].y) / 3 < 0.216) visible.push(a, b, c);
    }
    socks.setIndex(visible);
    socks.clearGroups();
    const mesh = new THREE.SkinnedMesh(socks, ivory);
    mesh.name = 'Aurelia_Fitted_Ankle_Socks';
    mesh.position.copy(source.position);
    mesh.quaternion.copy(source.quaternion);
    mesh.scale.copy(source.scale);
    mesh.frustumCulled = false;
    source.parent!.add(mesh);
    mesh.bind(skeleton, source.bindMatrix);
  }

  for (const side of ['left', 'right'] as const) {
    const foot = vrm.humanoid.getRawBoneNode(`${side}Foot`),
      lowerLeg = vrm.humanoid.getRawBoneNode(`${side}LowerLeg`);
    if (!foot || !lowerLeg || !skeleton.bones.includes(foot as THREE.Bone)) continue;
    const centerX = foot.getWorldPosition(new THREE.Vector3()).x,
      sign = Math.sign(centerX);
    const name = (part: string) => `Aurelia_${side}_${part}`;
    const footprint = (phi: number, expand = 0) => {
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      const width = THREE.MathUtils.lerp(0.038, 0.05, (cos + 1) / 2) + expand;
      return new THREE.Vector3(
        centerX + Math.sign(sin) * Math.pow(Math.abs(sin), 0.68) * width,
        0,
        0.021 + Math.sign(cos) * Math.pow(Math.abs(cos), 0.82) * (0.119 + expand),
      );
    };
    const soleTop = (z: number) => 0.022 + 0.008 * THREE.MathUtils.smoothstep(-z, 0.01, 0.07);
    const outer = (phi: number) => {
      const p = footprint(phi);
      p.y = soleTop(p.z);
      return p;
    };
    const opening = (phi: number) =>
      new THREE.Vector3(centerX + Math.sin(phi) * 0.034, 0.086 - Math.cos(phi) * 0.009, -0.031 + Math.cos(phi) * 0.057);
    const upper = (phi: number, v: number) => {
      const low = outer(phi),
        high = opening(phi);
      const point = low.clone().lerp(high, v);
      point.y = THREE.MathUtils.lerp(low.y, high.y, Math.sin((v * Math.PI) / 2));
      point.y += 0.012 * Math.sin(v * Math.PI) * (1 - v) * Math.max(0, Math.cos(phi));
      return point;
    };
    bind(
      surface(96, 28, (u, v) => upper(u * TAU, v)),
      leather,
      foot,
      name('Mary_Jane_Upper'),
    );
    bind(
      surface(80, 5, (u, v) => {
        const p = footprint(u * TAU, Math.sin(v * Math.PI) * 0.0015);
        const rear = THREE.MathUtils.smoothstep(-p.z, 0.008, 0.065);
        p.y = THREE.MathUtils.lerp(0.005 + rear * 0.012, soleTop(p.z), v);
        return p;
      }),
      soleMaterial,
      foot,
      name('Layered_Sole'),
    );
    // A closed underside and a separate rounded low block heel give the shoe real thickness.
    const bottom = surface(80, 4, (u, v) => {
      const p = footprint(u * TAU);
      p.x = THREE.MathUtils.lerp(centerX, p.x, v);
      p.z = THREE.MathUtils.lerp(0.021, p.z, v);
      p.y = 0.005 + THREE.MathUtils.smoothstep(-p.z, 0.008, 0.065) * 0.012;
      return p;
    });
    bind(bottom, soleMaterial, foot, name('Sole_Underside'));
    const heel = new THREE.Shape();
    const w = 0.028,
      d = 0.023,
      radius = 0.005;
    heel.moveTo(-w + radius, -d);
    heel.lineTo(w - radius, -d);
    heel.quadraticCurveTo(w, -d, w, -d + radius);
    heel.lineTo(w, d - radius);
    heel.quadraticCurveTo(w, d, w - radius, d);
    heel.lineTo(-w + radius, d);
    heel.quadraticCurveTo(-w, d, -w, d - radius);
    heel.lineTo(-w, -d + radius);
    heel.quadraticCurveTo(-w, -d, -w + radius, -d);
    const heelGeometry = new THREE.ExtrudeGeometry(heel, {
      depth: 0.017,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.002,
      bevelThickness: 0.002,
      steps: 1,
      curveSegments: 5,
    });
    heelGeometry.rotateX(-Math.PI / 2);
    heelGeometry.translate(centerX, 0.002, -0.065);
    bind(heelGeometry, soleMaterial, foot, name('Low_Block_Heel'));
    const line = (points: THREE.Vector3[], radius: number, material: THREE.Material, part: string, bone = foot) => {
      const curve = new THREE.CatmullRomCurve3(points);
      bind(
        new THREE.TubeGeometry(curve, Math.max(40, points.length * 2), radius, 5, false),
        material,
        bone,
        name(part),
      );
    };
    line(
      Array.from({ length: 81 }, (_, i) => outer((i / 80) * TAU)),
      0.0009,
      gold,
      'Champagne_Welt',
    );
    line(
      Array.from({ length: 81 }, (_, i) => opening((i / 80) * TAU)),
      0.0016,
      leather,
      'Rolled_Opening',
    );
    line(
      Array.from({ length: 57 }, (_, i) => upper(-1.35 + (i / 56) * 2.7, 0.3).add(new THREE.Vector3(0, 0.0008, 0))),
      0.00045,
      stitch,
      'Toe_Stitching',
    );

    const strapPoint = (t: number, direction: number) =>
      new THREE.Vector3(
        centerX + t * 0.035,
        0.102 - t * t * 0.035 + (direction > 0 ? 0.002 : 0),
        0.022 + direction * t * 0.025,
      );
    for (const direction of [-1, 1]) {
      const strap = surface(4, 32, (u, v) => {
        const t = v * 2 - 1,
          p = strapPoint(t, direction);
        const tangent = new THREE.Vector3(0.035, -0.07 * t, direction * 0.025).normalize();
        const across = new THREE.Vector3(-direction * 0.025, 0, 0.035).normalize();
        const normal = new THREE.Vector3().crossVectors(across, tangent).normalize();
        // Closed rectangular cross-section: a leather ribbon with visible edge thickness.
        const corners = [
          [-1, -1],
          [-1, 1],
          [1, 1],
          [1, -1],
          [-1, -1],
        ];
        const corner = corners[Math.round(u * 4)];
        return p.addScaledVector(across, corner[0] * 0.0042).addScaledVector(normal, corner[1] * 0.0012);
      });
      bind(strap, leather, foot, name(`Cross_Strap_${direction}`));
    }
    const buckleT = sign * 0.77;
    const buckleCenter = strapPoint(buckleT, sign).add(new THREE.Vector3(0, 0.002, 0));
    const tangent = new THREE.Vector3(0.035, -0.07 * buckleT, sign * 0.025).normalize();
    const across = new THREE.Vector3(-sign * 0.025, 0, 0.035).normalize();
    const bucklePoints = [
      [-0.006, -0.0048],
      [0.006, -0.0048],
      [0.006, 0.0048],
      [-0.006, 0.0048],
      [-0.006, -0.0048],
    ].map(([x, y]) => buckleCenter.clone().addScaledVector(tangent, x).addScaledVector(across, y));
    line(bucklePoints, 0.00105, gold, 'Instep_Buckle');
    line(
      [buckleCenter.clone().addScaledVector(across, -0.005), buckleCenter.clone().addScaledVector(across, 0.005)],
      0.00075,
      gold,
      'Buckle_Pin',
    );

    bind(
      surface(80, 12, (u, v) => {
        const phi = u * TAU,
          rib = Math.cos(phi * 40) * 0.00045;
        return new THREE.Vector3(
          centerX + sign * 0.003 + Math.sin(phi) * (0.033 + rib),
          THREE.MathUtils.lerp(0.197, 0.227, v),
          -0.039 + Math.cos(phi) * (0.0395 + rib),
        );
      }),
      ivory,
      lowerLeg,
      name('Ribbed_Sock_Cuff'),
    );
    bind(
      surface(96, 6, (u, v) => {
        const phi = u * TAU,
          wave = Math.cos(phi * 14),
          flare = Math.sin((v * Math.PI) / 2) * (0.0045 + wave * 0.0018);
        return new THREE.Vector3(
          centerX + sign * 0.003 + Math.sin(phi) * (0.033 + flare),
          0.22 + v * 0.011 + v * wave * 0.0014,
          -0.039 + Math.cos(phi) * (0.0395 + flare),
        );
      }),
      ivory,
      lowerLeg,
      name('Scalloped_Sock_Ruffle'),
    );
  }
}
