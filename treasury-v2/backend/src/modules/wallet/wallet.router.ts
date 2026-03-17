import { Router, Request, Response } from 'express';
import { roleMiddleware } from '../auth/middleware/auth.middleware';
import { UserRole } from '../auth/entities/user.entity';
export const walletRouter = Router();

// All wallet ops require OPERATOR+
walletRouter.use(roleMiddleware(UserRole.OPERATOR));

walletRouter.get('/', (_req: Request, res: Response) => {
  // TODO: List wallets (addresses only)
  res.json({ wallets: [] });
});
walletRouter.post('/register', (_req: Request, res: Response) => {
  // TODO: Register wallet via vault
  res.status(501).json({ error: 'Not implemented — use AI prompt: updated_member1.txt Step 1' });
});
walletRouter.post('/import-batch', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented' });
});
walletRouter.get('/:id/balance', (_req: Request, res: Response) => {
  res.json({ eth: '0', tokens: [] });
});
