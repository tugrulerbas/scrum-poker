import type { Identity } from '../../shared/types.ts';

export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* depolama kapalı olabilir */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* yok say */
    }
  },
};

const roomKey = (roomId: string) => `sp:room:${roomId}`;

export function getRoomIdentity(roomId: string): Identity | null {
  try {
    const v = JSON.parse(storage.get(roomKey(roomId)) ?? 'null');
    return v && typeof v.participantId === 'string' && typeof v.token === 'string' ? v : null;
  } catch {
    return null;
  }
}

export const setRoomIdentity = (roomId: string, id: Identity) => storage.set(roomKey(roomId), JSON.stringify(id));
export const clearRoomIdentity = (roomId: string) => storage.remove(roomKey(roomId));

export function getProfileName(): string {
  try {
    const v = JSON.parse(storage.get('sp:profile') ?? 'null');
    return v && typeof v.name === 'string' ? v.name : '';
  } catch {
    return '';
  }
}

export const setProfileName = (name: string) => storage.set('sp:profile', JSON.stringify({ name }));
