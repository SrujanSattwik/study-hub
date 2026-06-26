// Global Sidebar State Manager (shared with dashboard)
window.SidebarManager = window.SidebarManager || {
    STORAGE_KEY: 'studyclub_sidebar_state',
    
    getState() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return saved === 'collapsed' ? false : true;
    },
    
    setState(isOpen) {
        localStorage.setItem(this.STORAGE_KEY, isOpen ? 'open' : 'collapsed');
    },
    
    toggle() {
        const currentState = this.getState();
        this.setState(!currentState);
        return !currentState;
    }
};

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Study Group Modal Functions
function openCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    modal.style.display = 'flex';
    // Trigger reflow to enable animation
    modal.offsetHeight;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300); // Match the transition duration
}

// Close modal when clicking outside
const createGroupModal = document.getElementById('createGroupModal');
if (createGroupModal) {
    createGroupModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeCreateGroupModal();
        }
    });
}

// Study Group Search Function
const groupSearchInput = document.getElementById('group-search');
if (groupSearchInput) {
    groupSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const groupCards = document.querySelectorAll('.group-card');

        groupCards.forEach(card => {
            const groupName = card.querySelector('h3');
            const groupDesc = card.querySelector('p');
            
            if (groupName && groupDesc) {
                const nameText = groupName.textContent.toLowerCase();
                const descText = groupDesc.textContent.toLowerCase();
                
                if (nameText.includes(searchTerm) || descText.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s ease';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
}

// Live Preview Updates
function updatePreview() {
    const nameInput = document.getElementById('groupName');
    const descInput = document.getElementById('groupDescription');
    const scheduleInput = document.getElementById('groupSchedule');
    const categorySelect = document.getElementById('groupCategory');

    // Update preview elements with smooth transitions
    const previewName = document.getElementById('previewName');
    const previewDesc = document.getElementById('previewDescription');
    const previewSchedule = document.getElementById('previewSchedule');

    // Name preview
    previewName.textContent = nameInput.value || 'Your Group Name';
    previewName.style.animation = 'fadeIn 0.3s ease';

    // Description preview
    previewDesc.textContent = descInput.value || 'Your group description will appear here...';
    previewDesc.style.animation = 'fadeIn 0.3s ease';

    // Schedule preview
    const scheduleText = scheduleInput.value
        ? `<i class="fas fa-clock"></i> ${scheduleInput.value}`
        : '<i class="fas fa-clock"></i> Not scheduled';
    previewSchedule.innerHTML = scheduleText;
    previewSchedule.style.animation = 'fadeIn 0.3s ease';

    // Update icon based on category
    const groupIcon = document.querySelector('.preview-card .group-icon i');
    const iconMap = {
        'mathematics': 'fa-calculator',
        'science': 'fa-flask',
        'programming': 'fa-code',
        'languages': 'fa-language',
        'other': 'fa-users'
    };
    groupIcon.className = `fas ${iconMap[categorySelect.value] || 'fa-users'}`;
}

// Add input event listeners for live preview
const groupNameInput = document.getElementById('groupName');
const groupDescInput = document.getElementById('groupDescription');
const groupScheduleInput = document.getElementById('groupSchedule');
const groupCategorySelect = document.getElementById('groupCategory');

if (groupNameInput) groupNameInput.addEventListener('input', updatePreview);
if (groupDescInput) groupDescInput.addEventListener('input', updatePreview);
if (groupScheduleInput) groupScheduleInput.addEventListener('input', updatePreview);
if (groupCategorySelect) groupCategorySelect.addEventListener('change', updatePreview);

// Handle form submission
const createGroupForm = document.querySelector('.create-group-form');
if (createGroupForm) {
    createGroupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Add your form submission logic here
        
        // Example: Show success message and close modal
        alert('Group created successfully!');
        closeCreateGroupModal();
    });
}

// Add fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Animated counter for statistics




// Intersection Observer for stats animation
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                animateCounter(stat, target);
            });
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe stats section
const statsSection = document.querySelector('.stats');
if (statsSection) {
    observer.observe(statsSection);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});





// Add hover effects to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Make feature cards clickable on Get Started page
document.querySelectorAll('.feature-card.clickable').forEach(card => {
    card.addEventListener('click', function() {
        const featureName = this.querySelector('h3').textContent;
        const status = this.querySelector('.feature-status').textContent;
        
        // Add click animation
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 100);
        
        // Handle different features
        if (status === 'Available') {
            alert(`🚀 ${featureName} is now available!\n\nThis feature is ready to use. Click OK to proceed to the feature.`);
        } else {
            alert(`⏳ ${featureName} is coming soon!\n\nThis feature is currently in development and will be available soon. We'll notify you when it's ready!`);
        }
    });
});

// Make hero floating cards clickable
document.querySelectorAll('.floating-card').forEach(card => {
    card.style.cursor = 'pointer';
    
    // Add hover effects for floating cards
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.05)';
        this.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    });
});

// Smooth Get Started button navigation
document.addEventListener('DOMContentLoaded', function() {
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            this.style.transition = 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            // Wait for animation to complete, then navigate
            setTimeout(() => {
                this.style.transform = 'scale(1)';
                setTimeout(() => {
                    window.location.href = 'get-started.html';
                }, 150); // Wait for scale back animation
            }, 150); // Wait for scale down animation
        });
    }
});

// Button click animations
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);









// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close mobile menu if open
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Add focus styles for accessibility
document.querySelectorAll('a, button').forEach(element => {
    element.addEventListener('focus', function() {
        this.style.outline = '2px solid #667eea';
        this.style.outlineOffset = '2px';
    });
    
    element.addEventListener('blur', function() {
        this.style.outline = 'none';
    });
});

// Login Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    const toggleSignupPassword = document.getElementById('toggleSignupPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleSignupPassword) {
        toggleSignupPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('signupPassword');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('confirmPassword');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    // Login/Signup form toggle
    const showSignup = document.getElementById('.showSignup');
    const showLogin = document.getElementById('.showLogin');
    const loginCard = document.querySelector('.login-card');
    const signupCard = document.getElementById('.signupCard');
    
    if (showSignup) {
        showSignup.addEventListener('click', function(e) {
            e.preventDefault();
            loginCard.classList.add('hidden');
            signupCard.classList.add('active');
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            signupCard.classList.remove('active');
            loginCard.classList.remove('hidden');
        });
    }
   

    
    // Form submission handlers
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Add loading state
            const submitBtn = this.querySelector('.login-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            submitBtn.disabled = true;
            
            // Simulate login process
            setTimeout(() => {
                alert(`🎉 Welcome back! You've successfully signed in with ${email}`);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('❌ Passwords do not match! Please try again.');
                return;
            }
            
            // Add loading state
            const submitBtn = this.querySelector('.login-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;
            
            // Simulate signup process
            setTimeout(() => {
                alert(`🎉 Welcome to StudyClub, ${fullName}! Your account has been created successfully.`);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
    
    // Social login buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = this.classList.contains('google') ? 'Google' : 'GitHub';
            alert(`🔐 Redirecting to ${provider} for authentication...`);
        });
    });
});





// Hamburger menu toggle
hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    hamburger.classList.toggle("active");
});

  

// Login Modal Functions
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function switchToSignup() {
    alert('Signup feature coming soon! This would switch to a signup form.');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('loginModal');
    if (modal && e.target === modal) {
        closeLoginModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Login functionality will be implemented with backend!');
            closeLoginModal();
        });
    }
});
