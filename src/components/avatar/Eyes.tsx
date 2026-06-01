import React from 'react';

export const EyebrowSVG: React.FC<{
  style: 'normal' | 'thick' | 'thin' | 'sad';
  color: string;
  isLeft: boolean;
  eyebrowY: number;
  artStyle?: 'classic' | 'anime' | 'retro';
}> = ({ style, color, isLeft, eyebrowY, artStyle = 'classic' }) => {
  const transform = isLeft
    ? `translate(0, ${eyebrowY})`
    : `scale(-1, 1) translate(-400, ${eyebrowY})`;

  const isAnime = artStyle === 'anime';
  const strokeWidth = isAnime 
    ? (style === 'thick' ? 3.5 : style === 'thin' ? 1.2 : 1.8)
    : (style === 'thick' ? 6 : style === 'thin' ? 2 : 4);
    
  const opacity = style === 'sad' ? 0.9 : 1.0;

  let d = isAnime 
    ? "M138 144 C148 139, 163 139, 174 144" // sleeker anime arch
    : "M140 145 C150 140, 165 140, 175 147"; // normal
    
  if (style === 'sad') {
    d = isAnime
      ? "M136 150 C144 146, 162 142, 174 143"
      : "M135 152 C145 148, 165 142, 175 142"; // curve goes upwards towards center
  } else if (style === 'thick' || style === 'thin') {
    d = isAnime
      ? "M137 143 Q155 137, 173 143"
      : "M138 144 Q155 138, 173 145";
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
  pupilStyle: 'round' | 'star' | 'heart' | 'slit';
  pupilColor: string;
  isLeft: boolean;
  pupilX: number;
  pupilY: number;
  blink: number; // 0 (fully closed) to 1 (fully open)
  artStyle?: 'classic' | 'anime' | 'retro';
  activeEmotion?: 'none' | 'happy' | 'angry' | 'cry' | 'shocked' | 'smug' | 'love' | 'starry' | 'squint' | 'depressed' | 'dizzy' | 'cool' | 'scared' | 'sleepy' | 'shy';
}> = ({
  eyeColor,
  pupilStyle,
  pupilColor,
  isLeft,
  pupilX,
  pupilY,
  blink,
  artStyle = 'classic',
  activeEmotion = 'none'
}) => {
  // Center coordinates: Symmetrical local coordinates where both eyes are defined at 156.
  // The right eye utilizes scale(-1, 1) translate(-400, 0) to align itself perfectly at 244.
  const cx = 156;
  const cy = 175;

  // Horizontal mirror scaling for right eye (Standard SVG syntax, no 'px' unit)
  const transformEye = isLeft
    ? 'translate(0, 0)'
    : 'scale(-1, 1) translate(-400, 0)';

  // Pupil offset symmetry: since the right eye is horizontally scale-flipped, we invert pupilsX so they gaze in unison
  const effectivePupilX = isLeft ? pupilX : -pupilX;
  const px = effectivePupilX * (artStyle === 'anime' ? 5.2 : 3.5);
  const py = pupilY * (artStyle === 'anime' ? 3.8 : 2.5);

  const isAnime = artStyle === 'anime';

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
        <path d={`M ${cx - 25} ${cy - 18} L ${cx - 19} ${cy - 12} M ${cx - 19} ${cy - 18} L ${cx - 25} ${cy - 12}`} stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <path d={`M ${cx + 20} ${cy + 15} L ${cx + 26} ${cy + 21} M ${cx + 26} ${cy + 15} L ${cx + 20} ${cy + 21}`} stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
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

  if (activeEmotion === 'scared') {
    // Wide panicked eyes, tiny blue dilated/shaking pupils
    const shakeOffsetX = Math.sin(Date.now() * 0.15) * 1.5;
    const shakeOffsetY = Math.cos(Date.now() * 0.15) * 1.5;
    return (
      <g transform={transformEye}>
        {/* Shivering blue background hue */}
        <ellipse cx={cx} cy={cy} rx="23" ry="19.5" fill="#f0f9ff" />
        <ellipse cx={cx} cy={cy} rx="23" ry="19.5" stroke="#312e81" strokeWidth="3" fill="none" />
        
        {/* Multi-layered cold sweating shadow */}
        <path
          d={`M ${cx - 23} ${cy} A 23 19.5 0 0 1 ${cx + 23} ${cy} Z`}
          fill="rgba(56, 189, 248, 0.25)"
        />

        {/* Dilated shivering tiny pupil */}
        <circle cx={cx + px + shakeOffsetX} cy={cy + py + shakeOffsetY} r="4.5" fill="#1e1b4b" />
        <circle cx={cx + px + shakeOffsetX} cy={cy + py + shakeOffsetY} r="2.5" fill="#0284c7" />
        <circle cx={cx + px - 1.2 + shakeOffsetX} cy={cy + py - 1.2 + shakeOffsetY} r="0.8" fill="#ffffff" />
        
        {/* Panicked anime hatch/shadow lines directly on eye */}
        <line x1={cx - 12} y1={cy - 18} x2={cx - 12} y2={cy - 6} stroke="#38bdf8" strokeWidth="1.2" />
        <line x1={cx - 5} y1={cy - 19} x2={cx - 5} y2={cy - 5} stroke="#38bdf8" strokeWidth="1.2" />
        <line x1={cx + 5} y1={cy - 19} x2={cx + 5} y2={cy - 5} stroke="#38bdf8" strokeWidth="1.2" />
        <line x1={cx + 12} y1={cy - 18} x2={cx + 12} y2={cy - 6} stroke="#38bdf8" strokeWidth="1.2" />
      </g>
    );
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
        <ellipse cx={cx} cy={cy} rx="21.5" ry="17" fill="#ffffff" />
        
        {/* Big bright cute anime iris gazing nervously inwards/down */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <ellipse cx={cx} cy={cy} rx="21.5" ry="17" />
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
          d={`M ${cx - 18} ${cy - 17} Q ${cx} ${cy - 21}, ${cx + 18} ${cy - 17}`}
          stroke="rgba(30, 25, 22, 0.35)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Long elegant lash sweep */}
        <path
          d={`M ${cx - 23} ${cy - 4} C ${cx - 14} ${cy - 20}, ${cx + 12} ${cy - 20}, ${cx + 23} ${cy - 4}`}
          stroke="#1c1917"
          strokeWidth="3.2"
          fill="none"
          strokeLinecap="round"
        />
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
          d={`M ${cx - 20} ${cy - 19} Q ${cx - 2} ${cy - 23}, ${cx + 18} ${cy - 19}`}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyeball White */}
        <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} fill="#ffffff" />
        
        {/* Ambient occlusion shadow */}
        <path
          d={`M ${cx - 22.5} ${cy - 4} A 22.5 16.2 0 0 0 ${cx + 22.5} ${cy - 4} Z`}
          fill="rgba(15, 23, 42, 0.08)"
        />

        {/* Masked Iris */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} />
            </clipPath>
          </defs>

          {/* Saturated hot pink/rose iris backing */}
          <ellipse cx={cx + px} cy={cy + py} rx="17.5" ry="20" fill="#f43f5e" />
          
          {/* Heart shaped pupil */}
          <path
            d={`M ${cx + px} ${cy + py + 8}
               C ${cx + px - 11} ${cy + py}, ${cx + px - 12} ${cy + py - 9.5}, ${cx + px} ${cy + py - 6.5}
               C ${cx + px + 12} ${cy + py - 9.5}, ${cx + px} ${cy + py + 8} Z`}
            fill="#ffffff"
            opacity="0.95"
          />

          <path
            d={`M ${cx + px} ${cy + py + 5}
               C ${cx + px - 7} ${cy + py}, ${cx + px - 8} ${cy + py - 6.5}, ${cx + px} ${cy + py - 4.5}
               C ${cx + px + 7} ${cy + py - 6.5}, ${cx + px} ${cy + py + 5} Z`}
            fill="#ffe4e6"
          />

          {/* Sparkly overlay glints */}
          <circle cx={cx + px - 8} cy={cy + py - 8} r="3" fill="#ffffff" />
          <circle cx={cx + px + 8} cy={cy + py + 8} r="2.5" fill="#ffffff" />
        </g>

        {/* Eyelash sweep */}
        <path
          d={`M ${cx + 23} ${cy - 5} 
             C ${cx + 10} ${cy - 22}, ${cx - 19} ${cy - 22}, ${cx - 26} ${cy - 7}
             Q ${cx - 33} ${cy - 13}, ${cx - 33} ${cy - 6}
             Q ${cx - 29} ${cy}, ${cx - 24} ${cy - 8}
             C ${cx - 16} ${cy - 18}, ${cx + 10} ${cy - 18}, ${cx + 21} ${cy - 3} Z`}
          fill="#1c1917"
          stroke="#1c1917"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Lower eyelid sweep */}
        <path
          d={`M ${cx - 16} ${cy + 11.5} Q ${cx} ${cy + 13.5}, ${cx + 16} ${cy + 11.5}`}
          stroke="#1c1917"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (activeEmotion === 'starry') {
    return (
      <g transform={transformEye}>
        {/* Double eyelid crease line */}
        <path
          d={`M ${cx - 20} ${cy - 19} Q ${cx - 2} ${cy - 23}, ${cx + 18} ${cy - 19}`}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyeball White */}
        <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} fill="#ffffff" />
        
        {/* Ambient occlusion shadow */}
        <path
          d={`M ${cx - 22.5} ${cy - 4} A 22.5 16.2 0 0 0 ${cx + 22.5} ${cy - 4} Z`}
          fill="rgba(15, 23, 42, 0.08)"
        />

        {/* Masked Iris */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} />
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
        <path
          d={`M ${cx + 23} ${cy - 5} 
             C ${cx + 10} ${cy - 22}, ${cx - 19} ${cy - 22}, ${cx - 26} ${cy - 7}
             Q ${cx - 33} ${cy - 13}, ${cx - 33} ${cy - 6}
             Q ${cx - 29} ${cy}, ${cx - 24} ${cy - 8}
             C ${cx - 16} ${cy - 18}, ${cx + 10} ${cy - 18}, ${cx + 21} ${cy - 3} Z`}
          fill="#1c1917"
          stroke="#1c1917"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Lower eyelid sweep */}
        <path
          d={`M ${cx - 16} ${cy + 11.5} Q ${cx} ${cy + 13.5}, ${cx + 16} ${cy + 11.5}`}
          stroke="#1c1917"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (activeEmotion === 'depressed') {
    return (
      <g transform={transformEye}>
        {/* Double eyelid crease line */}
        <path
          d={`M ${cx - 20} ${cy - 19} Q ${cx - 2} ${cy - 23}, ${cx + 18} ${cy - 19}`}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyeball White */}
        <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} fill="#dbeafe" />
        
        {/* Ambient occlusion shadow */}
        <path
          d={`M ${cx - 22.5} ${cy - 4} A 22.5 16.2 0 0 0 ${cx + 22.5} ${cy - 4} Z`}
          fill="rgba(15, 23, 42, 0.2)"
        />

        {/* Masked Iris */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}-${activeEmotion}`}>
              <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} />
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
        <path
          d={`M ${cx + 23} ${cy - 5} 
             C ${cx + 10} ${cy - 22}, ${cx - 19} ${cy - 22}, ${cx - 26} ${cy - 7}
             Q ${cx - 33} ${cy - 13}, ${cx - 33} ${cy - 6}
             Q ${cx - 29} ${cy}, ${cx - 24} ${cy - 8}
             C ${cx - 16} ${cy - 18}, ${cx + 10} ${cy - 18}, ${cx + 21} ${cy - 3} Z`}
          fill="#1c1917"
          stroke="#1c1917"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Lower eyelid sweep */}
        <path
          d={`M ${cx - 16} ${cy + 11.5} Q ${cx} ${cy + 13.5}, ${cx + 16} ${cy + 11.5}`}
          stroke="#1c1917"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

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
    const rx = 24; // Expressive anime width
    const ry = 22; // Soulful vertical depth

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
        </defs>

        {/* Double eyelid crease line */}
        <path
          d={`M ${cx - 20} ${cy - 19} Q ${cx - 2} ${cy - 23}, ${cx + 18} ${cy - 19}`}
          stroke="rgba(30, 25, 22, 0.45)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyelash drop shadow on sclera */}
        <path
          d={`M ${cx + 17} ${cy - 20} Q ${cx - 6} ${cy - 22}, ${cx - 21} ${cy - 14}`}
          stroke="rgba(28,21,18,0.38)"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Sclera / Eyeball White: adjusted size and offset to stay cleanly enclosed, with NO outer stroke to prevent double-outline artifacting */}
        <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} fill="#ffffff" />
        
        {/* Top ambient occlusion shadow on eyeball */}
        <path
          d={`M ${cx - 22.5} ${cy - 4} A 22.5 16.2 0 0 0 ${cx + 22.5} ${cy - 4} Z`}
          fill="rgba(15, 23, 42, 0.08)"
        />

        {/* Masked Iris rendering to keep drawing inside the sclera circle */}
        <g clipPath={`url(#anime-eye-clip-${isLeft ? 'l' : 'r'})`}>
          <defs>
            <clipPath id={`anime-eye-clip-${isLeft ? 'l' : 'r'}`}>
              <ellipse cx={cx} cy={cy - 4} rx={22.5} ry={16.2} />
            </clipPath>
          </defs>

          {/* Saturated Kyoto / DxD style base oval iris */}
          <ellipse cx={cx + px} cy={cy + py} rx="16.5" ry="19.5" fill={eyeColor} />

          {/* Saturated 3D light-transmitting overlay gradient */}
          <ellipse cx={cx + px} cy={cy + py} rx="16.5" ry="19.5" fill={`url(#anime-iris-overlay-${isLeft ? 'l' : 'r'})`} />

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
          ) : (
            // Heart pupil: adorable heart curves
            <path
              d={`M ${cx + px} ${cy + py + 6}
                 C ${cx + px - 7.5} ${cy + py}, ${cx + px - 8.5} ${cy + py - 6.5}, ${cx + px} ${cy + py - 4.5}
                 C ${cx + px + 8.5} ${cy + py - 6.5}, ${cx + px} ${cy + py + 6} Z`}
              fill={pupilColor}
            />
          )}

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

        {/* Bold upper feline eyelash wing sweep (Perfect outer-sweeping layout due to mirroring!) */}
        <path
          d={`M ${cx + 23} ${cy - 5} 
             C ${cx + 10} ${cy - 22}, ${cx - 19} ${cy - 22}, ${cx - 26} ${cy - 7}
             Q ${cx - 33} ${cy - 13}, ${cx - 33} ${cy - 6}
             Q ${cx - 29} ${cy}, ${cx - 24} ${cy - 8}
             C ${cx - 16} ${cy - 18}, ${cx + 10} ${cy - 18}, ${cx + 21} ${cy - 3} Z`}
          fill="#1c1917"
          stroke="#1c1917"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Outer mini eyelash barb detail */}
        <path
          d={`M ${cx - 26} ${cy - 3} Q ${cx - 32} ${cy + 1}, ${cx - 29} ${cy - 1} Z`}
          fill="#1c1917"
        />

        {/* Lower eyelid line sweep - perfectly frames the bottom of the sclera */}
        <path
          d={`M ${cx - 16} ${cy + 11.5} Q ${cx} ${cy + 13.5}, ${cx + 16} ${cy + 11.5}`}
          stroke="#1c1917"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Adorable little bottom side lash flick */}
        <path
          d={`M ${cx - 11} ${cy + 12} Q ${cx - 16} ${cy + 14}, ${cx - 15} ${cy + 11}`}
          stroke="#1c1917"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
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
        ) : (
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
