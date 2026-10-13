import { randomBytes, timingSafeEqual } from 'node:crypto';
import { MAX_ROOMS, OFFLINE_REMOVE_MS, ROOM_ID_BYTES, ROOM_TTL_MS, TOKEN_BYTES } from '../shared/constants.ts';
import type { Card } from '../shared/types.ts';

export interface Participant {
  id: string;
  token: string;
  name: string;
  joinedAt: number;
  socketIds: Set<string>;
  offlineSince: number | null;
}

export interface Round {
  id: number;
  status: 'voting' | 'revealed';
  votes: Map<string, Card>;
  revealedAt: number | null;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  points: Card | null;
}

export interface Room {
  id: string;
  createdAt: number;
  lastActivityAt: number;
  facilitatorId: string;
  participants: Map<string, Participant>;
  stories: Story[];
  activeStoryId: string | null;
  round: Round;
}

export const rooms = new Map<string, Room>();

export const randomId = (bytes: number) => randomBytes(bytes).toString('base64url');

export function newRoomId(): string {
  let id = randomId(ROOM_ID_BYTES);
  while (rooms.has(id)) id = randomId(ROOM_ID_BYTES);
  return id;
}

export const newToken = () => randomId(TOKEN_BYTES);

export function tokenMatches(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const isOnline = (p: Participant) => p.socketIds.size > 0;

export const roomsFull = () => rooms.size >= MAX_ROOMS;

/**
 * Süresi dolan odaları ve uzun süre çevrimdışı kalan katılımcıları temizler.
 * Katılımcısı değişen odaların listesini döner (yayın için).
 */
export function sweep(now = Date.now()): Room[] {
  const changed: Room[] = [];
  for (const room of rooms.values()) {
    const anyOnline = [...room.participants.values()].some(isOnline);
    if (!anyOnline && now - room.lastActivityAt > ROOM_TTL_MS) {
      rooms.delete(room.id);
      continue;
    }
    let removed = false;
    for (const p of room.participants.values()) {
      if (!isOnline(p) && p.offlineSince !== null && now - p.offlineSince > OFFLINE_REMOVE_MS) {
        room.participants.delete(p.id);
        if (room.round.status === 'voting') room.round.votes.delete(p.id);
        removed = true;
      }
    }
    if (removed) changed.push(room);
  }
  return changed;
}
