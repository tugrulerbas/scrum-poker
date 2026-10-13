import type { Server, Socket } from 'socket.io';
import { FACILITATOR_GRACE_MS, RATE_CREATE_MAX, RATE_JOIN_MAX, RATE_WINDOW_MS } from '../shared/constants.ts';
import type { AckError, ClientToServerEvents, ErrorCode, ServerToClientEvents, SocketData } from '../shared/types.ts';
import * as logic from './room-logic.ts';
import { rooms, roomsFull, type Participant, type Room } from './rooms.ts';
import { createLimiter } from './rate-limit.ts';
import { isCard, isId, isInt, isNumericCard, isObject } from './validate.ts';
import { toView } from './view.ts';

type IO = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
type ClientSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
type AnyAck = (res: any) => void;

const fail = (error: ErrorCode): AckError => ({ ok: false, error });

export function broadcastRoom(io: IO, room: Room): void {
  for (const p of room.participants.values()) {
    if (p.socketIds.size === 0) continue;
    const view = toView(room, p.id);
    for (const sid of p.socketIds) io.sockets.sockets.get(sid)?.emit('room:state', view);
  }
}

function emitToParticipant(io: IO, p: Participant, fn: (s: ClientSocket) => void): void {
  for (const sid of p.socketIds) {
    const s = io.sockets.sockets.get(sid);
    if (s) fn(s);
  }
}

function announceFacilitator(io: IO, room: Room, f: Participant | null): void {
  if (!f) return;
  for (const p of room.participants.values()) {
    emitToParticipant(io, p, (s) => s.emit('notice', { code: 'FACILITATOR_CHANGED', facilitatorId: f.id, name: f.name }));
  }
}

function scheduleFacilitatorCheck(io: IO, room: Room): void {
  setTimeout(() => {
    if (rooms.get(room.id) !== room) return;
    const f = logic.ensureFacilitator(room);
    if (f) {
      broadcastRoom(io, room);
      announceFacilitator(io, room, f);
    }
  }, FACILITATOR_GRACE_MS + 100).unref();
}


// Render gibi bir proxy arkasında gerçek istemci IP'si X-Forwarded-For'un ilk girdisidir.
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
function clientIp(handshake: { address: string; headers: Record<string, string | string[] | undefined> }): string {
  const fwd = handshake.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  return (TRUST_PROXY && first) || handshake.address;
}

const createLimit = createLimiter(RATE_CREATE_MAX, RATE_WINDOW_MS);
const joinLimit = createLimiter(RATE_JOIN_MAX, RATE_WINDOW_MS);

