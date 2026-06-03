import { AvatarConfig, RigParams } from '../types';
import { FRAME, HAIR_PHYSICS } from '../engine/constants';

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
  const facesTranslateX = rig.angleX * FRAME.FACE_TRANSLATE_X;
  const facesTranslateY = rig.angleY * FRAME.FACE_TRANSLATE_Y;
  const outlineTranslateX = rig.angleX * FRAME.OUTLINE_TRANSLATE_X;
  const outlineTranslateY = rig.angleY * FRAME.OUTLINE_TRANSLATE_Y;
  const headRotation = rig.angleZ;
  const breathAngle = rig.breath * Math.PI * 2;
  const retroBounceY = isRetro ? Math.sin(breathAngle) * FRAME.RETRO_BOUNCE_Y : 0;
  const retroBounceX = isRetro ? -Math.cos(breathAngle) * FRAME.RETRO_BOUNCE_X : 0;
  const chestBreathingScale =
    1 + Math.sin(breathAngle) * (isRetro ? FRAME.CHEST_BREATH_RETRO : FRAME.CHEST_BREATH_DEFAULT);
  const lookDistance = Math.sqrt(rig.angleX * rig.angleX + rig.angleY * rig.angleY);
  const headStretchY = 1 + lookDistance * FRAME.HEAD_STRETCH_Y + retroBounceY;
  const headStretchX = 1 - lookDistance * FRAME.HEAD_STRETCH_X + retroBounceX;
  const physicsSwayX = (rig.hairSwayX ?? 0) * (isAnime ? HAIR_PHYSICS.ANIME_GAIN_X : 1);
  const physicsSwayY = (rig.hairSwayY ?? 0) * (isAnime ? HAIR_PHYSICS.ANIME_GAIN_Y : 1);
  const headTranslate = `translate(${rig.bodyX * FRAME.HEAD_BODY_X}px, ${outlineTranslateY - rig.angleY * FRAME.HEAD_PITCH_OFFSET}px) rotate(${headRotation}deg) scale(${headSize}) scale(${headStretchX}, ${headStretchY})`;
  const floatingAccessory =
    config.accessoryStyle === 'neko-ears' ||
    config.accessoryStyle === 'horns' ||
    config.accessoryStyle === 'angel-halo' ||
    config.accessoryStyle === 'bunny-ears' ||
    config.accessoryStyle === 'witch-hat' ||
    config.accessoryStyle === 'crown' ||
    config.accessoryStyle === 'fox-mask';

  return {
    accessoryTransform: `translateX(${
      config.accessoryStyle === 'glasses'
        ? facesTranslateX
        : floatingAccessory
          ? facesTranslateX * FRAME.ACCESSORY_FOLLOW + physicsSwayX * FRAME.ACCESSORY_SWAY
          : outlineTranslateX * FRAME.ACCESSORY_OUTLINE
    }px) rotate(${floatingAccessory ? physicsSwayX * FRAME.ACCESSORY_ROTATE : 0}deg)`,
    backHairTransform: `${headTranslate} translate(${physicsSwayX * FRAME.BACK_HAIR_SWAY_X + facesTranslateX * FRAME.BACK_HAIR_FACE_X}px, ${
      physicsSwayY * FRAME.BACK_HAIR_SWAY_Y
    }px) rotate(${physicsSwayX * FRAME.HAIR_ROTATE}deg)`,
    chestTransform: `scale(${chestBreathingScale})`,
    debugFaceTransform: `translate(${rig.bodyX * FRAME.HEAD_BODY_X + facesTranslateX}px, ${
      outlineTranslateY + facesTranslateY
    }px) rotate(${headRotation}deg)`,
    debugHeadCx: FRAME.DEBUG_HEAD_CX + rig.bodyX * FRAME.HEAD_BODY_X,
    debugHeadCy: FRAME.DEBUG_HEAD_CY + outlineTranslateY,
    faceTransform: `translate(${facesTranslateX}px, ${facesTranslateY}px)`,
    facesTranslateX,
    facesTranslateY,
    frontHairShadowTransform: `translateX(${outlineTranslateX + FRAME.FRONT_HAIR_SHADOW_OFFSET_X}px) translateY(${FRAME.FRONT_HAIR_SHADOW_OFFSET_Y}px)`,
    frontHairTransform: `translateX(${outlineTranslateX}px)`,
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
