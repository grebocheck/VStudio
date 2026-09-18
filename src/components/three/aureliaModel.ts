import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  VRMLoaderPlugin,
  VRMUtils,
  type VRM,
  type VRMHumanBoneName,
  MToonMaterial,
  VRMSpringBoneCollider,
  VRMSpringBoneColliderShapeSphere,
  VRMSpringBoneColliderShapeCapsule,
} from '@pixiv/three-vrm';
import type { AvatarConfig, RigParams } from '../../types';
import { calculateAvatar3DPose, poseToVrmExpressions } from './avatar3DPose';
import { addAureliaWardrobe } from './aureliaWardrobe';
import { bodiceSurface } from './aureliaGarmentShape';

const MODEL_URL = '/models/aurelia-3d/base.vrm';

function gem(material: THREE.Material, size: number) {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), material);
  mesh.scale.set(0.7, 1.35, 0.45);
  return mesh;
}

function star(radius: number, depth: number, material: THREE.Material) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? radius * 0.43 : radius;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  return new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: radius * 0.07,
      bevelThickness: radius * 0.06,
    }),
    material,
  );
}

function tube(points: THREE.Vector3[], radius: number, material: THREE.Material) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, radius, 6, false), material);
}

/** Reuse authored pupil/strand detail while changing pigment in the shader, without editing source images. */
function pigment(material: MToonMaterial, kind: 'hair' | 'iris') {
  const compile = material.onBeforeCompile.bind(material);
  const cacheKey = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    compile(shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace(
      'diffuseColor *= sampledDiffuseColor;',
      `float pigmentValue = dot(sampledDiffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      ${
        kind === 'hair'
          ? 'sampledDiffuseColor.rgb = vec3(clamp(0.68 + pigmentValue * 3.0, 0.72, 1.16));'
          : `vec3 irisPigment = mix(vec3(0.018, 0.13, 0.17), vec3(0.19, 0.86, 0.73), smoothstep(0.025, 0.24, pigmentValue));
             irisPigment *= smoothstep(0.008, 0.055, pigmentValue);
             sampledDiffuseColor.rgb = mix(irisPigment, vec3(1.0), smoothstep(0.58, 0.94, pigmentValue));`
      }
      diffuseColor *= sampledDiffuseColor;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      'material.shadeColor = shadeColorFactor;',
      `material.shadeColor = shadeColorFactor;
       #ifdef USE_MAP
         material.shadeColor *= sampledDiffuseColor.rgb;
       #endif`,
    );
  };
  material.customProgramCacheKey = () => `${cacheKey()},aurelia-pigment-${kind}-1`;
  material.needsUpdate = true;
}

function fitHairCollisions(vrm: VRM) {
  const manager = vrm.springBoneManager;
  const chest = vrm.humanoid.getRawBoneNode('upperChest') ?? vrm.humanoid.getRawBoneNode('chest');
  if (!manager || !chest) return;
  const colliders: VRMSpringBoneCollider[] = [];
  for (const side of [-1, 1]) {
    // Source colliders followed a flat shirt. These volumes cover the new garment's actual bust,
    // with the authored strand hit-radius providing its small clearance above the cloth.
    const bust = new VRMSpringBoneCollider(new VRMSpringBoneColliderShapeSphere({ radius: 0.072 }));
    bust.name = `Aurelia_Bodice_Hair_Collider_${side < 0 ? 'R' : 'L'}`;
    bust.position.copy(chest.worldToLocal(new THREE.Vector3(side * 0.057, 1.176, 0.118)));
    chest.add(bust);
    colliders.push(bust);
    const shoulder = new VRMSpringBoneCollider(
      new VRMSpringBoneColliderShapeCapsule({
        offset: chest.worldToLocal(new THREE.Vector3(side * 0.048, 1.267, -0.002)),
        tail: chest.worldToLocal(new THREE.Vector3(side * 0.122, 1.259, -0.002)),
        radius: 0.039,
      }),
    );
    shoulder.name = `Aurelia_Shoulder_Hair_Collider_${side < 0 ? 'R' : 'L'}`;
    chest.add(shoulder);
    colliders.push(shoulder);
  }
  const group = { name: 'Aurelia_Tailored_Wardrobe', colliders };
  for (const joint of manager.joints) {
    if (!joint.bone.name.includes('Hair')) continue;
    joint.colliderGroups = [...joint.colliderGroups, group];
    // Re-registering the existing joint rebuilds dependency ordering, so chest colliders update
    // before hair simulation even when the upper body is tracking a moving target.
    manager.addJoint(joint);
  }
}

