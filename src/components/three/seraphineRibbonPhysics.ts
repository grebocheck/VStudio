import * as THREE from 'three';

export interface RibbonCollider {
  /** The unit sphere is an ellipsoid in world space, including cloth clearance. */
  worldFromUnit: THREE.Matrix4;
  unitFromWorld: THREE.Matrix4;
}

const STEP = 1 / 120;
const DAMPING = Math.exp(-5.5 * STEP);

/** A small fixed-step cloth spine: gravity, inertia, stretch/bend constraints and body contact. */
export class SeraphineRibbonPhysics {
  readonly points: THREE.Vector3[];
  readonly lengths: number[];
  private readonly previous: THREE.Vector3[];
  private readonly rest: THREE.Vector3[];
  private readonly spans: number[];
  private readonly lastTransform = new THREE.Matrix4();
  private readonly stepTransform = new THREE.Matrix4();
  private readonly rebase = new THREE.Matrix4();
  private readonly startPosition = new THREE.Vector3();
  private readonly endPosition = new THREE.Vector3();
  private readonly startRotation = new THREE.Quaternion();
  private readonly endRotation = new THREE.Quaternion();
  private readonly startScale = new THREE.Vector3();
  private readonly endScale = new THREE.Vector3();
  private readonly interpolatedPosition = new THREE.Vector3();
  private readonly interpolatedRotation = new THREE.Quaternion();
  private readonly interpolatedScale = new THREE.Vector3();
  private readonly anchor = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly difference = new THREE.Vector3();
  private readonly velocity = new THREE.Vector3();
  private readonly contact = new THREE.Vector3();
  private accumulator = 0;
  private scale = 1;

  constructor(rest: THREE.Vector3[], transform = new THREE.Matrix4()) {
    this.rest = rest.map((point) => point.clone());
    this.points = rest.map((point) => point.clone());
    this.previous = rest.map((point) => point.clone());
    this.lengths = rest.slice(1).map((point, i) => point.distanceTo(rest[i]));
    this.spans = rest.slice(2).map((point, i) => point.distanceTo(rest[i]));
    this.reset(transform);
  }

  private reset(transform: THREE.Matrix4) {
    this.rest.forEach((point, i) => {
      this.points[i].copy(point).applyMatrix4(transform);
      this.previous[i].copy(this.points[i]);
    });
    this.lastTransform.copy(transform);
    this.scale = transform.getMaxScaleOnAxis();
    this.accumulator = 0;
  }

  update(delta: number, transform: THREE.Matrix4, colliders: readonly RibbonCollider[] = []) {
    this.lastTransform.decompose(this.startPosition, this.startRotation, this.startScale);
    transform.decompose(this.endPosition, this.endRotation, this.endScale);
    this.anchor.copy(this.rest[0]).applyMatrix4(transform);
    if (!Number.isFinite(delta) || delta <= 0) {
      // A paused portrait must remain pixel-stable. Manual pose edits carry the frozen cloth with the head.
      if (!transform.equals(this.lastTransform)) {
        this.rebase.copy(this.lastTransform).invert().premultiply(transform);
        for (let i = 0; i < this.points.length; i++) {
          this.points[i].applyMatrix4(this.rebase);
          this.previous[i].applyMatrix4(this.rebase);
        }
        this.lastTransform.copy(transform);
        this.scale = transform.getMaxScaleOnAxis();
      }
      this.accumulator = 0;
      return;
    }
    if (
      delta > 0.25 ||
      this.anchor.distanceTo(this.points[0]) > 0.28 * this.scale ||
      this.startRotation.angleTo(this.endRotation) > 1.25
    ) {
      this.reset(transform);
      return;
    }
    const before = this.accumulator;
    this.accumulator += delta;
    let elapsed = STEP - before;
    while (this.accumulator + 1e-10 >= STEP) {
      const alpha = Math.min(1, elapsed / delta);
      this.interpolatedPosition.lerpVectors(this.startPosition, this.endPosition, alpha);
      this.interpolatedRotation.slerpQuaternions(this.startRotation, this.endRotation, alpha);
      this.interpolatedScale.lerpVectors(this.startScale, this.endScale, alpha);
      this.stepTransform.compose(this.interpolatedPosition, this.interpolatedRotation, this.interpolatedScale);
      this.scale = this.stepTransform.getMaxScaleOnAxis();
      this.integrate(this.stepTransform, colliders);
      this.accumulator -= STEP;
      elapsed += STEP;
    }
    // Keep the seam exactly on the knot even when the display cadence is faster than the solver.
    this.points[0].copy(this.anchor);
    this.previous[0].copy(this.anchor);
    for (let i = 1; i < this.points.length; i++) {
      this.difference.subVectors(this.points[i], this.points[i - 1]);
      const length = this.lengths[i - 1] * this.scale;
      // A frame can end between fixed steps; do not stretch the seam to the new display-time anchor.
      if (this.difference.length() > length * 1.015)
        this.points[i].copy(this.points[i - 1]).add(this.difference.setLength(length * 1.015));
    }
    this.lastTransform.copy(transform);
  }

  private integrate(transform: THREE.Matrix4, colliders: readonly RibbonCollider[]) {
    this.points[0].copy(this.rest[0]).applyMatrix4(transform);
    this.previous[0].copy(this.points[0]);
    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      this.velocity.subVectors(point, this.previous[i]).multiplyScalar(DAMPING);
      this.velocity.clampLength(0, 0.035 * this.scale);
      this.previous[i].copy(point);
      this.target.copy(this.rest[i]).applyMatrix4(transform);
      // Satin's gentle shape memory keeps the two cut tails spread, without prescribing their motion.
      this.difference.subVectors(this.target, point).multiplyScalar(55 * STEP * STEP);
      point.add(this.velocity).add(this.difference);
      point.y -= 9.81 * this.scale * STEP * STEP;
    }
    for (let pass = 0; pass < 14; pass++) {
      for (let i = 0; i < this.spans.length; i++) this.constrain(i, i + 2, this.spans[i], 0.16);
      for (let i = this.lengths.length - 1; i >= 0; i--) this.constrain(i, i + 1, this.lengths[i], 1);
      for (let i = 0; i < this.lengths.length; i++) this.constrain(i, i + 1, this.lengths[i], 1);
      for (let i = 1; i < this.points.length; i++) {
        for (const collider of colliders) {
          this.contact.copy(this.points[i]).applyMatrix4(collider.unitFromWorld);
          const radius = this.contact.length();
          if (radius >= 1) continue;
          if (radius < 1e-8) this.contact.set(0, 0, -1);
          else this.contact.multiplyScalar(1 / radius);
          this.contact.applyMatrix4(collider.worldFromUnit);
          this.difference.subVectors(this.contact, this.points[i]);
          this.points[i].copy(this.contact);
          // Contact changes position without storing a spurious outward impulse in Verlet history.
          this.previous[i].add(this.difference);
        }
      }
    }
  }

  private constrain(a: number, b: number, length: number, stiffness: number) {
    this.difference.subVectors(this.points[b], this.points[a]);
    const distance = this.difference.length();
    if (distance < 1e-9) return;
    this.difference.multiplyScalar(((distance - length * this.scale) / distance) * stiffness);
    if (a === 0) this.points[b].sub(this.difference);
    else {
      this.points[a].addScaledVector(this.difference, 0.5);
      this.points[b].addScaledVector(this.difference, -0.5);
    }
  }
}
