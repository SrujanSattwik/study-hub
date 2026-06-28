let socket;
let currentUser = null;
let activeGroupId = null;
let currentFolderId = null;
let activeTab = 'overview';
let activeQuestionId = null;

// Whiteboard state variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let brushColor = '#6366f1';
let brushSize = 3;
let whiteboardCanvas = null;
let whiteboardCtx = null;

// Meeting simulation states
let isMuted = false;
let isCameraOn = false;
let isWhiteboardActive = false;
let isHandRaised = false;
let meetingTimerInterval = null;
let meetingSeconds = 0;

// Socket initialization guard — prevents duplicate listener registration on re-render
let _socketInitialized = false;

// ---------------------------------------------------------------
// INITIALIZATION — ordered: auth → skeletons → bundle → socket
// ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth check — runs once, reads only localStorage (zero network overhead)
    currentUser = AuthSession.getUser();
    if (!currentUser) {
        console.warn('[COMMUNITY] No valid session found, redirecting to login...');
        return;
    }

    console.log('[COMMUNITY] Session valid. User:', currentUser.full_name);

    // 2. Show skeleton placeholders IMMEDIATELY (synchronous, no network needed)
    //    User sees a populated-looking shell before any data arrives
    showAllSkeletons();

    // 3. Set up scroll/feed events early
    setupFeedEvents();

    // 4. Fire single bundled data request — replaces 10 individual HTTP calls
    await loadHomeData();

    // 5. Init socket AFTER essential UI has rendered — doesn't block rendering
    initSocketConnection();
});

// ---------------------------------------------------------------
// SOCKET CONNECTION — guarded against double-initialization
// ---------------------------------------------------------------

function initSocketConnection() {
    if (_socketInitialized) return;
    _socketInitialized = true;

    if (typeof io !== 'undefined') {
        socket = io(AuthSession.API_BASE, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 10000
        });

        socket.on('connect', () => {
            console.log('📡 Socket connected to server');
            // Pass token for server-side session validation (socket auth)
            const token = (AuthSession.getToken && AuthSession.getToken()) || localStorage.getItem('studyhub_token');
            socket.emit('registerUser', { userId: currentUser.user_id, token });
        });

        socket.on('connect_error', (err) => {
            console.warn('[SOCKET] Connection error:', err.message);
        });

        socket.on('authError', (data) => {
            console.warn('[SOCKET] Auth error from server:', data.message);
        });

        // Handle real-time group message
        socket.on('newGroupMessage', (msg) => {
            if (activeGroupId === msg.groupId && activeTab === 'chat') {
                appendChatMessage(msg);
            }
        });

        // Handle typing indicators
        socket.on('userTyping', (data) => {
            if (activeGroupId === data.groupId && activeTab === 'chat') {
                const typingLabel = document.getElementById('chat-typing-status-label');
                if (typingLabel) {
                    typingLabel.textContent = data.isTyping ? 'Someone is typing...' : '';
                }
            }
        });

        // Handle whiteboard path broadcasts
        socket.on('drawEvent', (data) => {
            if (activeGroupId === data.groupId && isWhiteboardActive) {
                drawPathOnCanvas(data.x, data.y, data.lastX, data.lastY, data.color, data.size);
            }
        });

        socket.on('clearWhiteboardEvent', () => {
            if (isWhiteboardActive) clearCanvasLocally();
        });

        // Handle raised hand notification
        socket.on('handRaised', (data) => {
            if (data.groupId === activeGroupId && activeTab === 'meeting') {
                showNotificationToast(`${data.userName} ${data.raised ? 'raised their hand! ✋' : 'lowered their hand.'}`);
                updateParticipantHand(data.userId, data.raised);
            }
        });

        // Presence changes
        socket.on('presenceChanged', (data) => {
            if (data.groupId === activeGroupId && activeGroupId) {
                if (typeof loadWorkspaceMembers === 'function') loadWorkspaceMembers();
                if (typeof updateChatOnlineMembers === 'function') updateChatOnlineMembers();
            }
        });

        // Receive full chat history from socket on room join
        socket.on('recentMessages', (data) => {
            if (activeGroupId === data.groupId && activeTab === 'chat') {
                const box = document.getElementById('chat-messages-box');
                if (!box) return;
                box.innerHTML = '';
                if (!data.messages || data.messages.length === 0) {
                    box.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--gray-600);">No messages yet. Send a greeting in study chat!</div>`;
                    return;
                }
                data.messages.forEach(msg => appendChatMessage(msg));
            }
        });

    } else {
        console.warn('⚠️ Socket.io not loaded — operating in offline mode.');
        // Graceful fallback: mock socket so emit() calls don't throw errors
        socket = {
            emit: (event, payload) => {
                console.log(`[OFFLINE SOCKET] emit: ${event}`, payload);
                if (event === 'sendGroupMessage') {
                    setTimeout(() => {
                        appendChatMessage({
                            messageId: 'offline_' + Date.now(),
                            groupId: payload.groupId,
                            userId: payload.userId,
                            authorName: currentUser.full_name,
                            content: payload.content,
                            parentId: payload.parentId,
                            createdAt: new Date().toISOString()
                        });
                    }, 100);
                }
                if (event === 'raiseHand') {
                    setTimeout(() => updateParticipantHand(payload.userId, payload.raised), 50);
                }
                if (event === 'clearWhiteboard') {
                    setTimeout(() => clearCanvasLocally(), 50);
                }
            },
            on: (event) => {
                console.log(`[OFFLINE SOCKET] listener registered for: ${event}`);
            }
        };
    }
}

// ---------------------------------------------------------------
// SKELETON LOADERS — shown immediately at DOM ready, zero network
// ---------------------------------------------------------------

// ── Shape-accurate skeleton HTML ────────────────────────────────────────────
// Uses classes from skeletons.css (sk, sk-circle, etc.) for GPU-shimmer.
// Each skeleton mirrors the exact layout of the final content.

const SK_GROUP_CARD = `
<div class="sk-group-card">
  <div class="sk sk-group-card__banner"></div>
  <div class="sk-group-card__body">
    <div class="sk sk-group-card__title"></div>
    <div class="sk sk-group-card__desc"></div>
    <div class="sk sk-group-card__desc-2"></div>
    <div class="sk-group-card__meta">
      <div class="sk sk-group-card__meta-l"></div>
      <div class="sk sk-group-card__meta-r"></div>
    </div>
  </div>
  <div class="sk sk-group-card__btn"></div>
</div>`;

const SK_POST = `
<div class="sk-post">
  <div class="sk-post__header">
    <div class="sk sk-circle sk-post__avatar"></div>
    <div class="sk-post__meta">
      <div class="sk sk-post__name"></div>
      <div class="sk sk-post__time"></div>
    </div>
  </div>
  <div class="sk sk-post__line-1"></div>
  <div class="sk sk-post__line-2"></div>
  <div class="sk sk-post__line-3"></div>
  <div class="sk-post__actions">
    <div class="sk sk-post__action"></div>
    <div class="sk sk-post__action"></div>
  </div>
</div>`;

const SK_NOTIF = `
<div class="sk-notif">
  <div class="sk sk-circle sk-notif__icon"></div>
  <div class="sk-notif__body">
    <div class="sk sk-notif__title"></div>
    <div class="sk sk-notif__text"></div>
    <div class="sk sk-notif__time"></div>
  </div>
</div>`;

const SK_MEMBER = `
<div class="sk-member">
  <div class="sk sk-circle sk-member__avatar"></div>
  <div class="sk sk-member__name"></div>
</div>`;

const SK_ROW = `<div class="sk sk-widget-row"></div>`;

function showAllSkeletons() {
    const targets = [
        { id: 'sidebar-suggested-groups',   html: SK_GROUP_CARD.repeat(3) },
        { id: 'sidebar-active-meetings',    html: SK_NOTIF.repeat(2) },
        { id: 'sidebar-online-members',     html: SK_MEMBER.repeat(4) },
        { id: 'sidebar-notifications-list', html: SK_NOTIF.repeat(3) },
        { id: 'sidebar-challenges-list',    html: SK_ROW.repeat(3) },
        { id: 'discussion-posts-feed',      html: SK_POST.repeat(3) },
        { id: 'my-groups-grid',             html: SK_GROUP_CARD.repeat(3) },
        { id: 'explore-groups-grid',        html: SK_GROUP_CARD.repeat(6) },
        { id: 'home-events-list',           html: SK_ROW.repeat(3) }
    ];
    targets.forEach(({ id, html }) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    });
}

// ── Content reveal helper ─────────────────────────────────────────────────────
// Call after populating a container to trigger fade-in transition.
function applyReveal(el) {
    if (!el) return;
    el.classList.remove('content-reveal', 'content-reveal-grid');
    void el.offsetWidth; // reflow to reset animation
    el.classList.add('content-reveal');
    // If it's a grid container, also apply stagger
    if (el.children.length > 1) el.classList.add('content-reveal-grid');
}

// ── Refresh bar (top progress indicator) ────────────────────────────────────
function showRefreshBar() {
    const existing = document.getElementById('perf-refresh-bar');
    if (existing) existing.remove();
    const bar = document.createElement('div');
    bar.id = 'perf-refresh-bar';
    bar.className = 'refresh-bar';
    document.body.appendChild(bar);
    setTimeout(() => bar.remove(), 700);
}

