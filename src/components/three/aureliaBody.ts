import * as THREE from 'three';
import { MToonMaterial, type VRM } from '@pixiv/three-vrm';
import { bodySurface } from './aureliaGarmentShape';
import {
  bindAureliaGeometry,
  createAureliaSkinSampler,
  getAureliaSkeleton,
  registerAureliaSurface,
} from './aureliaSkinning';

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

/** Replace the complete disconnected source waist/neck regions, retaining both open arm roots. */
function trimSourceTorso(source: THREE.SkinnedMesh) {
  const geometry = source.geometry.clone();
  const index = geometry.getIndex();
  if (!index) throw new Error('Aurelia source skin must be indexed.');
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
  // Position welding identifies anatomical components across the source UV seams.
  const parent = world.map((_, i) => i);
  const find = (v: number): number => (parent[v] === v ? v : (parent[v] = find(parent[v])));
  const welded = new Map<string, number>();
  world.forEach((point, i) => {
    const key = point
      .toArray()
      .map((value) => Math.round(value * 1e6))
      .join(',');
    const previous = welded.get(key);
    if (previous !== undefined) parent[i] = previous;
    else welded.set(key, i);
  });
  for (let i = 0; i < index.count; i += 3) {
    const a = find(index.getX(i));
    parent[find(index.getX(i + 1))] = a;
    parent[find(index.getX(i + 2))] = a;
  }
  const bounds = new Map<number, THREE.Box3>();
  world.forEach((point, i) => {
    const component = find(i);
    if (!bounds.has(component)) bounds.set(component, new THREE.Box3());
    bounds.get(component)!.expandByPoint(point);
  });
  const cache = new Map<string, number>();
  const intersect = (a: number, b: number, height: number) => {
    const key = `${Math.min(a, b)}:${Math.max(a, b)}:${height}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const t = (height - world[a].y) / (world[b].y - world[a].y);
    const next = values.position.length / 3;
    for (const [name, attribute] of attributes)
      for (let component = 0; component < attribute.itemSize; component++)
        values[name].push(
          THREE.MathUtils.lerp(attribute.getComponent(a, component), attribute.getComponent(b, component), t),
        );
    const influences = new Map<number, number>();
    for (const [vertex, multiplier] of [
      [a, 1 - t],
      [b, t],
    ])
      for (let component = 0; component < 4; component++) {
        const joint = geometry.getAttribute('skinIndex').getComponent(vertex, component);
        const weight = geometry.getAttribute('skinWeight').getComponent(vertex, component) * multiplier;
        influences.set(joint, (influences.get(joint) ?? 0) + weight);
      }
    const weights = [...influences].sort((x, y) => y[1] - x[1]).slice(0, 4);
    const total = weights.reduce((sum, entry) => sum + entry[1], 0);
    for (let component = 0; component < 4; component++) {
      values.skinIndex[next * 4 + component] = weights[component]?.[0] ?? 0;
      values.skinWeight[next * 4 + component] = (weights[component]?.[1] ?? 0) / (total || 1);
    }
    cache.set(key, next);
    return next;
  };
  const visible: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const region = bounds.get(find(triangle[0]))!;
    const pelvis = region.min.y < 0.1 && region.max.y < 1.15;
    const neck =
      region.min.y > 1.26 && region.max.y > 1.5 && Math.max(Math.abs(region.min.x), Math.abs(region.max.x)) < 0.12;
    if (!pelvis && !neck) {
      visible.push(...triangle);
      continue;
    }
    const height = pelvis ? TORSO_BOTTOM : TORSO_TOP;
    const remaining: number[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge],
        b = triangle[(edge + 1) % 3];
      const aInside = pelvis ? world[a].y <= height : world[a].y >= height;
      const bInside = pelvis ? world[b].y <= height : world[b].y >= height;
      if (aInside) remaining.push(a);
      if (aInside !== bInside) remaining.push(intersect(a, b, height));
    }
    for (let j = 1; j < remaining.length - 1; j++) visible.push(remaining[0], remaining[j], remaining[j + 1]);
  }
  for (const [name, attribute] of attributes)
    geometry.setAttribute(
      name,
      name === 'skinIndex'
        ? new THREE.Uint16BufferAttribute(values[name], attribute.itemSize)
        : new THREE.Float32BufferAttribute(values[name], attribute.itemSize),
    );
  const groups = geometry.groups.map((group) => ({ ...group }));
  geometry.setIndex(visible);
  geometry.clearGroups();
  for (const group of groups) geometry.addGroup(0, visible.length, group.materialIndex);
  source.geometry = geometry;
}

interface SurfaceVertex {
  uv: THREE.Vector2;
  seam?: ClothVertex;
}

/** Exact open boundary loops, including interpolated skin weights at the two clipping planes. */
function sourceBoundaryLoops(source: THREE.SkinnedMesh, skeleton: THREE.Skeleton): ClothVertex[][] {
  const geometry = source.geometry;
  const position = geometry.getAttribute('position'),
    normal = geometry.getAttribute('normal');
  const skinIndex = geometry.getAttribute('skinIndex'),
    skinWeight = geometry.getAttribute('skinWeight');
  const index = geometry.getIndex()!;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(source.matrixWorld);
  const boneMap = source.skeleton.bones.map((bone) => skeleton.bones.indexOf(bone));
  const vertices = Array.from({ length: position.count }, (_, i): ClothVertex => {
    const point = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(source.matrixWorld);
    const influences = new Map<number, number>();
    for (let c = 0; c < 4; c++) {
      const weight = skinWeight.getComponent(i, c),
        joint = boneMap[skinIndex.getComponent(i, c)];
      if (weight > 0 && joint >= 0) influences.set(joint, (influences.get(joint) ?? 0) + weight);
    }
    return {
      position: point,
      normal: new THREE.Vector3().fromBufferAttribute(normal, i).applyMatrix3(normalMatrix).normalize(),
      influences,
      y: point.y,
    };
  });
  const welded = new Map<string, number>();
  const canonical = vertices.map((vertex, i) => {
    const key = vertex.position
      .toArray()
      .map((value) => Math.round(value * 1e6))
      .join(',');
    if (!welded.has(key)) welded.set(key, i);
    return welded.get(key)!;
  });
  const edges = new Map<string, { count: number; a: number; b: number }>();
  for (let i = 0; i < index.count; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = canonical[index.getX(i + j)],
        b = canonical[index.getX(i + ((j + 1) % 3))];
      const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
      const edge = edges.get(key);
      if (edge) edge.count++;
      else edges.set(key, { count: 1, a, b });
    }
  const adjacency = new Map<number, number[]>();
  for (const { count, a, b } of edges.values())
    if (count === 1) {
      if (!adjacency.has(a)) adjacency.set(a, []);
      if (!adjacency.has(b)) adjacency.set(b, []);
      adjacency.get(a)!.push(b);
      adjacency.get(b)!.push(a);
    }
  const visited = new Set<number>(),
    loops: ClothVertex[][] = [];
  for (const start of adjacency.keys()) {
    if (visited.has(start)) continue;
    const loop: ClothVertex[] = [];
    let previous = -1,
      current: number | undefined = start;
    while (current !== undefined && !visited.has(current)) {
      visited.add(current);
      loop.push(vertices[current]);
      const next: number | undefined = adjacency.get(current)?.find((vertex) => vertex !== previous);
      previous = current;
      current = next;
    }
    if (current === start && loop.length >= 3) loops.push(loop);
  }
  return loops;
}

function surfacePhi(point: THREE.Vector3) {
  const front = bodySurface(0, point.y).z,
    back = bodySurface(Math.PI, point.y).z;
  const width = bodySurface(Math.PI / 2, point.y).x;
  const phi = Math.atan2(point.x / width, (point.z - (front + back) * 0.5) / ((front - back) * 0.5));
  return phi < 0 ? phi + Math.PI * 2 : phi;
}

/** A single torso surface has two true armholes; all four joins reuse source positions and weights. */
function torsoGeometry(source: THREE.SkinnedMesh, vrm: VRM) {
  const loops = sourceBoundaryLoops(source, getAureliaSkeleton(vrm));
  const waist = loops.find((loop) => loop.every((v) => Math.abs(v.y - TORSO_BOTTOM) < 1e-5));
  const neck = loops.find((loop) => loop.every((v) => Math.abs(v.y - TORSO_TOP) < 1e-5));
  const arms = loops.filter(
    (loop) =>
      loop.every((v) => v.y > 1.23 && v.y < 1.32) &&
      loop.some((v) => Math.abs(v.position.x) > 0.12) &&
      loop.some((v) => Math.abs(v.position.x) < 0.1),
  );
  if (!waist || !neck || arms.length !== 2) throw new Error('Aurelia skin boundary topology is incomplete.');
  const ring = (loop: ClothVertex[]) => {
    const ordered = loop
      .map((seam): SurfaceVertex => ({ uv: new THREE.Vector2(surfacePhi(seam.position), seam.y), seam }))
      .sort((a, b) => a.uv.x - b.uv.x);
    // Split the original crossing edge exactly at the periodic UV meridian.
    const last = ordered.at(-1)!,
      first = ordered[0];
    const t = (Math.PI * 2 - last.uv.x) / (first.uv.x + Math.PI * 2 - last.uv.x);
    const crossing = interpolateVertex(last.seam!, first.seam!, t);
    return [
      { uv: new THREE.Vector2(0, crossing.y), seam: crossing },
      ...ordered.filter((v) => v.uv.x > 1e-7 && v.uv.x < Math.PI * 2 - 1e-7),
      { uv: new THREE.Vector2(Math.PI * 2, crossing.y), seam: crossing },
    ];
  };
  const bottom = ring(waist),
    top = ring(neck);
  const side = (phi: number) =>
    Array.from(
      { length: 31 },
      (_, i): SurfaceVertex => ({
        uv: new THREE.Vector2(phi, THREE.MathUtils.lerp(TORSO_BOTTOM, TORSO_TOP, (i + 1) / 32)),
      }),
    );
  const contour = [...bottom, ...side(Math.PI * 2), ...[...top].reverse(), ...side(0).reverse()];
  const holes = arms.map((loop) =>
    loop.map(
      (seam): SurfaceVertex => ({
        uv: new THREE.Vector2(surfacePhi(seam.position), seam.y),
        seam,
      }),
    ),
  );
  const inside = (point: THREE.Vector2, polygon: SurfaceVertex[]) => {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i].uv,
        b = polygon[j].uv;
      if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
    }
    return hit;
  };
  // Earcut treats a one-vertex hole as an interior Steiner point. These regular samples
  // give the constrained triangulation below enough resolution across the curved surface.
  const interior: SurfaceVertex[][] = [];
  for (let row = 1; row < 32; row++)
    for (let column = 1; column < 72; column++) {
      const uv = new THREE.Vector2(
        (column / 72) * Math.PI * 2,
        THREE.MathUtils.lerp(TORSO_BOTTOM, TORSO_TOP, row / 32),
      );
      if (!holes.some((hole) => inside(uv, hole))) interior.push([{ uv }]);
    }
  const vertices = [...contour, ...holes.flat(), ...interior.flat()];
  let faces = THREE.ShapeUtils.triangulateShape(
    contour.map((v) => v.uv),
    [...holes, ...interior].map((hole) => hole.map((v) => v.uv)),
  );
  // Restore collinear constrained vertices that Earcut may omit (including the source's
  // exact waist/neck intersections). Both sides of every edge use the same subdivisions.
  const edgePoints = new Map<string, number[]>();
  const beforeRefinement = vertices.length;
  const conforming: number[][] = [];
  for (const face of faces) {
    const polygon: number[] = [];
    for (let edge = 0; edge < 3; edge++) {
      const a = face[edge],
        b = face[(edge + 1) % 3];
      const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
      let points = edgePoints.get(key);
      if (!points) {
        const start = vertices[Math.min(a, b)].uv,
          end = vertices[Math.max(a, b)].uv;
        const dx = end.x - start.x,
          dy = end.y - start.y,
          length = dx * dx + dy * dy;
        const entries: { index: number; t: number }[] = [];
        for (let i = 0; i < beforeRefinement; i++) {
          if (i === a || i === b) continue;
          const p = vertices[i].uv;
          const t = ((p.x - start.x) * dx + (p.y - start.y) * dy) / length;
          if (t > 1e-8 && t < 1 - 1e-8 && Math.abs((p.x - start.x) * dy - (p.y - start.y) * dx) < 1e-10)
            entries.push({ index: i, t });
        }
        points = entries.sort((a, b) => a.t - b.t).map((entry) => entry.index);
        edgePoints.set(key, points);
      }
      polygon.push(a, ...(a < b ? points : [...points].reverse()));
    }
    if (polygon.length === 3) conforming.push(face);
    else {
      const center = vertices.length;
      vertices.push({
        uv: face.reduce((sum, i) => sum.add(vertices[i].uv), new THREE.Vector2()).multiplyScalar(1 / 3),
      });
      for (let edge = 0; edge < polygon.length; edge++)
        conforming.push([polygon[edge], polygon[(edge + 1) % polygon.length], center]);
    }
  }
  faces = conforming;
  const boundary = new Set<string>();
  const edgeKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;
  let offset = 0;
  for (const loop of [contour, ...holes]) {
    for (let i = 0; i < loop.length; i++) boundary.add(edgeKey(offset + i, offset + ((i + 1) % loop.length)));
    offset += loop.length;
  }
  // Earcut establishes the constraints, but its bridges to interior points can produce long
  // circumferential chords. Constrained Lawson flips in metre-scaled parameter space replace
  // those fans with compact triangles before the flat domain is mapped onto curved anatomy.
  const metric = (index: number) => new THREE.Vector2(vertices[index].uv.x * 0.115, vertices[index].uv.y);
  const oriented = (a: number, b: number, c: number) => {
    const p = metric(a),
      q = metric(b),
      r = metric(c);
    return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  };
  for (const face of faces)
    if (oriented(...(face as [number, number, number])) < 0) [face[1], face[2]] = [face[2], face[1]];
  for (let pass = 0; pass < 512; pass++) {
    const adjacent = new Map<string, { a: number; b: number; faces: number[] }>();
    faces.forEach((face, index) => {
      for (let edge = 0; edge < 3; edge++) {
        const a = face[edge],
          b = face[(edge + 1) % 3],
          key = edgeKey(a, b);
        if (!adjacent.has(key)) adjacent.set(key, { a, b, faces: [] });
        adjacent.get(key)!.faces.push(index);
      }
    });
    const changed = new Set<number>();
    let flips = 0;
    for (const [key, edge] of adjacent) {
      if (edge.faces.length !== 2 || boundary.has(key)) continue;
      const [first, second] = edge.faces;
      if (changed.has(first) || changed.has(second)) continue;
      const { a, b } = edge;
      const c = faces[first].find((v) => v !== a && v !== b)!;
      const d = faces[second].find((v) => v !== a && v !== b)!;
      if (oriented(c, d, a) * oriented(c, d, b) >= -1e-18) continue;
      const oppositeCotangent = (vertex: number) => {
        const p = metric(vertex),
          u = metric(a).sub(p),
          v = metric(b).sub(p);
        return u.dot(v) / Math.abs(u.x * v.y - u.y * v.x);
      };
      if (oppositeCotangent(c) + oppositeCotangent(d) >= -1e-7) continue;
      const left = [c, d, a],
        right = [d, c, b];
      if (oriented(c, d, a) < 0) [left[1], left[2]] = [left[2], left[1]];
      if (oriented(d, c, b) < 0) [right[1], right[2]] = [right[2], right[1]];
      faces[first] = left;
      faces[second] = right;
      changed.add(first);
      changed.add(second);
      flips++;
    }
    if (!flips) break;
  }
  // Shared interior midpoints keep adjacent triangles conforming. Fixed source boundaries
  // retain their original vertices, positions and weights throughout refinement.
  for (let pass = 0; pass < 8; pass++) {
    const split = new Map<string, number>();
    for (const face of faces)
      for (let i = 0; i < 3; i++) {
        const a = face[i],
          b = face[(i + 1) % 3],
          key = edgeKey(a, b);
        if (boundary.has(key)) continue;
        const du = (vertices[a].uv.x - vertices[b].uv.x) * 0.115;
        const dv = vertices[a].uv.y - vertices[b].uv.y;
        if (Math.hypot(du, dv) <= 0.022 || split.has(key)) continue;
        const midpoint = vertices.length;
        vertices.push({ uv: vertices[a].uv.clone().lerp(vertices[b].uv, 0.5) });
        split.set(key, midpoint);
      }
    if (!split.size) break;
    const refined: number[][] = [];
    for (const [a, b, c] of faces) {
      const ab = split.get(edgeKey(a, b)),
        bc = split.get(edgeKey(b, c)),
        ca = split.get(edgeKey(c, a));
      if (ab !== undefined && bc !== undefined && ca !== undefined)
        refined.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
      else if (ab !== undefined && bc !== undefined) refined.push([b, bc, ab], [a, ab, c], [ab, bc, c]);
      else if (bc !== undefined && ca !== undefined) refined.push([c, ca, bc], [b, bc, a], [bc, ca, a]);
      else if (ca !== undefined && ab !== undefined) refined.push([a, ab, ca], [c, ca, b], [ca, ab, b]);
      else if (ab !== undefined) refined.push([a, ab, c], [ab, b, c]);
      else if (bc !== undefined) refined.push([b, bc, a], [bc, c, a]);
      else if (ca !== undefined) refined.push([c, ca, b], [ca, a, b]);
      else refined.push([a, b, c]);
    }
    faces = refined;
  }
  const sample = createAureliaSkinSampler(vrm, false);
  const positions: number[] = [],
    uv: number[] = [],
    skinIndices: number[] = [],
    skinWeights: number[] = [];
  const fields = [bottom, top, ...holes];
  const nearest = (point: THREE.Vector2, loop: SurfaceVertex[]) => {
    let distance = Infinity,
      result: { source: ClothVertex; uv: THREE.Vector2; distance: number } | undefined;
    const closed = loop !== bottom && loop !== top;
    for (let i = 0; i < loop.length - (closed ? 0 : 1); i++) {
      const a = loop[i],
        b = loop[(i + 1) % loop.length];
      const ax = a.uv.x * 0.115,
        bx = b.uv.x * 0.115;
      const dx = bx - ax,
        dy = b.uv.y - a.uv.y;
      const t = THREE.MathUtils.clamp(
        ((point.x * 0.115 - ax) * dx + (point.y - a.uv.y) * dy) / (dx * dx + dy * dy || 1),
        0,
        1,
      );
      const d = Math.hypot(point.x * 0.115 - ax - dx * t, point.y - a.uv.y - dy * t);
      if (d < distance) {
        distance = d;
        result = {
          source: interpolateVertex(a.seam!, b.seam!, t),
          uv: a.uv.clone().lerp(b.uv, t),
          distance: d,
        };
      }
    }
    return result!;
  };
  const fit = (coordinate: THREE.Vector2) => {
    const point = bodySurface(coordinate.x, coordinate.y);
    let influences = sample(point);
    const adjustments = fields
      .map((field, i) => {
        const match = nearest(coordinate, field);
        const strength = 1 - THREE.MathUtils.smootherstep(match.distance, 0, i === 0 ? 0.055 : i === 1 ? 0.024 : 0.036);
        return { ...match, strength };
      })
      .filter((match) => match.strength > 0)
      .sort((a, b) => a.strength - b.strength);
    for (const match of adjustments) {
      point.addScaledVector(match.source.position.clone().sub(bodySurface(match.uv.x, match.uv.y)), match.strength);
      const blended = new Map<number, number>();
      for (const [joint, weight] of influences) blended.set(joint, weight * (1 - match.strength));
      for (const [joint, weight] of match.source.influences)
        blended.set(joint, (blended.get(joint) ?? 0) + weight * match.strength);
      influences = blended;
    }
    return { point, influences };
  };
  registerAureliaSurface(vrm, (point) => {
    if (point.y < TORSO_BOTTOM || point.y > TORSO_TOP)
      return { offset: new THREE.Vector3(), influences: sample(point) };
    const phi = surfacePhi(point);
    const fitted = fit(new THREE.Vector2(phi, point.y));
    return { offset: fitted.point.sub(bodySurface(phi, point.y)), influences: fitted.influences };
  });
  for (const vertex of vertices) {
    const { point, influences } = vertex.seam
      ? { point: vertex.seam.position, influences: vertex.seam.influences }
      : fit(vertex.uv);
    point.toArray(positions, positions.length);
    uv.push(vertex.uv.x / (Math.PI * 2), (vertex.uv.y - TORSO_BOTTOM) / (TORSO_TOP - TORSO_BOTTOM));
    const weights = [...influences]
      .filter(([, weight]) => weight > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
    for (let j = 0; j < 4; j++) {
      skinIndices.push(weights[j]?.[0] ?? 0);
      skinWeights.push((weights[j]?.[1] ?? 0) / (total || 1));
    }
  }
  // UV winding corresponds to d/dphi cross d/dy, the outward torso normal.
  for (const face of faces) {
    const [a, b, c] = face.map((i) => vertices[i].uv);
    if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) < 0) [face[1], face[2]] = [face[2], face[1]];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  geometry.setIndex(faces.flat());
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  vertices.forEach((vertex, i) => {
    if (vertex.seam) normals.setXYZ(i, vertex.seam.normal.x, vertex.seam.normal.y, vertex.seam.normal.z);
  });
  // Weld lighting only across the periodic meridian; the geometry retains its continuous UV range.
  const meridian = new Map<string, number[]>();
  vertices.forEach((vertex, i) => {
    if (Math.abs(Math.sin(vertex.uv.x / 2)) > 1e-7) return;
    const key = Math.round(vertex.uv.y * 1e8).toString();
    if (!meridian.has(key)) meridian.set(key, []);
    meridian.get(key)!.push(i);
  });
  for (const group of meridian.values()) {
    const normal = new THREE.Vector3();
    for (const i of group) normal.add(new THREE.Vector3().fromBufferAttribute(normals, i));
    normal.normalize();
    for (const i of group) normals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  return geometry;
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
  const shorts = fittedShorts(source);
  trimSourceTorso(source);
  const body = {
    torso: bindAureliaGeometry(vrm, torsoGeometry(source, vrm), skin, 'Aurelia_Continuous_Torso'),
    shorts: bind(shorts, shortsMaterial, 'Aurelia_Fitted_Underlayer_Shorts'),
  };
  body.torso.userData.aureliaLayer = 'body';
  return body;
}
