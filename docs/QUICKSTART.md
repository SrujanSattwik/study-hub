# Quick Start Guide - Dashboard Shell

## 🚀 Getting Started

### View the Dashboard

1. **Open the dashboard homepage**:
   ```
   File: index-dashboard.html
   ```
   - Double-click to open in browser
   - Or right-click → Open with → Your browser

2. **Explore the component catalog**:
   ```
   File: components-catalog.html
   ```
   - See all available UI components
   - Test interactive features (toasts, modals)

### Test Features

#### Sidebar Toggle
- **Desktop**: Click hamburger icon to collapse/expand
- **Mobile**: Click hamburger to show overlay sidebar
- State persists in LocalStorage

#### Toast Notifications
Open `components-catalog.html` and click:
- "Success Toast" - Green notification
- "Error Toast" - Red notification
- "Warning Toast" - Orange notification
- "Info Toast" - Blue notification

#### Modal Dialog
- Click "Open Modal" button
- Close by clicking X, Cancel, or outside modal
- Confirm button shows success toast

#### Active Navigation
- Current page is highlighted in sidebar
- Automatic detection based on URL

## 📂 File Structure

```
study hub/
├── index-dashboard.html          ← Dashboard homepage (START HERE)
├── components-catalog.html       ← Component showcase
├── index.html                    ← Original homepage (unchanged)
├── src/
│   ├── css/
│   │   ├── dashboard.css         ← Import this in your pages
│   │   ├── variables.css         ← Design tokens
│   │   ├── layout.css            ← Sidebar/topbar
│   │   └── components.css        ← UI components
│   └── js/
│       └── layout.js             ← Dashboard behaviors
├── DASHBOARD-README.md           ← Full documentation
├── MILESTONE-1-PREVIEW.md        ← Feature summary
└── QUICKSTART.md                 ← This file
```

## 🎨 Using Components

### Add a Stat Card
```html
<div class="stat-card">
  <div class="stat-card-header">
    <div class="stat-card-icon primary">
      <i class="fas fa-users"></i>
    </div>
  </div>
  <div class="stat-card-value">1,234</div>
  <div class="stat-card-label">Total Users</div>
  <div class="stat-card-trend up">
    <i class="fas fa-arrow-up"></i>
    <span>12% increase</span>
  </div>
</div>
```

### Show a Toast
```javascript
window.toast.success('Operation successful!');
window.toast.error('Something went wrong');
window.toast.warning('Please review');
window.toast.info('New update available');
```

### Open a Modal
```javascript
ModalManager.open('myModalId');
ModalManager.close('myModalId');
```

### Create a Grid Layout
```html
<div class="grid grid-cols-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>
```

## 🔧 Customization

### Change Colors
Edit `src/css/variables.css`:
```css
:root {
  --primary: #6366f1;    /* Your primary color */
  --secondary: #ec4899;  /* Your secondary color */
  --accent: #14b8a6;     /* Your accent color */
}
```

### Adjust Sidebar Width
Edit `src/css/variables.css`:
```css
:root {
  --sidebar-width: 260px;           /* Expanded width */
  --sidebar-collapsed-width: 70px;  /* Collapsed width */
}
```

### Modify Transitions
Edit `src/css/variables.css`:
```css
:root {
  --transition-fast: 70ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 📱 Responsive Testing

### Desktop View (> 768px)
- Sidebar visible and collapsible
- Full topbar with search
- Multi-column grids

### Mobile View (≤ 768px)
- Sidebar hidden by default
- Overlay toggle
- Single-column layouts

**Test in browser**:
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select mobile device or resize window

## ✅ Verification Checklist

Open `index-dashboard.html` and verify:

- [ ] Page loads without errors (check console: F12)
- [ ] Sidebar is visible on left
- [ ] Topbar is visible on top
- [ ] 4 KPI cards display correctly
- [ ] Recent activity table shows data
- [ ] Click hamburger icon - sidebar collapses
- [ ] Click again - sidebar expands
- [ ] Resize to mobile - sidebar hides
- [ ] Click hamburger on mobile - overlay appears
- [ ] Click outside overlay - sidebar closes

Open `components-catalog.html` and verify:

- [ ] All component sections load
- [ ] Click "Success Toast" - green notification appears
- [ ] Click "Open Modal" - modal dialog appears
- [ ] Click X or outside modal - modal closes
- [ ] All badges display correctly
- [ ] Table is readable and styled
- [ ] Color palette shows 4 colors

## 🐛 Troubleshooting

### Styles not loading
- Check file paths in `<link>` tags
- Ensure `src/css/dashboard.css` exists
- Clear browser cache (Ctrl+Shift+R)

### JavaScript not working
- Check browser console for errors (F12)
- Ensure `src/js/layout.js` is loaded
- Verify script tag is before `</body>`

### Sidebar not toggling
- Check if `.sidebar-toggle` button exists
- Verify `layout.js` is loaded
- Check console for JavaScript errors

### Mobile overlay not working
- Ensure `.sidebar-overlay` div exists
- Check viewport width (must be ≤ 768px)
- Verify responsive CSS is loaded

## 📚 Next Steps

1. **Read full documentation**: `DASHBOARD-README.md`
2. **View feature summary**: `MILESTONE-1-PREVIEW.md`
3. **Explore components**: Open `components-catalog.html`
4. **Start building**: Copy structure from `index-dashboard.html`

## 💬 Support

For issues or questions:
1. Check `DASHBOARD-README.md` for detailed docs
2. Review `components-catalog.html` for examples
3. Inspect browser console for errors (F12)

## 🎉 You're Ready!

The dashboard shell is fully functional. Start by opening `index-dashboard.html` in your browser and exploring the interface.

**Happy building! 🚀**
