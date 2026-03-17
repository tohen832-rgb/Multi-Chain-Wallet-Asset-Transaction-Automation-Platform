import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  refreshTokenHash!: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  ipAddress!: string;

  @Column({ nullable: true })
  userAgent!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
