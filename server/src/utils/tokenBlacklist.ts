import { logger } from './logger';

class TokenBlacklist {
  private blacklist: Set<string> = new Set();
  private expiryTimes: Map<string, number> = new Map();

  add(token: string, expiryTime: number): void {
    this.blacklist.add(token);
    this.expiryTimes.set(token, expiryTime);
    logger.info(`Token added to blacklist, expires at: ${new Date(expiryTime).toISOString()}`);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  // Clean up expired tokens
  cleanup(): void {
    const now = Date.now();
    for (const [token, expiry] of this.expiryTimes.entries()) {
      if (expiry <= now) {
        this.blacklist.delete(token);
        this.expiryTimes.delete(token);
        logger.info(`Expired token removed from blacklist`);
      }
    }
  }

  // Run cleanup periodically (every hour)
  startCleanupInterval(): void {
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }
}

export const tokenBlacklist = new TokenBlacklist();
tokenBlacklist.startCleanupInterval(); 