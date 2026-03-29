import rateLimit, { type Options } from 'express-rate-limit';
import type { Request, Response } from 'express';

const sharedOptions: Partial<Options> = {
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
      status: 429,
    });
  },
};

export const createRoomLimiter = rateLimit({
  ...sharedOptions,
  message: 'Too many room creations',
});

export const joinRoomLimiter = rateLimit({
  ...sharedOptions,
  message: 'Too many join attempts',
});
