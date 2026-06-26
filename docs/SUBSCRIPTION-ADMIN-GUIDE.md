# 🎯 Subscription & Admin System - Complete Guide

## ✅ What Was Implemented

### 1. **Subscription System** (3 Tiers)
- **Free**: 10 AI queries/month, 5 downloads
- **Pro**: 100 AI queries/month, 50 downloads ($9.99/month)
- **Ultimate**: Unlimited AI & downloads ($19.99/month)

### 2. **Authentication System**
- User registration & login
- Admin login (special credentials)
- Session management with localStorage

### 3. **Admin Dashboard**
- User management (view all users, change subscriptions)
- Material approval system (approve/reject pending materials)
- Statistics dashboard
- Only visible to admin after login

### 4. **Material Approval Workflow**
- Users submit materials → Goes to pending
- Admin reviews → Approve or Reject
- Approved materials appear on materials page

---

## 🚀 How to Use

### STEP 1: Start the Backend

```bash
cd "c:\Users\Hp\OneDrive\Desktop\code\working\study hub\backend\know_nook_backend"
node server.js
```

### STEP 2: Register as a User

1. Open `frontend/index.html`
2. Click **"Login"** in navbar
3. Click **"Register"**
4. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Password: yourpassword
5. Click **"Register"**
6. You'll be redirected to subscription page
7. Choose a plan (Free is default)

### STEP 3: Login as Admin

1. Go to login page
2. Use admin credentials:
   - **Email**: `admin@studyclub.com`
   - **Password**: `admin123`
3. Click **"Login"**
4. You'll be redirected to Admin Dashboard

### STEP 4: Test Material Submission

1. Logout from admin (if logged in)
2. Login as regular user
3. Go to Materials page
4. Click **"+"** button
5. Submit a material
6. You'll see: "Material submitted for admin approval"
7. Material goes to pending queue

### STEP 5: Approve Materials (Admin)

1. Login as admin
2. Click **"Admin"** in navbar (only visible to admin)
3. Go to **"Pending Materials"** tab
4. See submitted materials
5. Click **"Approve"** or **"Reject"**
6. Approved materials appear on materials page

### STEP 6: Manage Users (Admin)

1. In Admin Dashboard
2. Go to **"Users"** tab
3. See all registered users
4. Change subscription using dropdown
5. View AI usage and download counts

---

## 📊 Features Breakdown

### For Regular Users:
- ✅ Register/Login
- ✅ Choose subscription plan
- ✅ Submit materials (goes to pending)
- ✅ View approved materials
- ✅ AI usage limits based on plan
- ✅ Download limits based on plan
- ✅ User menu in navbar (shows name, subscription)

### For Admin:
- ✅ Special login credentials
- ✅ Admin link in navbar (only visible after admin login)
- ✅ Dashboard with statistics
- ✅ View all users
- ✅ Change user subscriptions
- ✅ Approve/reject pending materials
- ✅ View AI usage and downloads per user

---

## 🔐 Admin Credentials

**Email**: `admin@studyclub.com`  
**Password**: `admin123`

⚠️ **Important**: Change these in production!

To change admin credentials, edit:
```javascript
// backend/know_nook_backend/routes/auth.js
const ADMIN_EMAIL = 'admin@studyclub.com';
const ADMIN_PASSWORD = 'admin123';
```

---

## 📁 New Files Created

### Backend:
- `routes/auth.js` - Login, register, user management
- `routes/admin.js` - Admin operations
- `routes/subscription.js` - Subscription plans & limits
- `data/users.json` - User database
- `data/pending-materials.json` - Pending materials queue

### Frontend:
- `pages/login.html` - Login/Register page
- `pages/admin.html` - Admin dashboard
- `pages/subscription.html` - Subscription plans page
- `assets/js/auth.js` - Authentication logic

### Updated:
- `server.js` - Added new routes
- `routes/materials.js` - Materials go to pending
- `index.html` - Added auth.js script

---

## 🎨 UI Features

### Navbar Changes:
- **Before Login**: Shows "Login" button
- **After Login**: Shows user name (clickable)
  - Dropdown menu with:
    - User name & email
    - Current subscription badge
    - "Manage Subscription" button
    - "Logout" button
- **Admin Only**: "Admin" link appears in navbar

### Subscription Page:
- 3 pricing cards (Free, Pro, Ultimate)
- Feature comparison
- Current plan highlighted
- Upgrade buttons

### Admin Dashboard:
- Statistics cards (users, subscriptions, materials)
- Tabs: Users | Pending Materials
- User table with subscription management
- Material approval interface

---

## 🔄 Workflow Examples

### Example 1: New User Journey
1. User visits site → Clicks "Login"
2. Clicks "Register" → Fills form
3. Redirected to subscription page
4. Chooses "Free" plan
5. Starts using the platform
6. Submits a material → Goes to pending
7. Admin approves → Material appears

### Example 2: Admin Workflow
1. Admin logs in with special credentials
2. Sees "Admin" link in navbar
3. Opens admin dashboard
4. Checks statistics
5. Reviews pending materials
6. Approves good materials, rejects bad ones
7. Manages user subscriptions if needed

### Example 3: Subscription Upgrade
1. User logs in
2. Clicks their name in navbar
3. Clicks "Manage Subscription"
4. Sees current plan (Free)
5. Clicks "Upgrade to Pro"
6. Confirms upgrade
7. Plan updated, limits increased

---

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/subscription` - Update subscription
- `GET /api/admin/pending-materials` - Get pending materials
- `POST /api/admin/approve-material/:id` - Approve material
- `DELETE /api/admin/reject-material/:id` - Reject material
- `GET /api/admin/stats` - Get statistics

### Subscription
- `GET /api/subscription/plans` - Get all plans
- `POST /api/subscription/check-limit` - Check usage limits

### Materials
- `GET /api/materials` - Get approved materials
- `POST /api/materials` - Submit material (goes to pending)

---

## 📊 Subscription Limits

| Feature | Free | Pro | Ultimate |
|---------|------|-----|----------|
| AI Queries | 10/month | 100/month | Unlimited |
| Downloads | 5/month | 50/month | Unlimited |
| Price | $0 | $9.99/mo | $19.99/mo |

---

## 🔍 Testing Checklist

- [ ] Register new user
- [ ] Login as user
- [ ] See user name in navbar
- [ ] Click name → See dropdown menu
- [ ] Go to subscription page
- [ ] Submit a material
- [ ] Material shows "pending" message
- [ ] Logout
- [ ] Login as admin (admin@studyclub.com / admin123)
- [ ] See "Admin" link in navbar
- [ ] Open admin dashboard
- [ ] See statistics
- [ ] Go to "Pending Materials" tab
- [ ] See submitted material
- [ ] Approve material
- [ ] Go to materials page
- [ ] See approved material
- [ ] Go to "Users" tab
- [ ] See registered users
- [ ] Change a user's subscription
- [ ] Logout from admin

---

## 🎉 Success!

You now have a complete subscription and admin system with:
- ✅ 3-tier subscription plans
- ✅ User authentication
- ✅ Admin dashboard
- ✅ Material approval workflow
- ✅ User management
- ✅ Usage limits enforcement

All materials now require admin approval before appearing on the site!