// ── Toast notification ───────────────────────────────────────────────────────
function showPerfToast(message, type = 'info', durationMs = 3000) {
    const toast = document.createElement('div');
    toast.className = `perf-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, durationMs);
}

// ---------------------------------------------------------------
// CORE DATA LOADING — single bundled HTTP call (replaces 10 individual requests)
// Renders each section as soon as the bundle response arrives.
// Falls back to individual calls if bundle endpoint fails.
// ---------------------------------------------------------------

async function loadHomeData() {
    const t0 = performance.now();
    const userId = currentUser.user_id;
    const cacheKey = `home-bundle:${userId}`;
    const cacheUrl  = '/api/community/home-bundle';

    // ── STEP 1: Instant cache-first render (SWR) ────────────────────────────
    // If we have cached bundle data, render it immediately — 0ms visual wait.
    // The skeleton was shown at DOMContentLoaded; this replaces it in <5ms.
    const cachedBundle = window.SWRCache ? SWRCache.get(cacheKey) : null;
    if (cachedBundle && cachedBundle.bundle) {
        const b = cachedBundle.bundle;
        console.debug('[COMMUNITY] SWR cache hit — rendering instantly.');
        _renderTier1(b);
        _renderTier2Deferred(b);
        showRefreshBar();
    }

    // ── STEP 2: Fetch fresh bundle (always — SWR revalidates in background) ─
    try {
        let fetchPromise;
        if (window.SWRCache) {
            fetchPromise = SWRCache.fetch(cacheKey, cacheUrl, {
                staleMs: 20_000,   // 20s — revalidate if older than this
                maxAgeMs: 5 * 60_000, // 5min hard expiry
                onRevalidate: (freshData) => {
                    // Called when background revalidation completes
                    if (freshData && freshData.bundle) {
                        console.debug('[COMMUNITY] SWR revalidated — patching sections.');
                        _renderTier1(freshData.bundle);
                        _renderTier2Deferred(freshData.bundle);
                    }
                }
            });
        } else {
            // SWR not available — plain fetch
            fetchPromise = AuthSession.fetchWithAuth(cacheUrl)
                .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
        }

        const data = await fetchPromise;

        // Only render if we didn't already render from cache
        if (!cachedBundle) {
            if (!data.success || !data.bundle) throw new Error('Bundle response invalid');
            const b = data.bundle;
            console.debug(`[COMMUNITY] Bundle fetched in ${(performance.now()-t0).toFixed(0)}ms`);
            _renderTier1(b);
            _renderTier2Deferred(b);
        }

    } catch (err) {
        console.warn('[COMMUNITY] Bundle failed, falling back to individual requests:', err.message);
        const tasks = [
            { name: 'Stats',                fn: loadStats },
            { name: 'JoinedGroups',         fn: loadJoinedGroups },
            { name: 'ExploreGroups',        fn: loadExploreGroups },
            { name: 'FeedPosts',            fn: loadFeedPosts },
            { name: 'UpcomingEvents',       fn: loadUpcomingEvents },
            { name: 'SuggestedGroups',      fn: loadSuggestedGroups },
            { name: 'ActiveMeetings',       fn: loadActiveMeetings },
            { name: 'OnlineMembers',        fn: loadOnlineMembers },
            { name: 'SidebarNotifications', fn: loadSidebarNotifications },
            { name: 'Challenges',           fn: loadChallenges }
        ];
        const results = await Promise.allSettled(tasks.map(t => t.fn()));
        results.forEach((r, i) => {
            if (r.status === 'rejected') console.error(`[COMMUNITY] Fallback "${tasks[i].name}" failed:`, r.reason);
        });
    }
}

// ── Tier-1: Above-fold critical content — rendered first ─────────────────────
function _renderTier1(b) {
    renderStats(b.stats);
    renderJoinedGroups(b.joinedGroups);
    renderExploreGroups(b.exploreGroups);
    renderFeedPosts(b.feed);
    renderUpcomingEvents(b.events);
}

// ── Tier-2: Sidebar widgets — deferred until browser is idle ─────────────────
// These are below-fold or non-critical; deferring lets tier-1 feel instant.
function _renderTier2Deferred(b) {
    const render = () => {
        renderSuggestedGroups(b.suggestedGroups);
        renderActiveMeetings(b.activeMeetings);
        renderOnlineMembers(b.onlineUsers);
        renderSidebarNotifications(b.notifications);
        renderChallenges(b.challenges);
    };
    if ('requestIdleCallback' in window) {
        requestIdleCallback(render, { timeout: 500 });
    } else {
        setTimeout(render, 150);
    }
}

// ---------------------------------------------------------------
// BUNDLE RENDERERS — called with data directly from the bundle response.
// Functionally identical to their loadX() counterparts but accept data
// as a parameter instead of fetching it themselves.
// The original loadX() functions remain for post-action refreshes.
// ---------------------------------------------------------------

function renderStats(stats) {
    if (!stats) return;
    animateCounter('stats-active-members', stats.activeMembers);
    animateCounter('stats-joined-groups', stats.myGroups);
    animateCounter('stats-questions-solved', stats.questionsSolved);
    animateCounter('stats-materials-shared', stats.materialsShared);
    const solvedTrend = document.getElementById('stats-questions-solved-trend');
    if (solvedTrend) solvedTrend.innerHTML = `<i class="fas fa-check-circle"></i> +${stats.questionsAskedToday || 0} today`;
    const materialsTrend = document.getElementById('stats-materials-shared-trend');
    if (materialsTrend) materialsTrend.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> total ${stats.materialsShared || 0}`;
}