export function registerHandlers(io: IO): void {
  io.on('connection', (socket) => {
    const ip = clientIp(socket.handshake);
    const limited = (limit: ReturnType<typeof createLimiter>) => !limit(socket.id) || !limit(`ip:${ip}`);

    const detach = () => {
      const { roomId, participantId } = socket.data;
      socket.data = {};
      if (!roomId || !participantId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const wentOffline = logic.detachSocket(room, participantId, socket.id);
      if (wentOffline) {
        if (room.facilitatorId === participantId) scheduleFacilitatorCheck(io, room);
      }
      broadcastRoom(io, room);
    };

    const enter = (room: Room, p: Participant) => {
      if (socket.data.roomId !== room.id || socket.data.participantId !== p.id) detach();
      socket.data = { roomId: room.id, participantId: p.id };
      logic.attachSocket(room, p, socket.id);
      const f = logic.ensureFacilitator(room);
      broadcastRoom(io, room);
      announceFacilitator(io, room, f);
    };

    /** Odadaki katılımcı adına çalışan event'ler için ortak sarmalayıcı. */
    const inRoom = <P>(
      event: keyof ClientToServerEvents,
      run: (room: Room, pid: string, p: P) => ({ ok: true } & Record<string, unknown>) | AckError,
      after?: (room: Room, pid: string, res: any) => void,
    ) => {
      socket.on(event, (payload: unknown, ack: unknown) => {
        const reply: AnyAck = typeof ack === 'function' ? (ack as AnyAck) : () => {};
        const { roomId, participantId } = socket.data;
        const room = roomId ? rooms.get(roomId) : undefined;
        if (!room || !participantId || !room.participants.has(participantId)) return reply(fail('NOT_IN_ROOM'));
        if (!isObject(payload)) return reply(fail('INVALID_INPUT'));
        const res = run(room, participantId, payload as P);
        if (res.ok) {
          broadcastRoom(io, room);
          after?.(room, participantId, res);
        }
        reply(res);
      });
    };

    socket.on('room:check', (payload, ack) => {
      if (typeof ack !== 'function') return;
      const roomId = isObject(payload) ? payload.roomId : undefined;
      ack(isId(roomId) && rooms.has(roomId) ? { ok: true } : fail('ROOM_NOT_FOUND'));
    });

    socket.on('room:create', (payload, ack) => {
      if (typeof ack !== 'function') return;
      if (limited(createLimit) || roomsFull()) return ack(fail('SERVER_BUSY'));
      const res = logic.createRoom(isObject(payload) ? payload.name : undefined);
      if (!res.ok) return ack(res);
      enter(res.room, res.participant);
      ack({ ok: true, roomId: res.room.id, participantId: res.participant.id, token: res.participant.token });
    });

    socket.on('room:join', (payload, ack) => {
      if (typeof ack !== 'function') return;
      if (!isObject(payload) || !isId(payload.roomId)) return ack(fail('INVALID_INPUT'));
      if (limited(joinLimit)) return ack(fail('SERVER_BUSY'));
      const room = rooms.get(payload.roomId);
      if (!room) return ack(fail('ROOM_NOT_FOUND'));
      const res = logic.joinRoom(room, payload.name);
      if (!res.ok) return ack(res);
      enter(room, res.participant);
      ack({ ok: true, participantId: res.participant.id, token: res.participant.token });
    });

    socket.on('room:rejoin', (payload, ack) => {
      if (typeof ack !== 'function') return;
      if (!isObject(payload) || !isId(payload.roomId)) return ack(fail('INVALID_INPUT'));
      const room = rooms.get(payload.roomId);
      if (!room) return ack(fail('ROOM_NOT_FOUND'));
      const p = logic.findForRejoin(room, payload.participantId, payload.token);
      if (!p) return ack(fail('INVALID_TOKEN'));
      enter(room, p);
      ack({ ok: true });
    });

    socket.on('room:leave', (payload) => {
      if (isObject(payload) && payload.roomId === socket.data.roomId) detach();
    });

    inRoom<{ roundId: unknown; card: unknown }>('vote:cast', (room, pid, p) => {
      if (!isInt(p.roundId) || (p.card !== null && !isCard(p.card))) return fail('INVALID_INPUT');
      return logic.castVote(room, pid, p.roundId, p.card);
    });

    inRoom<{ roundId: unknown }>('round:reveal', (room, pid, p) =>
      isInt(p.roundId) ? logic.revealRound(room, pid, p.roundId) : fail('INVALID_INPUT'),
    );

    inRoom<{ roundId: unknown }>('round:revote', (room, pid, p) =>
      isInt(p.roundId) ? logic.revote(room, pid, p.roundId) : fail('INVALID_INPUT'),
    );

    inRoom<{ title: unknown; description: unknown }>('story:add', (room, pid, p) =>
      logic.addStory(room, pid, p.title, p.description),
    );

    inRoom<{ storyId: unknown; title: unknown; description: unknown }>('story:update', (room, pid, p) =>
      isId(p.storyId) ? logic.updateStory(room, pid, p.storyId, p.title, p.description) : fail('INVALID_INPUT'),
    );

    inRoom<{ storyId: unknown }>(
      'story:delete',
      (room, pid, p) => (isId(p.storyId) ? logic.deleteStory(room, pid, p.storyId) : fail('INVALID_INPUT')),
      (room, pid, res) => {
        const f = room.participants.get(pid);
        if (res.activeDeleted && f) emitToParticipant(io, f, (s) => s.emit('notice', { code: 'ACTIVE_STORY_DELETED' }));
      },
    );

    inRoom<{ storyId: unknown; toIndex: unknown }>('story:move', (room, pid, p) =>
      isId(p.storyId) && isInt(p.toIndex) ? logic.moveStory(room, pid, p.storyId, p.toIndex) : fail('INVALID_INPUT'),
    );

    inRoom<{ storyId: unknown }>('story:activate', (room, pid, p) =>
      isId(p.storyId) ? logic.activateStory(room, pid, p.storyId) : fail('INVALID_INPUT'),
    );

    inRoom<{ storyId: unknown; card: unknown }>('story:setPoints', (room, pid, p) =>
      isId(p.storyId) && isNumericCard(p.card) ? logic.setPoints(room, pid, p.storyId, p.card) : fail('INVALID_INPUT'),
    );

    inRoom<{}>('story:next', (room, pid) => logic.nextStory(room, pid));

    socket.on('disconnect', detach);
  });
}
