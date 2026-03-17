import { AppDataSource } from '../config/database';
import { UserEntity, UserRole } from '../modules/auth/entities/user.entity';
import bcrypt from 'bcryptjs';
import { logger } from '../config/logger';

export async function seedDefaultUsers() {
  const repo = AppDataSource.getRepository(UserEntity);

  const defaults = [
    { email: 'admin@treasury.local', password: 'admin123456', role: UserRole.ADMIN },
    { email: 'operator@treasury.local', password: 'operator123', role: UserRole.OPERATOR },
    { email: 'viewer@treasury.local', password: 'viewer12345', role: UserRole.VIEWER },
  ];

  for (const u of defaults) {
    const exists = await repo.findOneBy({ email: u.email });
    if (!exists) {
      const user = repo.create({
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 12),
        role: u.role,
      });
      await repo.save(user);
      logger.info(`Seeded user: ${u.email} (${u.role})`);
    }
  }
}
