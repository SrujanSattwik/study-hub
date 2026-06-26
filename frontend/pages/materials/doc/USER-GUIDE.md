# 📖 USER GUIDE - Material Upload & Pagination

## How to Use the New Features

---

## 🎯 Quick Overview

The Study Hub now supports:
- ✅ Uploading study materials (files or links)
- ✅ Automatic categorization by type
- ✅ Real pagination (browse through pages)
- ✅ Dynamic card updates

---

## 📤 UPLOADING MATERIALS

### Step 1: Navigate to Material Page

Choose the type of material you want to upload:
- **Textbooks** → `textbooks.html`
- **Video Lectures** → `video-lectures.html`
- **Audio Content** → `audio-content.html`
- **Study Notes** → `study-notes.html`

### Step 2: Click Upload Button

Look for the upload button in the header:
```
┌─────────────────────────────────────────┐
│  📚 Textbooks                           │
│  Comprehensive textbooks covering...    │
│                                         │
│  🔍 [Search box]  [📤 Upload Textbook] │
└─────────────────────────────────────────┘
```

### Step 3: Choose Upload Mode

The modal will show two options:

**Option A: Upload File**
```
┌─────────────────────────────────────┐
│  📤 Upload Textbook                 │
│                                     │
│  [📁 Upload File] [🔗 Upload Link] │
│                                     │
│  Title: ___________________         │
│  Author: __________________         │
│  Subject: [Select ▼]               │
│  Description: _____________         │
│                                     │
│  📁 Click to upload file            │
│     PDF files only (Max 50MB)       │
│                                     │
│  [Upload Textbook]                  │
└─────────────────────────────────────┘
```

**Option B: Upload with Link**
```
┌─────────────────────────────────────┐
│  📤 Upload Textbook                 │
│                                     │
│  [📁 Upload File] [🔗 Upload Link] │
│                                     │
│  Title: ___________________         │
│  Author: __________________         │
│  Subject: [Select ▼]               │
│  Description: _____________         │
│                                     │
│  Link: https://___________          │
│                                     │
│  🖼️ Upload thumbnail image          │
│     JPG, PNG (Max 5MB)              │
│                                     │
│  [Upload Textbook]                  │
└─────────────────────────────────────┘
```

### Step 4: Fill the Form

**Required Fields:**
- ✅ Title (e.g., "Introduction to Algorithms")
- ✅ File OR Link (choose one)

**Optional Fields:**
- Author/Instructor name
- Subject category
- Description

### Step 5: Submit

Click the upload button and wait for confirmation:
```
✅ Material uploaded successfully!
```

### Step 6: See Your Material

The page will refresh and your new material appears as a card:
```
┌─────────────────────────────────────┐
│  📖                                 │
│  Introduction to Algorithms         │
│  Uploaded 1/15/2025                 │
│  Classic CS textbook covering...    │
│  📄 PDF  🕐 2:30 PM                 │
│  [Download] [Save]                  │
└─────────────────────────────────────┘
```

---

## 📄 BROWSING MATERIALS

### Pagination Controls

At the bottom of each page, you'll see pagination:
```
┌─────────────────────────────────────┐
│  [1] 2 3 4 5 [→]                   │
└─────────────────────────────────────┘
```

**How it works:**
- **[1]** = Current page (highlighted)
- **2, 3, 4, 5** = Other pages (click to navigate)
- **[→]** = Next page

### Navigating Pages

**To go to page 2:**
1. Click the "2" button
2. Cards update automatically
3. No page reload needed

**To go to next page:**
1. Click the [→] button
2. Moves to next page
3. Cards update

**To go back:**
1. Click previous page number
2. Returns to that page

### What You'll See

**Page 1:**
- Existing static cards (demo materials)
- First 5 uploaded materials
- Total: Up to 10 cards

**Page 2+:**
- Next 5 uploaded materials
- Only dynamic cards

---

## 🎯 MATERIAL TYPES

### Textbooks (PDF)
```
Upload: .pdf files
Icon: 📖 Book
Page: textbooks.html
Action: Download
```

### Video Lectures
```
Upload: .mp4, .avi, .mov OR YouTube links
Icon: ▶️ Play button
Page: video-lectures.html
Action: Watch Now
```

### Audio Content
```
Upload: .mp3, .wav, .m4a OR audio links
Icon: 🎧 Headphones
Page: audio-content.html
Action: Listen Now
```

### Study Notes
```
Upload: Any file or link
Icon: 📄 Document
Page: study-notes.html
Action: View
```

---

## 🔍 FINDING MATERIALS

### Using Filters

Each page has filter options:
```
┌─────────────────────────────────────┐
│  🔽 Filter by:                      │
│  [All Subjects ▼] [All Levels ▼]   │
│                                     │
│  📊 Sort:                           │
│  [Most Popular ▼]                   │
└─────────────────────────────────────┘
```

**Filter by Subject:**
- Mathematics
- Science
- Engineering
- Business
- Arts

**Sort Options:**
- Most Popular
- Newest First
- A-Z
- Highest Rated

