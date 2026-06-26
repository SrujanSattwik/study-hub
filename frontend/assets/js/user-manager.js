// User Manager - Handles per-user data and state
const UserManager = {
    STORAGE_KEY: 'studyhub_users',
    CURRENT_USER_KEY: 'studyhub_current_user',
    
    // Check if user is logged in
    isUserLoggedIn() {
        const token = localStorage.getItem('studyhub_token');
        const user = localStorage.getItem('studyhub_user');
        if (token && user) return true;
        
        const userId = localStorage.getItem(this.CURRENT_USER_KEY);
        return userId !== null && userId !== '';
    },
    
    // Get current user ID
    getCurrentUserId() {
        const userStr = localStorage.getItem('studyhub_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.user_id) return user.user_id;
            } catch (e) {
                console.error("Error parsing user from localStorage", e);
            }
        }
        return localStorage.getItem(this.CURRENT_USER_KEY);
    },
    
    // Login user
    loginUser(userId) {
        if (!userId) {
            userId = 'user_' + Date.now();
        }
        localStorage.setItem(this.CURRENT_USER_KEY, userId);
        return userId;
    },
    
    // Logout user
    logoutUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
        localStorage.removeItem('studyhub_token');
        localStorage.removeItem('studyhub_user');
    },
    
    // Get all users data
    getAllUsers() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    },
    
    // Get current user data
    getCurrentUser() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        
        const users = this.getAllUsers();
        
        if (!users[userId]) {
            users[userId] = this.createNewUser(userId);
            // Sync with auth user info if available
            const userStr = localStorage.getItem('studyhub_user');
            if (userStr) {
                try {
                    const authUser = JSON.parse(userStr);
                    if (authUser) {
                        users[userId].profile.name = authUser.full_name || users[userId].profile.name;
                        users[userId].profile.email = authUser.email || users[userId].profile.email;
                    }
                } catch (e) {}
            }
            this.saveAllUsers(users);
        }
        
        return users[userId];
    },
    
    // Create new user with default structure
    createNewUser(userId) {
        return {
            userId,
            profile: {
                name: 'Student',
                email: '',
                avatar: 'SS',
                createdAt: new Date().toISOString()
            },
            onboarding: {
                completed: false,
                syllabusSetupCompleted: false,
                stepsCompleted: [],
                lastVisitedStep: 0,
                completedAt: null
            },
            syllabus: {
                subjects: [],
                schedule: null
            },
            tasks: [],
            analytics: {
                studyTime: 0,
                materialsViewed: 0,
                lastActive: new Date().toISOString()
            }
        };
    },
    
    // Save all users data
    saveAllUsers(users) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    },
    
    // Update current user data
    updateCurrentUser(updates) {
        const userId = this.getCurrentUserId();
        const users = this.getAllUsers();
        users[userId] = { ...users[userId], ...updates };
        this.saveAllUsers(users);
        return users[userId];
    },
    
    // Update onboarding state
    updateOnboarding(updates) {
        const user = this.getCurrentUser();
        user.onboarding = { ...user.onboarding, ...updates };
        return this.updateCurrentUser(user);
    },
    
    // Mark step as completed
    completeStep(stepIndex) {
        const user = this.getCurrentUser();
        if (!user.onboarding.stepsCompleted.includes(stepIndex)) {
            user.onboarding.stepsCompleted.push(stepIndex);
            user.onboarding.lastVisitedStep = stepIndex;
        }
        return this.updateCurrentUser(user);
    },
    
    // Check if step is completed
    isStepCompleted(stepIndex) {
        const user = this.getCurrentUser();
        return user.onboarding.stepsCompleted.includes(stepIndex);
    },
    
    // Check if onboarding is complete
    isOnboardingComplete() {
        const user = this.getCurrentUser();
        return user.onboarding.completed;
    },
    
    // Complete onboarding
    completeOnboarding() {
        const user = this.getCurrentUser();
        user.onboarding.completed = true;
        user.onboarding.completedAt = new Date().toISOString();
        return this.updateCurrentUser(user);
    },
    
    // Update profile
    updateProfile(profileData) {
        const user = this.getCurrentUser();
        user.profile = { ...user.profile, ...profileData };
        return this.updateCurrentUser(user);
    },
    
    // Switch user (for testing)
    switchUser(userId) {
        localStorage.setItem(this.CURRENT_USER_KEY, userId);
        window.location.reload();
    },
    
    // Reset current user (for testing)
    resetCurrentUser() {
        const userId = this.getCurrentUserId();
        const users = this.getAllUsers();
        users[userId] = this.createNewUser(userId);
        this.saveAllUsers(users);
        window.location.reload();
    },
    
    // Reset user onboarding completely
    resetUserOnboarding(userId) {
        if (!userId) userId = this.getCurrentUserId();
        if (!userId) return false;
        
        const users = this.getAllUsers();
        if (!users[userId]) return false;
        
        // Reset all onboarding and scheduler data
        users[userId].onboarding = {
            completed: false,
            syllabusSetupCompleted: false,
            stepsCompleted: [],
            lastVisitedStep: 0,
            completedAt: null
        };
        users[userId].syllabus = { subjects: [], schedule: null };
        users[userId].studyPlan = {};
        users[userId].tasks = [];
        users[userId].analytics = {
            ...users[userId].analytics,
            studyTime: 0,
            materialsViewed: 0
        };
        
        this.saveAllUsers(users);
        return true;
    }
};

// Export for use in other files
window.UserManager = UserManager;
