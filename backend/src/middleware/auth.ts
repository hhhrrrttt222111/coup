import type { Request, Response, NextFunction } from 'express';

/**
 * Reads `x-player-id` header and attaches it to `req.playerId`.
 * Uses the global Express.Request augmentation from types/express.d.ts.
 */
function auth(req: Request, _res: Response, next: NextFunction): void {
  req.playerId = (req.headers['x-player-id'] as string) ?? undefined;
  next();
}

export default auth;
