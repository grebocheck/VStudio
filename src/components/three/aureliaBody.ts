import * as THREE from 'three';
import { MToonMaterial, type VRM } from '@pixiv/three-vrm';
import { bodySurface } from './aureliaGarmentShape';
import { bindAureliaGeometry } from './aureliaSkinning';

const TORSO_BOTTOM = 1.02;
const TORSO_TOP = 1.344;
const SHORTS_BOTTOM = 0.71;
const SHORTS_TOP = 1;

interface ClothVertex {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  influences: Map<number, number>;
  y: number;
}

export interface AureliaBody {
  torso: THREE.SkinnedMesh;
  shorts: THREE.SkinnedMesh;
}

function interpolateVertex(a: ClothVertex, b: ClothVertex, t: number): ClothVertex {
  const influences = new Map<number, number>();
  for (const [index, weight] of a.influences) influences.set(index, weight * (1 - t));
  for (const [index, weight] of b.influences) influences.set(index, (influences.get(index) ?? 0) + weight * t);
  return {
    position: a.position.clone().lerp(b.position, t),
    normal: a.normal.clone().lerp(b.normal, t).normalize(),
    influences,
    y: THREE.MathUtils.lerp(a.y, b.y, t),
  };
}

/** Clip through triangles, so both cuffs and the waistband have level, open edges. */
function clipAtHeight(vertices: ClothVertex[], height: number, above: boolean): ClothVertex[] {
  const result: ClothVertex[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const aInside = above ? a.y >= height : a.y <= height;
    const bInside = above ? b.y >= height : b.y <= height;
    if (aInside) result.push(a);
    if (aInside !== bInside) result.push(interpolateVertex(a, b, (height - a.y) / (b.y - a.y)));
  }
  return result;
}

/** A fitted shell of the existing pelvis, including its crotch and separate thigh openings. */
function fittedShorts(source: THREE.SkinnedMesh) {
  const geometry = source.geometry;
  const sourcePositions = geometry.getAttribute('position');
  const sourceNormals = geometry.getAttribute('normal');
  const sourceIndices = geometry.getAttribute('skinIndex');
  const sourceWeights = geometry.getAttribute('skinWeight');
  const index = geometry.getIndex();
  const positions: number[] = [];
  const normals: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const colors: number[] = [];
  const world = new THREE.Vector3();
  const vertices = Array.from({ length: sourcePositions.count }, (_, i): ClothVertex => {
    const position = new THREE.Vector3().fromBufferAttribute(sourcePositions, i);
    const influences = new Map<number, number>();
    for (let j = 0; j < 4; j++) {
      const weight = sourceWeights.getComponent(i, j);
      if (weight > 0) influences.set(sourceIndices.getComponent(i, j), weight);
    }
    return {
      position,
      normal: new THREE.Vector3().fromBufferAttribute(sourceNormals, i).normalize(),
      influences,
      y: world.copy(position).applyMatrix4(source.matrixWorld).y,
    };
  });
  const navy = new THREE.Color('#19263f');
  const binding = new THREE.Color('#111b30');
  const append = (vertex: ClothVertex) => {
    const edge = Math.min(vertex.y - SHORTS_BOTTOM, SHORTS_TOP - vertex.y);
    const band = 1 - THREE.MathUtils.smoothstep(edge, 0.009, 0.016);
    // Millimetres of ease follow the original vertex normals and skinning exactly.
    // There is no substitute pelvis or opaque sphere underneath this garment.
    vertex.position
      .clone()
      .addScaledVector(vertex.normal, 0.003 + band * 0.0006)
      .toArray(positions, positions.length);
    vertex.normal.toArray(normals, normals.length);
    const weights = [...vertex.influences].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const total = weights.reduce((sum, entry) => sum + entry[1], 0);
    for (let j = 0; j < 4; j++) {
      skinIndices.push(weights[j]?.[0] ?? 0);
      skinWeights.push((weights[j]?.[1] ?? 0) / (total || 1));
    }
    navy.clone().lerp(binding, band).toArray(colors, colors.length);
  };
  const count = index?.count ?? sourcePositions.count;
  for (let i = 0; i < count; i += 3) {
    let triangle = [0, 1, 2].map((offset) => vertices[index ? index.getX(i + offset) : i + offset]);
    triangle = clipAtHeight(triangle, SHORTS_BOTTOM, true);
    triangle = clipAtHeight(triangle, SHORTS_TOP, false);
    for (let j = 1; j < triangle.length - 1; j++) {
      append(triangle[0]);
      append(triangle[j]);
      append(triangle[j + 1]);
    }
  }
  const shorts = new THREE.BufferGeometry();
  shorts.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  shorts.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  shorts.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  shorts.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  shorts.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  return shorts;
}

