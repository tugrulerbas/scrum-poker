import type { DECK } from './constants.ts';

export type Card = (typeof DECK)[number];

export interface StoryView {
  id: string;
  title: string;
  description: string;
  points: Card | null;
}

export interface ParticipantView {
  id: string;
  name: string;
  online: boolean;
  hasVoted: boolean;
}

export interface RoundView {
  id: number;
  status: 'voting' | 'revealed';
  /** Yalnızca status === 'revealed' iken dolu. */
  votes?: Record<string, Card>;
}

export interface RoomView {
  id: string;
  facilitatorId: string;
  participants: ParticipantView[];
  stories: StoryView[];
  activeStoryId: string | null;
  round: RoundView;
  you: { id: string; vote: Card | null };
}

export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'INVALID_NAME'
  | 'NAME_TAKEN'
  | 'INVALID_TOKEN'
  | 'NOT_IN_ROOM'
  | 'NOT_FACILITATOR'
  | 'STALE_ROUND'
  | 'ROUND_REVEALED'
  | 'NO_VOTES'
  | 'STORY_NOT_FOUND'
  | 'TOO_MANY_STORIES'
  | 'INVALID_INPUT'
  | 'SERVER_BUSY'
  | 'RATE_LIMITED'
  | 'GIF_DISABLED'
  | 'GIF_UNAVAILABLE'
  | 'TIMEOUT';

export type AckError = {
  ok: false;
  error: ErrorCode;
  /** NAME_TAKEN için önerilen isim. */
  suggestion?: string;
  /** INVALID_NAME için neden. */
  reason?: 'EMPTY' | 'TOO_LONG';
};

export type Ack<T = {}> = ({ ok: true } & T) | AckError;
export type AckFn<T = {}> = (res: Ack<T>) => void;

export type Identity = { participantId: string; token: string };

export interface ClientToServerEvents {
  'room:check': (p: { roomId: string }, ack: AckFn) => void;
  'room:create': (p: { name: string }, ack: AckFn<Identity & { roomId: string }>) => void;
  'room:join': (p: { roomId: string; name: string }, ack: AckFn<Identity>) => void;
  'room:rejoin': (p: { roomId: string } & Identity, ack: AckFn) => void;
  'room:leave': (p: { roomId: string }) => void;
  'vote:cast': (p: { roundId: number; card: Card | null }, ack: AckFn) => void;
  'round:reveal': (p: { roundId: number }, ack: AckFn) => void;
  'round:revote': (p: { roundId: number }, ack: AckFn) => void;
  'story:add': (p: { title: string; description: string }, ack: AckFn<{ storyId: string }>) => void;
  'story:update': (p: { storyId: string; title: string; description: string }, ack: AckFn) => void;
  'story:delete': (p: { storyId: string }, ack: AckFn) => void;
  'story:move': (p: { storyId: string; toIndex: number }, ack: AckFn) => void;
  'story:activate': (p: { storyId: string }, ack: AckFn) => void;
  'story:setPoints': (p: { storyId: string; card: Card }, ack: AckFn) => void;
  'story:next': (p: {}, ack: AckFn) => void;
  'gif:search': (p: { q: string }, ack: AckFn<{ items: GifItem[] }>) => void;
  'gif:send': (p: { id: string }, ack: AckFn) => void;
}

export type Notice =
  | { code: 'ACTIVE_STORY_DELETED' }
  | { code: 'FACILITATOR_CHANGED'; facilitatorId: string; name: string };

/** GIPHY sonucu; `preview`/`still` sunucuda doğrulanmış GIPHY medya URL'leri. */
export interface GifItem {
  id: string;
  w: number;
  h: number;
  preview: string;
  still: string;
}

export interface GifEvent {
  id: string;
  fromId: string;
  url: string;
}

export interface ServerToClientEvents {
  'room:state': (view: RoomView) => void;
  notice: (n: Notice) => void;
  gif: (g: GifEvent) => void;
}

export interface SocketData {
  roomId?: string;
  participantId?: string;
}