function renderJoinedGroups(groups) {
    const grid = document.getElementById('my-groups-grid');
    const emptyState = document.getElementById('my-groups-empty-state');
    if (!grid) return;
    if (!groups || groups.length === 0) {
        grid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = groups.map(group => `
        <div class="group-card" style="background:white;border:1px solid var(--gray-200);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 6px rgba(0,0,0,0.02);transition:var(--transition);">
            <div style="height:100px;background-image:url('${group.cover_image}');background-size:cover;background-position:center;position:relative;">
                <div style="position:absolute;bottom:-18px;left:var(--spacing-md);width:44px;height:44px;border-radius:var(--radius-md);background:white;box-shadow:0 4px 8px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;border:1px solid var(--gray-200);">
                    <i class="${group.icon}" style="font-size:1.25rem;color:var(--primary);"></i>
                </div>
            </div>
            <div style="padding:var(--spacing-lg) var(--spacing-md) var(--spacing-md) var(--spacing-md);flex:1;">
                <h4 style="font-weight:700;font-size:1rem;color:var(--gray-900);margin-bottom:4px;">${escapeHtml(group.name)}</h4>
                <p style="font-size:0.82rem;color:var(--gray-600);line-height:1.4;height:38px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:var(--spacing-md);">${escapeHtml(group.description)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.78rem;color:var(--gray-600);border-top:1px solid var(--gray-100);padding-top:var(--spacing-sm);">
                    <span><i class="fas fa-users"></i> ${group.member_count} members</span>
                    <span><i class="fas fa-clock"></i> ${escapeHtml(group.meeting_schedule)}</span>
                </div>
            </div>
            <div style="padding:0 var(--spacing-md) var(--spacing-md) var(--spacing-md);">
                <button onclick="enterWorkspace('${group.group_id}')" style="width:100%;background:linear-gradient(135deg,var(--primary) 0%,var(--secondary) 100%);color:white;border:none;padding:var(--spacing-sm);border-radius:var(--radius-md);font-weight:600;cursor:pointer;font-size:0.85rem;transition:var(--transition);">Continue Workspace</button>
            </div>
        </div>
    `).join('');
    applyReveal(grid);
}

function renderExploreGroups(groups) {
    const grid = document.getElementById('explore-groups-grid');
    if (!grid) return;
    if (!groups || groups.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;padding:3rem 1rem;text-align:center;color:var(--gray-600);"><i class="fas fa-search" style="font-size:2rem;color:var(--gray-300);margin-bottom:var(--spacing-sm);"></i><p>No study groups found.</p></div>`;
        return;
    }
    grid.innerHTML = groups.map(group => `
        <div class="group-card" style="background:white;border:1px solid var(--gray-200);border-radius:var(--radius-lg);overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 6px rgba(0,0,0,0.02);transition:var(--transition);">
            <div style="height:100px;background-image:url('${group.cover_image}');background-size:cover;background-position:center;position:relative;">
                <div style="position:absolute;bottom:-18px;left:var(--spacing-md);width:44px;height:44px;border-radius:var(--radius-md);background:white;box-shadow:0 4px 8px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;border:1px solid var(--gray-200);">
                    <i class="${group.icon}" style="font-size:1.25rem;color:var(--primary);"></i>
                </div>
            </div>
            <div style="padding:var(--spacing-lg) var(--spacing-md) var(--spacing-md) var(--spacing-md);flex:1;">
                <span style="font-size:0.68rem;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:var(--radius-full);background:rgba(99,102,241,0.1);color:var(--primary);display:inline-block;margin-bottom:6px;">${group.category}</span>
                <h4 style="font-weight:700;font-size:1rem;color:var(--gray-900);margin-bottom:4px;">${escapeHtml(group.name)}</h4>
                <p style="font-size:0.82rem;color:var(--gray-600);line-height:1.4;height:38px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:var(--spacing-md);">${escapeHtml(group.description)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.78rem;color:var(--gray-600);border-top:1px solid var(--gray-100);padding-top:var(--spacing-sm);">
                    <span><i class="fas fa-users"></i> ${group.member_count} members</span>
                    <span><i class="fas fa-clock"></i> ${escapeHtml(group.meeting_schedule)}</span>
                </div>
            </div>
            <div style="padding:0 var(--spacing-md) var(--spacing-md) var(--spacing-md);">
                <button onclick="handleJoinGroup('${group.group_id}')" style="width:100%;background:white;border:1px solid var(--gray-200);color:var(--primary);padding:var(--spacing-sm);border-radius:var(--radius-md);font-weight:600;cursor:pointer;font-size:0.85rem;transition:var(--transition);">Join Group</button>
            </div>
        </div>
    `).join('');
    applyReveal(grid);
}

function renderFeedPosts(posts) {
    const feed = document.getElementById('discussion-posts-feed');
    const emptyState = document.getElementById('feed-empty-state');
    if (!feed) return;
    if (!posts || posts.length === 0) {
        feed.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';
    feed.style.display = 'flex';
    feed.innerHTML = posts.map(post => `
        <div class="card" style="background:white;border:1px solid var(--gray-200);border-radius:var(--radius-lg);padding:var(--spacing-md);margin-bottom:var(--spacing-md);box-shadow:0 4px 6px rgba(0,0,0,0.02);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-sm);">
                <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
                    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary) 0%,var(--secondary) 100%);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">
                        ${AuthSession.getInitials(post.author_name)}
                    </div>
                    <div>
                        <h4 style="font-size:0.92rem;font-weight:700;color:var(--gray-900);">${escapeHtml(post.author_name)}</h4>
                        <span style="font-size:0.72rem;color:var(--gray-600);">${new Date(post.created_at).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div style="font-size:0.92rem;color:var(--gray-900);margin-bottom:var(--spacing-md);line-height:1.5;white-space:pre-wrap;">${escapeHtml(post.content)}</div>
            ${post.media_path ? `<div style="border-radius:var(--radius-md);overflow:hidden;border:1px solid var(--gray-200);margin-bottom:var(--spacing-md);max-height:350px;"><img src="${AuthSession.API_BASE}${post.media_path}" style="width:100%;height:100%;object-fit:contain;"></div>` : ''}
            <div style="display:flex;gap:var(--spacing-md);border-top:1px solid var(--gray-100);padding-top:var(--spacing-sm);font-size:0.85rem;color:var(--gray-600);">
                <button onclick="handleLikePost('${post.post_id}')" style="background:transparent;border:none;cursor:pointer;color:${post.is_liked ? 'var(--primary)' : 'var(--gray-600)'};font-weight:600;display:flex;align-items:center;gap:4px;">
                    <i class="${post.is_liked ? 'fas' : 'far'} fa-thumbs-up"></i> Like (${post.likes_count})
                </button>
                <button onclick="toggleCommentsSection('${post.post_id}')" style="background:transparent;border:none;cursor:pointer;color:var(--gray-600);font-weight:600;display:flex;align-items:center;gap:4px;">
                    <i class="far fa-comment"></i> Comments (${post.comments_count})
                </button>
            </div>
            <div id="comments-section-${post.post_id}" style="display:none;margin-top:var(--spacing-md);border-top:1px solid var(--gray-100);padding-top:var(--spacing-md);">
                <div id="comments-list-${post.post_id}" style="display:flex;flex-direction:column;gap:var(--spacing-sm);margin-bottom:var(--spacing-md);"></div>
                <form onsubmit="handleSendComment(event,'${post.post_id}')" style="display:flex;gap:var(--spacing-sm);">
                    <input type="text" id="comment-input-${post.post_id}" placeholder="Write a comment..." required style="flex:1;padding:6px 12px;border-radius:var(--radius-full);border:1px solid var(--gray-200);outline:none;font-size:0.85rem;">
                    <button type="submit" style="background:var(--primary);color:white;border:none;padding:4px 14px;border-radius:var(--radius-full);font-weight:600;font-size:0.8rem;cursor:pointer;">Reply</button>
                </form>
            </div>
        </div>
    `).join('');
    applyReveal(feed);
}

function renderUpcomingEvents(events) {
    const container = document.getElementById('home-events-list');
    if (!container) return;
    if (!events || events.length === 0) {
        container.innerHTML = `<p style="font-size:0.8rem;color:var(--gray-600);font-style:italic;">No upcoming community events scheduled.</p>`;
        return;
    }
    container.innerHTML = events.map(ev => {
        const d = new Date(ev.event_date);
        return `<div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:var(--spacing-sm);display:flex;align-items:center;gap:var(--spacing-sm);">
            <div style="min-width:44px;height:44px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:var(--radius-md);display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;">
                <span style="font-size:0.6rem;font-weight:700;text-transform:uppercase;">${d.toLocaleString('default',{month:'short'})}</span>
                <span style="font-size:1.1rem;font-weight:800;line-height:1;">${d.getDate()}</span>
            </div>
            <div style="flex:1;overflow:hidden;">
                <div style="font-size:0.85rem;font-weight:700;color:var(--gray-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(ev.title)}</div>
                <div style="font-size:0.72rem;color:var(--gray-600);">${escapeHtml(ev.group_name)} · ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
        </div>`;
    }).join('');
    applyReveal(container);
}

function renderSuggestedGroups(groups) {
    const container = document.getElementById('sidebar-suggested-groups');
    const emptyLabel = document.getElementById('suggested-groups-empty');
    if (!container) return;
    if (!groups || groups.length === 0) {
        container.innerHTML = '';
        if (emptyLabel) emptyLabel.style.display = 'block';
        return;
    }
    if (emptyLabel) emptyLabel.style.display = 'none';
    container.innerHTML = groups.map(group => `
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:var(--spacing-sm);display:flex;align-items:center;justify-content:space-between;gap:var(--spacing-xs);">
            <div style="display:flex;align-items:center;gap:var(--spacing-xs);overflow:hidden;flex:1;">
                <div style="width:32px;height:32px;min-width:32px;border-radius:4px;background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;">
                    <i class="${group.icon}" style="color:var(--primary);font-size:0.85rem;"></i>
                </div>
                <div style="overflow:hidden;flex:1;">
                    <div style="font-size:0.82rem;font-weight:700;color:var(--gray-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(group.name)}</div>
                    <div style="font-size:0.72rem;color:var(--gray-600);">${group.member_count} members</div>
                </div>
            </div>
            <button onclick="handleJoinGroup('${group.group_id}')" style="background:var(--primary);color:white;border:none;padding:4px 10px;border-radius:var(--radius-full);font-size:0.72rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:var(--transition);">Join</button>
        </div>
    `).join('');
    applyReveal(container);
}

function renderActiveMeetings(meetings) {
    const container = document.getElementById('sidebar-active-meetings');
    const emptyLabel = document.getElementById('active-meetings-empty');
    if (!container) return;
    if (!meetings || meetings.length === 0) {
        container.innerHTML = '';
        if (emptyLabel) emptyLabel.style.display = 'block';
        return;
    }
    if (emptyLabel) emptyLabel.style.display = 'none';
    container.innerHTML = meetings.map(meeting => `
        <div style="background:rgba(99,102,241,0.03);border:1px solid rgba(99,102,241,0.15);border-radius:var(--radius-md);padding:var(--spacing-sm);position:relative;overflow:hidden;">
            <div style="position:absolute;right:8px;top:8px;width:6px;height:6px;border-radius:50%;background:var(--success);box-shadow:0 0 8px var(--success);"></div>
            <h5 style="font-size:0.82rem;font-weight:700;color:var(--gray-900);margin-bottom:2px;">${escapeHtml(meeting.title)}</h5>
            <p style="font-size:0.72rem;color:var(--gray-600);margin-bottom:var(--spacing-xs);">Group: <strong>${escapeHtml(meeting.group_name)}</strong></p>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:var(--gray-600);">
                <span>Host: ${escapeHtml(meeting.host_name)}</span>
                <button onclick="enterWorkspace('${meeting.group_id}')" style="background:var(--success);color:white;border:none;padding:2px 8px;border-radius:4px;font-weight:600;cursor:pointer;">Join Room</button>
            </div>
        </div>
    `).join('');
    applyReveal(container);
}

function renderOnlineMembers(onlineUsers) {
    const container = document.getElementById('sidebar-online-members');
    const emptyLabel = document.getElementById('online-members-empty');
    if (!container) return;
    if (!onlineUsers || onlineUsers.length === 0) {
        container.innerHTML = '';
        if (emptyLabel) emptyLabel.style.display = 'block';
        return;
    }
    if (emptyLabel) emptyLabel.style.display = 'none';
    container.innerHTML = onlineUsers.map(user => `
        <div style="display:flex;align-items:center;gap:var(--spacing-xs);padding:4px 0;">
            <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--primary) 0%,var(--secondary) 100%);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.7rem;">
                ${AuthSession.getInitials(user.full_name)}
            </div>
            <div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.82rem;font-weight:500;color:var(--gray-900);">${escapeHtml(user.full_name)}</div>
            <span style="width:6px;height:6px;border-radius:50%;background:var(--success);"></span>
        </div>
    `).join('');
    applyReveal(container);
}

function renderSidebarNotifications(notifications) {
    const container = document.getElementById('sidebar-notifications-list');
    const emptyLabel = document.getElementById('notifications-empty');
    if (!container) return;
    if (!notifications || notifications.length === 0) {
        container.innerHTML = '';
        if (emptyLabel) emptyLabel.style.display = 'block';
        return;
    }
    if (emptyLabel) emptyLabel.style.display = 'none';
    container.innerHTML = notifications.map(notif => `
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius-md);padding:var(--spacing-sm);font-size:0.78rem;position:relative;transition:var(--transition);cursor:pointer;" onclick="markNotificationRead('${notif.notification_id}')">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;">
                <strong style="color:var(--gray-900);">${escapeHtml(notif.title)}</strong>
                ${!notif.is_read ? '<span style="width:6px;height:6px;border-radius:50%;background:var(--primary);"></span>' : ''}
            </div>
            <div style="color:var(--gray-700);line-height:1.3;">${escapeHtml(notif.content)}</div>
            <div style="font-size:0.68rem;color:var(--gray-600);margin-top:4px;">${new Date(notif.created_at).toLocaleDateString()}</div>
        </div>
    `).join('');
    applyReveal(container);
}

function renderChallenges(challenges) {
    const container = document.getElementById('sidebar-challenges-list');
    if (!container) return;
    if (!challenges || challenges.length === 0) {
        container.innerHTML = `<p style="font-size:0.78rem;color:var(--gray-600);font-style:italic;">No active challenges today.</p>`;
        return;
    }
    container.innerHTML = challenges.map(ch => `
        <div class="challenge-item">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:0.8rem;font-weight:700;color:var(--gray-900);">${escapeHtml(ch.title)}</span>
                <span style="font-size:0.7rem;font-weight:600;color:var(--primary);">${ch.reward}</span>
            </div>
            <div style="font-size:0.72rem;color:var(--gray-600);margin-bottom:var(--spacing-xs);">${escapeHtml(ch.description)}</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <div class="challenge-progress-bar" style="flex:1;margin-top:0;">
                    <div class="challenge-progress-fill" style="width:${ch.progress}%"></div>
                </div>
                <span style="font-size:0.7rem;font-weight:600;color:var(--gray-700);">${ch.progress}%</span>
            </div>
        </div>
    `).join('');
    applyReveal(container);
}

// ---------------------------------------------------------------
// LOADING / ERROR STATE HELPERS
// ---------------------------------------------------------------

function setLoadingState(containerId, message = 'Loading...') {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--gray-500); font-size:0.85rem;"><i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>${message}</div>`;
    }
}

function setErrorState(containerId, message = 'Failed to load. Please refresh.') {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `<div style="text-align:center; padding:1.5rem; color:#ef4444; font-size:0.82rem;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>${message}</div>`;
    }
}

// ---------------------------------------------------------------
// INDIVIDUAL LOAD FUNCTIONS — used for post-action refreshes
// (join group, like post, RSVP, etc.) These fetch fresh data and
// delegate rendering to the shared render* functions above.
// ---------------------------------------------------------------

