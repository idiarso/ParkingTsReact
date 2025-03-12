import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

interface LastLogin {
  timestamp: Date;
  ip: string;
  action?: 'login' | 'logout';
}

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
  lastLogin: LastLogin;

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
        logger.debug('Hashing password during save', {
          originalPassword: this.password.substring(0, 3) + '...',
          isHashed: this.password.startsWith('$2a$')
        });
        this.password = await bcrypt.hash(this.password, 10);
        logger.debug('Password hashed', {
          hashedPassword: this.password.substring(0, 7) + '...'
        });
      }
      this.tempPassword = this.password;
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    logger.debug('Validating password', {
      providedPassword: password.substring(0, 3) + '...',
      storedHash: this.password.substring(0, 7) + '...'
    });
    const isValid = await bcrypt.compare(password, this.password);
    logger.debug('Password validation result', { isValid });
    return isValid;
  }

  // Helper method to set an already hashed password
  setHashedPassword(hashedPassword: string) {
    logger.debug('Setting hashed password', {
      hashedPassword: hashedPassword.substring(0, 7) + '...'
    });
    this.password = hashedPassword;
    this.tempPassword = hashedPassword;
  }
} 