import React from 'react';
import { AvatarConfig } from '../../types';

type HairGradient = AvatarConfig['hairGradient'];

export const getHairFillColor = (hairGradient: HairGradient, hairColor: string, isFront = false) => {
  if (!hairGradient || hairGradient === 'none') return hairColor;
  return isFront ? 'url(#front-hair-gradient-id)' : 'url(#hair-gradient-id)';
};

interface AvatarDefsProps {
  hairColor: string;
  hairGradient: HairGradient;
  hairHighlightColor: string;
}

export const AvatarDefs: React.FC<AvatarDefsProps> = ({ hairColor, hairGradient, hairHighlightColor }) => {
  return (
    <defs>
      {/* Visor / Lens Gradient for Cool Shades */}
      <linearGradient id="cool-lens-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0f172a" stopOpacity="0.92" />
        <stop offset="60%" stopColor="#1e1b4b" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#581c87" stopOpacity="0.75" />
      </linearGradient>

      {/* Global CSS animation definitions inside SVG style */}
      <style>
        {`
          @keyframes shadesGlint {
            0% { transform: translate(-60px, -5px); opacity: 0; }
            15% { opacity: 0.7; }
            35% { transform: translate(60px, 5px); opacity: 0; }
            100% { transform: translate(60px, 5px); opacity: 0; }
          }
          .animate-shades-glint {
            animation: shadesGlint 3.2s ease-in-out infinite;
          }

          @keyframes tearFall {
            0% { transform: translateY(0px) scale(0.6); opacity: 0; }
            15% { opacity: 0.9; }
            85% { opacity: 0.9; }
            100% { transform: translateY(60px) scale(1); opacity: 0; }
          }
          .animate-tear-fall-left-1 {
            animation: tearFall 2.2s cubic-bezier(0.4, 0, 1, 1) infinite;
            transform-origin: 150px 188px;
          }
          .animate-tear-fall-left-2 {
            animation: tearFall 2.2s cubic-bezier(0.4, 0, 1, 1) infinite 1.1s;
            transform-origin: 150px 188px;
          }
          .animate-tear-fall-right-1 {
            animation: tearFall 2.2s cubic-bezier(0.4, 0, 1, 1) infinite 0.5s;
            transform-origin: 250px 188px;
          }
          .animate-tear-fall-right-2 {
            animation: tearFall 2.2s cubic-bezier(0.4, 0, 1, 1) infinite 1.6s;
            transform-origin: 250px 188px;
          }

          @keyframes noteDrift {
            0% { transform: translateY(20px) scale(0.8); opacity: 0; }
            20% { opacity: 0.85; }
            80% { opacity: 0.85; }
            100% { transform: translateY(-40px) scale(1.1); opacity: 0; }
          }
          .animate-note-1 {
            animation: noteDrift 2.8s ease-in-out infinite;
            transform-origin: 90px 120px;
          }
          .animate-note-2 {
            animation: noteDrift 3.2s ease-in-out infinite 0.8s;
            transform-origin: 310px 110px;
          }
          .animate-note-3 {
            animation: noteDrift 2.5s ease-in-out infinite 1.5s;
            transform-origin: 110px 80px;
          }
          .animate-note-4 {
            animation: noteDrift 3.0s ease-in-out infinite 0.3s;
            transform-origin: 290px 70px;
          }
        `}
      </style>

      {/* 1. Global Drop Shadows for Depth */}
      <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
      </filter>

      <filter id="drop-shadow-heavy" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
      </filter>

      {/* Rim light blur filter */}
      <filter id="rim-blur" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2.5" />
      </filter>

      {/* 2. Face Shading (Inner Volume for Skin) */}
      <radialGradient id="face-shading" cx="50%" cy="40%" r="60%">
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
      </radialGradient>

      {/* 3. Eye Sclera Shading (Top shadow from eyelashes) */}
      <linearGradient id="eye-sclera" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a0aec0" />
        <stop offset="30%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>

      {/* 4. Soft Blush Radial Gradient */}
      <radialGradient id="soft-blush" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="50%" stopColor="currentColor" stopOpacity="0.7" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>

      {/* 5. Hair Gradient (Original) */}
      {hairGradient && hairGradient !== 'none' && (
        <>
          <linearGradient id="hair-gradient-id" x1="0" y1="0" x2="0" y2="1">
            {hairGradient === 'linear' && (
              <>
                <stop offset="0%" stopColor={hairColor} />
                <stop offset="100%" stopColor={hairHighlightColor} />
              </>
            )}
            {hairGradient === 'sunset' && (
              <>
                <stop offset="0%" stopColor={hairColor} />
                <stop offset="100%" stopColor="#ef4444" />
              </>
            )}
            {hairGradient === 'indigo-fade' && (
              <>
                <stop offset="0%" stopColor={hairColor} />
                <stop offset="100%" stopColor="#6366f1" />
              </>
            )}
          </linearGradient>

          {/* 6. Front Hair Gradient (userSpaceOnUse to align across split paths without seams) */}
          <linearGradient id="front-hair-gradient-id" gradientUnits="userSpaceOnUse" x1="200" y1="45" x2="200" y2="250">
            {hairGradient === 'linear' && (
              <>
                <stop offset="0%" stopColor={hairColor} />
                <stop offset="100%" stopColor={hairHighlightColor} />
              </>
            )}
            {hairGradient === 'sunset' && (
              <>
                <stop offset="0%" stopColor={hairColor} />
                <stop offset="100%" stopColor="#ef4444" />
              </>
            )}
            {hairGradient === 'indigo-fade' && (
              <>
                <stop offset="0%" stopColor={hairColor} />
                <stop offset="100%" stopColor="#6366f1" />
              </>
            )}
          </linearGradient>
        </>
      )}
    </defs>
  );
};
