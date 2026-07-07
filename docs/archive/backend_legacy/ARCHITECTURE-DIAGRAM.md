# Backend Architecture Transformation

## BEFORE (Multiple Servers)

```
┌─────────────────────────────────────────────────────────┐
│  Terminal 1                                             │
│  cd backend                                             │
│  node auth-server.js                                    │
│  → Port 3001 (Auth only)                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Terminal 2                                             │
│  cd backend/know_nook_backend                           │
│  node server.js                                         │
│  → Port 5500 (Materials + AI)                           │
└─────────────────────────────────────────────────────────┘

Problems:
❌ Two terminals needed
❌ Two servers to manage
❌ Different ports
❌ Scattered files
❌ Duplicate dependencies
```

## AFTER (Unified Server)

```
┌─────────────────────────────────────────────────────────┐
│  Terminal 1                                             │
│  cd backend                                             │
│  npm start                                              │
│  → Port 3001 (Everything!)                              │
│     ✅ Authentication                                    │
│     ✅ Materials Management                             │
│     ✅ Gemini AI Chat                                   │
│     ✅ File Uploads                                     │
└─────────────────────────────────────────────────────────┘

Benefits:
✅ Single command
✅ One server
✅ One port
✅ Organized structure
✅ Consolidated dependencies
```

## File Organization

### BEFORE:
```
backend/
├── auth-server.js              (Port 3001)
├── package.json                (Auth deps)
├── db/oracle.js
└── know_nook_backend/
    ├── server.js               (Port 5500)
    ├── package.json            (Materials deps)
    ├── oracle.js               (Duplicate!)
    ├── routes/materials.js
    └── uploads/
```

### AFTER:
```
backend/
├── server.js                   (Port 3001 - Everything!)
├── package.json                (All deps merged)
├── db/oracle.js                (Single source)
├── routes/
│   └── materials.js            (Moved up)
└── uploads/                    (Moved up)
    ├── audio/
    ├── notes/
    ├── textbooks/
    └── videos/
```

## API Endpoints - No Changes!

All endpoints work exactly the same:

```
Frontend → http://localhost:3001/auth/send-otp
Frontend → http://localhost:3001/auth/verify-otp-signup
Frontend → http://localhost:3001/api/materials
Frontend → http://localhost:3001/api/ask
Frontend → http://localhost:3001/uploads/notes/file.pdf
```

## Code Changes Summary

### 1. server.js (NEW)
- Merged auth-server.js + know_nook_backend/server.js
- All routes in one file
- Single Express app
- Single port listener

### 2. routes/materials.js
- Moved from know_nook_backend/routes/
- Updated import: `require('../db/oracle')`
- Updated uploads path: `../uploads`

### 3. package.json
- Merged all dependencies
- Single start script
- Main entry: server.js

### 4. uploads/
- Moved from know_nook_backend/uploads/
- Existing files copied over
- Same folder structure

## Developer Experience

### Starting Backend:

**Before:**
```bash
# Terminal 1
cd backend
node auth-server.js

# Terminal 2  
cd backend/know_nook_backend
node server.js
```

**After:**
```bash
cd backend
npm start
```

### Development:

**Before:**
- Edit auth-server.js for auth changes
- Edit know_nook_backend/server.js for materials
- Restart both servers
- Check both terminals

**After:**
- Edit server.js for any changes
- Restart one server
- Check one terminal

## Deployment Benefits

**Before:**
- Deploy two separate services
- Configure two ports
- Manage two processes
- Two points of failure

**After:**
- Deploy one service
- Configure one port
- Manage one process
- Single point of control

## Summary

✅ **Simplified**: 2 servers → 1 server
✅ **Unified**: 2 ports → 1 port  
✅ **Organized**: Scattered files → Clean structure
✅ **Efficient**: 2 commands → 1 command
✅ **Compatible**: Frontend works without changes
✅ **Maintainable**: Single codebase to manage
