import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('event_logs')
export class EventLogEntity {
  @PrimaryColumn() id!: string; // ULID
  @Column({ nullable: true }) campaignId!: string | null;
  @Column() eventType!: string;
  @Column({ default: 'INFO' }) severity!: string;
  @Column({ default: 'SYSTEM' }) actorType!: string;
  @Column({ nullable: true }) actorId!: string | null;
  @Column({ type: 'jsonb', nullable: true }) payload!: any;
  @Column({ nullable: true }) txHash!: string | null;
  @Column({ nullable: true }) chainHash!: string | null;
  @CreateDateColumn() timestamp!: Date;
}
