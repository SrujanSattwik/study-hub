# 🚀 Quick Start - Materials Backend

## Step 1: Start the Backend Server

```bash
cd "c:\Users\Hp\OneDrive\Desktop\code\working\study hub\backend\know_nook_backend"
npm start
```

You should see:
```
Server running on http://localhost:5500
```

## Step 2: Open the Materials Page

Open this file in your browser:
```
c:\Users\Hp\OneDrive\Desktop\code\working\study hub\frontend\pages\materials.html
```

Or navigate from the home page:
```
c:\Users\Hp\OneDrive\Desktop\code\working\study hub\frontend\index.html
```
Then click "Materials" in the navigation.

## Step 3: Add Your First Material

1. **Click the blue "+" button** in the bottom-right corner
2. **Fill in the form**:
   - Title: "Introduction to Python"
   - Description: "Beginner-friendly Python tutorial"
   - Category: "Video Lectures"
   - Author: "Your Name"
   - Difficulty: "Easy"
   - Tags: "python, programming, tutorial"
   - Thumbnail URL: (leave empty for placeholder)
   - Resource Link: "https://www.youtube.com/watch?v=example"
3. **Click "Add Material"**
4. **See it appear instantly** in the materials grid!

## Step 4: Test Filters

- **Filter by Category**: Select "Video Lectures" from the category dropdown
- **Filter by Difficulty**: Select "Easy" from the difficulty dropdown
- **Search**: Type "python" in the search box at the top

## Step 5: View a Material

Click the **"View Resource"** button on any material card to open the link in a new tab.

## 🎯 What You Can Do

### Add Materials
- Click the "+" button
- Fill in required fields (Title and Link)
- Optional: Add description, author, tags, thumbnail
- Submit and see it appear instantly

### Search Materials
- Type in the search box
- Searches title, description, and tags
- Results update in real-time

### Filter Materials
- Filter by Category (Textbooks, Videos, Notes, etc.)
- Filter by Difficulty (Easy, Medium, Hard)
- Combine filters for precise results

### View Materials
- Browse the card grid
- See thumbnails, titles, descriptions
- View category and difficulty badges
- See tags
- Click "View Resource" to open the link

## 📊 Sample Data

Want to test with sample data? Add these materials:

### Material 1
- Title: "Calculus Made Easy"
- Description: "Complete calculus course for beginners"
- Category: "Textbooks"
- Difficulty: "Medium"
- Tags: "math, calculus, textbook"
- Link: "https://example.com/calculus"

### Material 2
- Title: "Python Crash Course"
- Description: "Learn Python in 2 hours"
- Category: "Video Lectures"
- Difficulty: "Easy"
- Tags: "python, programming, video"
- Link: "https://youtube.com/example"

### Material 3
- Title: "Advanced Algorithms"
- Description: "Deep dive into complex algorithms"
- Category: "Study Notes"
- Difficulty: "Hard"
- Tags: "algorithms, computer science, advanced"
- Link: "https://example.com/algorithms"

## 🔍 Troubleshooting

### "Failed to load materials" error
- Make sure the backend server is running on port 5500
- Check the browser console for errors
- Verify CORS is enabled in server.js

### Materials not appearing
- Check if `data/materials.json` exists
- Verify the file has valid JSON (should be `[]` if empty)
- Check browser console for JavaScript errors

### Form submission fails
- Ensure Title and Link fields are filled
- Link must be a valid URL (start with http:// or https://)
- Check backend console for error messages

## 📁 Data Location

All materials are stored in:
```
backend/know_nook_backend/data/materials.json
```

You can view/edit this file directly to see the stored data.

## 🎉 Success!

You now have a fully functional materials management system with:
- ✅ Backend API for storing and retrieving materials
- ✅ Frontend UI for adding and viewing materials
- ✅ Search and filter functionality
- ✅ Real-time updates without page refresh
- ✅ Persistent storage in JSON file

Enjoy building your study materials library! 📚
