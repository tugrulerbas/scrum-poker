import { io, type Socket } from 'socket.io-client';
import type { AckError, ClientToServerEvents, ServerToClientEvents } from '../../shared/types.ts';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

type Payload<E extends keyof ClientToServerEvents> = Parameters<ClientToServerEvents[E]>[0];
type Reply<E extends keyof ClientToServerEvents> =
  Parameters<ClientToServerEvents[E]>[1] extends (res: infer R) => void ? R : never;

/** Ack'li emit; zaman aşımı/bağlantı hatası `TIMEOUT` olarak döner. */
export async function call<E extends keyof ClientToServerEvents>(event: E, payload: Payload<E>): Promise<Reply<E>> {
  try {
    const timed = socket.timeout(8000);
    const emit = timed.emitWithAck.bind(timed) as unknown as (e: E, p: Payload<E>) => Promise<Reply<E>>;
    return await emit(event, payload);
  } catch {
    const err: AckError = { ok: false, error: 'TIMEOUT' };
    return err as Reply<E>;
  }
}
