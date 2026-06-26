// Dashboard Layout Initialization
class DashboardLayout {
  constructor() {
    this.sidebar = document.querySelector('.sidebar');
    this.sidebarToggle = document.querySelector('.sidebar-toggle');
    this.sidebarOverlay = document.querySelector('.sidebar-overlay');
    this.navItems = document.querySelectorAll('.nav-item');
    
    this.init();
  }

  init() {
    // Sidebar toggle
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Mobile overlay
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());
    }

    // Set active nav item based on current page
    this.setActiveNavItem();

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  toggleSidebar() {
    if (window.innerWidth <= 768) {
      // Mobile: toggle overlay sidebar
      this.sidebar?.classList.toggle('mobile-open');
      this.sidebarOverlay?.classList.toggle('active');
    } else {
      // Desktop: toggle collapsed state
      this.sidebar?.classList.toggle('collapsed');
      localStorage.setItem('sidebarCollapsed', this.sidebar?.classList.contains('collapsed'));
    }
  }

  closeMobileSidebar() {
    this.sidebar?.classList.remove('mobile-open');
    this.sidebarOverlay?.classList.remove('active');
  }

  setActiveNavItem() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';

    this.navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && (href === currentPage || href.includes(currentPage))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  handleResize() {
    if (window.innerWidth > 768) {
      this.closeMobileSidebar();
      // Restore collapsed state from localStorage
      const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      if (isCollapsed) {
        this.sidebar?.classList.add('collapsed');
      }
    }
  }
}

// Toast Notification System
class ToastManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    toast.innerHTML = `
      <i class="fas ${icons[type]} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }
}

// Modal Manager
class ModalManager {
  static open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  static close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize layout
  window.dashboardLayout = new DashboardLayout();
  
  // Initialize toast manager
  window.toast = new ToastManager();

  // Modal close handlers
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
});

// Export for use in other scripts
window.ModalManager = ModalManager;
