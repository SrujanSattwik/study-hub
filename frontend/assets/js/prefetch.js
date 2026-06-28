/**
 * prefetch.js — Intelligent Background Prefetcher & Navigation Acceleration for StudyClub
 *
 * Strategies:
 *  1. Priority Warmup: Focuses on high-value endpoints (Community `/api/community/home-bundle` and Materials `/api/materials?page=1&limit=5`).
 *  2. Network & Hardware Awareness: Skips non-essential prefetching if user is on slow connection (2G / saveData) or low concurrency device.
 *  3. Link Hover Prefetching: Triggers targeted endpoint preloading when hovering navigation links for >80ms.
 *  4. Idle Background Prefetching: Schedules warming via `requestIdleCallback` (or 1.5s post-render delay).
 *  5. Navigation Time Measuring: Tracks page transition metrics (`performance.mark` & `performance.measure`).
 */

'use strict';

const Prefetcher = (() => {
    function getCommunityKey() {
        const u = window.AuthSession && window.AuthSession.getUser ? window.AuthSession.getUser() : null;
        const uid = u ? (u.user_id || u.id) : '';
        return uid ? `home-bundle:${uid}` : 'community:home-bundle';
    }

    function getIdleWarmEndpoints() {
        return [
            { key: getCommunityKey(), url: '/api/community/home-bundle', staleMs: 20_000 },
            { key: 'materials:page=1&limit=5', url: '/api/materials?page=1&limit=5', staleMs: 20_000 }
        ];
    }

    const prefetchedUrls = new Set();
    const hoverTimers = new Map();

    // ── Network & Device Capability Check ──────────────────────────────────────

    function shouldSkipPrefetch() {
        if ('connection' in navigator && navigator.connection) {
            const conn = navigator.connection;
            // Respect Data Saver mode or slow connections
            if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
                console.debug('[PREFETCH] Skipping background prefetch due to slow network or Save-Data mode.');
                return true;
            }
        }
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) {
            console.debug('[PREFETCH] Throttling prefetch due to limited CPU concurrency.');
            return true;
        }
        return false;
    }

    // ── Core Prefetch Executer ──────────────────────────────────────────────────

    async function prefetchEndpoint(key, url, staleMs = 30_000) {
        if (shouldSkipPrefetch() || prefetchedUrls.has(url)) return;
        prefetchedUrls.add(url);

        if (window.SWRCache) {
            try {
                await SWRCache.fetch(key, url, {
                    staleMs,
                    isPrefetch: true
                });
            } catch {
                prefetchedUrls.delete(url); // allow retry on error
            }
        }
    }

    function getPageEndpoints(basename) {
        if (basename === 'community.html') {
            return [{ key: getCommunityKey(), url: '/api/community/home-bundle' }];
        }
        if (basename === 'materials.html') {
            return [{ key: 'materials:page=1&limit=5', url: '/api/materials?page=1&limit=5' }];
        }
        return [];
    }

    /**
     * Trigger immediate prefetch of core endpoints (e.g. after login success).
     */
    function prefetchPriorityEndpoints() {
        if (shouldSkipPrefetch()) return;
        getIdleWarmEndpoints().forEach(({ key, url, staleMs }) => {
            prefetchEndpoint(key, url, staleMs);
        });
    }

    // ── Link Hover Prefetch ────────────────────────────────────────────────────

    function watchNavLinks() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href') || '';
            const basename = href.split('/').pop().split('?')[0];
            const items = getPageEndpoints(basename);
            if (!items || items.length === 0) return;

            link.addEventListener('mouseenter', () => {
                const timer = setTimeout(() => {
                    items.forEach(({ key, url }) => prefetchEndpoint(key, url));
                }, 80); // 80ms hover threshold
                hoverTimers.set(link, timer);
            });

            link.addEventListener('mouseleave', () => {
                const timer = hoverTimers.get(link);
                if (timer) { clearTimeout(timer); hoverTimers.delete(link); }
            });
        });
    }

    // ── Idle Warmup ─────────────────────────────────────────────────────────────

    function scheduleIdleWarm() {
        if (shouldSkipPrefetch()) return;

        const warm = () => {
            getIdleWarmEndpoints().forEach(({ key, url, staleMs }) => {
                if (window.SWRCache && !SWRCache.get(key)) {
                    prefetchEndpoint(key, url, staleMs);
                }
            });
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(warm, { timeout: 3000 });
        } else {
            setTimeout(warm, 1500); // 1.5s fallback after page render
        }
    }

    // ── Navigation Performance Measuring & Smooth Transitions ────────────────

    function setupNavigationMonitoring() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href]');
            if (!anchor) return;
            const href = anchor.href;

            if (!href || href.includes('#') || !href.startsWith(window.location.origin)) return;
            if (anchor.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;

            // Mark navigation start timing
            if (performance && performance.mark) {
                performance.mark('nav_start');
                sessionStorage.setItem('studyhub_nav_start', Date.now().toString());
            }
        });

        // Report navigation duration on new page load
        const navStart = sessionStorage.getItem('studyhub_nav_start');
        if (navStart) {
            sessionStorage.removeItem('studyhub_nav_start');
            const duration = Date.now() - parseInt(navStart, 10);
            console.debug(`⚡ [PERF] Page Navigation Response Time: ${duration}ms`);
        }
    }

    function clear() {
        prefetchedUrls.clear();
        hoverTimers.clear();
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    function init() {
        setupNavigationMonitoring();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                watchNavLinks();
                scheduleIdleWarm();
            });
        } else {
            watchNavLinks();
            scheduleIdleWarm();
        }
    }

    init();

    return {
        prefetchEndpoint,
        prefetchPriorityEndpoints,
        clear
    };
})();

window.Prefetcher = Prefetcher;
