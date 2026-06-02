import { describe, expect, it } from 'vitest';
import { DOMParser } from 'linkedom';
import {
  applyToPoint,
  ellipseToShapes,
  extractRigNodeLayers,
  fillItem,
  IDENTITY_MATRIX,
  lottieFromRigLayers,
  multiplyMatrix,
  parseColor,
  parsePathData,
  parseTransform,
  pathToShapes,
  rectToShapes,
  subpathToShape,
} from './svgToLottie';
import type { RigNodeLayer, RigNodeName } from './svgToLottie';
import { validateTelegramStickerLottie } from './validate';
import { TELEGRAM_STICKER_SPECS } from './core';
import { DEFAULT_CONFIG } from '../../presets';

describe('svgToLottie — colour parsing', () => {
  it('parses hex, shorthand, alpha-hex, rgb and rgba', () => {
    expect(parseColor('#ffffff')).toEqual({ rgb: [1, 1, 1], alpha: 1 });
    expect(parseColor('#000')).toEqual({ rgb: [0, 0, 0], alpha: 1 });
    expect(parseColor('#ff000080')?.alpha).toBeCloseTo(128 / 255, 3);
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ rgb: [1, 0, 0], alpha: 1 });
    expect(parseColor('rgba(0,0,0,0.5)')).toEqual({ rgb: [0, 0, 0], alpha: 0.5 });
    expect(parseColor('white')).toEqual({ rgb: [1, 1, 1], alpha: 1 });
  });

  it('returns null for none/transparent/gradient references', () => {
    expect(parseColor('none')).toBeNull();
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('url(#hair-gradient-id)')).toBeNull();
    expect(parseColor(undefined)).toBeNull();
  });
});

describe('svgToLottie — transforms', () => {
  it('keeps identity stable and composes translate/scale', () => {
    expect(multiplyMatrix(IDENTITY_MATRIX, IDENTITY_MATRIX)).toEqual(IDENTITY_MATRIX);
    const m = parseTransform('translate(10 20) scale(2)');
    expect(applyToPoint(m, [1, 1])).toEqual([12, 22]);
  });

  it('rotates 90 degrees about a pivot', () => {
    const m = parseTransform('rotate(90 0 0)');
    const [x, y] = applyToPoint(m, [10, 0]);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(10, 5);
  });
});

describe('svgToLottie — path data', () => {
  it('parses a closed line triangle and dedupes the Z vertex', () => {
    const [sub] = parsePathData('M0 0 L10 0 L10 10 Z');
    expect(sub.closed).toBe(true);
    expect(sub.v).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
    ]);
  });

  it('converts cubic control points into Lottie out/in tangents', () => {
    const [sub] = parsePathData('M0 0 C0 5 5 10 10 10');
    expect(sub.v).toEqual([
      [0, 0],
      [10, 10],
    ]);
    expect(sub.o[0]).toEqual([0, 5]);
    expect(sub.i[1]).toEqual([-5, 0]);
  });

  it('handles multiple subpaths', () => {
    expect(parsePathData('M0 0 L1 0 M5 5 L6 5')).toHaveLength(2);
  });
});

describe('svgToLottie — shape emitters scale onto the 512 canvas', () => {
  it('scales path vertices and tangents by 512/400', () => {
    const shape = subpathToShape(parsePathData('M0 0 C0 5 5 10 10 10')[0], IDENTITY_MATRIX);
    const k = (shape.ks as { k: { v: number[][]; o: number[][]; i: number[][] } }).k;
    expect(k.v[1]).toEqual([12.8, 12.8]);
    expect(k.o[0]).toEqual([0, 6.4]);
    expect(k.i[1]).toEqual([-6.4, 0]);
  });

  it('emits axis-aligned ellipses and rects as native el/rc', () => {
    const [el] = ellipseToShapes(100, 100, 50, 50, IDENTITY_MATRIX);
    expect(el.ty).toBe('el');
    expect((el.p as { k: number[] }).k).toEqual([128, 128]);
    expect((el.s as { k: number[] }).k).toEqual([128, 128]);

    const [rc] = rectToShapes(0, 0, 10, 10, 2, IDENTITY_MATRIX);
    expect(rc.ty).toBe('rc');
    expect((rc.s as { k: number[] }).k).toEqual([12.8, 12.8]);
  });

  it('falls back to a bezier path for rotated ellipses', () => {
    const [shape] = ellipseToShapes(100, 100, 50, 50, parseTransform('rotate(30)'));
    expect(shape.ty).toBe('sh');
  });

  it('parses real avatar-style path strings without throwing', () => {
    const shapes = pathToShapes('M120 100 Q160 60 200 100 T280 100 L280 180 Z', IDENTITY_MATRIX);
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes[0].ty).toBe('sh');
  });
});

