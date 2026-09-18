import { DEFAULT_CONFIG } from '../presets';
import { mergeConfig } from './sanitizeConfig';
import { sanitizeOverlayRig } from './overlayFrames';
import { isOverlayHello, type OverlayHello } from './overlaySession';

interface RelayClient {
  readyState: number;
  send(message: string): void;
  close(code: number, reason: string): void;
}
interface Room {
  editors: Set<RelayClient>;
  overlays: Set<RelayClient>;
  config: string | null;
  rig: string | null;
}
interface Membership {
  room: Room;
  session: string;
  role: OverlayHello['role'];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Pairing, cached frames and connection counts are confined to one studio. */
export class OverlayRooms {
  private rooms = new Map<string, Room>();
  private clients = new Map<RelayClient, Membership>();

  get roomCount() {
    return this.rooms.size;
  }

  private send(client: RelayClient, message: string) {
    if (client.readyState === 1) client.send(message);
  }

  private status(room: Room) {
    const message = JSON.stringify({ t: 'status', overlays: room.overlays.size, editors: room.editors.size });
    [...room.editors, ...room.overlays].forEach((client) => this.send(client, message));
  }

  receive(client: RelayClient, raw: string) {
    if (client.readyState !== 1) return;
    let message: unknown;
    try {
      message = JSON.parse(raw);
    } catch {
      client.close(1008, 'Invalid relay message');
      return;
    }
    if (!isObject(message)) {
      client.close(1008, 'Invalid relay message');
      return;
    }
    const membership = this.clients.get(client);
    if (!membership) {
      if (!isOverlayHello(message)) {
        client.close(1008, 'Studio pairing required');
        return;
      }
      let room = this.rooms.get(message.session);
      if (!room) {
        room = { editors: new Set(), overlays: new Set(), config: null, rig: null };
        this.rooms.set(message.session, room);
      }
      this.clients.set(client, { room, session: message.session, role: message.role });
      (message.role === 'editor' ? room.editors : room.overlays).add(client);
      this.status(room);
      if (message.role === 'overlay') {
        if (room.config) this.send(client, room.config);
        if (room.rig) this.send(client, room.rig);
      }
      return;
    }
    if (message.t === 'hello' || membership.role !== 'editor') {
      client.close(1008, 'This connection cannot publish');
      return;
    }
    const kind = message.t;
    if ((kind !== 'config' && kind !== 'rig') || !isObject(message[kind])) {
      client.close(1008, 'Invalid avatar frame');
      return;
    }
    const payload = kind === 'config' ? mergeConfig(DEFAULT_CONFIG, message.config) : sanitizeOverlayRig(message.rig);
    if (!payload) {
      client.close(1008, 'Invalid avatar frame');
      return;
    }
    const frame = JSON.stringify({ t: kind, [kind]: payload });
    membership.room[kind] = frame;
    membership.room.overlays.forEach((overlay) => this.send(overlay, frame));
  }

  disconnect(client: RelayClient) {
    const membership = this.clients.get(client);
    if (!membership) return;
    this.clients.delete(client);
    const { room, session } = membership;
    room.editors.delete(client);
    room.overlays.delete(client);
    if (!room.editors.size && !room.overlays.size) this.rooms.delete(session);
    else this.status(room);
  }
}
