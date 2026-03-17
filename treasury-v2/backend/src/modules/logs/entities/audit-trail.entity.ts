import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('audit_trail')
export class AuditTrailEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() userId!: string;
  @Column() action!: string;
  @Column({ nullable: true }) resourceType!: string | null;
  @Column({ nullable: true }) resourceId!: string | null;
  @Column({ type: 'jsonb', nullable: true }) oldValue!: any;
  @Column({ type: 'jsonb', nullable: true }) newValue!: any;
  @Column({ nullable: true }) ipAddress!: string | null;
  @CreateDateColumn() timestamp!: Date;
}