async function loadStats() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/stats');
        if (!res.ok) throw new Error('Stats fetch failed');
        const data = await res.json();
        if (data.success && data.stats) renderStats(data.stats);
    } catch (error) {
        console.error('[COMMUNITY] Error loading stats:', error);
    }
}

// FIXED: Guard against target === 0 or undefined which caused increment=0 and infinite setInterval
function animateCounter(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;
    if (!target || target <= 0) {
        element.innerText = '0' + (elementId === 'stats-active-members' ? '+' : '');
        return;
    }
    let count = 0;
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = Math.ceil(target / steps);

    const timer = setInterval(() => {
        count += increment;
        if (count >= target) {
            count = target;
            clearInterval(timer);
        }
        element.innerText = count.toLocaleString() + (elementId === 'stats-active-members' ? '+' : '');
    }, stepTime);
}


async function loadSuggestedGroups() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/groups/suggested');
        const data = await res.json();
        renderSuggestedGroups(data.success ? data.groups : []);
    } catch (err) { console.error('Error loading suggested groups:', err); }
}

async function loadActiveMeetings() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/meetings/active');
        const data = await res.json();
        renderActiveMeetings(data.success ? data.meetings : []);
    } catch (err) { console.error('Error loading active meetings:', err); }
}

async function loadOnlineMembers() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/presence/online');
        const data = await res.json();
        renderOnlineMembers(data.success ? data.onlineUsers : []);
    } catch (err) { console.error('Error loading online presence:', err); }
}

async function loadSidebarNotifications() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/notifications');
        const data = await res.json();
        renderSidebarNotifications(data.success ? data.notifications : []);
    } catch (err) { console.error('Error loading notifications:', err); }
}

async function markNotificationRead(id) {
    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/notifications/${id}/read`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            loadSidebarNotifications();
        }
    } catch (err) {
        console.error('Read notification error:', err);
    }
}

async function loadChallenges() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/challenges');
        const data = await res.json();
        renderChallenges(data.success ? data.challenges : []);
    } catch (err) { console.error('Error loading challenges:', err); }
}

async function loadJoinedGroups() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/groups/joined');
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        renderJoinedGroups(data.groups);
    } catch (error) { console.error('Error loading joined groups:', error); }
}

async function loadExploreGroups(category = 'all', search = '') {
    try {
        let url = `/api/community/groups?category=${category}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        const res = await AuthSession.fetchWithAuth(url);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        renderExploreGroups(data.groups);
    } catch (error) { console.error('Error loading explore groups:', error); }
}

