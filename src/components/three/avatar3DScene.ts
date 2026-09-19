import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { AvatarConfig, RigParams } from '../../types';
import { loadAvatar3DModel } from './aureliaModel';

export interface Avatar3DScene {
  canvas: HTMLCanvasElement;
  setFrame(config: AvatarConfig, rig: RigParams, delta?: number): void;
  render(delta?: number): void;
  resize(width: number, height: number): void;
  resetView(): void;
  setTurntable(value: boolean): void;
  setWireframe(value: boolean): void;
  setDressVisible(value: boolean): void;
  drawToCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void;
  exportGlb(): Promise<Blob>;
  dispose(): void;
  stats: { triangles: number; bones: number; morphTargets: number };
}

export async function createAvatar3DScene(
  canvas: HTMLCanvasElement,
  config: AvatarConfig,
  rig: RigParams,
  interactive = true,
  signal?: AbortSignal,
): Promise<Avatar3DScene> {
  const model = await loadAvatar3DModel(config.modelId);
  // Cancelled StrictMode mounts must never allocate or lose a newer mount's context.
  if (signal?.aborted) {
    model.dispose();
    throw new DOMException('3D model loading cancelled', 'AbortError');
  }
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = interactive;
  controls.enableDamping = true;
  controls.dampingFactor = 0.085;
  controls.enablePan = false;
  controls.minDistance = 0.38;
  controls.maxDistance = 6;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI * 0.82;
  controls.autoRotateSpeed = 1.1;
  const ambient = new THREE.HemisphereLight('#eee8ff', '#8589aa', 0.65);
  scene.add(ambient);
  const key = new THREE.DirectionalLight('#fff2e4', 1.5);
  key.position.set(-2, 3, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#bddbff', 0.42);
  fill.position.set(3, 1, 1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight('#ad9bf5', 0.8);
  rim.position.set(-1, 2, -3);
  scene.add(rim);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(model.vrm.scene);
  const bounds = new THREE.Box3().setFromObject(model.vrm.scene);
  const height = bounds.max.y - bounds.min.y;
  let framing = config.modelFraming ?? 'portrait';
  let currentConfig = config,
    currentRig = rig;
  let width = 600,
    viewportHeight = 600;
  let lastRig: RigParams | null = null;
  let animatePhysics = true;
  const materials = new Set<THREE.Material>();
  let triangles = 0,
    bones = 0,
    morphTargets = 0;
  model.vrm.scene.traverse((object) => {
    if (object instanceof THREE.Bone) bones++;
    if (object instanceof THREE.Mesh) {
      triangles += (object.geometry.index?.count ?? object.geometry.getAttribute('position').count) / 3;
      morphTargets = Math.max(morphTargets, object.morphTargetInfluences?.length ?? 0);
      for (const material of Array.isArray(object.material) ? object.material : [object.material])
        materials.add(material);
    }
  });
  const resetView = () => {
    const targetY =
      framing === 'full'
        ? bounds.min.y + height * 0.52
        : framing === 'halfbody'
          ? bounds.min.y + height * 0.69
          : bounds.min.y + height * 0.86;
    const viewHeight = height * (framing === 'full' ? 1.12 : framing === 'halfbody' ? 0.69 : 0.39);
    const distance = viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    controls.target.set(0, targetY, 0);
    camera.position.set(0.035, targetY + 0.02, distance);
    camera.lookAt(controls.target);
    controls.update();
  };
  const render = (delta = 1 / 60) => {
    model.apply(currentConfig, currentRig, animatePhysics ? delta : 0);
    controls.update(delta);
    renderer.render(scene, camera);
  };
  const resize = (w: number, h: number) => {
    width = Math.max(1, Math.round(w));
    viewportHeight = Math.max(1, Math.round(h));
    renderer.setSize(width, viewportHeight, false);
    camera.aspect = width / viewportHeight;
    camera.updateProjectionMatrix();
  };
  resetView();
  resize(width, viewportHeight);
  render(0);
  return {
    canvas,
    stats: { triangles: Math.round(triangles), bones, morphTargets },
    setFrame(nextConfig, nextRig, delta = 0) {
      const changed = nextRig !== lastRig;
      animatePhysics = changed;
      lastRig = nextRig;
      currentConfig = nextConfig;
      currentRig = nextRig;
      if (framing !== (nextConfig.modelFraming ?? 'portrait')) {
        framing = nextConfig.modelFraming ?? 'portrait';
        resetView();
      }
      if (delta) render(delta);
    },
    render,
    resize,
    resetView,
    setTurntable(value) {
      controls.autoRotate = value;
    },
    setDressVisible(value) {
      model.vrm.scene.traverse((object) => {
        if (object.userData.aureliaOuterGarment) object.visible = value;
      });
    },
    setWireframe(value) {
      for (const material of materials) if ('wireframe' in material) material.wireframe = value;
    },
    drawToCanvas(output, context) {
      const savedWidth = width,
        savedHeight = viewportHeight;
      const savedRatio = renderer.getPixelRatio();
      renderer.setPixelRatio(1);
      resize(output.width, output.height);
      model.apply(currentConfig, currentRig, 0);
      renderer.render(scene, camera);
      context.clearRect(0, 0, output.width, output.height);
      context.drawImage(canvas, 0, 0, output.width, output.height);
      renderer.setPixelRatio(savedRatio);
      resize(savedWidth, savedHeight);
      renderer.render(scene, camera);
    },
    async exportGlb() {
      // Portable glTF uses PBR materials. Preserve the skinned geometry, skeleton and morph targets.
      const replacements: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = [];
      const converted = new Map<THREE.Material, THREE.MeshStandardMaterial>();
      model.vrm.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        replacements.push({ mesh: object, material: object.material });
        const convert = (source: THREE.Material) => {
          if (source instanceof THREE.MeshStandardMaterial) return source;
          if (converted.has(source)) return converted.get(source)!;
          const material = source as THREE.Material & {
            color?: THREE.Color;
            map?: THREE.Texture | null;
            emissive?: THREE.Color;
          };
          const standard = new THREE.MeshStandardMaterial({
            name: source.name,
            color: material.color ?? new THREE.Color('white'),
            map: material.map ?? null,
            transparent: source.transparent,
            opacity: source.opacity,
            alphaTest: source.alphaTest,
            side: source.side,
            roughness: 0.68,
          });
          converted.set(source, standard);
          return standard;
        };
        object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material);
      });
      try {
        const output = await new GLTFExporter().parseAsync(model.vrm.scene, { binary: true, onlyVisible: true });
        if (!(output instanceof ArrayBuffer)) throw new Error('GLB export did not produce a binary model.');
        return new Blob([output], { type: 'model/gltf-binary' });
      } finally {
        for (const { mesh, material } of replacements) mesh.material = material;
        for (const material of converted.values()) material.dispose();
      }
    },
    dispose() {
      controls.dispose();
      model.dispose();
      environment.dispose();
      renderer.dispose();
      // Dispose GPU resources while allowing React refresh/retry to reuse this canvas context.
    },
  };
}

