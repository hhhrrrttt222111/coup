import db from '../config/db';
import type { GameLogEntry } from '../types';

interface CreateLogParams {
  roomId: string;
  actorId: string;
  action: string;
  targetId?: string | null;
  result?: string | null;
}

const GameLog = {
  async create({ roomId, actorId, action, targetId = null, result = null }: CreateLogParams): Promise<GameLogEntry> {
    const { rows } = await db.query<GameLogEntry>(
      `INSERT INTO game_log (room_id, actor_id, action, target_id, result)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [roomId, actorId, action, targetId, result],
    );
    return rows[0];
  },

  async findByRoom(roomId: string): Promise<GameLogEntry[]> {
    const { rows } = await db.query<GameLogEntry>(
      `SELECT * FROM game_log WHERE room_id = $1 ORDER BY created_at ASC`,
      [roomId],
    );
    return rows;
  },
};

export default GameLog;
