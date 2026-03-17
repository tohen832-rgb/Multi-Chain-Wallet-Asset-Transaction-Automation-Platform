import { Router, Request, Response } from 'express';
export const logRouter = Router();
logRouter.get('/', (_req: Request, res: Response) => {
  // TODO: Query logs
  res.json({ logs: [], total: 0 });
});
