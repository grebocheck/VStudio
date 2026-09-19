import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, INITIAL_RIG } from '../presets';
import { applyAvatarFrameTransforms, calculateAvatarFrameStyles, shouldPublishRigFrame } from './avatarFrame';
import { registerAvatar3DSurface } from '../components/three/avatar3DRegistry';

describe('shouldPublishRigFrame', () => {
  it('publishes the first frame and throttles later React renders to about 30 fps', () => {
    expect(shouldPublishRigFrame(0, 1)).toBe(true);
    expect(shouldPublishRigFrame(1_000, 1_020)).toBe(false);
    expect(shouldPublishRigFrame(1_000, 1_034)).toBe(true);
  });
});

describe('calculateAvatarFrameStyles', () => {
  it('calculates the shared face, hair, and accessory transforms', () => {
    const frame = calculateAvatarFrameStyles(
      { ...DEFAULT_CONFIG, accessoryStyle: 'glasses', artStyle: 'anime', headSize: 1.1, neckHeight: 0.9 },
      {
        ...INITIAL_RIG,
        angleX: 10,
        angleY: -4,
        angleZ: 3,
        bodyX: 2,
        hairSwayX: 4,
        hairSwayY: 2,
      },
    );

    expect(frame.faceTransform).toBe('translate(6px, -2px)');
    expect(frame.accessoryTransform).toBe('translateX(6px) rotate(0deg)');
    expect(frame.physicsSwayX).toBe(5.4);
    expect(frame.physicsSwayY).toBe(2.5);
    expect(frame.debugHeadCx).toBe(201.2);
    expect(frame.debugHeadCy).toBe(163.4);
  });
});

describe('applyAvatarFrameTransforms', () => {
  it.each(['aurelia-3d', 'seraphine-3d'] as const)(
    'routes live %s tracking frames to the registered 3D scene',
    (modelId) => {
      const svg = { dataset: { model: modelId }, querySelector: vi.fn() } as unknown as SVGSVGElement;
      const config = { ...DEFAULT_CONFIG, modelId };
      const rig = { ...INITIAL_RIG, angleX: 18, mouthOpen: 0.7 };
      const applyFrame = vi.fn();
      const unregister = registerAvatar3DSurface(svg, {
        canvas: {} as HTMLCanvasElement,
        applyFrame,
        drawToCanvas: vi.fn(),
        exportGlb: vi.fn(),
      });
      applyAvatarFrameTransforms(svg, config, rig);
      expect(applyFrame).toHaveBeenCalledWith(config, rig);
      expect(svg.querySelector).not.toHaveBeenCalled();
      unregister();
    },
  );

  it('updates SVG transforms and debug coordinates without a React render', () => {
    const styleNodes = new Map<string, { style: { transform: string } }>();
    ['back-hair', 'chest', 'head', 'head-outline', 'front-hair', 'face', 'accessory', 'debug-face'].forEach((node) => {
      styleNodes.set(`[data-rig-node="${node}"]`, { style: { transform: '' } });
    });
    const attributes = new Map<string, string>();
    const debugHead = {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    };
    const svg = {
      dataset: {},
      querySelector: (selector: string) =>
        selector === '[data-rig-node="debug-head"]' ? debugHead : (styleNodes.get(selector) ?? null),
    } as unknown as SVGSVGElement;
    const rig = { ...INITIAL_RIG, angleX: 10, angleY: -4, angleZ: 3, bodyX: 2 };
    const frame = calculateAvatarFrameStyles(DEFAULT_CONFIG, rig);

    applyAvatarFrameTransforms(svg, DEFAULT_CONFIG, rig);

    expect(styleNodes.get('[data-rig-node="head"]')?.style.transform).toBe(frame.headTransform);
    expect(styleNodes.get('[data-rig-node="face"]')?.style.transform).toBe(frame.faceTransform);
    expect(attributes.get('cx')).toBe(String(frame.debugHeadCx));
    expect(attributes.get('cy')).toBe(String(frame.debugHeadCy));
  });
});
