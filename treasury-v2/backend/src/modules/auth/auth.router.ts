import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import rateLimit from 'express-rate-limit';

export const authRouter = Router();
const authService = new AuthService();

// Rate limit login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, try again later' },
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await authService.register(email, password, role);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(email, password, ip, userAgent);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const result = await authService.logout(refreshToken);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/auth/me (requires token)
authRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = authService.verifyAccessToken(token);
    const result = await authService.getMe(decoded.userId);
    res.json(result);
  } catch (err) { next(err); }
});
