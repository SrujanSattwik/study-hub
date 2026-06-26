// Get Started Page - Personalized Onboarding System

const GetStartedManager = {
    steps: [
        {
            id: 0,
            title: 'Add Syllabus & Subjects',
            description: 'Set up your subjects and syllabus',
            icon: 'fa-book',
            action: 'setupSyllabus',
            prerequisite: null
        },
        {
            id: 1,
            title: 'Generate Study Schedule',
            description: 'Create your personalized study plan',
            icon: 'fa-calendar-alt',
            action: 'generateSchedule',
            prerequisite: 0
        },
        {
            id: 2,
            title: 'Upload Study Materials',
            description: 'Add or link your study resources',
            icon: 'fa-upload',
            action: 'uploadMaterials',
            prerequisite: 1
        },
        {
            id: 3,
            title: 'Start Daily Study',
            description: 'Begin your learning journey',
            icon: 'fa-play-circle',
            action: 'goToDashboard',
            prerequisite: 2
        }
    ],
    
    // Initialize page
    init() {
        if (!UserManager.isUserLoggedIn()) {
            this.showLoginRequired();
            return;
        }
        this.checkRedirect();
        this.renderWelcome();
        this.renderSteps();
        this.renderToolCards();
        this.setupEventListeners();
    },
    
    showLoginRequired() {
        const welcomeEl = document.getElementById('welcome-message');
        const stepsEl = document.getElementById('onboarding-steps');
        const toolsEl = document.getElementById('tool-cards');
        
        if (welcomeEl) {
            welcomeEl.innerHTML = `
                <h1>🔒 Login Required</h1>
                <p>Please login to access your personalized study hub</p>
            `;
        }
        
        if (stepsEl) {
            stepsEl.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: #f8fafc; border-radius: 12px;">
                    <i class="fas fa-lock" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <h3 style="color: #475569; margin-bottom: 0.5rem;">Login to Continue</h3>
                    <p style="color: #64748b;">Access your personalized onboarding steps</p>
                    <button class="btn btn-primary" onclick="window.location.href='login.html'" style="margin-top: 1rem;">
                        <i class="fas fa-sign-in-alt"></i> Go to Login
                    </button>
                </div>
            `;
        }
        
        if (toolsEl) {
            toolsEl.innerHTML = '';
        }
    },
    
    // Check if user should be redirected
    checkRedirect() {
        if (UserManager.isOnboardingComplete()) {
            window.location.href = 'index-dashboard.html';
        }
    },
    
    // Render personalized welcome message
    renderWelcome() {
        const user = UserManager.getCurrentUser();
        const welcomeEl = document.getElementById('welcome-message');
        if (!welcomeEl) return;
        
        const completedSteps = user.onboarding.stepsCompleted.length;
        const totalSteps = this.steps.length;
        
        let message = '';
        if (completedSteps === 0) {
            message = `Welcome, ${user.profile.name} — let's build your study plan`;
        } else if (completedSteps < totalSteps) {
            message = `Welcome back, ${user.profile.name} — continue where you left off`;
        } else {
            message = `Great job, ${user.profile.name} — you're all set!`;
        }
        
        welcomeEl.innerHTML = `
            <h1>${message}</h1>
            <p>Progress: ${completedSteps}/${totalSteps} steps completed</p>
        `;
    },
    
    // Render onboarding steps
    renderSteps() {
        const container = document.getElementById('onboarding-steps');
        if (!container) return;
        
        const user = UserManager.getCurrentUser();
        
        container.innerHTML = this.steps.map(step => {
            const isCompleted = user.onboarding.stepsCompleted.includes(step.id);
            const isLocked = step.prerequisite !== null && !user.onboarding.stepsCompleted.includes(step.prerequisite);
            const isCurrent = !isCompleted && !isLocked;
            
            return `
                <div class="onboarding-step ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${isCurrent ? 'current' : ''}" data-step="${step.id}">
                    <div class="step-icon">
                        <i class="fas ${step.icon}"></i>
                        ${isCompleted ? '<i class="fas fa-check step-check"></i>' : ''}
                        ${isLocked ? '<i class="fas fa-lock step-lock"></i>' : ''}
                    </div>
                    <div class="step-content">
                        <h3>${step.title}</h3>
                        <p>${step.description}</p>
                        ${isCurrent ? `<button class="btn btn-primary" onclick="GetStartedManager.handleStepAction('${step.action}', ${step.id})">Start</button>` : ''}
                        ${isCompleted ? '<span class="step-status">✓ Completed</span>' : ''}
                        ${isLocked ? '<span class="step-status">🔒 Locked</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // Render tool cards with dynamic state
    renderToolCards() {
        const container = document.getElementById('tool-cards');
        if (!container) return;
        
        const user = UserManager.getCurrentUser();
        const syllabusComplete = user.onboarding.syllabusSetupCompleted;
        
        const tools = [
            {
                name: 'Syllabus Scheduler',
                icon: 'fa-tasks',
                description: 'Break down your syllabus into manageable tasks',
                link: 'get-started/syllabus-scheduler.html',
                requiresSyllabus: false,
                isCore: true
            },
            {
                name: 'StudyBite',
                icon: 'fa-fire',
                description: '5-minute daily challenges',
                link: 'get-started/study-bite.html',
                requiresSyllabus: true
            },
            {
                name: 'Cheat Notes',
                icon: 'fa-sticky-note',
                description: 'Quick, shareable study notes',
                link: 'get-started/cheat-note-creation.html',
                requiresSyllabus: true
            },
            {
                name: 'KnowNook AI',
                icon: 'fa-robot',
                description: 'AI-powered doubt resolution',
                link: 'KnowNook.html',
                requiresSyllabus: false
            }
        ];
        
        let toolCardsHTML = tools.map(tool => {
            const isLocked = tool.requiresSyllabus && !syllabusComplete;
            const isCore = tool.isCore && !syllabusComplete;
            
            return `
                <div class="tool-card ${isLocked ? 'locked' : ''} ${isCore ? 'highlight' : ''}" onclick="${isLocked ? '' : `window.location.href='${tool.link}'`}">
                    ${isCore ? '<span class="badge-highlight">Start Here</span>' : ''}
                    <div class="tool-icon">
                        <i class="fas ${tool.icon}"></i>
                    </div>
                    <h3>${tool.name}</h3>
                    <p>${tool.description}</p>
                    ${isLocked ? '<span class="tool-status">🔒 Complete syllabus setup first</span>' : '<span class="tool-status">✓ Available now</span>'}
                    <button class="btn ${isCore ? 'btn-primary' : 'btn-secondary'}" ${isLocked ? 'disabled' : ''}>
                        ${isCore ? 'Set Up My Syllabus' : (syllabusComplete && tool.isCore ? 'View My Plan' : 'Open')}
                    </button>
                </div>
            `;
        }).join('');
        
        // Add Clear History button if syllabus is complete
        if (syllabusComplete) {
            toolCardsHTML += `
                <div class="tool-card clear-history-card" onclick="GetStartedManager.clearSyllabusHistory()">
                    <div class="tool-icon" style="background: #fee2e2; color: #ef4444;">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                    <h3>Clear Syllabus History</h3>
                    <p>Reset your syllabus and start fresh</p>
                    <span class="tool-status" style="color: #ef4444;">⚠️ This will delete all data</span>
                    <button class="btn btn-danger">
                        Clear History
                    </button>
                </div>
            `;
        }
        
        container.innerHTML = toolCardsHTML;
    },
    
    clearSyllabusHistory() {
        if (confirm('⚠️ WARNING: This will permanently delete your entire syllabus, study plan, tasks, and reset all onboarding progress. This cannot be undone. Are you sure?')) {
            if (confirm('⚠️ FINAL CONFIRMATION: All your progress will be lost. Continue?')) {
                const userId = UserManager.getCurrentUserId();
                UserManager.resetUserOnboarding(userId);
                alert('✓ All data cleared successfully! Returning to fresh start...');
                window.location.reload();
            }
        }
    },
    
    // Handle step actions
    handleStepAction(action, stepId) {
        if (!UserManager.isUserLoggedIn()) {
            alert('⚠️ Please login to continue');
            window.location.href = 'login.html';
            return;
        }
        
        switch(action) {
            case 'setupSyllabus':
                window.location.href = 'get-started/syllabus-scheduler.html';
                break;
            case 'generateSchedule':
                UserManager.completeStep(stepId);
                this.renderSteps();
                alert('Schedule generated! (Feature coming soon)');
                break;
            case 'uploadMaterials':
                window.location.href = 'materials.html';
                break;
            case 'goToDashboard':
                UserManager.completeStep(stepId);
                UserManager.completeOnboarding();
                window.location.href = 'index-dashboard.html';
                break;
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Add any additional event listeners here
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    GetStartedManager.init();
});

// Export for global access
window.GetStartedManager = GetStartedManager;
