import db from '../config/db';
import type { Player as PlayerType } from '../types';

const Player = {
  async create(roomId: string, name: string): Promise<PlayerType> {
    const { rows } = await db.query<PlayerType>(
      `INSERT INTO players (room_id, name) VALUES ($1, $2) RETURNING *`,
      [roomId, name],
    );
    return rows[0];
  },

  async findByRoom(roomId: string): Promise<PlayerType[]> {
    const { rows } = await db.query<PlayerType>(
      `SELECT * FROM players WHERE room_id = $1 ORDER BY created_at`,
      [roomId],
    );
    return rows;
  },

  async findByRoomAndName(roomId: string, name: string): Promise<PlayerType | null> {
    const { rows } = await db.query<PlayerType>(
      `SELECT * FROM players WHERE room_id = $1 AND name = $2 LIMIT 1`,
      [roomId, name],
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<PlayerType | null> {
    const { rows } = await db.query<PlayerType>(`SELECT * FROM players WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async updateCoins(id: string, coins: number): Promise<PlayerType> {
    const { rows } = await db.query<PlayerType>(
      `UPDATE players SET coins = $1 WHERE id = $2 RETURNING *`,
      [coins, id],
    );
    return rows[0];
  },

  async eliminate(id: string): Promise<PlayerType> {
    const { rows } = await db.query<PlayerType>(
      `UPDATE players SET is_alive = FALSE WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0];
  },

  async setSocket(id: string, socketId: string): Promise<void> {
    await db.query(`UPDATE players SET socket_id = $1 WHERE id = $2`, [socketId, id]);
  },
};

export default Player;
