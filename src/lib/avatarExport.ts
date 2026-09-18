export interface AvatarSvgExportOptions {
  width?: number;
  height?: number;
  transparent?: boolean;
}

const DEFAULT_EXPORT_SIZE = 800;

export function safeExportFileName(name: string): string {
  return (
    (name || 'vstudio-avatar')
      .trim()
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'vstudio-avatar'
  );
}

export function timestampForFileName(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export function avatarExportFileName(baseName: string, extension: string, date = new Date()): string {
  const cleanExtension = extension.replace(/^\./, '');
  return `${safeExportFileName(baseName)}-${timestampForFileName(date)}.${cleanExtension}`;
}

export function serializeAvatarSvg(svg: SVGSVGElement, options: AvatarSvgExportOptions = {}): string {
  if (svg.getAttribute('data-model') === 'aurelia-3d') {
    throw new Error('Aurelia is a 3D model. Export a PNG image or download the GLB model from the viewer.');
  }
  const width = options.width ?? DEFAULT_EXPORT_SIZE;
  const height = options.height ?? DEFAULT_EXPORT_SIZE;
  const clone = svg.cloneNode(true) as SVGSVGElement;

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 400 400');
  clone.removeAttribute('class');

  if (options.transparent) {
    clone.querySelectorAll('[data-avatar-background="true"]').forEach((node) => node.remove());
  }

  return new XMLSerializer().serializeToString(clone);
}

const embeddedImages = new Map<string, Promise<string>>();
const rasterImageType = /^image\/(?:png|jpeg|webp|gif|avif)$/i;

async function imageAsDataUrl(href: string): Promise<string> {
  if (/^data:image\/(?:png|jpeg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(href)) return href;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) {
    throw new Error('Avatar images must use a local asset or an embedded raster image.');
  }
  const key = url.href;
  const cached = embeddedImages.get(key);
  if (cached) return cached;

  const pending = (async () => {
    const response = await fetch(key, { credentials: 'omit', redirect: 'error' });
    if (!response.ok) throw new Error(`Could not load avatar artwork (${response.status}). Try again.`);
    const blob = await response.blob();
    if (!rasterImageType.test(blob.type)) throw new Error('Avatar artwork is not a supported raster image.');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return `data:${blob.type};base64,${btoa(binary)}`;
  })();
  embeddedImages.set(key, pending);
  try {
    return await pending;
  } catch (error) {
    // A failed request must not poison later retries.
    embeddedImages.delete(key);
    throw error;
  }
}

/** SVG image documents cannot load linked artwork. Embed it before export or preview. */
export async function embedSvgImages(serializedSvg: string): Promise<string> {
  if (!/<image\b/i.test(serializedSvg)) return serializedSvg;
  const doc = new DOMParser().parseFromString(serializedSvg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Could not read avatar SVG artwork.');
  // A rig may crop the same full-resolution layer several times. Embed that
  // artwork once; local <use> references retain each original group's clipping.
  const repeated = new Map<string, Element[]>();
  for (const image of Array.from(doc.querySelectorAll('image'))) {
    if (image.hasAttribute('id')) continue;
    const key = new XMLSerializer().serializeToString(image);
    const group = repeated.get(key) ?? [];
    group.push(image);
    repeated.set(key, group);
  }
  let definitionIndex = 0;
  for (const images of repeated.values()) {
    if (images.length < 2) continue;
    let id: string;
    do {
      id = `vstudio-embedded-image-${definitionIndex++}`;
    } while (doc.getElementById(id));
    const defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const definition = images[0].cloneNode(true) as Element;
    definition.setAttribute('id', id);
    defs.appendChild(definition);
    doc.documentElement.appendChild(defs);
    for (const image of images) {
      const use = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', `#${id}`);
      image.replaceWith(use);
    }
  }
  await Promise.all(
    Array.from(doc.querySelectorAll('image')).map(async (image) => {
      const href =
        image.getAttribute('href') ||
        image.getAttribute('xlink:href') ||
        image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href) throw new Error('Avatar artwork has a missing image source.');
      const embedded = await imageAsDataUrl(href);
      image.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      image.removeAttribute('xlink:href');
      image.setAttribute('href', embedded);
    }),
  );
  return new XMLSerializer().serializeToString(doc.documentElement);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function drawSerializedSvgToCanvas(
  serializedSvg: string,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<void> {
  const blob = new Blob([await embedSvgImages(serializedSvg)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to render SVG frame.'));
      image.src = url;
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function drawAvatarSvgToCanvas(
  svg: SVGSVGElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: AvatarSvgExportOptions = {},
): Promise<void> {
  if (svg.getAttribute('data-model') === 'aurelia-3d') {
    const surface = getAvatar3DSurface(svg);
    if (!surface) throw new Error('The 3D model is still loading. Wait for the model to appear, then try again.');
    surface.drawToCanvas(canvas, ctx);
    return;
  }
  await drawSerializedSvgToCanvas(
    serializeAvatarSvg(svg, {
      width: canvas.width,
      height: canvas.height,
      transparent: options.transparent,
    }),
    canvas,
    ctx,
  );
}

/** Record the frame already displayed by WebGL without resizing its live viewport. */
export async function drawAvatarLiveFrameToCanvas(
  svg: SVGSVGElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<void> {
  if (svg.getAttribute('data-model') === 'aurelia-3d') {
    const surface = getAvatar3DSurface(svg);
    if (!surface) throw new Error('The 3D model is still loading. Wait for the model to appear, then try again.');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(surface.canvas, 0, 0, canvas.width, canvas.height);
    return;
  }
  await drawAvatarSvgToCanvas(svg, canvas, ctx, { transparent: true });
}

export async function avatarSvgToPngBlob(svg: SVGSVGElement, options: AvatarSvgExportOptions = {}): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = options.width ?? DEFAULT_EXPORT_SIZE;
  canvas.height = options.height ?? DEFAULT_EXPORT_SIZE;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Could not create export canvas.');

  await drawAvatarSvgToCanvas(svg, canvas, ctx, options);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode PNG export.'));
    }, 'image/png');
  });
}
import { getAvatar3DSurface } from '../components/three/avatar3DRegistry';
