# 🔐 OTP Authentication System - Setup Guide

## ✅ Implementation Complete

The signup flow now integrates with Oracle database with OTP verification.

---

## 📋 Prerequisites

1. **Oracle Database** running with `users` table
2. **Node.js** installed (v14+)
3. **Oracle Instant Client** configured

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install express cors bcrypt uuid
```

### 2. Start Authentication Server

```bash
node auth-server.js
```

Server will run on `http://localhost:3001`

### 3. Open Frontend

Open `frontend/pages/login.html` in browser

---

## 🔄 Complete Flow

### **Step 1: User Fills Signup Form**
- Full Name
- Email
- Password
- Confirm Password
- Accept Terms

### **Step 2: Click "Create Account"**
- Frontend validates all fields
- Calls `POST /auth/send-otp`
- Backend checks if email exists
- Generates 6-digit OTP
- Stores OTP in memory (5 min expiry)
- **Console logs OTP** (for testing)

### **Step 3: OTP UI Appears**
- Password fields hidden (data preserved)
- 6 OTP input boxes shown
- 60-second resend timer starts

### **Step 4: User Enters OTP**
- Click "Verify OTP"
- Calls `POST /auth/verify-otp-signup`
- Backend verifies OTP
- Hashes password with bcrypt
- Generates UUID for user_id
- **Inserts into Oracle `users` table**

### **Step 5: Success**
- User redirected to Sign In
- Account ready to use

---

## 🔌 API Endpoints

### 1. Send OTP
```http
POST http://localhost:3001/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Errors:**
- `400` - Invalid email
- `409` - Email already registered
- `500` - Server error

---

### 2. Verify OTP & Create Account
```http
POST http://localhost:3001/auth/verify-otp-signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "user@example.com",
  "password": "SecurePass123",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "userId": "uuid-here"
}
```

**Errors:**
- `400` - Missing fields / Invalid OTP / OTP expired
- `409` - Email already exists
- `500` - Server error

---

## 🧪 Testing

### Manual Test Flow

1. **Start Backend:**
   ```bash
   cd backend
   node auth-server.js
   ```

2. **Open Frontend:**
   - Navigate to `frontend/pages/login.html`
   - Click "Sign up"

3. **Fill Form:**
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
   - Confirm: Test123!
   - Check terms box

4. **Click "Create Account"**
   - Check console for OTP (e.g., `OTP for test@example.com: 123456`)

5. **Enter OTP:**
   - Type the 6-digit code
   - Click "Verify OTP"

6. **Verify Database:**
   ```sql
   SELECT * FROM users WHERE email = 'test@example.com';
   ```

---

## 🔒 Security Features

✅ **Password Hashing** - bcrypt with salt rounds  
✅ **OTP Expiry** - 5 minutes  
✅ **Single-use OTP** - Deleted after verification  
✅ **Email Uniqueness** - Checked before OTP send  
✅ **No Plain Passwords** - Never stored or logged  
✅ **UUID User IDs** - Secure, non-sequential  
✅ **Transaction Safety** - Atomic database inserts  

---

## 📊 Database Schema (Already Exists)

```sql
TABLE users (
  user_id        VARCHAR2(36) PRIMARY KEY,
  full_name      VARCHAR2(100),
  email          VARCHAR2(150) UNIQUE NOT NULL,
  password_hash  VARCHAR2(255) NOT NULL,
  role           VARCHAR2(20) DEFAULT 'student',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP
);
```

---

## 🐛 Troubleshooting

### Issue: "Failed to send OTP"
- Check backend is running on port 3001
- Verify Oracle connection in `backend/db/oracle.js`
- Check console for errors

### Issue: "Email already registered"
- Email exists in database
- Use different email or delete existing record:
  ```sql
  DELETE FROM users WHERE email = 'test@example.com';
  ```

### Issue: "OTP expired"
- OTP valid for 5 minutes only
- Click "Resend OTP" to get new code

### Issue: CORS errors
- Ensure backend has `cors` middleware enabled
- Check browser console for specific error

---

## 🔄 Production Considerations

### Current (Development):
- OTP logged to console
- In-memory OTP storage
- 5-minute expiry

### For Production:
1. **Email Service Integration**
   - Replace console.log with actual email (SendGrid, AWS SES, etc.)
   
2. **Redis for OTP Storage**
   - Replace Map with Redis for distributed systems
   
3. **Environment Variables**
   - Move DB credentials to `.env`
   
4. **Rate Limiting**
   - Prevent OTP spam (max 3 requests per email per hour)
   
5. **HTTPS**
   - Use SSL certificates in production

---

## 📝 File Structure

```
backend/
├── auth-server.js          # Main authentication server
├── db/
│   └── oracle.js           # Oracle connection
└── package-auth.json       # Dependencies

frontend/
└── pages/
    └── login.html          # Signup/Login UI with OTP
```

---

## ✅ Verification Checklist

- [ ] Backend server starts without errors
- [ ] Frontend loads signup form
- [ ] Form validation works
- [ ] OTP appears in console after "Create Account"
- [ ] OTP UI replaces password fields
- [ ] Resend timer counts down
- [ ] Valid OTP creates user in database
- [ ] Invalid OTP shows error message
- [ ] User can sign in after successful signup
- [ ] Duplicate email is rejected

---

## 🎯 Key Features Implemented

✅ Inline OTP verification (no page navigation)  
✅ Password persistence in memory during OTP flow  
✅ Secure password hashing (bcrypt)  
✅ Oracle database integration  
✅ Email uniqueness validation  
✅ OTP expiry and resend functionality  
✅ Clean error handling  
✅ Zero UI changes (design preserved)  
✅ Production-ready architecture  

---

## 📞 Support

For issues or questions:
1. Check console logs (browser + backend)
2. Verify database connection
3. Test API endpoints with Postman/curl
4. Review error messages in UI

---

**Status:** ✅ Ready for Testing
**Next Step:** Run `node auth-server.js` and test the flow!
