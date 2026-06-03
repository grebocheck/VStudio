import React from 'react';
import { Emotion } from '../../types';

export const EyebrowSVG: React.FC<{
  style: 'normal' | 'thick' | 'thin' | 'sad' | 'none';
  color: string;
  isLeft: boolean;
  eyebrowY: number;
  artStyle?: 'classic' | 'anime' | 'retro';
}> = ({ style, color, isLeft, eyebrowY, artStyle = 'classic' }) => {
  if (style === 'none') return null;
  const transform = isLeft ? `translate(0, ${eyebrowY})` : `scale(-1, 1) translate(-400, ${eyebrowY})`;

  const isAnime = artStyle === 'anime';
  const strokeWidth = isAnime
    ? style === 'thick'
      ? 2.2
      : style === 'thin'
        ? 0.8
        : 1.2
    : style === 'thick'
      ? 6
      : style === 'thin'
        ? 2
        : 4;

  const opacity = style === 'sad' ? 0.9 : 1.0;

  let d = isAnime
    ? 'M138 128 C148 123, 163 123, 174 128' // sleeker anime arch shifted up
    : 'M140 145 C150 140, 165 140, 175 147'; // normal

  if (style === 'sad') {
    d = isAnime ? 'M136 132 C144 128, 162 125, 174 126' : 'M135 152 C145 148, 165 142, 175 142'; // curve goes upwards towards center shifted up
  } else if (style === 'thick' || style === 'thin') {
    d = isAnime ? 'M137 127 Q155 121, 173 127' : 'M138 144 Q155 138, 173 145';
  }

  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      style={{ transform, transformOrigin: '200px 200px' }}
      opacity={opacity}
    />
  );
};