function celestialAccessories(vrm: VRM) {
  const gold = new THREE.MeshStandardMaterial({
    name: 'Aurelia_brushed_gold',
    color: '#d6b466',
    metalness: 0.74,
    roughness: 0.26,
  });
  const jewel = new THREE.MeshStandardMaterial({
    name: 'Aurelia_celestial_crystal',
    color: '#42d9cb',
    emissive: '#176660',
    emissiveIntensity: 0.22,
    metalness: 0.32,
    roughness: 0.19,
  });
  const pearl = new THREE.MeshStandardMaterial({
    name: 'Aurelia_pearl',
    color: '#eee9ff',
    metalness: 0.15,
    roughness: 0.23,
  });
  const head = vrm.humanoid.getRawBoneNode('head')!;
  const headWorld = head.getWorldPosition(new THREE.Vector3());
  const box = new THREE.Box3().setFromObject(vrm.scene);
  const crown = new THREE.Group();
  crown.name = 'Aurelia_Celestial_Crown';
  head.add(crown);
  crown.quaternion.copy(head.getWorldQuaternion(new THREE.Quaternion()).invert());
  const top = box.max.y - headWorld.y;
  const hair: THREE.Mesh[] = [];
  vrm.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material.name.includes('HAIR'))) hair.push(object);
  });
  // Fit the actual hair shell. A guessed skull ellipse buried the front and floated at the temples.
  // This group cancels the rest-pose head rotation, so its authored coordinates use world axes.
  const hairCenterZ = -0.03;
  const bandY = box.max.y - 0.048;
  const fittedPoint = (angle: number, y = bandY) => {
    const direction = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
    const center = new THREE.Vector3(0, y, hairCenterZ);
    const ray = new THREE.Raycaster(center.clone().addScaledVector(direction, 0.3), direction.clone().negate());
    const hit = ray.intersectObjects(hair, false)[0];
    return (hit?.point ?? center.addScaledVector(direction, 0.093)).addScaledVector(direction, 0.0038).sub(headWorld);
  };
  for (const offset of [0, 0.006]) {
    const points = Array.from({ length: 65 }, (_, i) => fittedPoint((i / 64) * Math.PI * 2, bandY + offset));
    const band = tube(points, offset ? 0.0011 : 0.0021, gold);
    band.name = offset ? 'Aurelia_Crown_Filigree_Rail' : 'Aurelia_Crown_Fitted_Band';
    crown.add(band);
  }
  for (let i = -2; i <= 2; i++) {
    const angle = i * 0.46;
    const ornament = new THREE.Group();
    ornament.name = `Aurelia_Crown_Setting_${i + 2}`;
    ornament.position.copy(fittedPoint(angle));
    ornament.rotation.y = angle;
    const rise = i === 0 ? 0.045 : Math.abs(i) === 1 ? 0.029 : 0.016;
    const size = i === 0 ? 0.018 : Math.abs(i) === 1 ? 0.012 : 0.008;
    // Open gold supports join every setting to the band; the stones have visible thickness in profile.
    for (const side of [-1, 1])
      ornament.add(
        tube(
          [
            new THREE.Vector3(side * size * 0.8, 0, 0),
            new THREE.Vector3(side * size * 0.62, rise * 0.52, 0.002),
            new THREE.Vector3(0, rise - size * 0.5, 0.002),
          ],
          0.0012,
          gold,
        ),
      );
    const backing = star(size, 0.003, gold);
    backing.position.set(0, rise, 0.002);
    ornament.add(backing);
    const crystal = gem(jewel, size * 0.54);
    crystal.position.set(0, rise, 0.006);
    ornament.add(crystal);
    crown.add(ornament);
  }
  for (let i = 0; i < 28; i++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.0019, 8, 6), pearl);
    bead.position.copy(fittedPoint((i / 28) * Math.PI * 2, bandY + 0.003));
    crown.add(bead);
  }
  const clasp = gem(jewel, 0.007);
  clasp.position.copy(fittedPoint(Math.PI, bandY + 0.003));
  clasp.rotation.y = Math.PI;
  crown.add(clasp);
  for (const side of [-1, 1]) {
    const earring = new THREE.Group();
    earring.name = `Aurelia_Earring_${side < 0 ? 'R' : 'L'}`;
    earring.position.copy(head.worldToLocal(new THREE.Vector3(side * 0.096, headWorld.y + top - 0.2, 0.03)));
    earring.quaternion.copy(head.getWorldQuaternion(new THREE.Quaternion()).invert());
    earring.add(
      tube(
        [new THREE.Vector3(), new THREE.Vector3(side * 0.007, -0.025, 0.004), new THREE.Vector3(0, -0.065, 0.008)],
        0.0015,
        gold,
      ),
    );
    const drop = gem(jewel, 0.013);
    drop.position.set(0, -0.073, 0.008);
    earring.add(drop);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0015, 6, 20), gold);
    rim.position.set(0, -0.073, 0.008);
    rim.scale.set(0.65, 1.25, 1);
    earring.add(rim);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.004, 10, 8), pearl);
    bead.position.y = -0.026;
    earring.add(bead);
    head.add(earring);
  }
  const chest = vrm.humanoid.getRawBoneNode('chest')!;
  const brooch = new THREE.Group();
  brooch.name = 'Aurelia_Starlight_Brooch';
  const broochWorld = bodiceSurface(0, 0.95).add(new THREE.Vector3(0, 0, 0.005));
  brooch.position.copy(chest.worldToLocal(broochWorld.clone()));
  brooch.quaternion.copy(chest.getWorldQuaternion(new THREE.Quaternion()).invert());
  const backing = star(0.031, 0.004, gold);
  backing.rotation.z = Math.PI / 5;
  brooch.add(backing);
  const center = gem(jewel, 0.019);
  center.position.z = 0.009;
  brooch.add(center);
  for (const side of [-1, 1]) {
    const chain = Array.from({ length: 20 }, (_, i) => {
      const t = i / 19;
      return bodiceSurface(side * (0.16 + t * 0.72), 0.95 - Math.sin(t * Math.PI) * 0.065)
        .add(new THREE.Vector3(0, 0, 0.005))
        .sub(broochWorld);
    });
    brooch.add(tube(chain, 0.0013, gold));
    for (let i = 0; i < 6; i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), pearl);
      bead.position.copy(chain[3 + i * 3]);
      brooch.add(bead);
    }
  }
  chest.add(brooch);
  return { gold, jewel, pearl };
}

