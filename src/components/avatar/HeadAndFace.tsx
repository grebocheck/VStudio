import React from 'react';

export const HeadBase: React.FC<{
  skinColor: string;
  blushOpacity: number;
  blushColor: string;
  earStyle: 'normal' | 'elf' | 'pointy';
  artStyle?: 'classic' | 'anime' | 'retro';
  faceShape?: 'default' | 'sharp' | 'round' | 'chubby' | 'mature';
  freckles?: boolean;
  frecklesDensity?: number;
  frecklesColor?: string;
  beautyMark?: 'none' | 'left-cheek' | 'right-cheek' | 'under-eye' | 'chin';
  facePaint?: 'none' | 'tribal' | 'cat-whiskers' | 'butterfly' | 'under-eye-stripe';
  faceScar?: 'none' | 'cheek-slash' | 'eye-scar' | 'cross-forehead';
  earDecoration?: 'none' | 'piercing' | 'cuff' | 'feather';
}> = ({
  skinColor,
  blushOpacity,
  blushColor,
  earStyle,
  artStyle = 'classic',
  faceShape = 'default',
  freckles = false,
  frecklesDensity = 0.6,
  frecklesColor = '#8b5a2b',
  beautyMark = 'none',
  facePaint = 'none',
  faceScar = 'none',
  earDecoration = 'none',
}) => {
  // Define variations of the anime face shape
  const getAnimeFacePath = () => {
    switch (faceShape) {
      case 'sharp':
        // V-shaped jaw, standard shonen/shojo (more compact chin)
        return 'M 136 130 C 122 160, 128 190, 144 210 C 160 225, 185 238, 200 242 C 215 238, 240 225, 256 210 C 272 190, 278 160, 264 130 C 255 110, 145 110, 136 130 Z';
      case 'round':
        // Softer moe cheeks (cute compact chin)
        return 'M 130 130 C 110 165, 118 195, 142 212 C 160 224, 180 234, 200 234 C 220 234, 240 224, 258 212 C 282 195, 290 165, 270 130 C 255 110, 145 110, 130 130 Z';
      case 'chubby':
        // Wider, fuller cheeks (cute chubby chin)
        return 'M 125 130 C 100 168, 112 205, 140 218 C 165 230, 180 236, 200 236 C 220 236, 235 230, 260 218 C 288 205, 300 168, 275 130 C 260 110, 140 110, 125 130 Z';
      case 'mature':
        // Longer face, prominent cheekbones (elegant but not alien-long chin)
        return 'M 138 130 C 122 162, 130 195, 146 215 C 160 232, 185 245, 200 248 C 215 245, 240 232, 254 215 C 270 195, 278 162, 262 130 C 255 110, 145 110, 138 130 Z';
      case 'default':
      default:
        // Original standard anime face (refined proportions with shorter chin)
        return 'M 134 130 C 118 158, 124 190, 142 208 C 156 220, 180 232, 200 236 C 220 232, 244 220, 258 208 C 276 190, 282 158, 266 130 C 255 110, 145 110, 134 130 Z';
    }
  };

  return (
    <g id="head-base">
      {/* Elf / Pointy ears matching skin tone */}
      {earStyle === 'elf' && (
        <g id="elf-ears">
          {/* Left Elf Ear */}
          <path
            d="M132 150 C110 145, 80 120, 95 155 C105 170, 125 170, 134 165 Z"
            fill={skinColor}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1.2"
          />
          <path d="M125 152 C115 147, 105 138, 112 153 Z" fill="rgba(0,0,0,0.06)" />
          {/* Right Elf Ear */}
          <path
            d="M268 150 C290 145, 320 120, 305 155 C295 170, 275 170, 266 165 Z"
            fill={skinColor}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1.2"
          />
          <path d="M275 152 C285 147, 295 138, 288 153 Z" fill="rgba(0,0,0,0.06)" />
        </g>
      )}

      {earStyle === 'pointy' && (
        <g id="pointy-ears">
          {/* Left Pointy Ear */}
          <path
            d="M132 155 C115 150, 90 140, 105 165 C115 175, 125 175, 134 168 Z"
            fill={skinColor}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1.2"
          />
          {/* Right Pointy Ear */}
          <path
            d="M268 155 C285 150, 310 140, 295 165 C285 175, 275 175, 266 168 Z"
            fill={skinColor}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1.2"
          />
        </g>
      )}

      {/* High-quality stylized anime head shape */}
      {artStyle === 'retro' ? (
        <g>
          <path
            d="M 125 140 C 105 165, 105 210, 135 234 C 155 246, 245 246, 265 234 C 295 210, 295 165, 275 140 C 260 115, 140 115, 125 140 Z"
            fill={skinColor}
            stroke="#1c1917"
            strokeWidth="3.5"
          />
          <path
            d="M 125 140 C 105 165, 105 210, 135 234 C 155 246, 245 246, 265 234 C 295 210, 295 165, 275 140 C 260 115, 140 115, 125 140 Z"
            fill="url(#face-shading)"
          />
        </g>
      ) : artStyle === 'anime' ? (
        <g>
          <path d={getAnimeFacePath()} fill={skinColor} stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
          <path d={getAnimeFacePath()} fill="url(#face-shading)" />
        </g>
      ) : (
        <g>
          <path
            d="M135 130 C110 160, 110 200, 130 215 C145 225, 175 240, 200 240 C225 240, 255 225, 270 215 C290 200, 290 160, 265 130 C255 110, 145 110, 135 130 Z"
            fill={skinColor}
          />
          <path
            d="M135 130 C110 160, 110 200, 130 215 C145 225, 175 240, 200 240 C225 240, 255 225, 270 215 C290 200, 290 160, 265 130 C255 110, 145 110, 135 130 Z"
            fill="url(#face-shading)"
          />
        </g>
      )}

      {/* Dynamic cheek blush & slash layers */}
      {blushOpacity > 0 && (
        <>
          {artStyle === 'retro' ? (
            <>
              <circle cx="145" cy="205" r="12" fill={blushColor} opacity={blushOpacity * 1.5} />
              <circle cx="255" cy="205" r="12" fill={blushColor} opacity={blushOpacity * 1.5} />
            </>
          ) : artStyle === 'anime' ? (
            <>
              <g opacity={blushOpacity * 1.3} stroke={blushColor} strokeWidth="2.5" strokeLinecap="round">
                <line x1="140" y1="190" x2="148" y2="200" />
                <line x1="146" y1="190" x2="154" y2="200" />
                <line x1="152" y1="190" x2="160" y2="200" />

                <line x1="240" y1="190" x2="248" y2="200" />
                <line x1="246" y1="190" x2="254" y2="200" />
                <line x1="252" y1="190" x2="260" y2="200" />
              </g>
            </>
          ) : (
            <>
              {/* Soft volumetric blush */}
              <circle cx="148" cy="195" r="22" fill="url(#soft-blush)" color={blushColor} opacity={blushOpacity} />
              <circle cx="252" cy="195" r="22" fill="url(#soft-blush)" color={blushColor} opacity={blushOpacity} />
            </>
          )}
        </>
      )}

      {/* Nose Rendering */}
      {artStyle === 'retro' ? (
        <g id="retro-nose">
          <ellipse cx="200" cy="190" rx="9" ry="6" fill="#111111" />
          <ellipse cx="198" cy="188" rx="3" ry="2" fill="#ffffff" opacity="0.8" />
        </g>
      ) : artStyle === 'anime' ? (
        <g id="anime-nose">
          {/* Nose shadow for depth */}
          <path d="M199 186 L201 190" stroke="rgba(0,0,0,0.15)" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Crisp highlight tip */}
          <path d="M199 184 L201 190" stroke="rgba(0,0,0,0.4)" strokeWidth="1" fill="none" strokeLinecap="round" />
          <circle cx="198" cy="187" r="1" fill="#ffffff" opacity="0.6" />
        </g>
      ) : (
        <path
          d="M198 185 L200 193 L196 195"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Freckles Rendering */}
      {freckles && (
        <g id="facial-freckles" fill={frecklesColor}>
          {[
            { x: 175, y: 192, r: 1.2 },
            { x: 182, y: 195, r: 0.9 },
            { x: 170, y: 196, r: 1.1 },
            { x: 178, y: 199, r: 0.8 },
            { x: 165, y: 193, r: 1.0 },
            { x: 173, y: 202, r: 0.7 },
            { x: 225, y: 192, r: 1.2 },
            { x: 218, y: 195, r: 0.9 },
            { x: 230, y: 196, r: 1.1 },
            { x: 222, y: 199, r: 0.8 },
            { x: 235, y: 193, r: 1.0 },
            { x: 227, y: 202, r: 0.7 },
            { x: 192, y: 189, r: 0.8 },
            { x: 208, y: 189, r: 0.8 },
            { x: 196, y: 192, r: 1.0 },
            { x: 204, y: 192, r: 1.0 },
            { x: 200, y: 194, r: 1.2 },
          ].map((pt, idx) => {
            const hash = (idx * 7 + 13) % 10;
            if (hash / 10 >= (frecklesDensity ?? 0.6)) return null;
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={pt.r * (artStyle === 'retro' ? 1.5 : 1.0)}
                opacity={artStyle === 'retro' ? 0.9 : 0.65}
              />
            );
          })}
        </g>
      )}

      {/* Beauty Mark Rendering */}
      {(() => {
        let bm = null;
        if (beautyMark === 'left-cheek') bm = { cx: 172, cy: 212, r: 2.2 };
        else if (beautyMark === 'right-cheek') bm = { cx: 228, cy: 212, r: 2.2 };
        else if (beautyMark === 'under-eye') bm = { cx: 178, cy: 192, r: 1.8 };
        else if (beautyMark === 'chin') bm = { cx: 194, cy: 232, r: 2.0 };

        if (!bm) return null;
        return <circle id={`beauty-mark-${beautyMark}`} cx={bm.cx} cy={bm.cy} r={bm.r} fill="#1c1917" opacity="0.85" />;
      })()}

      {/* Face Paint Rendering */}
      {facePaint === 'tribal' && (
        <g id="facepaint-tribal">
          <path
            d="M 140 188 L 160 195 L 142 205 L 158 208 L 138 214"
            stroke="#991b1b"
            strokeWidth="2.5"
            fill="none"
            strokeLinejoin="round"
            opacity="0.8"
          />
          <path
            d="M 260 188 L 240 195 L 258 205 L 242 208 L 262 214"
            stroke="#991b1b"
            strokeWidth="2.5"
            fill="none"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </g>
      )}
      {facePaint === 'cat-whiskers' && (
        <g
          id="facepaint-cat-whiskers"
          stroke="#1e293b"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        >
          <line x1="140" y1="195" x2="162" y2="198" />
          <line x1="138" y1="202" x2="160" y2="204" />
          <line x1="142" y1="209" x2="162" y2="209" />
          <line x1="260" y1="195" x2="238" y2="198" />
          <line x1="262" y1="202" x2="240" y2="204" />
          <line x1="258" y1="209" x2="238" y2="209" />
        </g>
      )}
      {facePaint === 'butterfly' && (
        <g id="facepaint-butterfly" opacity="0.85">
          <path
            d="M 152 195 C 145 188, 142 198, 152 200 C 142 202, 145 212, 152 205 C 159 212, 162 202, 152 200 C 162 198, 159 188, 152 195 Z"
            fill="#ec4899"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
        </g>
      )}
      {facePaint === 'under-eye-stripe' && (
        <g
          id="facepaint-under-eye-stripe"
          stroke="#06b6d4"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        >
          <path d="M 142 188 L 158 190 M 140 193 L 155 195" />
          <path d="M 258 188 L 242 190 M 260 193 L 245 195" />
        </g>
      )}

      {/* Face Scar Rendering */}
      {faceScar === 'cheek-slash' && (
        <g id="scar-cheek-slash" stroke="#b45a52" strokeLinecap="round" opacity="0.8">
          <line x1="234" y1="196" x2="252" y2="216" strokeWidth="2" />
          {/* Stitch marks across the slash */}
          <line x1="237" y1="204" x2="243" y2="199" strokeWidth="1.2" />
          <line x1="242" y1="209" x2="248" y2="204" strokeWidth="1.2" />
          <line x1="247" y1="214" x2="253" y2="209" strokeWidth="1.2" />
        </g>
      )}
      {faceScar === 'eye-scar' && (
        <g id="scar-eye" stroke="#b45a52" strokeLinecap="round" opacity="0.8">
          {/* Vertical scar running through the left eye (eye renders on top) */}
          <path d="M 152 148 C 154 160, 154 168, 153 172" strokeWidth="2" fill="none" />
          <path d="M 156 196 C 157 204, 156 212, 154 218" strokeWidth="2" fill="none" />
          <line x1="151" y1="206" x2="160" y2="204" strokeWidth="1.2" />
        </g>
      )}
      {faceScar === 'cross-forehead' && (
        <g id="scar-cross-forehead" stroke="#b45a52" strokeLinecap="round" opacity="0.8">
          <line x1="222" y1="138" x2="236" y2="154" strokeWidth="2" />
          <line x1="236" y1="138" x2="222" y2="154" strokeWidth="2" />
        </g>
      )}

      {/* Ear Decoration Rendering */}
      {earDecoration !== 'none' &&
        (() => {
          // Anchor on the lobe of the visible ear; bare side of the head for `normal`.
          const anchors =
            earStyle === 'elf'
              ? [
                  { x: 120, y: 162, mirror: -1 },
                  { x: 280, y: 162, mirror: 1 },
                ]
              : earStyle === 'pointy'
                ? [
                    { x: 119, y: 167, mirror: -1 },
                    { x: 281, y: 167, mirror: 1 },
                  ]
                : [
                    { x: 137, y: 199, mirror: -1 },
                    { x: 263, y: 199, mirror: 1 },
                  ];
          return (
            <g id={`ear-decoration-${earDecoration}`}>
              {anchors.map(({ x, y, mirror }, i) => (
                <g key={i}>
                  {earDecoration === 'piercing' && (
                    <>
                      <circle cx={x} cy={y + 4} r="2.6" fill="none" stroke="#fbbf24" strokeWidth="1.6" />
                      <circle cx={x} cy={y + 1.5} r="0.9" fill="#fbbf24" />
                    </>
                  )}
                  {earDecoration === 'cuff' && (
                    <g stroke="#e5e7eb" strokeWidth="2" fill="none" strokeLinecap="round">
                      <path
                        d={`M ${x + mirror * 4} ${y - 8} Q ${x + mirror * 8} ${y - 5}, ${x + mirror * 4} ${y - 2}`}
                      />
                      <path
                        d={`M ${x + mirror * 4} ${y - 1} Q ${x + mirror * 8} ${y + 2}, ${x + mirror * 4} ${y + 5}`}
                      />
                    </g>
                  )}
                  {earDecoration === 'feather' && (
                    <g>
                      <line x1={x} y1={y + 2} x2={x} y2={y + 6} stroke="#fbbf24" strokeWidth="1.2" />
                      <path
                        d={`M ${x} ${y + 6}
                            C ${x - 3.5} ${y + 12}, ${x - 2.5} ${y + 20}, ${x} ${y + 24}
                            C ${x + 2.5} ${y + 20}, ${x + 3.5} ${y + 12}, ${x} ${y + 6} Z`}
                        fill="#7dd3fc"
                        stroke="#0369a1"
                        strokeWidth="0.8"
                      />
                      <line x1={x} y1={y + 8} x2={x} y2={y + 22} stroke="#0369a1" strokeWidth="0.7" opacity="0.7" />
                    </g>
                  )}
                </g>
              ))}
            </g>
          );
        })()}
    </g>
  );
};

