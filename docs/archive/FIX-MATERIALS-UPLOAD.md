# Fix Instructions for Materials Pages

## Problem 1: Upload Modal Not Working
**Cause**: Form inputs missing `name` attributes

**Fix**: Add `name` attribute to ALL form inputs in upload modal

### Example (apply to ALL material pages):
```html
<!-- BEFORE -->
<input type="text" required placeholder="Enter title">

<!-- AFTER -->
<input type="text" name="title" required placeholder="Enter title">
```

### Required name attributes:
- `name="title"` - Title input
- `name="author"` - Author/Instructor input  
- `name="subject"` - Subject select
- `name="level"` - Level select (if exists)
- `name="description"` - Description textarea
- `name="file"` - File input
- `name="link"` - Link input (in link mode)
- `name="thumbnail"` - Thumbnail URL input

## Problem 2: Author Name Not Showing
**Cause**: Database doesn't have author field, materials-manager.js uses it

**Fix**: Backend needs to store author field OR use uploader's name

### Option A: Add author to form data (RECOMMENDED)
Already done in textbooks.html - copy to other pages

### Option B: Use logged-in user's name as author
Modify materials-manager.js to get user from localStorage

## Files to Fix:

1. **video-lectures.html** - Add name attributes to form
2. **audio-content.html** - Add name attributes to form
3. **study-notes.html** - Add name attributes to form
4. **practice-tests.html** - Add name attributes to form
5. **infographics.html** - Add name attributes to form

## Copy from textbooks.html:
Lines 217-268 contain the CORRECT form with all name attributes.
Copy this form structure to all other material pages, just change:
- Modal title
- Button text
- File accept types

## Test:
1. Open any materials page
2. Click Upload button
3. Fill form and submit
4. Check browser console for errors
5. Verify material appears in database
