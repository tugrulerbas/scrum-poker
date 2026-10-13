import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { SWEEP_INTERVAL_MS } from '../shared/constants.ts';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../shared/types.ts';
import { broadcastRoom, registerHandlers } from './handlers.ts';
import { sweep } from './rooms.ts';

type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

let handle: Middleware = (_req, _res, next) => next();

const httpServer = createServer((req, res) => {
  if (req.url === '/healthz') {
    // Render deploy edilen commit'i RENDER_GIT_COMMIT ile verir; canlı sürümü doğrulamak için.
    res.end(`ok ${process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? 'local'}`);
    return;
  }
  handle(req, res, () => {
    res.statusCode = 404;
    res.end('Not found');
  });
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
  // Vite HMR websocket'i aynı sunucuyu kullandığı için diğer upgrade'leri kapatma.
  destroyUpgrade: false,
});
registerHandlers(io);

setInterval(() => {
  for (const room of sweep()) broadcastRoom(io, room);
}, SWEEP_INTERVAL_MS).unref();

if (isProd) {
  const { default: sirv } = await import('sirv');
  handle = sirv(fileURLToPath(new URL('../dist/client', import.meta.url)), { single: true });
} else {
  const { createServer: createVite } = await import('vite');
  const vite = await createVite({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    root: fileURLToPath(new URL('../client', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: 'spa',
  });
  handle = vite.middlewares;
}

httpServer.listen(PORT, () => {
  console.log(`Scrum Poker http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
});
