import db from '../config/db';
import type { Room as RoomType } from '../types';

const Room = {
  async create(code: string, maxPlayers = 6): Promise<RoomType> {
    const { rows } = await db.query<RoomType>(
      `INSERT INTO rooms (code, max_players) VALUES ($1, $2) RETURNING *`,
      [code, maxPlayers],
    );
    return rows[0];
  },

  async findByCode(code: string): Promise<RoomType | null> {
    const { rows } = await db.query<RoomType>(`SELECT * FROM rooms WHERE code = $1`, [code]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<RoomType | null> {
    const { rows } = await db.query<RoomType>(`SELECT * FROM rooms WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async updateStatus(id: string, status: RoomType['status']): Promise<RoomType> {
    const { rows } = await db.query<RoomType>(
      `UPDATE rooms SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return rows[0];
  },
};

export default Room;
