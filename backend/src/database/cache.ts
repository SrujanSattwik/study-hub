interface CacheEntry {
  value: any;
  expiresAt: number;
}

export class TTLCache {
  private _store: Map<string, CacheEntry>;
  private _hits: number;
  private _misses: number;
  private _cleanupTimer: NodeJS.Timeout;

  constructor(cleanupIntervalSeconds = 60) {
    this._store = new Map();
    this._hits = 0;
    this._misses = 0;

    // Periodic sweep: remove stale entries to prevent memory leaks
    this._cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this._store) {
        if (entry.expiresAt <= now) {
          this._store.delete(key);
        }
      }
    }, cleanupIntervalSeconds * 1000).unref(); // .unref() prevents keeping process alive
  }

  /**
   * Retrieve a cached value. Returns null on miss or expiry.
   */
  get<T = any>(key: string): T | null {
    const entry = this._store.get(key);
    if (!entry) {
      this._misses++;
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this._store.delete(key);
      this._misses++;
      return null;
    }
    this._hits++;
    return entry.value as T;
  }

  /**
   * Store a value with TTL.
   */
  set(key: string, value: any, ttlSeconds = 60): void {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Remove a single cache entry.
   */
  del(key: string): void {
    this._store.delete(key);
  }

  /**
   * Remove all cache entries whose keys start with the given prefix.
   */
  delByPrefix(prefix: string): void {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key);
      }
    }
  }

  /**
   * Remove all cache entries that include the given substring in their key.
   */
  delBySubstring(substring: string): void {
    for (const key of this._store.keys()) {
      if (key.includes(substring)) {
        this._store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache.
   */
  flush(): void {
    this._store.clear();
    this._hits = 0;
    this._misses = 0;
  }

  /**
   * Cache stats for debugging/monitoring.
   */
  stats() {
    const total = this._hits + this._misses;
    return {
      keys: this._store.size,
      hits: this._hits,
      misses: this._misses,
      hitRate: total > 0 ? ((this._hits / total) * 100).toFixed(1) + '%' : 'N/A',
    };
  }

  close(): void {
    clearInterval(this._cleanupTimer);
  }
}

// Export a singleton instance shared across routes
export const cache = new TTLCache(60);
