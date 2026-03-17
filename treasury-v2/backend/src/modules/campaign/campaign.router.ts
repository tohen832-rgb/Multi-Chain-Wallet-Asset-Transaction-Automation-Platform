import { Router, Request, Response } from 'express';
import { roleMiddleware } from '../auth/middleware/auth.middleware';
import { UserRole } from '../auth/entities/user.entity';
export const campaignRouter = Router();

campaignRouter.get('/', (_req: Request, res: Response) => {
  // TODO: List campaigns
  res.json({ campaigns: [], total: 0 });
});
campaignRouter.post('/', roleMiddleware(UserRole.OPERATOR), (_req: Request, res: Response) => {
  // TODO: Create campaign
  res.status(501).json({ error: 'Not implemented — use AI prompt: updated_member2.txt' });
});
