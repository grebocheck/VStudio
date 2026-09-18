import { describe, expect, it } from 'vitest';
import { OverlayRooms } from './overlayRooms';

class Client {
  readyState = 1;
  messages: Record<string, any>[] = [];
  closeCode: number | null = null;
  send(message: string) {
    this.messages.push(JSON.parse(message));
  }
  close(code: number) {
    this.closeCode = code;
    this.readyState = 3;
  }
}
const sessionA = 'a'.repeat(48);
const sessionB = 'b'.repeat(48);
const hello = (rooms: OverlayRooms, client: Client, session: string, role = 'editor') =>
  rooms.receive(client, JSON.stringify({ t: 'hello', role, session }));
const publish = (rooms: OverlayRooms, client: Client, t: 'config' | 'rig', value: unknown) =>
  rooms.receive(client, JSON.stringify({ t, [t]: value }));

describe('overlay rooms', () => {
  it('isolates state, replay and connection status between studios', () => {
    const rooms = new OverlayRooms();
    const editorA = new Client(),
      editorB = new Client(),
      overlayA = new Client(),
      overlayB = new Client();
    hello(rooms, editorA, sessionA);
    hello(rooms, editorB, sessionB);
    publish(rooms, editorA, 'config', { name: 'A', hairColor: '#aabbcc' });
    publish(rooms, editorB, 'config', { name: 'B', hairColor: '#112233' });
    hello(rooms, overlayA, sessionA, 'overlay');
    hello(rooms, overlayB, sessionB, 'overlay');
    expect(overlayA.messages.find((m) => m.t === 'config')?.config.name).toBe('A');
    expect(overlayB.messages.find((m) => m.t === 'config')?.config.name).toBe('B');
    expect(editorA.messages.at(-1)).toEqual({ t: 'status', overlays: 1, editors: 1 });
    publish(rooms, editorA, 'rig', { angleX: 9 });
    expect(overlayA.messages.at(-1)?.rig.angleX).toBe(9);
    expect(overlayB.messages.some((m) => m.t === 'rig')).toBe(false);
    const before = editorB.messages.length;
    rooms.disconnect(overlayA);
    expect(editorA.messages.at(-1)?.overlays).toBe(0);
    expect(editorB.messages).toHaveLength(before);
  });

  it('rejects publishing before hello, invalid roles, role changes and publishing from overlays', () => {
    const rooms = new OverlayRooms();
    const anonymous = new Client();
    publish(rooms, anonymous, 'config', { name: 'intruder' });
    expect(anonymous.closeCode).toBe(1008);
    const invalid = new Client();
    hello(rooms, invalid, sessionA, 'owner');
    expect(invalid.closeCode).toBe(1008);
    const overlay = new Client();
    hello(rooms, overlay, sessionA, 'overlay');
    publish(rooms, overlay, 'config', { name: 'intruder' });
    expect(overlay.closeCode).toBe(1008);
    const editor = new Client();
    hello(rooms, editor, sessionA);
    hello(rooms, editor, sessionB);
    expect(editor.closeCode).toBe(1008);
    const malformed = new Client();
    hello(rooms, malformed, sessionB);
    publish(rooms, malformed, 'rig', { angleX: 'bad' });
    expect(malformed.closeCode).toBe(1008);
  });

  it('keeps the last avatar while an overlay is connected and drops cached state once the room is empty', () => {
    const rooms = new OverlayRooms();
    const editor = new Client(),
      overlay = new Client();
    hello(rooms, editor, sessionA);
    publish(rooms, editor, 'config', { name: 'Saved frame' });
    hello(rooms, overlay, sessionA, 'overlay');
    rooms.disconnect(editor);
    expect(overlay.messages.at(-1)).toEqual({ t: 'status', editors: 0, overlays: 1 });
    expect(rooms.roomCount).toBe(1);
    rooms.disconnect(overlay);
    expect(rooms.roomCount).toBe(0);
    const fresh = new Client();
    hello(rooms, fresh, sessionA, 'overlay');
    expect(fresh.messages).toEqual([{ t: 'status', editors: 0, overlays: 1 }]);
  });
});
