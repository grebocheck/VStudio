import React from 'react';
import { Emotion } from '../../types';

interface EmotionOverlaysProps {
  emotion: Emotion;
}

export const EmotionOverlays: React.FC<EmotionOverlaysProps> = ({ emotion }) => (
  <>
    {emotion === 'angry' && (
      <g opacity="0.95">
        <g transform="translate(235, 100) scale(1.15)">
          <path
            d="M-12 -12 Q6 -18 24 -12 M-12 12 Q6 18 24 12 M-12 -12 Q-18 6 -12 24 M12 -12 Q18 6 12 24"
            stroke="#dc2626"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            className="animate-pulse"
          />
        </g>
        <g transform="translate(140, 108) scale(0.85)">
          <path
            d="M-10 -10 Q5 -15 20 -10 M-10 10 Q5 15 20 10 M-10 -10 Q-15 5 -10 20 M10 -10 Q15 5 10 20"
            stroke="#ef4444"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            className="animate-pulse"
          />
        </g>
        <g transform="translate(268, 155) scale(0.55)">
          <path
            d="M-10 -10 Q5 -15 20 -10 M-10 10 Q5 15 20 10 M-10 -10 Q-15 5 -10 20 M10 -10 Q15 5 10 20"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            className="animate-pulse"
          />
        </g>
        <path
          d="M175 72 Q168 48 178 35 T182 8"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.8"
          strokeLinecap="round"
          className="animate-bounce"
        />
        <path
          d="M195 65 Q190 42 198 28 T202 2"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="animate-bounce"
        />
        <path
          d="M215 68 Q210 45 218 32 T222 5"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-bounce"
        />
        <path
          d="M230 74 Q226 54 232 42 T236 18"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="animate-bounce"
        />
        <defs>
          <linearGradient id="angry-forehead-gloom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#7f1d1d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <rect x="120" y="85" width="160" height="75" fill="url(#angry-forehead-gloom)" rx="12" />
      </g>
    )}

    {emotion === 'cry' && (
      <g opacity="0.98">
        {/* Swelling watery eyes / tear reservoir at lower lids */}
        <path
          d="M 132 188 Q 150 196, 168 188 Q 150 192, 132 188 Z"
          fill="#93c5fd"
          opacity="0.8"
          style={{ filter: 'drop-shadow(0 0 3px rgba(147, 197, 253, 0.8))' }}
        />
        <path
          d="M 232 188 Q 250 196, 268 188 Q 250 192, 232 188 Z"
          fill="#93c5fd"
          opacity="0.8"
          style={{ filter: 'drop-shadow(0 0 3px rgba(147, 197, 253, 0.8))' }}
        />

        {/* Double-layered main tear streams flowing down */}
        {/* Left main stream */}
        <path
          d="M 150 188 C 146 220, 154 240, 149 265"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 150 188 C 146 220, 154 240, 149 265"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Right main stream */}
        <path
          d="M 250 188 C 254 220, 246 240, 251 265"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 250 188 C 254 220, 246 240, 251 265"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Dynamic falling teardrops (dripping along the stream paths) */}
        {/* Left falling teardrops */}
        <path
          d="M 150 188 C 148 191, 148 194, 150 196 C 152 194, 152 191, 150 188 Z"
          fill="#e0f2fe"
          stroke="#3b82f6"
          strokeWidth="1"
          className="animate-tear-fall-left-1"
        />
        <path
          d="M 150 188 C 148 191, 148 194, 150 196 C 152 194, 152 191, 150 188 Z"
          fill="#e0f2fe"
          stroke="#3b82f6"
          strokeWidth="1"
          className="animate-tear-fall-left-2"
        />

        {/* Right falling teardrops */}
        <path
          d="M 250 188 C 248 191, 248 194, 250 196 C 252 194, 252 191, 250 188 Z"
          fill="#e0f2fe"
          stroke="#3b82f6"
          strokeWidth="1"
          className="animate-tear-fall-right-1"
        />
        <path
          d="M 250 188 C 248 191, 248 194, 250 196 C 252 194, 252 191, 250 188 Z"
          fill="#e0f2fe"
          stroke="#3b82f6"
          strokeWidth="1"
          className="animate-tear-fall-right-2"
        />

        {/* Splash/ripple at the bottom of streams */}
        <circle
          cx="149"
          cy="265"
          r="5"
          fill="#93c5fd"
          className="animate-ping"
          style={{ transformOrigin: '149px 265px' }}
        />
        <circle cx="149" cy="265" r="3.5" fill="#ffffff" />

        <circle
          cx="251"
          cy="265"
          r="5"
          fill="#93c5fd"
          className="animate-ping"
          style={{ transformOrigin: '251px 265px' }}
        />
        <circle cx="251" cy="265" r="3.5" fill="#ffffff" />
      </g>
    )}

    {emotion === 'shocked' && (
      <g opacity="0.95">
        <g transform="translate(200, 40)">
          <ellipse cx="0" cy="0" rx="15" ry="12" fill="#eab308" stroke="#1e293b" strokeWidth="2" />
          <path d="M-4 10 L-8 20 L4 10 Z" fill="#eab308" stroke="#1e293b" strokeWidth="2" />
          <path d="M-3 9 L-8 19 L3 9 Z" fill="#eab308" />
          <text x="0" y="4" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">
            !
          </text>
        </g>
        <path
          d="M120 80 L100 65 M115 120 L90 115 M280 80 L300 65 M285 120 L310 115"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-pulse"
        />
        <path
          d="M272 135 C275 142, 271 146, 271 152 C271 146, 267 142, 267 135 Z"
          fill="#38bdf8"
          className="animate-[bounce_1s_infinite]"
        />
      </g>
    )}

    {emotion === 'relaxed' && (
      <g opacity="0.95">
        <g className="animate-[bounce_3s_infinite]">
          <path
            d="M 120 70 C 115 62, 105 65, 110 75 C 115 85, 125 82, 120 70"
            fill="#f43f5e"
            opacity="0.8"
            transform="rotate(15, 120, 70)"
          />
          <path
            d="M 280 60 C 275 52, 265 55, 270 65 C 275 75, 285 72, 280 60"
            fill="#f43f5e"
            opacity="0.85"
            transform="rotate(-30, 280, 60)"
          />
        </g>
        <g className="animate-[pulse_2.5s_infinite_0.5s]">
          <path d="M 90 190 C 85 182, 75 185, 80 195 C 85 205, 95 202, 90 190" fill="#fda4af" opacity="0.75" />
          <path d="M 310 180 C 305 172, 295 175, 300 185 C 305 195, 315 192, 310 180" fill="#fda4af" opacity="0.75" />
        </g>
        <ellipse cx="140" cy="195" rx="15" ry="5" fill="#f43f5e" opacity="0.18" />
        <ellipse cx="260" cy="195" rx="15" ry="5" fill="#f43f5e" opacity="0.18" />
        <path
          d="M205 218 Q212 212 220 216 Q224 210 230 215"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-pulse"
        />
      </g>
    )}

    {emotion === 'smug' && (
      <g transform="translate(270, 185)">
        <path d="M0 -12 Q0 0 12 0 Q0 0 0 12 Q0 0 -12 0 Q0 0 0 -12 Z" fill="#eab308" />
        <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
      </g>
    )}

    {emotion === 'happy' && (
      <g opacity="0.88">
        <path
          d="M135 158 C131 152, 123 152, 119 158 C115 152, 107 152, 103 158 L119 178 Z"
          fill="#f43f5e"
          transform="scale(0.8) translate(15, -20)"
        />
        <path
          d="M265 158 C261 152, 253 152, 249 158 C245 152, 237 152, 233 158 L249 178 Z"
          fill="#f43f5e"
          transform="scale(0.8) translate(70, -20)"
        />
      </g>
    )}

    {emotion === 'love' && (
      <g opacity="0.95">
        <path
          d="M110 130 C106 124, 98 124, 94 130 C90 124, 82 124, 78 130 L94 150 Z"
          fill="#ec4899"
          className="animate-[bounce_2s_infinite]"
          style={{ filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.7))' }}
        />
        <path
          d="M290 130 C286 124, 278 124, 274 130 C270 124, 262 124, 258 130 L274 150 Z"
          fill="#ec4899"
          className="animate-[bounce_2s_infinite_0.4s]"
          style={{ filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.7))' }}
        />
        <path
          d="M200 60 C196 54, 188 54, 184 60 C180 54, 172 54, 168 60 L184 80 Z"
          fill="#f43f5e"
          className="animate-[pulse_1.5s_infinite]"
          style={{ filter: 'drop-shadow(0 0 5px rgba(244, 63, 94, 0.7))' }}
        />
      </g>
    )}

    {emotion === 'starry' && (
      <g opacity="0.9">
        <path
          d="M 120 150 L 123 157 L 130 160 L 123 163 L 120 170 L 117 163 L 110 160 L 117 157 Z"
          fill="#fbbf24"
          className="animate-[pulse_1.8s_infinite]"
        />
        <path
          d="M 280 150 L 283 157 L 290 160 L 283 163 L 280 170 L 277 163 L 270 160 L 277 157 Z"
          fill="#fbbf24"
          className="animate-[pulse_1.8s_infinite_0.5s]"
        />
        <circle cx="132" cy="190" r="3" fill="#ffffff" className="animate-ping" />
        <circle cx="268" cy="190" r="3" fill="#ffffff" className="animate-ping" />
      </g>
    )}

    {emotion === 'squint' && (
      <g opacity="0.9">
        <path d="M125 195 Q 130 200, 135 195" stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M265 195 Q 270 200, 275 195" stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 110 80 Q 100 70 110 60 Q 120 70 110 80" fill="#f1f5f9" className="animate-[pulse_1s_infinite]" />
        <path
          d="M 290 80 Q 280 70 290 60 Q 300 70 290 80"
          fill="#f1f5f9"
          className="animate-[pulse_1s_infinite_0.5s]"
        />
      </g>
    )}

    {emotion === 'depressed' && (
      <g opacity="0.95">
        <defs>
          <linearGradient id="forehead-gloom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.6" />
            <stop offset="45%" stopColor="#312e81" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <rect x="125" y="80" width="150" height="70" fill="url(#forehead-gloom)" rx="10" />
        <path
          d="M140 230 Q 150 215, 160 218 Q 165 210, 175 215"
          stroke="rgba(79, 70, 229, 0.45)"
          strokeWidth="2"
          fill="none"
          className="animate-pulse"
        />
      </g>
    )}

    {emotion === 'dizzy' && (
      <g transform="translate(200, 50)" opacity="0.95">
        <circle cx="-35" cy="-20" r="4" fill="#fbbf24" className="animate-[ping_1.5s_infinite]" />
        <circle cx="35" cy="-15" r="3" fill="#fbbf24" className="animate-[ping_2s_infinite]" />
        <path
          d="M-20 -10 Q0 -30 20 -10 Q0 10 -20 -10"
          fill="none"
          stroke="#facc15"
          strokeWidth="2.5"
          className="animate-[spin_4s_linear_infinite]"
        />
        <text x="0" y="-35" fontSize="9" fontWeight="bold" fill="#facc15" textAnchor="middle" className="animate-pulse">
          @_@
        </text>
      </g>
    )}

    {emotion === 'cool' && (
      <g opacity="0.95">
        <defs>
          <clipPath id="cool-shades-clip">
            <path d="M 124 158 L 184 158 Q 188 174 176 194 Q 168 202 156 202 Q 144 202 136 194 Q 122 174 124 158 Z" />
            <path d="M 276 158 L 216 158 Q 212 174 224 194 Q 232 202 244 202 Q 256 202 264 194 Q 278 174 276 158 Z" />
          </clipPath>
        </defs>

        {/* Sunglasses Frames (temple arms behind/at the sides) */}
        <path d="M 124 162 L 102 166" stroke="#0f172a" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M 276 162 L 298 166" stroke="#0f172a" strokeWidth="4.5" fill="none" strokeLinecap="round" />

        {/* Lenses */}
        <path
          d="M 124 158 L 184 158 Q 188 174 176 194 Q 168 202 156 202 Q 144 202 136 194 Q 122 174 124 158 Z"
          fill="url(#cool-lens-grad)"
          opacity="0.88"
          stroke="#1e293b"
          strokeWidth="3.5"
        />
        <path
          d="M 276 158 L 216 158 Q 212 174 224 194 Q 232 202 244 202 Q 256 202 264 194 Q 278 174 276 158 Z"
          fill="url(#cool-lens-grad)"
          opacity="0.88"
          stroke="#1e293b"
          strokeWidth="3.5"
        />

        {/* Neon lens accent borders (magenta glow) */}
        <path
          d="M 124 158 L 184 158 Q 188 174 176 194 Q 168 202 156 202 Q 144 202 136 194 Q 122 174 124 158 Z"
          fill="none"
          stroke="#d946ef"
          strokeWidth="1.5"
          opacity="0.95"
          style={{ filter: 'drop-shadow(0 0 2px #d946ef)' }}
        />
        <path
          d="M 276 158 L 216 158 Q 212 174 224 194 Q 232 202 244 202 Q 256 202 264 194 Q 278 174 276 158 Z"
          fill="none"
          stroke="#d946ef"
          strokeWidth="1.5"
          opacity="0.95"
          style={{ filter: 'drop-shadow(0 0 2px #d946ef)' }}
        />

        {/* Sweeping light glints */}
        <g clipPath="url(#cool-shades-clip)">
          <line
            x1="110"
            y1="140"
            x2="190"
            y2="220"
            stroke="#ffffff"
            strokeWidth="4"
            opacity="0.45"
            className="animate-shades-glint"
            style={{ pointerEvents: 'none' }}
          />
          <line
            x1="198"
            y1="140"
            x2="278"
            y2="220"
            stroke="#ffffff"
            strokeWidth="4"
            opacity="0.45"
            className="animate-shades-glint"
            style={{ pointerEvents: 'none' }}
          />
        </g>

        {/* Nose bridge (thick dark core + neon cyan overlay) */}
        <path d="M 184 162 Q 200 157 216 162" stroke="#0f172a" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M 184 162 Q 200 157 216 162" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Top brow neon bar (cyan glow) */}
        <path
          d="M 120 156 L 280 156"
          stroke="#06b6d4"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px #06b6d4)' }}
        />

        {/* Sparkle stars on outer corners */}
        <path
          d="M 121 161 Q 121 165 125 165 Q 121 165 121 169 Q 121 165 117 165 Q 121 165 121 161"
          fill="#ffffff"
          className="animate-pulse"
        />
        <path
          d="M 279 161 Q 279 165 283 165 Q 279 165 279 169 Q 279 165 275 165 Q 279 165 279 161"
          fill="#ffffff"
          className="animate-pulse"
        />

        {/* Floating, glowing SVG music notes */}
        <path
          d="M90 120 A 6 5 0 1 1 78 120 A 6 5 0 1 1 90 120 L 90 100 Q 98 100 102 95 L 102 91 Q 96 95 90 95 Z"
          fill="#d946ef"
          className="animate-note-1"
          style={{ filter: 'drop-shadow(0 0 3px #d946ef)' }}
        />
        <path
          d="M 290 110 A 5 4 0 1 0 300 110 L 300 90 L 316 86 L 316 106 A 5 4 0 1 0 326 106 L 326 82 L 298 89 Z"
          fill="#06b6d4"
          className="animate-note-2"
          style={{ filter: 'drop-shadow(0 0 3px #06b6d4)' }}
        />
        <path
          d="M110 80 A 5 4 0 1 1 100 80 A 5 4 0 1 1 110 80 L 110 60 Q 118 60 122 55 L 122 51 Q 116 55 110 55 Z"
          fill="#10b981"
          className="animate-note-3"
          style={{ filter: 'drop-shadow(0 0 3px #10b981)' }}
        />
        <path
          d="M 270 70 A 5 4 0 1 0 280 70 L 280 50 L 296 46 L 296 66 A 5 4 0 1 0 306 66 L 306 42 L 278 49 Z"
          fill="#8b5cf6"
          className="animate-note-4"
          style={{ filter: 'drop-shadow(0 0 3px #8b5cf6)' }}
        />

        {/* Rotating neon star sparkles */}
        <path
          d="M 75 142 Q 75 150 83 150 Q 75 150 75 158 Q 75 150 67 150 Q 75 150 75 142 Z"
          fill="#06b6d4"
          className="animate-[spin_6s_linear_infinite]"
          style={{ transformOrigin: '75px 150px', filter: 'drop-shadow(0 0 4px #06b6d4)' }}
        />
        <path
          d="M 325 133 Q 325 140 332 140 Q 325 140 325 147 Q 325 140 318 140 Q 325 140 325 133 Z"
          fill="#d946ef"
          className="animate-[spin_5s_linear_infinite_reverse]"
          style={{ transformOrigin: '325px 140px', filter: 'drop-shadow(0 0 4px #d946ef)' }}
        />
        <path
          d="M 200 60 Q 200 70 210 70 Q 200 70 200 80 Q 200 70 190 70 Q 200 70 200 60 Z"
          fill="#facc15"
          className="animate-[spin_8s_linear_infinite]"
          style={{ transformOrigin: '200px 70px', filter: 'drop-shadow(0 0 4px #facc15)' }}
        />
      </g>
    )}

    {emotion === 'scared' && (
      <g opacity="0.95">
        <path
          d="M135 120 C135 130, 131 135, 131 145 C131 135, 127 130, 127 120 Z"
          fill="#60a5fa"
          className="animate-[bounce_2s_infinite]"
        />
        <path
          d="M265 115 C265 125, 261 130, 261 140 C261 130, 257 125, 257 115 Z"
          fill="#60a5fa"
          className="animate-[bounce_2s_infinite_0.5s]"
        />
        <text x="95" y="150" fontSize="22" fontWeight="bold" fill="#3b82f6" className="animate-pulse">
          ⚡
        </text>
        <text x="305" y="145" fontSize="22" fontWeight="bold" fill="#3b82f6" className="animate-pulse">
          ⚡
        </text>
      </g>
    )}

    {emotion === 'sleepy' && (
      <g opacity="0.9">
        <g className="animate-[bounce_2.5s_infinite]">
          <text x="215" y="200" fontSize="11" fontWeight="bold" fill="#93c5fd">
            Z
          </text>
          <text
            x="225"
            y="185"
            fontSize="14"
            fontWeight="bold"
            fill="#60a5fa"
            className="animate-[pulse_1.5s_infinite_0.5s]"
          >
            Z
          </text>
          <text
            x="238"
            y="165"
            fontSize="18"
            fontWeight="bold"
            fill="#3b82f6"
            className="animate-[pulse_2s_infinite_1s]"
          >
            Z
          </text>
        </g>
        <circle
          cx="198"
          cy="192"
          r="6"
          fill="rgba(191, 219, 254, 0.6)"
          stroke="#60a5fa"
          strokeWidth="1"
          className="animate-[pulse_2s_infinite]"
        />
      </g>
    )}

    {emotion === 'shy' && (
      <g opacity="0.95">
        <ellipse cx="140" cy="195" rx="20" ry="8" fill="#ff0055" opacity="0.32" />
        <ellipse cx="260" cy="195" rx="20" ry="8" fill="#ff0055" opacity="0.32" />
        <path
          d="M110 215 Q100 205 110 195 Q120 205 110 215"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2"
          className="animate-pulse"
        />
        <path
          d="M290 215 Q280 205 290 195 Q300 205 290 215"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2"
          className="animate-pulse"
        />
      </g>
    )}
  </>
);