/** One serialized offscreen context renders static sticker poses; no WebGL context per reaction. */
let stillQueue: Promise<unknown> = Promise.resolve();
let stillScene: Promise<Avatar3DScene> | null = null;
let stillModelId: AvatarConfig['modelId'];
let stillCanvas: HTMLCanvasElement | null = null;
export function renderAvatar3DStill(
  config: AvatarConfig,
  rig: RigParams,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const task = stillQueue.then(async () => {
    // Each character has different geometry. Reuse the context for repeated poses of
    // one character, but never export the preceding character after a library switch.
    if (stillScene && stillModelId !== config.modelId) {
      (await stillScene).dispose();
      stillScene = null;
    }
    stillModelId = config.modelId;
    if (!stillScene) {
      stillCanvas ??= document.createElement('canvas');
      stillScene = createAvatar3DScene(stillCanvas, config, rig, false).catch((error) => {
        stillScene = null;
        throw error;
      });
    }
    const controller = await stillScene;
    controller.setFrame(config, rig);
    controller.resetView();
    controller.render(0);
    const output = document.createElement('canvas');
    output.width = width;
    output.height = height;
    const context = output.getContext('2d');
    if (!context) throw new Error('Canvas capture is unavailable.');
    controller.drawToCanvas(output, context);
    return output;
  });
  stillQueue = task.catch(() => {});
  return task;
}
