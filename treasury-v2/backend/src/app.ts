import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { authRouter } from './modules/auth/auth.router';
import { userRouter } from './modules/auth/user.router';
import { walletRouter } from './modules/wallet/wallet.router';
import { campaignRouter } from './modules/campaign/campaign.router';
import { logRouter } from './modules/logs/log.router';
import { authMiddleware } from './modules/auth/middleware/auth.middleware';
import { errorHandler } from './shared/error-handler';

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth)
app.use('/api/auth', authRouter);

// Protected routes (require JWT)
app.use('/api/users', authMiddleware, userRouter);
app.use('/api/wallets', authMiddleware, walletRouter);
app.use('/api/campaigns', authMiddleware, campaignRouter);
app.use('/api/logs', authMiddleware, logRouter);

// Error handler
app.use(errorHandler);
