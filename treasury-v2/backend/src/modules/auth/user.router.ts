import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { deleteUser, findUserById, listUsers, saveUser } from './auth.store';
import { UserRole, UserStatus } from './entities/user.entity';
import { roleMiddleware } from './middleware/auth.middleware';
import { AppError } from '../../shared/error-handler';

export const userRouter = Router();
const authService = new AuthService();

userRouter.get('/', roleMiddleware(UserRole.ADMIN), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await listUsers();
    res.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

userRouter.post('/', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const validRoles = [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER];
    if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const result = await authService.register(email, password, role || UserRole.VIEWER);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

userRouter.put('/:id/role', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) throw new AppError(404, 'User not found');

    const { role } = req.body;
    if (!role || ![UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    user.role = role;
    await saveUser(user);
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
});

userRouter.put('/:id/status', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) throw new AppError(404, 'User not found');

    const { status } = req.body;
    if (!status || ![UserStatus.ACTIVE, UserStatus.SUSPENDED].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    user.status = status;
    if (status === UserStatus.ACTIVE) user.failedLoginAttempts = 0;
    await saveUser(user);
    res.json({ id: user.id, email: user.email, status: user.status });
  } catch (err) {
    next(err);
  }
});

userRouter.delete('/:id', roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) throw new AppError(404, 'User not found');
    if (user.id === (req as any).user.userId) throw new AppError(400, 'Cannot delete yourself');

    await deleteUser(user);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});
