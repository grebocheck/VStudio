import type { AvatarConfig, RigParams } from '../../types';

export interface Avatar3DSurface {
  canvas: HTMLCanvasElement;
  drawToCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void;
  exportGlb(): Promise<Blob>;
  applyFrame(config: AvatarConfig, rig: RigParams): void;
}

const surfaces = new WeakMap<SVGSVGElement, Avatar3DSurface>();
export function registerAvatar3DSurface(svg: SVGSVGElement, surface: Avatar3DSurface) {
  surfaces.set(svg, surface);
  return () => {
    if (surfaces.get(svg) === surface) surfaces.delete(svg);
  };
}
export const getAvatar3DSurface = (svg: SVGSVGElement) => surfaces.get(svg);
