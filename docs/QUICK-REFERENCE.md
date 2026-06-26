# 🎯 Quick Reference - OTP Authentication

## 🚀 Start Server (Windows)
```bash
cd backend
start-auth.bat
```

## 🚀 Start Server (Manual)
```bash
cd backend
node auth-server.js
```

## 🧪 Test Database
```bash
cd backend
node test-auth-db.js
```

## 📍 Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/send-otp` | Send OTP to email |
| POST | `/auth/verify-otp-signup` | Verify OTP & create user |

## 🔑 Test Credentials

**For Testing (Console OTP):**
- Email: `test@example.com`
- Password: `Test123!`
- OTP: Check console output

## 📊 Database Query

**View all users:**
```sql
SELECT user_id, full_name, email, role, created_at 
FROM users 
ORDER BY created_at DESC;
```

**Delete test user:**
```sql
DELETE FROM users WHERE email = 'test@example.com';
COMMIT;
```

## 🔄 Flow Summary

1. User fills signup form
2. Click "Create Account" → OTP sent
3. Check backend console for OTP
4. Enter OTP in UI
5. Click "Verify OTP" → User created
6. Redirect to Sign In

## ⚡ Key Features

- ✅ No database insert until OTP verified
- ✅ Password hashed with bcrypt
- ✅ OTP expires in 5 minutes
- ✅ Email uniqueness enforced
- ✅ UUID for user_id
- ✅ Zero UI changes

## 🐛 Quick Fixes

**Port already in use:**
```bash
# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**CORS error:**
- Ensure backend is running
- Check API_BASE in login.html

**OTP not working:**
- Check console for OTP
- Verify 5-minute expiry hasn't passed
- Try "Resend OTP"

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "bcrypt": "^5.1.1",
  "uuid": "^9.0.1",
  "oracledb": "^6.10.0"
}
```

## 🎨 Frontend URL

```
file:///C:/Users/Hp/OneDrive/Desktop/code/working/study%20hub/frontend/pages/login.html
```

---

**Status:** ✅ Production Ready  
**Last Updated:** 2024
