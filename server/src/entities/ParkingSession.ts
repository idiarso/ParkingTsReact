import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('parking_sessions')
export class ParkingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  licensePlate: string;

  @Column()
  vehicleType: string;

  @Column({ nullable: true })
  driverName: string;

  @Column({ nullable: true })
  driverPhone: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  entryTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  parkingFee: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ nullable: true })
  parkingSpot: string;

  @Column({ nullable: true })
  entryGateNumber: string;

  @Column({ nullable: true })
  exitGateNumber: string;

  @Column({ nullable: true })
  entryPhotoUrl: string;

  @Column({ nullable: true })
  exitPhotoUrl: string;

  @Column({ type: 'boolean', default: false })
  isOvernight: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  overnightSurcharge: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  paymentTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 