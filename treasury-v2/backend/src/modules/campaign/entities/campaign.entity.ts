import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('campaigns')
export class CampaignEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column({ default: 'CREATED' }) status!: string;
  @Column() userId!: string;
  @Column({ nullable: true }) subWalletAddress!: string | null;
  @Column({ type: 'jsonb', default: '[]' }) contractAddresses!: string[];
  @Column({ nullable: true }) returnWalletAddress!: string | null;
  @Column({ nullable: true }) tokenAddress!: string | null;
  @Column({ default: 5000 }) transferLimit!: number;
  @Column({ default: 50 }) gasThreshold!: number;
  @Column({ default: 0 }) transferCount!: number;
  @Column({ default: 0 }) contractCount!: number;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
