/**
 * swr-cache.js — Stale-While-Revalidate Dual-Tier Cache & Performance Monitor for StudyClub
 *
 * Architecture:
 *  - Tier 1: In-memory JavaScript Map (instant access, 0ms latency, max 50 items LRU)
 *  - Tier 2: sessionStorage (persists across tab reloads in same session, cleared on browser close)
 *
 * Core Features:
 *  - In-flight request deduplication: sharing promises for active network calls
 *  - Memory capping & automatic LRU / quota eviction
 *  - Performance metrics logging (Cache hit/miss counters, prefetch timing, hit rate)
 *  - Silent background revalidation on stale cache hits
 *
 * API:
 *   SWRCache.fetch(key, url, options?)  → fetches with SWR semantics
 *   SWRCache.get(key)                   → reads cache synchronously (null if miss)
 *   SWRCache.set(key, data, ttlMs?)     → writes to dual-tier cache
 *   SWRCache.invalidate(key)            → removes a single key
 *   SWRCache.invalidatePrefix(prefix)   → removes all keys starting with prefix
 *   SWRCache.clear()                    → flushes memory & storage (e.g. on logout)
 *   SWRCache.getMetrics()               → returns performance stats object
 *   SWRCache.logPerformanceReport()     → prints clean summary to console
 */

'use strict';