function styleAurelia(vrm: VRM) {
  for (const material of vrm.materials ?? []) {
    if (!(material instanceof MToonMaterial)) continue;
    const name = material.name;
    // The source outlines every overlapping hair strip, producing black dotted seams at portrait size.
    // Keep a fine, warm silhouette on skin and let hair's shaded geometry define its individual strands.
    material.outlineWidthFactor = name.includes('SKIN') ? 0.0003 : 0.0004;
    material.outlineColorFactor.set(name.includes('SKIN') ? '#665361' : '#4c4564');
    material.outlineLightingMixFactor = 0.25;
    if (name.includes('HAIR')) {
      // Preserve the source's subtle strand texture; pigment changes in the material shader.
      material.shadeMultiplyTexture = null;
      material.color.set('#c7bddf');
      material.shadeColorFactor.set('#817aa2');
      material.shadingToonyFactor = 0.65;
      material.shadingShiftFactor = -0.12;
      material.giEqualizationFactor = 0.55;
      material.parametricRimColorFactor.set('#49405d');
      material.parametricRimFresnelPowerFactor = 3.5;
      material.parametricRimLiftFactor = 0;
      material.outlineWidthFactor = 0;
      if (material.isOutline) material.visible = false;
      pigment(material, 'hair');
    } else if (name.includes('SKIN')) {
      material.shadingToonyFactor = 0.7;
      material.shadingShiftFactor = -0.06;
      material.giEqualizationFactor = 0.7;
    } else if (name.includes('Tops')) {
      material.color.set('#38465e');
      material.shadeColorFactor.set('#293248');
    } else if (name.includes('Bottoms')) {
      material.color.set('#3e335d');
      material.shadeColorFactor.set('#29213d');
    } else if (name.includes('Shoes')) {
      material.color.set('#353346');
      material.shadeColorFactor.set('#252035');
    } else if (name.includes('EyeIris')) {
      material.color.set('#ffffff');
      material.shadeColorFactor.set('#84bcb7');
      material.shadeMultiplyTexture = null;
      pigment(material, 'iris');
    }
  }
  celestialAccessories(vrm);
  return addAureliaWardrobe(vrm);
}