async function handleJoinGroup(groupId) {
    // ── Optimistic UI: find and disable the Join button immediately ───────────
    const btn = document.querySelector(`button[onclick="handleJoinGroup('${groupId}')"]`);
    let originalHtml = '';
    if (btn) {
        originalHtml = btn.innerHTML;
        btn.innerHTML = 'Joining...';
        btn.classList.add('btn-joining');
        btn.disabled = true;
    }

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${groupId}/join`, {
            method: 'POST'
        });
        const data = await res.json();
        if (data.success) {
            // Invalidate SWR cache so next visit gets fresh data
            if (window.SWRCache) SWRCache.invalidatePrefix(`home-bundle:`);
            showPerfToast('Joined! You are now a member.', 'success');
            loadJoinedGroups();
            loadExploreGroups();
        } else {
            // Rollback
            if (btn) { btn.innerHTML = originalHtml; btn.classList.remove('btn-joining'); btn.disabled = false; }
            showPerfToast(data.message || 'Could not join group. Try again.', 'error');
        }
    } catch (err) {
        console.error('Join group error:', err);
        // Rollback on network error
        if (btn) { btn.innerHTML = originalHtml; btn.classList.remove('btn-joining'); btn.disabled = false; }
        showPerfToast('Network error — please try again.', 'error');
    }
}

async function handleCreateGroup(e) {
    e.preventDefault();
    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDescription').value.trim();
    const category = document.getElementById('groupCategory').value;
    const meetingSchedule = document.getElementById('groupSchedule').value.trim();

    try {
        const res = await AuthSession.fetchWithAuth('/api/community/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, category, meetingSchedule })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('createGroupModal');
            showNotificationToast('Study group created successfully!');
            document.getElementById('groupName').value = '';
            document.getElementById('groupDescription').value = '';
            loadJoinedGroups();
            loadExploreGroups();
        } else {
            alert(data.message || 'Creation failed');
        }
    } catch (err) {
        console.error('Create group error:', err);
    }
}

// -------------------------------------------------------------
// DISCUSSION FEED LOGIC
// -------------------------------------------------------------

async function loadFeedPosts() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/feed');
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();

        const feed = document.getElementById('discussion-posts-feed');
        const emptyState = document.getElementById('feed-empty-state');
        if (!feed) return;

        if (data.posts.length === 0) {
            feed.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        feed.style.display = 'flex';

        feed.innerHTML = data.posts.map(post => `
            <div class="card" style="background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: var(--spacing-md); margin-bottom: var(--spacing-md); box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">
                            ${AuthSession.getInitials(post.author_name)}
                        </div>
                        <div>
                            <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--gray-900);">${escapeHtml(post.author_name)}</h4>
                            <span style="font-size: 0.72rem; color: var(--gray-600);">${new Date(post.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div style="font-size: 0.92rem; color: var(--gray-900); margin-bottom: var(--spacing-md); line-height: 1.5; white-space: pre-wrap;">${escapeHtml(post.content)}</div>
                ${post.media_path ? `<div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--gray-200); margin-bottom: var(--spacing-md); max-height: 350px;"><img src="${AuthSession.API_BASE}${post.media_path}" style="width:100%; height:100%; object-fit:contain;"></div>` : ''}
                
                <div style="display: flex; gap: var(--spacing-md); border-top: 1px solid var(--gray-100); padding-top: var(--spacing-sm); font-size: 0.85rem; color: var(--gray-600);">
                    <button onclick="handleLikePost('${post.post_id}')" style="background:transparent; border:none; cursor:pointer; color:${post.is_liked ? 'var(--primary)' : 'var(--gray-600)'}; font-weight:600; display:flex; align-items:center; gap:4px;">
                        <i class="${post.is_liked ? 'fas' : 'far'} fa-thumbs-up"></i> Like (${post.likes_count})
                    </button>
                    <button onclick="toggleCommentsSection('${post.post_id}')" style="background:transparent; border:none; cursor:pointer; color:var(--gray-600); font-weight:600; display:flex; align-items:center; gap:4px;">
                        <i class="far fa-comment"></i> Comments (${post.comments_count})
                    </button>
                </div>

                <!-- Comments section inside feed card -->
                <div id="comments-section-${post.post_id}" style="display:none; margin-top:var(--spacing-md); border-top:1px solid var(--gray-100); padding-top:var(--spacing-md);">
                    <div id="comments-list-${post.post_id}" style="display:flex; flex-direction:column; gap:var(--spacing-sm); margin-bottom:var(--spacing-md);"></div>
                    <form onsubmit="handleSendComment(event, '${post.post_id}')" style="display:flex; gap:var(--spacing-sm);">
                        <input type="text" id="comment-input-${post.post_id}" placeholder="Write a comment..." required style="flex:1; padding:6px 12px; border-radius:var(--radius-full); border:1px solid var(--gray-200); outline:none; font-size:0.85rem;">
                        <button type="submit" style="background:var(--primary); color:white; border:none; padding:4px 14px; border-radius:var(--radius-full); font-weight:600; font-size:0.8rem; cursor:pointer;">Reply</button>
                    </form>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

async function handleCreatePost(e) {
    e.preventDefault();
    const content = document.getElementById('feed-post-content').value.trim();
    const mediaFile = document.getElementById('post-media-file').files[0];

    const formData = new FormData();
    formData.append('content', content);
    formData.append('destType', 'posts');
    if (mediaFile) {
        formData.append('media', mediaFile);
    }

    try {
        const res = await AuthSession.fetchWithAuth('/api/community/feed', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('feed-post-content').value = '';
            document.getElementById('post-media-file').value = '';
            document.getElementById('post-media-selected-label').textContent = '';
            loadFeedPosts();
            showNotificationToast('Post published successfully.');
        } else {
            alert(data.message || 'Post failed');
        }
    } catch (err) {
        console.error('Create post error:', err);
    }
}

function handlePostMediaSelect() {
    const file = document.getElementById('post-media-file').files[0];
    const lbl = document.getElementById('post-media-selected-label');
    if (file) {
        lbl.textContent = `Selected: ${file.name}`;
    }
}

async function handleLikePost(postId) {
    // ── Optimistic UI: toggle like state immediately ───────────────────────────
    const btn = document.querySelector(`button[onclick="handleLikePost('${postId}')"]`);
    if (!btn) return;

    const icon = btn.querySelector('i');
    const wasLiked = icon && icon.classList.contains('fas');
    const countMatch = btn.textContent.match(/\d+/);
    const prevCount = countMatch ? parseInt(countMatch[0], 10) : 0;

    // Apply optimistic state
    const newCount = wasLiked ? prevCount - 1 : prevCount + 1;
    if (icon) {
        icon.classList.toggle('fas', !wasLiked);
        icon.classList.toggle('far', wasLiked);
    }
    btn.style.color = wasLiked ? 'var(--gray-600)' : 'var(--primary)';
    btn.innerHTML = `<i class="${wasLiked ? 'far' : 'fas'} fa-thumbs-up"></i> Like (${newCount})`;
    btn.classList.add('like-btn-active');
    setTimeout(() => btn.classList.remove('like-btn-active'), 300);

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/feed/${postId}/like`, { method: 'POST' });
        const data = await res.json();
        if (!data.success) {
            // Rollback — server rejected
            btn.innerHTML = `<i class="${wasLiked ? 'fas' : 'far'} fa-thumbs-up"></i> Like (${prevCount})`;
            btn.style.color = wasLiked ? 'var(--primary)' : 'var(--gray-600)';
        } else {
            // Sync authoritative count from server
            if (typeof data.likesCount !== 'undefined') {
                btn.innerHTML = `<i class="${!wasLiked ? 'fas' : 'far'} fa-thumbs-up"></i> Like (${data.likesCount})`;
            }
            // Invalidate SWR feed cache so next full refresh reflects truth
            if (window.SWRCache) SWRCache.invalidatePrefix(`home-bundle:`);
        }
    } catch (err) {
        console.error('Like post error:', err);
        // Rollback on network error
        btn.innerHTML = `<i class="${wasLiked ? 'fas' : 'far'} fa-thumbs-up"></i> Like (${prevCount})`;
        btn.style.color = wasLiked ? 'var(--primary)' : 'var(--gray-600)';
    }
}

async function toggleCommentsSection(postId) {
    const sec = document.getElementById(`comments-section-${postId}`);
    if (sec.style.display === 'none') {
        sec.style.display = 'block';
        loadPostComments(postId);
    } else {
        sec.style.display = 'none';
    }
}

async function loadPostComments(postId) {
    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/feed/${postId}/comments`);
        const data = await res.json();
        const list = document.getElementById(`comments-list-${postId}`);
        
        if (data.comments.length === 0) {
            list.innerHTML = `<p style="font-size:0.8rem; color:var(--gray-600); font-style:italic;">No comments yet.</p>`;
            return;
        }

        list.innerHTML = data.comments.map(c => `
            <div style="background:var(--gray-50); padding:var(--spacing-xs) var(--spacing-sm); border-radius:var(--radius-md); font-size:0.82rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <strong style="color:var(--gray-900); font-size:0.82rem;">${escapeHtml(c.author_name)}</strong>
                    <span style="font-size:0.7rem; color:var(--gray-600);">${new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div style="color:var(--gray-700);">${escapeHtml(c.content)}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Load comments error:', err);
    }
}

async function handleSendComment(e, postId) {
    e.preventDefault();
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    // ── Optimistic UI: append comment immediately ─────────────────────────────
    const list = document.getElementById(`comments-list-${postId}`);
    const optimisticId = 'optimistic-' + Date.now();
    const optimisticHtml = `
        <div id="${optimisticId}" style="background:var(--gray-50);padding:var(--spacing-xs) var(--spacing-sm);border-radius:var(--radius-md);font-size:0.82rem;opacity:0.6;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <strong style="color:var(--gray-900);">${escapeHtml(currentUser.full_name)}</strong>
                <span style="font-size:0.7rem;color:var(--gray-600);">just now</span>
            </div>
            <div style="color:var(--gray-700);">${escapeHtml(content)}</div>
        </div>`;

    if (list) {
        // Remove 'no comments yet' message if present
        const empty = list.querySelector('p');
        if (empty) empty.remove();
        list.insertAdjacentHTML('beforeend', optimisticHtml);
    }
    input.value = '';

    // Update comment counter optimistically
    const commentsBtn = document.querySelector(`button[onclick="toggleCommentsSection('${postId}')"]`);
    if (commentsBtn) {
        const m = commentsBtn.textContent.match(/\d+/);
        const prevCnt = m ? parseInt(m[0], 10) : 0;
        commentsBtn.innerHTML = `<i class="far fa-comment"></i> Comments (${prevCnt + 1})`;
    }

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/feed/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        const data = await res.json();
        if (data.success) {
            // Replace optimistic comment with confirmed ones
            loadPostComments(postId);
            if (window.SWRCache) SWRCache.invalidatePrefix(`home-bundle:`);
        } else {
            // Remove optimistic entry on failure
            const opt = document.getElementById(optimisticId);
            if (opt) opt.remove();
            showPerfToast('Comment failed — please try again.', 'error');
        }
    } catch (err) {
        console.error('Send comment error:', err);
        const opt = document.getElementById(optimisticId);
        if (opt) opt.remove();
        showPerfToast('Network error — comment not sent.', 'error');
    }
}

// -------------------------------------------------------------
// COMMUNITY EVENTS LOGIC
// -------------------------------------------------------------

async function loadUpcomingEvents() {
    try {
        const res = await AuthSession.fetchWithAuth('/api/community/events/upcoming');
        const data = await res.json();
        
        const container = document.getElementById('home-events-list');
        if (!data.events || data.events.length === 0) {
            container.innerHTML = `<p style="font-size:0.8rem; color:var(--gray-600); font-style:italic;">No upcoming community events scheduled.</p>`;
            return;
        }

        container.innerHTML = data.events.map(ev => {
            const date = new Date(ev.event_date);
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="event-card" style="background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); display: flex; overflow: hidden; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                    <div class="event-date" style="background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 60px; min-width: 60px; font-weight: 700; text-align: center; padding: var(--spacing-sm);">
                        <span style="font-size: 1.25rem;">${day}</span>
                        <span style="font-size: 0.72rem; text-transform: uppercase;">${month}</span>
                    </div>
                    <div style="padding: var(--spacing-sm) var(--spacing-md); flex: 1; overflow: hidden;">
                        <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--gray-900); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(ev.title)}</h4>
                        <p style="font-size: 0.72rem; color: var(--gray-600); margin-bottom: 2px;">Group: <strong>${escapeHtml(ev.group_name || 'General')}</strong></p>
                        <p style="font-size: 0.78rem; color: var(--gray-600); margin-bottom: var(--spacing-xs); line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${escapeHtml(ev.description)}</p>
                        <div style="display: flex; gap: var(--spacing-md); font-size: 0.72rem; color: var(--gray-600);">
                            <span><i class="fas fa-clock"></i> ${time}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ev.location)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Load upcoming events error:', err);
    }
}

// -------------------------------------------------------------
// WORKSPACE NAVIGATION LOGIC
// -------------------------------------------------------------

function switchWorkspaceTab(tab) {
    activeTab = tab;
    // Highlight buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.innerText.toLowerCase().includes(tab)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Toggle panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        if (panel.id === `pane-${tab}`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    // Cleanup simulations if switching out of meeting
    if (tab !== 'meeting') {
        leaveMeetingRoom();
    }

    // Trigger tab-specific functions
    if (tab === 'overview') loadWorkspaceOverview();
    else if (tab === 'chat') enterWorkspaceChat();
    else if (tab === 'meeting') enterWorkspaceMeeting();
    else if (tab === 'materials') loadWorkspaceMaterials();
    else if (tab === 'qa') loadWorkspaceQuestions();
    else if (tab === 'members') loadWorkspaceMembers();
    else if (tab === 'events') loadWorkspaceEvents();
    else if (tab === 'announcements') loadWorkspaceAnnouncements();
}

async function enterWorkspace(groupId) {
    activeGroupId = groupId;
    currentFolderId = null;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${groupId}`);
        if (!res.ok) {
            alert('Failed to enter group workspace.');
            return;
        }

        const data = await res.json();
        
        // Populate Banner
        document.getElementById('workspace-group-name').textContent = data.group.name;
        document.getElementById('workspace-group-desc').textContent = data.group.description;
        document.getElementById('workspace-icon-box').innerHTML = `<i class="${data.group.icon}"></i>`;
        
        // Populate enriched header metadata fields
        const catEl = document.getElementById('workspace-group-category');
        if (catEl) catEl.textContent = data.group.category || 'other';
        const memEl = document.getElementById('workspace-group-members');
        if (memEl) memEl.textContent = data.group.member_count || 0;
        const createdEl = document.getElementById('workspace-group-created');
        if (createdEl) createdEl.textContent = data.group.created_at ? new Date(data.group.created_at).toLocaleDateString() : 'N/A';

        // Apply Cover banner layout style
        document.getElementById('workspace-banner').style.backgroundImage = `linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%), url('${data.group.cover_image}')`;
        document.getElementById('workspace-banner').style.backgroundSize = 'cover';

        // Check Permissions (Owner or Mod roles update UI buttons visibility)
        const isPrivileged = data.userRole === 'owner' || data.userRole === 'moderator';
        document.getElementById('invite-members-btn').style.display = isPrivileged ? 'block' : 'none';
        document.getElementById('create-events-btn').style.display = isPrivileged ? 'block' : 'none';
        document.getElementById('announcement-create-box').style.display = isPrivileged ? 'block' : 'none';

        // Swap View containers
        document.getElementById('community-home-view').style.display = 'none';
        document.getElementById('group-workspace-view').style.display = 'block';

        // Set up real-time group join signal
        socket.emit('joinGroup', { groupId, userId: currentUser.user_id });

        // Switch to overview by default
        switchWorkspaceTab('overview');

    } catch (err) {
        console.error('Enter workspace error:', err);
    }
}

function exitWorkspace() {
    activeGroupId = null;
    currentFolderId = null;
    leaveMeetingRoom();

    document.getElementById('group-workspace-view').style.display = 'none';
    document.getElementById('community-home-view').style.display = 'block';
    
    loadHomeData(); // reload
}

