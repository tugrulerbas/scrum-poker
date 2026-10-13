import { FACILITATOR_GRACE_MS, MAX_PARTICIPANTS, MAX_STORIES, NAME_MAX } from '../shared/constants.ts';
import type { AckError, Card, ErrorCode } from '../shared/types.ts';
import { isOnline, newRoomId, newToken, randomId, rooms, tokenMatches, type Participant, type Room } from './rooms.ts';
import { checkName, checkStory } from './validate.ts';

type Result<T = {}> = ({ ok: true } & T) | AckError;

const fail = (error: ErrorCode, extra: Partial<AckError> = {}): AckError => ({ ok: false, error, ...extra });

const touch = (room: Room) => {
  room.lastActivityAt = Date.now();
};

const nameKey = (s: string) => s.normalize('NFC').toLocaleLowerCase('tr');

function nameTaken(room: Room, name: string): boolean {
  const key = nameKey(name);
  for (const p of room.participants.values()) if (nameKey(p.name) === key) return true;
  return false;
}

function suggestName(room: Room, name: string): string {
  for (let n = 2; ; n++) {
    const suffix = ` (${n})`;
    const base = [...name].slice(0, NAME_MAX - suffix.length).join('').trimEnd();
    const candidate = base + suffix;
    if (!nameTaken(room, candidate)) return candidate;
  }
}

function newParticipant(name: string): Participant {
  return { id: randomId(9), token: newToken(), name, joinedAt: Date.now(), socketIds: new Set(), offlineSince: Date.now() };
}

export function newRound(room: Room): void {
  room.round = { id: room.round.id + 1, status: 'voting', votes: new Map(), revealedAt: null };
}

export function createRoom(rawName: unknown): Result<{ room: Room; participant: Participant }> {
  const check = checkName(rawName);
  if (!check.ok) return fail('INVALID_NAME', { reason: check.reason });
  const p = newParticipant(check.name);
  const now = Date.now();
  const room: Room = {
    id: newRoomId(),
    createdAt: now,
    lastActivityAt: now,
    facilitatorId: p.id,
    participants: new Map([[p.id, p]]),
    stories: [],
    activeStoryId: null,
    round: { id: 1, status: 'voting', votes: new Map(), revealedAt: null },
  };
  rooms.set(room.id, room);
  return { ok: true, room, participant: p };
}

export function joinRoom(room: Room, rawName: unknown): Result<{ participant: Participant }> {
  const check = checkName(rawName);
  if (!check.ok) return fail('INVALID_NAME', { reason: check.reason });
  if (room.participants.size >= MAX_PARTICIPANTS) return fail('ROOM_FULL');
  if (nameTaken(room, check.name)) return fail('NAME_TAKEN', { suggestion: suggestName(room, check.name) });
  const p = newParticipant(check.name);
  room.participants.set(p.id, p);
  touch(room);
  return { ok: true, participant: p };
}

export function findForRejoin(room: Room, participantId: unknown, token: unknown): Participant | null {
  if (typeof participantId !== 'string' || typeof token !== 'string') return null;
  const p = room.participants.get(participantId);
  return p && tokenMatches(p.token, token) ? p : null;
}

export function attachSocket(room: Room, p: Participant, socketId: string): void {
  p.socketIds.add(socketId);
  p.offlineSince = null;
  touch(room);
}

/** Son socket kopunca true döner. */
export function detachSocket(room: Room, participantId: string, socketId: string): boolean {
  const p = room.participants.get(participantId);
  if (!p || !p.socketIds.delete(socketId)) return false;
  touch(room);
  if (p.socketIds.size > 0) return false;
  p.offlineSince = Date.now();
  return true;
}

/**
 * Facilitator çevrimdışıysa ve grace süresi dolduysa (ya da odadan silindiyse)
 * yetkiyi en eski çevrimiçi katılımcıya verir. Değiştiyse yeni facilitator'ı döner.
 */
export function ensureFacilitator(room: Room, now = Date.now()): Participant | null {
  const f = room.participants.get(room.facilitatorId);
  if (f && (isOnline(f) || (f.offlineSince !== null && now - f.offlineSince < FACILITATOR_GRACE_MS))) return null;
  let next: Participant | null = null;
  for (const p of room.participants.values()) {
    if (isOnline(p) && (!next || p.joinedAt < next.joinedAt)) next = p;
  }
  if (!next || next.id === room.facilitatorId) return null;
  room.facilitatorId = next.id;
  return next;
}

function reveal(room: Room): void {
  room.round.status = 'revealed';
  room.round.revealedAt = Date.now();
}

const requireF = (room: Room, pid: string) => (room.facilitatorId === pid ? null : fail('NOT_FACILITATOR'));

