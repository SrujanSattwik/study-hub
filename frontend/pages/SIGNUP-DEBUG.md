# 🔧 Signup Debug Guide

## Issue Fixed
✅ Added proper error handling and async/await flow
✅ OTP UI now only shows after successful OTP send
✅ Better error messages for debugging

## Test Steps

### 1. Verify Backend is Running
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001
```
Should show a process using port 3001

### 2. Open Frontend
- Use Live Server on port 5500
- Open browser DevTools (F12)
- Go to Console tab

### 3. Test Signup
1. Click "Sign up"
2. Fill all fields
3. Click "Create Account"
4. **Watch Console for:**
   - Any error messages
   - Network requests to localhost:3001

### 4. Check Network Tab
- Should see: `POST http://localhost:3001/auth/send-otp`
- Status should be: 200 OK
- Response should be: `{"success":true,"message":"OTP sent to your email"}`

## Common Issues

**Nothing happens after clicking Create Account:**
- Check browser console for errors
- Verify backend is running: `node auth-server.js`
- Check if frontend is on port 5500

**CORS Error:**
- Backend must be running
- Frontend must be on localhost:5500
- Restart backend if needed

**Network Error:**
- Alert will say: "Failed to connect to server..."
- Start backend: `cd backend && node auth-server.js`

## What Should Happen

1. Click "Create Account"
2. Brief pause (sending OTP)
3. UI switches to OTP input
4. Check email for OTP code
5. Enter OTP
6. Success message

## Quick Test
Open browser console and run:
```javascript
fetch('http://localhost:3001/auth/send-otp', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'test@test.com'})
}).then(r => r.json()).then(console.log)
```

Should return: `{success: true, message: "OTP sent to your email"}`
