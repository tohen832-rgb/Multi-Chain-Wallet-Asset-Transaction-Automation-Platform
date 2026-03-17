import bcrypt from 'bcryptjs';
import { logger } from '../config/logger';
import { createUser, findUserByEmail } from '../modules/auth/auth.store';
import { UserRole } from '../modules/auth/entities/user.entity';

export async function seedDefaultUsers() {
  const defaults = [
    { email: 'admin@treasury.local', password: 'admin123456', role: UserRole.ADMIN },
    { email: 'operator@treasury.local', password: 'operator123', role: UserRole.OPERATOR },
    { email: 'viewer@treasury.local', password: 'viewer12345', role: UserRole.VIEWER },
  ];

  for (const user of defaults) {
    const exists = await findUserByEmail(user.email);
    if (exists) continue;

    await createUser({
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 12),
      role: user.role,
    });

    logger.info(`Seeded user: ${user.email} (${user.role})`);
  }
}