async function loadWorkspaceOverview() {
    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}`);
        const data = await res.json();

        // 1. Announcements
        const annContainer = document.getElementById('group-overview-announcements');
        if (data.announcements.length === 0) {
            annContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--gray-600); font-style:italic;">No group announcements yet.</p>`;
        } else {
            annContainer.innerHTML = data.announcements.map(ann => `
                <div style="background:var(--gray-50); border:1px solid var(--gray-200); padding:var(--spacing-md); border-radius:var(--radius-lg); margin-bottom:var(--spacing-sm);">
                    <h5 style="font-weight:700; font-size:0.9rem; color:var(--gray-900); margin-bottom:4px;">${escapeHtml(ann.title)}</h5>
                    <p style="font-size:0.85rem; color:var(--gray-700); margin-bottom:var(--spacing-xs);">${escapeHtml(ann.content)}</p>
                    <div style="font-size:0.72rem; color:var(--gray-600);">by ${escapeHtml(ann.author_name)} on ${new Date(ann.created_at).toLocaleDateString()}</div>
                </div>
            `).join('');
        }

        // 2. Activity Feed logs
        const actContainer = document.getElementById('group-overview-activity');
        if (data.activity.length === 0) {
            actContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--gray-600); font-style:italic;">No recent activity.</p>`;
        } else {
            actContainer.innerHTML = data.activity.map(act => `
                <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:var(--gray-700); border-bottom:1px solid var(--gray-100); padding:var(--spacing-xs) 0;">
                    <span><strong>${escapeHtml(act.user_name)}</strong> ${escapeHtml(act.action)}</span>
                    <span style="font-size:0.72rem; color:var(--gray-600);">${new Date(act.created_at).toLocaleDateString()}</span>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Load overview error:', err);
    }
}

// -------------------------------------------------------------
// A. CHAT TAB LOGIC
// -------------------------------------------------------------

function enterWorkspaceChat() {
    const chatBox = document.getElementById('chat-messages-box');
    chatBox.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--gray-600);"><i class="fas fa-spinner fa-spin"></i> Loading chat history...</div>`;
    
    updateChatOnlineMembers();
}

function updateChatOnlineMembers() {
    // Dynamically list users in group chat sidebar
    loadWorkspaceMembers().then(() => {
        const membersList = document.getElementById('group-members-list-body');
        const onlineContainer = document.getElementById('chat-online-users-list');
        if (!onlineContainer || !membersList) return;

        // Simply showcase all members as simulated online/presence list for study sessions
        const rows = Array.from(membersList.querySelectorAll('tr'));
        onlineContainer.innerHTML = rows.map(tr => {
            const name = tr.cells[0].innerText;
            const role = tr.cells[2].innerText;
            return `
                <div class="online-member-item">
                    <span class="presence-dot online"></span>
                    <span style="font-weight:600;">${name}</span>
                    <span style="font-size:0.7rem; color:var(--gray-600); background:var(--gray-100); padding:1px 6px; border-radius:4px; margin-left:auto;">${role}</span>
                </div>
            `;
        }).join('');
    });
}

function appendChatMessage(msg) {
    const box = document.getElementById('chat-messages-box');
    const isMe = msg.userId === currentUser.user_id;

    // Check if duplicate element exists
    if (document.getElementById(`msg-${msg.messageId}`)) return;

    const div = document.createElement('div');
    div.id = `msg-${msg.messageId}`;
    div.className = `chat-message-bubble ${isMe ? 'me' : ''}`;
    div.setAttribute('data-author-initials', AuthSession.getInitials(msg.authorName || 'U'));

    let bodyContent = escapeHtml(msg.content);
    // If message is file attachment format
    if (msg.content.startsWith('[FILE_UPLOAD]')) {
        try {
            const fileMeta = JSON.parse(msg.content.replace('[FILE_UPLOAD]', ''));
            const downloadUrl = `${AuthSession.API_BASE}${fileMeta.filePath}`;
            bodyContent = `
                <a href="${downloadUrl}" target="_blank" class="message-file-card">
                    <i class="fas fa-file-alt message-file-icon"></i>
                    <div class="message-file-info">
                        <div class="message-file-name">${escapeHtml(fileMeta.fileName)}</div>
                        <div>Click to download</div>
                    </div>
                </a>
            `;
        } catch (e) {
            bodyContent = 'Shared attachment file';
        }
    }

    div.innerHTML = `
        <div class="message-meta">
            <strong>${escapeHtml(msg.authorName)}</strong>
            <span>${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="message-body">${bodyContent}</div>
    `;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// Typing Broadcaster
let typingTimeout;
function handleTypingIndicator() {
    socket.emit('typing', { groupId: activeGroupId, userId: currentUser.user_id, isTyping: true });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('typing', { groupId: activeGroupId, userId: currentUser.user_id, isTyping: false });
    }, 1500);
}



