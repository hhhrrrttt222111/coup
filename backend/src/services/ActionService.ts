import GameLog from '../models/GameLog';
import type { GameLogEntry } from '../types';

type LogActionParams = Omit<GameLogEntry, 'id' | 'created_at'>;

const ActionService = {
  async logAction(entry: LogActionParams): Promise<GameLogEntry> {
    return GameLog.create({
      roomId: entry.room_id,
      actorId: entry.actor_id,
      action: entry.action,
      targetId: entry.target_id,
      result: entry.result,
    });
  },
};

export default ActionService;
