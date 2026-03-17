import { DataSource } from 'typeorm';
import { env } from './env';
import { UserEntity } from '../modules/auth/entities/user.entity';
import { SessionEntity } from '../modules/auth/entities/session.entity';
import { WalletEntity } from '../modules/wallet/entities/wallet.entity';
import { TransactionEntity } from '../modules/wallet/entities/transaction.entity';
import { CampaignEntity } from '../modules/campaign/entities/campaign.entity';
import { CampaignStateHistoryEntity } from '../modules/campaign/entities/campaign-state-history.entity';
import { EventLogEntity } from '../modules/logs/entities/event-log.entity';
import { AuditTrailEntity } from '../modules/logs/entities/audit-trail.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.databaseUrl,
  synchronize: env.nodeEnv === 'development',
  logging: env.nodeEnv === 'development' ? ['error'] : false,
  entities: [
    UserEntity, SessionEntity,
    WalletEntity, TransactionEntity,
    CampaignEntity, CampaignStateHistoryEntity,
    EventLogEntity, AuditTrailEntity,
  ],
});

export async function connectDatabase() {
  return AppDataSource.initialize();
}