async function handleSendChatMessage(e) {
    e.preventDefault();
    const txt = document.getElementById('chat-textarea');
    const content = txt.value.trim();
    const attachment = document.getElementById('chat-attachment-input').files[0];

    if (!content && !attachment) return;

    if (attachment) {
        // Upload attachment first
        const formData = new FormData();
        formData.append('file', attachment);
        formData.append('destType', 'chat');

        try {
            const uploadRes = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/materials`, {
                method: 'POST',
                body: formData
            });
            const data = await uploadRes.json();
            if (data.success) {
                // Fetch details of file
                const fileMsg = `[FILE_UPLOAD]{"fileName":"${attachment.name}","filePath":"${data.fileId ? '/uploads/community/materials/' + attachment.name : '/uploads/community/chat/' + attachment.name}"}`;
                
                socket.emit('sendGroupMessage', {
                    groupId: activeGroupId,
                    userId: currentUser.user_id,
                    content: fileMsg
                });

                document.getElementById('chat-attachment-input').value = '';
                document.getElementById('chat-attachment-preview-lbl').textContent = '';
            }
        } catch (err) {
            console.error('Attachment upload error:', err);
        }
    } else {
        socket.emit('sendGroupMessage', {
            groupId: activeGroupId,
            userId: currentUser.user_id,
            content
        });
        txt.value = '';
    }
}

function handleChatAttachmentSelect() {
    const file = document.getElementById('chat-attachment-input').files[0];
    const lbl = document.getElementById('chat-attachment-preview-lbl');
    if (file) {
        lbl.textContent = `Attached: ${file.name} (${Math.round(file.size/1024)} KB)`;
    }
}

// -------------------------------------------------------------
// B. MEETING ROOM & WHITEBOARD LOGIC
// -------------------------------------------------------------

function enterWorkspaceMeeting() {
    isMuted = false;
    isCameraOn = false;
    isWhiteboardActive = false;
    isHandRaised = false;
    meetingSeconds = 0;

    // Reset meeting controllers appearance
    document.getElementById('meeting-btn-mute').className = 'meeting-btn';
    document.getElementById('meeting-btn-camera').className = 'meeting-btn';
    document.getElementById('meeting-btn-whiteboard').className = 'meeting-btn';
    document.getElementById('meeting-btn-hand').className = 'meeting-btn';

    // Start timer simulation
    clearInterval(meetingTimerInterval);
    meetingTimerInterval = setInterval(() => {
        meetingSeconds++;
        const mins = Math.floor(meetingSeconds / 60).toString().padStart(2, '0');
        const secs = (meetingSeconds % 60).toString().padStart(2, '0');
        document.getElementById('meeting-duration-label').textContent = `${mins}:${secs}`;
    }, 1000);

    // Initialize Canvas drawing events
    setupWhiteboardCanvas();
    
    // Simulate other participant entering study room
    simulateMeetingParticipants();
}

function leaveMeetingRoom() {
    clearInterval(meetingTimerInterval);
    const videoGrid = document.getElementById('meeting-video-grid-box');
    if (videoGrid) {
        videoGrid.innerHTML = `
            <div class="video-frame" id="local-video-box">
                <div style="font-size: 2.5rem; color: white;" id="local-avatar-placeholder">U</div>
                <video id="local-webcam" autoplay muted style="display: none;"></video>
                <span class="video-label">You (Host)</span>
                <div class="hand-raised-indicator" id="local-hand-raise-indicator" style="display: none;"><i class="fas fa-hand"></i></div>
            </div>
        `;
    }
    
    // Turn off webcam track if active
    const localVideo = document.getElementById('local-webcam');
    if (localVideo && localVideo.srcObject) {
        const stream = localVideo.srcObject;
        stream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }
}

function simulateMeetingParticipants() {
    const videoGrid = document.getElementById('meeting-video-grid-box');
    
    // Seed virtual participants
    const participants = [
        { name: 'Aarav Mehta', avatar: 'AM', webcam: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
        { name: 'Diya Sharma', avatar: 'DS', webcam: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' }
    ];

    participants.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'video-frame';
        div.id = `participant-${idx}`;
        div.innerHTML = `
            <img src="${p.webcam}" style="width:100%; height:100%; object-fit:cover;">
            <span class="video-label">${p.name}</span>
            <div class="hand-raised-indicator" id="hand-raise-participant-${idx}" style="display:none;"><i class="fas fa-hand"></i></div>
        `;
        videoGrid.appendChild(div);
    });
}

function toggleLocalMute() {
    isMuted = !isMuted;
    const btn = document.getElementById('meeting-btn-mute');
    if (isMuted) {
        btn.classList.add('danger');
        btn.innerHTML = `<i class="fas fa-microphone-slash"></i>`;
        showNotificationToast('You are muted.');
    } else {
        btn.classList.remove('danger');
        btn.innerHTML = `<i class="fas fa-microphone"></i>`;
        showNotificationToast('Microphone unmuted.');
    }
}

async function toggleLocalCamera() {
    isCameraOn = !isCameraOn;
    const btn = document.getElementById('meeting-btn-camera');
    const localVideo = document.getElementById('local-webcam');
    const localPlaceholder = document.getElementById('local-avatar-placeholder');

    if (isCameraOn) {
        btn.classList.add('active');
        localPlaceholder.style.display = 'none';
        localVideo.style.display = 'block';
        
        // Start streaming webcam feed
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            localVideo.srcObject = stream;
        } catch (e) {
            console.warn('Camera blocked/unavailable in local context, simulating camera activity.');
            localVideo.style.display = 'none';
            localPlaceholder.style.display = 'flex';
            localPlaceholder.textContent = 'ðŸ“¸';
        }
        showNotificationToast('Webcam turned on.');
    } else {
        btn.classList.remove('active');
        localVideo.style.display = 'none';
        localPlaceholder.style.display = 'flex';
        localPlaceholder.textContent = AuthSession.getInitials(currentUser.full_name);
        
        if (localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
        }
        showNotificationToast('Camera turned off.');
    }
}

function toggleMeetingWhiteboard() {
    isWhiteboardActive = !isWhiteboardActive;
    const btn = document.getElementById('meeting-btn-whiteboard');
    const board = document.getElementById('meeting-whiteboard-panel');
    const meetingGrid = document.getElementById('meeting-main-grid');

    if (isWhiteboardActive) {
        btn.classList.add('active');
        board.style.display = 'flex';
        meetingGrid.classList.remove('full');
        // Fit canvas sizes
        resizeWhiteboardCanvas();
        showNotificationToast('Whiteboard shared.');
    } else {
        btn.classList.remove('active');
        board.style.display = 'none';
        meetingGrid.classList.add('full');
    }
}

function toggleHandRaise() {
    isHandRaised = !isHandRaised;
    const btn = document.getElementById('meeting-btn-hand');
    const ind = document.getElementById('local-hand-raise-indicator');

    if (isHandRaised) {
        btn.classList.add('active');
        ind.style.display = 'flex';
        showNotificationToast('You raised your hand âœ‹');
    } else {
        btn.classList.remove('active');
        ind.style.display = 'none';
    }

    socket.emit('raiseHand', { groupId: activeGroupId, userId: currentUser.user_id, userName: currentUser.full_name, raised: isHandRaised });
}

function updateParticipantHand(userId, raised) {
    // Check if matching visual participants
    // For demo purposes, we randomly map to participant card 0 or 1
    const idx = userId === currentUser.user_id ? 'local' : Math.floor(Math.random() * 2);
    const indicator = document.getElementById(`hand-raise-participant-${idx}`) || document.getElementById('local-hand-raise-indicator');
    if (indicator) {
        indicator.style.display = raised ? 'flex' : 'none';
    }
}

// -------------------------------------------------------------
// WHITEBOARD CANVAS IMPLEMENTATION
// -------------------------------------------------------------

function setupWhiteboardCanvas() {
    whiteboardCanvas = document.getElementById('whiteboard-main-canvas');
    if (!whiteboardCanvas) return;
    
    whiteboardCtx = whiteboardCanvas.getContext('2d');
    
    // Listeners for mouse drawings
    whiteboardCanvas.addEventListener('mousedown', startDrawing);
    whiteboardCanvas.addEventListener('mousemove', draw);
    whiteboardCanvas.addEventListener('mouseup', stopDrawing);
    whiteboardCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile screens
    whiteboardCanvas.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        startDrawing({ clientX: t.clientX, clientY: t.clientY });
    });
    whiteboardCanvas.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        draw({ clientX: t.clientX, clientY: t.clientY });
    });
    whiteboardCanvas.addEventListener('touchend', stopDrawing);
}

function resizeWhiteboardCanvas() {
    if (!whiteboardCanvas) return;
    const parent = whiteboardCanvas.parentElement;
    whiteboardCanvas.width = parent.clientWidth;
    whiteboardCanvas.height = parent.clientHeight;
    
    // Redraw white background
    whiteboardCtx.fillStyle = '#ffffff';
    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
}

function startDrawing(e) {
    isDrawing = true;
    const rect = whiteboardCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    const rect = whiteboardCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawPathOnCanvas(x, y, lastX, lastY, brushColor, brushSize);

    // Emit paint signals via sockets
    socket.emit('draw', {
        groupId: activeGroupId,
        x, y, lastX, lastY,
        color: brushColor,
        size: brushSize
    });

    lastX = x;
    lastY = y;
}

function stopDrawing() {
    isDrawing = false;
}

function drawPathOnCanvas(x, y, lx, ly, color, size) {
    if (!whiteboardCtx) return;
    whiteboardCtx.beginPath();
    whiteboardCtx.strokeStyle = color;
    whiteboardCtx.lineWidth = size;
    whiteboardCtx.lineCap = 'round';
    whiteboardCtx.moveTo(lx, ly);
    whiteboardCtx.lineTo(x, y);
    whiteboardCtx.stroke();
    whiteboardCtx.closePath();
}

function setWhiteboardColor(color) {
    brushColor = color;
}

function setWhiteboardBrushSize(size) {
    brushSize = size;
}

function triggerClearWhiteboard() {
    clearCanvasLocally();
    socket.emit('clearWhiteboard', { groupId: activeGroupId });
}

function clearCanvasLocally() {
    if (!whiteboardCtx || !whiteboardCanvas) return;
    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    whiteboardCtx.fillStyle = '#ffffff';
    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
}

// -------------------------------------------------------------
// C. PRIVATE MATERIALS TAB
// -------------------------------------------------------------

async function loadWorkspaceMaterials() {
    const grid = document.getElementById('workspace-materials-grid');
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Loading materials directory...</div>`;

    try {
        let url = `/api/community/groups/${activeGroupId}/materials`;
        if (currentFolderId) {
            url += `?categoryId=${currentFolderId}`;
        }

        const res = await AuthSession.fetchWithAuth(url);
        const data = await res.json();

        const emptyState = document.getElementById('materials-empty-state');
        if (data.folders.length === 0 && data.files.length === 0) {
            grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        grid.style.display = 'grid';

        let html = '';

        // Folder listings
        data.folders.forEach(f => {
            html += `
                <div class="folder-card" onclick="navigateToFolder('${f.category_id}', '${escapeHtml(f.name)}')">
                    <i class="fas fa-folder folder-card-icon"></i>
                    <div style="overflow: hidden;">
                        <h4 style="font-size: 0.9rem; font-weight:700; white-space: nowrap; text-overflow: ellipsis; overflow:hidden;">${escapeHtml(f.name)}</h4>
                        <span style="font-size:0.75rem; color:var(--gray-600);">Folder</span>
                    </div>
                </div>
            `;
        });

        // File listings
        data.files.forEach(file => {
            const sizeStr = file.file_size ? `${Math.round(file.file_size/1024)} KB` : 'N/A';
            const dlUrl = `${AuthSession.API_BASE}${file.file_path}`;
            html += `
                <div class="file-row-card">
                    <div class="file-row-header">
                        <i class="fas fa-file-pdf file-icon" style="color:var(--primary);"></i>
                        <div class="file-title-block">
                            <h4>${escapeHtml(file.title)}</h4>
                            <p>${sizeStr} â€¢ ${escapeHtml(file.file_type).toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="file-row-actions">
                        <span>by ${escapeHtml(file.author_name || 'Member')}</span>
                        <div style="display:flex; gap:6px;">
                            <a href="${dlUrl}" target="_blank" class="file-action-btn" title="Download"><i class="fas fa-download"></i></a>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

    } catch (err) {
        console.error('Load materials error:', err);
    }
}

function navigateToFolder(folderId, folderName = '') {
    currentFolderId = folderId;
    
    // Update breadcrumb
    const crumb = document.getElementById('materials-breadcrumb');
    if (!folderId) {
        crumb.innerHTML = `<span class="materials-path-crumb" onclick="navigateToFolder(null)">Library Root</span>`;
    } else {
        crumb.innerHTML = `
            <span class="materials-path-crumb" onclick="navigateToFolder(null)">Library Root</span>
            <i class="fas fa-chevron-right" style="font-size:0.72rem; color:var(--gray-600);"></i>
            <span>${escapeHtml(folderName)}</span>
        `;
    }

    loadWorkspaceMaterials();
}

async function openCreateFolderDialog() {
    const name = prompt('Enter name for the new folder:');
    if (!name || name.trim() === '') return;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/materials/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), parentId: currentFolderId })
        });
        const data = await res.json();
        if (data.success) {
            loadWorkspaceMaterials();
        } else {
            alert(data.message || 'Folder creation failed');
        }
    } catch (err) {
        console.error('Create folder error:', err);
    }
}

async function handleUploadMaterialFile(e) {
    e.preventDefault();
    const title = document.getElementById('materialTitle').value.trim();
    const description = document.getElementById('materialDescription').value.trim();
    const tags = document.getElementById('materialTags').value.trim();
    const file = document.getElementById('materialFileInput').files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('categoryId', currentFolderId || '');
    formData.append('file', file);
    formData.append('destType', 'materials');

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/materials`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            closeModal('uploadFileModal');
            showNotificationToast('File uploaded to library!');
            document.getElementById('materialTitle').value = '';
            document.getElementById('materialDescription').value = '';
            document.getElementById('materialTags').value = '';
            document.getElementById('materialFileInput').value = '';
            loadWorkspaceMaterials();
        } else {
            alert(data.message || 'Upload failed');
        }
    } catch (err) {
        console.error('Upload file error:', err);
    }
}

// -------------------------------------------------------------
// D. Q&A TAB LOGIC
// -------------------------------------------------------------

async function loadWorkspaceQuestions() {
    const list = document.getElementById('group-questions-list');
    list.innerHTML = `<p style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading questions board...</p>`;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/questions`);
        const data = await res.json();

        const emptyState = document.getElementById('qa-empty-state');
        if (data.questions.length === 0) {
            list.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';

        list.innerHTML = data.questions.map(q => `
            <div class="qa-card" onclick="openQuestionThread('${q.question_id}')">
                <div class="qa-header">
                    <span class="qa-title">${escapeHtml(q.title)}</span>
                    <span class="qa-badge ${q.is_solved ? 'solved' : 'unsolved'}">${q.is_solved ? 'Solved' : 'Open'}</span>
                </div>
                <div class="qa-body">${escapeHtml(q.description)}</div>
                <div class="qa-meta">
                    <span>asked by <strong>${escapeHtml(q.author_name)}</strong> on ${new Date(q.created_at).toLocaleDateString()}</span>
                    <span><i class="far fa-comment"></i> ${q.answers_count} Answers</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Load questions error:', err);
    }
}

async function handleCreateQuestion(e) {
    e.preventDefault();
    const title = document.getElementById('questionTitle').value.trim();
    const description = document.getElementById('questionDescription').value.trim();
    const subject = document.getElementById('questionSubject').value.trim();
    const tags = document.getElementById('questionTags').value.trim();
    const priority = document.getElementById('questionPriority').value;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, subject, tags, priority })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('askQuestionModal');
            showNotificationToast('Question posted successfully!');
            document.getElementById('questionTitle').value = '';
            document.getElementById('questionDescription').value = '';
            document.getElementById('questionSubject').value = '';
            document.getElementById('questionTags').value = '';
            loadWorkspaceQuestions();
        } else {
            alert(data.message || 'Post failed');
        }
    } catch (err) {
        console.error('Create question error:', err);
    }
}

async function openQuestionThread(questionId) {
    activeQuestionId = questionId;
    openModal('questionDetailsModal');
    loadQuestionThreadDetails();
}

