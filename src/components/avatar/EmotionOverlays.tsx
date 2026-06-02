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
        <ellipse cx="200" cy="110" rx="65" ry="20" fill="#ef4444" opacity="0.25" style={{ filter: 'blur(6px)' }} />
      </g>
    )}

    {emotion === 'cry' && (
      <g opacity="0.95">
        <path
          d="M152 173 C148 185, 156 195, 150 220"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M152 173 C149 195, 154 210, 149 238"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle
          cx="150"
          cy="221"
          r="5"
          fill="#a0c4ff"
          className="animate-ping"
          style={{ transformOrigin: '150px 221px' }}
        />
        <circle cx="150" cy="221" r="4.2" fill="#ffffff" />
        <path
          d="M248 173 C244 185, 252 195, 246 220"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M248 173 C245 195, 250 210, 245 238"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle
          cx="246"
          cy="221"
          r="5"
          fill="#a0c4ff"
          className="animate-ping"
          style={{ transformOrigin: '246px 221px' }}
        />
        <circle cx="246" cy="221" r="4.2" fill="#ffffff" />
        <path d="M149 230 L151 235 L149 242 L147 235 Z" fill="#93c5fd" className="animate-[bounce_1.5s_infinite]" />
        <path
          d="M245 230 L247 235 L245 242 L243 235 Z"
          fill="#93c5fd"
          className="animate-[bounce_1.5s_infinite_0.4s]"
        />
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
      <g opacity="0.9">
        <text x="90" y="120" fontSize="18" fill="#d946ef" className="animate-[bounce_1.4s_infinite_0.2s]">
          ♫
        </text>
        <text x="310" y="110" fontSize="14" fill="#06b6d4" className="animate-[bounce_2s_infinite_0.4s]">
          ♪
        </text>
        <text x="110" y="80" fontSize="15" fill="#10b981" className="animate-[pulse_1.2s_infinite_0.6s]">
          ♬
        </text>
        <text x="290" y="70" fontSize="16" fill="#8b5cf6" className="animate-[bounce_1.8s_infinite]">
          ♫
        </text>
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
