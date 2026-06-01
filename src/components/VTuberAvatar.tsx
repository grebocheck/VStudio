import React from 'react';
import { AvatarConfig, RigParams } from '../types';
import { NeckAndShoulders } from './avatar/Costumes';
import { HeadBase, Live2DMouth } from './avatar/HeadAndFace';
import { EyebrowSVG, EyeSVG } from './avatar/Eyes';
import { HairComponent, FrontHairComponent } from './avatar/Hairstyles';
import { AccessoryComponent } from './avatar/Accessories';

interface VTuberAvatarProps {
  config: AvatarConfig;
  rig: RigParams;
  onScreenBuster?: boolean; // Toggles visual grids showing the rigging polygons (very aesthetic!)
  /** Overlay mode: no frame/background/HUD badges so the avatar can render on a
   *  transparent OBS Browser Source (green-screen background is still honored). */
  transparent?: boolean;
}

export const VTuberAvatar: React.FC<VTuberAvatarProps> = ({ config, rig, onScreenBuster = false, transparent = false }) => {
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
    headSize = 1.0,
    neckWidth = 1.0,
    neckHeight = 1.0,
    shoulderWidth = 1.0,
    clothingPrint = 'none',
    activeEmotion = 'none',
    artStyle = 'classic',
  } = config;

  const {
    angleX,
    angleY,
    angleZ,
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

  const effectiveEmotion = (rigActiveEmotion && rigActiveEmotion !== 'none') ? rigActiveEmotion : activeEmotion;

  // Render Dynamic Hair Gradients!
  const getHairFillColor = () => {
    if (!hairGradient || hairGradient === 'none') return hairColor;
    return 'url(#hair-gradient-id)';
  };

  const getHairGradientStops = () => {
    switch (hairGradient) {
      case 'linear':
        return (
          <>
            <stop offset="0%" stopColor={hairColor} />
            <stop offset="100%" stopColor={hairHighlightColor} />
          </>
        );
      case 'sunset':
        return (
          <>
            <stop offset="0%" stopColor={hairColor} />
            <stop offset="100%" stopColor="#ef4444" />
          </>
        );
      case 'indigo-fade':
        return (
          <>
            <stop offset="0%" stopColor={hairColor} />
            <stop offset="100%" stopColor="#6366f1" />
          </>
        );
      default:
        return null;
    }
  };

  // Let's compute fine-tuned offsets for simulating Live2D multi-layer depth!
  // Facial features (eyes, eyebrows, mouth) shift together inside the head based on head yaw/pitch
  const facesTranslateX = angleX * 0.6; // strong facial shift
  const facesTranslateY = angleY * 0.5;

  const outlineTranslateX = angleX * 0.2; // subtle head-outline shift for perspective depth
  const outlineTranslateY = angleY * 0.15;

  const headRotation = angleZ; // rotate entire head around neck base

  // Neck pivot and breathing effect scales
  const isRetro = artStyle === 'retro';
  const isAnime = artStyle === 'anime';

  // Amplified bounce tempo for retro squash & stretch
  const retroBounceY = isRetro ? Math.sin(breath * Math.PI * 2) * 0.05 : 0;
  const retroBounceX = isRetro ? -Math.cos(breath * Math.PI * 2) * 0.03 : 0;

  const chestBreathingScale = 1.0 + (isRetro ? Math.sin(breath * Math.PI * 2) * 0.03 : Math.sin(breath * Math.PI * 2) * 0.012);
  // Set hair breathing scale to totally static 1.0 to eliminate auto-bumping/pulsating
  const hairBreathingScaleY = 1.0;

  // Squash & Stretch Kinematics:
  // When looking far, the head vertically elongates and narrows slightly to preserve volume.
  // This provides distinct animation elasticity.
  const lookDistance = Math.sqrt(angleX * angleX + angleY * angleY);
  const headStretchY = 1.0 + (lookDistance * 0.0016) + retroBounceY; // vertical stretch
  const headStretchX = 1.0 - (lookDistance * 0.0008) + retroBounceX; // horizontal squeeze to preserve volume

  // High-inertia physical hair sway values processed by raw physics loops
  // Amplify sway physics for gorgeous anime hair strands
  const physicsSwayX = (rig.hairSwayX ?? 0) * (isAnime ? 1.35 : 1.0);
  const physicsSwayY = (rig.hairSwayY ?? 0) * (isAnime ? 1.25 : 1.0);

  // Background configurations
  const getBackgroundContent = () => {
    // In overlay mode keep the canvas transparent (unless the user explicitly
    // wants a chroma-key fill) so OBS Browser Source compositing works.
    if (transparent && backgroundStyle !== 'green-screen') return null;
    switch (backgroundStyle) {
      case 'green-screen':
        return <rect width="400" height="400" fill="#00ff00" />;
      case 'gaming':
        return (
          <g>
            <rect width="400" height="400" fill="#0e0c1b" />
            {/* Cyberpunk LED lights wall pattern */}
            <path d="M0 80 Q200 40, 400 80" stroke="#f43f5e" strokeWidth="3" opacity="0.4" fill="none" />
            <path d="M0 160 Q200 120, 400 160" stroke="#06b6d4" strokeWidth="3" opacity="0.4" fill="none" />
            {/* Gaming shelves/room decor silhouettes */}
            <rect x="25" y="100" width="60" height="6" fill="#1e1b4b" rx="2" />
            <rect x="315" y="120" width="60" height="6" fill="#1e1b4b" rx="2" />
            {/* Neon light rods */}
            <line x1="30" y1="50" x2="30" y2="90" stroke="#ec4899" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
            <line x1="30" y1="50" x2="30" y2="90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <line x1="370" y1="70" x2="370" y2="110" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
            <line x1="370" y1="70" x2="370" y2="110" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </g>
        );
      case 'nebula':
        return (
          <g>
            <rect width="400" height="400" fill="#02001c" />
            {/* Ambient colorful dust blobs */}
            <circle cx="100" cy="120" r="140" fill="#a21caf" opacity="0.15" filter="blur(40px)" />
            <circle cx="300" cy="280" r="160" fill="#1d4ed8" opacity="0.2" filter="blur(50px)" />
            <circle cx="200" cy="80" r="80" fill="#0369a1" opacity="0.15" filter="blur(30px)" />
            {/* Twinkly stars */}
            <circle cx="60" cy="70" r="1" fill="#ffffff" />
            <circle cx="320" cy="40" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="340" cy="180" r="1" fill="#ffffff" />
            <circle cx="45" cy="250" r="1.5" fill="#ffffff" />
            <circle cx="120" cy="310" r="1" fill="#ffffff" opacity="0.5" />
            {/* Tiny constellations lines */}
            <line x1="60" y1="70" x2="100" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="100" y1="90" x2="120" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </g>
        );
      case 'dark-studio':
      default:
        return (
          <g>
            <rect width="400" height="400" fill="#07070a" />
            <radialGradient id="studio-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#121217" />
              <stop offset="100%" stopColor="#07070a" />
            </radialGradient>
            <rect width="400" height="400" fill="url(#studio-grad)" />
            <circle cx="200" cy="200" r="120" fill="#6366f1" opacity="0.04" />
          </g>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden w-full max-w-[400px] aspect-square group ${
      transparent ? '' : 'rounded border border-white/10 shadow-2xl bg-[#0a0a0c]'
    }`}>
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {hairGradient && hairGradient !== 'none' && (
            <linearGradient id="hair-gradient-id" x1="0" y1="0" x2="0" y2="1">
              {getHairGradientStops()}
            </linearGradient>
          )}
        </defs>

        {/* Step 1: Backdrop */}
        {getBackgroundContent()}

        {/* --- Back Hair Layer (Placed behind Torso/Neck in absolute SVG layers) --- */}
        <g style={{
          transform: `translate(${bodyX * 0.6}px, ${outlineTranslateY - (angleY * 0.38)}px) rotate(${headRotation}deg) scale(${headSize}) scale(${headStretchX}, ${headStretchY}) translate(${physicsSwayX * 0.15 + (facesTranslateX * -0.1)}px, ${physicsSwayY * 0.08}px) rotate(${physicsSwayX * 0.08}deg)`,
          transformOrigin: '200px 220px'
        }}>
          <HairComponent
            bangStyle={hairStyleBang}
            backStyle={hairStyleBack}
            color={getHairFillColor()}
            highlightColor={hairHighlightColor}
            angleY={angleY}
            breath={breath}
            hairSwayX={physicsSwayX}
            hairSwayY={physicsSwayY}
            artStyle={artStyle}
          />
        </g>

        {/* --- Chest / Torso Layer (Stays somewhat static, responds to breath & minor body physics) --- */}
        <g style={{ transform: `scale(${chestBreathingScale})`, transformOrigin: '200px 380px' }}>
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

        {/* --- HEAD & FACE GROUP (Fully Rotatable, Tilting, Warpable, Scalable) --- */}
        <g
          id="rigged-head-module"
          style={{
            transform: `translate(${bodyX * 0.6}px, ${outlineTranslateY - (angleY * 0.38)}px) rotate(${headRotation}deg) scale(${headSize}) scale(${headStretchX}, ${headStretchY})`,
            transformOrigin: '200px 220px' // Rotate around face base
          }}
        >
          {/* Head Base skin silhouette */}
          <g style={{ transform: `translateX(${outlineTranslateX}px)` }}>
            <HeadBase
               skinColor={skinColor}
               blushOpacity={blushOpacity}
               blushColor={blushColor}
               earStyle={earStyle}
               artStyle={artStyle}
            />
            {/* Love pink face flush & deep cute cheek blushes */}
            {effectiveEmotion === 'love' && (
              <g>
                <defs>
                  <radialGradient id="love-flush-grad" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.28" />
                    <stop offset="55%" stopColor="#f43f5e" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Soft warm pink face flush */}
                <ellipse cx="200" cy="175" rx="70" ry="80" fill="url(#love-flush-grad)" className="animate-[pulse_3s_infinite]" />
                {/* Saturated cheek blush with a soft blurring glow */}
                <ellipse cx="152" cy="195" rx="20" ry="10" fill="#ec4899" opacity="0.32" style={{ filter: 'blur(2.5px)' }} className="animate-[pulse_2s_infinite]" />
                <ellipse cx="248" cy="195" rx="20" ry="10" fill="#ec4899" opacity="0.32" style={{ filter: 'blur(2.5px)' }} className="animate-[pulse_2s_infinite_0.5s]" />
              </g>
            )}
            {/* Angry red skin flush — full face tinted red with pulsing overlay */}
            {effectiveEmotion === 'angry' && (
              <g>
                <defs>
                  <radialGradient id="angry-flush-grad" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#ff2020" stopOpacity="0.38" />
                    <stop offset="55%" stopColor="#ff4040" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#ff6060" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Full face flush */}
                <ellipse cx="200" cy="175" rx="70" ry="80" fill="url(#angry-flush-grad)" className="animate-pulse" />
                {/* Extra intense cheek burn areas */}
                <ellipse cx="155" cy="195" rx="22" ry="12" fill="#ff3030" opacity="0.25" style={{ filter: 'blur(3px)' }} />
                <ellipse cx="245" cy="195" rx="22" ry="12" fill="#ff3030" opacity="0.25" style={{ filter: 'blur(3px)' }} />
                {/* Forehead heat */}
                <ellipse cx="200" cy="130" rx="40" ry="12" fill="#ff4040" opacity="0.15" style={{ filter: 'blur(5px)' }} />
              </g>
            )}
          </g>

          {/* Shadow from Front Hair / Fringe on the Forehead (for advanced anime depth) */}
          {artStyle === 'anime' && (
            <g style={{
              transform: `translateX(${facesTranslateX * 0.72 + physicsSwayX * 0.25 + 1.5}px) translateY(4px) rotate(${physicsSwayX * 0.08}deg)`,
              transformOrigin: '200px 140px',
              opacity: 0.15
            }}>
              <FrontHairComponent
                bangStyle={hairStyleBang}
                color="#0f172a" // Ambient shadow shade
                highlightColor="none"
                angleY={angleY}
                artStyle={artStyle}
              />
            </g>
          )}

          {/* Front Hair / Fringe (Sweeps across the face, translates slightly less than face details for depth) */}
          <g style={{
            transform: `translateX(${facesTranslateX * 0.72 + physicsSwayX * 0.25}px) rotate(${physicsSwayX * 0.08}deg)`,
            transformOrigin: '200px 140px' // Pivot point near center of head
          }}>
            <FrontHairComponent
              bangStyle={hairStyleBang}
              color={getHairFillColor()}
              highlightColor={hairHighlightColor}
              angleY={angleY}
              artStyle={artStyle}
            />
          </g>

          {/* FACIAL DETAILS (Shift strongly within head contour to create parallax depth) */}
          <g
            id="parallax-facial-features"
            style={{
              transform: `translate(${facesTranslateX}px, ${facesTranslateY}px)`
            }}
          >
            {/* Eyebrows */}
            <EyebrowSVG style={eyebrowStyle} color={eyebrowColor} isLeft={true} eyebrowY={eyebrowY} artStyle={artStyle} />
            <EyebrowSVG style={eyebrowStyle} color={eyebrowColor} isLeft={false} eyebrowY={eyebrowY} artStyle={artStyle} />

            {/* Eyes */}
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

            {/* Mouth */}
            <Live2DMouth openAmount={mouthOpen} form={mouthForm} hasFangs={hasFangs} artStyle={artStyle} tongueOut={tongueOut} />
          </g>

          {/* Accessories (Top hats, horns, headphones, glasses) */}
          <g style={{
            transform: `translateX(${
              accessoryStyle === 'glasses' 
                ? facesTranslateX 
                : (accessoryStyle === 'neko-ears' || accessoryStyle === 'horns' || accessoryStyle === 'angel-halo')
                ? facesTranslateX * 0.72 + physicsSwayX * 0.25
                : outlineTranslateX * 1.15
            }px) rotate(${
              (accessoryStyle === 'neko-ears' || accessoryStyle === 'horns' || accessoryStyle === 'angel-halo')
                ? physicsSwayX * 0.08
                : 0
            }deg)`,
            transformOrigin: '200px 140px'
          }}>
            <AccessoryComponent
              style={accessoryStyle}
              color={accessoryColor}
              angleX={0} // Disable internal double translation to stay anchored
              accessoryGlow={accessoryGlow}
            />
          </g>

          {/* Animated/Creative Active Emotion Overlays (Tears, Anger Pops, Exclamations, Smug Twinkles) */}
          {effectiveEmotion === 'angry' && (
            <g opacity="0.95">
              {/* Large throbbing forehead cross vein (signature anime rage symbol) */}
              <g transform="translate(235, 100) scale(1.15)">
                <path d="M-12 -12 Q6 -18 24 -12 M-12 12 Q6 18 24 12 M-12 -12 Q-18 6 -12 24 M12 -12 Q18 6 12 24" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" fill="none" className="animate-pulse" />
              </g>
              {/* Secondary cross vein (left temple) */}
              <g transform="translate(140, 108) scale(0.85)">
                <path d="M-10 -10 Q5 -15 20 -10 M-10 10 Q5 15 20 10 M-10 -10 Q-15 5 -10 20 M10 -10 Q15 5 10 20" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" fill="none" className="animate-pulse" />
              </g>
              {/* Small accent vein (right cheek) */}
              <g transform="translate(268, 155) scale(0.55)">
                <path d="M-10 -10 Q5 -15 20 -10 M-10 10 Q5 15 20 10 M-10 -10 Q-15 5 -10 20 M10 -10 Q15 5 10 20" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" fill="none" className="animate-pulse" />
              </g>
              {/* Multiple fire/steam wisps rising from head */}
              <path d="M175 72 Q168 48 178 35 T182 8" fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" className="animate-bounce" />
              <path d="M195 65 Q190 42 198 28 T202 2" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" className="animate-bounce" />
              <path d="M215 68 Q210 45 218 32 T222 5" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" className="animate-bounce" />
              <path d="M230 74 Q226 54 232 42 T236 18" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" className="animate-bounce" />
              {/* Intense red aura glow around the head */}
              <ellipse cx="200" cy="110" rx="65" ry="20" fill="#ef4444" opacity="0.25" style={{ filter: 'blur(6px)' }} />
            </g>
          )}

          {effectiveEmotion === 'cry' && (
            <g opacity="0.95">
              {/* Dynamic Waterfall Left eye flowing tears stream */}
              <path d="M152 173 C148 185, 156 195, 150 220" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
              <path d="M152 173 C149 195, 154 210, 149 238" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
              <circle cx="150" cy="221" r="5" fill="#a0c4ff" className="animate-ping" style={{ transformOrigin: '150px 221px' }} />
              <circle cx="150" cy="221" r="4.2" fill="#ffffff" />
              
              {/* Dynamic Waterfall Right eye flowing tears stream */}
              <path d="M248 173 C244 185, 252 195, 246 220" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
              <path d="M248 173 C245 195, 250 210, 245 238" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
              <circle cx="246" cy="221" r="5" fill="#a0c4ff" className="animate-ping" style={{ transformOrigin: '246px 221px' }} />
              <circle cx="246" cy="221" r="4.2" fill="#ffffff" />

              {/* Sparkling teardrops falling further down */}
              <path d="M149 230 L151 235 L149 242 L147 235 Z" fill="#93c5fd" className="animate-[bounce_1.5s_infinite]" />
              <path d="M245 230 L247 235 L245 242 L243 235 Z" fill="#93c5fd" className="animate-[bounce_1.5s_infinite_0.4s]" />
            </g>
          )}

          {effectiveEmotion === 'shocked' && (
            <g opacity="0.95">
              {/* Shock exclamation warning mark above head */}
              <g transform="translate(200, 40)">
                <ellipse cx="0" cy="0" rx="15" ry="12" fill="#eab308" stroke="#1e293b" strokeWidth="2" />
                <path d="M-4 10 L-8 20 L4 10 Z" fill="#eab308" stroke="#1e293b" strokeWidth="2" />
                <path d="M-3 9 L-8 19 L3 9 Z" fill="#eab308" />
                <text x="0" y="4" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">!</text>
              </g>
              {/* Surprise speed rays around coordinates */}
              <path d="M120 80 L100 65 M115 120 L90 115 M280 80 L300 65 M285 120 L310 115" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" className="animate-pulse" />
              {/* Sweat drop next to temple */}
              <path d="M272 135 C275 142, 271 146, 271 152 C271 146, 267 142, 267 135 Z" fill="#38bdf8" className="animate-[bounce_1s_infinite]" />
            </g>
          )}

          {effectiveEmotion === 'relaxed' && (
            <g opacity="0.95">
              {/* Floating beautiful cherry blossom flower petals around head */}
              <g className="animate-[bounce_3s_infinite]">
                <path d="M 120 70 C 115 62, 105 65, 110 75 C 115 85, 125 82, 120 70" fill="#f43f5e" opacity="0.8" transform="rotate(15, 120, 70)" />
                <path d="M 280 60 C 275 52, 265 55, 270 65 C 275 75, 285 72, 280 60" fill="#f43f5e" opacity="0.85" transform="rotate(-30, 280, 60)" />
              </g>
              <g className="animate-[pulse_2.5s_infinite_0.5s]">
                <path d="M 90 190 C 85 182, 75 185, 80 195 C 85 205, 95 202, 90 190" fill="#fda4af" opacity="0.75" />
                <path d="M 310 180 C 305 172, 295 175, 300 185 C 305 195, 315 192, 310 180" fill="#fda4af" opacity="0.75" />
              </g>
              {/* Soft horizontal blush lines for super relaxed look */}
              <ellipse cx="140" cy="195" rx="15" ry="5" fill="#f43f5e" opacity="0.18" />
              <ellipse cx="260" cy="195" rx="15" ry="5" fill="#f43f5e" opacity="0.18" />
              {/* Cute relaxed sigh breath cloud */}
              <path d="M205 218 Q212 212 220 216 Q224 210 230 215" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
            </g>
          )}

          {effectiveEmotion === 'smug' && (
            <g transform="translate(270, 185)">
              <path d="M0 -12 Q0 0 12 0 Q0 0 0 12 Q0 0 -12 0 Q0 0 0 -12 Z" fill="#eab308" />
              <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            </g>
          )}

          {effectiveEmotion === 'happy' && (
            <g opacity="0.88">
              {/* Floating cute pink emotional blush hearts */}
              <path d="M135 158 C131 152, 123 152, 119 158 C115 152, 107 152, 103 158 L119 178 Z" fill="#f43f5e" transform="scale(0.8) translate(15, -20)" />
              <path d="M265 158 C261 152, 253 152, 249 158 C245 152, 237 152, 233 158 L249 178 Z" fill="#f43f5e" transform="scale(0.8) translate(70, -20)" />
            </g>
          )}

          {effectiveEmotion === 'love' && (
            <g opacity="0.95">
              {/* Pulsing Love Hearts around cheeks and top of head with gorgeous premium glow filters */}
              <path
                d="M110 130 C106 124, 98 124, 94 130 C90 124, 82 124, 78 130 L94 150 Z"
                fill="#ec4899"
                className="animate-[bounce_2s_infinite]"
                style={{ filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.7))' }}
              />
              <path
                d="M290 130 C286 124, 278 124, 274 130 C270 124, 262 124, 258 130 L274 150 Z"
                fill="#ec4899"
                className="animate-[bounce_2s_infinite_0.4s]"
                style={{ filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.7))' }}
              />
              <path
                d="M200 60 C196 54, 188 54, 184 60 C180 54, 172 54, 168 60 L184 80 Z"
                fill="#f43f5e"
                className="animate-[pulse_1.5s_infinite]"
                style={{ filter: 'drop-shadow(0 0 5px rgba(244, 63, 94, 0.7))' }}
              />
            </g>
          )}

          {effectiveEmotion === 'starry' && (
            <g opacity="0.9">
              {/* Magical yellow and gold sparkles around eyes */}
              <path d="M 120 150 L 123 157 L 130 160 L 123 163 L 120 170 L 117 163 L 110 160 L 117 157 Z" fill="#fbbf24" className="animate-[pulse_1.8s_infinite]" />
              <path d="M 280 150 L 283 157 L 290 160 L 283 163 L 280 170 L 277 163 L 270 160 L 277 157 Z" fill="#fbbf24" className="animate-[pulse_1.8s_infinite_0.5s]" />
              {/* Cheek sparkles */}
              <circle cx="132" cy="190" r="3" fill="#ffffff" className="animate-ping" />
              <circle cx="268" cy="190" r="3" fill="#ffffff" className="animate-ping" />
            </g>
          )}

          {effectiveEmotion === 'squint' && (
            <g opacity="0.9">
              {/* Angry/Squeezed-shut double sweat marks and cheek blushes */}
              <path d="M125 195 Q 130 200, 135 195" stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M265 195 Q 270 200, 275 195" stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* White steam puff clouds above head corners */}
              <path d="M 110 80 Q 100 70 110 60 Q 120 70 110 80" fill="#f1f5f9" className="animate-[pulse_1s_infinite]" />
              <path d="M 290 80 Q 280 70 290 60 Q 300 70 290 80" fill="#f1f5f9" className="animate-[pulse_1s_infinite_0.5s]" />
            </g>
          )}

          {effectiveEmotion === 'depressed' && (
            <g opacity="0.95">
              {/* Classic vertical purple-indigo gloom gradient at the top forehead (extremely anime style!) */}
              <defs>
                <linearGradient id="forehead-gloom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.6" />
                  <stop offset="45%" stopColor="#312e81" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#312e81" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <rect x="125" y="80" width="150" height="70" fill="url(#forehead-gloom)" rx="10" />
              
              {/* Dark sad background sigh cloud */}
              <path d="M140 230 Q 150 215, 160 218 Q 165 210, 175 215" stroke="rgba(79, 70, 229, 0.45)" strokeWidth="2" fill="none" className="animate-pulse" />
            </g>
          )}

          {effectiveEmotion === 'dizzy' && (
            <g transform="translate(200, 50)" opacity="0.95">
              {/* Spinning/pulsating dizzy spirals above head */}
              <circle cx="-35" cy="-20" r="4" fill="#fbbf24" className="animate-[ping_1.5s_infinite]" />
              <circle cx="35" cy="-15" r="3" fill="#fbbf24" className="animate-[ping_2s_infinite]" />
              <path d="M-20 -10 Q0 -30 20 -10 Q0 10 -20 -10" fill="none" stroke="#facc15" strokeWidth="2.5" className="animate-[spin_4s_linear_infinite]" />
              <text x="0" y="-35" fontSize="9" fontWeight="bold" fill="#facc15" textAnchor="middle" className="animate-pulse">@_@</text>
            </g>
          )}

          {effectiveEmotion === 'cool' && (
            <g opacity="0.9">
              {/* Cool vibes neon music notes rising and bouncing around the avatar */}
              <text x="90" y="120" fontSize="18" fill="#d946ef" className="animate-[bounce_1.4s_infinite_0.2s]">♫</text>
              <text x="310" y="110" fontSize="14" fill="#06b6d4" className="animate-[bounce_2s_infinite_0.4s]">♪</text>
              <text x="110" y="80" fontSize="15" fill="#10b981" className="animate-[pulse_1.2s_infinite_0.6s]">♬</text>
              <text x="290" y="70" fontSize="16" fill="#8b5cf6" className="animate-[bounce_1.8s_infinite]">♫</text>
            </g>
          )}

          {effectiveEmotion === 'scared' && (
            <g opacity="0.95">
              {/* Dripping sweat drops from forehead */}
              <path d="M135 120 C135 130, 131 135, 131 145 C131 135, 127 130, 127 120 Z" fill="#60a5fa" className="animate-[bounce_2s_infinite]" />
              <path d="M265 115 C265 125, 261 130, 261 140 C261 130, 257 125, 257 115 Z" fill="#60a5fa" className="animate-[bounce_2s_infinite_0.5s]" />
              {/* Scared shivering exclamation details */}
              <text x="95" y="150" fontSize="22" fontWeight="bold" fill="#3b82f6" className="animate-pulse">⚡</text>
              <text x="305" y="145" fontSize="22" fontWeight="bold" fill="#3b82f6" className="animate-pulse">⚡</text>
            </g>
          )}

          {effectiveEmotion === 'sleepy' && (
            <g opacity="0.9">
              {/* Gentle floating Zzz rising from mouth area (approx 200, 210) */}
              <g className="animate-[bounce_2.5s_infinite]">
                <text x="215" y="200" fontSize="11" fontWeight="bold" fill="#93c5fd">Z</text>
                <text x="225" y="185" fontSize="14" fontWeight="bold" fill="#60a5fa" className="animate-[pulse_1.5s_infinite_0.5s]">Z</text>
                <text x="238" y="165" fontSize="18" fontWeight="bold" fill="#3b82f6" className="animate-[pulse_2s_infinite_1s]">Z</text>
              </g>
              {/* Sleeping nose snot bubble, extremely anime/retro! */}
              <circle cx="198" cy="192" r="6" fill="rgba(191, 219, 254, 0.6)" stroke="#60a5fa" strokeWidth="1" className="animate-[pulse_2s_infinite]" />
            </g>
          )}

          {effectiveEmotion === 'shy' && (
            <g opacity="0.95">
              {/* Enhanced massive pink cheeks blushing */}
              <ellipse cx="140" cy="195" rx="20" ry="8" fill="#ff0055" opacity="0.32" />
              <ellipse cx="260" cy="195" rx="20" ry="8" fill="#ff0055" opacity="0.32" />
              {/* Shy curl spirals */}
              <path d="M110 215 Q100 205 110 195 Q120 205 110 215" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-pulse" />
              <path d="M290 215 Q280 205 290 195 Q300 205 290 215" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-pulse" />
            </g>
          )}
        </g>

        {/* Visual Rigging Grid Overlay / Skeleton wireframe (Very cool feature to show rigging polygons) */}
        {onScreenBuster && (
          <g id="rigging-debug-grid" opacity="0.35" pointerEvents="none">
            {/* Head circle mesh */}
            <circle cx={200 + bodyX * 0.6} cy={160 + outlineTranslateY} r="75" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="3 3" />
            {/* Face grid coordinates tracking head rotation */}
            <g style={{ transform: `translate(${bodyX * 0.6 + facesTranslateX}px, ${outlineTranslateY + facesTranslateY}px) rotate(${headRotation}deg)`, transformOrigin: '200px 220px' }}>
              <line x1="125" y1="175" x2="275" y2="175" stroke="#3b82f6" strokeWidth="1" />
              <line x1="200" y1="100" x2="200" y2="250" stroke="#3b82f6" strokeWidth="1" />
              {/* Eye anchors */}
              <rect x="145" y="165" width="20" height="20" fill="none" stroke="#e11d48" strokeWidth="1" />
              <rect x="235" y="165" width="20" height="20" fill="none" stroke="#e11d48" strokeWidth="1" />
              {/* Mouth deform node */}
              <circle cx="200" cy="208" r="8" fill="none" stroke="#9333ea" strokeWidth="1" />
            </g>
          </g>
        )}
        {/* Anime magical sparkles overlay */}
        {artStyle === 'anime' && (
          <g id="anime-sparkles" pointerEvents="none">
            {/* Sparkle 1 */}
            <path d="M 120 70 Q 120 80 130 80 Q 120 80 120 90 Q 120 80 110 80 Q 120 80 120 70 Z" fill="#ffffff" opacity="0.65" />
            {/* Sparkle 2 */}
            <path d="M 280 65 Q 280 75 290 75 Q 280 75 280 85 Q 280 75 270 75 Q 280 75 280 65 Z" fill="#ec4899" opacity="0.75" />
            {/* Sparkle 3 (Yellow glowing star) */}
            <path d="M 85 190 Q 85 196 91 196 Q 85 196 85 202 Q 85 196 79 196 Q 85 196 85 190 Z" fill="#facc15" opacity="0.7" />
            <path d="M 315 210 Q 315 216 321 216 Q 315 216 315 222 Q 315 216 309 216 Q 315 216 315 210 Z" fill="#60a5fa" opacity="0.65" />
          </g>
        )}
      </svg>

      {/* Decorative avatar watermark HUD mimicking professional rigging software */}
      {!transparent && (
        <>
          <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-700/50 backdrop-blur-sm pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-slate-300 tracking-wider">LIVE GRAPHICS</span>
          </div>

          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-700/50 backdrop-blur-sm pointer-events-none">
            <span className="text-[10px] font-mono text-teal-400">FPS: 60 / SVG DEFORM</span>
          </div>
        </>
      )}
    </div>
  );
};
