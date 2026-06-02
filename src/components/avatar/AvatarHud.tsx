import React from 'react';

interface AvatarHudProps {
  fps: number | null;
}

export const AvatarHud: React.FC<AvatarHudProps> = ({ fps }) => (
  <>
    <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-700/50 backdrop-blur-sm pointer-events-none">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span className="text-[10px] font-mono text-slate-300 tracking-wider">LIVE GRAPHICS</span>
    </div>

    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-700/50 backdrop-blur-sm pointer-events-none">
      <span className="text-[10px] font-mono text-teal-400">
        FPS: {fps === null ? '--' : fps.toFixed(1)} / SVG DEFORM
      </span>
    </div>
  </>
);
