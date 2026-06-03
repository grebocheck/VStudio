import React from 'react';

export const HeadBase: React.FC<{
  skinColor: string;
  blushOpacity: number;
  blushColor: string;
  earStyle: 'normal' | 'elf' | 'pointy';
  artStyle?: 'classic' | 'anime' | 'retro';
  faceShape?: 'default' | 'sharp' | 'round' | 'chubby' | 'mature';
}> = ({ skinColor, blushOpacity, blushColor, earStyle, artStyle = 'classic', faceShape = 'default' }) => {
  // Define variations of the anime face shape
  const getAnimeFacePath = () => {
    switch (faceShape) {
      case 'sharp':
        // V-shaped jaw, standard shonen/shojo
        return 'M 136 130 C 120 160, 126 195, 142 215 C 160 235, 185 255, 200 258 C 215 255, 240 235, 258 215 C 274 195, 280 160, 264 130 C 255 110, 145 110, 136 130 Z';
      case 'round':
        // Softer moe cheeks
        return 'M 130 130 C 105 165, 115 205, 140 225 C 160 240, 180 248, 200 248 C 220 248, 240 240, 260 225 C 285 205, 295 165, 270 130 C 255 110, 145 110, 130 130 Z';
      case 'chubby':
        // Wider, fuller cheeks
        return 'M 125 130 C 95 170, 110 215, 140 230 C 165 245, 180 250, 200 250 C 220 250, 235 245, 260 230 C 290 215, 305 170, 275 130 C 260 110, 140 110, 125 130 Z';
      case 'mature':
        // Longer face, prominent cheekbones
        return 'M 138 130 C 120 165, 130 205, 145 225 C 160 245, 185 260, 200 262 C 215 260, 240 245, 255 225 C 270 205, 280 165, 262 130 C 255 110, 145 110, 138 130 Z';
      case 'default':
      default:
        // Original standard anime face
        return 'M 134 130 C 114 158, 120 195, 138 214 C 152 228, 180 244, 200 248 C 220 244, 248 228, 262 214 C 280 195, 286 158, 266 130 C 255 110, 145 110, 134 130 Z';
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
    </g>
  );
};

export const Live2DMouth: React.FC<{
  openAmount: number;
  form: number;
  hasFangs?: boolean;
  artStyle?: 'classic' | 'anime' | 'retro';
  tongueOut?: number;
}> = ({ openAmount, form, hasFangs = false, artStyle = 'classic', tongueOut = 0 }) => {
  const mouthY = 208;
  const mouthX = 200;
  const width = artStyle === 'retro' ? 22 : 15;
  const curveYOffset = form * (artStyle === 'retro' ? 6 : 4);

  if (openAmount < 0.08) {
    if (artStyle === 'retro') {
      const startX = mouthX - width;
      const startY = mouthY - curveYOffset * 0.2;
      const endX = mouthX + width;
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

    const startX = mouthX - width;
    const startY = mouthY - curveYOffset * 0.2;
    const endX = mouthX + width;
    const endY = mouthY - curveYOffset * 0.2;
    const controlY = mouthY + curveYOffset;

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
        <path
          d={`M ${startX} ${startY} Q ${mouthX} ${controlY}, ${endX} ${endY}`}
          stroke="#1c1917"
          strokeWidth={artStyle === 'anime' ? '2' : '2.5'}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  } else {
    // Open Mouth
    const h = openAmount * (artStyle === 'retro' ? 14 : 11);

    if (artStyle === 'retro') {
      return (
        <g id="retro-mouth-open">
          <path
            d={`M ${mouthX - width} ${mouthY - 2} 
                C ${mouthX - width - 4} ${mouthY + h + 8}, ${mouthX + width + 4} ${mouthY + h + 8}, ${mouthX + width} ${mouthY - 2} 
                Z`}
            fill="#1c1917"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d={`M ${mouthX - width * 0.5} ${mouthY + h * 0.5} 
                C ${mouthX - 5} ${mouthY + h * 0.2}, ${mouthX + width * 0.5} ${mouthY + h * 0.5}, ${mouthX + width * 0.5} ${mouthY + h + 4} 
                C ${mouthX} ${mouthY + h + 7}, ${mouthX - width * 0.5} ${mouthY + h + 6}, ${mouthX - width * 0.5} ${mouthY + h * 0.5} Z`}
            fill="#ff758f"
          />
        </g>
      );
    }

    const lipTopStartY = mouthY - curveYOffset * 0.3;
    const lipTopEndY = mouthY - curveYOffset * 0.3;
    const lipTopControlY = mouthY + curveYOffset * 0.6 - 1;
    const cavityDepthY = mouthY + h + 3;

    return (
      <g>
        <path
          d={`M ${mouthX - width} ${lipTopStartY} 
              Q ${mouthX} ${lipTopControlY}, ${mouthX + width} ${lipTopEndY} 
              Q ${mouthX} ${cavityDepthY}, ${mouthX - width} ${lipTopStartY} Z`}
          fill="#a81a32"
          stroke="#1c1917"
          strokeWidth={artStyle === 'anime' ? '1.8' : '2'}
          strokeLinejoin="round"
        />

        <path
          d={`M ${mouthX - width * 0.6} ${mouthY + h * 0.4} 
              C ${mouthX - 4} ${mouthY + h * 0.3}, ${mouthX + width * 0.7} ${mouthY + h * 0.5}, ${mouthX + width * 0.5} ${mouthY + h + 1}
              C ${mouthX} ${mouthY + h + 2}, ${mouthX - width * 0.6} ${mouthY + h + 1}, ${mouthX - width * 0.6} ${mouthY + h * 0.4} Z`}
          fill="#ff8da1"
          opacity="0.9"
        />

        <path
          d={`M ${mouthX - width * 0.8} ${lipTopStartY + 1} 
              Q ${mouthX} ${lipTopControlY + 1.2}, ${mouthX + width * 0.8} ${lipTopEndY + 1} 
              L ${mouthX + width * 0.7} ${lipTopControlY + h * 0.25 + 2}
              L ${mouthX - width * 0.7} ${lipTopControlY + h * 0.25 + 2} Z`}
          fill="#ffffff"
        />

        {hasFangs && (
          <g id="vampire-fangs">
            <path
              d={`M ${mouthX - width * 0.55} ${lipTopStartY + 2}
                  L ${mouthX - width * 0.4} ${lipTopStartY + h * 0.4 + 5.5}
                  L ${mouthX - width * 0.25} ${lipTopStartY + 2} Z`}
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <path
              d={`M ${mouthX + width * 0.25} ${lipTopStartY + 2}
                  L ${mouthX + width * 0.4} ${lipTopStartY + h * 0.4 + 5.5}
                  L ${mouthX + width * 0.55} ${lipTopStartY + 2} Z`}
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        )}

        {tongueOut > 0.15 && (
          <path
            d={`M ${mouthX - 8} ${lipTopStartY + h * 0.3}
                Q ${mouthX} ${lipTopStartY + h + 7 + tongueOut * 13}, ${mouthX + 8} ${lipTopStartY + h * 0.3}
                C ${mouthX + 5} ${lipTopStartY + h + 2}, ${mouthX - 5} ${lipTopStartY + h + 2}, ${mouthX - 8} ${lipTopStartY + h * 0.3} Z`}
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