const SWRCache = (() => {
    const STORAGE_PREFIX = 'swrc_';
    const DEFAULT_STALE_MS = 30_000;      // 30 seconds before background revalidation
    const DEFAULT_MAX_AGE_MS = 5 * 60_000; // 5 minutes hard expiry
    const MAX_MEMORY_ENTRIES = 50;        // In-memory LRU cap

    // Tier 1: Fast in-memory cache Map<key, { data, fetchedAt, maxAgeMs, lastAccessed }>
    const memoryCache = new Map();

    // In-flight request deduplication: url → Promise
    const inflight = new Map();

    // Performance Metrics tracking
    const metrics = {
        hits: 0,
        misses: 0,
        revalidations: 0,
        prefetches: 0,
        prefetchDurations: []
    };

    // ── Internal Helpers ────────────────────────────────────────────────────────

    function storageKey(key) {
        return STORAGE_PREFIX + key;
    }

    function recordHit() {
        metrics.hits++;
    }

    function recordMiss() {
        metrics.misses++;
    }

    /**
     * Read from Tier 1 (Memory) or Tier 2 (sessionStorage).
     * Promotes sessionStorage hits to memory.
     */
    function readRaw(key) {
        // Check Tier 1 (Memory)
        if (memoryCache.has(key)) {
            const entry = memoryCache.get(key);
            entry.lastAccessed = Date.now(); // update LRU position
            return entry;
        }

        // Check Tier 2 (sessionStorage)
        try {
            const raw = sessionStorage.getItem(storageKey(key));
            if (!raw) return null;
            const entry = JSON.parse(raw);
            entry.lastAccessed = Date.now();
            
            // Promote to Tier 1 Memory cache
            writeMemory(key, entry);
            return entry;
        } catch {
            return null;
        }
    }

    function writeMemory(key, entry) {
        // Enforce LRU Memory Limit
        if (memoryCache.size >= MAX_MEMORY_ENTRIES && !memoryCache.has(key)) {
            let oldestKey = null;
            let oldestAccess = Infinity;
            for (const [k, v] of memoryCache.entries()) {
                if (v.lastAccessed < oldestAccess) {
                    oldestAccess = v.lastAccessed;
                    oldestKey = k;
                }
            }
            if (oldestKey) memoryCache.delete(oldestKey);
        }
        memoryCache.set(key, entry);
    }

    function writeRaw(key, data, maxAgeMs) {
        const entry = {
            data,
            fetchedAt: Date.now(),
            maxAgeMs: maxAgeMs ?? DEFAULT_MAX_AGE_MS,
            lastAccessed: Date.now()
        };

        // Write to Tier 1
        writeMemory(key, entry);

        // Write to Tier 2
        try {
            sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
        } catch (e) {
            // sessionStorage quota exceeded — evict oldest items from storage
            evictOldestStorage();
            try {
                sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
            } catch { /* skip storage write if quota still full */ }
        }
    }

    function evictOldestStorage() {
        let oldest = null;
        let oldestTime = Infinity;
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (!k || !k.startsWith(STORAGE_PREFIX)) continue;
            try {
                const entry = JSON.parse(sessionStorage.getItem(k));
                if (entry.fetchedAt < oldestTime) {
                    oldestTime = entry.fetchedAt;
                    oldest = k;
                }
            } catch { /* remove corrupt entry */ oldest = k; break; }
        }
        if (oldest) sessionStorage.removeItem(oldest);
    }

    function isFresh(entry, staleMs) {
        return (Date.now() - entry.fetchedAt) < staleMs;
    }

    function isExpired(entry) {
        return (Date.now() - entry.fetchedAt) > entry.maxAgeMs;
    }

    // ── Public API ──────────────────────────────────────────────────────────────

    /**
     * Synchronously read cache entry. Returns data or null.
     */
    function get(key) {
        const entry = readRaw(key);
        if (!entry || isExpired(entry)) {
            return null;
        }
        return entry.data;
    }

    /**
     * Manually update cache.
     */
    function set(key, data, maxAgeMs) {
        writeRaw(key, data, maxAgeMs);
    }

    /**
     * Invalidate a specific cache key.
     */
    function invalidate(key) {
        memoryCache.delete(key);
        try { sessionStorage.removeItem(storageKey(key)); } catch {}
    }

    /**
     * Invalidate all keys matching a prefix.
     */
    function invalidatePrefix(prefix) {
        for (const k of memoryCache.keys()) {
            if (k.startsWith(prefix)) memoryCache.delete(k);
        }
        const fullPrefix = STORAGE_PREFIX + prefix;
        const toRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(fullPrefix)) toRemove.push(k);
        }
        toRemove.forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
    }

    /**
     * Completely clear memory and session storage (called on logout).
     */
    function clear() {
        memoryCache.clear();
        inflight.clear();
        const toRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k);
        }
        toRemove.forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
        console.debug('[SWR-CACHE] Cleared all cache entries.');
    }

    /**
     * Stale-While-Revalidate fetch handler.
     */
    async function fetch(key, url, opts = {}) {
        const {
            staleMs = DEFAULT_STALE_MS,
            maxAgeMs = DEFAULT_MAX_AGE_MS,
            onRevalidate = null,
            fetchOptions = {},
            isPrefetch = false
        } = opts;

        const entry = readRaw(key);

        // ── Cache HIT ──────────────────────────────────────────────────────────
        if (entry && !isExpired(entry)) {
            if (!isPrefetch) recordHit();

            if (!isFresh(entry, staleMs) && !inflight.has(url)) {
                // Stale → silently revalidate in background
                metrics.revalidations++;
                _revalidate(key, url, maxAgeMs, onRevalidate, fetchOptions);
            }
            return entry.data;
        }

        // ── Cache MISS ─────────────────────────────────────────────────────────
        if (!isPrefetch) recordMiss();
        return _fetchAndCache(key, url, maxAgeMs, fetchOptions, isPrefetch);
    }

    async function _fetchAndCache(key, url, maxAgeMs, fetchOptions, isPrefetch) {
        // Request Deduplication: piggyback on existing promise
        if (inflight.has(url)) {
            return inflight.get(url);
        }

        const startTime = performance.now();
        const promise = _doFetch(url, fetchOptions)
            .then(data => {
                const duration = Math.round(performance.now() - startTime);
                if (isPrefetch) {
                    metrics.prefetches++;
                    metrics.prefetchDurations.push(duration);
                    console.debug(`[PREFETCH] Cached ${url} in ${duration}ms`);
                }
                writeRaw(key, data, maxAgeMs);
                inflight.delete(url);
                return data;
            })
            .catch(err => {
                inflight.delete(url);
                throw err;
            });

        inflight.set(url, promise);
        return promise;
    }

    async function _revalidate(key, url, maxAgeMs, onRevalidate, fetchOptions) {
        if (inflight.has(url)) return;

        const promise = _doFetch(url, fetchOptions)
            .then(freshData => {
                writeRaw(key, freshData, maxAgeMs);
                inflight.delete(url);
                if (typeof onRevalidate === 'function') {
                    requestAnimationFrame(() => onRevalidate(freshData));
                }
            })
            .catch(() => {
                inflight.delete(url);
            });

        inflight.set(url, promise);
    }

    async function _doFetch(url, fetchOptions) {
        const fn = (window.AuthSession && window.AuthSession.fetchWithAuth)
            ? (u, o) => window.AuthSession.fetchWithAuth(u, o)
            : (u, o) => window.fetch(u, o);

        const res = await fn(url, fetchOptions);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    // ── Performance Logging & Metrics ──────────────────────────────────────────

    function getMetrics() {
        const totalReqs = metrics.hits + metrics.misses;
        const hitRate = totalReqs > 0 ? ((metrics.hits / totalReqs) * 100).toFixed(1) + '%' : '0%';
        const avgPrefetchTime = metrics.prefetchDurations.length > 0
            ? (metrics.prefetchDurations.reduce((a, b) => a + b, 0) / metrics.prefetchDurations.length).toFixed(1) + 'ms'
            : 'N/A';

        return {
            hits: metrics.hits,
            misses: metrics.misses,
            hitRate,
            revalidations: metrics.revalidations,
            prefetchesCompleted: metrics.prefetches,
            avgPrefetchDuration: avgPrefetchTime,
            memoryEntriesCount: memoryCache.size
        };
    }

    function logPerformanceReport() {
        const m = getMetrics();
        console.group('%c🚀 StudyClub Performance Report', 'color: #6366f1; font-weight: bold; font-size: 12px;');
        console.log(`Cache Hit Rate:         ${m.hitRate} (${m.hits} hits / ${m.misses} misses)`);
        console.log(`Background Revalidates: ${m.revalidations}`);
        console.log(`Prefetches Completed:   ${m.prefetchesCompleted}`);
        console.log(`Avg Prefetch Time:      ${m.avgPrefetchDuration}`);
        console.log(`In-Memory Cache Size:   ${m.memoryEntriesCount} entries`);
        console.groupEnd();
    }

    return {
        get,
        set,
        fetch,
        invalidate,
        invalidatePrefix,
        clear,
        getMetrics,
        logPerformanceReport
    };
})();

window.SWRCache = SWRCache;
