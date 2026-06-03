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
      {/* 1. Global Drop Shadows for Depth */}
      <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
      </filter>

      <filter id="drop-shadow-heavy" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
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
