import { Router } from 'express';
import RoomService from '../services/RoomService';
import PlayerService from '../services/PlayerService';
import PlayerModel from '../models/Player';
import GameLog from '../models/GameLog';
import { AppError } from '../types';
import { validateBody, CreateRoomSchema, JoinRoomSchema } from '../middleware/validate';
import { createRoomLimiter, joinRoomLimiter } from '../middleware/rateLimiter';
import type { TypedHandler } from '../middleware/typedHandler';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/rooms — Create a new room (and its first player / host)
// ---------------------------------------------------------------------------

interface CreateRoomBody {
  playerName: string;
  maxPlayers: number;
}

const createRoom: TypedHandler<CreateRoomBody> = async (req, res, next) => {
  try {
    const { playerName, maxPlayers } = req.body;
    const { room, playerId } = await RoomService.createRoom({ playerName, maxPlayers });

    res.status(201).json({
      roomCode: room.code,
      playerId,
      roomId: room.id,
    });
  } catch (err) {
    next(err);
  }
};

router.post(
  '/',
  createRoomLimiter,
  validateBody(CreateRoomSchema),
  createRoom,
);

// ---------------------------------------------------------------------------
// GET /api/rooms/:code — Get room details + player list
// ---------------------------------------------------------------------------

const getRoom: TypedHandler<unknown, Record<string, never>, { code: string }> = async (req, res, next) => {
  try {
    const room = await RoomService.getRoomByCode(req.params.code);
    if (!room) {
      throw new AppError('Room not found', 'ROOM_NOT_FOUND', 404);
    }

    const players = await RoomService.getPlayers(room.id);

    res.json({ ...room, players });
  } catch (err) {
    next(err);
  }
};

router.get('/:code', getRoom);

// ---------------------------------------------------------------------------
// POST /api/rooms/:code/join — Join an existing room
// ---------------------------------------------------------------------------

interface JoinRoomBody {
  playerName: string;
}

const joinRoom: TypedHandler<JoinRoomBody, Record<string, never>, { code: string }> = async (req, res, next) => {
  try {
    const room = await RoomService.getRoomByCode(req.params.code);
    if (!room) {
      throw new AppError('Room not found', 'ROOM_NOT_FOUND', 404);
    }

    if (room.status !== 'waiting') {
      throw new AppError('Room is not accepting players', 'ROOM_NOT_WAITING', 400);
    }

    const players = await RoomService.getPlayers(room.id);
    const trimmedName = req.body.playerName.trim();

    const existing = await PlayerModel.findByRoomAndName(room.id, trimmedName);
    if (existing) {
      return res.status(200).json({ playerId: existing.id });
    }

    if (players.length >= room.max_players) {
      throw new AppError('Room is full', 'ROOM_FULL', 400);
    }

    const player = await PlayerService.createPlayer({
      roomId: room.id,
      name: trimmedName,
    });

    res.status(201).json({ playerId: player.id });
  } catch (err) {
    next(err);
  }
};

router.post(
  '/:code/join',
  joinRoomLimiter,
  validateBody(JoinRoomSchema),
  joinRoom,
);

// ---------------------------------------------------------------------------
// GET /api/rooms/:code/log — Get game log for a room
// ---------------------------------------------------------------------------

const getRoomLog: TypedHandler<unknown, Record<string, never>, { code: string }> = async (req, res, next) => {
  try {
    const room = await RoomService.getRoomByCode(req.params.code);
    if (!room) {
      throw new AppError('Room not found', 'ROOM_NOT_FOUND', 404);
    }

    const log = await GameLog.findByRoom(room.id);
    res.json(log);
  } catch (err) {
    next(err);
  }
};

router.get('/:code/log', getRoomLog);

export default router;
