import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth.service';
import { UserRole } from '../entities/user.entity';

const authService = new AuthService();

// Verify JWT and attach user to request
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = authService.verifyAccessToken(token);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Check minimum role level: ADMIN > OPERATOR > VIEWER
const roleHierarchy: Record<string, number> = {
  [UserRole.VIEWER]: 1,
  [UserRole.OPERATOR]: 2,
  [UserRole.ADMIN]: 3,
};

export function roleMiddleware(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 0;
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: `Requires ${minRole} role or higher` });
    }
    next();
  };
}

// For sensitive ops: require token issued < 5 minutes ago
export function freshAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const tokenAge = Date.now() - user.iat * 1000;
  if (tokenAge > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Re-authentication required. Please login again.' });
  }
  next();
}
