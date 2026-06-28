// Unified Authentication & Session Layout Manager
const AuthSession = {
    API_BASE: window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:3001' 
        : 'http://localhost:3001',
        
    // Protected pages that require login
    PROTECTED_PATHS: [
        'index-dashboard.html',
        'get-started.html',
        'materials.html',
        'resources.html',
        'community.html',
        'KnowNook.html',
        'study-bite.html',
        'cheat-note-creation.html',
        'mindmesh.html',
        'studysync.html',
        'syllabus-scheduler.html',
        'timetable.html'
    ],

    // LocalStorage Keys
    TOKEN_KEY: 'studyhub_token',
    USER_KEY: 'studyhub_user',

    // Path resolution variables
    rootDir: '',
    pagesDir: '',

    init() {
        this.resolvePaths();
        this.checkAccessControl();
        
        // Render templates on DOM load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onReady());
        } else {
            this.onReady();
        }
    },

    resolvePaths() {
        const path = window.location.pathname;
        if (path.includes('/pages/materials/') || path.includes('/pages/get-started/')) {
            this.rootDir = '../../';
            this.pagesDir = '../';
        } else if (path.includes('/pages/')) {
            this.rootDir = '../';
            this.pagesDir = '';
        } else {
            this.rootDir = './';
            this.pagesDir = 'pages/';
        }
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    },

    isLoggedIn() {
        return !!this.getToken() && !!this.getUser();
    },

    // Check access permissions based on path
    checkAccessControl() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'index.html';
        
        const isProtected = this.PROTECTED_PATHS.some(p => pageName.includes(p));
        const hasSession = this.isLoggedIn();

        console.debug(`[AUTH] checkAccessControl: pageName=${pageName}, isProtected=${isProtected}, hasSession=${hasSession}`);

        if (isProtected && !hasSession) {
            console.warn(`[AUTH] Unauthorized. Redirecting to login. Protected page, no session. Destination: ${this.pagesDir}login.html`);
            window.location.href = `${this.pagesDir}login.html`;
            return;
        }

        // F2 FIX: Only validate session with backend if it hasn't been checked recently.
        // Avoids a network round-trip on every page navigation (common case: session is fine).
        if (hasSession) {
            const FRESHNESS_MS = 5 * 60 * 1000; // 5 minutes
            const lastValidated = parseInt(sessionStorage.getItem('studyhub_session_validated') || '0', 10);
            const isFresh = Date.now() - lastValidated < FRESHNESS_MS;

            if (!isFresh) {
                console.debug('[AUTH] Session stale or first check — validating with backend...');
                this.validateBackendSession();
            } else {
                console.debug('[AUTH] Session fresh — skipping backend validation.');
            }
        }
    },

    // Validate backend session token
    async validateBackendSession() {
        try {
            const token = this.getToken();
            console.debug(`[AUTH] Sending session validation to ${this.API_BASE}/auth/session`);
            const res = await fetch(`${this.API_BASE}/auth/session`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                console.error(`[AUTH] Session validation failed (status ${res.status}). Logging out...`);
                this.logout(true);
            } else {
                // Mark session as freshly validated so other tabs / pages skip the check
                sessionStorage.setItem('studyhub_session_validated', Date.now().toString());
                console.debug('[AUTH] Session validated successfully.');
            }
        } catch (err) {
            console.error('[AUTH] Failed to validate session with backend:', err);
        }
    },

    // Handle session logout
    async logout(silent = false) {
        console.debug(`[AUTH] logout() called. silent=${silent}`);
        if (!silent) {
            try {
                const token = this.getToken();
                await fetch(`${this.API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {
                console.error('[AUTH] Failed to contact logout endpoint:', err);
            }
        }
        
        // Clear session freshness marker
        sessionStorage.removeItem('studyhub_session_validated');

        // Clear cache and prefetch state
        if (window.SWRCache) window.SWRCache.clear();
        if (window.Prefetcher) window.Prefetcher.clear();

        // Clean session keys
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem('studyhub_current_user'); // also reset onboarding mock login key
        
        console.debug(`[AUTH] Redirecting to: ${this.pagesDir}login.html`);
        window.location.href = `${this.pagesDir}login.html`;
    },

    // API wrapper to inject auth tokens automatically
    async fetchWithAuth(url, options = {}) {
        const token = this.getToken();
        
        // Prepend backend API base if it is a local API route
        let finalUrl = url;
        if (url.startsWith('/api/') || url.startsWith('/auth/')) {
            finalUrl = `${this.API_BASE}${url}`;
        }

        options.headers = {
            ...options.headers,
            'Authorization': token ? `Bearer ${token}` : ''
        };

        const response = await fetch(finalUrl, options);
        
        // Handle auth expiration / permission warning without forcing page redirect
        if (response.status === 401 || response.status === 403) {
            console.warn(`[AUTH] API request returned status ${response.status} for ${finalUrl}. Keeping page active.`);
        }

        return response;
    },

    // Setup layouts and triggers
    onReady() {
        this.renderSidebar();
        this.renderTopbar();
        this.setupLayoutEvents();
        this.updateAuthControls();
    },

    getInitials(fullName) {
        if (!fullName) return 'U';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    },

    // Inject Unified Premium Sidebar
    renderSidebar() {
        const sidebarContainer = document.querySelector('.sidebar') || document.getElementById('sidebar-container');
        if (!sidebarContainer) return;

        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'index.html';
        
        const getActive = (name) => pageName.includes(name) ? 'active' : '';

        // Generate Sidebar HTML markup
        sidebarContainer.innerHTML = `
            <div class="sidebar-header">
                <a href="${this.rootDir}index.html" class="sidebar-logo">
                    <i class="fas fa-graduation-cap"></i>
                    <span>StudyClub</span>
                </a>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-section-title">Main</div>
                    <a href="${this.rootDir}index.html" class="nav-item ${pageName === 'index.html' ? 'active' : ''}">
                        <i class="fas fa-home"></i>
                        <span>Home</span>
                    </a>
                    <a href="${this.pagesDir}index-dashboard.html" class="nav-item ${getActive('index-dashboard.html')}">
                        <i class="fas fa-th-large"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="${this.pagesDir}get-started.html" class="nav-item ${getActive('get-started.html')}">
                        <i class="fas fa-rocket"></i>
                        <span>Get Started</span>
                    </a>
                    <a href="${this.pagesDir}materials.html" class="nav-item ${getActive('materials.html')}">
                        <i class="fas fa-book"></i>
                        <span>Materials</span>
                    </a>
                    <a href="${this.pagesDir}resources.html" class="nav-item ${getActive('resources.html')}">
                        <i class="fas fa-folder-open"></i>
                        <span>Resources</span>
                    </a>
                    <a href="${this.pagesDir}community.html" class="nav-item ${getActive('community.html')}">
                        <i class="fas fa-users"></i>
                        <span>Community</span>
                    </a>
                </div>
                
                <div class="nav-section">
                    <div class="nav-section-title">Learning Tools</div>
                    <a href="${this.pagesDir}get-started/study-bite.html" class="nav-item ${getActive('study-bite.html')}">
                        <i class="fas fa-fire"></i>
                        <span>StudyBite</span>
                    </a>
                    <a href="${this.pagesDir}get-started/cheat-note-creation.html" class="nav-item ${getActive('cheat-note-creation.html')}">
                        <i class="fas fa-sticky-note"></i>
                        <span>Cheat Notes</span>
                    </a>
                    <a href="${this.pagesDir}KnowNook.html" class="nav-item ${getActive('KnowNook.html')}">
                        <i class="fas fa-robot"></i>
                        <span>KnowNook AI</span>
                    </a>
                    <a href="${this.pagesDir}get-started/syllabus-scheduler.html" class="nav-item ${getActive('syllabus-scheduler.html')}">
                        <i class="fas fa-tasks"></i>
                        <span>Syllabus Scheduler</span>
                    </a>
                    <a href="${this.pagesDir}get-started/studysync.html" class="nav-item ${getActive('studysync.html')}">
                        <i class="fas fa-sync-alt"></i>
                        <span>StudySync</span>
                    </a>
                    <a href="${this.pagesDir}get-started/timetable.html" class="nav-item ${getActive('timetable.html')}">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Timetable</span>
                    </a>
                    <a href="${this.pagesDir}get-started/mindmesh.html" class="nav-item ${getActive('mindmesh.html')}">
                        <i class="fas fa-project-diagram"></i>
                        <span>MindMesh</span>
                    </a>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Materials Categories</div>
                    <a href="${this.pagesDir}materials/textbooks.html" class="nav-item ${getActive('textbooks.html')}">
                        <i class="fas fa-book-open"></i>
                        <span>Textbooks</span>
                    </a>
                    <a href="${this.pagesDir}materials/video-lectures.html" class="nav-item ${getActive('video-lectures.html')}">
                        <i class="fas fa-video"></i>
                        <span>Video Lectures</span>
                    </a>
                    <a href="${this.pagesDir}materials/study-notes.html" class="nav-item ${getActive('study-notes.html')}">
                        <i class="fas fa-file-pdf"></i>
                        <span>Study Notes</span>
                    </a>
                    <a href="${this.pagesDir}materials/practice-tests.html" class="nav-item ${getActive('practice-tests.html')}">
                        <i class="fas fa-question-circle"></i>
                        <span>Practice Tests</span>
                    </a>
                    <a href="${this.pagesDir}materials/infographics.html" class="nav-item ${getActive('infographics.html')}">
                        <i class="fas fa-image"></i>
                        <span>Infographics</span>
                    </a>
                    <a href="${this.pagesDir}materials/audio-content.html" class="nav-item ${getActive('audio-content.html')}">
                        <i class="fas fa-podcast"></i>
                        <span>Audio Content</span>
                    </a>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Account</div>
                    <a href="${this.pagesDir}about.html" class="nav-item ${getActive('about.html')}">
                        <i class="fas fa-info-circle"></i>
                        <span>About</span>
                    </a>
                    <a href="${this.pagesDir}subscription.html" class="nav-item ${getActive('subscription.html')}">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </a>
                </div>
            </nav>
        `;
    },

    // Inject Unified Premium Topbar
    renderTopbar() {
        const topbarContainer = document.querySelector('.topbar') || document.getElementById('topbar-container');
        if (!topbarContainer) return;

        const user = this.getUser();
        const hasSession = this.isLoggedIn() && user;
        const initials = hasSession ? this.getInitials(user.full_name) : 'U';

        topbarContainer.innerHTML = `
            <div class="topbar-left">
                <button class="sidebar-toggle" id="toggle-sidebar-btn">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="topbar-search">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search materials, notes, or ask AI...">
                </div>
            </div>
            <div class="topbar-right">
                <a href="${this.pagesDir}subscription.html" title="Settings">
                    <button class="topbar-icon-btn">
                        <i class="fas fa-cog"></i>
                    </button>
                </a>
                
                ${hasSession ? `
                    <div class="profile-badge" id="user-profile-badge">
                        <div class="profile-avatar">${initials}</div>
                        <span class="profile-name">${user.full_name}</span>
                        <div class="profile-dropdown" id="profile-dropdown-card">
                            <div class="dropdown-header">
                                <div class="dropdown-avatar">${initials}</div>
                                <div class="dropdown-user-info">
                                    <div class="dropdown-name">${user.full_name}</div>
                                    <div class="dropdown-email">${user.email || ''}</div>
                                    <div class="dropdown-role">${(user.role || 'Student').toUpperCase()}</div>
                                </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <a href="${this.pagesDir}index-dashboard.html"><i class="fas fa-th-large"></i> Dashboard</a>
                            <a href="${this.pagesDir}get-started.html"><i class="fas fa-rocket"></i> Get Started</a>
                            <a href="${this.pagesDir}subscription.html"><i class="fas fa-cog"></i> Settings</a>
                            <div class="dropdown-divider"></div>
                            <a href="#" id="auth-logout-link" class="logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a>
                        </div>
                    </div>
                ` : `
                    <a href="${this.pagesDir}login.html" class="btn btn-primary btn-sm login-btn">Login</a>
                `}
            </div>
        `;
    },

    setupLayoutEvents() {
        const sidebar = document.querySelector('.sidebar') || document.getElementById('sidebar-container');
        const toggle = document.querySelector('#toggle-sidebar-btn') || document.querySelector('.sidebar-toggle');
        let overlay = document.querySelector('.sidebar-overlay');

        if (sidebar && !overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-open');
                    overlay?.classList.toggle('active');
                } else {
                    sidebar.classList.toggle('collapsed');
                    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
                }
            });
        }

        if (overlay && sidebar) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
                overlay.classList.remove('active');
            });
        }

        // Restore sidebar state on load
        if (sidebar && window.innerWidth > 768) {
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
            }
        }

        // Setup dropdown toggles
        const profileBadge = document.getElementById('user-profile-badge');
        const dropdownCard = document.getElementById('profile-dropdown-card');
        
        if (profileBadge && dropdownCard) {
            profileBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownCard.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                dropdownCard.classList.remove('show');
            });
        }

        // Setup logout trigger
        const logoutLink = document.getElementById('auth-logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    },

    // Show/hide UI auth triggers on static pages (like index.html / about.html)
    updateAuthControls() {
        const hasSession = this.isLoggedIn();
        const user = this.getUser();
        
        // Update any generic login buttons in navbars
        const navbarMenus = document.querySelectorAll('.nav-menu, .navbar-right');
        navbarMenus.forEach(menu => {
            const loginBtn = menu.querySelector('.login-btn, .btn-login, [href*="login.html"]');
            if (loginBtn && hasSession && user) {
                const initials = this.getInitials(user.full_name);
                const badge = document.createElement('div');
                badge.className = 'profile-badge';
                badge.id = 'navbar-profile-badge';
                badge.innerHTML = `
                    <div class="profile-avatar">${initials}</div>
                    <span class="profile-name">${user.full_name}</span>
                    <div class="profile-dropdown" id="navbar-dropdown-card">
                        <div class="dropdown-header">
                            <div class="dropdown-avatar">${initials}</div>
                            <div class="dropdown-user-info">
                                <div class="dropdown-name">${user.full_name}</div>
                                <div class="dropdown-email">${user.email || ''}</div>
                                <div class="dropdown-role">${(user.role || 'Student').toUpperCase()}</div>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="${this.pagesDir}index-dashboard.html"><i class="fas fa-th-large"></i> Dashboard</a>
                        <a href="${this.pagesDir}get-started.html"><i class="fas fa-rocket"></i> Get Started</a>
                        <a href="${this.pagesDir}subscription.html"><i class="fas fa-cog"></i> Settings</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" id="navbar-logout-btn" class="logout-link"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                `;
                
                const dropdown = badge.querySelector('#navbar-dropdown-card');
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('show');
                });
                
                document.addEventListener('click', () => {
                    dropdown.classList.remove('show');
                });

                const logoutBtn = badge.querySelector('#navbar-logout-btn');
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });

                loginBtn.replaceWith(badge);
            }
        });
    }
};

// Auto initialize auth session state
AuthSession.init();

// Export to window
window.AuthSession = AuthSession;