export const Live2DMouth: React.FC<{
  openAmount: number;
  form: number;
  hasFangs?: boolean;
  artStyle?: 'classic' | 'anime' | 'retro';
  tongueOut?: number;
  faceShape?: 'default' | 'sharp' | 'round' | 'chubby' | 'mature';
  mouthShape?: 'default' | 'small' | 'wide' | 'pouty' | 'thin';
  lipStyle?: 'natural' | 'glossy' | 'dark' | 'gradient';
  lipColor?: string;
  toothStyle?: 'normal' | 'fangs' | 'gap-tooth' | 'braces' | 'sharp-teeth';
}> = ({
  openAmount,
  form,
  hasFangs = false,
  artStyle = 'classic',
  tongueOut = 0,
  faceShape = 'default',
  mouthShape = 'default',
  lipStyle = 'natural',
  lipColor = '#d6536d',
  toothStyle,
}) => {
  let mouthYOffset = 0;
  if (faceShape === 'mature') mouthYOffset = 6;
  else if (faceShape === 'sharp') mouthYOffset = 3;
  else if (faceShape === 'chubby' || faceShape === 'round') mouthYOffset = -2;

  // `toothStyle` supersedes the legacy boolean; `hasFangs` keeps old configs working.
  const teeth = toothStyle ?? (hasFangs ? 'fangs' : 'normal');

  const mouthY = 208 + mouthYOffset;
  const mouthX = 200;
  const width = artStyle === 'retro' ? 22 : 15;
  const curveYOffset = form * (artStyle === 'retro' ? 6 : 4);

  // Feature 10: Vowel-like mouth shape adjustments based on openAmount and form
  let widthScale = 1.0;
  let heightScale = 1.0;

  if (form > 0) {
    widthScale += form * 0.22; // Wide smile (I, E shapes)
    heightScale -= form * 0.08; // Flatter profile
  } else {
    widthScale += form * 0.28; // Narrow pucker (U, O shapes)
    heightScale -= form * 0.15; // Taller profile
  }

  // Resting mouth silhouette
  if (mouthShape === 'small') widthScale *= 0.7;
  else if (mouthShape === 'wide') widthScale *= 1.3;
  else if (mouthShape === 'pouty') {
    widthScale *= 0.82;
    heightScale *= 1.12;
  } else if (mouthShape === 'thin') widthScale *= 1.08;

  const finalWidth = width * widthScale;

  const hasVisibleLips = lipStyle !== 'natural' || mouthShape === 'pouty';
  const lipFill = lipStyle === 'gradient' ? 'url(#lip-gradient-fill)' : lipColor;
  const lipOpacity = lipStyle === 'dark' ? 0.95 : 0.8;
  /** Soft upper+lower lip volume hugging the closed-mouth curve. */
  const renderClosedLips = (sx: number, sy: number, ex: number, ey: number, controlY: number) => {
    if (!hasVisibleLips) return null;
    const fullness = mouthShape === 'pouty' ? 1.35 : 1.0;
    return (
      <g id="lips-closed">
        {lipStyle === 'gradient' && (
          <defs>
            <linearGradient id="lip-gradient-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lipColor} stopOpacity="0.55" />
              <stop offset="55%" stopColor={lipColor} stopOpacity="1" />
              <stop offset="100%" stopColor={lipColor} stopOpacity="0.75" />
            </linearGradient>
          </defs>
        )}
        <path
          d={`M ${sx} ${sy}
              C ${mouthX - finalWidth * 0.45} ${sy - 4.5 * fullness}, ${mouthX + finalWidth * 0.45} ${ey - 4.5 * fullness}, ${ex} ${ey}
              Q ${mouthX} ${controlY + 1}, ${sx} ${sy} Z`}
          fill={lipFill}
          opacity={lipOpacity}
        />
        <path
          d={`M ${sx} ${sy}
              Q ${mouthX} ${controlY}, ${ex} ${ey}
              C ${mouthX + finalWidth * 0.5} ${controlY + 5.5 * fullness}, ${mouthX - finalWidth * 0.5} ${controlY + 5.5 * fullness}, ${sx} ${sy} Z`}
          fill={lipFill}
          opacity={lipOpacity}
        />
        {lipStyle === 'glossy' && (
          <ellipse
            cx={mouthX}
            cy={controlY + 3 * fullness}
            rx={finalWidth * 0.32}
            ry={1.6 * fullness}
            fill="#ffffff"
            opacity="0.55"
          />
        )}
      </g>
    );
  };

  if (openAmount < 0.08) {
    if (artStyle === 'retro') {
      const startX = mouthX - finalWidth;
      const startY = mouthY - curveYOffset * 0.2;
      const endX = mouthX + finalWidth;
      const endY = mouthY - curveYOffset * 0.2;
      const controlY = mouthY + 10 + curveYOffset;

      return (
        <g id="retro-mouth-closed">
          {tongueOut > 0.15 && (
            <path
              d={`M ${mouthX - 7} ${mouthY + curveYOffset * 0.1}
                  Q ${mouthX} ${mouthY + curveYOffset * 0.1 + 8 + tongueOut * 12}, ${mouthX + 7} ${mouthY + curveYOffset * 0.1}
                  C ${mouthX + 4} ${mouthY + curveYOffset * 0.1 + 4}, ${mouthX - 4} ${mouthY + curveYOffset * 0.1 + 4}, ${mouthX - 7} ${mouthY + curveYOffset * 0.1} Z`}
              fill="#fb7185"
              stroke="#1c1917"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}
          <path
            d={`M ${startX} ${startY} Q ${mouthX} ${controlY}, ${endX} ${endY}`}
            stroke="#1c1917"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${startX - 2} ${startY - 4} Q ${startX - 4} ${startY + 2}, ${startX + 2} ${startY + 2}`}
            stroke="#1c1917"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${endX + 2} ${endY - 4} Q ${endX + 4} ${endY + 2}, ${endX - 2} ${endY + 2}`}
            stroke="#1c1917"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }

    const startX = mouthX - finalWidth;
    const startY = mouthY - curveYOffset * 0.2;
    const endX = mouthX + finalWidth;
    const endY = mouthY - curveYOffset * 0.2;
    const controlY = mouthY + curveYOffset;

    const closedStrokeWidth =
      mouthShape === 'thin' ? (artStyle === 'anime' ? '1.4' : '1.8') : artStyle === 'anime' ? '2' : '2.5';

    return (
      <g>
        {tongueOut > 0.15 && (
          <path
            d={`M ${mouthX - 7} ${mouthY + curveYOffset * 0.1}
                Q ${mouthX} ${mouthY + curveYOffset * 0.1 + 9 + tongueOut * 13}, ${mouthX + 7} ${mouthY + curveYOffset * 0.1}
                C ${mouthX + 4} ${mouthY + curveYOffset * 0.1 + 4}, ${mouthX - 4} ${mouthY + curveYOffset * 0.1 + 4}, ${mouthX - 7} ${mouthY + curveYOffset * 0.1} Z`}
            fill="#fb7185"
            stroke="#1c1917"
            strokeWidth={artStyle === 'anime' ? '1.6' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {renderClosedLips(startX, startY, endX, endY, controlY)}
        <path
          d={`M ${startX} ${startY} Q ${mouthX} ${controlY}, ${endX} ${endY}`}
          stroke="#1c1917"
          strokeWidth={closedStrokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* A small fang peeking over the closed lip */}
        {(teeth === 'fangs' || teeth === 'sharp-teeth') && (
          <path
            d={`M ${mouthX + finalWidth * 0.35} ${mouthY + curveYOffset * 0.55 - 0.5}
                L ${mouthX + finalWidth * 0.45} ${mouthY + curveYOffset * 0.55 + 5}
                L ${mouthX + finalWidth * 0.55} ${mouthY + curveYOffset * 0.55 - 0.5} Z`}
            fill="#ffffff"
            stroke="#1c1917"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        )}
      </g>
    );
  } else {
    // Open Mouth
    const baseH = openAmount * (artStyle === 'retro' ? 14 : 11);
    const finalH = baseH * heightScale;

    if (artStyle === 'retro') {
      return (
        <g id="retro-mouth-open">
          <path
            d={`M ${mouthX - finalWidth} ${mouthY - 2} 
                C ${mouthX - finalWidth - 4} ${mouthY + finalH + 8}, ${mouthX + finalWidth + 4} ${mouthY + finalH + 8}, ${mouthX + finalWidth} ${mouthY - 2} 
                Z`}
            fill="#1c1917"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d={`M ${mouthX - finalWidth * 0.5} ${mouthY + finalH * 0.5} 
                C ${mouthX - 5} ${mouthY + finalH * 0.2}, ${mouthX + finalWidth * 0.5} ${mouthY + finalH * 0.5}, ${mouthX + finalWidth * 0.5} ${mouthY + finalH + 4} 
                C ${mouthX} ${mouthY + finalH + 7}, ${mouthX - finalWidth * 0.5} ${mouthY + finalH + 6}, ${mouthX - finalWidth * 0.5} ${mouthY + finalH * 0.5} Z`}
            fill="#ff758f"
          />
        </g>
      );
    }

    const lipTopStartY = mouthY - curveYOffset * 0.3;
    const lipTopEndY = mouthY - curveYOffset * 0.3;
    const lipTopControlY = mouthY + curveYOffset * 0.6 - 1;
    const cavityDepthY = mouthY + finalH + 3;

    // Feature 11: Tongue wiggle translation offsets
    const tongueWiggleX = Math.sin(Date.now() * 0.015) * 1.5;
    const tongueWiggleY = Math.cos(Date.now() * 0.02) * 0.5;

    return (
      <g>
        {/* Lip ring framing the open mouth */}
        {hasVisibleLips && (
          <>
            {lipStyle === 'gradient' && (
              <defs>
                <linearGradient id="lip-gradient-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lipColor} stopOpacity="0.55" />
                  <stop offset="55%" stopColor={lipColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={lipColor} stopOpacity="0.75" />
                </linearGradient>
              </defs>
            )}
            <path
              d={`M ${mouthX - finalWidth} ${lipTopStartY}
                  Q ${mouthX} ${lipTopControlY}, ${mouthX + finalWidth} ${lipTopEndY}
                  Q ${mouthX} ${cavityDepthY}, ${mouthX - finalWidth} ${lipTopStartY} Z`}
              fill="none"
              stroke={lipFill}
              strokeWidth={mouthShape === 'pouty' ? 6 : 4.5}
              strokeLinejoin="round"
              opacity={lipOpacity}
            />
          </>
        )}
        <path
          d={`M ${mouthX - finalWidth} ${lipTopStartY}
              Q ${mouthX} ${lipTopControlY}, ${mouthX + finalWidth} ${lipTopEndY}
              Q ${mouthX} ${cavityDepthY}, ${mouthX - finalWidth} ${lipTopStartY} Z`}
          fill="#a81a32"
          stroke="#1c1917"
          strokeWidth={artStyle === 'anime' ? '1.8' : '2'}
          strokeLinejoin="round"
        />

        {/* Clip path to bound internal teeth & tongue */}
        <g clipPath="url(#mouth-cavity-clip)">
          <defs>
            <clipPath id="mouth-cavity-clip">
              <path
                d={`M ${mouthX - finalWidth} ${lipTopStartY} 
                    Q ${mouthX} ${lipTopControlY}, ${mouthX + finalWidth} ${lipTopEndY} 
                    Q ${mouthX} ${cavityDepthY}, ${mouthX - finalWidth} ${lipTopStartY} Z`}
              />
            </clipPath>
          </defs>

          {/* Upper teeth — silhouette depends on toothStyle */}
          {teeth === 'sharp-teeth' ? (
            // Jagged shark-like upper row
            <path
              d={`M ${mouthX - finalWidth * 0.85} ${lipTopStartY + 1}
                  Q ${mouthX} ${lipTopControlY + 1.5}, ${mouthX + finalWidth * 0.85} ${lipTopEndY + 1}
                  ${[3, 2, 1, 0, -1, -2, -3]
                    .map((i) => {
                      const tipX = mouthX + i * finalWidth * 0.24;
                      const baseX = tipX + finalWidth * 0.12;
                      return `L ${baseX} ${lipTopStartY + 1.5} L ${tipX} ${lipTopControlY + finalH * 0.42 + 2} `;
                    })
                    .join('')}
                  L ${mouthX - finalWidth * 0.85} ${lipTopStartY + 1} Z`}
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="0.7"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d={`M ${mouthX - finalWidth * 0.8} ${lipTopStartY + 1.2}
                  Q ${mouthX} ${lipTopControlY + 1.8}, ${mouthX + finalWidth * 0.8} ${lipTopEndY + 1.2}
                  Q ${mouthX + finalWidth * 0.65} ${lipTopControlY + finalH * 0.3 + 1}, ${mouthX} ${lipTopControlY + finalH * 0.35 + 1}
                  Q ${mouthX - finalWidth * 0.65} ${lipTopControlY + finalH * 0.3 + 1}, ${mouthX - finalWidth * 0.8} ${lipTopStartY + 1.2} Z`}
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="0.6"
            />
          )}

          {/* Gap-tooth: a visible notch between the two front teeth */}
          {teeth === 'gap-tooth' && (
            <rect
              x={mouthX - 1.1}
              y={lipTopControlY + 1.5}
              width="2.2"
              height={Math.max(2.5, finalH * 0.3)}
              fill="#7a1226"
              rx="0.8"
            />
          )}

          {/* Braces: metallic band with brackets across the upper teeth */}
          {teeth === 'braces' && (
            <g id="teeth-braces">
              <path
                d={`M ${mouthX - finalWidth * 0.72} ${lipTopStartY + finalH * 0.16 + 1.6}
                    Q ${mouthX} ${lipTopControlY + finalH * 0.2 + 2}, ${mouthX + finalWidth * 0.72} ${lipTopEndY + finalH * 0.16 + 1.6}`}
                stroke="#94a3b8"
                strokeWidth="1.4"
                fill="none"
              />
              {[-0.55, -0.28, 0, 0.28, 0.55].map((f) => (
                <rect
                  key={f}
                  x={mouthX + f * finalWidth - 1.2}
                  y={lipTopControlY + finalH * 0.2 + 0.8 + Math.abs(f) * 1.2}
                  width="2.4"
                  height="2.4"
                  fill="#cbd5e1"
                  stroke="#64748b"
                  strokeWidth="0.4"
                  rx="0.5"
                />
              ))}
            </g>
          )}

          {/* Vampire Fangs option inside clip */}
          {teeth === 'fangs' && (
            <g id="vampire-fangs">
              <path
                d={`M ${mouthX - finalWidth * 0.55} ${lipTopStartY + 2}
                    L ${mouthX - finalWidth * 0.4} ${lipTopStartY + finalH * 0.4 + 5.5}
                    L ${mouthX - finalWidth * 0.25} ${lipTopStartY + 2} Z`}
                fill="#ffffff"
                stroke="#1c1917"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              <path
                d={`M ${mouthX + finalWidth * 0.25} ${lipTopStartY + 2}
                    L ${mouthX + finalWidth * 0.4} ${lipTopStartY + finalH * 0.4 + 5.5}
                    L ${mouthX + finalWidth * 0.55} ${lipTopStartY + 2} Z`}
                fill="#ffffff"
                stroke="#1c1917"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Wiggling pink tongue with center crease */}
          <g transform={`translate(${tongueWiggleX}, ${tongueWiggleY})`}>
            <path
              d={`M ${mouthX - finalWidth * 0.5} ${mouthY + finalH * 0.5}
                  C ${mouthX - finalWidth * 0.4} ${mouthY + finalH * 0.4}, ${mouthX + finalWidth * 0.5} ${mouthY + finalH * 0.5}, ${mouthX + finalWidth * 0.4} ${cavityDepthY - 1.5}
                  C ${mouthX} ${cavityDepthY}, ${mouthX - finalWidth * 0.5} ${cavityDepthY - 1.5}, ${mouthX - finalWidth * 0.5} ${mouthY + finalH * 0.5} Z`}
              fill="#ff8da1"
            />
            <path
              d={`M ${mouthX} ${mouthY + finalH * 0.6} 
                  Q ${mouthX + 0.5} ${mouthY + finalH * 0.8}, ${mouthX} ${cavityDepthY - 3}`}
              stroke="#e11d48"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>

          {/* Detailed lower teeth */}
          {teeth === 'sharp-teeth' ? (
            <path
              d={`M ${mouthX - finalWidth * 0.65} ${cavityDepthY - 0.5}
                  ${[-2, -1, 0, 1, 2]
                    .map((i) => {
                      const tipX = mouthX + i * finalWidth * 0.26;
                      const baseX = tipX + finalWidth * 0.13;
                      return `L ${tipX} ${cavityDepthY - finalH * 0.3 - 2} L ${baseX} ${cavityDepthY - 0.5} `;
                    })
                    .join('')}
                  L ${mouthX + finalWidth * 0.65} ${cavityDepthY - 0.5} Z`}
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d={`M ${mouthX - finalWidth * 0.6} ${cavityDepthY - 1}
                  Q ${mouthX} ${cavityDepthY - finalH * 0.25 - 1.5}, ${mouthX + finalWidth * 0.6} ${cavityDepthY - 1}
                  Z`}
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="0.5"
            />
          )}
        </g>

        {/* External Tongue Out */}
        {tongueOut > 0.15 && (
          <path
            d={`M ${mouthX - 8} ${lipTopStartY + finalH * 0.3}
                Q ${mouthX} ${lipTopStartY + finalH + 7 + tongueOut * 13}, ${mouthX + 8} ${lipTopStartY + finalH * 0.3}
                C ${mouthX + 5} ${lipTopStartY + finalH + 2}, ${mouthX - 5} ${lipTopStartY + finalH + 2}, ${mouthX - 8} ${lipTopStartY + finalH * 0.3} Z`}
            fill="#fb7185"
            stroke="#1c1917"
            strokeWidth={artStyle === 'anime' ? '1.6' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    );
  }
};
