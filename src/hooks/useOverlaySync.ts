import { useEffect, useRef, useState } from 'react';
import { AvatarConfig, RigParams } from '../types';

const RIG_SEND_INTERVAL_MS = 33; // ~30fps is plenty smooth for an overlay
const RECONNECT_DELAY_MS = 1500;

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

/**
 * Editor side: streams the live `config` (on change) and `rig` (throttled) to
 * the relay so connected OBS overlays mirror the studio. Returns the number of
 * connected overlay clients for status display.
 */
export function useOverlayBroadcast(config: AvatarConfig, rig: RigParams): number {
  const [overlayCount, setOverlayCount] = useState(0);

  const configRef = useRef(config);
  const rigRef = useRef(rig);
  useEffect(() => {
    configRef.current = config;
    rigRef.current = rig;
  });

  // Resend config whenever it changes (and on (re)connect via lastSentConfig reset).
  const socketRef = useRef<WebSocket | null>(null);
  const lastConfigJsonRef = useRef<string>('');

  useEffect(() => {
    const json = JSON.stringify(config);
    if (json !== lastConfigJsonRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ t: 'config', config }));
      lastConfigJsonRef.current = json;
    }
  }, [config]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let rigTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      socket = new WebSocket(wsUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        socket?.send(JSON.stringify({ t: 'hello', role: 'editor' }));
        // Force a config resend on (re)connect.
        lastConfigJsonRef.current = '';
        socket?.send(JSON.stringify({ t: 'config', config: configRef.current }));
        lastConfigJsonRef.current = JSON.stringify(configRef.current);

        rigTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ t: 'rig', rig: rigRef.current }));
          }
        }, RIG_SEND_INTERVAL_MS);
      };

      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.t === 'status') setOverlayCount(msg.overlays ?? 0);
        } catch {
          /* ignore */
        }
      };

      socket.onclose = () => {
        if (rigTimer) clearInterval(rigTimer);
        setOverlayCount(0);
        if (!closed) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      closed = true;
      if (rigTimer) clearInterval(rigTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      socketRef.current = null;
    };
  }, []);

  return overlayCount;
}

export interface OverlayState {
  config: AvatarConfig | null;
  rig: RigParams | null;
  connected: boolean;
}

/**
 * Overlay side (loaded inside OBS Browser Source): subscribes to the relay and
 * returns the latest config + rig pushed by the editor.
 */
export function useOverlayReceiver(): OverlayState {
  const [state, setState] = useState<OverlayState>({ config: null, rig: null, connected: false });

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      socket = new WebSocket(wsUrl());
      socket.onopen = () => {
        socket?.send(JSON.stringify({ t: 'hello', role: 'overlay' }));
        setState((s) => ({ ...s, connected: true }));
      };
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.t === 'config') setState((s) => ({ ...s, config: msg.config }));
          else if (msg.t === 'rig') setState((s) => ({ ...s, rig: msg.rig }));
        } catch {
          /* ignore */
        }
      };
      socket.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (!closed) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return state;
}
