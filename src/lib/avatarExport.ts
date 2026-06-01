export interface AvatarSvgExportOptions {
  width?: number;
  height?: number;
  transparent?: boolean;
}

const DEFAULT_EXPORT_SIZE = 800;

export function safeExportFileName(name: string): string {
  return (name || 'vstudio-avatar')
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'vstudio-avatar';
}

export function timestampForFileName(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export function avatarExportFileName(baseName: string, extension: string, date = new Date()): string {
  const cleanExtension = extension.replace(/^\./, '');
  return `${safeExportFileName(baseName)}-${timestampForFileName(date)}.${cleanExtension}`;
}

export function serializeAvatarSvg(svg: SVGSVGElement, options: AvatarSvgExportOptions = {}): string {
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
  const blob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
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
  await drawSerializedSvgToCanvas(serializeAvatarSvg(svg, {
    width: canvas.width,
    height: canvas.height,
    transparent: options.transparent,
  }), canvas, ctx);
}

export async function avatarSvgToPngBlob(
  svg: SVGSVGElement,
  options: AvatarSvgExportOptions = {},
): Promise<Blob> {
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
