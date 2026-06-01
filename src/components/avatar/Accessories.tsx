import React from 'react';

export const AccessoryComponent: React.FC<{
  style: 'none' | 'headphones' | 'horns' | 'glasses' | 'neko-ears' | 'angel-halo' | 'fox-mask';
  color: string;
  angleX: number;
  accessoryGlow?: boolean;
}> = ({ style, color, angleX, accessoryGlow = false }) => {
  const dx = angleX * 0.4;

  if (style === 'none') return null;

  const glowStyle = accessoryGlow
    ? {
        transform: `translateX(${dx}px)`,
        filter: `drop-shadow(0 0 10px ${color})`,
        transition: 'filter 0.2s ease',
      }
    : {
        transform: `translateX(${dx}px)`,
      };

  return (
    <g id="accessory-layer" style={glowStyle}>
      {/* Demon horns option */}
      {style === 'horns' && (
        <g id="accessory-horns">
          <path
            d="M125 100 Q100 40, 60 45 Q90 60, 115 110 Z"
            fill={color}
            stroke="#1c1917"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M275 100 Q300 40, 340 45 Q310 60, 285 110 Z"
            fill={color}
            stroke="#1c1917"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M80 60 Q95 70, 108 80" stroke="rgba(0,0,0,0.18)" strokeWidth="2" strokeLinecap="round" />
          <path d="M320 60 Q305 70, 292 80" stroke="rgba(0,0,0,0.18)" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* Cat/Neko ears option */}
      {style === 'neko-ears' && (
        <g id="accessory-neko" transform="translate(0, 8)">
          {/* LEFT CURVED CAT EAR (Fleshy and layered) */}
          <path
            d="M 125 98 
               C 100 85, 55 45, 62 26 
               C 68 12, 110 40, 138 68 Z"
            fill={color}
            stroke="#1c1917"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Left inner pink canal */}
          <path
            d="M 80 48 
               C 85 38, 112 55, 126 72
               C 112 78, 92 68, 80 48 Z"
            fill="#ffccd5"
          />
          {/* Left ear inner fluffy fur tufts */}
          <path
            d="M 78 52 Q 82 45, 88 50 M 84 58 Q 90 52, 94 57 M 90 64 Q 96 58, 100 63"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* RIGHT CURVED CAT EAR (Fleshy and layered) */}
          <path
            d="M 275 98 
               C 300 85, 345 45, 338 26 
               C 332 12, 290 40, 262 68 Z"
            fill={color}
            stroke="#1c1917"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Right inner pink canal */}
          <path
            d="M 320 48 
               C 315 38, 288 55, 274 72
               C 288 78, 308 68, 320 48 Z"
            fill="#ffccd5"
          />
          {/* Right ear inner fluffy fur tufts */}
          <path
            d="M 322 52 Q 318 45, 312 50 M 316 58 Q 310 52, 306 57 M 310 64 Q 304 58, 300 63"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      {/* Reading glasses option */}
      {style === 'glasses' && (
        <g id="accessory-glasses" style={{ transform: `translateY(40px)` }}>
          <circle cx="155" cy="135" r="21" fill="none" stroke={color} strokeWidth="3.5" />
          <circle cx="245" cy="135" r="21" fill="none" stroke={color} strokeWidth="3.5" />
          <line x1="176" y1="135" x2="224" y2="135" stroke={color} strokeWidth="3.5" />
          <line
            x1="145"
            y1="125"
            x2="160"
            y2="140"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line
            x1="235"
            y1="125"
            x2="250"
            y2="140"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
      )}

      {/* Studio headphones option */}
      {style === 'headphones' && (
        <g id="accessory-headphones">
          <path
            d="M 98 140 A 105 105 0 0 1 302 140"
            fill="none"
            stroke="#27272a"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Left glowing neon ring pad */}
          <ellipse cx="94" cy="145" rx="12" ry="24" fill="#1c1d22" stroke={color} strokeWidth="2" />
          <ellipse cx="94" cy="145" rx="8" ry="16" fill={color} />
          {/* Right glowing neon ring pad */}
          <ellipse cx="306" cy="145" rx="12" ry="24" fill="#1c1d22" stroke={color} strokeWidth="2" />
          <ellipse cx="306" cy="145" rx="8" ry="16" fill={color} />
          {/* Microphone bar */}
          <path d="M 98 160 Q 115 190, 140 190" stroke="#1c1d22" strokeWidth="3.5" fill="none" />
          <circle cx="140" cy="190" r="4.5" fill={color} />
        </g>
      )}

      {/* Angel's Halo option */}
      {style === 'angel-halo' && (
        <g id="accessory-halo" transform="translate(200, 30) rotate(-6)">
          {/* Glowing oval ring */}
          <ellipse cx="0" cy="0" rx="55" ry="12" fill="none" stroke={color} strokeWidth="5" />
          <ellipse cx="0" cy="0" rx="55" ry="12" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
          {/* Tiny glowing stars */}
          <g opacity="0.8">
            <path d="M -30 -22 L -28 -16 L -22 -14 L -28 -12 L -30 -6 L -32 -12 L -38 -14 L -32 -16 Z" fill="#ffffff" />
            <path d="M 35 -15 L 37 -11 L 42 -9 L 37 -7 L 35 -3 L 33 -7 L 28 -9 L 33 -11 Z" fill="#ffffff" />
          </g>
        </g>
      )}

      {/* Fox Mask (Placed stylishly to the side of head) */}
      {style === 'fox-mask' && (
        <g id="accessory-fox-mask" transform="translate(285, 115) rotate(16) scale(0.68)">
          {/* White base mask */}
          <path
            d="M 0 -60 C -45 -60, -50 0, -45 40 C -40 65, 0 85, 0 85 C 0 85, 40 65, 45 40 C 50 0, 45 -60, 0 -60 Z"
            fill="#ffffff"
            stroke="#1c1917"
            strokeWidth="3.5"
          />
          {/* Fox ears */}
          <path
            d="M -38 -35 L -45 -75 L -12 -52 Z"
            fill="#ffffff"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M -35 -38 L -40 -67 L -16 -50 Z" fill="#ef4444" />
          <path
            d="M 38 -35 L 45 -75 L 12 -52 Z"
            fill="#ffffff"
            stroke="#1c1917"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path d="M 35 -38 L 40 -67 L 16 -50 Z" fill="#ef4444" />
          {/* Traditional kitsune rouge paint patterns */}
          <path
            d="M -25 -5 Q -38 -18, -25 -20 Q -15 -18, -20 -10"
            fill="none"
            stroke="#ef4444"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 25 -5 Q 38 -18, 25 -20 Q 15 -18, 20 -10"
            fill="none"
            stroke="#ef4444"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Fox eyes (closed slits) */}
          <path d="M -28 5 Q -15 0, -8 11" fill="none" stroke="#1c1917" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M 28 5 Q 15 0, 8 11" fill="none" stroke="#1c1917" strokeWidth="4.2" strokeLinecap="round" />
          {/* Tiny cute nose */}
          <polygon points="-4,38 4,38 0,44" fill="#1c1917" />
          {/* Red decorative rope behind mask */}
          <path
            d="M -44 15 C -60 30, -52 65, -45 80"
            stroke="#ef4444"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M 44 15 C 60 30, 52 65, 45 80" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
