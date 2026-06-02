import React from 'react';
import { AvatarConfig } from '../../types';

type HairGradient = AvatarConfig['hairGradient'];

export const getHairFillColor = (hairGradient: HairGradient, hairColor: string) => {
  if (!hairGradient || hairGradient === 'none') return hairColor;
  return 'url(#hair-gradient-id)';
};

interface AvatarDefsProps {
  hairColor: string;
  hairGradient: HairGradient;
  hairHighlightColor: string;
}

export const AvatarDefs: React.FC<AvatarDefsProps> = ({ hairColor, hairGradient, hairHighlightColor }) => {
  if (!hairGradient || hairGradient === 'none') return null;

  return (
    <defs>
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
    </defs>
  );
};
