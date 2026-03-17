import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
export class AppError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err.message, { stack: err.stack });
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.message });
  res.status(500).json({ error: 'Internal server error' });
}
