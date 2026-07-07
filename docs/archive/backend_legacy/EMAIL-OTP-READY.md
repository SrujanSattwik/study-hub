# 🚀 Quick Start - Email OTP System

## Install Dependencies
```bash
cd backend
npm install
```

## Start Server
```bash
node auth-server.js
```

## Test Flow
1. Open `frontend/pages/login.html`
2. Click "Sign up"
3. Fill form with **your real email**
4. Click "Create Account"
5. **Check your email inbox** for OTP
6. Enter OTP and verify

## Email Configuration
✅ Already configured in `.env`:
- Email: studyhub.sevices@gmail.com
- App Password: Set

## What Changed
- OTP now sent via **real email** (Gmail)
- Professional HTML email template
- No more console logging OTP

## Troubleshooting
**Email not received?**
- Check spam folder
- Verify email address is correct
- Wait 30 seconds and try "Resend OTP"

**Status:** ✅ Production Ready with Email
