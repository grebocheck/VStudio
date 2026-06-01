import React from 'react';

export const HairComponent: React.FC<{
  bangStyle: 'classic' | 'side' | 'center-part' | 'short' | 'hime' | 'spiky' | 'curly-bangs' | 'cross-bangs';
  backStyle: 'straight' | 'tails' | 'short' | 'curly' | 'braids' | 'hime-long' | 'drill-tails' | 'wavy';
  color: string;
  highlightColor: string;
  angleY: number;
  breath: number;
  hairSwayX?: number;
  hairSwayY?: number;
  artStyle?: 'classic' | 'anime' | 'retro';
}> = ({ bangStyle, backStyle, color, highlightColor, angleY, breath, hairSwayX = 0, hairSwayY = 0, artStyle = 'classic' }) => {
  const bounce = 0;
  const tailSway = 0;
  const isAnime = artStyle === 'anime';

  return (
    <>
      {/* --- BACK HAIR (Renders BEHIND the head layer) --- */}
      {backStyle === 'straight' && (
        <g style={{ transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${hairSwayX * 0.12}deg)`, transformOrigin: '200px 100px' }}>
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
          style={{ transform: `scaleY(${1 + bounce * 0.005 + hairSwayY * 0.01}) scaleX(${1 - hairSwayY * 0.004}) rotate(${hairSwayX * 0.15}deg)`, transformOrigin: '200px 100px' }}
        />
      )}

      {backStyle === 'drill-tails' && (
        <g id="hair-drill-tails">
          <g style={{ transform: `scaleY(${1 + bounce * 0.005 + hairSwayY * 0.012}) rotate(${tailSway + hairSwayX * 1.15}deg)`, transformOrigin: '110px 130px' }}>
            <path
              d="M110 120 C100 120, 60 140, 50 180 C40 220, 65 240, 45 280 C30 310, 55 350, 70 340 C85 330, 65 285, 80 250 C95 215, 78 190, 85 160 C92 130, 105 125, 110 120 Z"
              fill={color}
            />
            <path d="M85 160 C65 175, 48 210, 58 230" stroke={highlightColor} strokeWidth="2.5" fill="none" opacity="0.65" />
            <path d="M78 220 C55 242, 42 270, 52 290" stroke={highlightColor} strokeWidth="2.5" fill="none" opacity="0.65" />
            <path d="M68 280 C45 305, 48 322, 60 330" stroke={highlightColor} strokeWidth="2" fill="none" opacity="0.65" />
          </g>
          
          <g style={{ transform: `scaleY(${1 + bounce * 0.005 + hairSwayY * 0.012}) rotate(${-tailSway + hairSwayX * 1.15}deg)`, transformOrigin: '290px 130px' }}>
            <path
              d="M290 120 C300 120, 340 140, 350 180 C360 220, 335 240, 355 280 C370 310, 345 350, 330 340 C315 330, 335 285, 320 250 C305 215, 322 190, 315 160 C308 130, 295 125, 290 120 Z"
              fill={color}
            />
            <path d="M315 160 C335 175, 352 210, 342 230" stroke={highlightColor} strokeWidth="2.5" fill="none" opacity="0.65" />
            <path d="M322 220 C345 242, 358 270, 348 290" stroke={highlightColor} strokeWidth="2.5" fill="none" opacity="0.65" />
            <path d="M332 280 C355 305, 352 322, 340 330" stroke={highlightColor} strokeWidth="2" fill="none" opacity="0.65" />
          </g>
          
          <circle cx="104" cy="132" r="6" fill={highlightColor} />
          <circle cx="296" cy="132" r="6" fill={highlightColor} />
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
          style={{ transform: `scaleY(${1 + bounce * 0.007 + hairSwayY * 0.01}) scaleX(${1 - hairSwayY * 0.004}) rotate(${hairSwayX * 0.15}deg)`, transformOrigin: '200px 100px' }}
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
            style={{ transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${tailSway + hairSwayX * 1.15}deg)`, transformOrigin: '110px 130px' }}
          />
          {/* Right twin-tail */}
          <path
            d="M290 120 
               C320 120, 365 150, 370 220 
               C374 270, 352 310, 360 340
               C345 335, 335 290, 340 220
               C342 190, 315 150, 305 140 Z"
            fill={color}
            style={{ transform: `scaleY(${1 + hairSwayY * 0.008}) rotate(${-tailSway + hairSwayX * 1.15}deg)`, transformOrigin: '290px 130px' }}
          />

          <circle cx="104" cy="132" r="6" fill={highlightColor} />
          <circle cx="296" cy="132" r="6" fill={highlightColor} />
        </g>
      )}

      {backStyle === 'short' && (
        <path
          d="M110 130 C100 160, 90 200, 105 230 Q200 240, 295 230 C310 200, 300 160, 290 130 Z"
          fill={color}
        />
      )}

      {backStyle === 'braids' && (
        <g id="hair-braids">
          <path
            d="M105 130 C95 160, 70 240, 75 330 C80 340, 90 340, 90 310 C85 240, 105 170, 115 130 Z"
            fill={color}
          />
          <path d="M 100 150 Q 85 160, 95 180 Q 80 190, 90 210 Q 75 220, 85 240 Q 70 255, 80 275 Q 65 290, 75 310" stroke="rgba(0,0,0,0.15)" strokeWidth="3" fill="none" />
          
          <path
            d="M295 130 C305 160, 330 240, 325 330 C320 340, 310 340, 310 310 C315 240, 295 170, 285 130 Z"
            fill={color}
          />
          <path d="M 300 150 Q 315 160, 305 180 Q 320 190, 310 210 Q 325 220, 315 240 Q 330 255, 320 275 Q 335 290, 325 310" stroke="rgba(0,0,0,0.15)" strokeWidth="3" fill="none" />
          
          <rect x="68" y="305" width="14" height="6" fill={highlightColor} rx="1" />
          <rect x="318" y="305" width="14" height="6" fill={highlightColor} rx="1" />
        </g>
      )}

      {backStyle === 'hime-long' && (
        <g id="hair-hime-long">
          <path
            d="M100 130 C80 170, 75 240, 72 380 L328 380 C325 240, 320 170, 300 130 Z"
            fill={color}
          />
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
    </>
  );
};

export const FrontHairComponent: React.FC<{
  bangStyle: 'classic' | 'side' | 'center-part' | 'short' | 'hime' | 'spiky' | 'curly-bangs' | 'cross-bangs';
  color: string;
  highlightColor: string;
  angleY: number;
  artStyle?: 'classic' | 'anime' | 'retro';
}> = ({ bangStyle, color, highlightColor, angleY, artStyle = 'classic' }) => {
  const offset = angleY * 0.15;
  const isAnime = artStyle === 'anime';

  return (
    <g id="front-hair" style={{ transform: `translateY(${offset}px)` }}>
      {/* Cowlick strand (Ahoge) */}
      {isAnime && (
        <path
          d="M200 80 C190 30, 150 25, 140 30 C165 42, 192 50, 203 76 Z"
          fill={color}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1.2"
        />
      )}

      {/* Solid capping head shell */}
      <path
        d="M102 140 
           C100 45, 300 45, 298 140
           Q200 165, 102 140 Z"
        fill={color}
      />

      {/* Bangs selection patterns */}
      {bangStyle === 'classic' && (
        <g id="bangs-classic">
          <path
            d="M106 130 
               L115 161 L125 161
               L135 165 L145 158
               L160 167 L175 161
               L190 168 L200 159 L210 168
               L225 161 L240 167
               L255 158 L265 165
               L275 156 L285 161
               L294 130 Z"
            fill={color}
          />
          <path d="M106 130 C100 160, 110 210, 122 230 L132 210 Q118 160, 120 135 Z" fill={color} />
          <path d="M294 130 C300 160, 290 210, 278 230 L268 210 Q282 160, 280 135 Z" fill={color} />
        </g>
      )}

      {bangStyle === 'side' && (
        <g id="bangs-side">
          <path
            d="M106 130 
               C115 155, 130 165, 150 162
               C180 157, 210 185, 235 185
               C260 185, 280 160, 294 130
               L260 135 C220 140, 185 130, 155 132 Z"
            fill={color}
          />
          <path d="M106 130 C100 160, 105 210, 118 240 L126 215 Q115 170, 124 133 Z" fill={color} />
          <path d="M294 130 C300 170, 285 220, 280 250 L270 215 Q282 170, 280 133 Z" fill={color} />
        </g>
      )}

      {bangStyle === 'center-part' && (
        <g id="bangs-center-part">
          <path
            d="M106 130 
               C120 138, 140 148, 155 175 L165 160
               C180 150, 190 150, 200 150
               C210 150, 220 150, 235 160 L245 175
               C260 148, 280 138, 294 130 Z"
            fill={color}
          />
          <path d="M106 130 C95 160, 112 210, 125 245 L135 220 Q120 170, 124 135 Z" fill={color} />
          <path d="M294 130 C305 160, 288 210, 275 245 L265 220 Q280 170, 276 135 Z" fill={color} />
        </g>
      )}

      {bangStyle === 'short' && (
        <g id="bangs-short">
          <path
            d="M106 130 
               L120 155 L130 150
               L145 158 L155 150
               L175 160 L185 150 L200 162 L215 150
               L225 160 L235 150 L255 158
               L270 150 L280 155
               L294 130 Z"
            fill={color}
          />
          <path d="M106 130 C100 150, 108 180, 115 200 L123 185 Q115 150, 118 135 Z" fill={color} />
          <path d="M294 130 C300 150, 292 180, 285 200 L277 185 Q285 150, 282 135 Z" fill={color} />
        </g>
      )}

      {bangStyle === 'hime' && (
        <g id="bangs-hime">
          <path
            d="M106 130 
               L108 158
               H 292
               L294 130 Z"
            fill={color}
          />
          <path d="M105 130 L107 225 L118 225 L116 135 Z" fill={color} />
          <path d="M295 130 L293 225 L282 225 L284 135 Z" fill={color} />
        </g>
      )}

      {bangStyle === 'spiky' && (
        <g id="bangs-spiky">
          <path
            d="M106 130 
               L115 168 L124 145
               L138 174 L146 148
               L162 180 L172 152
               L185 178 L195 140 L205 178
               L218 152 L228 180
               L244 148 L252 174
               L266 145 L275 168
               L294 130 Z"
            fill={color}
          />
          <path d="M106 130 Q92 170, 110 215 L120 195 Q108 160, 118 135 Z" fill={color} />
          <path d="M294 130 Q308 170, 290 215 L280 195 Q292 160, 282 135 Z" fill={color} />
        </g>
      )}

      {bangStyle === 'curly-bangs' && (
        <g id="bangs-curly-bangs">
          <path
            d="M106 130
               C112 165, 137 172, 142 162
               C147 152, 153 168, 168 178
               C183 188, 197 165, 200 165
               C203 165, 217 188, 232 178
               C247 168, 253 152, 258 162
               C263 172, 288 165, 294 130 Z"
            fill={color}
          />
          <path d="M106 130 Q90 160, 102 205 Q115 220, 122 195 Q110 175, 118 135 Z" fill={color} />
          <path d="M294 130 Q310 160, 298 205 Q285 220, 278 195 Q290 175, 282 135 Z" fill={color} />
        </g>
      )}

      {bangStyle === 'cross-bangs' && (
        <g id="bangs-cross-bangs">
          <path
            d="M106 130
               L138 180 L146 170 L158 145
               L178 185 L182 175 C190 165, 210 165, 218 175 L222 185
               L242 145 L254 170 L262 180
               L294 130 Z"
            fill={color}
          />
          <path d="M192 120 L212 182 L198 182 L185 140 Z" fill={color} opacity="0.95" />
          <path d="M208 120 L188 182 L202 182 L215 140 Z" fill={color} opacity="0.95" stroke={highlightColor} strokeWidth="1" />
          <path d="M106 130 Q88 170, 115 225 L125 195 Q106 160, 118 135 Z" fill={color} />
          <path d="M294 130 Q312 170, 285 225 L275 195 Q294 160, 282 135 Z" fill={color} />
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
          <path
            d="M 160 102 L 165 92 L 170 102 L 165 106 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <path
            d="M 235 102 L 240 92 L 245 102 L 240 106 Z"
            fill="#ffffff"
            opacity="0.9"
          />
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
