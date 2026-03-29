import db from '../config/db';
import PlayerModel from '../models/Player';
import { AppError } from '../types';
import type { Player as PlayerType, PlayerCard, CardType } from '../types';

interface CreatePlayerParams {
  roomId: string;
  name: string;
  socketId?: string;
}

const PlayerService = {
  async createPlayer({ roomId, name, socketId }: CreatePlayerParams): Promise<PlayerType> {
    const player = await PlayerModel.create(roomId, name);
    if (socketId) {
      await PlayerModel.setSocket(player.id, socketId);
    }
    return player;
  },

  async getPlayer(playerId: string): Promise<PlayerType | null> {
    return PlayerModel.findById(playerId);
  },

  async updateCoins(playerId: string, delta: number): Promise<PlayerType> {
    const player = await PlayerModel.findById(playerId);
    if (!player) throw new AppError('Player not found', 'PLAYER_NOT_FOUND', 404);
    const newCoins = Math.max(0, player.coins + delta);
    return PlayerModel.updateCoins(playerId, newCoins);
  },

  async markEliminated(playerId: string): Promise<void> {
    const player = await PlayerModel.findById(playerId);
    if (!player) throw new AppError('Player not found', 'PLAYER_NOT_FOUND', 404);
    await PlayerModel.eliminate(playerId);
  },

  async getPlayerCards(playerId: string): Promise<PlayerCard[]> {
    const { rows } = await db.query<PlayerCard>(
      `SELECT * FROM player_cards WHERE player_id = $1 ORDER BY id`,
      [playerId],
    );
    return rows;
  },

  async assignCards(playerId: string, cards: CardType[]): Promise<void> {
    const values = cards
      .map((_, i) => `($1, $${i + 2})`)
      .join(', ');
    await db.query(
      `INSERT INTO player_cards (player_id, card) VALUES ${values}`,
      [playerId, ...cards],
    );
  },
};

export default PlayerService;
