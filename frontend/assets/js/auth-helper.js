// Authentication Helper - Centralized login/logout management

const AuthHelper = {
    // Check if user is authenticated
    isAuthenticated() {
        return UserManager.isUserLoggedIn();
    },
    
    // Require login for protected pages
    requireLogin(redirectUrl = '../index.html') {
        if (!this.isAuthenticated()) {
            alert('⚠️ You must be logged in to access this feature');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    },
    
    // Mock login (for development)
    mockLogin(username = 'Student') {
        const userId = 'user_' + Date.now();
        UserManager.loginUser(userId);
        const user = UserManager.getCurrentUser();
        user.profile.name = username;
        UserManager.updateCurrentUser(user);
        return userId;
    },
    
    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            UserManager.logoutUser();
            window.location.href = '../index.html';
        }
    }
};

window.AuthHelper = AuthHelper;
