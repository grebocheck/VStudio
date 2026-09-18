import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_RIG } from '../presets';
import { DEFAULT_CAMERA_CALIBRATION } from '../lib/cameraCalibration';
import { useAnimationEngine } from './useAnimationEngine';

type EngineProps = Parameters<typeof useAnimationEngine>[0];

describe('animation engine', () => {
  let root: Root;
  let props: EngineProps;
  let now: number;
  let frameId: number;
  let frames: Map<number, FrameRequestCallback>;

  function Harness(input: EngineProps) {
    useAnimationEngine(input);
    return null;
  }

  async function render(overrides: Partial<EngineProps> = {}) {
    props = { ...props, ...overrides };
    await act(async () => root.render(createElement(Harness, props)));
  }

  async function advance(milliseconds = 16) {
    now += milliseconds;
    const pending = [...frames.values()];
    frames.clear();
    await act(async () => pending.forEach((callback) => callback(now)));
  }

  beforeEach(() => {
    const { window, document } = parseHTML('<html><body><main></main></body></html>');
    vi.stubGlobal('window', window);
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    frameId = 0;
    frames = new Map();
    now = 10_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    root = createRoot(document.querySelector('main')!);
    props = {
      trackingMode: 'manual',
      micActive: false,
      mic: { analyserRef: { current: null }, dataArrayRef: { current: null } },
      face: { videoRef: { current: null }, faceLandmarkerRef: { current: null } },
      cameraCalibration: DEFAULT_CAMERA_CALIBRATION,
      emoteRef: { current: null },
      rigRef: { current: { ...INITIAL_RIG } },
      onFrame: vi.fn(),
      setRig: vi.fn(),
    };
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    expect(frames.size).toBe(0);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does no DOM or React updates while an unchanged manual pose is held', async () => {
    await render();
    const pose = props.rigRef.current;
    for (let index = 0; index < 60; index++) await advance();
    expect(props.rigRef.current).toBe(pose);
    expect(props.onFrame).not.toHaveBeenCalled();
    expect(props.setRig).not.toHaveBeenCalled();
  });

  it('publishes emote changes and expiration immediately, including inside the live throttle window', async () => {
    await render();
    props.emoteRef.current = { emotion: 'happy', until: now + 1_000 };
    await advance();
    expect(props.setRig).toHaveBeenCalledTimes(1);
    expect(props.rigRef.current.activeEmotion).toBe('happy');
    props.emoteRef.current = { emotion: 'love', until: now + 50 };
    await advance(1);
    expect(props.setRig).toHaveBeenCalledTimes(2);
    expect(props.rigRef.current.activeEmotion).toBe('love');
    await advance(10);
    expect(props.setRig).toHaveBeenCalledTimes(2);
    await advance(50);
    expect(props.rigRef.current.activeEmotion).toBe('none');
    expect(props.setRig).toHaveBeenCalledTimes(3);
    expect(props.onFrame).toHaveBeenCalledTimes(3);
  });

  it('preserves external slider changes and applies emotes without disturbing them', async () => {
    await render();
    // The workspace publishes manual sliders itself before handing the pose to the engine.
    const manual = { ...INITIAL_RIG, angleX: 18, mouthOpen: 0.7, eyeLOpen: 0.3 };
    props.rigRef.current = manual;
    await advance();
    expect(props.rigRef.current).toBe(manual);
    expect(props.setRig).not.toHaveBeenCalled();
    props.emoteRef.current = { emotion: 'cool', until: now + 100 };
    await advance();
    expect(props.rigRef.current).toEqual({ ...manual, activeEmotion: 'cool', emotionStrength: 1 });
    await advance(150);
    expect(props.rigRef.current).toEqual({ ...manual, activeEmotion: 'none', emotionStrength: 0 });
  });

  it('continues live motion after leaving pause and stops updates when paused again', async () => {
    await render();
    await advance();
    await render({ trackingMode: 'auto' });
    await advance();
    expect(props.onFrame).toHaveBeenCalledTimes(1);
    expect(props.setRig).toHaveBeenCalledTimes(1);
    await advance(50);
    expect(props.setRig).toHaveBeenCalledTimes(2);
    const held = props.rigRef.current;
    await render({ trackingMode: 'manual' });
    await advance(100);
    expect(props.rigRef.current).toBe(held);
    expect(props.onFrame).toHaveBeenCalledTimes(2);
    expect(props.setRig).toHaveBeenCalledTimes(2);
  });

  it('records cursor targets without mutating or publishing the pose outside the animation loop', async () => {
    Object.defineProperties(window, {
      innerWidth: { value: 1000, configurable: true },
      innerHeight: { value: 800, configurable: true },
    });
    await render({ trackingMode: 'mouse' });
    const initial = props.rigRef.current;
    const event = new window.Event('mousemove');
    Object.assign(event, { clientX: 1000, clientY: 200 });
    window.dispatchEvent(event);
    expect(props.rigRef.current).toBe(initial);
    expect(props.onFrame).not.toHaveBeenCalled();
    expect(props.setRig).not.toHaveBeenCalled();
    await advance(50);
    expect(props.rigRef.current.pupilX).toBeGreaterThan(0.3);
    expect(props.rigRef.current.angleX).toBeGreaterThan(0);
    expect(props.rigRef.current.angleX).toBeLessThan(5);
    expect(props.onFrame).toHaveBeenCalledTimes(1);
  });

  it('eases live emotes in and retains their identity while fading out after expiry', async () => {
    await render({ trackingMode: 'auto' });
    props.emoteRef.current = { emotion: 'happy', until: now + 200 };
    await advance(70);
    expect(props.rigRef.current.activeEmotion).toBe('happy');
    expect(props.rigRef.current.emotionStrength).toBeCloseTo(0.5);
    await advance(70);
    expect(props.rigRef.current.emotionStrength).toBe(1);
    await advance(70);
    expect(props.rigRef.current.activeEmotion).toBe('happy');
    expect(props.rigRef.current.emotionStrength).toBeGreaterThan(0);
    expect(props.rigRef.current.emotionStrength).toBeLessThan(1);
    for (let i = 0; i < 4; i++) await advance(70);
    expect(props.rigRef.current.activeEmotion).toBe('none');
    expect(props.rigRef.current.emotionStrength).toBe(0);
  });
});
