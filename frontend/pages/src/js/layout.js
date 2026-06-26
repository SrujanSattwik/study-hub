// Sidebar hover functionality - FIXED: Auto-hide on page load
const dashboardLayout = document.querySelector('.dashboard-layout');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.querySelector('.sidebar-overlay');
let hideTimer = null;
let isHovering = false;

function showSidebar() {
    if (!dashboardLayout) return;
    clearTimeout(hideTimer);
    hideTimer = null;
    dashboardLayout.classList.remove('sidebar-collapsed');
}

function hideSidebar() {
    if (!dashboardLayout || isHovering) return;
    clearTimeout(hideTimer);
    hideTimer = null;
    dashboardLayout.classList.add('sidebar-collapsed');
}

function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideSidebar, 4000);
}

// Auto-hide on page load
if (dashboardLayout) {
    scheduleHide();
}

// Toggle sidebar manually
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        const isCollapsed = dashboardLayout.classList.contains('sidebar-collapsed');
        if (isCollapsed) {
            showSidebar();
            scheduleHide();
        } else {
            hideSidebar();
        }
    });
}

// Show/hide on hover
if (sidebar) {
    sidebar.addEventListener('mouseenter', () => {
        isHovering = true;
        showSidebar();
    });
    
    sidebar.addEventListener('mouseleave', () => {
        isHovering = false;
        scheduleHide();
    });
}

// Click overlay to close
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        isHovering = false;
        hideSidebar();
    });
}

// Clear timer on page unload
window.addEventListener('beforeunload', () => {
    clearTimeout(hideTimer);
});
