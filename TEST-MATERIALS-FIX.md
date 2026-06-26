# Materials Not Showing - Fix Instructions

## Problem
Materials from database are not displaying on the webpage because:
1. ✅ API URL was pointing to wrong port (FIXED: changed from 5500 to 3001)
2. ✅ CLOB fields not being converted to strings (FIXED: added getData() method)
3. ⚠️ Backend server needs restart to apply changes

## Solution Steps

### Step 1: Restart Backend Server
```bash
# Stop the current server (Press Ctrl+C in the terminal running the server)
# Then start it again:
cd backend
node server.js
```

### Step 2: Verify Server is Running
You should see:
```
✅ StudyHub Backend Server running on port 3001
✅ Auth API: http://localhost:3001/auth/*
✅ Materials API: http://localhost:3001/api/materials
✅ Gemini AI API: http://localhost:3001/api/ask
```

### Step 3: Test API Manually
Open browser and go to:
```
http://localhost:3001/api/materials
```

You should see JSON with your materials data.

### Step 4: Open Materials Page
```
http://127.0.0.1:5500/pages/materials.html
```

### Step 5: Check Browser Console
Press F12 and check Console tab for:
- "Loading materials with filters: {}"
- "Loaded materials: 2" (or your material count)

## What Was Fixed

### File: frontend/assets/js/materials.js
- Changed: `const API_URL = 'http://localhost:3001/api/materials';`
- Was: `const API_URL = 'http://localhost:5500/api/materials';`

### File: backend/routes/materials.js
- Added CLOB handling:
```javascript
const materials = await Promise.all(result.rows.map(async row => {
    let description = '';
    if (row.DESCRIPTION) {
        description = await row.DESCRIPTION.getData();
    }
    return {
        id: row.ID,
        title: row.TITLE,
        description: description,  // Now properly converted from CLOB
        // ... rest of fields
    };
}));
```

## If Still Not Working

1. Check if backend is running on port 3001
2. Check browser console for errors (F12)
3. Verify database has materials:
   ```sql
   SELECT * FROM materials;
   ```
4. Check CORS settings in backend/server.js
5. Clear browser cache (Ctrl+Shift+Delete)

## Quick Test Command
```bash
curl http://localhost:3001/api/materials
```

Should return JSON with materials array.
