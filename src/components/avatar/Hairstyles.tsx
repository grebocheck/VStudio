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
    | 'curtain-bangs';
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
    | 'bun';
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
              transform: `rotate(${-hairSwayX * 0.8}deg)`,
              transformOrigin: '296px 132px',
              transition: 'transform 0.1s ease-out',
            }}
          >
            <circle cx="296" cy="132" r="6" fill={highlightColor} />
          </g>
        </g>
      )}

      {backStyle === 'wavy' && (
        <path
          d="M102 130 
             Q70 170, 75 220
             T 60 300
             T 85 365
             Q105 370, 115 340
             C120 300, 110 240, 118 200
             L282 200
             C290 240, 280 300, 285 340
             Q295 370, 315 365
             T 340 300
             T 325 220
             Q330 170, 298 130 Z"
          fill={color}
          style={{
            transform: `scaleY(${1 + bounce * 0.007 + hairSwayY * 0.01}) scaleX(${1 - hairSwayY * 0.004}) rotate(${hairSwayX * 0.15}deg)`,
            transformOrigin: '200px 100px',
          }}
        />
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
              transform: `rotate(${-hairSwayX * 0.8}deg)`,
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
    | 'curtain-bangs';
  color: string;
  highlightColor: string;
  angleY: number;
  artStyle?: 'classic' | 'anime' | 'retro';
  hairSwayX?: number;
  hairSwayY?: number;
  breath?: number;
}> = ({ bangStyle, color, highlightColor, angleY, artStyle = 'classic', hairSwayX = 0, hairSwayY = 0, breath = 0 }) => {
  const offset = angleY * 0.15;
  const isAnime = artStyle === 'anime';

  // Hair styling parameters for multi-layered sway & ahoge
  const leftLockStyle = {
    transform: `rotate(${hairSwayX * 0.8}deg)`,
    transformOrigin: '106px 130px',
    transition: 'transform 0.1s ease-out',
  };
  const rightLockStyle = {
    transform: `rotate(${hairSwayX * 0.8}deg)`,
    transformOrigin: '294px 130px',
    transition: 'transform 0.1s ease-out',
  };
  const ahogeRotation = hairSwayX * 0.8 + Math.sin(breath * Math.PI * 2) * 2.5;
  const ahogeStyle = {
    transform: `rotate(${ahogeRotation}deg)`,
    transformOrigin: '200px 80px',
    transition: 'transform 0.08s ease-out',
  };

  return (
    <g id="front-hair" style={{ transform: `translateY(${offset}px)` }}>
      {/* Cowlick strand (Ahoge) */}
      {isAnime && (
        <g style={ahogeStyle}>
          <path
            d="M200 80 C190 30, 150 25, 140 30 C165 42, 192 50, 203 76 Z"
            fill={color}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1.2"
          />
        </g>
      )}

      {/* Solid capping head shell */}
      <path
        d="M102 140 
           C100 45, 300 45, 298 140
           Q200 165, 102 140 Z"
        fill={color}
      />

      {isAnime && (
        <g id="anime-hair-texture">
          {/* Hair strand lines for texture */}
          <path d="M 120 70 Q 150 140 140 160" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />
          <path d="M 150 60 Q 180 140 170 165" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />
          <path d="M 280 70 Q 250 140 260 160" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />
          <path d="M 250 60 Q 220 140 230 165" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />
        </g>
      )}

      {/* Bangs selection patterns */}
      {bangStyle === 'classic' && (
        <g id="bangs-classic">
          <path
            d="M106 130 
               L115 149 L125 149
               L135 153 L145 146
               L160 155 L175 149
               L190 156 L200 147 L210 156
               L225 149 L240 155
               L255 146 L265 153
               L275 144 L285 149
               L294 130 Z"
            fill={color}
          />
          <g style={leftLockStyle}>
            <path d="M106 130 C100 160, 110 210, 122 230 L132 210 Q118 160, 120 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 C300 160, 290 210, 278 230 L268 210 Q282 160, 280 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'side' && (
        <g id="bangs-side">
          <path
            d="M106 130 
               C115 137, 130 147, 150 144
               C180 139, 210 165, 235 165
               C260 165, 280 142, 294 130
               L260 125 C220 128, 185 120, 155 122 Z"
            fill={color}
          />
          <g style={leftLockStyle}>
            <path d="M106 130 C100 160, 105 210, 118 240 L126 215 Q115 170, 124 133 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 C300 170, 285 220, 280 250 L270 215 Q282 170, 280 133 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'center-part' && (
        <g id="bangs-center-part">
          <path
            d="M106 130 
               C120 128, 140 136, 155 160 L165 147
               C180 138, 190 138, 200 138
               C210 138, 220 138, 235 147 L245 160
               C260 136, 280 128, 294 130 Z"
            fill={color}
          />
          <g style={leftLockStyle}>
            <path d="M106 130 C95 160, 112 210, 125 245 L135 220 Q120 170, 124 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 C305 160, 288 210, 275 245 L265 220 Q280 170, 276 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'short' && (
        <g id="bangs-short">
          <path
            d="M106 130 
               L120 145 L130 140
               L145 148 L155 140
               L175 150 L185 140 L200 152 L215 140
               L225 150 L235 140 L255 148
               L270 140 L280 145
               L294 130 Z"
            fill={color}
          />
          <g style={leftLockStyle}>
            <path d="M106 130 C100 150, 108 180, 115 200 L123 185 Q115 150, 118 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 C300 150, 292 180, 285 200 L277 185 Q285 150, 282 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'hime' && (
        <g id="bangs-hime">
          <path
            d="M106 130 
               L108 148
               H 292
               L294 130 Z"
            fill={color}
          />
          <g style={leftLockStyle}>
            <path d="M105 130 L107 225 L118 225 L116 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M295 130 L293 225 L282 225 L284 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'spiky' && (
        <g id="bangs-spiky">
          <path
            d="M106 130 
               L115 152 L124 133
               L138 158 L146 135
               L162 164 L172 138
               L185 162 L195 128 L205 162
               L218 138 L228 164
               L244 135 L252 158
               L266 133 L275 152
               L294 130 Z"
            fill={color}
          />
          <g style={leftLockStyle}>
            <path d="M106 130 Q92 170, 110 215 L120 195 Q108 160, 118 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 Q308 170, 290 215 L280 195 Q292 160, 282 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'curly-bangs' && (
        <g id="bangs-curly-bangs">
          <path
            d="M106 130
               C112 147, 137 154, 142 144
               C147 134, 153 150, 168 160
               C183 170, 197 147, 200 147
               C203 147, 217 170, 232 160
               C247 150, 253 134, 258 144
               C263 154, 288 147, 294 130 Z"
            fill={color}
          />
          <g style={leftLockStyle}>
            <path d="M106 130 Q90 160, 102 205 Q115 220, 122 195 Q110 175, 118 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 Q310 160, 298 205 Q285 220, 278 195 Q290 175, 282 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'cross-bangs' && (
        <g id="bangs-cross-bangs">
          <path
            d="M106 130
               L138 162 L146 152 L158 127
               L178 167 L182 157 C190 147, 210 147, 218 157 L222 167
               L242 127 L254 152 L262 162
               L294 130 Z"
            fill={color}
          />
          <path d="M192 120 L212 164 L198 164 L185 140 Z" fill={color} opacity="0.95" />
          <path
            d="M208 120 L188 164 L202 164 L215 140 Z"
            fill={color}
            opacity="0.95"
            stroke={highlightColor}
            strokeWidth="1"
          />
          <g style={leftLockStyle}>
            <path d="M106 130 Q88 170, 115 225 L125 195 Q106 160, 118 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 Q312 170, 285 225 L275 195 Q294 160, 282 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'wolf-cut' && (
        <g id="bangs-wolf-cut">
          {/* Layered choppy bangs with jagged edges */}
          <path
            d="M106 130
               L118 155 L128 140
               L140 160 L150 143
               L165 165 L172 145
               L185 163 L195 133 L205 163
               L228 145 L235 165
               L250 143 L260 160
               L272 140 L282 155
               L294 130 Z"
            fill={color}
          />
          {/* Secondary choppy texture layer */}
          <path d="M115 140 L128 160 L135 147" stroke={highlightColor} strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M265 140 L272 160 L280 147" stroke={highlightColor} strokeWidth="1.5" fill="none" opacity="0.5" />
          <g style={leftLockStyle}>
            {/* Side face-framing layers (longer pieces) */}
            <path d="M106 130 Q88 175, 100 240 L112 215 Q98 170, 118 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 Q312 175, 300 240 L288 215 Q302 170, 282 135 Z" fill={color} />
          </g>
        </g>
      )}

      {bangStyle === 'curtain-bangs' && (
        <g id="bangs-curtain">
          {/* Soft curtain bangs parted in the center, flowing to the sides */}
          <path
            d="M106 130
               C118 133, 135 146, 155 160
               C170 168, 185 156, 195 143
               C198 138, 200 136, 200 136
               C200 136, 202 138, 205 143
               C215 156, 230 168, 245 160
               C265 146, 282 133, 294 130 Z"
            fill={color}
          />
          {/* Soft highlight curves */}
          <path
            d="M140 133 Q165 153, 190 143"
            stroke={highlightColor}
            strokeWidth="2"
            fill="none"
            opacity="0.45"
            strokeLinecap="round"
          />
          <path
            d="M260 133 Q235 153, 210 143"
            stroke={highlightColor}
            strokeWidth="2"
            fill="none"
            opacity="0.45"
            strokeLinecap="round"
          />
          <g style={leftLockStyle}>
            {/* Side face-framing curtains */}
            <path d="M106 130 C95 165, 100 210, 112 245 L122 220 Q108 175, 120 135 Z" fill={color} />
          </g>
          <g style={rightLockStyle}>
            <path d="M294 130 C305 165, 300 210, 288 245 L278 220 Q292 175, 280 135 Z" fill={color} />
          </g>
        </g>
      )}

      {/* Glossy multi-segmented ring halo shine */}
      {isAnime ? (
        <g id="anime-hair-shine-halo">
          <path
            d="M125 116 Q200 90, 275 116"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M130 112 Q200 86, 270 112"
            stroke={highlightColor}
            strokeWidth="5"
            strokeDasharray="18 6 4 5 35 7"
            fill="none"
            strokeLinecap="round"
            opacity="0.82"
          />
          <path d="M 160 102 L 165 92 L 170 102 L 165 106 Z" fill="#ffffff" opacity="0.9" />
          <path d="M 235 102 L 240 92 L 245 102 L 240 106 Z" fill="#ffffff" opacity="0.9" />
        </g>
      ) : (
        <path
          d="M130 110 Q200 85, 270 110"
          stroke={highlightColor}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        />
      )}
    </g>
  );
};
