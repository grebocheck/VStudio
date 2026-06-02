import React from 'react';
import { AvatarFrameStyles } from '../../lib/avatarFrame';

interface AvatarDebugOverlayProps {
  frame: AvatarFrameStyles;
}

export const AvatarDebugOverlay: React.FC<AvatarDebugOverlayProps> = ({ frame }) => (
  <g id="rigging-debug-grid" opacity="0.35" pointerEvents="none">
    <circle
      data-rig-node="debug-head"
      cx={frame.debugHeadCx}
      cy={frame.debugHeadCy}
      r="75"
      fill="none"
      stroke="#22c55e"
      strokeWidth="1"
      strokeDasharray="3 3"
    />
    <g
      data-rig-node="debug-face"
      style={{
        transform: frame.debugFaceTransform,
        transformOrigin: '200px 220px',
      }}
    >
      <line x1="125" y1="175" x2="275" y2="175" stroke="#3b82f6" strokeWidth="1" />
      <line x1="200" y1="100" x2="200" y2="250" stroke="#3b82f6" strokeWidth="1" />
      <rect x="145" y="165" width="20" height="20" fill="none" stroke="#e11d48" strokeWidth="1" />
      <rect x="235" y="165" width="20" height="20" fill="none" stroke="#e11d48" strokeWidth="1" />
      <circle cx="200" cy="208" r="8" fill="none" stroke="#9333ea" strokeWidth="1" />
    </g>
  </g>
);
