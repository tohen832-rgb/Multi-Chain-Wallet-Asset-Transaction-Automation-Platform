import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() campaignId!: string;
  @Column() walletAddress!: string;
  @Column() type!: string;
  @Column({ nullable: true }) txHash!: string | null;
  @Column({ default: 'PENDING' }) status!: string;
  @Column({ nullable: true }) gasUsed!: string | null;
  @Column({ default: 0 }) retryCount!: number;
  @Column({ nullable: true }) errorMessage!: string | null;
  @CreateDateColumn() createdAt!: Date;
  @Column({ type: 'timestamp', nullable: true }) confirmedAt!: Date | null;
}
