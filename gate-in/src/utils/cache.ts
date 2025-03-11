interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private expiryTime: number;

  constructor(maxSize: number, expiryTime: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.expiryTime = expiryTime;
  }

  set(key: string, value: T): void {
    // Remove expired entries
    this.removeExpired();

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.expiryTime) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  private removeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.expiryTime) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
} 