function sourceWaistSegments(source: THREE.SkinnedMesh) {
  const positions = source.geometry.getAttribute('position');
  const index = source.geometry.getIndex();
  const points = Array.from({ length: positions.count }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(source.matrixWorld),
  );
  const segments: [THREE.Vector3, THREE.Vector3][] = [];
  const count = index?.count ?? positions.count;
  for (let i = 0; i < count; i += 3) {
    const triangle = [0, 1, 2].map((offset) => points[index ? index.getX(i + offset) : i + offset]);
    const intersections: THREE.Vector3[] = [];
    for (let j = 0; j < 3; j++) {
      const a = triangle[j];
      const b = triangle[(j + 1) % 3];
      if (a.y < TORSO_BOTTOM !== b.y < TORSO_BOTTOM)
        intersections.push(a.clone().lerp(b, (TORSO_BOTTOM - a.y) / (b.y - a.y)));
    }
    if (intersections.length === 2) segments.push([intersections[0], intersections[1]]);
  }
  return segments;
}

function torsoGeometry(source: THREE.SkinnedMesh) {
  const columns = 96;
  const rows = 64;
  const positions: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  const waist = sourceWaistSegments(source);
  const centerZ = waist.length
    ? (Math.min(...waist.flatMap((segment) => segment.map((p) => p.z))) +
        Math.max(...waist.flatMap((segment) => segment.map((p) => p.z)))) /
      2
    : 0.004;
  const waistPoint = (phi: number) => {
    const x = Math.sin(phi);
    const z = Math.cos(phi);
    let distance = 0;
    for (const [a, b] of waist) {
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const determinant = x * dz - z * dx;
      if (Math.abs(determinant) < 1e-10) continue;
      const ray = (a.x * dz - (a.z - centerZ) * dx) / determinant;
      const segment = (a.x * z - (a.z - centerZ) * x) / determinant;
      if (ray > distance && segment >= -1e-6 && segment <= 1 + 1e-6) distance = ray;
    }
    return distance > 0
      ? new THREE.Vector3(x * distance, TORSO_BOTTOM, centerZ + z * distance)
      : bodySurface(phi, TORSO_BOTTOM);
  };
  for (let row = 0; row <= rows; row++) {
    const y = THREE.MathUtils.lerp(TORSO_BOTTOM, TORSO_TOP, row / rows);
    for (let column = 0; column <= columns; column++) {
      const phi = (column / columns) * Math.PI * 2;
      const point = bodySurface(phi, y);
      const blend = 1 - THREE.MathUtils.smoothstep(y, TORSO_BOTTOM, TORSO_BOTTOM + 0.038);
      if (blend > 0) point.addScaledVector(waistPoint(phi).sub(bodySurface(phi, TORSO_BOTTOM)), blend);
      point.toArray(positions, positions.length);
      uv.push(column / columns, row / rows);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        const b = a + 1;
        const c = a + columns + 1;
        indices.push(a, b, c, b, c + 1, c);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // The duplicated UV meridian shares one smooth normal, without a lighting seam.
  const normals = geometry.getAttribute('normal');
  const normal = new THREE.Vector3();
  const other = new THREE.Vector3();
  for (let row = 0; row <= rows; row++) {
    const a = row * (columns + 1);
    const b = a + columns;
    normal.fromBufferAttribute(normals, a).add(other.fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, normal.x, normal.y, normal.z);
    normals.setXYZ(b, normal.x, normal.y, normal.z);
  }
  return geometry;
}

/** Only replace medial neck fragments; all source pelvis and leg triangles are retained. */
function trimCoveredNeck(source: THREE.SkinnedMesh) {
  const geometry = source.geometry.clone();
  const index = geometry.getIndex();
  if (!index) return;
  const attributes = Object.entries(geometry.attributes);
  const values = Object.fromEntries(
    attributes.map(([name, attribute]) => [
      name,
      Array.from({ length: attribute.count * attribute.itemSize }, (_, i) =>
        attribute.getComponent(Math.floor(i / attribute.itemSize), i % attribute.itemSize),
      ),
    ]),
  );
  const positions = geometry.getAttribute('position');
  const world = Array.from({ length: positions.count }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(source.matrixWorld),
  );
  const visible: number[] = [];
  const intersect = (a: number, b: number) => {
    const t = (TORSO_TOP - world[a].y) / (world[b].y - world[a].y);
    const next = values.position.length / 3;
    for (const [name, attribute] of attributes) {
      for (let component = 0; component < attribute.itemSize; component++) {
        values[name].push(
          THREE.MathUtils.lerp(attribute.getComponent(a, component), attribute.getComponent(b, component), t),
        );
      }
    }
    const influences = new Map<number, number>();
    for (const [vertex, multiplier] of [
      [a, 1 - t],
      [b, t],
    ]) {
      for (let component = 0; component < 4; component++) {
        const joint = geometry.getAttribute('skinIndex').getComponent(vertex, component);
        const weight = geometry.getAttribute('skinWeight').getComponent(vertex, component) * multiplier;
        influences.set(joint, (influences.get(joint) ?? 0) + weight);
      }
    }
    const weights = [...influences].sort((x, y) => y[1] - x[1]).slice(0, 4);
    const total = weights.reduce((sum, entry) => sum + entry[1], 0);
    for (let component = 0; component < 4; component++) {
      values.skinIndex[next * 4 + component] = weights[component]?.[0] ?? 0;
      values.skinWeight[next * 4 + component] = (weights[component]?.[1] ?? 0) / (total || 1);
    }
    return next;
  };
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const covered = triangle.every((vertex) => world[vertex].y > 1.22 && Math.abs(world[vertex].x) < 0.115);
    if (!covered || triangle.every((vertex) => world[vertex].y >= TORSO_TOP)) {
      visible.push(...triangle);
      continue;
    }
    const remaining: number[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge];
      const b = triangle[(edge + 1) % 3];
      const aInside = world[a].y >= TORSO_TOP;
      const bInside = world[b].y >= TORSO_TOP;
      if (aInside) remaining.push(a);
      if (aInside !== bInside) remaining.push(intersect(a, b));
    }
    for (let j = 1; j < remaining.length - 1; j++) visible.push(remaining[0], remaining[j], remaining[j + 1]);
  }
  for (const [name, attribute] of attributes) {
    geometry.setAttribute(
      name,
      name === 'skinIndex'
        ? new THREE.Uint16BufferAttribute(values[name], attribute.itemSize)
        : new THREE.Float32BufferAttribute(values[name], attribute.itemSize),
    );
  }
  const groups = geometry.groups.map((group) => ({ ...group }));
  geometry.setIndex(visible);
  geometry.clearGroups();
  for (const group of groups) geometry.addGroup(0, visible.length, group.materialIndex);
  source.geometry = geometry;
}

