import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { UserEntity, UserRole, UserStatus } from './entities/user.entity';
import { AuthService } from './auth.service';
import { roleMiddleware } from './middleware/auth.middleware';
import { AppError } from '../../shared/error-handler';

export const userRouter = Router();
const authService = new AuthService();

// GET /api/users — List all users (ADMIN only)
userRouter.get('/', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = AppDataSource.getRepository(UserEntity);
    const users = await repo.find({ order: { createdAt: 'DESC' }, select: ['id', 'email', 'role', 'status', 'lastLogin', 'createdAt'] });
    res.json({ users });
  } catch (err) { next(err); }
});

// POST /api/users — Create user (ADMIN only)
userRouter.post('/', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const validRoles = [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const result = await authService.register(email, password, role || UserRole.VIEWER);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// PUT /api/users/:id/role — Change role (ADMIN only)
userRouter.put('/:id/role', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = AppDataSource.getRepository(UserEntity);
    const user = await repo.findOneBy({ id: req.params.id });
    if (!user) throw new AppError(404, 'User not found');
    const { role } = req.body;
    if (!role || ![UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    user.role = role;
    await repo.save(user);
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) { next(err); }
});

// PUT /api/users/:id/status — Suspend/activate (ADMIN only)
userRouter.put('/:id/status', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = AppDataSource.getRepository(UserEntity);
    const user = await repo.findOneBy({ id: req.params.id });
    if (!user) throw new AppError(404, 'User not found');
    const { status } = req.body;
    if (!status || ![UserStatus.ACTIVE, UserStatus.SUSPENDED].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    user.status = status;
    if (status === UserStatus.ACTIVE) user.failedLoginAttempts = 0;
    await repo.save(user);
    res.json({ id: user.id, email: user.email, status: user.status });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id (ADMIN only)
userRouter.delete('/:id', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = AppDataSource.getRepository(UserEntity);
    const user = await repo.findOneBy({ id: req.params.id });
    if (!user) throw new AppError(404, 'User not found');
    // Don't allow deleting yourself
    if (user.id === (req as any).user.userId) throw new AppError(400, 'Cannot delete yourself');
    await repo.remove(user);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});