### Using Search

Type in the search box to find materials:
```
┌─────────────────────────────────────┐
│  🔍 Search textbooks by title...    │
└─────────────────────────────────────┘
```

---

## 💡 TIPS & TRICKS

### For Best Results:

**When Uploading Files:**
- ✅ Use descriptive titles
- ✅ Add detailed descriptions
- ✅ Choose correct subject
- ✅ Keep files under size limit

**When Uploading Links:**
- ✅ Use direct links when possible
- ✅ Test link before uploading
- ✅ Add thumbnail for better appearance
- ✅ Include description

**When Browsing:**
- ✅ Use filters to narrow results
- ✅ Sort by "Newest First" to see recent uploads
- ✅ Use pagination for large collections
- ✅ Bookmark favorite materials

---

## 🎨 UNDERSTANDING CARDS

### Card Structure

```
┌─────────────────────────────────────┐
│  📖 ← Icon (shows material type)    │
│  Title of Material                  │
│  by Author Name / Upload Date       │
│  Description text goes here...      │
│  ⭐ 4.8  📥 12.5k  📄 PDF  🕐 1200  │
│  [Primary Action] [Secondary]       │
└─────────────────────────────────────┘
```

**Card Elements:**
1. **Icon** - Visual indicator of type
2. **Title** - Material name
3. **Author/Date** - Creator or upload date
4. **Description** - Brief summary
5. **Metadata** - Rating, downloads, format, size
6. **Actions** - Download, view, save buttons

### Static vs Dynamic Cards

**Static Cards (Demo):**
- Pre-loaded in HTML
- Show example materials
- Always visible on page 1

**Dynamic Cards (Uploaded):**
- Loaded from backend
- Your uploaded materials
- Appear across all pages

---

## 🔄 WORKFLOW EXAMPLES

### Example 1: Upload a Textbook PDF

1. Open `textbooks.html`
2. Click "Upload Textbook"
3. Select "Upload File" mode
4. Fill form:
   - Title: "Calculus Vol. 1"
   - Author: "Gilbert Strang"
   - Subject: Mathematics
   - Description: "MIT OpenCourseWare textbook"
5. Choose PDF file from computer
6. Click "Upload Textbook"
7. ✅ Success! Card appears on page 1

### Example 2: Upload a YouTube Video

1. Open `video-lectures.html`
2. Click "Upload Video"
3. Select "Upload with Link" mode
4. Fill form:
   - Title: "Linear Algebra Lecture 1"
   - Instructor: "MIT OpenCourseWare"
   - Subject: Mathematics
   - Link: `https://youtube.com/watch?v=...`
5. Upload thumbnail image (optional)
6. Click "Upload Video"
7. ✅ Success! Card appears on page 1

### Example 3: Browse Multiple Pages

1. Upload 10+ materials to same category
2. Reload page
3. See pagination: [1] 2 3 →
4. Page 1 shows first 5 items
5. Click "2" to see next 5 items
6. Click "3" to see remaining items
7. Click "1" to return to start

---

## ❓ FREQUENTLY ASKED QUESTIONS

### Q: What file types are supported?
**A:** PDF, MP4, MP3, AVI, MOV, WAV, M4A

### Q: What's the maximum file size?
**A:** 500MB for video files, 50MB for PDFs, 100MB for audio

### Q: Can I upload external links?
**A:** Yes! YouTube, Google Drive, Dropbox, or any URL

### Q: How many materials can I upload?
**A:** Unlimited (within storage constraints)

### Q: Can I delete uploaded materials?
**A:** Not yet - this feature is coming soon

### Q: Do I need an account?
**A:** No authentication required currently

### Q: Where are files stored?
**A:** On the server in `/uploads/{type}/` folders

### Q: Can others see my uploads?
**A:** Yes, all uploads are public

---

## 🐛 TROUBLESHOOTING

### Upload Fails

**Problem:** "Upload failed" error
**Solution:**
- Check file size is under limit
- Verify file type is supported
- Ensure backend server is running
- Try again with different file

### Card Doesn't Appear

**Problem:** Uploaded but no card visible
**Solution:**
- Refresh the page
- Check correct material page (textbooks vs videos)
- Open browser console (F12) for errors
- Verify upload was successful

### Pagination Not Working

**Problem:** Can't click page buttons
**Solution:**
- Ensure JavaScript is enabled
- Check browser console for errors
- Verify materials exist (need 6+ for page 2)
- Refresh the page

### File Won't Download

**Problem:** Download button doesn't work
**Solution:**
- Check backend server is running
- Verify file exists in uploads folder
- Try opening in new tab
- Check browser download settings

---

## 🎉 SUCCESS!

You're now ready to:
- ✅ Upload study materials
- ✅ Browse paginated content
- ✅ Share resources with others
- ✅ Build your study library

**Happy Learning! 📚**

---

For technical details, see:
- `QUICKSTART.md` - Setup guide
- `UPLOAD-PAGINATION-README.md` - Full documentation
- `VERIFICATION-CHECKLIST.md` - Testing guide
