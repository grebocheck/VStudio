import React from 'react';

export const NeckAndShoulders: React.FC<{
  skinColor: string;
  clothingStyle:
    | 'hoodie'
    | 'kimono'
    | 'suit'
    | 'cyber-armor'
    | 'goth-dress'
    | 'druid-cloak'
    | 'sailor-fuku'
    | 'sweater'
    | 'maid'
    | 'idol-stage'
    | 'witch-robe'
    | 'royal-knight'
    | 'cyber-ninja'
    | 'lolita-dress';
  color1: string;
  color2: string;
  angleZ: number;
  bodyX: number;
  neckWidth?: number;
  neckHeight?: number;
  shoulderWidth?: number;
  clothingPrint?: 'none' | 'cat' | 'star' | 'heart' | 'cyber' | 'cross';
  artStyle?: 'classic' | 'anime' | 'retro';
}> = ({
  skinColor,
  clothingStyle,
  color1,
  color2,
  angleZ,
  bodyX,
  neckWidth = 1.0,
  neckHeight = 1.0,
  shoulderWidth = 1.0,
  clothingPrint = 'none',
  artStyle = 'classic',
}) => {
  const neckShadow = 'rgba(0,0,0,0.15)';

  const nw = neckWidth;
  const nh = neckHeight;
  const sw = shoulderWidth;

  const neckTopL = 200 - 18 * nw;
  const neckTopR = 200 + 18 * nw;
  const neckBottomL = 200 - 24 * nw;
  const neckBottomR = 200 + 24 * nw;

  const neckYTop = 195;
  const neckYBottom = 285 + (nh - 1.0) * 15;

  const torsoTransform = `scale(${sw}, 1.0)`;

  return (
    <g
      style={{ transform: `translateX(${bodyX * 0.52}px) rotate(${angleZ * 0.22}deg)`, transformOrigin: '200px 320px' }}
    >
      {/* Neck base */}
      <path
        d={`M${neckTopL} ${neckYTop} L${neckBottomL} ${neckYBottom} L${neckBottomR} ${neckYBottom} L${neckTopR} ${neckYTop} Z`}
        fill={skinColor}
      />

      {/* Fitted neck shadow */}
      <path
        d={`M${neckTopL} ${neckYTop} L${200 - 19 * nw} ${240 + nh * 8} C190 ${245 + nh * 10}, 210 ${245 + nh * 10}, ${200 + 19 * nw} ${240 + nh * 8} L${neckTopR} ${neckYTop} Z`}
        fill={neckShadow}
      />

      {/* Kyoto Animation/DxD sharp anime neck shadow */}
      {artStyle === 'anime' && (
        <path
          d={`M 191 ${neckYTop + 24} L 200 ${neckYTop + 65} L 209 ${neckYTop + 24} Z`}
          fill="rgba(15, 23, 42, 0.23)"
        />
      )}

      {/* Shoulder garments */}
      <g style={{ transform: torsoTransform, transformOrigin: '200px 380px' }}>
        {/* Hoodie option */}
        {clothingStyle === 'hoodie' && (
          <g id="torso-hoodie">
            {/* Ambient drop shadow behind hoodie fold */}
            <path d="M115 285 C95 325, 30 375, 0 405 L400 405 C370 375, 305 325, 285 285 Z" fill="rgba(0,0,0,0.2)" />
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill={color1} />
            {/* Outer hoodie fold stitch */}
            <path d="M125 280 C110 325, 60 365, 0 395" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
            <path d="M275 280 C290 325, 340 365, 400 395" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
            {/* Hood interior with soft lining gradient effect */}
            <path d="M140 270 C150 250, 250 250, 260 270 C280 290, 120 290, 140 270 Z" fill={color2} opacity="0.9" />
            <path d="M146 272 C154 256, 246 256, 254 272 C270 286, 130 286, 146 272 Z" fill="rgba(0,0,0,0.15)" />
            {/* High-quality drawstrings with physical visual depth */}
            <path
              d="M 183 274 Q 175 305, 185 330"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 183 274 Q 175 305, 185 330" stroke={color2} strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="185" cy="333" r="5.5" fill={color2} />
            <circle cx="185" cy="333" r="3.5" fill="rgba(0,0,0,0.15)" />

            <path
              d="M 217 274 Q 225 300, 215 320"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 217 274 Q 225 300, 215 320" stroke={color2} strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="215" cy="323" r="5.5" fill={color2} />
            <circle cx="215" cy="323" r="3.5" fill="rgba(0,0,0,0.15)" />
          </g>
        )}

        {/* Kimono option */}
        {clothingStyle === 'kimono' && (
          <g id="torso-kimono">
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill={color1} />
            {/* Delicate multi-layered shadow collar */}
            <path
              d="M165 270 L200 320 L235 270"
              stroke="rgba(0,0,0,0.22)"
              strokeWidth="15"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M165 270 L200 320 L235 270" stroke={color2} strokeWidth="11" fill="none" strokeLinecap="round" />
            <path d="M175 270 L200 310 L225 270" stroke="#ffffff" strokeWidth="4" fill="none" />
            {/* Patterned Obi/Belt with highlights */}
            <path d="M150 340 H250 V400 H150 Z" fill={color2} />
            <path d="M150 344 H250" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
            <path d="M150 370 H250 V385 H150 Z" fill="rgba(0,0,0,0.06)" />
          </g>
        )}

        {/* Suit option */}
        {clothingStyle === 'suit' && (
          <g id="torso-suit">
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill={color1} />
            {/* White dress shirt collared V */}
            <path d="M170 270 L200 320 L230 270 Z" fill="#ffffff" />
            <path d="M170 270 L200 320" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
            {/* Classic Necktie or Bowtie */}
            <g id="neck-tie-dxd">
              <path d="M194 285 L188 355 L200 365 L212 355 L206 285 Z" fill={color2} />
              {/* Tie Knot */}
              <path d="M193 280 H207 L204 293 H196 Z" fill="rgba(0,0,0,0.12)" />
              <path d="M194 278 H206 L203 291 H197 Z" fill={color2} />
            </g>
            {/* High-quality folded lapels */}
            <path d="M155 270 L180 315 L165 345 L130 295 Z" fill="rgba(0,0,0,0.18)" />
            <path d="M152 270 L177 315 L163 344 L129 295 Z" fill={color1} />

            <path d="M245 270 L220 315 L235 345 L270 295 Z" fill="rgba(0,0,0,0.18)" />
            <path d="M248 270 L223 315 L237 344 L271 295 Z" fill={color1} />
          </g>
        )}

        {/* Cyber-armor option */}
        {clothingStyle === 'cyber-armor' && (
          <g id="torso-cyber">
            {/* Dark base chassis with metallic sheen */}
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill="#151421" />
            <path d="M130 285 C115 320, 60 365, 10 395" stroke="#1d1b33" strokeWidth="4" fill="none" />
            {/* Modular armor plating */}
            <path d="M130 290 L180 300 L180 360 L120 370 Z" fill={color1} stroke="#09090f" strokeWidth="2.5" />
            <path d="M270 290 L220 300 L220 360 L280 370 Z" fill={color1} stroke="#09090f" strokeWidth="2.5" />
            {/* Plaquing highlight lines */}
            <path d="M135 296 L175 304 L175 354 L127 362 Z" fill="rgba(255,255,255,0.06)" />
            <path d="M265 296 L225 304 L225 354 L273 362 Z" fill="rgba(255,255,255,0.06)" />
            {/* Center glowing Reactor Core */}
            <circle cx="200" cy="330" r="19" fill="#08080d" stroke="rgba(0,0,0,0.4)" strokeWidth="4" />
            <circle cx="200" cy="330" r="15" fill="#09090f" stroke={color2} strokeWidth="3.2" />
            <circle cx="200" cy="330" r="9" fill="#ffffff" filter="drop-shadow(0 0 4px #ffffff)" />
            <circle cx="200" cy="330" r="5" fill={color2} />
            {/* Glowing neon technical circuitry stripes */}
            <path d="M135 310 H170" stroke={color2} strokeWidth="3" strokeLinecap="round" />
            <path d="M265 310 H230" stroke={color2} strokeWidth="3" strokeLinecap="round" />
            <path d="M140 325 H160" stroke={color2} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
            <path d="M260 325 H240" stroke={color2} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {/* Gothic Dress option */}
        {clothingStyle === 'goth-dress' && (
          <g id="torso-goth">
            {/* Dark dress body with subtle fabric shadows */}
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill={color1} />
            {/* Frilly lace shoulder pads with custom loops */}
            <path
              d="M 103 293 C 118 276, 142 276, 153 303"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="3.2"
              fill="none"
              strokeDasharray="4 2"
            />
            <path d="M 103 293 C 118 276, 142 276, 153 303" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none" />
            <path
              d="M 297 293 C 282 276, 258 276, 247 303"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="3.2"
              fill="none"
              strokeDasharray="4 2"
            />
            <path d="M 297 293 C 282 276, 258 276, 247 303" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" fill="none" />

            {/* Detailed lace chest collar scoop */}
            <path d="M165 270 Q200 297, 235 270" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeDasharray="3 3" />
            {/* Beautiful bodice corset center panels */}
            <path d="M 175 300 H 225 L 216 400 H 184 Z" fill="rgba(0,0,0,0.3)" />
            <path d="M 175 300 H 225 L 216 400 H 184 Z" fill={color2} opacity="0.94" />
            {/* Perfect cross-lace details */}
            <path
              d="M185 311 L215 331 M215 311 L185 331 M185 337 L215 357 M215 337 L185 357 M185 363 L215 383 M215 363 L185 383"
              stroke={color1}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Large satin bow tie on chest */}
            <g transform="translate(200, 295) scale(1.15)">
              <circle cx="0" cy="0" r="5.5" fill="#f43f5e" />
              {/* Left loop */}
              <path d="M 0 0 C -18 -12, -18 12, 0 0 Z" fill="#e11d48" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
              <path d="M -2 -1 C -12 -6, -12 6, -2 -1 Z" fill="#fda4af" opacity="0.4" />
              {/* Right loop */}
              <path d="M 0 0 C 18 -12, 18 12, 0 0 Z" fill="#e11d48" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
              <path d="M 2 -1 C 12 -6, 12 6, 2 -1 Z" fill="#fda4af" opacity="0.4" />
              {/* Ribbon tails */}
              <path d="M -3 3 L -11 22 L -3 18 L 0 5 Z" fill="#e11d48" />
              <path d="M 3 3 L 11 22 L 3 18 L 0 5 Z" fill="#e11d48" />
            </g>
          </g>
        )}

        {/* Druid Cloak option */}
        {clothingStyle === 'druid-cloak' && (
          <g id="torso-druid">
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill={color1} />
            {/* Flawless high-res leafy shoulder layers */}
            <path
              d="M115 285 C110 300, 130 320, 155 310 C165 300, 150 285, 125 285 Z"
              fill={color2}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="1.2"
            />
            <path d="M120 288 Q135 301, 150 298" stroke="rgba(0,0,0,0.08)" strokeWidth="1.8" fill="none" />

            <path
              d="M285 285 C290 300, 270 320, 245 310 C235 300, 250 285, 275 285 Z"
              fill={color2}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="1.2"
            />
            <path d="M280 288 Q265 301, 250 298" stroke="rgba(0,0,0,0.08)" strokeWidth="1.8" fill="none" />

            {/* Elegant wood clasp buttons and connecting heavy rope cord */}
            <path d="M 175 290 Q 200 298, 225 290" stroke="#451a03" strokeWidth="4.2" fill="none" />
            <path
              d="M 175 290 Q 200 298, 225 290"
              stroke="#f59e0b"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="3 3"
            />

            <circle cx="200" cy="292" r="9" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <circle cx="197" cy="292" r="1.8" fill="#ffffff" />
            <circle cx="203" cy="292" r="1.8" fill="#ffffff" />
          </g>
        )}

        {/* Sailor-School Uniform (High School DxD favorite style!) */}
        {clothingStyle === 'sailor-fuku' && (
          <g id="torso-sailor">
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill={color2} />{' '}
            {/* immaculate white linen fabric */}
            <path d="M125 280 C110 325, 60 365, 0 395" stroke="rgba(0,0,0,0.04)" strokeWidth="2.5" fill="none" />
            <path d="M275 280 C290 325, 340 365, 400 395" stroke="rgba(0,0,0,0.04)" strokeWidth="2.5" fill="none" />
            {/* Classic Sailor Marine-Blue Collar Flap */}
            <path d="M140 280 L200 330 L260 280 L285 295 L200 350 L115 295 Z" fill={color1} />
            <path d="M148 283 L200 325 L252 283" stroke="#ffffff" strokeWidth="2.8" fill="none" />
            {/* Double stitch line on marine dress */}
            <path d="M143 285 L200 329 L257 285" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.6" />
            {/* Animated flowing Silk Bow ribbon */}
            <g id="sailor-bow-dxd" transform="translate(200, 332)">
              <circle cx="0" cy="0" r="5.5" fill="#e11d48" />
              {/* Left wide loop */}
              <path d="M 0 0 C -15 -8, -18 12, 0 0 Z" fill="#f43f5e" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
              {/* Right wide loop */}
              <path d="M 0 0 C 15 -8, 18 12, 0 0 Z" fill="#f43f5e" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
              {/* Tails cascading down with realistic visual weight */}
              <path d="M -4 2 C -8 15, -28 35, -28 35 L -10 24 L -1 4 Z" fill="#e11d48" />
              <path d="M 4 2 C 8 15, 28 35, 28 35 L 10 24 L 1 4 Z" fill="#e11d48" />
            </g>
          </g>
        )}

        {/* Cozy oversized Sweater option */}
        {clothingStyle === 'sweater' && (
          <g id="torso-sweater">
            {/* Base heavy knit body */}
            <path d="M125 275 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 275 Z" fill={color1} />
            {/* Oversized turtleneck knit collar */}
            <rect x="160" y="258" width="80" height="26" rx="8" fill={color1} stroke={color2} strokeWidth="2" />
            {/* Ribbed neck stitches vertical detail */}
            <line x1="170" y1="260" x2="170" y2="282" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" />
            <line x1="180" y1="260" x2="180" y2="282" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" />
            <line x1="190" y1="260" x2="190" y2="282" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" />
            <line x1="200" y1="260" x2="200" y2="282" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" />
            <line x1="210" y1="260" x2="210" y2="282" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" />
            <line x1="220" y1="260" x2="220" y2="282" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" />
            <line x1="230" y1="260" x2="230" y2="282" stroke="rgba(0,0,0,0.14)" strokeWidth="2.5" />
            {/* Ribbed texture overlays along the cozy body curves */}
            <path
              d="M 85 315 C 130 318, 270 318, 315 315 L 320 327 C 270 330, 130 330, 80 327 Z"
              fill={color2}
              opacity="0.8"
            />
            <path
              d="M 75 352 C 120 355, 280 355, 325 352 L 330 364 C 280 367, 120 367, 70 364 Z"
              fill={color2}
              opacity="0.8"
            />
          </g>
        )}

        {/* Elegant Gothic Maid Dress option */}
        {clothingStyle === 'maid' && (
          <g id="torso-maid">
            {/* Dark Dress Base */}
            <path d="M125 275 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 275 Z" fill={color1} />

            {/* White Maid Apron Bib over the center */}
            <path d="M152 295 L248 295 L238 400 L162 400 Z" fill={color2} stroke="rgba(0,0,0,0.06)" />

            {/* Beautiful pleated shoulder straps/lace (white outline frills) */}
            <path
              d="M 112 284 C 122 268, 142 268, 148 295"
              stroke={color2}
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 112 284 C 122 268, 142 268, 148 295" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" fill="none" />
            <path
              d="M 112 284 C 122 268, 142 268, 148 295"
              stroke={color2}
              strokeWidth="3"
              strokeDasharray="3 2"
              fill="none"
            />

            <path
              d="M 288 284 C 278 268, 258 268, 252 295"
              stroke={color2}
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M 288 284 C 278 268, 258 268, 252 295" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" fill="none" />
            <path
              d="M 288 284 C 278 268, 258 268, 252 295"
              stroke={color2}
              strokeWidth="3"
              strokeDasharray="3 2"
              fill="none"
            />

            {/* Pleated frilly borders on the apron bib sides */}
            <path d="M152 295 Q145 340, 162 400" stroke={color2} strokeWidth="4" strokeDasharray="4 2" fill="none" />
            <path d="M248 295 Q255 340, 238 400" stroke={color2} strokeWidth="4" strokeDasharray="4 2" fill="none" />

            {/* Collar frills at the neck */}
            <path d="M162 278 Q200 294, 238 278" stroke={color2} strokeWidth="6.5" fill="none" strokeLinecap="round" />
            <path d="M162 278 Q200 294, 238 278" stroke="rgba(0,0,0,0.12)" strokeWidth="2.5" fill="none" />
            <path d="M165 278 Q200 294, 235 278" stroke="#ffffff" strokeWidth="4" strokeDasharray="3 2" fill="none" />

            {/* Corset-style cross ribbons or lace on the center apron */}
            <path
              d="M172 315 L228 315 M174 335 L226 335 M176 355 L224 355"
              stroke={color1}
              strokeWidth="1.5"
              opacity="0.15"
            />

            {/* A gorgeous red satin bow on the collar (DxD icon!) */}
            <g transform="translate(200, 296) scale(1.1)">
              <circle cx="0" cy="0" r="5" fill="#f43f5e" />
              {/* Left loop */}
              <path d="M 0 0 C -16 -10, -16 10, 0 0 Z" fill="#e11d48" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
              <path d="M -2 -1 C -11 -5, -11 5, -2 -1 Z" fill="#fda4af" opacity="0.45" />
              {/* Right loop */}
              <path d="M 0 0 C 18 -10, 18 10, 0 0 Z" fill="#e11d48" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
              <path d="M 2 -1 C 11 -5, 11 5, 2 -1 Z" fill="#fda4af" opacity="0.45" />
              {/* Tails */}
              <path d="M -3 3 L -9 18 L -3 15 L 0 4 Z" fill="#e11d48" />
              <path d="M 3 3 L 9 18 L 3 15 L 0 4 Z" fill="#e11d48" />
            </g>
          </g>
        )}

        {/* Sparkling Idol Stage Costume */}
        {clothingStyle === 'idol-stage' && (
          <g id="torso-idol">
            {/* Base fabric — gradient from vibrant primary to accent */}
            <path d="M125 275 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 275 Z" fill={color1} />
            {/* Glittering ruffle layers */}
            <path
              d="M100 330 C130 320, 170 328, 200 318 C230 328, 270 320, 300 330 L310 345 C270 335, 230 343, 200 333 C170 343, 130 335, 90 345 Z"
              fill={color2}
              opacity="0.9"
            />
            <path
              d="M85 365 C125 355, 170 363, 200 353 C230 363, 275 355, 315 365 L322 378 C275 370, 230 375, 200 368 C170 375, 125 370, 78 378 Z"
              fill={color2}
              opacity="0.85"
            />
            {/* Ribbon / bow neckline */}
            <g transform="translate(200, 292) scale(1.2)">
              <circle cx="0" cy="0" r="5" fill={color2} />
              <path d="M 0 0 C -18 -10, -18 10, 0 0 Z" fill={color2} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
              <path d="M 0 0 C 18 -10, 18 10, 0 0 Z" fill={color2} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
              <path d="M -3 3 L -10 20 L -3 16 L 0 4 Z" fill={color2} />
              <path d="M 3 3 L 10 20 L 3 16 L 0 4 Z" fill={color2} />
            </g>
            {/* Sparkle gems on the bodice */}
            <circle cx="175" cy="310" r="2.5" fill="#ffffff" opacity="0.9" />
            <circle cx="225" cy="310" r="2.5" fill="#ffffff" opacity="0.9" />
            <circle cx="200" cy="305" r="3" fill="#ffffff" opacity="0.85" />
            {/* Shoulder puff sleeves */}
            <ellipse cx="118" cy="286" rx="18" ry="12" fill={color2} stroke={color1} strokeWidth="1.5" />
            <ellipse cx="282" cy="286" rx="18" ry="12" fill={color2} stroke={color1} strokeWidth="1.5" />
          </g>
        )}

        {/* Mystical Witch Robe */}
        {clothingStyle === 'witch-robe' && (
          <g id="torso-witch">
            {/* Deep dark robe body */}
            <path d="M125 275 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 275 Z" fill={color1} />
            {/* Hood collar (pushed back) */}
            <path d="M140 268 C155 245, 245 245, 260 268 C275 285, 125 285, 140 268 Z" fill={color1} />
            <path d="M145 270 C158 252, 242 252, 255 270 C268 282, 132 282, 145 270 Z" fill="rgba(0,0,0,0.25)" />
            {/* Mystical inner collar glow */}
            <path d="M160 272 Q200 290, 240 272" stroke={color2} strokeWidth="2" fill="none" opacity="0.8" />
            {/* Magical star/moon embroidery patterns */}
            <path
              d="M200 320 L203 328 L212 328 L205 333 L208 342 L200 337 L192 342 L195 333 L188 328 L197 328 Z"
              fill={color2}
              opacity="0.85"
            />
            <circle cx="165" cy="345" r="4" fill="none" stroke={color2} strokeWidth="1.5" opacity="0.6" />
            <path d="M162 345 L168 345 M165 342 L165 348" stroke={color2} strokeWidth="1" opacity="0.5" />
            <circle cx="235" cy="350" r="3.5" fill="none" stroke={color2} strokeWidth="1.5" opacity="0.6" />
            {/* Flowing hem with magical particles */}
            <path
              d="M80 390 Q140 375, 200 385 Q260 375, 320 390"
              stroke={color2}
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
              strokeDasharray="4 3"
            />
            {/* Belt / clasp */}
            <rect x="180" y="290" width="40" height="8" rx="2" fill={color2} />
            <circle cx="200" cy="294" r="4" fill={color1} stroke={color2} strokeWidth="1.5" />
          </g>
        )}

        {/* Royal Knight option */}
        {clothingStyle === 'royal-knight' && (
          <g id="torso-royal-knight">
            {/* Base tunic */}
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill={color1} />
            {/* Metallic Pauldrons (Shoulder Armor) */}
            <path d="M100 280 Q 70 300, 50 340 L 120 330 Z" fill={color2} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
            <path d="M300 280 Q 330 300, 350 340 L 280 330 Z" fill={color2} stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
            <path d="M100 280 Q 70 300, 50 340 L 120 330 Z" fill="url(#anime-iris-overlay-l)" opacity="0.5" />
            <path d="M300 280 Q 330 300, 350 340 L 280 330 Z" fill="url(#anime-iris-overlay-r)" opacity="0.5" />
            {/* Chest Plate */}
            <path
              d="M150 280 L200 320 L250 280 L230 400 L170 400 Z"
              fill="#e2e8f0"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="3"
            />
            <path d="M150 280 L200 320 L250 280 L230 400 L170 400 Z" fill="url(#anime-iris-overlay-l)" opacity="0.3" />
            {/* Golden trim & accents */}
            <path d="M165 280 L200 310 L235 280" stroke="#fbbf24" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M200 320 V400" stroke="#fbbf24" strokeWidth="4" />
            <circle cx="200" cy="340" r="10" fill="#fbbf24" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
            <circle cx="200" cy="340" r="4" fill="#ef4444" />
            {/* Cape attached to shoulders */}
            <path d="M 120 330 Q 80 400, 80 400 L 130 400 Z" fill="#991b1b" />
            <path d="M 280 330 Q 320 400, 320 400 L 270 400 Z" fill="#991b1b" />
          </g>
        )}

        {/* Cyber Ninja option */}
        {clothingStyle === 'cyber-ninja' && (
          <g id="torso-cyber-ninja">
            {/* Stealth base suit */}
            <path d="M125 280 C105 320, 40 370, 0 400 L400 400 C360 370, 295 320, 275 280 Z" fill="#0f172a" />
            {/* Tech harness straps */}
            <path d="M 150 280 L 120 400" stroke="#334155" strokeWidth="12" />
            <path d="M 250 280 L 280 400" stroke="#334155" strokeWidth="12" />
            <path d="M 100 320 L 300 340" stroke="#334155" strokeWidth="10" />
            {/* Glowing neon elements */}
            <path d="M 150 280 L 120 400" stroke={color2} strokeWidth="3" opacity="0.8" />
            <path d="M 250 280 L 280 400" stroke={color2} strokeWidth="3" opacity="0.8" />
            <circle cx="206" cy="330" r="18" fill="#1e293b" stroke="#334155" strokeWidth="4" />
            <path d="M 195 325 L 217 335 M 195 335 L 217 325" stroke={color2} strokeWidth="3" strokeLinecap="round" />
            <circle cx="206" cy="330" r="12" fill="none" stroke={color2} strokeWidth="2" strokeDasharray="4 4" />
            {/* Tactical high collar */}
            <path
              d="M 160 270 L 200 300 L 240 270 L 245 250 L 155 250 Z"
              fill="#1e293b"
              opacity="0.9"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="2"
            />
            {/* Asymmetric shoulder armor */}
            <path d="M 125 280 L 70 310 L 90 350 L 135 320 Z" fill={color1} />
            <path d="M 120 295 L 80 320" stroke={color2} strokeWidth="3" />
          </g>
        )}

        {/* Lolita Dress option */}
        {clothingStyle === 'lolita-dress' && (
          <g id="torso-lolita">
            {/* Puffy dress base */}
            <path d="M125 280 C 105 320, 20 350, 0 400 L400 400 C 380 350, 295 320, 275 280 Z" fill={color1} />

            {/* Lace Peter Pan Collar */}
            <path
              d="M 160 270 Q 180 310, 200 290 Q 220 310, 240 270"
              fill="#ffffff"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="2"
            />
            <path
              d="M 160 270 Q 180 310, 200 290 Q 220 310, 240 270"
              fill="none"
              stroke={color2}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Ruffled Shoulder Puffs */}
            <path d="M 130 280 C 100 260, 60 290, 80 340 C 110 330, 130 310, 140 290 Z" fill={color1} />
            <path d="M 270 280 C 300 260, 340 290, 320 340 C 290 330, 270 310, 260 290 Z" fill={color1} />
            {/* Shoulder puff highlights */}
            <path d="M 110 285 Q 90 300, 95 325" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" />
            <path d="M 290 285 Q 310 300, 305 325" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" />

            {/* Center Corset Bodice */}
            <path d="M 175 290 L 165 400 L 235 400 L 225 290 Z" fill="rgba(0,0,0,0.2)" />
            {/* Criss-cross ribbons on bodice */}
            <path
              d="M 172 310 L 228 330 M 228 310 L 172 330 M 170 350 L 230 370 M 230 350 L 170 370"
              stroke={color2}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Big center ribbon */}
            <g transform="translate(200, 300)">
              <path d="M 0 0 C -20 -15, -40 5, 0 10 Z" fill={color2} />
              <path d="M 0 0 C 20 -15, 40 5, 0 10 Z" fill={color2} />
              <circle cx="0" cy="5" r="6" fill="#ffffff" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              <path d="M -5 8 L -15 35 L -5 32 L 0 10 Z" fill={color2} opacity="0.9" />
              <path d="M 5 8 L 15 35 L 5 32 L 0 10 Z" fill={color2} opacity="0.9" />
            </g>
          </g>
        )}

        {/* Embellished decals / Prints overlay */}
        {clothingPrint && clothingPrint !== 'none' && (
          <g id="clothing-print-stamp" opacity="0.9">
            {clothingPrint === 'cat' && (
              <g transform="translate(0, 5)">
                <path
                  d="M190 322 L182 310 L192 314 L208 314 L218 310 L210 322 C215 326, 215 335, 210 338 C205 341, 195 341, 190 338 C185 335, 185 326, 190 322 Z"
                  fill={color2}
                />
                <circle cx="196" cy="326" r="1.5" fill="#000000" opacity="0.3" />
                <circle cx="204" cy="326" r="1.5" fill="#000000" opacity="0.3" />
              </g>
            )}
            {clothingPrint === 'star' && (
              <path
                d="M200 315 L204 326 L216 326 L207 332 L210 344 L200 337 L190 344 L193 332 L184 326 L196 326 Z"
                fill={color2}
              />
            )}
            {clothingPrint === 'heart' && (
              <path
                d="M200 338 C191 327, 185 320, 190 313 C195 306, 200 315, 200 315 C200 315, 205 306, 210 313 C215 320, 209 327, 200 338 Z"
                fill="#ef4444"
              />
            )}
            {clothingPrint === 'cyber' && (
              <g>
                <rect x="187" y="318" width="26" height="15" rx="3.5" fill="none" stroke={color2} strokeWidth="2.5" />
                <circle cx="200" cy="325.5" r="3.5" fill={color2} />
              </g>
            )}
            {clothingPrint === 'cross' && (
              <path d="M197 313 H203 V321 H211 V327 H203 V342 H197 V327 H189 V321 H197 Z" fill={color2} />
            )}
          </g>
        )}
      </g>
    </g>
  );
};
