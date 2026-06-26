# 🚀 START BACKEND - Step by Step

## Step 1: Open Terminal/Command Prompt

Press `Win + R`, type `cmd`, press Enter

## Step 2: Navigate to Backend Folder

```bash
cd "c:\Users\Hp\OneDrive\Desktop\code\working\study hub\backend\know_nook_backend"
```

## Step 3: Start the Server

```bash
node server.js
```

You should see:
```
Server running on http://localhost:5500
```

**IMPORTANT: Keep this terminal window open! Don't close it.**

## Step 4: Open Materials Page

Open a new browser window and go to:
```
file:///c:/Users/Hp/OneDrive/Desktop/code/working/study%20hub/frontend/pages/materials.html
```

Or just double-click: `frontend/pages/materials.html`

## Step 5: Test Adding a Material

1. Click the blue **"+"** button (bottom right corner)
2. Fill in the form:
   - **Title**: Test Material
   - **Description**: This is a test
   - **Category**: Textbooks
   - **Author**: Your Name
   - **Difficulty**: Easy
   - **Tags**: test, demo
   - **Thumbnail URL**: (leave empty)
   - **Resource Link**: https://google.com
3. Click **"Add Material"**
4. You should see a green success message
5. The card should appear in the grid below

## Troubleshooting

### If you see "Failed to load materials":
- Make sure the server is running (Step 3)
- Check the terminal for errors
- Make sure port 5500 is not used by another program

### If the card doesn't appear:
- Open browser console (F12)
- Check for errors
- Refresh the page

### To stop the server:
- Go to the terminal window
- Press `Ctrl + C`

## Quick Test (Optional)

To test if the server is working, open this URL in your browser:
```
http://localhost:5500/api/materials
```

You should see: `[]` (empty array)
