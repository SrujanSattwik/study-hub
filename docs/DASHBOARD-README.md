# StudyClub Dashboard Shell - Milestone 1

## Overview
This branch (`feat/dashboard-shell`) introduces a modern dashboard interface with sidebar navigation and topbar, while maintaining all existing functionality.

## What's New

### 1. Modular CSS Architecture (`/src/css/`)
- **variables.css** - Design tokens (colors, spacing, typography, transitions)
- **layout.css** - Sidebar, topbar, and main content layout
- **components.css** - Reusable UI components (cards, tables, badges, modals, toasts)
- **dashboard.css** - Main entry point that imports all modules

### 2. Layout Components

#### Sidebar
- Fixed left sidebar (260px width, collapses to 70px)
- Logo header with brand identity
- Organized navigation sections (Main, Tools, Account)
- Active route highlighting
- Mobile-responsive with overlay

#### Topbar
- Fixed top bar (64px height)
- Sidebar toggle button
- Global search bar (400px)
- Notification bell with badge indicator
- Settings icon
- User profile dropdown trigger

#### Main Content Area
- Responsive content container (max-width: 1400px)
- Automatic margin adjustments based on sidebar state
- Full-height layout with proper spacing

### 3. Reusable Components

#### Cards
```html
<div class="card">
  <div class="card-header">
    <h2 class="card-title">Title</h2>
  </div>
  <div class="card-body">Content</div>
</div>
```

#### KPI/Stat Cards
```html
<div class="stat-card">
  <div class="stat-card-header">
    <div class="stat-card-icon primary">
      <i class="fas fa-icon"></i>
    </div>
  </div>
  <div class="stat-card-value">24</div>
  <div class="stat-card-label">Label</div>
  <div class="stat-card-trend up">
    <i class="fas fa-arrow-up"></i>
    <span>12% increase</span>
  </div>
</div>
```

#### Badges
```html
<span class="badge primary">Primary</span>
<span class="badge success">Success</span>
<span class="badge warning">Warning</span>
```

#### Tables
```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr><th>Column</th></tr>
    </thead>
    <tbody>
      <tr><td>Data</td></tr>
    </tbody>
  </table>
</div>
```

#### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
```

#### Modals
```html
<div class="modal-overlay" id="modalId">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Title</h2>
      <button class="modal-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">Content</div>
    <div class="modal-footer">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

### 4. JavaScript Features (`/src/js/layout.js`)

#### DashboardLayout Class
- Sidebar toggle (desktop: collapse, mobile: overlay)
- Active route detection and highlighting
- Responsive behavior handling
- LocalStorage persistence for sidebar state

#### ToastManager Class
```javascript
// Usage
window.toast.success('Operation successful!');
window.toast.error('Something went wrong');
window.toast.warning('Please review this');
window.toast.info('New update available');
```

#### ModalManager Class
```javascript
// Usage
ModalManager.open('modalId');
ModalManager.close('modalId');
```

## Design System

### Brand Colors
- Primary: `#6366f1` (Indigo)
- Secondary: `#ec4899` (Pink)
- Accent: `#14b8a6` (Teal)
- Gray Scale: 50-900

### Typography
- Headings: Poppins (300-800)
- Body: Inter (300-700)

### Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Transitions
- Fast: 70ms (UI interactions)
- Base: 150ms (standard animations)
- Slow: 300ms (complex transitions)

## File Structure
```
study hub/
├── src/
│   ├── css/
│   │   ├── variables.css      # Design tokens
│   │   ├── layout.css         # Sidebar + topbar
│   │   ├── components.css     # Reusable components
│   │   └── dashboard.css      # Main entry point
│   └── js/
│       └── layout.js          # Layout behaviors
├── index-dashboard.html       # Dashboard version of homepage
├── index.html                 # Original homepage (unchanged)
└── DASHBOARD-README.md        # This file
```

## Usage

### Converting a Page to Dashboard Layout

1. **Update HTML structure:**
```html
<body>
  <div class="dashboard-layout">
    <!-- Include sidebar -->
    <aside class="sidebar">...</aside>
    
    <!-- Include topbar -->
    <header class="topbar">...</header>
    
    <!-- Wrap content -->
    <main class="main-content">
      <div class="content-container">
        <!-- Your page content -->
      </div>
    </main>
  </div>
  
  <!-- Mobile overlay -->
  <div class="sidebar-overlay"></div>
</body>
```

2. **Update CSS imports:**
```html
<link rel="stylesheet" href="src/css/dashboard.css">
```

3. **Add JavaScript:**
```html
<script src="src/js/layout.js"></script>
```

### Grid System
```html
<!-- 4 columns (responsive) -->
<div class="grid grid-cols-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>

<!-- Span multiple columns -->
<div class="grid grid-cols-3">
  <div style="grid-column: span 2;">Wide column</div>
  <div>Normal column</div>
</div>
```

## Responsive Breakpoints
- Desktop: > 768px (sidebar visible, collapsible)
- Mobile: ≤ 768px (sidebar hidden, overlay toggle)

## Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

## Performance
- CSS: ~15KB (minified)
- JS: ~3KB (minified)
- Fast transitions: 70-150ms
- Hardware-accelerated transforms

## Accessibility
- Semantic HTML5 elements
- ARIA labels where needed
- Keyboard navigation support
- Focus visible states
- Color contrast WCAG AA compliant

## Next Steps (Milestone 2)
- Convert materials.html to dashboard style with filterable table
- Redesign KnowNook.html with chat layout
- Update syllabus-scheduler.html with progress bars and task list
- Add component catalog page

## Testing Checklist
- [ ] Sidebar toggle works on desktop
- [ ] Sidebar overlay works on mobile
- [ ] Active route highlighting
- [ ] Toast notifications display correctly
- [ ] Modal open/close functionality
- [ ] Responsive layout at all breakpoints
- [ ] No console errors
- [ ] LocalStorage persistence

## Notes
- All existing pages remain functional
- No breaking changes to current codebase
- Dashboard shell is opt-in (use index-dashboard.html)
- Original styles preserved in style.css
