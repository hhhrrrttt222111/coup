import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import pool, { connectDB } from './src/config/db';
import roomRoutes from './src/routes/rooms';
import playerRoutes from './src/routes/players';
import errorHandler from './src/middleware/errorHandler';
import registerGameSocket from './src/sockets/gameSocket';
import registerLobbySocket from './src/sockets/lobbySocket';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './src/sockets/socketTypes';

// ---------------------------------------------------------------------------
// CORS — supports comma-separated origins in CLIENT_URL
// ---------------------------------------------------------------------------

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// ---------------------------------------------------------------------------
// Express + Socket.IO
// ---------------------------------------------------------------------------

const app = express();
const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
});

app.use(cors(corsOptions));
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check — registered first so Render can always reach it
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ---------------------------------------------------------------------------
// REST routes
// ---------------------------------------------------------------------------

app.use('/api/rooms', roomRoutes);
app.use('/api/players', playerRoutes);

// ---------------------------------------------------------------------------
// Error handler (must be last middleware)
// ---------------------------------------------------------------------------

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Socket.IO namespaces
// ---------------------------------------------------------------------------

const lobbyNsp = io.of('/lobby');
registerLobbySocket(lobbyNsp);
registerGameSocket(io);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT || '3001', 10);

connectDB()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on 0.0.0.0:${PORT}`);
    });
  })
  .catch(() => {
    console.error('Failed to connect to database — exiting');
    process.exit(1);
  });

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — shutting down gracefully`);

  io.close();

  server.close(() => {
    console.log('HTTP server closed');
  });

  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing database pool:', err);
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
