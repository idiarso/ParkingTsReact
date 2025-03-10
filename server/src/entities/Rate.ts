import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rates')
export class Rate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyMaxRate: number;

  @Column({ type: 'jsonb', nullable: true })
  specialRates: {
    startTime: string;
    endTime: string;
    rate: number;
    days: string[];
  }[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 