export const EyeSVG: React.FC<{
  eyeColor: string;
  pupilStyle: 'round' | 'star' | 'heart' | 'slit' | 'diamond' | 'cross' | 'flower' | 'none';
  pupilColor: string;
  isLeft: boolean;
  pupilX: number;
  pupilY: number;
  blink: number; // 0 (fully closed) to 1 (fully open)
  artStyle?: 'classic' | 'anime' | 'retro';
  activeEmotion?: Emotion;
  eyeShape?: 'default' | 'almond' | 'droopy' | 'sharp' | 'cat-eye';
}> = ({
  eyeColor,
  pupilStyle,
  pupilColor,
  isLeft,
  pupilX,
  pupilY,
  blink,
  artStyle = 'classic',
  activeEmotion = 'none',
  eyeShape = 'default',
}) => {
  // Center coordinates: Symmetrical local coordinates where both eyes are defined at 156.
  // The right eye utilizes scale(-1, 1) translate(-400, 0) to align itself perfectly at 244.
  const cx = 156;
  const cy = 175;

  // Horizontal mirror scaling for right eye (Standard SVG syntax, no 'px' unit)
  const transformEye = isLeft ? 'translate(0, 0)' : 'scale(-1, 1) translate(-400, 0)';

  // Pupil offset symmetry: since the right eye is horizontally scale-flipped, we invert pupilsX so they gaze in unison
  const effectivePupilX = isLeft ? pupilX : -pupilX;
  const px = effectivePupilX * (artStyle === 'anime' ? 5.2 : 3.5);
  const py = pupilY * (artStyle === 'anime' ? 3.8 : 2.5);

  const isAnime = artStyle === 'anime';

  const defaultShape = {
    eyeSlitPath: `M ${cx + 22} ${cy + 4} C ${cx + 14} ${cy - 22}, ${cx - 14} ${cy - 22}, ${cx - 26} ${cy + 2} C ${cx - 14} ${cy + 16}, ${cx + 14} ${cy + 16}, ${cx + 22} ${cy + 4} Z`,
    lashPath: `M ${cx + 22} ${cy + 4} C ${cx + 14} ${cy - 22}, ${cx - 14} ${cy - 22}, ${cx - 26} ${cy + 2} L ${cx - 38} ${cy - 2} L ${cx - 35} ${cy - 5} L ${cx - 36} ${cy - 10} C ${cx - 30} ${cy - 18}, ${cx - 20} ${cy - 26}, ${cx - 8} ${cy - 26} C ${cx + 4} ${cy - 26}, ${cx + 16} ${cy - 15}, ${cx + 22} ${cy + 4} Z`,
    lowerLidPath: `M ${cx - 16} ${cy + 14} C ${cx - 6} ${cy + 17}, ${cx + 6} ${cy + 17}, ${cx + 14} ${cy + 12} M ${cx - 12} ${cy + 15} L ${cx - 16} ${cy + 20}`,
    creasePath: `M ${cx - 16} ${cy - 26} C ${cx - 4} ${cy - 30}, ${cx + 12} ${cy - 30}, ${cx + 18} ${cy - 24}`,
  };

  // Handle high-expressiveness Custom Emotions first
  if (activeEmotion === 'relaxed') {
    return (
      <g transform={transformEye}>
        {/* Soft closed/half-closed satisfied curves like ^ ^ */}
        <path
          d={`M ${cx - 20} ${cy + 3} Q ${cx} ${cy - 8}, ${cx + 20} ${cy + 3}`}
          stroke="#1c1917"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - 15} ${cy + 8} Q ${cx} ${cy + 1}, ${cx + 15} ${cy + 8}`}
          stroke="rgba(251, 113, 133, 0.4)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Elegant smiling eyelash flick */}
        <path
          d={`M ${cx + 16} ${cy + 1} Q ${cx + 24} ${cy - 5}, ${cx + 22} ${cy + 5}`}
          stroke="#1c1917"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (activeEmotion === 'dizzy') {
    return (
      <g transform={transformEye}>
        {/* Dizzy spiral eyes @_@ */}
        <ellipse cx={cx} cy={cy} rx="21" ry="18" fill="#eff6ff" />
        <ellipse cx={cx} cy={cy} rx="21" ry="18" stroke="#1e293b" strokeWidth="3" fill="none" />

        {/* Distinct multi-layered infinite nesting spiral */}
        <path
          d={`M ${cx} ${cy} 
             A 14 14 0 1 0 ${cx + 14} ${cy}
             A 11 11 0 1 0 ${cx - 8} ${cy - 8}
             A 8 8 0 1 0 ${cx + 4} ${cy + 5}
             A 5 5 0 1 0 ${cx - 2} ${cy - 3}
             A 2 2 0 1 0 ${cx + 1} ${cy + 1}`}
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Floating cross stars around head/cheek area */}
        <path
          d={`M ${cx - 25} ${cy - 18} L ${cx - 19} ${cy - 12} M ${cx - 19} ${cy - 18} L ${cx - 25} ${cy - 12}`}
          stroke="#eab308"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx + 20} ${cy + 15} L ${cx + 26} ${cy + 21} M ${cx + 26} ${cy + 15} L ${cx + 20} ${cy + 21}`}
          stroke="#ec4899"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (activeEmotion === 'cool') {
    return (
      <g transform={transformEye}>
        {/* High-fidelity retro cyberpunk sunglasses/shades */}
        {/* Frame / Glass lens */}
        <polygon
          points={`${cx - 25},${cy - 14} ${cx + 24},${cy - 17} ${cx + 21} ${cy + 12} ${cx - 17} ${cy + 9}`}
          fill="#0f172a"
          stroke="#4338ca"
          strokeWidth="3"
        />
        {/* Neon magenta cyber reflection stripes */}
        <path
          d={`M ${cx - 17} ${cy - 4} L ${cx + 14} ${cy + 8}`}
          stroke="#d946ef"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d={`M ${cx - 10} ${cy - 7} L ${cx + 18} ${cy + 4}`}
          stroke="#38bdf8"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Sparkling star detail on sunglasses edge */}
        <path
          d={`M ${cx - 22} ${cy - 7} Q ${cx - 22} ${cy - 1} ${cx - 16} ${cy - 1} Q ${cx - 22} ${cy - 1} ${cx - 22} ${cy + 5} Q ${cx - 22} ${cy - 1} ${cx - 28} ${cy - 1} Q ${cx - 22} ${cy - 1} ${cx - 22} ${cy - 7}`}
          fill="#ffffff"
          opacity="0.95"
        />
      </g>
    );
  }

  if (activeEmotion === 'scared' || activeEmotion === 'shocked') {
    const shakeOffsetX = Math.sin(Date.now() * 0.18) * 0.8;
    const shakeOffsetY = Math.cos(Date.now() * 0.18) * 0.8;

    if (artStyle === 'anime') {
      // High-fidelity wide-open surprised anime eye with shrunken iris and shivering dilated pupils!
      return (
        <g transform={transformEye}>
          <defs>
            <linearGradient id={`anime-iris-overlay-shocked-${isLeft ? 'l' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.75" />
              <stop offset="45%" stopColor="#0f172a" stopOpacity="0.05" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
            </linearGradient>
          </defs>

          {/* Double eyelid crease line */}
          <path
            d={defaultShape.creasePath}
            stroke="rgba(30, 25, 22, 0.45)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Eyelash drop shadow on sclera */}
          <path
            d={defaultShape.eyeSlitPath}
            fill="none"
            stroke="rgba(28,21,18,0.3)"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ transform: 'translate(0px, 3px)' }}
            clipPath={`url(#anime-eye-clip-shocked-${isLeft ? 'l' : 'r'})`}
          />

          {/* Sclera / Eyeball White */}
          <path d={defaultShape.eyeSlitPath} fill="url(#eye-sclera)" />

          {/* Top ambient occlusion shadow perfectly conforming to the eye slit */}
          <path d={defaultShape.eyeSlitPath} fill={`url(#anime-sclera-shadow-${isLeft ? 'l' : 'r'})`} />

          {/* Masked Iris rendering with shivering translation */}
          <g clipPath={`url(#anime-eye-clip-shocked-${isLeft ? 'l' : 'r'})`}>
            <defs>
              <clipPath id={`anime-eye-clip-shocked-${isLeft ? 'l' : 'r'}`}>
                <path d={defaultShape.eyeSlitPath} />
              </clipPath>
            </defs>

            {/* Saturated Kyoto / DxD style base oval iris: significantly shrunken (12.5 x 15.5) to reveal more white sclera */}
            <ellipse cx={cx + px + shakeOffsetX} cy={cy + py + shakeOffsetY} rx="12.5" ry="15.5" fill={eyeColor} />

            {/* Saturated 3D light-transmitting overlay gradient */}
            <ellipse
              cx={cx + px + shakeOffsetX}
              cy={cy + py + shakeOffsetY}
              rx="12.5"
              ry="15.5"
              fill={`url(#anime-iris-overlay-shocked-${isLeft ? 'l' : 'r'})`}
            />

            {/* Dark lens shadow projection at the top half */}
            <path
              d={`M ${cx + px + shakeOffsetX - 12.5} ${cy + py + shakeOffsetY} A 12.5 15.5 0 0 1 ${cx + px + shakeOffsetX + 12.5} ${cy + py + shakeOffsetY} L ${cx + px + shakeOffsetX + 12.5} ${cy + py + shakeOffsetY - 18} L ${cx + px + shakeOffsetX - 12.5} ${cy + py + shakeOffsetY - 18} Z`}
              fill="rgba(15, 23, 42, 0.22)"
            />

            {/* Core dark center ring */}
            <ellipse cx={cx + px + shakeOffsetX} cy={cy + py + shakeOffsetY} rx="9" ry="11" fill="rgba(0,0,0,0.15)" />

            {/* Shrunken pupil configuration to show surprise / shock */}
            <g
              transform={`translate(${cx + px + shakeOffsetX}, ${cy + py + shakeOffsetY}) scale(0.65) translate(${-cx}, ${-cy})`}
            >
              {pupilStyle === 'slit' ? (
                <path
                  d={`M ${cx} ${cy - 13.5} 
                     Q ${cx - 3} ${cy}, ${cx} ${cy + 13.5} 
                     Q ${cx + 3} ${cy}, ${cx} ${cy - 13.5}`}
                  fill={pupilColor}
                />
              ) : pupilStyle === 'round' ? (
                <ellipse cx={cx} cy={cy} rx="5.5" ry="11" fill={pupilColor} />
              ) : pupilStyle === 'star' ? (
                <path
                  d={`M ${cx} ${cy - 9.5} 
                     L ${cx + 3} ${cy - 3} 
                     L ${cx + 9.5} ${cy} 
                     L ${cx + 3} ${cy + 3} 
                     L ${cx} ${cy + 9.5} 
                     L ${cx - 3} ${cy + 3} 
                     L ${cx - 9.5} ${cy} 
                     L ${cx - 3} ${cy - 3} Z`}
                  fill={pupilColor}
                />
              ) : (
                <path
                  d={`M ${cx} ${cy + 6}
                     C ${cx - 7.5} ${cy}, ${cx - 8.5} ${cy - 6.5}, ${cx} ${cy - 4.5}
                     C ${cx + 8.5} ${cy - 6.5}, ${cx} ${cy + 6} Z`}
                  fill={pupilColor}
                />
              )}
            </g>

            {/* Glowing bottom crescent highlight (glass reflections) */}
            <path
              d={`M ${cx + px + shakeOffsetX - 10} ${cy + py + shakeOffsetY + 2} 
                 Q ${cx + px + shakeOffsetX} ${cy + py + shakeOffsetY + 13}, ${cx + px + shakeOffsetX + 10} ${cy + py + shakeOffsetY + 2} 
                 Q ${cx + px + shakeOffsetX} ${cy + py + shakeOffsetY + 4}, ${cx + px + shakeOffsetX - 10} ${cy + py + shakeOffsetY + 2} Z`}
              fill="rgba(255, 255, 255, 0.42)"
            />

            {/* Specifications glints & specular sparkles - slightly smaller but still vibrant */}
            <circle
              cx={cx + px + shakeOffsetX - 4}
              cy={cy + py + shakeOffsetY - 5}
              r="3.8"
              fill="#ffffff"
              opacity="0.96"
            />
            <circle
              cx={cx + px + shakeOffsetX + 4}
              cy={cy + py + shakeOffsetY + 3}
              r="2.2"
              fill="#ffffff"
              opacity="0.88"
            />
          </g>

          {/* Bold upper feline eyelash wing sweep */}
          <path d={defaultShape.lashPath} fill="#1c1917" stroke="none" />

          {/* Lower eyelid line sweep */}
          <path d={defaultShape.lowerLidPath} stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      );
    } else {
      // Classic/retro style surprised eyes (simple dilated pupils)
      return (
        <g transform={transformEye}>
          <ellipse cx={cx} cy={cy} rx="20" ry="14" fill="#ffffff" stroke="rgba(28, 25, 22, 0.2)" strokeWidth="1.2" />
          <g clipPath={`url(#eye-clip-shocked-${isLeft ? 'l' : 'r'})`}>
            <defs>
              <clipPath id={`eye-clip-shocked-${isLeft ? 'l' : 'r'}`}>
                <ellipse cx={cx} cy={cy} rx="19.5" ry="13.5" />
              </clipPath>
            </defs>
            <circle cx={cx + px + shakeOffsetX} cy={cy + py + shakeOffsetY} r={7.5} fill={eyeColor} />
            <circle cx={cx + px + shakeOffsetX} cy={cy + py + shakeOffsetY} r={3.2} fill={pupilColor} />
            <circle cx={cx + px + shakeOffsetX - 2} cy={cy + py + shakeOffsetY - 2} r="2" fill="#ffffff" />
          </g>
          <path
            d={`M ${cx - 22} ${cy - 2} Q ${cx} ${cy - 16}, ${cx + 22} ${cy - 2}`}
            stroke="#1c1917"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }
  }

  if (activeEmotion === 'sleepy') {
    return (
      <g transform={transformEye}>
        {/* Comfortable half-lidded sleepy expression */}
        <ellipse cx={cx} cy={cy + 2} rx="21" ry="10" fill="#ffffff" />
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <ellipse cx={cx} cy={cy + 2} rx="21" ry="10" />
            </clipPath>
          </defs>
          <ellipse cx={cx + px} cy={cy + py + 3} rx="14" ry="14" fill={eyeColor} />
          <ellipse cx={cx + px} cy={cy + py + 3} rx="6" ry="6" fill="#1e1917" />
          <circle cx={cx + px - 3} cy={cy + py} r="2" fill="#ffffff" />
        </g>

        {/* Drooping top eyelid */}
        <path
          d={`M ${cx - 24} ${cy - 7} Q ${cx} ${cy - 13}, ${cx + 24} ${cy - 7}`}
          stroke="#1c1917"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Cheek sleepiness blush */}
        <ellipse cx={cx - 3} cy={cy + 13} rx="12" ry="4" fill="#fb7185" opacity="0.32" />
      </g>
    );
  }

  if (activeEmotion === 'shy') {
    return (
      <g transform={transformEye}>
        {/* Bashful shy looking away down/center */}
        <path d={defaultShape.eyeSlitPath} fill="#ffffff" />

        {/* Big bright cute anime iris gazing nervously inwards/down */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <path d={defaultShape.eyeSlitPath} />
            </clipPath>
          </defs>
          {/* Shift gaze strongly inwards/downward */}
          <ellipse cx={cx + px + (isLeft ? 5 : -5)} cy={cy + py + 4} rx="13.5" ry="15" fill={eyeColor} />
          <ellipse cx={cx + px + (isLeft ? 5 : -5)} cy={cy + py + 4} rx="7.5" ry="8.5" fill="#1c1917" />

          {/* Double sparkling reflection points */}
          <circle cx={cx + px + (isLeft ? 1 : -9)} cy={cy + py + 1} r="3" fill="#ffffff" />
          <circle cx={cx + px + (isLeft ? 7 : -3)} cy={cy + py + 8} r="1.5" fill="#ffffff" />
        </g>

        {/* Cute shy horizontal hatching blush right next to / over the cheeks */}
        <path
          d={`M ${cx - 16} ${cy + 14} L ${cx - 12} ${cy + 8} M ${cx - 10} ${cy + 14} L ${cx - 6} ${cy + 8} M ${cx - 4} ${cy + 14} L ${cx} ${cy + 8} M ${cx + 2} ${cy + 14} L ${cx + 6} ${cy + 8}`}
          stroke="#fb7185"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <ellipse cx={cx} cy={cy + 12} rx="15" ry="5.5" fill="#fb7185" opacity="0.25" />

        {/* Upper eyelid crease */}
        <path
          d={defaultShape.creasePath}
          stroke="rgba(30, 25, 22, 0.35)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Long elegant lash sweep */}
        <path d={defaultShape.lashPath} fill="#1c1917" stroke="none" />
        {/* Lower eyelid sweep */}
        <path d={defaultShape.lowerLidPath} stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  // Handle high-expressiveness Custom Emotions first
  if (activeEmotion === 'squint') {
    return (
      <g transform={transformEye}>
        {/* Soft pink blush background below the squint eye */}
        <ellipse cx={cx} cy={cy + 8} rx="18" ry="8" fill="#f43f5e" opacity="0.18" />
        {/* Glow behind the squeeze line */}
        <path
          d={`M ${cx - 16} ${cy - 12} L ${cx + 14} ${cy} L ${cx - 16} ${cy + 12}`}
          stroke="rgba(244, 63, 94, 0.4)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Main squeeze line > */}
        <path
          d={`M ${cx - 16} ${cy - 12} L ${cx + 14} ${cy} L ${cx - 16} ${cy + 12}`}
          stroke="#1c1917"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Cute highlight spark line */}
        <path
          d={`M ${cx - 11} ${cy - 8} L ${cx + 8} ${cy} L ${cx - 11} ${cy + 8}`}
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Mini action lines */}
        <path
          d={`M ${cx - 24} ${cy - 18} L ${cx - 20} ${cy - 14}`}
          stroke="#1c1917"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - 24} ${cy + 18} L ${cx - 20} ${cy + 14}`}
          stroke="#1c1917"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (activeEmotion === 'love') {
    return (
      <g transform={transformEye}>
        {/* Double eyelid crease line */}
        <path
          d={defaultShape.creasePath}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyeball White */}
        <path d={defaultShape.eyeSlitPath} fill="#ffffff" />

        {/* Ambient occlusion shadow */}
        <path d={defaultShape.eyeSlitPath} fill="rgba(15, 23, 42, 0.08)" />

        {/* Masked Iris */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <linearGradient id={`love-iris-grad-${isLeft ? 'l' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9d174d" /> {/* Deep dark magenta */}
              <stop offset="60%" stopColor="#f43f5e" /> {/* Sweet rose pink */}
              <stop offset="100%" stopColor="#fda4af" /> {/* Light bright pink */}
            </linearGradient>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <path d={defaultShape.eyeSlitPath} />
            </clipPath>
          </defs>

          {/* Saturated hot pink/rose iris backing with a rich depth gradient */}
          <ellipse cx={cx + px} cy={cy + py} rx="17.5" ry="20" fill={`url(#love-iris-grad-${isLeft ? 'l' : 'r'})`} />

          {/* Heart shaped pupil - Symmetrical vector fix */}
          <path
            d={`M ${cx + px} ${cy + py + 8}
               C ${cx + px - 11} ${cy + py}, ${cx + px - 12} ${cy + py - 9.5}, ${cx + px} ${cy + py - 6.5}
               C ${cx + px + 12} ${cy + py - 9.5}, ${cx + px + 11} ${cy + py}, ${cx + px} ${cy + py + 8} Z`}
            fill="#ffffff"
            opacity="0.95"
          />

          <path
            d={`M ${cx + px} ${cy + py + 5}
               C ${cx + px - 7} ${cy + py}, ${cx + px - 8} ${cy + py - 6.5}, ${cx + px} ${cy + py - 4.5}
               C ${cx + px + 8} ${cy + py - 6.5}, ${cx + px + 7} ${cy + py}, ${cx + px} ${cy + py + 5} Z`}
            fill="#ffe4e6"
          />

          {/* Sparkly overlay glints */}
          <circle cx={cx + px - 8} cy={cy + py - 8} r="3" fill="#ffffff" />
          <circle cx={cx + px + 8} cy={cy + py + 8} r="2.5" fill="#ffffff" />
        </g>

        {/* Eyelash sweep */}
        <path d={defaultShape.lashPath} fill="#1c1917" stroke="none" />

        {/* Lower eyelid sweep */}
        <path d={defaultShape.lowerLidPath} stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (activeEmotion === 'starry') {
    return (
      <g transform={transformEye}>
        {/* Double eyelid crease line */}
        <path
          d={defaultShape.creasePath}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyeball White */}
        <path d={defaultShape.eyeSlitPath} fill="#ffffff" />

        {/* Ambient occlusion shadow */}
        <path d={defaultShape.eyeSlitPath} fill="rgba(15, 23, 42, 0.08)" />

        {/* Masked Iris */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <path d={defaultShape.eyeSlitPath} />
            </clipPath>
          </defs>

          {/* Navy blue background iris for dramatic yellow contrast */}
          <ellipse cx={cx + px} cy={cy + py} rx="17" ry="19.5" fill="#1e1b4b" />

          {/* Inner space galaxy nebula glow */}
          <circle cx={cx + px} cy={cy + py} r="14" fill="#4f46e5" opacity="0.6" />
          <circle cx={cx + px} cy={cy + py + 5} r="10" fill="#a855f7" opacity="0.5" />

          {/* Gorgeous 4-pointed glowing golden star! */}
          <path
            d={`M ${cx + px} ${cy + py - 12} 
               Q ${cx + px} ${cy + py}, ${cx + px + 12} ${cy + py}
               Q ${cx + px} ${cy + py}, ${cx + px} ${cy + py + 12}
               Q ${cx + px} ${cy + py}, ${cx + px - 12} ${cy + py}
               Q ${cx + px} ${cy + py}, ${cx + px} ${cy + py - 12}`}
            fill="#fbbf24"
          />

          {/* Diamond center highlight */}
          <path
            d={`M ${cx + px} ${cy + py - 6} 
               L ${cx + px + 6} ${cy + py}
               L ${cx + px} ${cy + py + 6}
               L ${cx + px - 6} ${cy + py} Z`}
            fill="#ffffff"
          />

          {/* Specks of dust/magical stars */}
          <circle cx={cx + px - 7} cy={cy + py - 7} r="1.5" fill="#ffffff" />
          <circle cx={cx + px + 7} cy={cy + py - 7} r="1" fill="#ffffff" />
          <circle cx={cx + px - 7} cy={cy + py + 7} r="1" fill="#ffffff" />
          <circle cx={cx + px + 7} cy={cy + py + 7} r="2" fill="#ffffff" />
        </g>

        {/* Eyelash sweep */}
        <path d={defaultShape.lashPath} fill="#1c1917" stroke="none" />

        {/* Lower eyelid sweep */}
        <path d={defaultShape.lowerLidPath} stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (activeEmotion === 'depressed') {
    return (
      <g transform={transformEye}>
        {/* Double eyelid crease line */}
        <path
          d={defaultShape.creasePath}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyeball White */}
        <path d={defaultShape.eyeSlitPath} fill="#dbeafe" />

        {/* Ambient occlusion shadow */}
        <path d={defaultShape.eyeSlitPath} fill="rgba(15, 23, 42, 0.2)" />

        {/* Masked Iris */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <path d={defaultShape.eyeSlitPath} />
            </clipPath>
          </defs>

          {/* Dull dark greyish blue iris */}
          <ellipse cx={cx + px} cy={cy + py} rx="16.5" ry="19.5" fill="#312e81" />

          {/* Dark lens shadow covering almost whole eye */}
          <rect x={cx + px - 18} y={cy + py - 21} width="36" height="42" fill="rgba(15, 21, 40, 0.55)" />

          {/* Spiral depressed pattern */}
          <path
            d={`M ${cx + px} ${cy + py} 
               A 10 10 0 1 0 ${cx + px + 10} ${cy + py}
               A 8 8 0 1 0 ${cx + px - 6} ${cy + py - 6}
               A 6 6 0 1 0 ${cx + px + 2} ${cy + py + 4}
               A 4 4 0 1 0 ${cx + px - 2} ${cy + py - 2}`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Almost no sparkle / dead stare */}
          <circle cx={cx + px - 5} cy={cy + py - 6} r="1.5" fill="#ffffff" opacity="0.2" />
        </g>

        {/* Eyelash sweep */}
        <path d={defaultShape.lashPath} fill="#1c1917" stroke="none" />

        {/* Lower eyelid sweep */}
        <path d={defaultShape.lowerLidPath} stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Depressed gloom drop shadow lines directly over the eye */}
        <line x1={cx - 15} y1={cy - 20} x2={cx - 12} y2={cy + 15} stroke="rgba(49, 46, 129, 0.45)" strokeWidth="1.5" />
        <line x1={cx - 5} y1={cy - 22} x2={cx - 2} y2={cy + 15} stroke="rgba(49, 46, 129, 0.45)" strokeWidth="1.5" />
        <line x1={cx + 5} y1={cy - 22} x2={cx + 8} y2={cy + 15} stroke="rgba(49, 46, 129, 0.45)" strokeWidth="1.5" />
        <line x1={cx + 15} y1={cy - 20} x2={cx + 18} y2={cy + 15} stroke="rgba(49, 46, 129, 0.45)" strokeWidth="1.5" />
      </g>
    );
  }

  // If blinking/closed, draw an elegant sleeping/smiling curved eyelash path instead of iris!
  if (blink < 0.25) {
    const lashD = isAnime
      ? `M ${cx - 22} ${cy + 1} 
         C ${cx - 10} ${cy + 11}, ${cx + 10} ${cy + 11}, ${cx + 22} ${cy + 1}
         L ${cx + 21} ${cy + 2}
         C ${cx + 9} ${cy + 13}, ${cx - 9} ${cy + 13}, ${cx - 21} ${cy + 2} Z`
      : `M ${cx - 18} ${cy} Q ${cx} ${cy + 9}, ${cx + 18} ${cy}`;

    return (
      <g transform={transformEye}>
        {/* Shadow under closed eye */}
        <path
          d={`M ${cx - 20} ${cy + 2} Q ${cx} ${cy + 12}, ${cx + 20} ${cy + 2}`}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Soft fleshy skin crease above closed eye */}
        <path
          d={`M ${cx - 15} ${cy - 14} Q ${cx} ${cy - 18}, ${cx + 15} ${cy - 14}`}
          stroke="rgba(28, 25, 22, 0.18)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Eyelash stroke */}
        <path
          d={lashD}
          fill={isAnime ? '#1c1917' : 'none'}
          stroke="#1c1917"
          strokeWidth={isAnime ? '1.5' : '3.5'}
          strokeLinecap="round"
        />
        {/* Styled cute feline outer lashes */}
        {isAnime && (
          <path
            d={`M ${cx - 18} ${cy + 4} L ${cx - 28} ${cy + 10} L ${cx - 21} ${cy + 7} Z`}
            fill="#1c1917"
            stroke="#1c1917"
            strokeWidth="0.8"
          />
        )}
      </g>
    );
  }

  // Active Open Eyes
  if (isAnime) {
    const getEyeShapeData = () => {
      switch (eyeShape) {
        case 'almond':
          return {
            eyeSlitPath: `M ${cx + 25} ${cy + 2} C ${cx + 15} ${cy - 18}, ${cx - 15} ${cy - 18}, ${cx - 27} ${cy + 1} C ${cx - 15} ${cy + 12}, ${cx + 15} ${cy + 12}, ${cx + 25} ${cy + 2} Z`,
            lashPath: `M ${cx + 25} ${cy + 2} C ${cx + 15} ${cy - 18}, ${cx - 15} ${cy - 18}, ${cx - 27} ${cy + 1} L ${cx - 41} ${cy - 4} C ${cx - 34} ${cy - 12}, ${cx - 24} ${cy - 22}, ${cx - 10} ${cy - 22} C ${cx + 4} ${cy - 22}, ${cx + 18} ${cy - 12}, ${cx + 25} ${cy + 2} Z`,
            lowerLidPath: `M ${cx - 20} ${cy + 10} C ${cx - 10} ${cy + 12}, ${cx + 10} ${cy + 12}, ${cx + 18} ${cy + 8} M ${cx - 15} ${cy + 11} L ${cx - 18} ${cy + 15}`,
            creasePath: `M ${cx - 18} ${cy - 22} C ${cx - 5} ${cy - 26}, ${cx + 12} ${cy - 26}, ${cx + 21} ${cy - 20}`,
          };
        case 'droopy':
          return {
            eyeSlitPath: `M ${cx + 22} ${cy - 2} C ${cx + 12} ${cy - 20}, ${cx - 12} ${cy - 18}, ${cx - 24} ${cy + 4} C ${cx - 12} ${cy + 18}, ${cx + 12} ${cy + 14}, ${cx + 22} ${cy - 2} Z`,
            lashPath: `M ${cx + 22} ${cy - 2} C ${cx + 12} ${cy - 20}, ${cx - 12} ${cy - 18}, ${cx - 24} ${cy + 4} L ${cx - 30} ${cy + 11} L ${cx - 28} ${cy + 5} L ${cx - 32} ${cy + 1} C ${cx - 27} ${cy - 11}, ${cx - 20} ${cy - 24}, ${cx - 8} ${cy - 24} C ${cx + 4} ${cy - 24}, ${cx + 16} ${cy - 15}, ${cx + 22} ${cy - 2} Z`,
            lowerLidPath: `M ${cx - 18} ${cy + 14} C ${cx - 8} ${cy + 17}, ${cx + 8} ${cy + 13}, ${cx + 14} ${cy + 7} M ${cx - 14} ${cy + 15} L ${cx - 17} ${cy + 20}`,
            creasePath: `M ${cx - 16} ${cy - 23} C ${cx - 4} ${cy - 27}, ${cx + 11} ${cy - 25}, ${cx + 17} ${cy - 18}`,
          };
        case 'sharp':
          return {
            eyeSlitPath: `M ${cx + 22} ${cy + 2} C ${cx + 10} ${cy - 17}, ${cx - 12} ${cy - 18}, ${cx - 26} ${cy - 1} C ${cx - 12} ${cy + 12}, ${cx + 12} ${cy + 13}, ${cx + 22} ${cy + 2} Z`,
            lashPath: `M ${cx + 22} ${cy + 2} C ${cx + 10} ${cy - 17}, ${cx - 12} ${cy - 18}, ${cx - 26} ${cy - 1} L ${cx - 36} ${cy - 7} C ${cx - 29} ${cy - 11}, ${cx - 20} ${cy - 20.5}, ${cx - 8} ${cy - 20.5} C ${cx + 4} ${cy - 20.5}, ${cx + 16} ${cy - 12}, ${cx + 22} ${cy + 2} Z`,
            lowerLidPath: `M ${cx - 18} ${cy + 10} C ${cx - 8} ${cy + 13}, ${cx + 8} ${cy + 13}, ${cx + 14} ${cy + 8} M ${cx - 14} ${cy + 11} L ${cx - 17} ${cy + 15}`,
            creasePath: `M ${cx - 16} ${cy - 22} C ${cx - 4} ${cy - 25}, ${cx + 10} ${cy - 24}, ${cx + 18} ${cy - 18}`,
          };
        case 'cat-eye':
          return {
            eyeSlitPath: `M ${cx + 22} ${cy + 4} C ${cx + 13} ${cy - 23}, ${cx - 13} ${cy - 23}, ${cx - 25} ${cy - 2} C ${cx - 13} ${cy + 15}, ${cx + 13} ${cy + 15}, ${cx + 22} ${cy + 4} Z`,
            lashPath: `M ${cx + 22} ${cy + 4} C ${cx + 13} ${cy - 23}, ${cx - 13} ${cy - 23}, ${cx - 25} ${cy - 2} L ${cx - 36} ${cy - 15} L ${cx - 31} ${cy - 8} L ${cx - 35} ${cy - 4} C ${cx - 29} ${cy - 14}, ${cx - 20} ${cy - 27}, ${cx - 8} ${cy - 27} C ${cx + 4} ${cy - 27}, ${cx + 16} ${cy - 15}, ${cx + 22} ${cy + 4} Z`,
            lowerLidPath: `M ${cx - 18} ${cy + 11} C ${cx - 8} ${cy + 14}, ${cx + 8} ${cy + 14}, ${cx + 14} ${cy + 9} M ${cx - 14} ${cy + 12} L ${cx - 17} ${cy + 17}`,
            creasePath: `M ${cx - 15} ${cy - 27} C ${cx - 3} ${cy - 31}, ${cx + 11} ${cy - 31}, ${cx + 17} ${cy - 25}`,
          };
        case 'default':
        default:
          return defaultShape;
      }
    };
    const shapeData = getEyeShapeData();

    return (
      <g transform={transformEye}>
        <defs>
          {/* Dynamic multi-stage gradient that automatically adds premium light-refraction depth to any eye color */}
          <linearGradient id={`anime-iris-overlay-${isLeft ? 'l' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#0f172a" stopOpacity="0.05" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
          </linearGradient>

          <linearGradient id={`anime-sclera-shadow-${isLeft ? 'l' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.4)" />
            <stop offset="35%" stopColor="rgba(15, 23, 42, 0.0)" />
          </linearGradient>
        </defs>

        {/* Double eyelid crease line */}
        <path
          d={shapeData.creasePath}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyelash drop shadow on sclera - calculated via the exact eye slit curve offset */}
        <path
          d={shapeData.eyeSlitPath}
          fill="none"
          stroke="rgba(28,21,18,0.3)"
          strokeWidth="6"
          strokeLinecap="round"
          style={{ transform: 'translate(0px, 3px)' }}
          clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'})`}
        />

        {/* Sclera / Eyeball White: Perfectly matching the eye slit! */}
        <path d={shapeData.eyeSlitPath} fill="url(#eye-sclera)" />

        {/* Top ambient occlusion shadow perfectly conforming to the eye slit */}
        <path d={shapeData.eyeSlitPath} fill={`url(#anime-sclera-shadow-${isLeft ? 'l' : 'r'})`} />

        {/* Masked Iris rendering perfectly bounded by the eye slit path */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}`}>
              <path d={shapeData.eyeSlitPath} />
            </clipPath>
          </defs>

          {/* Saturated Kyoto / DxD style base oval iris */}
          <ellipse cx={cx + px} cy={cy + py} rx="16.5" ry="19.5" fill={eyeColor} />

          {/* Saturated 3D light-transmitting overlay gradient */}
          <ellipse
            cx={cx + px}
            cy={cy + py}
            rx="16.5"
            ry="19.5"
            fill={`url(#anime-iris-overlay-${isLeft ? 'l' : 'r'})`}
          />

          {/* Dark lens shadow projection at the top half */}
          <path
            d={`M ${cx + px - 16.5} ${cy + py} A 16.5 19.5 0 0 1 ${cx + px + 16.5} ${cy + py} L ${cx + px + 16.5} ${cy + py - 21} L ${cx + px - 16.5} ${cy + py - 21} Z`}
            fill="rgba(15, 23, 42, 0.22)"
          />

          {/* Core dark center ring */}
          <ellipse cx={cx + px} cy={cy + py} rx="12" ry="14.5" fill="rgba(0,0,0,0.15)" />

          {/* Specialized beautiful pupil configurations (slit, round, heart, star) */}
          {pupilStyle === 'slit' ? (
            <path
              d={`M ${cx + px} ${cy + py - 13.5} 
                 Q ${cx + px - 3} ${cy + py}, ${cx + px} ${cy + py + 13.5} 
                 Q ${cx + px + 3} ${cy + py}, ${cx + px} ${cy + py - 13.5}`}
              fill={pupilColor}
            />
          ) : pupilStyle === 'round' ? (
            <ellipse cx={cx + px} cy={cy + py} rx="5.5" ry="11" fill={pupilColor} />
          ) : pupilStyle === 'star' ? (
            <path
              d={`M ${cx + px} ${cy + py - 9.5} 
                 L ${cx + px + 3} ${cy + py - 3} 
                 L ${cx + px + 9.5} ${cy + py} 
                 L ${cx + px + 3} ${cy + py + 3} 
                 L ${cx + px} ${cy + py + 9.5} 
                 L ${cx + px - 3} ${cy + py + 3} 
                 L ${cx + px - 9.5} ${cy + py} 
                 L ${cx + px - 3} ${cy + py - 3} Z`}
              fill={pupilColor}
            />
          ) : pupilStyle === 'heart' ? (
            // Heart pupil: adorable heart curves
            <path
              d={`M ${cx + px} ${cy + py + 6}
                 C ${cx + px - 7.5} ${cy + py}, ${cx + px - 8.5} ${cy + py - 6.5}, ${cx + px} ${cy + py - 4.5}
                 C ${cx + px + 8.5} ${cy + py - 6.5}, ${cx + px} ${cy + py + 6} Z`}
              fill={pupilColor}
            />
          ) : pupilStyle === 'diamond' ? (
            // Diamond pupil: crystalline rhombus with inner glow
            <>
              <path
                d={`M ${cx + px} ${cy + py - 11}
                   L ${cx + px + 7} ${cy + py}
                   L ${cx + px} ${cy + py + 11}
                   L ${cx + px - 7} ${cy + py} Z`}
                fill={pupilColor}
              />
              <path
                d={`M ${cx + px} ${cy + py - 6}
                   L ${cx + px + 3.5} ${cy + py}
                   L ${cx + px} ${cy + py + 6}
                   L ${cx + px - 3.5} ${cy + py} Z`}
                fill="#ffffff"
                opacity="0.3"
              />
            </>
          ) : pupilStyle === 'cross' ? (
            // Cross pupil: gothic/demonic cross shape
            <path
              d={`M ${cx + px - 2.5} ${cy + py - 11}
                 H ${cx + px + 2.5} V ${cy + py - 2.5}
                 H ${cx + px + 8} V ${cy + py + 2.5}
                 H ${cx + px + 2.5} V ${cy + py + 11}
                 H ${cx + px - 2.5} V ${cy + py + 2.5}
                 H ${cx + px - 8} V ${cy + py - 2.5}
                 H ${cx + px - 2.5} Z`}
              fill={pupilColor}
            />
          ) : pupilStyle === 'flower' ? (
            // Flower pupil: sakura/lotus petal arrangement
            <g>
              {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse
                  key={angle}
                  cx={cx + px}
                  cy={cy + py - 6}
                  rx="3"
                  ry="6"
                  fill={pupilColor}
                  transform={`rotate(${angle}, ${cx + px}, ${cy + py})`}
                />
              ))}
              <circle cx={cx + px} cy={cy + py} r="3" fill={pupilColor} />
            </g>
          ) : null}

          {/* Glowing bottom crescent highlight (glass reflections) */}
          <path
            d={`M ${cx + px - 13} ${cy + py + 3} 
               Q ${cx + px} ${cy + py + 17}, ${cx + px + 13} ${cy + py + 3} 
               Q ${cx + px} ${cy + py + 6}, ${cx + px - 13} ${cy + py + 3} Z`}
            fill="rgba(255, 255, 255, 0.42)"
          />

          {/* Saturated nested core glow bubble */}
          <ellipse cx={cx + px} cy={cy + py + 11} rx="8" ry="3.2" fill="rgba(255,255,255,0.22)" />

          {/* Multiple glassy glints & specular sparkles (vital for high-quality anime feel) */}
          <circle cx={cx + px - 5.5} cy={cy + py - 6.5} r="5.2" fill="#ffffff" opacity="0.96" />
          <circle cx={cx + px + 6.5} cy={cy + py + 5} r="3.2" fill="#ffffff" opacity="0.88" />
          <circle cx={cx + px - 7} cy={cy + py + 6.5} r="1.6" fill="#ffffff" opacity="0.65" />
        </g>

        {/* Bold upper feline eyelash wing sweep (Now a filled compound path!) */}
        <path d={shapeData.lashPath} fill="#1c1917" stroke="none" />

        {/* Lower eyelid line sweep - perfectly frames the bottom of the sclera */}
        <path d={shapeData.lowerLidPath} stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  // Classic or Retro Eye mode
  const rx = 18;
  const ry = 12;

  return (
    <g transform={transformEye}>
      {/* Eyeball white with clean, soft stroke */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" stroke="rgba(28, 25, 22, 0.2)" strokeWidth="1.2" />

      {/* Masked Iris & Pupil */}
      <g clipPath={`url(#eye-clip-${isLeft ? 'l' : 'r'})`}>
        <defs>
          <clipPath id={`eye-clip-${isLeft ? 'l' : 'r'}`}>
            <ellipse cx={cx} cy={cy} rx={rx - 0.5} ry={ry - 0.5} />
          </clipPath>
        </defs>

        {/* Iris */}
        <circle cx={cx + px} cy={cy + py} r={11} fill={eyeColor} />

        {/* Inner shadow/ring */}
        <circle cx={cx + px} cy={cy + py} r={8} fill="rgba(0,0,0,0.18)" />

        {/* Pupil according to selection */}
        {pupilStyle === 'slit' ? (
          <path
            d={`M ${cx + px} ${cy + py - 7} Q ${cx + px - 2} ${cy + py}, ${cx + px} ${cy + py + 7} Q ${cx + px + 2} ${cy + py}, ${cx + px} ${cy + py - 7}`}
            fill={pupilColor}
          />
        ) : pupilStyle === 'star' ? (
          <path
            d={`M ${cx + px} ${cy + py - 5} L ${cx + px + 1.5} ${cy + py - 1.5} L ${cx + px + 5} ${cy + py} L ${cx + px + 1.5} ${cy + py + 1.5} L ${cx + px} ${cy + py + 5} L ${cx + px - 1.5} ${cy + py + 1.5} L ${cx + px - 5} ${cy + py} L ${cx + px - 1.5} ${cy + py - 1.5} Z`}
            fill={pupilColor}
          />
        ) : pupilStyle === 'heart' ? (
          <path
            d={`M ${cx + px} ${cy + py + 3.5} C ${cx + px - 4} ${cy + py}, ${cx + px - 5} ${cy + py - 3.5}, ${cx + px} ${cy + py - 2} C ${cx + px + 5} ${cy + py - 3.5}, ${cx + px + 4} ${cy + py}, ${cx + px} ${cy + py + 3.5} Z`}
            fill={pupilColor}
          />
        ) : pupilStyle === 'diamond' ? (
          <path
            d={`M ${cx + px} ${cy + py - 5}
               L ${cx + px + 4} ${cy + py}
               L ${cx + px} ${cy + py + 5}
               L ${cx + px - 4} ${cy + py} Z`}
            fill={pupilColor}
          />
        ) : pupilStyle === 'cross' ? (
          <path
            d={`M ${cx + px - 1.5} ${cy + py - 5}
               H ${cx + px + 1.5} V ${cy + py - 1.5}
               H ${cx + px + 5} V ${cy + py + 1.5}
               H ${cx + px + 1.5} V ${cy + py + 5}
               H ${cx + px - 1.5} V ${cy + py + 1.5}
               H ${cx + px - 5} V ${cy + py - 1.5}
               H ${cx + px - 1.5} Z`}
            fill={pupilColor}
          />
        ) : pupilStyle === 'flower' ? (
          <g>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx={cx + px}
                cy={cy + py - 3}
                rx="1.8"
                ry="3.5"
                fill={pupilColor}
                transform={`rotate(${angle}, ${cx + px}, ${cy + py})`}
              />
            ))}
            <circle cx={cx + px} cy={cy + py} r="1.8" fill={pupilColor} />
          </g>
        ) : pupilStyle === 'none' ? null : (
          <circle cx={cx + px} cy={cy + py} r={4.5} fill={pupilColor} />
        )}

        {/* Double bright specular dots */}
        <circle cx={cx + px - 3.5} cy={cy + py - 3.5} r="3" fill="#ffffff" opacity="0.95" />
        <circle cx={cx + px + 4} cy={cy + py + 3} r="1.5" fill="#ffffff" opacity="0.8" />
      </g>

      {/* Styled top eyelash brow border */}
      <path
        d={`M ${cx - rx - 2} ${cy - 2} Q ${cx} ${cy - ry - 4}, ${cx + rx + 2} ${cy - 2}`}
        stroke="#1c1917"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
};