async function loadQuestionThreadDetails() {
    const body = document.getElementById('q-details-thread-body');
    body.innerHTML = `<p style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading thread...</p>`;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/questions/${activeQuestionId}`);
        const data = await res.json();

        let html = `
            <div style="border-bottom:1px solid var(--gray-200); padding-bottom:var(--spacing-md); margin-bottom:var(--spacing-md);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--spacing-xs);">
                    <h3 style="font-weight:700; color:var(--gray-900); font-size:1.25rem;">${escapeHtml(data.question.title)}</h3>
                    <span class="qa-badge ${data.question.is_solved ? 'solved' : 'unsolved'}">${data.question.is_solved ? 'Solved' : 'Open'}</span>
                </div>
                <div style="font-size:0.92rem; color:var(--gray-700); line-height:1.5; margin-bottom:var(--spacing-md); white-space:pre-wrap;">${escapeHtml(data.question.description)}</div>
                <div style="font-size:0.75rem; color:var(--gray-600);">
                    Asked by <strong>${escapeHtml(data.question.author_name)}</strong> | Priority: ${data.question.priority.toUpperCase()} | Tags: ${escapeHtml(data.question.tags || 'none')}
                </div>
            </div>
            <h4 style="font-weight:700; margin-bottom:var(--spacing-sm); font-size:1rem;">Answers (${data.answers.length})</h4>
            <div style="display:flex; flex-direction:column; gap:var(--spacing-md);">
        `;

        if (data.answers.length === 0) {
            html += `<p style="color:var(--gray-600); font-style:italic; font-size:0.85rem;">No answers yet. Submit yours below!</p>`;
        } else {
            data.answers.forEach(ans => {
                const isAccepted = ans.is_accepted;
                html += `
                    <div class="answer-card ${isAccepted ? 'accepted' : ''}">
                        <div class="voting-column">
                            <i class="fas fa-chevron-up vote-arrow ${ans.user_vote === 1 ? 'active' : ''}" onclick="handleVoteAnswer('${ans.answer_id}', 1)"></i>
                            <span>${ans.votes_sum}</span>
                            <i class="fas fa-chevron-down vote-arrow ${ans.user_vote === -1 ? 'active' : ''}" onclick="handleVoteAnswer('${ans.answer_id}', -1)"></i>
                        </div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <strong style="font-size:0.85rem;">${escapeHtml(ans.author_name)}</strong>
                                <span style="font-size:0.72rem; color:var(--gray-600);">${new Date(ans.created_at).toLocaleDateString()}</span>
                            </div>
                            <div style="font-size:0.9rem; color:var(--gray-700); margin-bottom:var(--spacing-sm); white-space:pre-wrap;">${escapeHtml(ans.content)}</div>
                            
                            <div style="display:flex; align-items:center; gap:var(--spacing-md);">
                                ${isAccepted ? `
                                    <span style="color:var(--success); font-weight:700; font-size:0.78rem; display:flex; align-items:center; gap:4px;"><i class="fas fa-check-circle"></i> Accepted Answer</span>
                                ` : `
                                    <button onclick="handleAcceptAnswer('${ans.answer_id}')" style="background:transparent; border:none; color:var(--primary); font-weight:600; font-size:0.75rem; cursor:pointer;"><i class="far fa-check-circle"></i> Accept Answer</button>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        body.innerHTML = html;

    } catch (err) {
        console.error('Load question thread error:', err);
    }
}

async function handlePostAnswer(e) {
    e.preventDefault();
    const txt = document.getElementById('qa-answer-textarea');
    const content = txt.value.trim();

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/questions/${activeQuestionId}/answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        const data = await res.json();
        if (data.success) {
            txt.value = '';
            loadQuestionThreadDetails();
            loadWorkspaceQuestions(); // reload overview questions
        } else {
            alert(data.message || 'Answer failed');
        }
    } catch (err) {
        console.error('Post answer error:', err);
    }
}

async function handleVoteAnswer(answerId, vote) {
    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/answers/${answerId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote })
        });
        const data = await res.json();
        if (data.success) {
            loadQuestionThreadDetails();
        }
    } catch (err) {
        console.error('Vote answer error:', err);
    }
}

async function handleAcceptAnswer(answerId) {
    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/answers/${answerId}/accept`, {
            method: 'POST'
        });
        const data = await res.json();
        if (data.success) {
            loadQuestionThreadDetails();
            loadWorkspaceQuestions();
        } else {
            alert(data.message || 'Accept failed');
        }
    } catch (err) {
        console.error('Accept answer error:', err);
    }
}

// -------------------------------------------------------------
// E. MEMBERS TAB LOGIC
// -------------------------------------------------------------

async function loadWorkspaceMembers() {
    const tableBody = document.getElementById('group-members-list-body');
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Loading members...</td></tr>`;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/members`);
        const data = await res.json();

        tableBody.innerHTML = data.members.map(member => {
            const joinedDate = new Date(member.joined_at).toLocaleDateString();
            return `
                <tr style="border-bottom: 1px solid var(--gray-100);">
                    <td style="padding: var(--spacing-md); font-weight: 600;">${escapeHtml(member.full_name)}</td>
                    <td style="padding: var(--spacing-md); color: var(--gray-600);">${escapeHtml(member.email)}</td>
                    <td style="padding: var(--spacing-md);"><span style="font-size:0.75rem; text-transform:uppercase; padding:2px 8px; border-radius:4px; font-weight:bold; background:${member.role === 'owner' ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.1)'}; color:${member.role === 'owner' ? 'var(--primary)' : 'var(--secondary)'};">${member.role}</span></td>
                    <td style="padding: var(--spacing-md); color: var(--gray-600);">${joinedDate}</td>
                    <td style="padding: var(--spacing-md); text-align: right;">
                        <!-- Actions can go here -->
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Load members error:', err);
    }
}

async function handleInviteMember(e) {
    e.preventDefault();
    const email = document.getElementById('inviteUserEmail').value.trim();

    try {
        // Invite simulation: creates notification for target user
        showNotificationToast(`Invitation request dispatched to ${email}`);
        closeModal('inviteMemberModal');
        document.getElementById('inviteUserEmail').value = '';
    } catch (err) {
        console.error('Invite member error:', err);
    }
}

// -------------------------------------------------------------
// F. EVENTS TAB LOGIC
// -------------------------------------------------------------

async function loadWorkspaceEvents() {
    const grid = document.getElementById('group-events-grid');
    grid.innerHTML = `<p style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading scheduled events...</p>`;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/events`);
        const data = await res.json();

        const emptyState = document.getElementById('events-empty-state');
        if (data.events.length === 0) {
            grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        grid.style.display = 'grid';

        grid.innerHTML = data.events.map(ev => {
            const date = new Date(ev.event_date);
            return `
                <div class="card" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius-lg); padding:var(--spacing-md); box-shadow:0 4px 6px rgba(0,0,0,0.02);">
                    <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: var(--radius-full); background: rgba(99, 102, 241, 0.1); color: var(--primary); display: inline-block; margin-bottom: 6px;">${ev.type.replace('_', ' ')}</span>
                    <h4 style="font-weight:700; margin-bottom:4px; font-size:0.95rem;">${escapeHtml(ev.title)}</h4>
                    <p style="font-size:0.82rem; color:var(--gray-600); margin-bottom:var(--spacing-md); line-height:1.4;">${escapeHtml(ev.description)}</p>
                    <div style="font-size:0.75rem; color:var(--gray-600); margin-bottom:var(--spacing-md);">
                        <div><i class="far fa-calendar"></i> ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ev.location)}</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--gray-100); padding-top:var(--spacing-sm);">
                        <span style="font-size:0.72rem; color:var(--gray-600);">${ev.rsvp_going_count} going</span>
                        <div style="display:flex; gap:4px;">
                            <button onclick="handleEventRSVP('${ev.event_id}', 'going')" style="padding:2px 8px; border-radius:var(--radius-sm); border:1px solid var(--primary); background:${ev.user_rsvp_status === 'going' ? 'var(--primary)' : 'white'}; color:${ev.user_rsvp_status === 'going' ? 'white' : 'var(--primary)'}; font-size:0.72rem; font-weight:bold; cursor:pointer;">Going</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Load events error:', err);
    }
}

async function handleCreateEvent(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value.trim();
    const description = document.getElementById('eventDescription').value.trim();
    const type = document.getElementById('eventType').value;
    const location = document.getElementById('eventLocation').value.trim();
    const eventDate = document.getElementById('eventDate').value;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, type, location, eventDate })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('createEventModal');
            showNotificationToast('Event scheduled successfully!');
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDescription').value = '';
            loadWorkspaceEvents();
        } else {
            alert(data.message || 'Creation failed');
        }
    } catch (err) {
        console.error('Create event error:', err);
    }
}

async function handleEventRSVP(eventId, status) {
    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            loadWorkspaceEvents();
        }
    } catch (err) {
        console.error('RSVP error:', err);
    }
}

// -------------------------------------------------------------
// G. ANNOUNCEMENTS TAB LOGIC
// -------------------------------------------------------------

async function loadWorkspaceAnnouncements() {
    const list = document.getElementById('group-announcements-list-view');
    list.innerHTML = `<p style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading broadcasts...</p>`;

    try {
        const res = await AuthSession.fetchWithAuth(`/api/community/groups/${activeGroupId}`);
        const data = await res.json();

        const emptyState = document.getElementById('announcements-empty-state');
        if (data.announcements.length === 0) {
            list.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';

        list.innerHTML = data.announcements.map(ann => `
            <div class="card" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius-lg); padding:var(--spacing-md); box-shadow:0 4px 6px rgba(0,0,0,0.02);">
                <h4 style="font-weight:700; margin-bottom:var(--spacing-xs); font-size:1rem; color:var(--gray-900);">${escapeHtml(ann.title)}</h4>
                <div style="font-size:0.92rem; color:var(--gray-700); margin-bottom:var(--spacing-md); line-height:1.5; white-space:pre-wrap;">${escapeHtml(ann.content)}</div>
                <div style="font-size:0.75rem; color:var(--gray-600); border-top:1px solid var(--gray-100); padding-top:var(--spacing-sm);">
                    broadcasted by <strong>${escapeHtml(ann.author_name)}</strong> on ${new Date(ann.created_at).toLocaleString()}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Load announcements error:', err);
    }
}

// -------------------------------------------------------------
// GLOBAL SEARCH CONTROLLERS
// -------------------------------------------------------------

let searchDebounceTimeout;
function filterExploreGroups() {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
        const q = document.getElementById('group-search').value.trim();
        const activeCat = document.querySelector('.filter-btn.active').dataset.category;
        loadExploreGroups(activeCat, q);
    }, 300);
}

function selectCategoryFilter(btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const category = btn.dataset.category;
    const q = document.getElementById('group-search').value.trim();
    loadExploreGroups(category, q);
}

// -------------------------------------------------------------
// MODALS MANAGEMENT
// -------------------------------------------------------------

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// -------------------------------------------------------------
// NOTIFICATIONS / TOAST IMPLEMENTATION
// -------------------------------------------------------------

function showNotificationToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = 'var(--gray-900)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.animation = 'toastSlide 0.3s ease';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Stylesheet helper for notifications slide-in
const toastStyles = document.createElement('style');
toastStyles.innerHTML = `
    @keyframes toastSlide {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(toastStyles);

// -------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function setupFeedEvents() {
    // Catch scroll actions or simple details
}
