import Room from '../models/Room';
import PlayerModel from '../models/Player';
import type { Room as RoomType, RoomStatus, Player as PlayerType } from '../types';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface CreateRoomParams {
  playerName: string;
  maxPlayers: number;
}

interface CreateRoomResult {
  room: RoomType;
  playerId: string;
}

const RoomService = {
  async createRoom({ playerName, maxPlayers }: CreateRoomParams): Promise<CreateRoomResult> {
    const code = generateCode();
    const room = await Room.create(code, maxPlayers);
    const player = await PlayerModel.create(room.id, playerName);
    return { room, playerId: player.id };
  },

  async getRoomByCode(code: string): Promise<RoomType | null> {
    return Room.findByCode(code.toUpperCase());
  },

  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
    await Room.updateStatus(roomId, status);
  },

  async getPlayers(roomId: string): Promise<PlayerType[]> {
    return PlayerModel.findByRoom(roomId);
  },
};

export default RoomService;
