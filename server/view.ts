import type { Card, RoomView } from '../shared/types.ts';
import { isOnline, type Room } from './rooms.ts';

/**
 * Kişiye özel oda görünümü. Gizlilik kuralı: oylar yalnızca tur açıldıktan sonra
 * gönderilir; voting sırasında kişi yalnızca kendi oyunu `you.vote` ile görür. Token asla yok.
 */
export function toView(room: Room, participantId: string): RoomView {
  const { round } = room;
  let votes: Record<string, Card> | undefined;
  if (round.status === 'revealed') votes = Object.fromEntries(round.votes);
  return {
    id: room.id,
    facilitatorId: room.facilitatorId,
    participants: [...room.participants.values()].map((p) => ({
      id: p.id,
      name: p.name,
      online: isOnline(p),
      hasVoted: round.votes.has(p.id),
    })),
    stories: room.stories.map((s) => ({ ...s })),
    activeStoryId: room.activeStoryId,
    round: { id: round.id, status: round.status, ...(votes ? { votes } : {}) },
    you: { id: participantId, vote: round.votes.get(participantId) ?? null },
  };
}
