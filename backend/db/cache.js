'use strict';

/**
 * Lightweight in-memory TTL cache for Community API read endpoints.
 *
 * Design principles:
 *  - Zero dependencies (pure Node.js)
 *  - Entries expire automatically on next access (lazy eviction)
 *  - Periodic cleanup sweep prevents unbounded memory growth
 *  - Thread-safe for single-threaded Node.js event loop
 *
 * Usage:
 *   const cache = require('./cache');
 *   cache.set('stats:user123', data, 30);        // cache for 30 seconds
 *   const hit = cache.get('stats:user123');       // null if expired
 *   cache.del('stats:user123');                   // manual invalidation
 *   cache.delByPrefix('stats:');                  // invalidate all stat keys
 */

class TTLCache {
    constructor(cleanupIntervalSeconds = 60) {
        /** @type {Map<string, { value: any, expiresAt: number }>} */
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
     * @param {string} key
     * @returns {any|null}
     */
    get(key) {
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
        return entry.value;
    }

    /**
     * Store a value with TTL.
     * @param {string} key
     * @param {any} value
     * @param {number} ttlSeconds - How long to cache (default 60s)
     */
    set(key, value, ttlSeconds = 60) {
        this._store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
    }

    /**
     * Remove a single cache entry.
     * @param {string} key
     */
    del(key) {
        this._store.delete(key);
    }

    /**
     * Remove all cache entries whose keys start with the given prefix.
     * Used for bulk invalidation of related keys (e.g. user-specific caches).
     * @param {string} prefix
     */
    delByPrefix(prefix) {
        for (const key of this._store.keys()) {
            if (key.startsWith(prefix)) {
                this._store.delete(key);
            }
        }
    }

    /**
     * Remove all cache entries that include the given substring in their key.
     * @param {string} substring
     */
    delBySubstring(substring) {
        for (const key of this._store.keys()) {
            if (key.includes(substring)) {
                this._store.delete(key);
            }
        }
    }

    /**
     * Clear entire cache (e.g. on server restart or test teardown).
     */
    flush() {
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
            hitRate: total > 0 ? ((this._hits / total) * 100).toFixed(1) + '%' : 'N/A'
        };
    }
}

// Singleton instance shared across all community routes
module.exports = new TTLCache(60);
