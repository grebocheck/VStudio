import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOMParser } from 'linkedom';
import {
  avatarExportFileName,
  drawAvatarSvgToCanvas,
  drawAvatarLiveFrameToCanvas,
  embedSvgImages,
  safeExportFileName,
  serializeAvatarSvg,
  timestampForFileName,
} from './avatarExport';
import { registerAvatar3DSurface } from '../components/three/avatar3DRegistry';

describe('avatar export helpers', () => {
  it('sanitizes export file names', () => {
    expect(safeExportFileName('  Neon Cat / Alert!  ')).toBe('Neon_Cat_Alert');
    expect(safeExportFileName('')).toBe('vstudio-avatar');
  });

  it('formats stable export timestamps', () => {
    expect(timestampForFileName(new Date('2026-06-01T13:45:06.000Z'))).toBe('2026-06-01-13-45-06');
  });

  it('builds export file names with clean extensions', () => {
    const date = new Date('2026-06-01T13:45:06.000Z');
    expect(avatarExportFileName('Miya Cyber', '.png', date)).toBe('Miya_Cyber-2026-06-01-13-45-06.png');
  });
});

describe('illustrated SVG exports', () => {
  beforeEach(() => {
    vi.stubGlobal('DOMParser', DOMParser);
    vi.stubGlobal(
      'XMLSerializer',
      class {
        serializeToString(node: Element) {
          return node.toString();
        }
      },
    );
    vi.stubGlobal('window', { location: new URL('https://studio.test/editor') });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('leaves vector-only artwork unchanged', async () => {
    const source = '<svg><path d="M0 0L10 10"/></svg>';
    expect(await embedSvgImages(source)).toBe(source);
  });

  it('embeds and shares one local asset request across concurrent exports', async () => {
    const fetchImage = vi.fn().mockResolvedValue(new Response(new Blob(['artwork'], { type: 'image/png' })));
    vi.stubGlobal('fetch', fetchImage);
    const source = '<svg xmlns="http://www.w3.org/2000/svg"><image href="/assets/shared.png"/></svg>';
    const results = await Promise.all([embedSvgImages(source), embedSvgImages(source)]);
    expect(fetchImage).toHaveBeenCalledTimes(1);
    expect(fetchImage).toHaveBeenCalledWith('https://studio.test/assets/shared.png', {
      credentials: 'omit',
      redirect: 'error',
    });
    results.forEach((svg) => {
      expect(svg).toContain('href="data:image/png;base64,YXJ0d29yaw=="');
      expect(svg).not.toContain('/assets/');
    });
  });

  it('keeps embedded raster images and rejects remote or SVG image sources', async () => {
    const fetchImage = vi.fn();
    vi.stubGlobal('fetch', fetchImage);
    expect(await embedSvgImages('<svg><image href="data:image/png;base64,YQ=="/></svg>')).toContain(
      'data:image/png;base64,YQ==',
    );
    await expect(embedSvgImages('<svg><image href="https://other.test/portrait.png"/></svg>')).rejects.toThrow(
      'local asset',
    );
    await expect(embedSvgImages('<svg><image href="data:image/svg+xml;base64,YQ=="/></svg>')).rejects.toThrow(
      'local asset',
    );
    expect(fetchImage).not.toHaveBeenCalled();
  });

  it('normalizes legacy xlink image references into portable embedded hrefs', async () => {
    const result = await embedSvgImages(
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="data:image/png;base64,YQ=="/></svg>',
    );
    expect(result).toContain('href="data:image/png;base64,YQ=="');
    expect(result).not.toContain('xlink:href');
  });

  it('embeds a repeated layer once and preserves its clipping and placement through local use references', async () => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#left)"><image href="data:image/png;base64,YQ==" x="7" width="32" height="48"/></g><g transform="translate(12)"><image href="data:image/png;base64,YQ==" x="7" width="32" height="48"/></g></svg>';
    const result = await embedSvgImages(source);
    const doc = new DOMParser().parseFromString(result, 'image/svg+xml');
    expect(doc.querySelectorAll('image')).toHaveLength(1);
    expect(doc.querySelectorAll('use')).toHaveLength(2);
    expect(doc.querySelector('defs image')?.getAttribute('x')).toBe('7');
    expect(doc.querySelector('g[clip-path] use')?.getAttribute('href')).toMatch(/^#vstudio-embedded-image-/);
    expect(doc.querySelector('g[transform] use')?.getAttribute('href')).toBe(
      doc.querySelector('g[clip-path] use')?.getAttribute('href'),
    );
  });

  it('allows a failed artwork request to be retried', async () => {
    const fetchImage = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response(new Blob(['retry'], { type: 'image/webp' })));
    vi.stubGlobal('fetch', fetchImage);
    const source = '<svg><image href="/assets/retry.webp"/></svg>';
    await expect(embedSvgImages(source)).rejects.toThrow('503');
    expect(await embedSvgImages(source)).toContain('data:image/webp;base64,cmV0cnk=');
    expect(fetchImage).toHaveBeenCalledTimes(2);
  });

  it('rejects HTML responses instead of silently exporting empty artwork', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html/>', { headers: { 'Content-Type': 'text/html' } })),
    );
    await expect(embedSvgImages('<svg><image href="/missing.png"/></svg>')).rejects.toThrow('supported raster');
  });
});

describe.each(['aurelia-3d', 'seraphine-3d'])('%s renderer capture', (modelId) => {
  const proxy = () =>
    new DOMParser().parseFromString(`<svg data-model="${modelId}"/>`, 'image/svg+xml')
      .documentElement as unknown as SVGSVGElement;
  it('captures the registered live camera instead of serializing the empty proxy', async () => {
    const svg = proxy();
    const drawToCanvas = vi.fn();
    const canvas = {} as HTMLCanvasElement;
    const context = {} as CanvasRenderingContext2D;
    const unregister = registerAvatar3DSurface(svg, { canvas, drawToCanvas, exportGlb: vi.fn(), applyFrame: vi.fn() });
    await drawAvatarSvgToCanvas(svg, canvas, context);
    expect(drawToCanvas).toHaveBeenCalledWith(canvas, context);
    unregister();
    await expect(drawAvatarSvgToCanvas(svg, canvas, context)).rejects.toThrow('still loading');
  });
  it('rejects SVG export for a 3D model instead of downloading a blank file', () => {
    expect(() => serializeAvatarSvg(proxy())).toThrow('GLB');
  });
  it('copies the displayed frame for recording without resizing or rerendering the scene', async () => {
    const svg = proxy();
    const displayed = {} as HTMLCanvasElement;
    const output = { width: 800, height: 800 } as HTMLCanvasElement;
    const context = { clearRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    const rerender = vi.fn();
    const unregister = registerAvatar3DSurface(svg, {
      canvas: displayed,
      drawToCanvas: rerender,
      exportGlb: vi.fn(),
      applyFrame: vi.fn(),
    });
    await drawAvatarLiveFrameToCanvas(svg, output, context);
    expect(context.drawImage).toHaveBeenCalledWith(displayed, 0, 0, 800, 800);
    expect(rerender).not.toHaveBeenCalled();
    unregister();
  });
});
