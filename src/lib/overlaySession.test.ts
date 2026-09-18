import { describe, expect, it } from 'vitest';
import {
  buildOverlayUrl,
  createOverlaySession,
  isOverlayHello,
  isOverlaySession,
  overlaySessionFromSearch,
  OVERLAY_SESSION_STORAGE_KEY,
  restoreOverlaySession,
} from './overlaySession';
import { sanitizeOverlayRig } from './overlayFrames';

describe('studio pairing', () => {
  it('creates distinct cryptographic pairing secrets and persists a valid secret across reloads', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const first = restoreOverlaySession(storage);
    expect(isOverlaySession(first)).toBe(true);
    expect(restoreOverlaySession(storage)).toBe(first);
    expect(createOverlaySession()).not.toBe(first);
    values.set(OVERLAY_SESSION_STORAGE_KEY, 'legacy-global');
    expect(restoreOverlaySession(storage)).not.toBe(first);
    expect(
      isOverlaySession(
        restoreOverlaySession({
          getItem() {
            throw new Error('blocked');
          },
          setItem() {
            throw new Error('blocked');
          },
        }),
      ),
    ).toBe(true);
  });

  it('round-trips a paired URL and rejects absent, malformed, or unsupported handshakes', () => {
    const session = createOverlaySession();
    const url = new URL(buildOverlayUrl('https://studio.example', session));
    expect(url.pathname).toBe('/overlay');
    expect(overlaySessionFromSearch(url.search)).toBe(session);
    expect(overlaySessionFromSearch('?session=public')).toBeNull();
    expect(overlaySessionFromSearch('')).toBeNull();
    expect(isOverlayHello({ t: 'hello', role: 'editor', session })).toBe(true);
    expect(isOverlayHello({ t: 'hello', role: 'overlay', session })).toBe(true);
    for (const value of [
      null,
      { t: 'hello', role: 'owner', session },
      { t: 'hello', role: 'editor' },
      { t: 'hello', role: 'editor', session: 'public' },
    ])
      expect(isOverlayHello(value)).toBe(false);
  });

  it('bounds rig transforms and rejects malformed frames before they reach the avatar', () => {
    expect(sanitizeOverlayRig({ angleX: 900, eyeLOpen: -5, tongueOut: 7 })).toMatchObject({
      angleX: 30,
      eyeLOpen: 0,
      tongueOut: 1,
    });
    for (const value of [null, [], { angleX: 'rotate(999)' }, { angleX: Infinity }, { activeEmotion: 'invalid' }])
      expect(sanitizeOverlayRig(value)).toBeNull();
  });

  it('preserves smooth expression transitions and accepts older frames without a weight', () => {
    expect(sanitizeOverlayRig({ activeEmotion: 'happy', emotionStrength: 0.42 })).toMatchObject({
      activeEmotion: 'happy',
      emotionStrength: 0.42,
    });
    expect(sanitizeOverlayRig({ emotionStrength: -1 })?.emotionStrength).toBe(0);
    expect(sanitizeOverlayRig({ emotionStrength: 9 })?.emotionStrength).toBe(1);
    expect(sanitizeOverlayRig({ activeEmotion: 'happy' })?.emotionStrength).toBeUndefined();
    for (const emotionStrength of [NaN, Infinity, 'strong', null]) {
      expect(sanitizeOverlayRig({ emotionStrength })).toBeNull();
    }
  });
});
