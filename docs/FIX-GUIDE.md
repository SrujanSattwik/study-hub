# 🔧 FIX GUIDE - Material Not Showing Issue

## Problem
You see "Material added successfully!" but the card doesn't appear on the page.

## Solution - Follow These Steps

### STEP 1: Use the Debug Test Page

1. **Make sure server is running:**
   ```bash
   cd "c:\Users\Hp\OneDrive\Desktop\code\working\study hub\backend\know_nook_backend"
   node server.js
   ```

2. **Open the debug test page:**
   - Double-click: `DEBUG-TEST.html` (in the root folder)

3. **Click "Test Connection"**
   - Should say: ✅ SUCCESS! Server is running
   - If not, server isn't running - go back to Step 1

4. **Click "Add Material"**
   - Should say: ✅ SUCCESS! Material added
   - You'll see the JSON data of the added material

5. **Click "Get Materials"**
   - Should show your material in the list
   - If you see it here, the backend is working!

### STEP 2: Check Browser Console

1. Open `materials.html` in your browser
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Try adding a material
5. Look for errors in red

**Common errors:**
- "Failed to fetch" = Server not running
- "CORS error" = Server needs restart
- "Network error" = Wrong API URL

### STEP 3: Check the Terminal

When you add a material, the terminal should show:
```
POST /api/materials - Request received: { title: '...', ... }
Material added successfully: some-uuid
```

If you don't see this, the request isn't reaching the server.

### STEP 4: Verify Data File

Check this file:
```
backend/know_nook_backend/data/materials.json
```

After adding a material, it should contain:
```json
[
  {
    "id": "...",
    "title": "Your Title",
    ...
  }
]
```

If the file is empty `[]`, the data isn't being saved.

### STEP 5: Clear Filters

After adding a material:
1. Make sure **Category** filter is set to "All Categories"
2. Make sure **Difficulty** filter is set to "All Levels"
3. Clear the search box

The new material might be hidden by filters!

### STEP 6: Hard Refresh

1. Press **Ctrl + Shift + R** (hard refresh)
2. Or close and reopen the browser
3. Try adding a material again

## Quick Checklist

- [ ] Server is running (terminal shows "Server running on http://localhost:5500")
- [ ] DEBUG-TEST.html shows "SUCCESS" for all tests
- [ ] Browser console (F12) shows no errors
- [ ] Terminal shows "Material added successfully" when you submit
- [ ] materials.json file contains your data
- [ ] Filters are cleared (All Categories, All Levels)
- [ ] Page is refreshed (Ctrl + Shift + R)

## Still Not Working?

### Test 1: Direct API Test
Open this URL in your browser:
```
http://localhost:5500/api/materials
```

You should see a JSON array with your materials.

### Test 2: Check Port
Make sure nothing else is using port 5500:
```bash
netstat -ano | findstr :5500
```

If something is using it, change the port in:
- `backend/know_nook_backend/server.js` (line: `const PORT = 5500;`)
- `frontend/assets/js/materials.js` (line: `const API_URL = 'http://localhost:5500/api/materials';`)

### Test 3: Restart Everything
1. Stop the server (Ctrl + C in terminal)
2. Close all browser windows
3. Start server again: `node server.js`
4. Open materials.html in a fresh browser window
5. Try adding a material

## Contact Points

If still not working, check:
1. Terminal output - any errors?
2. Browser console (F12) - any errors?
3. materials.json file - is data being saved?
4. DEBUG-TEST.html - which step fails?

Share this information to get help!