export function castVote(room: Room, pid: string, roundId: number, card: Card | null): Result {
  if (roundId !== room.round.id) return fail('STALE_ROUND');
  if (room.round.status !== 'voting') return fail('ROUND_REVEALED');
  if (card === null) room.round.votes.delete(pid);
  else room.round.votes.set(pid, card);
  touch(room);
  return { ok: true };
}

export function revealRound(room: Room, pid: string, roundId: number): Result {
  const err = requireF(room, pid);
  if (err) return err;
  if (roundId !== room.round.id || room.round.status !== 'voting') return fail('STALE_ROUND');
  if (room.round.votes.size === 0) return fail('NO_VOTES');
  reveal(room);
  touch(room);
  return { ok: true };
}

export function revote(room: Room, pid: string, roundId: number): Result {
  const err = requireF(room, pid);
  if (err) return err;
  if (roundId !== room.round.id) return fail('STALE_ROUND');
  newRound(room);
  touch(room);
  return { ok: true };
}

// --- Story kuyruğu ---

const findStory = (room: Room, id: string) => room.stories.find((s) => s.id === id);

export function addStory(room: Room, pid: string, title: unknown, description: unknown): Result<{ storyId: string }> {
  const err = requireF(room, pid);
  if (err) return err;
  const data = checkStory(title, description);
  if (!data) return fail('INVALID_INPUT');
  if (room.stories.length >= MAX_STORIES) return fail('TOO_MANY_STORIES');
  const story = { id: randomId(6), ...data, points: null };
  room.stories.push(story);
  // Aktif story yoksa ve süren turda oy yoksa yeni story'yi aktif yap (hızlı turu bozmadan).
  if (room.activeStoryId === null && room.round.status === 'voting' && room.round.votes.size === 0) {
    room.activeStoryId = story.id;
  }
  touch(room);
  return { ok: true, storyId: story.id };
}

export function updateStory(room: Room, pid: string, storyId: string, title: unknown, description: unknown): Result {
  const err = requireF(room, pid);
  if (err) return err;
  const story = findStory(room, storyId);
  if (!story) return fail('STORY_NOT_FOUND');
  const data = checkStory(title, description);
  if (!data) return fail('INVALID_INPUT');
  Object.assign(story, data);
  touch(room);
  return { ok: true };
}

export function deleteStory(room: Room, pid: string, storyId: string): Result<{ activeDeleted: boolean }> {
  const err = requireF(room, pid);
  if (err) return err;
  const idx = room.stories.findIndex((s) => s.id === storyId);
  if (idx < 0) return fail('STORY_NOT_FOUND');
  room.stories.splice(idx, 1);
  const activeDeleted = room.activeStoryId === storyId;
  if (activeDeleted) {
    room.activeStoryId = null;
    newRound(room);
  }
  touch(room);
  return { ok: true, activeDeleted };
}

export function moveStory(room: Room, pid: string, storyId: string, toIndex: number): Result {
  const err = requireF(room, pid);
  if (err) return err;
  const idx = room.stories.findIndex((s) => s.id === storyId);
  if (idx < 0) return fail('STORY_NOT_FOUND');
  const target = Math.max(0, Math.min(room.stories.length - 1, toIndex));
  const [story] = room.stories.splice(idx, 1);
  room.stories.splice(target, 0, story);
  touch(room);
  return { ok: true };
}

export function activateStory(room: Room, pid: string, storyId: string): Result {
  const err = requireF(room, pid);
  if (err) return err;
  if (!findStory(room, storyId)) return fail('STORY_NOT_FOUND');
  if (room.activeStoryId === storyId) return { ok: true };
  room.activeStoryId = storyId;
  newRound(room);
  touch(room);
  return { ok: true };
}

export function setPoints(room: Room, pid: string, storyId: string, card: Card): Result {
  const err = requireF(room, pid);
  if (err) return err;
  const story = findStory(room, storyId);
  if (!story) return fail('STORY_NOT_FOUND');
  story.points = card;
  touch(room);
  return { ok: true };
}

/** Aktif story'den sonraki ilk puansız story'ye (gerekirse baştan) geçer; yoksa aktif story kalmaz. */
export function nextStory(room: Room, pid: string): Result {
  const err = requireF(room, pid);
  if (err) return err;
  const start = room.stories.findIndex((s) => s.id === room.activeStoryId) + 1;
  const ordered = [...room.stories.slice(start), ...room.stories.slice(0, start)];
  const next = ordered.find((s) => s.points === null && s.id !== room.activeStoryId);
  room.activeStoryId = next ? next.id : null;
  newRound(room);
  touch(room);
  return { ok: true };
}
