# StudyHub Backend - Unified Server

## Quick Start

All backend services now run from a single server!

### Installation

```bash
cd backend
npm install
```

### Start Server

```bash
npm start
```

This single command starts ALL backend services:
- ✅ Authentication API (port 3001)
- ✅ Materials API (port 3001)
- ✅ Gemini AI Chat API (port 3001)

### Available Endpoints

**Authentication:**
- POST `/auth/send-otp` - Send OTP to email
- POST `/auth/verify-otp-signup` - Verify OTP and create account

**Materials:**
- GET `/api/materials` - Get all materials (with pagination)
- POST `/api/materials` - Upload new material
- POST `/api/materials/:id/download` - Increment download count

**AI Chat:**
- POST `/api/ask` - Ask Gemini AI a question

**Static Files:**
- GET `/uploads/*` - Access uploaded files

### Environment Variables

Make sure `.env` file exists in backend folder with:
```
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
PORT=3001
```

### File Structure

```
backend/
├── server.js           # Main unified server
├── package.json        # All dependencies
├── .env               # Environment variables
├── db/
│   └── oracle.js      # Database connection
├── routes/
│   └── materials.js   # Materials routes
└── uploads/           # Uploaded files
    ├── audio/
    ├── notes/
    ├── textbooks/
    └── videos/
```

### Changes Made

1. Merged `auth-server.js` and `know_nook_backend/server.js` into single `server.js`
2. Moved `routes/materials.js` to `backend/routes/`
3. Moved `uploads/` folder to `backend/uploads/`
4. Updated all import paths
5. Consolidated all dependencies in one `package.json`
6. Single `npm start` command runs everything

### Old Files (Can be deleted)

- `auth-server.js` (replaced by `server.js`)
- `know_nook_backend/` folder (functionality moved to root)
- `package-auth.json`
- `start-auth.bat`