const parseSvg = (svg: string): Element =>
  new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement as unknown as Element;

describe('svgToLottie — rig-node layer extraction', () => {
  it('buckets shapes under their enclosing data-rig-node and skips defs/filters', () => {
    const root = parseSvg(`<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g"><stop offset="0%" stop-color="#fff"/></linearGradient></defs>
      <g data-rig-node="back-hair"><path d="M100 100 L300 100 L300 300 Z" fill="#222"/></g>
      <g data-rig-node="chest"><rect x="150" y="300" width="100" height="80" fill="#345"/></g>
      <g data-rig-node="head"><g data-rig-node="head-outline"><circle cx="200" cy="180" r="120" fill="#f5d0c5"/></g>
        <g data-rig-node="face"><ellipse cx="160" cy="170" rx="20" ry="24" fill="#fff"/></g></g>
    </svg>`);
    const nodes = extractRigNodeLayers(root).map((l) => l.node);

    expect(nodes).toEqual(['back-hair', 'chest', 'head-outline', 'face']);
  });

  it('drops shapes with no paint and shapes that are filter-only glow', () => {
    const root = parseSvg(`<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g data-rig-node="face"><path d="M0 0 L1 0"/><circle cx="5" cy="5" r="2" fill="#abc"/></g>
    </svg>`);
    const face = extractRigNodeLayers(root).find((l) => l.node === 'face');
    expect(face?.items).toHaveLength(1); // the unpainted path is dropped
  });

  it('converts url(#id) fills into Lottie gradient (gf) items with stops', () => {
    const root = parseSvg(`<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#ef4444"/>
      </linearGradient></defs>
      <g data-rig-node="back-hair"><path d="M100 100 L300 100 L300 300 L100 300 Z" fill="url(#hair)"/></g>
    </svg>`);
    const backHair = extractRigNodeLayers(root).find((l) => l.node === 'back-hair');
    const grp = backHair?.items[0] as { it: Array<{ ty: string; g?: { p: number } }> };
    const gf = grp.it.find((x) => x.ty === 'gf');

    expect(gf).toBeDefined();
    expect(gf?.g?.p).toBe(2);
  });
});

describe('svgToLottie — rig-node layers assemble into a valid sticker', () => {
  const blob = () => ({
    ty: 'gr',
    nm: 'blob',
    it: [ellipseToShapes(200, 180, 80, 90, IDENTITY_MATRIX)[0], fillItem({ rgb: [0.9, 0.8, 0.8], alpha: 1 }, 100)],
  });

  it('produces a front-to-back, Telegram-valid Lottie from rig-node geometry', () => {
    const nodes: RigNodeName[] = ['back-hair', 'chest', 'head-outline', 'face', 'front-hair', 'accessory'];
    const rigLayers: RigNodeLayer[] = nodes.map((node) => ({ node, items: [blob()] }));

    const lottie = lottieFromRigLayers(rigLayers, DEFAULT_CONFIG, TELEGRAM_STICKER_SPECS[0]);
    const errors = validateTelegramStickerLottie(lottie).filter((issue) => issue.severity === 'error');
    const names = (lottie.layers as Array<{ nm: string }>).map((l) => l.nm);

    expect(errors).toEqual([]);
    expect(names).toHaveLength(6);
    expect(names).toContain('face');
    expect(names[names.length - 1]).toBe('back-hair');
  });
});
