import React from 'react';
import { Emotion } from '../../types';

interface FaceFlushOverlayProps {
  emotion: Emotion;
}

export const FaceFlushOverlay: React.FC<FaceFlushOverlayProps> = ({ emotion }) => (
  <>
    {emotion === 'love' && (
      <g>
        <defs>
          <radialGradient id="love-flush-grad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#f43f5e" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="200"
          cy="175"
          rx="70"
          ry="80"
          fill="url(#love-flush-grad)"
          className="animate-[pulse_3s_infinite]"
        />
        <ellipse
          cx="152"
          cy="195"
          rx="20"
          ry="10"
          fill="#ec4899"
          opacity="0.32"
          style={{ filter: 'blur(2.5px)' }}
          className="animate-[pulse_2s_infinite]"
        />
        <ellipse
          cx="248"
          cy="195"
          rx="20"
          ry="10"
          fill="#ec4899"
          opacity="0.32"
          style={{ filter: 'blur(2.5px)' }}
          className="animate-[pulse_2s_infinite_0.5s]"
        />
      </g>
    )}
    {emotion === 'angry' && (
      <g>
        <defs>
          <radialGradient id="angry-flush-grad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ff2020" stopOpacity="0.38" />
            <stop offset="55%" stopColor="#ff4040" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ff6060" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="175" rx="70" ry="80" fill="url(#angry-flush-grad)" className="animate-pulse" />
        <ellipse cx="155" cy="195" rx="22" ry="12" fill="#ff3030" opacity="0.25" style={{ filter: 'blur(3px)' }} />
        <ellipse cx="245" cy="195" rx="22" ry="12" fill="#ff3030" opacity="0.25" style={{ filter: 'blur(3px)' }} />
        <ellipse cx="200" cy="130" rx="40" ry="12" fill="#ff4040" opacity="0.15" style={{ filter: 'blur(5px)' }} />
      </g>
    )}
  </>
);
