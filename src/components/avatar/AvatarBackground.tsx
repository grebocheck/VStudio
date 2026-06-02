import React from 'react';
import { AvatarConfig } from '../../types';

interface AvatarBackgroundProps {
  backgroundStyle: AvatarConfig['backgroundStyle'];
  transparent: boolean;
}

export const AvatarBackground: React.FC<AvatarBackgroundProps> = ({ backgroundStyle, transparent }) => {
  // In overlay mode keep the canvas transparent unless the user explicitly
  // wants a chroma-key fill so OBS Browser Source compositing works.
  if (transparent && backgroundStyle !== 'green-screen') return <g data-avatar-background="true" />;

  switch (backgroundStyle) {
    case 'green-screen':
      return (
        <g data-avatar-background="true">
          <rect width="400" height="400" fill="#00ff00" />
        </g>
      );
    case 'gaming':
      return (
        <g data-avatar-background="true">
          <rect width="400" height="400" fill="#0e0c1b" />
          <path d="M0 80 Q200 40, 400 80" stroke="#f43f5e" strokeWidth="3" opacity="0.4" fill="none" />
          <path d="M0 160 Q200 120, 400 160" stroke="#06b6d4" strokeWidth="3" opacity="0.4" fill="none" />
          <rect x="25" y="100" width="60" height="6" fill="#1e1b4b" rx="2" />
          <rect x="315" y="120" width="60" height="6" fill="#1e1b4b" rx="2" />
          <line x1="30" y1="50" x2="30" y2="90" stroke="#ec4899" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
          <line x1="30" y1="50" x2="30" y2="90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line
            x1="370"
            y1="70"
            x2="370"
            y2="110"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line x1="370" y1="70" x2="370" y2="110" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'nebula':
      return (
        <g data-avatar-background="true">
          <rect width="400" height="400" fill="#02001c" />
          <circle cx="100" cy="120" r="140" fill="#a21caf" opacity="0.15" filter="blur(40px)" />
          <circle cx="300" cy="280" r="160" fill="#1d4ed8" opacity="0.2" filter="blur(50px)" />
          <circle cx="200" cy="80" r="80" fill="#0369a1" opacity="0.15" filter="blur(30px)" />
          <circle cx="60" cy="70" r="1" fill="#ffffff" />
          <circle cx="320" cy="40" r="1.5" fill="#ffffff" opacity="0.8" />
          <circle cx="340" cy="180" r="1" fill="#ffffff" />
          <circle cx="45" cy="250" r="1.5" fill="#ffffff" />
          <circle cx="120" cy="310" r="1" fill="#ffffff" opacity="0.5" />
          <line x1="60" y1="70" x2="100" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1="100" y1="90" x2="120" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        </g>
      );
    case 'dark-studio':
    default:
      return (
        <g data-avatar-background="true">
          <rect width="400" height="400" fill="#07070a" />
          <radialGradient id="studio-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#121217" />
            <stop offset="100%" stopColor="#07070a" />
          </radialGradient>
          <rect width="400" height="400" fill="url(#studio-grad)" />
          <circle cx="200" cy="200" r="120" fill="#6366f1" opacity="0.04" />
        </g>
      );
  }
};
