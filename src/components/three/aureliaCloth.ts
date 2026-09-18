import * as THREE from 'three';

export interface ClothCapsule {
  a: THREE.Vector3;
  b: THREE.Vector3;
  radius: number;
}
interface Constraint {
  a: number;
  b: number;
  length: number;
  stiffness: number;
}
const STEP = 1 / 120;

/** Waist-pinned Verlet cloth. Solves in world space; rendering remains a skinned mesh. */
export class AureliaCloth {
  readonly position: Float64Array;
  private readonly previous: Float64Array;
  private readonly rest: Float64Array;
  private readonly constraints: Constraint[] = [];
  private readonly goal: Float64Array;
  private readonly inverse = new THREE.Matrix4();
  private readonly anchorTransform = new THREE.Matrix4();
  private readonly rebase = new THREE.Matrix4();
  private readonly scratch = new THREE.Vector3();
  private readonly fromPosition = new THREE.Vector3();
  private readonly toPosition = new THREE.Vector3();
  private readonly fromRotation = new THREE.Quaternion();
  private readonly toRotation = new THREE.Quaternion();
  private readonly interpolatedRotation = new THREE.Quaternion();
  private readonly fromScale = new THREE.Vector3();
  private readonly toScale = new THREE.Vector3();
  private readonly interpolatedScale = new THREE.Vector3();
  private readonly interpolatedTransform = new THREE.Matrix4();
  private accumulated = 0;
  private initialized = false;
  private lastAnchor = new THREE.Vector3();
  private readonly movable: Float64Array;

  constructor(
    readonly columns: number,
    readonly rows: number,
    vertices: ArrayLike<number>,
  ) {
    this.rest = Float64Array.from(vertices);
    this.position = Float64Array.from(vertices);
    this.previous = Float64Array.from(vertices);
    this.goal = Float64Array.from(vertices);
    this.movable = new Float64Array(columns * rows);
    const add = (a: number, b: number, stiffness: number) => {
      const offsetA = a * 3,
        offsetB = b * 3;
      const length = Math.hypot(
        this.rest[offsetA] - this.rest[offsetB],
        this.rest[offsetA + 1] - this.rest[offsetB + 1],
        this.rest[offsetA + 2] - this.rest[offsetB + 2],
      );
      this.constraints.push({ a, b, length, stiffness });
    };
    for (let row = 0; row < rows; row++)
      for (let column = 0; column < columns; column++) {
        const id = row * columns + column;
        this.movable[id] = row === 0 ? 0 : 1;
        add(id, row * columns + ((column + 1) % columns), 1);
        if (row + 1 < rows) {
          add(id, id + columns, 1);
          add(id, (row + 1) * columns + ((column + 1) % columns), 0.62);
          add(id, (row + 1) * columns + ((column - 1 + columns) % columns), 0.62);
        }
        if (row + 2 < rows) add(id, id + columns * 2, 0.26);
        add(id, row * columns + ((column + 2) % columns), 0.2);
      }
  }

  reset(transform: THREE.Matrix4) {
    for (let i = 0; i < this.rest.length; i += 3) {
      this.scratch.fromArray(this.rest, i).applyMatrix4(transform);
      this.scratch.toArray(this.position, i);
    }
    this.previous.set(this.position);
    this.goal.set(this.position);
    this.lastAnchor.setFromMatrixPosition(transform);
    this.accumulated = 0;
    this.inverse.copy(transform).invert();
    this.anchorTransform.copy(transform);
    this.initialized = true;
  }

  advance(delta: number, transform: THREE.Matrix4, colliders: ClothCapsule[]) {
    if (!this.initialized) this.reset(transform);
    if (!Number.isFinite(delta) || delta <= 0) {
      if (!transform.equals(this.anchorTransform)) {
        // A paused manual pose moves the whole settled garment without advancing physics.
        this.rebase.copy(this.anchorTransform).invert().premultiply(transform);
        for (let i = 0; i < this.position.length; i += 3) {
          this.scratch.fromArray(this.position, i).applyMatrix4(this.rebase).toArray(this.position, i);
          this.scratch.fromArray(this.previous, i).applyMatrix4(this.rebase).toArray(this.previous, i);
        }
      }
      this.inverse.copy(transform).invert();
      this.anchorTransform.copy(transform);
      this.lastAnchor.setFromMatrixPosition(transform);
      return;
    }
    this.inverse.copy(transform).invert();
    this.scratch.setFromMatrixPosition(transform);
    if (this.scratch.distanceTo(this.lastAnchor) > 0.35) this.reset(transform);
    this.lastAnchor.setFromMatrixPosition(transform);
    this.anchorTransform.decompose(this.fromPosition, this.fromRotation, this.fromScale);
    transform.decompose(this.toPosition, this.toRotation, this.toScale);
    const frameDelta = Math.min(0.05, delta);
    let elapsed = -this.accumulated;
    this.accumulated += frameDelta;
    while (this.accumulated + 1e-10 >= STEP) {
      this.accumulated = Math.max(0, this.accumulated - STEP);
      elapsed += STEP;
      const alpha = THREE.MathUtils.clamp(elapsed / frameDelta, 0, 1);
      this.scratch.lerpVectors(this.fromPosition, this.toPosition, alpha);
      this.interpolatedRotation.slerpQuaternions(this.fromRotation, this.toRotation, alpha);
      this.interpolatedScale.lerpVectors(this.fromScale, this.toScale, alpha);
      this.interpolatedTransform.compose(this.scratch, this.interpolatedRotation, this.interpolatedScale);
      for (let i = 0; i < this.rest.length; i += 3)
        this.scratch.fromArray(this.rest, i).applyMatrix4(this.interpolatedTransform).toArray(this.goal, i);
      this.step(colliders);
    }
    // The render-time seam follows the waist exactly, including fractional timesteps.
    for (let i = 0; i < this.columns * 3; i += 3) {
      this.scratch.fromArray(this.rest, i).applyMatrix4(transform);
      this.scratch.toArray(this.position, i);
      this.scratch.toArray(this.previous, i);
    }
    this.anchorTransform.copy(transform);
  }

