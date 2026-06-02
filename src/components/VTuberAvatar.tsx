import React from 'react';
import { AvatarConfig, RigParams } from '../types';
import { calculateAvatarFrameStyles } from '../lib/avatarFrame';
import { AccessoryComponent } from './avatar/Accessories';
import { AvatarBackground } from './avatar/AvatarBackground';
import { AvatarDebugOverlay } from './avatar/AvatarDebugOverlay';
import { AvatarDefs, getHairFillColor } from './avatar/AvatarDefs';
import { AvatarHud } from './avatar/AvatarHud';
import { AnimeSparkles } from './avatar/AvatarSparkles';
import { NeckAndShoulders } from './avatar/Costumes';
import { EmotionOverlays } from './avatar/EmotionOverlays';
import { EyebrowSVG, EyeSVG } from './avatar/Eyes';
import { FaceFlushOverlay } from './avatar/FaceFlushOverlay';
import { HairComponent, FrontHairComponent } from './avatar/Hairstyles';
import { HeadBase, Live2DMouth } from './avatar/HeadAndFace';

interface VTuberAvatarProps {
  config: AvatarConfig;
  rig: RigParams;
  onScreenBuster?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  transparent?: boolean;
  fps?: number | null;
}

export const VTuberAvatar: React.FC<VTuberAvatarProps> = ({
  config,
  rig,
  onScreenBuster = false,
  svgRef,
  transparent = false,
  fps = null,
}) => {
  const {
    skinColor,
    eyeColor,
    pupilStyle,
    pupilColor,
    eyebrowStyle,
    eyebrowColor,
    hairStyleBang,
    hairStyleBack,
    hairColor,
    hairHighlightColor,
    clothingStyle,
    clothingColor1,
    clothingColor2,
    accessoryStyle,
    accessoryColor,
    backgroundStyle,
    blushOpacity = 0.25,
    blushColor = '#ff4d6d',
    hasFangs = false,
    earStyle = 'normal',
    hairGradient = 'none',
    accessoryGlow = false,
    neckWidth = 1.0,
    neckHeight = 1.0,
    shoulderWidth = 1.0,
    clothingPrint = 'none',
    activeEmotion = 'none',
    artStyle = 'classic',
  } = config;

  const {
    angleY,
    eyeLOpen,
    eyeROpen,
    pupilX,
    pupilY,
    mouthOpen,
    mouthForm,
    eyebrowY,
    breath,
    bodyX,
    activeEmotion: rigActiveEmotion,
    tongueOut = 0,
  } = rig;

  const effectiveEmotion = rigActiveEmotion && rigActiveEmotion !== 'none' ? rigActiveEmotion : activeEmotion;
  const hairFillColor = getHairFillColor(hairGradient, hairColor);
  const frame = calculateAvatarFrameStyles(config, rig);
  const { headRotation, physicsSwayX, physicsSwayY } = frame;

  return (
    <div
      className={`relative overflow-hidden w-full max-w-[400px] aspect-square group ${
        transparent ? '' : 'rounded border border-white/10 shadow-2xl bg-[#0a0a0c]'
      }`}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${config.name || 'VTuber'} avatar`}
      >
        <AvatarDefs hairGradient={hairGradient} hairColor={hairColor} hairHighlightColor={hairHighlightColor} />
        <AvatarBackground backgroundStyle={backgroundStyle} transparent={transparent} />

        <g
          data-rig-node="back-hair"
          style={{
            transform: frame.backHairTransform,
            transformOrigin: '200px 220px',
          }}
        >
          <HairComponent
            bangStyle={hairStyleBang}
            backStyle={hairStyleBack}
            color={hairFillColor}
            highlightColor={hairHighlightColor}
            angleY={angleY}
            breath={breath}
            hairSwayX={physicsSwayX}
            hairSwayY={physicsSwayY}
            artStyle={artStyle}
          />
        </g>

        <g data-rig-node="chest" style={{ transform: frame.chestTransform, transformOrigin: '200px 380px' }}>
          <NeckAndShoulders
            skinColor={skinColor}
            clothingStyle={clothingStyle}
            color1={clothingColor1}
            color2={clothingColor2}
            angleZ={headRotation}
            bodyX={bodyX}
            neckWidth={neckWidth}
            neckHeight={neckHeight}
            shoulderWidth={shoulderWidth}
            clothingPrint={clothingPrint}
            artStyle={artStyle}
          />
        </g>

        <g
          id="rigged-head-module"
          data-rig-node="head"
          style={{
            transform: frame.headTransform,
            transformOrigin: '200px 220px',
          }}
        >
          <g data-rig-node="head-outline" style={{ transform: frame.headOutlineTransform }}>
            <HeadBase
              skinColor={skinColor}
              blushOpacity={blushOpacity}
              blushColor={blushColor}
              earStyle={earStyle}
              artStyle={artStyle}
            />
            <FaceFlushOverlay emotion={effectiveEmotion} />
          </g>

          {artStyle === 'anime' && (
            <g
              data-rig-node="front-hair-shadow"
              style={{
                transform: frame.frontHairShadowTransform,
                transformOrigin: '200px 140px',
                opacity: 0.15,
              }}
            >
              <FrontHairComponent
                bangStyle={hairStyleBang}
                color="#0f172a"
                highlightColor="none"
                angleY={angleY}
                artStyle={artStyle}
              />
            </g>
          )}

          <g
            data-rig-node="front-hair"
            style={{
              transform: frame.frontHairTransform,
              transformOrigin: '200px 140px',
            }}
          >
            <FrontHairComponent
              bangStyle={hairStyleBang}
              color={hairFillColor}
              highlightColor={hairHighlightColor}
              angleY={angleY}
              artStyle={artStyle}
            />
          </g>

          <g
            id="parallax-facial-features"
            data-rig-node="face"
            style={{
              transform: frame.faceTransform,
            }}
          >
            <EyebrowSVG
              style={eyebrowStyle}
              color={eyebrowColor}
              isLeft={true}
              eyebrowY={eyebrowY}
              artStyle={artStyle}
            />
            <EyebrowSVG
              style={eyebrowStyle}
              color={eyebrowColor}
              isLeft={false}
              eyebrowY={eyebrowY}
              artStyle={artStyle}
            />
            <EyeSVG
              eyeColor={eyeColor}
              pupilStyle={pupilStyle}
              pupilColor={pupilColor}
              isLeft={true}
              blink={eyeLOpen}
              pupilX={pupilX}
              pupilY={pupilY}
              artStyle={artStyle}
              activeEmotion={effectiveEmotion}
            />
            <EyeSVG
              eyeColor={eyeColor}
              pupilStyle={pupilStyle}
              pupilColor={pupilColor}
              isLeft={false}
              blink={eyeROpen}
              pupilX={pupilX}
              pupilY={pupilY}
              artStyle={artStyle}
              activeEmotion={effectiveEmotion}
            />
            <Live2DMouth
              openAmount={mouthOpen}
              form={mouthForm}
              hasFangs={hasFangs}
              artStyle={artStyle}
              tongueOut={tongueOut}
            />
          </g>

          <g
            data-rig-node="accessory"
            style={{
              transform: frame.accessoryTransform,
              transformOrigin: '200px 140px',
            }}
          >
            <AccessoryComponent
              style={accessoryStyle}
              color={accessoryColor}
              angleX={0}
              accessoryGlow={accessoryGlow}
            />
          </g>

          <EmotionOverlays emotion={effectiveEmotion} />
        </g>

        {onScreenBuster && <AvatarDebugOverlay frame={frame} />}
        {artStyle === 'anime' && <AnimeSparkles />}
      </svg>

      {!transparent && <AvatarHud fps={fps} />}
    </div>
  );
};
