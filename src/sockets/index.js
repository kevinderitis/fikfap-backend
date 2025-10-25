import { Server } from 'socket.io';
export function mountSockets(httpServer) {
  const io = new Server(httpServer, { cors: { origin: process.env.CORS_ORIGINS?.split(','), credentials: true } });
  io.on('connection', (socket) => {
    socket.on('ping', ()=> socket.emit('pong'));
  });
  return io;
}
