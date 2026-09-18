import { useSvgScope } from './SvgScope';
import React from 'react';
import { AvatarConfig } from '../../types';

type HairGradient = AvatarConfig['hairGradient'];

export const getHairFillColor = (hairGradient: HairGradient, hairColor: string, isFront = false) => {
  return isFront ? 'url(#front-hair-gradient-id)' : 'url(#hair-gradient-id)';
};

interface AvatarDefsProps {
  hairColor: string;
  hairGradient: HairGradient;
  hairHighlightColor: string;
}

export const AvatarDefs: React.FC<AvatarDefsProps> = ({ hairColor, hairGradient, hairHighlightColor }) => {
  const { svgId } = useSvgScope();
  const mix = (color: string, target: string, amount: number) => {
    const parse = (hex: string) =>
      hex.length === 4
        ? hex
            .slice(1)
            .split('')
            .map((c) => c + c)
            .join('')
        : hex.slice(1);
    const a = parse(color);
    const b = parse(target);
    if (!/^[0-9a-f]{6}$/i.test(a)) return color;
    return (
      '#' +
      [0, 2, 4]
        .map((i) =>
          Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - amount) + parseInt(b.slice(i, i + 2), 16) * amount)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    );
  };
  const tipColor =
    hairGradient === 'linear'
      ? hairHighlightColor
      : hairGradient === 'sunset'
        ? '#cf5b67'
        : hairGradient === 'indigo-fade'
          ? '#6366b8'
          : mix(hairColor, '#21172e', 0.22);
  return (
    <defs>
      {/* Visor / Lens Gradient for Cool Shades */}
      <linearGradient id={svgId('cool-lens-grad')} x1="0" y1="0" x2="1" y2="1">
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
      <filter id={svgId('drop-shadow')} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
      </filter>

      <filter id={svgId('drop-shadow-heavy')} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
      </filter>

      {/* Rim light blur filter */}
      <filter id={svgId('rim-blur')} x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2.5" />
      </filter>

      {/* 2. Face Shading (Inner Volume for Skin) */}
      <radialGradient id={svgId('face-shading')} cx="50%" cy="40%" r="60%">
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#a45c65" stopOpacity="0.16" />
      </radialGradient>

      {/* 3. Eye Sclera Shading (Top shadow from eyelashes) */}
      <linearGradient id={svgId('eye-sclera')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a0aec0" />
        <stop offset="30%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>

      <linearGradient id={svgId('eye-occlusion')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#372a46" stopOpacity="0.28" />
        <stop offset="45%" stopColor="#372a46" stopOpacity="0" />
      </linearGradient>

      {/* 4. Soft Blush Radial Gradient */}
      <radialGradient id={svgId('soft-blush')} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="50%" stopColor="currentColor" stopOpacity="0.7" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>

      {/* Consistent lighting stays aligned across every hair lock. */}
      <linearGradient id={svgId('hair-gradient-id')} gradientUnits="userSpaceOnUse" x1="150" y1="70" x2="260" y2="360">
        <stop offset="0%" stopColor={mix(hairColor, '#21172e', 0.12)} />
        <stop offset="45%" stopColor={hairColor} />
        <stop offset="100%" stopColor={tipColor} />
      </linearGradient>
      <linearGradient
        id={svgId('front-hair-gradient-id')}
        gradientUnits="userSpaceOnUse"
        x1="170"
        y1="50"
        x2="220"
        y2="245"
      >
        <stop offset="0%" stopColor={mix(hairColor, hairHighlightColor, 0.2)} />
        <stop offset="40%" stopColor={hairColor} />
        <stop offset="100%" stopColor={tipColor} />
      </linearGradient>
      <linearGradient id={svgId('fabric-shading')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#171124" stopOpacity="0.3" />
        <stop offset="35%" stopColor="#ffffff" stopOpacity="0.055" />
        <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#171124" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  );
};
