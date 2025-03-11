import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParkingSession } from './ParkingSession';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  receiptNumber: string;

  @ManyToOne(() => ParkingSession)
  @JoinColumn()
  parkingSession: ParkingSession;

  @Column()
  parkingSessionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  overnightSurcharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column()
  paymentMethod: string;

  @Column()
  paymentReference: string;

  @Column()
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column()
  vehicleType: string;

  @Column()
  plateNumber: string;

  @Column()
  entryTime: Date;

  @Column()
  exitTime: Date;

  @Column()
  duration: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyRate: number;

  @CreateDateColumn()
  createdAt: Date;
} 