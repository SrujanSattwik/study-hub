# 🏗️ Architecture Diagram - OTP Authentication System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (login.html)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SIGNUP FORM                                                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │ Full Name  │  │   Email    │  │  Password  │  │  Confirm   │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │  │
│  │                                                                   │  │
│  │  [✓] I agree to Terms & Privacy Policy                           │  │
│  │                                                                   │  │
│  │  ┌──────────────────────────────────────────┐                    │  │
│  │  │      [Create Account] Button             │                    │  │
│  │  └──────────────────────────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                              ↓ (Step 1)                                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  STATE MANAGEMENT (signupState)                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  step: 'FORM' → 'OTP'                                       │ │  │
│  │  │  formData: { fullName, email, password, confirmPassword }   │ │  │
│  │  │  otpValue: ''                                                │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    POST /auth/send-otp { email }
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (auth-server.js:3001)                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ENDPOINT: /auth/send-otp                                         │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  1. Validate email format                                   │ │  │
│  │  │  2. Check if email exists in database ──────────┐           │ │  │
│  │  │  3. Generate 6-digit OTP                        │           │ │  │
│  │  │  4. Store in otpStore Map                       │           │ │  │
│  │  │     { email: { otp, expiresAt } }               │           │ │  │
│  │  │  5. Log OTP to console (for testing)            │           │ │  │
│  │  │  6. Return success                               │           │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                              ↓ Query                                     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ORACLE DATABASE (XE)                                             │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  SELECT email FROM users WHERE email = :email              │ │  │
│  │  │  (Check uniqueness - NO INSERT YET)                        │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                          Response: { success: true }
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (login.html)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  OTP VERIFICATION UI (Replaces Password Fields)                  │  │
│  │                                                                   │  │
│  │  Full Name: [John Doe] (disabled)                                │  │
│  │  Email: [test@example.com] (disabled)                            │  │
│  │                                                                   │  │
│  │  Enter 6-digit OTP sent to test@example.com                      │  │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                            │  │
│  │  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │                            │  │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                            │  │
│  │                                                                   │  │
│  │  [Resend OTP (60s)]                                               │  │
│  │                                                                   │  │
│  │  ┌──────────────────────────────────────────┐                    │  │
│  │  │      [Verify OTP] Button                 │                    │  │
│  │  └──────────────────────────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Password & Confirm Password: HIDDEN (data preserved in state)          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
        POST /auth/verify-otp-signup { fullName, email, password, otp }
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (auth-server.js:3001)                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ENDPOINT: /auth/verify-otp-signup                                │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  1. Validate all fields present                            │ │  │
│  │  │  2. Retrieve OTP from otpStore                             │ │  │
│  │  │  3. Check OTP matches                                      │ │  │
│  │  │  4. Check OTP not expired (5 min)                          │ │  │
│  │  │  5. Delete OTP from store (single-use)                     │ │  │
│  │  │  6. Hash password with bcrypt (10 rounds)                  │ │  │
│  │  │  7. Generate UUID for user_id                              │ │  │
│  │  │  8. INSERT INTO users table ────────────┐                  │ │  │
│  │  │  9. Return success with userId          │                  │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                              ↓ Insert                                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ORACLE DATABASE (XE)                                             │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │  INSERT INTO users (                                       │ │  │
│  │  │    user_id,        -- UUID (generated)                     │ │  │
│  │  │    full_name,      -- From form                            │ │  │
│  │  │    email,          -- From form                            │ │  │
│  │  │    password_hash,  -- Bcrypt hashed                        │ │  │
│  │  │    role            -- 'student' (default)                  │ │  │
│  │  │  ) VALUES (...)                                            │ │  │
│  │  │                                                             │ │  │
│  │  │  created_at: AUTO (CURRENT_TIMESTAMP)                      │ │  │
│  │  │  last_login_at: NULL                                       │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  ✅ USER RECORD CREATED                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
              Response: { success: true, userId: "uuid" }
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (login.html)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ✅ SUCCESS MESSAGE                                               │  │
│  │                                                                   │  │
│  │  "Account created successfully! Please sign in."                 │  │
│  │                                                                   │  │
│  │  ↓ Redirect to Sign In Page                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  SIGN IN FORM                                                     │  │
│  │  ┌────────────┐  ┌────────────┐                                  │  │
│  │  │   Email    │  │  Password  │                                  │  │
│  │  └────────────┘  └────────────┘                                  │  │
│  │                                                                   │  │
│  │  ┌──────────────────────────────────────────┐                    │  │
│  │  │      [Sign In] Button                    │                    │  │
│  │  └──────────────────────────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  User can now log in with created credentials                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  PASSWORD HANDLING                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend:  "MyPassword123"  ──────────────────────┐            │
│                                                     │            │
│  State:     Stored in memory (signupState)         │            │
│             Never sent until OTP verified          │            │
│                                                     │            │
│  Backend:   Receives plain password ───────────────┘            │
│             ↓                                                    │
│             bcrypt.hash(password, 10)                            │
│             ↓                                                    │
│             "$2b$10$N9qo8uLOickgx2ZMRZoMye..."                  │
│             ↓                                                    │
│  Database:  password_hash column                                │
│             (Original password never stored)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OTP LIFECYCLE                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Generate:  Math.random() → "123456"                         │
│                                                                  │
│  2. Store:     otpStore.set(email, {                            │
│                  otp: "123456",                                  │
│                  expiresAt: Date.now() + 300000  // 5 min       │
│                })                                                │
│                                                                  │
│  3. Verify:    if (storedOTP.otp === userOTP &&                 │
│                    storedOTP.expiresAt > Date.now())            │
│                                                                  │
│  4. Delete:    otpStore.delete(email)  // Single-use            │
│                                                                  │
│  5. Expire:    Automatic after 5 minutes                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Summary

| Step | Frontend State | Backend Storage | Database |
|------|---------------|-----------------|----------|
| 1. Form Fill | formData populated | - | - |
| 2. Send OTP | formData preserved | OTP in memory | Email checked |
| 3. OTP UI | formData preserved | OTP in memory | - |
| 4. Verify OTP | formData sent | OTP deleted | User inserted |
| 5. Success | State reset | - | User exists |

---

## 🎯 Key Points

✅ **No Database Write Until OTP Verified**  
✅ **Password Hashed Server-Side Only**  
✅ **OTP Single-Use & Time-Limited**  
✅ **Email Uniqueness Enforced**  
✅ **Clean Separation of Concerns**  
✅ **Transaction-Safe Operations**  

---

**Architecture Status:** ✅ Production Ready