export interface AureliaModel {
  vrm: VRM;
  apply(config: AvatarConfig, rig: RigParams, delta: number): void;
  dispose(): void;
}

export async function loadAureliaModel(): Promise<AureliaModel> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(MODEL_URL);
  const vrm = gltf.userData.vrm as VRM;
  if (!vrm?.humanoid) throw new Error('The 3D avatar has no humanoid skeleton.');
  VRMUtils.removeUnnecessaryVertices(vrm.scene);
  vrm.scene.name = 'Aurelia_Starlight_3D';
  vrm.scene.updateMatrixWorld(true);
  const wardrobe = styleAurelia(vrm);
  fitHairCollisions(vrm);
  vrm.scene.traverse((object) => {
    object.frustumCulled = false;
  });
  if (vrm.lookAt) vrm.lookAt.autoUpdate = false;
  const hips = vrm.humanoid.getNormalizedBoneNode('hips')!;
  const hipsRest = hips.position.clone();
  const set = (name: VRMHumanBoneName, x: number, y: number, z: number) => {
    vrm.humanoid.getNormalizedBoneNode(name)?.rotation.set(x, y, z, 'XYZ');
  };
  return {
    vrm,
    apply(config, rig, delta) {
      const pose = calculateAvatar3DPose(config, rig);
      const head = pose.headRotation,
        body = pose.bodyRotation;
      hips.position.copy(hipsRest).add(new THREE.Vector3(pose.bodyOffset.x, pose.bodyOffset.y, pose.bodyOffset.z));
      set('spine', body.x, body.y, body.z);
      set('chest', 0, body.y * 0.18, 0);
      set('neck', head.x * 0.25, head.y * 0.28, head.z * 0.24);
      set('head', head.x * 0.75, head.y * 0.72, head.z * 0.76);
      // VRM rest is a T-pose. Relax arms before applying small breathing/counterbalance gestures.
      set('leftUpperArm', 0.06, -0.06, -1.24 + pose.armLeftRotation.z);
      set('rightUpperArm', 0.06, 0.06, 1.24 + pose.armRightRotation.z);
      set('leftLowerArm', -0.13, -0.06, -0.05);
      set('rightLowerArm', -0.13, 0.06, 0.05);
      set('leftHand', 0, 0, -0.06);
      set('rightHand', 0, 0, 0.06);
      for (const side of ['left', 'right'] as const)
        for (const finger of ['Index', 'Middle', 'Ring', 'Little'] as const) {
          const sign = side === 'left' ? -1 : 1;
          set(`${side}${finger}Proximal`, 0, 0, sign * 0.12);
          set(`${side}${finger}Intermediate`, 0, 0, sign * 0.16);
        }
      set('leftEye', pose.eyeRotation.x, pose.eyeRotation.y, 0);
      set('rightEye', pose.eyeRotation.x, pose.eyeRotation.y, 0);
      for (const [name, value] of Object.entries(poseToVrmExpressions(pose)))
        vrm.expressionManager?.setValue(name, value);
      vrm.update(Math.min(0.05, Math.max(0, delta)));
      wardrobe.update(Math.min(0.05, Math.max(0, delta)), pose.chestScaleY - 1);
    },
    dispose() {
      VRMUtils.deepDispose(vrm.scene);
    },
  };
}
