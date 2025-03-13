import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { ParkingSession } from './ParkingSession';

@Entity()
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  receiptNumber: string;

  @Column()
  parkingSessionId: string;

  @ManyToOne(() => ParkingSession)
  @JoinColumn({ name: 'parkingSessionId' })
  parkingSession: ParkingSession;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  overnightSurcharge: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column()
  paymentMethod: string;

  @Column()
  paymentReference: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column()
  vehicleType: string;

  @Column()
  licensePlate: string;

  @Column()
  entryTime: Date;

  @Column()
  endTime: Date;

  @Column()
  duration: string;

  @Column('decimal', { precision: 10, scale: 2 })
  baseRate: number;

  @Column('decimal', { precision: 10, scale: 2 })
  hourlyRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 