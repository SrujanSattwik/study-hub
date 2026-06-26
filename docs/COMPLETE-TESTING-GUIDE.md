# ✅ Complete Testing Guide - Materials Backend

## 🎯 What You Need to Do

### STEP 1: Start the Backend Server

1. **Open Command Prompt** (Win + R → type `cmd` → Enter)

2. **Navigate to backend folder:**
   ```bash
   cd "c:\Users\Hp\OneDrive\Desktop\code\working\study hub\backend\know_nook_backend"
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

4. **You should see:**
   ```
   Server running on http://localhost:5500
   ```

5. **KEEP THIS WINDOW OPEN!** Don't close it while testing.

---

### STEP 2: Open the Materials Page

**Option A:** Double-click this file:
```
frontend/pages/materials.html
```

**Option B:** Open browser and paste:
```
file:///c:/Users/Hp/OneDrive/Desktop/code/working/study%20hub/frontend/pages/materials.html
```

---

### STEP 3: Add Your First Material

1. **Look for the blue "+" button** in the bottom-right corner of the page

2. **Click it** - A form will pop up

3. **Fill in the form:**
   - Title: `Introduction to Python`
   - Description: `Beginner-friendly Python tutorial`
   - Category: `Video Lectures`
   - Author: `John Doe`
   - Difficulty: `Easy`
   - Tags: `python, programming, tutorial`
   - Thumbnail URL: (leave empty - it will use a placeholder)
   - Resource Link: `https://www.youtube.com/watch?v=example`

4. **Click "Add Material"**

5. **You should see:**
   - Green success message: "Material added successfully!"
   - The form closes
   - A new card appears in the "Community Materials" section

---

### STEP 4: Verify the Card

The card should show:
- ✅ Placeholder thumbnail image (purple with "Study Material" text)
- ✅ Title: "Introduction to Python"
- ✅ Description: "Beginner-friendly Python tutorial"
- ✅ Category badge: "Video Lectures"
- ✅ Difficulty badge: "Easy" (green)
- ✅ Tags: #python #programming #tutorial
- ✅ Author: "By John Doe"
- ✅ "View Resource" button

---

### STEP 5: Test the Card

1. **Click "View Resource" button** - Should open the link in a new tab

---

### STEP 6: Add Another Material (with thumbnail)

1. Click the "+" button again
2. Fill in:
   - Title: `Calculus Made Easy`
   - Description: `Complete calculus course`
   - Category: `Textbooks`
   - Author: `Jane Smith`
   - Difficulty: `Medium`
   - Tags: `math, calculus`
   - Thumbnail URL: `https://picsum.photos/400/250`
   - Resource Link: `https://example.com/calculus`
3. Click "Add Material"
4. New card should appear with an actual image

---

### STEP 7: Test Filters

1. **Category Filter:**
   - Select "Video Lectures" from the category dropdown
   - Should show only the Python material

2. **Difficulty Filter:**
   - Select "Medium" from the difficulty dropdown
   - Should show only the Calculus material

3. **Reset Filters:**
   - Select "All Categories" and "All Levels"
   - Should show both materials

---

### STEP 8: Test Search

1. Type "python" in the search box at the top
2. Should show only the Python material
3. Clear the search box
4. Should show all materials again

---

## 🔍 Troubleshooting

### Problem: "Failed to load materials" error

**Solution:**
1. Check if the server is running (Step 1)
2. Look at the terminal - should say "Server running on http://localhost:5500"
3. If not running, start it with `node server.js`

---

### Problem: Form submits but no card appears

**Solution:**
1. Open browser console (Press F12)
2. Look for errors in red
3. Check the terminal window for server errors
4. Make sure you filled in both required fields (Title and Link)
5. Make sure the Link is a valid URL (starts with http:// or https://)

---

### Problem: "CORS error" in browser console

**Solution:**
- The server.js already has CORS enabled
- Make sure you're using the correct API URL: `http://localhost:5500/api/materials`
- Restart the server

---

### Problem: Port 5500 already in use

**Solution:**
1. Close any other programs using port 5500
2. Or change the port in `server.js`:
   ```javascript
   const PORT = 5501; // Change to 5501
   ```
3. Also update `materials.js`:
   ```javascript
   const API_URL = 'http://localhost:5501/api/materials';
   ```

---

## 📊 Check the Data File

After adding materials, check this file:
```
backend/know_nook_backend/data/materials.json
```

It should contain your materials in JSON format:
```json
[
  {
    "id": "some-uuid",
    "title": "Introduction to Python",
    "description": "Beginner-friendly Python tutorial",
    "category": "Video Lectures",
    "author": "John Doe",
    "difficulty": "Easy",
    "tags": ["python", "programming", "tutorial"],
    "thumbnailUrl": "https://via.placeholder.com/...",
    "link": "https://www.youtube.com/watch?v=example",
    "createdAt": "2025-01-15T..."
  }
]
```

---

## 🎉 Success Checklist

- ✅ Server starts without errors
- ✅ Materials page loads
- ✅ Can open the add material form
- ✅ Can submit a material
- ✅ See success message
- ✅ Card appears in the grid
- ✅ Can click "View Resource" button
- ✅ Filters work correctly
- ✅ Search works correctly
- ✅ Data persists in materials.json

---

## 🛑 To Stop the Server

1. Go to the terminal window
2. Press `Ctrl + C`
3. Type `Y` if asked to confirm

---

## 📝 Quick Reference

**Start Server:**
```bash
cd "c:\Users\Hp\OneDrive\Desktop\code\working\study hub\backend\know_nook_backend"
node server.js
```

**Test API (in browser):**
```
http://localhost:5500/api/materials
```

**Open Materials Page:**
```
Double-click: frontend/pages/materials.html
```

**Required Form Fields:**
- Title (text)
- Resource Link (valid URL)

**Optional Form Fields:**
- Description
- Category
- Author
- Difficulty
- Tags
- Thumbnail URL
