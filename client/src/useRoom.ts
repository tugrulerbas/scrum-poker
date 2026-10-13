import { useCallback, useEffect, useRef, useState } from 'react';
import type { AckError, Card, ClientToServerEvents, Notice, RoomView } from '../../shared/types.ts';
import { clearRoomIdentity, getRoomIdentity, setProfileName, setRoomIdentity } from './identity.ts';
import { call, socket } from './socket.ts';
import { useToast } from './toasts.tsx';

export type RoomStatus = 'loading' | 'name' | 'in' | 'notFound' | 'full';

export const GENERIC_ERROR = 'Bir şeyler ters gitti, tekrar dene.';

export function useRoom(roomId: string) {
  const toast = useToast();
  const [status, setStatus] = useState<RoomStatus>('loading');
  const [view, setView] = useState<RoomView | null>(null);
  const [pendingVote, setPendingVote] = useState<{ roundId: number; card: Card | null } | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const voteSeq = useRef(0);

  const sync = useCallback(async () => {
    const identity = getRoomIdentity(roomId);
    if (identity) {
      const res = await call('room:rejoin', { roomId, ...identity });
      if (res.ok) return setStatus('in');
      if (res.error === 'ROOM_NOT_FOUND') return setStatus('notFound');
      if (res.error === 'INVALID_TOKEN') {
        clearRoomIdentity(roomId);
        setView(null);
      } else if (res.error === 'TIMEOUT') {
        setTimeout(() => socket.connected && sync(), 2000);
        return;
      }
    }
    if (statusRef.current === 'in' || statusRef.current === 'loading') {
      const check = await call('room:check', { roomId });
      if (check.ok) setStatus('name');
      else if (check.error === 'ROOM_NOT_FOUND') setStatus('notFound');
    }
  }, [roomId]);

  useEffect(() => {
    const onState = (v: RoomView) => {
      if (v.id !== roomId) return;
      setView(v);
      setPendingVote((pv) => (pv && pv.roundId === v.round.id && v.you.vote !== pv.card ? pv : null));
    };
    const onNotice = (n: Notice) => {
      if (n.code === 'FACILITATOR_CHANGED') toast(`Facilitator artık ${n.name}.`);
      else if (n.code === 'ACTIVE_STORY_DELETED') toast('Aktif story silindi, oylar temizlendi.', 'warning');
    };
    socket.on('room:state', onState);
    socket.on('notice', onNotice);
    socket.on('connect', sync);
    if (socket.connected) sync();
    return () => {
      socket.off('room:state', onState);
      socket.off('notice', onNotice);
      socket.off('connect', sync);
      socket.emit('room:leave', { roomId });
    };
  }, [roomId, sync, toast]);

  const join = useCallback(
    async (name: string): Promise<AckError | null> => {
      const res = await call('room:join', { roomId, name });
      if (!res.ok) {
        if (res.error === 'ROOM_NOT_FOUND') setStatus('notFound');
        else if (res.error === 'ROOM_FULL') setStatus('full');
        return res;
      }
      setRoomIdentity(roomId, { participantId: res.participantId, token: res.token });
      setProfileName(name.trim());
      setStatus('in');
      return null;
    },
    [roomId],
  );

  /** Odadaki aksiyonlar: hata olursa toast gösterir, başarıda true döner. */
  const act = useCallback(
    async <E extends keyof ClientToServerEvents>(event: E, payload: Parameters<ClientToServerEvents[E]>[0]) => {
      const res = (await call(event, payload)) as { ok: boolean; error?: string };
      if (res.ok) return true;
      if (res.error === 'STALE_ROUND' && event === 'round:reveal') return false;
      if (res.error === 'ROUND_REVEALED' && event === 'vote:cast') return false;
      if (res.error === 'STALE_ROUND') toast('Eski bir tur için işlem yapıldı, ekran güncellendi.', 'warning');
      else if (res.error === 'NOT_IN_ROOM') sync();
      else toast(GENERIC_ERROR, 'warning');
      return false;
    },
    [toast, sync],
  );

  const vote = useCallback(
    async (card: Card | null) => {
      if (!view) return;
      const roundId = view.round.id;
      const seq = ++voteSeq.current;
      setPendingVote({ roundId, card });
      const ok = await act('vote:cast', { roundId, card });
      if (!ok && seq === voteSeq.current) setPendingVote(null);
    },
    [view, act],
  );

  const myVote = pendingVote && view && pendingVote.roundId === view.round.id ? pendingVote.card : (view?.you.vote ?? null);

  return {
    status,
    setStatus,
    view,
    myVote,
    join,
    vote,
    act,
  };
}