/** Completes the missing torso and adds shorts while preserving the source pelvis and full legs. */
export function addAureliaBody(vrm: VRM): AureliaBody | undefined {
  let source: THREE.SkinnedMesh | undefined;
  let pigment: MToonMaterial | undefined;
  vrm.scene.updateMatrixWorld(true);
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof MToonMaterial) || material.name !== 'Body_00_SKIN') continue;
      material.map = null;
      material.shadeMultiplyTexture = null;
      material.color.set('#f8e3da');
      material.shadeColorFactor.set('#e2c0c9');
      if (material.isOutline) material.visible = false;
    }
    if (source) return;
    const skin = materials.find(
      (material) => material instanceof MToonMaterial && !material.isOutline && material.name === 'Body_00_SKIN',
    );
    if (skin instanceof MToonMaterial) {
      source = object;
      pigment = skin;
    }
  });
  if (!source || !pigment) return;
  const skin = pigment.clone();
  skin.name = 'Aurelia_Continuous_Body_Skin';
  skin.map = null;
  skin.shadeMultiplyTexture = null;
  skin.color.set('#f8e3da');
  skin.shadeColorFactor.set('#e2c0c9');
  skin.isOutline = false;
  skin.outlineWidthFactor = 0;
  skin.side = THREE.DoubleSide;
  const shortsMaterial = new THREE.MeshPhysicalMaterial({
    name: 'Aurelia_Navy_Underlayer_Knit',
    color: 'white',
    vertexColors: true,
    roughness: 0.82,
    metalness: 0,
    sheen: 0.12,
    sheenColor: '#737b95',
    sheenRoughness: 0.9,
    side: THREE.DoubleSide,
  });
  const bind = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.name = name;
    mesh.position.copy(source!.position);
    mesh.quaternion.copy(source!.quaternion);
    mesh.scale.copy(source!.scale);
    mesh.frustumCulled = false;
    mesh.userData.aureliaLayer = 'body';
    (source!.parent ?? vrm.scene).add(mesh);
    mesh.bind(source!.skeleton, source!.bindMatrix);
    return mesh;
  };
  const body = {
    torso: bindAureliaGeometry(vrm, torsoGeometry(source), skin, 'Aurelia_Continuous_Torso'),
    shorts: bind(fittedShorts(source), shortsMaterial, 'Aurelia_Fitted_Underlayer_Shorts'),
  };
  body.torso.userData.aureliaLayer = 'body';
  trimCoveredNeck(source);
  return body;
}
