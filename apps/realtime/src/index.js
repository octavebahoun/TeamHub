import express from 'express';
import http from 'node:http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { config } from './config.js';
import { logger } from './logger.js';
import { handshakeCredentials, verifyToken } from './auth.js';
import { registerChatHandlers } from './handlers/chat.js';
import { startRedisSubscriber } from './redisSubscriber.js';

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true, service: 'realtime' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: config.corsOrigin, credentials: true },
});

io.use(async (socket, next) => {
  try {
    const { token, organizationId } = handshakeCredentials(socket.handshake);
    if (!token) return next(new Error('missing_token'));

    const verified = await verifyToken(token);
    socket.data.user = verified.user;
    socket.data.organizations = verified.organizations;
    socket.data.currentOrganizationId = organizationId || verified.current_organization_id;

    const membership = verified.organizations.find(
      (o) => o.id === socket.data.currentOrganizationId,
    );
    if (!membership) return next(new Error('not_in_organization'));
    socket.data.role = membership.role;

    next();
  } catch (err) {
    logger.warn({ msg: err.message }, 'socket auth failed');
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  const { user, currentOrganizationId } = socket.data;
  socket.join(`user:${user.id}`);
  socket.join(`org:${currentOrganizationId}`);

  socket.to(`org:${currentOrganizationId}`).emit('presence:update', {
    user_id: user.id,
    online: true,
  });

  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    socket.to(`org:${currentOrganizationId}`).emit('presence:update', {
      user_id: user.id,
      online: false,
    });
  });
});

async function start() {
  try {
    await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 3000 });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.warn({ err: err.message }, 'MongoDB not reachable — starting without persistence');
  }

  startRedisSubscriber(io);

  server.listen(config.port, () => {
    logger.info(`realtime listening on :${config.port}`);
  });
}

start();
