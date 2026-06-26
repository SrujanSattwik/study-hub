# Download Counter Troubleshooting Guide

## Quick Test Steps

### 1. Start the Backend Server
```bash
cd "backend/know_nook_backend"
node server.js
```
You should see: `Server running on http://localhost:5500`

### 2. Test the API Directly
Open a new terminal and run:
```bash
# Get all materials
curl http://localhost:5500/api/materials

# Test download endpoint (replace {id} with actual material ID)
curl -X POST http://localhost:5500/api/materials/880b696b-6428-4970-bd40-133877e36f79/download
```

Expected response:
```json
{"downloadCount": 1}
```

### 3. Use the Test Page
1. Open `TEST-DOWNLOAD-COUNTER.html` in your browser
2. Click "Test Download" button on any material
3. Watch the counter increment
4. Check the logs on the page and in browser console (F12)

### 4. Test on Materials Page
1. Open `frontend/pages/materials.html` in browser
2. Open browser console (F12)
3. Click "View Resource" on any material
4. Check console logs for:
   - "Download clicked for material: {id}"
   - "API Response status: 200"
   - "Download count updated: {number}"
   - "Count element found: {element}"
   - "UI updated with count: {number}"

## Common Issues & Solutions

### Issue 1: Counter Not Incrementing
**Symptoms:** Button clicks but number stays the same

**Check:**
1. Open browser console (F12) - look for errors
2. Check if API call is successful (status 200)
3. Verify element ID matches: `download-count-{materialId}`

**Solution:**
- The updated code now has extensive logging
- Check console for exact error message
- Verify backend is running on port 5500

### Issue 2: "Material not found" Error
**Symptoms:** API returns 404

**Check:**
1. Verify material ID in the URL
2. Check `backend/know_nook_backend/data/materials.json`

**Solution:**
- Use correct material ID from the JSON file
- IDs are UUIDs like: `880b696b-6428-4970-bd40-133877e36f79`

### Issue 3: CORS Error
**Symptoms:** "Access-Control-Allow-Origin" error in console

**Check:**
- Backend has `app.use(cors())` in server.js

**Solution:**
- Already configured in server.js
- If still occurs, restart the backend server

### Issue 4: Element Not Found
**Symptoms:** Console shows "Count element not found"

**Check:**
1. Inspect the HTML to verify element exists
2. Check if ID format is correct: `download-count-{materialId}`

**Solution:**
- The updated code now handles missing fields properly
- Refresh the page to re-render with correct IDs

## Debug Checklist

✅ Backend server is running on port 5500
✅ Can access http://localhost:5500/api/materials in browser
✅ materials.json has downloadCount field for all materials
✅ Browser console shows no CORS errors
✅ Element IDs match the pattern: download-count-{materialId}
✅ handleDownload function is defined globally
✅ onclick attribute has correct syntax

## Expected Console Output (Success)

```
Download clicked for material: 880b696b-6428-4970-bd40-133877e36f79
API Response status: 200
Download count updated: 1
Count element found: <span class="download-count" id="download-count-880b696b-6428-4970-bd40-133877e36f79">
UI updated with count: 1
```

## Files Modified

1. `backend/know_nook_backend/routes/materials.js` - Added download endpoint
2. `backend/know_nook_backend/data/materials.json` - Added downloadCount field
3. `frontend/assets/js/materials.js` - Added handleDownload with logging
4. `frontend/assets/js/materials-manager.js` - Added handleMaterialDownload
5. `frontend/assets/css/materials.css` - Added download counter styling

## Still Not Working?

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+F5)
3. Check browser console for ANY error messages
4. Verify all files were saved properly
5. Restart the backend server
6. Try the TEST-DOWNLOAD-COUNTER.html page first

## Contact Points

If issue persists, provide:
- Browser console screenshot
- Network tab screenshot (F12 → Network)
- Backend terminal output
- Exact steps to reproduce
