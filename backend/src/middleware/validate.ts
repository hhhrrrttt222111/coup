import { z } from 'zod';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../types';
import { ActionType } from '../types';

// ---------------------------------------------------------------------------
// Reusable field schemas
// ---------------------------------------------------------------------------

export const RoomCodeSchema = z
  .string()
  .length(6, 'Room code must be exactly 6 characters')
  .transform((v) => v.toUpperCase());

export const PlayerNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(20, 'Name must be at most 20 characters');

// ---------------------------------------------------------------------------
// Request body schemas
// ---------------------------------------------------------------------------

export const CreateRoomSchema = z.object({
  playerName: PlayerNameSchema,
  maxPlayers: z.number().int().min(2).max(6),
});

export const JoinRoomSchema = z.object({
  playerName: PlayerNameSchema,
});

export const ActionSchema = z.object({
  roomCode: RoomCodeSchema,
  action: z.nativeEnum(ActionType),
  targetId: z.string().uuid().optional(),
});

export const PlayerResponseSchema = z.object({
  roomCode: RoomCodeSchema,
  response: z.enum(['pass', 'block', 'challenge']),
  blockCard: z.enum(['Duke', 'Assassin', 'Contessa', 'Captain', 'Ambassador']).optional(),
});

export const LoseInfluenceSchema = z.object({
  roomCode: RoomCodeSchema,
  cardIndex: z.number().int().min(0).max(1),
});

// ---------------------------------------------------------------------------
// Typed validation middleware
// ---------------------------------------------------------------------------

export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const field = firstIssue.path.join('.');
      const message = field
        ? `${field}: ${firstIssue.message}`
        : firstIssue.message;

      return next(new AppError(message, 'VALIDATION_ERROR', 400));
    }

    req.body = result.data as z.infer<T>;
    next();
  };
}
