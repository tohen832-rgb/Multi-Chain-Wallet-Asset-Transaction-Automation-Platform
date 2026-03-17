import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('campaign_state_history')
export class CampaignStateHistoryEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() campaignId!: string;
  @Column() fromState!: string;
  @Column() toState!: string;
  @Column() triggeredBy!: string;
  @Column({ nullable: true }) reason!: string | null;
  @CreateDateColumn() timestamp!: Date;
}
