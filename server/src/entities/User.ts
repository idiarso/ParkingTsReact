import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import bcrypt from 'bcryptjs';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'operator', 'cashier'],
    default: 'operator'
  })
  role: 'admin' | 'operator' | 'cashier';

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  lastLogin: {
    timestamp: Date;
    ip: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  private tempPassword: string | null = null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash the password if it has been explicitly changed
    if (this.password && this.password !== this.tempPassword) {
      // Skip hashing if the password is already hashed (starts with $2a$)
      if (!this.password.startsWith('$2a$')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
      this.tempPassword = this.password;
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Helper method to set an already hashed password
  setHashedPassword(hashedPassword: string) {
    this.password = hashedPassword;
    this.tempPassword = hashedPassword;
  }
} 