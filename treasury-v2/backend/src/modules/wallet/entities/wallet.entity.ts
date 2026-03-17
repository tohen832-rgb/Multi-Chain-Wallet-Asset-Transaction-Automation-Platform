import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('wallets')
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() label!: string;
  @Column({ unique: true }) address!: string;
  @Column({ type: 'bytea' }) encryptedKey!: Buffer;
  @Column({ type: 'bytea' }) iv!: Buffer;
  @Column({ type: 'bytea' }) authTag!: Buffer;
  @CreateDateColumn() createdAt!: Date;
  @Column({ type: 'timestamp', nullable: true }) lastUsedAt!: Date | null;
}
