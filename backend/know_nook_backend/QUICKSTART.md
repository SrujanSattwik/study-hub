# Quick Start Guide - Material Upload & Pagination

## 🚀 Start the Backend

```bash
cd backend/know_nook_backend
npm start
```

Server will run on: **http://localhost:5500**

---

## 🧪 Test the API

### Option 1: Use Test Page (Easiest)
1. Open `backend/know_nook_backend/test-upload.html` in browser
2. Fill the form and upload a file or link
3. Click "Fetch Materials" to see results

### Option 2: Use Frontend Pages
1. Open `frontend/pages/materials/textbooks.html` in browser
2. Click "Upload Textbook" button
3. Fill form and upload
4. New card appears automatically

### Option 3: Use cURL

**Upload a file:**
```bash
curl -X POST http://localhost:5500/api/materials \
  -F "title=Test Textbook" \
  -F "description=This is a test" \
  -F "file=@path/to/file.pdf"
```

**Upload a link:**
```bash
curl -X POST http://localhost:5500/api/materials \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Video","link":"https://youtube.com/watch?v=test"}'
```

**Fetch materials:**
```bash
curl "http://localhost:5500/api/materials?type=textbook&page=1&limit=5"
```

---

## 📁 File Locations

**Uploaded files:** `backend/know_nook_backend/uploads/{type}/`
**Material metadata:** `backend/know_nook_backend/data/materials.json`

---

## ✅ Verify It Works

1. **Upload Test:**
   - Upload a PDF → Check `uploads/textbooks/` folder
   - Upload a video link → Check `materials.json`

2. **Pagination Test:**
   - Upload 6+ materials of same type
   - Open corresponding page (e.g., textbooks.html)
   - Click page 2 button → Should show next 5 items

3. **Auto-Detection Test:**
   - Upload `.pdf` → Should auto-detect as `textbook`
   - Upload YouTube link → Should auto-detect as `video`
   - Upload `.mp3` → Should auto-detect as `audio`

---

## 🎯 Expected Behavior

### On Upload:
- File saved to `/uploads/{type}/`
- Metadata added to `materials.json`
- New card appears on page 1 of correct section

### On Pagination:
- Page 1: Shows existing static cards + first 5 dynamic cards
- Page 2+: Shows next 5 dynamic cards
- Pagination buttons update based on total pages

### On Page Load:
- Existing static cards remain visible
- Dynamic cards load from API
- Pagination renders based on total items

---

## 🐛 Troubleshooting

**Backend won't start:**
- Run `npm install` first
- Check port 5500 is not in use

**Upload fails:**
- Check file size < 500MB
- Verify file extension is allowed
- Check `uploads/` folder exists

**Cards not showing:**
- Open browser console (F12)
- Check for JavaScript errors
- Verify API returns data: `http://localhost:5500/api/materials?type=textbook`

**CORS errors:**
- Backend has CORS enabled
- If using file:// protocol, use a local server instead

---

## 📊 Test Data

To quickly populate test data, use the test page or run:

```bash
node test-api.js
```

This will create sample materials and verify API endpoints.

---

## 🎉 Success Criteria

✅ Backend starts without errors  
✅ Upload form accepts files and links  
✅ Files saved to correct folders  
✅ Materials appear as new cards  
✅ Pagination buttons work  
✅ Cards route to correct sections  
✅ Existing UI unchanged  

---

## 📚 Next Steps

1. Test all material types (textbook, video, audio, notes)
2. Upload multiple materials to test pagination
3. Verify auto-detection works correctly
4. Check file access via browser
5. Test with different file types

For detailed documentation, see: `UPLOAD-PAGINATION-README.md`
