import { AvatarConfig, RigParams } from '../types';

export const RIG_RENDER_INTERVAL_MS = 1000 / 30;

type AvatarFrameConfig = Pick<AvatarConfig, 'accessoryStyle' | 'artStyle' | 'headSize'>;

export interface AvatarFrameStyles {
  accessoryTransform: string;
  backHairTransform: string;
  chestTransform: string;
  debugFaceTransform: string;
  debugHeadCx: number;
  debugHeadCy: number;
  faceTransform: string;
  facesTranslateX: number;
  facesTranslateY: number;
  frontHairShadowTransform: string;
  frontHairTransform: string;
  headOutlineTransform: string;
  headRotation: number;
  headTransform: string;
  isAnime: boolean;
  physicsSwayX: number;
  physicsSwayY: number;
}

export const shouldPublishRigFrame = (lastPublishedAt: number, now: number, intervalMs = RIG_RENDER_INTERVAL_MS) =>
  lastPublishedAt === 0 || now - lastPublishedAt >= intervalMs;

export function calculateAvatarFrameStyles(config: AvatarFrameConfig, rig: RigParams): AvatarFrameStyles {
  const artStyle = config.artStyle ?? 'classic';
  const headSize = config.headSize ?? 1;
  const isAnime = artStyle === 'anime';
  const isRetro = artStyle === 'retro';
  const facesTranslateX = rig.angleX * 0.6;
  const facesTranslateY = rig.angleY * 0.5;
  const outlineTranslateX = rig.angleX * 0.2;
  const outlineTranslateY = rig.angleY * 0.15;
  const headRotation = rig.angleZ;
  const retroBounceY = isRetro ? Math.sin(rig.breath * Math.PI * 2) * 0.05 : 0;
  const retroBounceX = isRetro ? -Math.cos(rig.breath * Math.PI * 2) * 0.03 : 0;
  const chestBreathingScale =
    1 + (isRetro ? Math.sin(rig.breath * Math.PI * 2) * 0.03 : Math.sin(rig.breath * Math.PI * 2) * 0.012);
  const lookDistance = Math.sqrt(rig.angleX * rig.angleX + rig.angleY * rig.angleY);
  const headStretchY = 1 + lookDistance * 0.0016 + retroBounceY;
  const headStretchX = 1 - lookDistance * 0.0008 + retroBounceX;
  const physicsSwayX = (rig.hairSwayX ?? 0) * (isAnime ? 1.35 : 1);
  const physicsSwayY = (rig.hairSwayY ?? 0) * (isAnime ? 1.25 : 1);
  const headTranslate = `translate(${rig.bodyX * 0.6}px, ${outlineTranslateY - rig.angleY * 0.38}px) rotate(${headRotation}deg) scale(${headSize}) scale(${headStretchX}, ${headStretchY})`;
  const floatingAccessory =
    config.accessoryStyle === 'neko-ears' ||
    config.accessoryStyle === 'horns' ||
    config.accessoryStyle === 'angel-halo';

  return {
    accessoryTransform: `translateX(${
      config.accessoryStyle === 'glasses'
        ? facesTranslateX
        : floatingAccessory
          ? facesTranslateX * 0.72 + physicsSwayX * 0.25
          : outlineTranslateX * 1.15
    }px) rotate(${floatingAccessory ? physicsSwayX * 0.08 : 0}deg)`,
    backHairTransform: `${headTranslate} translate(${physicsSwayX * 0.15 + facesTranslateX * -0.1}px, ${
      physicsSwayY * 0.08
    }px) rotate(${physicsSwayX * 0.08}deg)`,
    chestTransform: `scale(${chestBreathingScale})`,
    debugFaceTransform: `translate(${rig.bodyX * 0.6 + facesTranslateX}px, ${
      outlineTranslateY + facesTranslateY
    }px) rotate(${headRotation}deg)`,
    debugHeadCx: 200 + rig.bodyX * 0.6,
    debugHeadCy: 160 + outlineTranslateY,
    faceTransform: `translate(${facesTranslateX}px, ${facesTranslateY}px)`,
    facesTranslateX,
    facesTranslateY,
    frontHairShadowTransform: `translateX(${facesTranslateX * 0.72 + physicsSwayX * 0.25 + 1.5}px) translateY(4px) rotate(${
      physicsSwayX * 0.08
    }deg)`,
    frontHairTransform: `translateX(${facesTranslateX * 0.72 + physicsSwayX * 0.25}px) rotate(${physicsSwayX * 0.08}deg)`,
    headOutlineTransform: `translateX(${outlineTranslateX}px)`,
    headRotation,
    headTransform: headTranslate,
    isAnime,
    physicsSwayX,
    physicsSwayY,
  };
}

const setTransform = (svg: SVGSVGElement, node: string, transform: string) => {
  const element = svg.querySelector<SVGGElement>(`[data-rig-node="${node}"]`);
  if (element) element.style.transform = transform;
};

/**
 * Applies transform-only motion between React renders. Shape changes such as
 * blinking and mouth deformation continue to render declaratively.
 */
export function applyAvatarFrameTransforms(svg: SVGSVGElement, config: AvatarFrameConfig, rig: RigParams): void {
  const frame = calculateAvatarFrameStyles(config, rig);

  setTransform(svg, 'back-hair', frame.backHairTransform);
  setTransform(svg, 'chest', frame.chestTransform);
  setTransform(svg, 'head', frame.headTransform);
  setTransform(svg, 'head-outline', frame.headOutlineTransform);
  setTransform(svg, 'front-hair-shadow', frame.frontHairShadowTransform);
  setTransform(svg, 'front-hair', frame.frontHairTransform);
  setTransform(svg, 'face', frame.faceTransform);
  setTransform(svg, 'accessory', frame.accessoryTransform);
  setTransform(svg, 'debug-face', frame.debugFaceTransform);

  const debugHead = svg.querySelector<SVGCircleElement>('[data-rig-node="debug-head"]');
  if (debugHead) {
    debugHead.setAttribute('cx', String(frame.debugHeadCx));
    debugHead.setAttribute('cy', String(frame.debugHeadCy));
  }
}
