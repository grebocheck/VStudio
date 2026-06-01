import { useEffect, useState } from 'react';
import { VTuberAvatar } from './components/VTuberAvatar';
import { useOverlayReceiver } from './hooks/useOverlaySync';
import { INITIAL_RIG } from './presets';

/**
 * Standalone page rendered at `/overlay`, intended to be added as an OBS
 * Browser Source. It mirrors the studio's avatar over a transparent background
 * (or chroma-green with `?bg=green`) and carries no UI chrome.
 */
export default function Overlay() {
  const { config, rig, connected } = useOverlayReceiver();
  const [size, setSize] = useState(() => Math.min(window.innerWidth, window.innerHeight));

  const params = new URLSearchParams(window.location.search);
  const forceGreen = params.get('bg') === 'green';

  // Transparent page so OBS composites the alpha channel.
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  useEffect(() => {
    const onResize = () => setSize(Math.min(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const effectiveConfig = config
    ? forceGreen
      ? { ...config, backgroundStyle: 'green-screen' as const }
      : config
    : null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: forceGreen ? '#00ff00' : 'transparent' }}
    >
      {effectiveConfig ? (
        <div style={{ width: 400, height: 400, transform: `scale(${size / 400})`, transformOrigin: 'center' }}>
          <VTuberAvatar config={effectiveConfig} rig={rig ?? INITIAL_RIG} transparent />
        </div>
      ) : (
        <div className="text-center font-mono text-sm text-white/70 px-6 py-3 rounded-lg bg-black/40 backdrop-blur">
          {connected ? 'Waiting for V-Studio…' : 'Connecting to V-Studio…'}
        </div>
      )}
    </div>
  );
}
