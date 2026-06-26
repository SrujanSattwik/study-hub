// Global Auth State Manager
const AuthManager = {
    isProfileMenuOpen: false,

    getUser() {
        const userStr = localStorage.getItem('studyhub_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem('studyhub_token');
    },

    setAuth(token, user) {
        localStorage.setItem('studyhub_token', token);
        localStorage.setItem('studyhub_user', JSON.stringify(user));
    },

    clearAuth() {
        localStorage.removeItem('studyhub_token');
        localStorage.removeItem('studyhub_user');
    },

    isLoggedIn() {
        return !!this.getToken() && !!this.getUser();
    },

    getInitials(fullName) {
        if (!fullName) return 'U';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    },

    updateLoginButtons() {
        const user = this.getUser();
        const loginButtons = document.querySelectorAll('.login-btn, [href*="login.html"]');
        
        loginButtons.forEach(btn => {
            if (this.isLoggedIn() && user) {
                const initials = this.getInitials(user.full_name);
                const profileBadge = document.createElement('div');
                profileBadge.className = 'profile-badge';
                profileBadge.innerHTML = `
                    <div class="profile-avatar">${initials}</div>
                    <span class="profile-name">${user.full_name}</span>
                    <div class="profile-dropdown">
                        <a href="index-dashboard.html"><i class="fas fa-th-large"></i> Dashboard</a>
                        <a href="#" onclick="AuthManager.logout(); return false;"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                `;
                
                const dropdown = profileBadge.querySelector('.profile-dropdown');
                
                profileBadge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.isProfileMenuOpen = !this.isProfileMenuOpen;
                    dropdown.style.display = this.isProfileMenuOpen ? 'block' : 'none';
                });
                
                dropdown.addEventListener('click', (e) => e.stopPropagation());
                
                btn.replaceWith(profileBadge);
            }
        });
        
        document.addEventListener('click', () => {
            this.isProfileMenuOpen = false;
            document.querySelectorAll('.profile-dropdown').forEach(d => d.style.display = 'none');
        });
    },

    logout() {
        this.clearAuth();
        window.location.href = 'login.html';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthManager.updateLoginButtons());
} else {
    AuthManager.updateLoginButtons();
}
