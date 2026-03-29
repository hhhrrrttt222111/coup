import { Router } from 'express';
import PlayerService from '../services/PlayerService';
import { AppError } from '../types';
import type { TypedHandler } from '../middleware/typedHandler';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/players/:id — Get a single player by ID
// ---------------------------------------------------------------------------

const getPlayer: TypedHandler<unknown, Record<string, never>, { id: string }> = async (req, res, next) => {
  try {
    const player = await PlayerService.getPlayer(req.params.id);
    if (!player) {
      throw new AppError('Player not found', 'PLAYER_NOT_FOUND', 404);
    }
    res.json(player);
  } catch (err) {
    next(err);
  }
};

router.get('/:id', getPlayer);

// ---------------------------------------------------------------------------
// GET /api/players/:id/cards — Get a player's cards
// ---------------------------------------------------------------------------

const getPlayerCards: TypedHandler<unknown, Record<string, never>, { id: string }> = async (req, res, next) => {
  try {
    const cards = await PlayerService.getPlayerCards(req.params.id);
    res.json(cards);
  } catch (err) {
    next(err);
  }
};

router.get('/:id/cards', getPlayerCards);

export default router;