  private step(colliders: ClothCapsule[]) {
    const p = this.position,
      before = this.previous;
    for (let i = 0; i < p.length; i += 3) {
      if (this.movable[i / 3] === 0) {
        p[i] = before[i] = this.goal[i];
        p[i + 1] = before[i + 1] = this.goal[i + 1];
        p[i + 2] = before[i + 2] = this.goal[i + 2];
        continue;
      }
      // Damped material inertia. Weak shape memory retains tailored pleats, gravity drapes them.
      for (let axis = 0; axis < 3; axis++) {
        const j = i + axis,
          old = p[j];
        p[j] += (old - before[j]) * 0.987 + (this.goal[j] - old) * 34 * STEP * STEP;
        if (axis === 1) p[j] -= 3.2 * STEP * STEP;
        before[j] = old;
      }
    }
    for (let iteration = 0; iteration < 5; iteration++) {
      for (const constraint of this.constraints) {
        const a = constraint.a * 3,
          b = constraint.b * 3;
        const wa = this.movable[constraint.a],
          wb = this.movable[constraint.b],
          mass = wa + wb;
        if (!mass) continue;
        const dx = p[b] - p[a],
          dy = p[b + 1] - p[a + 1],
          dz = p[b + 2] - p[a + 2];
        const length = Math.hypot(dx, dy, dz);
        if (length < 1e-9) continue;
        const correction = ((length - constraint.length) / length / mass) * constraint.stiffness;
        p[a] += dx * correction * wa;
        p[a + 1] += dy * correction * wa;
        p[a + 2] += dz * correction * wa;
        p[b] -= dx * correction * wb;
        p[b + 1] -= dy * correction * wb;
        p[b + 2] -= dz * correction * wb;
      }
      for (let id = this.columns; id < this.movable.length; id++) {
        const i = id * 3;
        for (const capsule of colliders) {
          const abx = capsule.b.x - capsule.a.x,
            aby = capsule.b.y - capsule.a.y,
            abz = capsule.b.z - capsule.a.z;
          const t = THREE.MathUtils.clamp(
            ((p[i] - capsule.a.x) * abx + (p[i + 1] - capsule.a.y) * aby + (p[i + 2] - capsule.a.z) * abz) /
              (abx * abx + aby * aby + abz * abz || 1),
            0,
            1,
          );
          const cx = capsule.a.x + abx * t,
            cy = capsule.a.y + aby * t,
            cz = capsule.a.z + abz * t;
          const dx = p[i] - cx,
            dy = p[i + 1] - cy,
            dz = p[i + 2] - cz,
            distance = Math.hypot(dx, dy, dz);
          if (distance < capsule.radius && distance > 1e-8) {
            const scale = capsule.radius / distance;
            p[i] = cx + dx * scale;
            p[i + 1] = cy + dy * scale;
            p[i + 2] = cz + dz * scale;
          }
        }
      }
    }
  }

  /** Bilinear displacement shared by the cloth, hem binding and embroidery. */
  sample(u: number, v: number, out: THREE.Vector3) {
    const column = (((u % 1) + 1) % 1) * this.columns,
      row = THREE.MathUtils.clamp(v, 0, 1) * (this.rows - 1);
    const x = Math.floor(column),
      y = Math.floor(row),
      tx = column - x,
      ty = row - y;
    out.set(0, 0, 0);
    for (let corner = 0; corner < 4; corner++) {
      const horizontal = corner % 2;
      const index =
        Math.min(y + (corner < 2 ? 0 : 1), this.rows - 1) * this.columns + ((x + horizontal) % this.columns);
      const weight = (horizontal ? tx : 1 - tx) * (corner < 2 ? 1 - ty : ty);
      this.scratch.fromArray(this.position, index * 3);
      out.addScaledVector(this.scratch, weight);
    }
    return out.applyMatrix4(this.inverse);
  }
}
