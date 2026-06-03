import React from 'react';

export const AccessoryComponent: React.FC<{
  style:
    | 'none'
    | 'headphones'
    | 'horns'
    | 'glasses'
    | 'neko-ears'
    | 'angel-halo'
    | 'fox-mask'
    | 'witch-hat'
    | 'crown'
    | 'bunny-ears';
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

      {/* Witch Hat */}
      {style === 'witch-hat' && (
        <g id="accessory-witch-hat" transform="translate(200, 55)">
          {/* Hat brim */}
          <ellipse cx="0" cy="30" rx="68" ry="12" fill="#1c1917" stroke="#1c1917" strokeWidth="2" />
          <ellipse cx="0" cy="30" rx="64" ry="10" fill={color} />
          {/* Hat cone body */}
          <path
            d="M -45 30 C -40 -15, -15 -55, 0 -75
               C 5 -82, 12 -90, 22 -105
               C 15 -85, 10 -60, 15 -55
               C 40 -15, 45 30, 45 30 Z"
            fill={color}
            stroke="#1c1917"
            strokeWidth="2.5"
          />
          {/* Hat band / ribbon */}
          <path d="M -44 22 Q 0 15, 44 22" stroke="#1c1917" strokeWidth="6" fill="none" />
          <path d="M -42 22 Q 0 16, 42 22" stroke={color} strokeWidth="4" fill="none" />
          {/* Buckle / star decoration */}
          <path
            d="M -5 18 L -3 12 L 3 10 L 9 12 L 11 18 L 9 24 L 3 26 L -3 24 Z"
            fill="#fbbf24"
            stroke="#1c1917"
            strokeWidth="1"
          />
          <circle cx="3" cy="18" r="3" fill="#ffffff" opacity="0.7" />
          {/* Subtle sparkle on hat tip */}
          <circle cx="20" cy="-95" r="2" fill="#ffffff" opacity="0.8" />
          <path d="M 22 -105 L 24 -98 L 18 -100" fill="#fbbf24" opacity="0.7" />
        </g>
      )}

      {/* Royal Crown / Tiara */}
      {style === 'crown' && (
        <g id="accessory-crown" transform="translate(200, 75)">
          {/* Crown base band */}
          <rect x="-38" y="-5" width="76" height="16" rx="2" fill={color} stroke="#b8860b" strokeWidth="2" />
          {/* Crown points / spikes */}
          <path
            d="M -35 -5 L -28 -30 L -18 -12
               L -8 -35 L 0 -15
               L 8 -35 L 18 -12
               L 28 -30 L 35 -5 Z"
            fill={color}
            stroke="#b8860b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Gem stones */}
          <circle cx="-28" cy="-25" r="3" fill="#ef4444" stroke="#b8860b" strokeWidth="1" />
          <circle cx="0" cy="-30" r="4" fill="#3b82f6" stroke="#b8860b" strokeWidth="1" />
          <circle cx="28" cy="-25" r="3" fill="#10b981" stroke="#b8860b" strokeWidth="1" />
          {/* Band jewels */}
          <circle cx="-18" cy="3" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="0" cy="3" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="18" cy="3" r="2.5" fill="#ffffff" opacity="0.8" />
          {/* Sparkle highlights */}
          <circle cx="-8" cy="-30" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="8" cy="-30" r="1.5" fill="#ffffff" opacity="0.9" />
        </g>
      )}

      {/* Bunny Ears */}
      {style === 'bunny-ears' && (
        <g id="accessory-bunny-ears" transform="translate(0, 8)">
          {/* Left bunny ear — tall, slightly curved */}
          <path
            d="M 145 95
               C 130 70, 120 20, 128 -20
               C 132 -40, 148 -45, 155 -30
               C 165 -5, 158 55, 152 80 Z"
            fill={color}
            stroke="#1c1917"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Left inner pink */}
          <path
            d="M 143 70
               C 133 45, 128 5, 133 -15
               C 136 -30, 146 -32, 150 -20
               C 155 0, 152 45, 148 65 Z"
            fill="#ffccd5"
          />
          {/* Right bunny ear */}
          <path
            d="M 255 95
               C 270 70, 280 20, 272 -20
               C 268 -40, 252 -45, 245 -30
               C 235 -5, 242 55, 248 80 Z"
            fill={color}
            stroke="#1c1917"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Right inner pink */}
          <path
            d="M 257 70
               C 267 45, 272 5, 267 -15
               C 264 -30, 254 -32, 250 -20
               C 245 0, 248 45, 252 65 Z"
            fill="#ffccd5"
          />
        </g>
      )}
    </g>
  );
};
