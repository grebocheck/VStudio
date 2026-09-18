import React from 'react';

export const HairComponent: React.FC<{
  bangStyle:
    | 'classic'
    | 'side'
    | 'center-part'
    | 'short'
    | 'hime'
    | 'spiky'
    | 'curly-bangs'
    | 'cross-bangs'
    | 'wolf-cut'
    | 'curtain-bangs'
    | 'asymmetric'
    | 'blunt-bangs'
    | 'messy'
    | 'braided-bangs';
  backStyle:
    | 'straight'
    | 'tails'
    | 'short'
    | 'curly'
    | 'braids'
    | 'hime-long'
    | 'drill-tails'
    | 'wavy'
    | 'ponytail'
    | 'bun'
    | 'side-tail'
    | 'twintail-long'
    | 'messy-bun'
    | 'fishtail-braid'
    | 'layered';
  color: string;
  highlightColor: string;
  angleY: number;
  breath: number;
  hairSwayX?: number;
  hairSwayY?: number;
  artStyle?: 'classic' | 'anime' | 'retro';
}> = ({ backStyle, color, highlightColor, hairSwayX = 0, hairSwayY = 0, artStyle = 'classic' }) => {
  const bounce = 0;
  const tailSway = 0;
  const isAnime = artStyle === 'anime';

  return (
    <>
      {/* --- BACK HAIR (Renders BEHIND the head layer) --- */}
      {backStyle === 'straight' && (
        <g
          style={{
            transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${hairSwayX * 0.12}deg)`,
            transformOrigin: '200px 100px',
          }}
        >
          <path
            d="M100 130 C70 170, 75 290, 85 360 C100 360, 110 320, 120 280 L280 280 C290 320, 300 360, 315 360 C325 290, 330 170, 300 130 Z"
            fill={color}
          />
          {isAnime && (
            <>
              {/* Darker interior occlusion volume for DxD style */}
              <path
                d="M120 160 C100 200, 105 280, 115 340 L285 340 C295 280, 300 200, 280 160 Z"
                fill="rgba(0,0,0,0.14)"
              />
              <path d="M140 160 Q120 230, 142 320" stroke="rgba(0,0,0,0.06)" strokeWidth="3" fill="none" />
              <path d="M260 160 Q280 230, 258 320" stroke="rgba(0,0,0,0.06)" strokeWidth="3" fill="none" />
            </>
          )}
        </g>
      )}

      {backStyle === 'curly' && (
        <path
          d="M105 130 
             C65 160, 55 240, 75 280 
             C60 300, 65 340, 80 345
             C100 350, 115 330, 120 300
             L280 300
             C285 330, 300 350, 320 345
             C335 340, 340 300, 325 280
             C345 240, 335 160, 295 130 Z"
          fill={color}
          style={{
            transform: `scaleY(${1 + bounce * 0.005 + hairSwayY * 0.01}) scaleX(${1 - hairSwayY * 0.004}) rotate(${hairSwayX * 0.15}deg)`,
            transformOrigin: '200px 100px',
          }}
        />
      )}

      {backStyle === 'drill-tails' && (
        <g id="hair-drill-tails">
          <g
            style={{
              transform: `scaleY(${1 + bounce * 0.005 + hairSwayY * 0.012}) rotate(${tailSway + hairSwayX * 1.15}deg)`,
              transformOrigin: '110px 130px',
            }}
          >
            <path
              d="M110 120 C100 120, 60 140, 50 180 C40 220, 65 240, 45 280 C30 310, 55 350, 70 340 C85 330, 65 285, 80 250 C95 215, 78 190, 85 160 C92 130, 105 125, 110 120 Z"
              fill={color}
            />
            <path
              d="M85 160 C65 175, 48 210, 58 230"
              stroke={highlightColor}
              strokeWidth="2.5"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M78 220 C55 242, 42 270, 52 290"
              stroke={highlightColor}
              strokeWidth="2.5"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M68 280 C45 305, 48 322, 60 330"
              stroke={highlightColor}
              strokeWidth="2"
              fill="none"
              opacity="0.65"
            />
          </g>

          <g
            style={{
              transform: `scaleY(${1 + bounce * 0.005 + hairSwayY * 0.012}) rotate(${-tailSway + hairSwayX * 1.15}deg)`,
              transformOrigin: '290px 130px',
            }}
          >
            <path
              d="M290 120 C300 120, 340 140, 350 180 C360 220, 335 240, 355 280 C370 310, 345 350, 330 340 C315 330, 335 285, 320 250 C305 215, 322 190, 315 160 C308 130, 295 125, 290 120 Z"
              fill={color}
            />
            <path
              d="M315 160 C335 175, 352 210, 342 230"
              stroke={highlightColor}
              strokeWidth="2.5"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M322 220 C345 242, 358 270, 348 290"
              stroke={highlightColor}
              strokeWidth="2.5"
              fill="none"
              opacity="0.65"
            />
            <path
              d="M332 280 C355 305, 352 322, 340 330"
              stroke={highlightColor}
              strokeWidth="2"
              fill="none"
              opacity="0.65"
            />
          </g>

          <g
            style={{
              transform: `rotate(${hairSwayX * 0.8}deg)`,
              transformOrigin: '104px 132px',
              transition: 'transform 0.1s ease-out',
            }}
          >
            <circle cx="104" cy="132" r="6" fill={highlightColor} />
          </g>
          <g
            style={{
              transform: `rotate(${hairSwayX * 0.8}deg)`,
              transformOrigin: '296px 132px',
              transition: 'transform 0.1s ease-out',
            }}
          >
            <circle cx="296" cy="132" r="6" fill={highlightColor} />
          </g>
        </g>
      )}

      {backStyle === 'wavy' && (
        <g
          id="hair-wavy"
          style={{
            transform: `scaleY(${1 + hairSwayY * 0.01}) rotate(${hairSwayX * 0.15}deg)`,
            transformOrigin: '200px 100px',
          }}
        >
          <path
            d="M108 117 C78 150 72 192 80 232 C90 277 48 296 62 336 C67 352 82 367 92 364 C103 354 111 337 112 316 C114 281 108 242 121 204 L279 204 C292 242 286 281 288 316 C289 337 297 354 308 364 C318 367 333 352 338 336 C352 296 310 277 320 232 C328 192 322 150 292 117 Z"
            fill={color}
            stroke="rgba(29,22,41,0.3)"
            strokeWidth="1.4"
          />
          {[false, true].map((mirror) => (
            <g key={String(mirror)} transform={mirror ? 'translate(400 0) scale(-1 1)' : undefined}>
              <path
                d="M101 150 C81 195 100 216 97 247 C96 283 68 306 76 331 C74 307 107 284 107 249 C113 218 91 191 108 152 Z"
                fill={highlightColor}
                opacity="0.18"
              />
              <path
                d="M94 175 C84 208 100 232 93 261 C88 288 69 307 72 326"
                stroke={highlightColor}
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                opacity="0.27"
              />
              <path
                d="M111 201 C100 246 119 293 94 347"
                stroke="rgba(24,18,38,0.26)"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M88 285 C77 311 90 331 86 350"
                stroke="rgba(24,18,38,0.2)"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      )}

      {backStyle === 'tails' && (
        <g id="hair-tails">
          {/* Left twin-tail */}
          <path
            d="M110 120 
               C80 120, 35 150, 30 220 
               C26 270, 48 310, 40 340
               C55 335, 65 290, 60 220
               C58 190, 85 150, 95 140 Z"
            fill={color}
            style={{
              transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${tailSway + hairSwayX * 1.15}deg)`,
              transformOrigin: '110px 130px',
            }}
          />
          {/* Right twin-tail */}
          <path
            d="M290 120 
               C320 120, 365 150, 370 220 
               C374 270, 352 310, 360 340
               C345 335, 335 290, 340 220
               C342 190, 315 150, 305 140 Z"
            fill={color}
            style={{
              transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${-tailSway + hairSwayX * 1.15}deg)`,
              transformOrigin: '290px 130px',
            }}
          />

          <g
            style={{
              transform: `rotate(${hairSwayX * 0.8}deg)`,
              transformOrigin: '104px 132px',
              transition: 'transform 0.1s ease-out',
            }}
          >
            <circle cx="104" cy="132" r="6" fill={highlightColor} />
          </g>
          <g
            style={{
              transform: `rotate(${hairSwayX * 0.8}deg)`,
              transformOrigin: '296px 132px',
              transition: 'transform 0.1s ease-out',
            }}
          >
            <circle cx="296" cy="132" r="6" fill={highlightColor} />
          </g>
        </g>
      )}

      {backStyle === 'short' && (
        <path d="M110 130 C100 160, 90 200, 105 230 Q200 240, 295 230 C310 200, 300 160, 290 130 Z" fill={color} />
      )}

      {backStyle === 'braids' && (
        <g id="hair-braids">
          <path d="M105 130 C95 160, 70 240, 75 330 C80 340, 90 340, 90 310 C85 240, 105 170, 115 130 Z" fill={color} />
          <path
            d="M 100 150 Q 85 160, 95 180 Q 80 190, 90 210 Q 75 220, 85 240 Q 70 255, 80 275 Q 65 290, 75 310"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="3"
            fill="none"
          />

          <path
            d="M295 130 C305 160, 330 240, 325 330 C320 340, 310 340, 310 310 C315 240, 295 170, 285 130 Z"
            fill={color}
          />
          <path
            d="M 300 150 Q 315 160, 305 180 Q 320 190, 310 210 Q 325 220, 315 240 Q 330 255, 320 275 Q 335 290, 325 310"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="3"
            fill="none"
          />

          <rect x="68" y="305" width="14" height="6" fill={highlightColor} rx="1" />
          <rect x="318" y="305" width="14" height="6" fill={highlightColor} rx="1" />
        </g>
      )}

      {backStyle === 'hime-long' && (
        <g id="hair-hime-long">
          <path d="M100 130 C80 170, 75 240, 72 380 L328 380 C325 240, 320 170, 300 130 Z" fill={color} />
          {isAnime ? (
            <>
              {/* Flawless shaded secondary overlap layers */}
              <path
                d="M115 170 C95 210, 95 290, 92 380 L308 380 C305 290, 305 210, 285 170 Z"
                fill="rgba(0,0,0,0.13)"
              />
              <path d="M130 180 Q105 260, 112 370" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" fill="none" />
              <path d="M270 180 Q295 260, 288 370" stroke="rgba(0,0,0,0.08)" strokeWidth="3.5" fill="none" />
              <path d="M152 190 Q125 275, 134 375" stroke="rgba(0,0,0,0.05)" strokeWidth="2.5" fill="none" />
              <path d="M248 190 Q275 275, 266 375" stroke="rgba(0,0,0,0.05)" strokeWidth="2.5" fill="none" />
            </>
          ) : (
            <>
              <line x1="120" y1="200" x2="120" y2="385" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
              <line x1="280" y1="200" x2="280" y2="385" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
            </>
          )}
        </g>
      )}

      {backStyle === 'ponytail' && (
        <g
          id="hair-ponytail"
          style={{
            transform: `scaleY(${1 + hairSwayY * 0.01}) rotate(${hairSwayX * 0.18}deg)`,
            transformOrigin: '200px 100px',
          }}
        >
          {/* Base volume behind head */}
          <path d="M105 130 C100 155, 95 190, 110 210 Q200 220, 290 210 C305 190, 300 155, 295 130 Z" fill={color} />
          {/* Ponytail flowing down from tie point */}
          <path
            d={`M195 115 C180 115, 205 95, 210 90 C225 85, 260 100, 265 120
               C270 145, 260 200, 255 260
               C252 290, 245 320, 240 345
               C235 355, 225 350, 228 330
               C232 300, 238 250, 240 200
               C242 170, 235 140, 225 120
               C215 105, 195 115, 195 115 Z`}
            fill={color}
          />
          {isAnime && (
            <>
              <path d="M230 140 Q245 190, 242 260" stroke="rgba(0,0,0,0.08)" strokeWidth="3" fill="none" />
              <path d="M220 130 Q240 180, 238 250" stroke="rgba(0,0,0,0.05)" strokeWidth="2.5" fill="none" />
            </>
          )}
          {/* Hair tie / ribbon */}
          <g
            style={{
              transform: `rotate(${hairSwayX * 0.8}deg)`,
              transformOrigin: '215px 105px',
              transition: 'transform 0.1s ease-out',
            }}
          >
            <circle cx="215" cy="105" r="8" fill={highlightColor} />
            <circle cx="215" cy="105" r="5" fill={color} />
          </g>
        </g>
      )}

      {backStyle === 'bun' && (
        <g id="hair-bun">
          {/* Base volume */}
          <path d="M110 130 C100 160, 95 195, 110 215 Q200 225, 290 215 C305 195, 300 160, 290 130 Z" fill={color} />
          {/* Round bun on top of head */}
          <circle cx="200" cy="78" r="32" fill={color} />
          {isAnime && (
            <>
              <circle cx="200" cy="78" r="28" fill="rgba(0,0,0,0.1)" />
              <path
                d="M182 62 Q200 52, 218 62"
                stroke={highlightColor}
                strokeWidth="3"
                fill="none"
                opacity="0.7"
                strokeLinecap="round"
              />
            </>
          )}
          {/* Decorative hair sticks / pins */}
          <line x1="185" y1="50" x2="175" y2="35" stroke={highlightColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="175" cy="33" r="4" fill={highlightColor} />
          <line x1="215" y1="50" x2="225" y2="35" stroke={highlightColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="225" cy="33" r="4" fill={highlightColor} />
          {/* Loose wisps */}
          <path d="M130 140 Q120 170, 125 200" stroke={color} strokeWidth="3" fill="none" opacity="0.7" />
          <path d="M270 140 Q280 170, 275 200" stroke={color} strokeWidth="3" fill="none" opacity="0.7" />
        </g>
      )}

      {backStyle === 'side-tail' && (
        <g
          id="hair-side-tail"
          style={{
            transform: `scaleY(${1 + hairSwayY * 0.01}) rotate(${hairSwayX * 0.15}deg)`,
            transformOrigin: '200px 100px',
          }}
        >
          {/* Base volume behind head */}
          <path d="M105 130 C100 155, 95 190, 110 210 Q200 220, 290 210 C305 190, 300 155, 295 130 Z" fill={color} />
          {/* Side tail flowing from right side */}
          <path
            d={`M280 130 C295 140, 310 170, 320 220
               C325 260, 318 310, 310 345
               C305 355, 295 350, 298 330
               C302 290, 305 240, 295 200
               C288 170, 275 145, 270 135 Z`}
            fill={color}
            style={{
              transform: `rotate(${hairSwayX * 1.2}deg)`,
              transformOrigin: '280px 130px',
            }}
          />
          {isAnime && <path d="M295 180 Q310 230, 305 300" stroke="rgba(0,0,0,0.08)" strokeWidth="3" fill="none" />}
          {/* Hair tie ribbon */}
          <g
            style={{
              transform: `rotate(${hairSwayX * 0.8}deg)`,
              transformOrigin: '285px 135px',
            }}
          >
            <circle cx="285" cy="135" r="7" fill={highlightColor} />
            <circle cx="285" cy="135" r="4.5" fill={color} />
          </g>
        </g>
      )}

      {backStyle === 'twintail-long' && (
        <g id="hair-twintail-long">
          {/* Left long twin-tail */}
          <path
            d="M110 120 C80 120, 25 160, 20 240 C16 300, 35 350, 28 380 C45 375, 55 330, 50 260 C48 210, 75 160, 95 140 Z"
            fill={color}
            style={{
              transform: `scaleY(${1 + hairSwayY * 0.01}) rotate(${hairSwayX * 1.15}deg)`,
              transformOrigin: '110px 130px',
            }}
          />
          {/* Right long twin-tail */}
          <path
            d="M290 120 C320 120, 375 160, 380 240 C384 300, 365 350, 372 380 C355 375, 345 330, 350 260 C352 210, 325 160, 305 140 Z"
            fill={color}
            style={{
              transform: `scaleY(${1 + hairSwayY * 0.01}) rotate(${hairSwayX * 1.15}deg)`,
              transformOrigin: '290px 130px',
            }}
          />
          {/* Ribbon ties */}
          <g style={{ transform: `rotate(${hairSwayX * 0.8}deg)`, transformOrigin: '104px 128px' }}>
            <path d="M98 128 L88 140 L98 136 L104 128 Z" fill={highlightColor} />
            <path d="M110 128 L120 140 L110 136 L104 128 Z" fill={highlightColor} />
            <circle cx="104" cy="128" r="5" fill={highlightColor} />
          </g>
          <g style={{ transform: `rotate(${hairSwayX * 0.8}deg)`, transformOrigin: '296px 128px' }}>
            <path d="M290 128 L280 140 L290 136 L296 128 Z" fill={highlightColor} />
            <path d="M302 128 L312 140 L302 136 L296 128 Z" fill={highlightColor} />
            <circle cx="296" cy="128" r="5" fill={highlightColor} />
          </g>
          {isAnime && (
            <>
              <path d="M80 170 Q50 240, 38 340" stroke="rgba(0,0,0,0.07)" strokeWidth="3" fill="none" />
              <path d="M320 170 Q350 240, 362 340" stroke="rgba(0,0,0,0.07)" strokeWidth="3" fill="none" />
            </>
          )}
        </g>
      )}

      {backStyle === 'messy-bun' && (
        <g
          id="hair-messy-bun"
          style={{
            transform: `scaleY(${1 + hairSwayY * 0.006}) rotate(${hairSwayX * 0.1}deg)`,
            transformOrigin: '200px 110px',
          }}
        >
          {/* Base volume */}
          <path d="M110 130 C100 160, 95 195, 110 215 Q200 225, 290 215 C305 195, 300 160, 290 130 Z" fill={color} />
          {/* Messy bun — irregular shape on top */}
          <ellipse cx="200" cy="80" rx="35" ry="30" fill={color} />
          <ellipse cx="192" cy="72" rx="18" ry="14" fill={color} />
          <ellipse cx="212" cy="74" rx="16" ry="12" fill={color} />
          {isAnime && (
            <>
              <ellipse cx="200" cy="80" rx="30" ry="26" fill="rgba(0,0,0,0.1)" />
              <path
                d="M185 68 Q200 58, 215 68"
                stroke={highlightColor}
                strokeWidth="2.5"
                fill="none"
                opacity="0.65"
                strokeLinecap="round"
              />
            </>
          )}
          {/* Stray wisps */}
          <path d="M165 90 Q155 110, 160 130" stroke={color} strokeWidth="3" fill="none" opacity="0.8" />
          <path d="M235 88 Q245 108, 240 128" stroke={color} strokeWidth="3" fill="none" opacity="0.8" />
          <path d="M180 75 Q170 60, 175 50" stroke={color} strokeWidth="2.5" fill="none" opacity="0.7" />
          <path d="M220 77 Q230 62, 225 52" stroke={color} strokeWidth="2.5" fill="none" opacity="0.7" />
          {/* Hair pin */}
          <line x1="210" y1="55" x2="218" y2="42" stroke={highlightColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="218" cy="40" r="3.5" fill={highlightColor} />
        </g>
      )}

      {backStyle === 'fishtail-braid' && (
        <g
          id="hair-fishtail-braid"
          style={{
            transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${hairSwayX * 0.12}deg)`,
            transformOrigin: '200px 100px',
          }}
        >
          {/* Base behind head */}
          <path d="M105 130 C100 155, 95 190, 110 210 Q200 220, 290 210 C305 190, 300 155, 295 130 Z" fill={color} />
          {/* Single thick braid down the back center */}
          <path
            d="M190 130 C185 160, 180 220, 185 300 C188 340, 195 365, 200 375 C205 365, 212 340, 215 300 C220 220, 215 160, 210 130 Z"
            fill={color}
          />
          {/* Fishtail weave pattern */}
          <path
            d="M195 150 Q200 160, 205 150 Q200 170, 195 160 Q200 180, 205 170 Q200 190, 195 180 Q200 200, 205 190 Q200 210, 195 200 Q200 220, 205 210 Q200 230, 195 220 Q200 240, 205 230 Q200 250, 195 240 Q200 260, 205 250 Q200 270, 195 260 Q200 280, 205 270 Q200 290, 195 280 Q200 300, 205 290 Q200 310, 195 300 Q200 320, 205 310"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Braid tie at end */}
          <circle cx="200" cy="370" r="5" fill={highlightColor} />
        </g>
      )}

      {backStyle === 'layered' && (
        <g
          id="hair-layered"
          style={{
            transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${hairSwayX * 0.12}deg)`,
            transformOrigin: '200px 100px',
          }}
        >
          {/* Bottom layer (longest) */}
          <path
            d="M95 130 C75 170, 70 250, 80 330 C90 340, 100 340, 105 320 Q110 280, 115 240 L285 240 Q290 280, 295 320 C300 340, 310 340, 320 330 C330 250, 325 170, 305 130 Z"
            fill={color}
          />
          {/* Middle layer */}
          <path
            d="M100 130 C82 165, 80 220, 90 280 Q105 290, 120 260 L280 260 Q295 290, 310 280 C320 220, 318 165, 300 130 Z"
            fill={color}
            opacity="0.95"
          />
          {isAnime && (
            <>
              <path d="M110 160 Q95 220, 100 290" stroke="rgba(0,0,0,0.06)" strokeWidth="2.5" fill="none" />
              <path d="M290 160 Q305 220, 300 290" stroke="rgba(0,0,0,0.06)" strokeWidth="2.5" fill="none" />
            </>
          )}
          {/* Top layer (shortest, frames face) */}
          <path
            d="M105 130 C90 160, 92 200, 110 230 Q200 238, 290 230 C308 200, 310 160, 295 130 Z"
            fill={color}
            opacity="0.9"
          />
        </g>
      )}
    </>
  );
};

export const FrontHairComponent: React.FC<{
  bangStyle:
    | 'classic'
    | 'side'
    | 'center-part'
    | 'short'
    | 'hime'
    | 'spiky'
    | 'curly-bangs'
    | 'cross-bangs'
    | 'wolf-cut'
    | 'curtain-bangs'
    | 'asymmetric'
    | 'blunt-bangs'
    | 'messy'
    | 'braided-bangs';
  color: string;
  highlightColor: string;
  angleY: number;
  artStyle?: 'classic' | 'anime' | 'retro';
  hairSwayX?: number;
  hairSwayY?: number;
  breath?: number;
}> = ({ bangStyle, color, highlightColor, angleY, artStyle = 'classic', hairSwayX = 0, hairSwayY = 0, breath = 0 }) => {
  // Each fringe has its own silhouette; flowing internal strands share the same light source.
  const shell =
    'M106 148 C95 112 110 75 144 64 C168 49 208 49 238 57 C279 62 303 91 296 146 L282 163 C276 114 252 86 216 81 C170 74 133 101 119 164 Z';
  const fringes: Record<typeof bangStyle, string> = {
    classic:
      'M115 117 C135 81 174 69 208 76 C199 104 183 131 171 151 L169 128 C155 145 144 151 132 153 L137 136 L115 154 Z M208 76 C250 76 277 102 289 140 L269 154 L270 130 L253 155 C237 143 216 119 208 76 Z',
    side: 'M112 123 C131 78 178 62 231 75 C209 109 189 138 153 157 L162 139 C141 150 130 152 115 154 Z M231 75 C268 93 285 114 289 151 C264 146 246 123 231 75 Z',
    'center-part':
      'M112 134 C123 91 165 64 204 77 C192 106 172 135 137 159 L144 139 L119 160 Z M204 77 C240 70 278 99 289 137 L279 163 L258 143 L265 162 C232 142 214 111 204 77 Z',
    short:
      'M113 128 C138 88 175 68 211 76 C248 75 277 102 287 137 L272 144 L265 132 L249 146 L235 132 L218 149 L207 128 L188 147 L178 128 L160 143 L151 129 L131 148 L130 132 L114 150 Z',
    hime: 'M113 119 C142 72 249 63 284 123 L282 147 Q267 152 243 148 L241 139 L238 150 L208 150 L205 139 L202 151 L170 149 L166 139 L163 150 Q132 151 116 146 Z',
    spiky:
      'M113 128 C148 77 179 67 210 77 C246 78 278 107 288 140 L270 151 L269 130 L246 159 L241 135 L221 158 L209 124 L190 156 L182 130 L157 156 L153 133 L128 153 L132 135 L110 153 Z',
    'curly-bangs':
      'M113 125 C143 73 247 66 286 124 C291 153 268 159 257 141 C262 166 228 169 219 140 C214 166 179 166 174 140 C160 166 139 158 145 140 C122 160 110 150 113 125 Z',
    'cross-bangs':
      'M112 128 C137 76 174 68 207 76 C201 111 182 132 155 155 L164 132 L126 158 Z M206 76 C246 75 278 103 290 146 L269 158 L270 131 L250 157 C228 137 212 111 206 76 Z M192 103 Q206 125 219 160 L204 150 L199 161 L181 133 Z',
    'wolf-cut':
      'M111 132 C133 87 179 67 213 78 C249 76 280 108 289 142 L273 158 L275 139 L255 162 L250 141 L232 156 L221 130 L204 156 L197 133 L177 159 L174 138 L151 157 L155 137 L129 160 L134 142 L112 160 Z',
    'curtain-bangs':
      'M112 137 C122 95 168 66 201 77 C195 101 185 128 157 147 C147 154 137 158 125 158 L139 143 L115 153 Z M201 77 C240 69 279 101 289 139 L283 155 L264 144 L274 160 C238 153 211 120 201 77 Z',
    asymmetric:
      'M111 131 C134 84 172 65 226 78 C216 118 184 151 152 168 L160 147 L129 167 L135 146 L113 155 Z M226 78 C259 86 282 109 289 145 L269 150 C250 132 235 108 226 78 Z',
    'blunt-bangs':
      'M112 126 C137 71 256 68 287 127 L283 152 Q259 157 233 153 L232 144 L229 154 L201 156 L173 154 L171 143 L168 154 Q139 157 117 152 Z',
    messy:
      'M111 131 C135 80 173 68 211 75 C251 76 282 108 288 140 L270 159 L273 137 L251 154 L252 133 L229 160 L221 138 L202 153 L194 127 L172 157 L176 135 L150 153 L154 133 L127 158 L131 140 L111 155 Z',
    'braided-bangs':
      'M112 131 C132 89 169 70 205 77 C193 110 167 137 132 157 L139 140 L117 156 Z M205 77 C244 74 278 104 288 143 L274 158 C256 137 224 108 205 77 Z',
  };
  const straight = bangStyle === 'hime' || bangStyle === 'blunt-bangs';
  const short = bangStyle === 'short' || bangStyle === 'spiky';
  const lock = straight
    ? 'M113 118 C109 156 111 194 118 224 L136 224 C127 188 125 153 131 126 Z'
    : short
      ? 'M112 120 C103 153 109 186 125 204 L123 184 L135 192 C126 163 125 140 133 121 Z'
      : 'M113 117 C98 159 101 206 122 243 L129 221 L136 230 C126 199 117 154 134 123 Z';
  const shadow = highlightColor === 'none';
  return (
    <g id="front-hair" style={{ transform: `translateY(${angleY * 0.1}px)` }}>
      <path
        d={shell}
        fill={color}
        stroke={shadow ? 'none' : 'rgba(28,23,45,0.5)'}
        strokeWidth={artStyle === 'retro' ? 3 : 1.5}
      />
      {(['left', 'right'] as const).map((side) => (
        <g key={side} transform={side === 'right' ? 'translate(400 0) scale(-1 1)' : undefined}>
          <g
            style={{
              transform: `rotate(${hairSwayX * (side === 'left' ? 0.35 : -0.35)}deg) scaleY(${1 + hairSwayY * 0.004})`,
              transformOrigin: '116px 125px',
            }}
          >
            <path d={lock} fill={color} stroke={shadow ? 'none' : 'rgba(28,23,45,0.45)'} strokeWidth="1.3" />
            {!shadow && (
              <path
                d={short ? 'M116 143 Q113 167 124 185' : 'M116 142 C110 175 118 205 126 220'}
                stroke={highlightColor}
                strokeWidth="3.5"
                opacity="0.32"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </g>
        </g>
      ))}
      <path
        d={fringes[bangStyle]}
        fill={color}
        stroke={shadow ? 'none' : 'rgba(28,23,45,0.4)'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {!shadow && (
        <>
          {/* Broad silk reflections follow the crown instead of a floating dotted halo. */}
          <path d="M124 106 C145 82 173 72 199 74 C174 78 149 91 134 111 Z" fill={highlightColor} opacity="0.38" />
          <path
            d="M222 74 C249 79 268 92 279 112 L273 116 C258 96 242 85 222 74 Z"
            fill={highlightColor}
            opacity="0.24"
          />
          <path
            d="M135 103 C148 90 167 81 183 79"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.38"
            fill="none"
            strokeLinecap="round"
          />
          <g stroke="rgba(24,18,41,0.2)" strokeWidth="1.2" fill="none" strokeLinecap="round">
            <path d="M184 80 Q157 93 145 121" />
            <path d="M197 79 Q176 109 170 129" />
            <path d="M220 82 Q249 103 258 126" />
          </g>
        </>
      )}
      {bangStyle === 'braided-bangs' && !shadow && (
        <g fill={color} stroke={highlightColor} strokeWidth="1.1">
          {Array.from({ length: 7 }, (_, i) => (
            <ellipse
              key={i}
              cx={220 + i * 8}
              cy={91 + i * 7}
              rx="7"
              ry="4"
              transform={`rotate(35 ${220 + i * 8} ${91 + i * 7})`}
            />
          ))}
        </g>
      )}
      {['messy', 'wolf-cut', 'spiky'].includes(bangStyle) && (
        <path
          d="M194 61 C179 40 172 40 158 43 C178 44 185 50 193 65"
          fill={color}
          stroke={shadow ? 'none' : 'rgba(28,23,45,0.4)'}
          strokeWidth="1.2"
          style={{
            transform: `rotate(${hairSwayX * 0.6 + Math.sin(breath * Math.PI * 2)}deg)`,
            transformOrigin: '194px 61px',
          }}
        />
      )}
    </g>
  );
};
