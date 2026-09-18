export const OVERLAY_SESSION_STORAGE_KEY = 'vstudio_overlay_session';

/** A shareable pairing secret with 192 bits of cryptographic randomness. */
export function createOverlaySession(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function isOverlaySession(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{48}$/.test(value);
}

type SessionStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function restoreOverlaySession(storage?: SessionStorage): string {
  try {
    const stored = storage?.getItem(OVERLAY_SESSION_STORAGE_KEY);
    if (isOverlaySession(stored)) return stored;
  } catch {
    /* Storage can be disabled in an otherwise working browser. */
  }
  const session = createOverlaySession();
  try {
    storage?.setItem(OVERLAY_SESSION_STORAGE_KEY, session);
  } catch {
    /* The current tab still keeps a stable pairing secret. */
  }
  return session;
}

let currentStudioSession: string | null = null;

export function getStudioSession(): string {
  if (currentStudioSession) return currentStudioSession;
  let storage: SessionStorage | undefined;
  try {
    storage = window.localStorage;
  } catch {
    /* blocked storage */
  }
  currentStudioSession = restoreOverlaySession(storage);
  return currentStudioSession;
}

export function overlaySessionFromSearch(search: string): string | null {
  const session = new URLSearchParams(search).get('session');
  return isOverlaySession(session) ? session : null;
}

export function buildOverlayUrl(origin: string, session: string): string {
  if (!isOverlaySession(session)) throw new Error('Invalid studio pairing session.');
  const url = new URL('/overlay', origin);
  url.searchParams.set('session', session);
  return url.toString();
}

export interface OverlayHello {
  t: 'hello';
  role: 'editor' | 'overlay';
  session: string;
}

export function isOverlayHello(message: unknown): message is OverlayHello {
  if (!message || typeof message !== 'object') return false;
  const hello = message as Record<string, unknown>;
  return (
    hello.t === 'hello' && (hello.role === 'editor' || hello.role === 'overlay') && isOverlaySession(hello.session)
  );
}
