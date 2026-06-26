# System Architecture - Material Upload & Pagination

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  (textbooks.html, video-lectures.html, audio-content.html)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ 1. Page Load
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   materials-manager.js                          │
│  • initMaterialsPage(type)                                      │
│  • loadMaterials(type, page)                                    │
│  • renderMaterials(materials)                                   │
│  • uploadMaterial(formData)                                     │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             │ 2. GET Request             │ 3. POST Request
             │ (Fetch materials)          │ (Upload material)
             ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (server.js)                   │
│  • CORS enabled                                                 │
│  • Static file serving: /uploads/                              │
│  • Routes: /api/materials                                       │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             │ 4. Route to handler        │
             ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              MATERIALS ROUTER (routes/materials.js)             │
│                                                                 │
│  GET /api/materials?type=X&page=Y&limit=Z                      │
│  ├─ Read materials.json                                        │
│  ├─ Filter by type                                             │
│  ├─ Sort by createdAt DESC                                     │
│  ├─ Paginate results                                           │
│  └─ Return { page, totalPages, materials }                     │
│                                                                 │
│  POST /api/materials                                            │
│  ├─ Multer processes file upload                               │
│  ├─ Detect type & format                                       │
│  ├─ Save file to /uploads/{type}/                             │
│  ├─ Generate UUID filename                                     │
│  ├─ Create material object                                     │
│  ├─ Append to materials.json                                   │
│  └─ Return new material                                        │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             │ 5. Read/Write              │ 6. Save file
             ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────────────┐
│   data/materials.json    │  │      uploads/{type}/             │
│                          │  │  ├─ textbooks/                   │
│  [                       │  │  ├─ videos/                      │
│    {                     │  │  ├─ audio/                       │
│      "id": "uuid",       │  │  └─ notes/                       │
│      "title": "...",     │  │                                  │
│      "type": "textbook", │  │  Files stored with UUID names:   │
│      "format": "pdf",    │  │  abc123-def456.pdf               │
│      "filePath": "...",  │  │  xyz789-ghi012.mp4               │
│      "createdAt": "..."  │  │                                  │
│    }                     │  │                                  │
│  ]                       │  │                                  │
└──────────────────────────┘  └──────────────────────────────────┘
```

---

## 🔄 Upload Flow

```
User clicks "Upload" button
         │
         ▼
Modal opens with form
         │
         ├─ Mode: File Upload
         │  └─ User selects file (PDF/video/audio)
         │
         └─ Mode: Link Upload
            └─ User enters URL (YouTube/Drive/etc.)
         │
         ▼
User fills title, description
         │
         ▼
Form submits
         │
         ▼
materials-manager.js
  • Creates FormData
  • Appends file OR link
  • Appends type
         │
         ▼
POST /api/materials
         │
         ▼
routes/materials.js
  • Multer processes upload
  • Detects type/format
  • Saves file to disk
  • Generates UUID
  • Updates materials.json
         │
         ▼
Returns new material object
         │
         ▼
materials-manager.js
  • Reloads current page
  • New card appears
         │
         ▼
User sees new material card
```

---

## 📄 Pagination Flow

```
Page loads (e.g., textbooks.html)
         │
         ▼
initMaterialsPage('textbook')
         │
         ▼
loadMaterials('textbook', 1)
         │
         ▼
GET /api/materials?type=textbook&page=1&limit=5
         │
         ▼
Backend:
  • Reads materials.json
  • Filters: type === 'textbook'
  • Sorts: newest first
  • Calculates: totalPages = ceil(count / 5)
  • Slices: items [0-4] for page 1
         │
         ▼
Returns:
{
  "page": 1,
  "totalPages": 3,
  "totalItems": 15,
  "materials": [5 items]
}
         │
         ▼
renderMaterials(materials)
  • Creates card HTML for each
  • Appends to #materialsList
         │
         ▼
renderPagination(1, 3)
  • Creates buttons: [1] [2] [3] [→]
  • Marks page 1 as active
         │
         ▼
User sees:
  • 5 existing static cards
  • 5 new dynamic cards
  • Pagination: [1] 2 3 →
         │
         ▼
User clicks page 2
         │
         ▼
loadMaterials('textbook', 2)
         │
         ▼
GET /api/materials?type=textbook&page=2&limit=5
         │
         ▼
Backend returns items [5-9]
         │
         ▼
UI updates:
  • Cards replaced with page 2 items
  • Pagination: 1 [2] 3 →
```

---

## 🎯 Type Detection Logic

```
File Upload:
  .pdf        → type: textbook, format: pdf
  .mp4/.avi   → type: video,    format: mp4/avi
  .mp3/.wav   → type: audio,    format: mp3/wav
  other       → type: notes,    format: extension

Link Upload:
  youtube.com → type: video,    format: link
  soundcloud  → type: audio,    format: link
  other       → type: notes,    format: link
```

---

## 🗂️ File Organization

```
uploads/
├── textbooks/
│   ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf
│   └── b2c3d4e5-f6a7-8901-bcde-f12345678901.pdf
│
├── videos/
│   ├── c3d4e5f6-a7b8-9012-cdef-123456789012.mp4
│   └── d4e5f6a7-b8c9-0123-def1-234567890123.avi
│
├── audio/
│   ├── e5f6a7b8-c9d0-1234-ef12-345678901234.mp3
│   └── f6a7b8c9-d0e1-2345-f123-456789012345.wav
│
└── notes/
    └── a7b8c9d0-e1f2-3456-1234-567890123456.pdf
```

---

## 🔗 API Endpoints

```
┌─────────────────────────────────────────────────────────────┐
│  POST /api/materials                                        │
│                                                             │
│  Request (multipart/form-data):                            │
│    • title: string (required)                              │
│    • description: string (optional)                        │
│    • type: string (optional, auto-detected)                │
│    • file: File (required if no link)                      │
│    • link: string (required if no file)                    │
│                                                             │
│  Response (201):                                            │
│    {                                                        │
│      "id": "uuid",                                          │
│      "title": "...",                                        │
│      "type": "textbook|video|audio|notes",                 │
│      "format": "pdf|mp4|mp3|link",                         │
│      "filePath": "/uploads/type/uuid.ext" | null,          │
│      "link": "url" | null,                                  │
│      "createdAt": "ISO timestamp"                           │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GET /api/materials?type={type}&page={page}&limit={limit}  │
│                                                             │
│  Query Parameters:                                          │
│    • type: textbook|video|audio|notes (optional)           │
│    • page: number (default: 1)                             │
│    • limit: number (default: 5)                            │
│                                                             │
│  Response (200):                                            │
│    {                                                        │
│      "page": 1,                                             │
│      "totalPages": 3,                                       │
│      "totalItems": 15,                                      │
│      "materials": [...]                                     │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Card Rendering

```
Static Card (existing HTML):
┌─────────────────────────────────────┐
│  📖 Icon                            │
│  Calculus: Early Transcendentals   │
│  by James Stewart                   │
│  Description...                     │
│  ⭐ 4.8  📥 12.5k  📄 PDF  🕐 1200  │
│  [Download] [Preview]               │
└─────────────────────────────────────┘

Dynamic Card (generated by JS):
┌─────────────────────────────────────┐
│  📖 Icon                            │
│  Introduction to Algorithms         │
│  Uploaded 1/15/2025                 │
│  Description...                     │
│  📄 PDF  🕐 2:30 PM                 │
│  [Download] [Save]                  │
└─────────────────────────────────────┘

Both use same CSS classes:
  .material-item
  .material-thumbnail
  .material-info
  .material-meta
  .material-actions
```

---

## 🔐 Security Features

```
✅ File Type Validation
   • Only allowed extensions accepted
   • Multer fileFilter checks extension

✅ File Size Limit
   • 500MB maximum
   • Prevents DoS attacks

✅ Safe Filenames
   • UUID-based naming
   • Prevents path traversal
   • No user input in filename

✅ CORS Enabled
   • Cross-origin requests allowed
   • Necessary for frontend-backend separation

✅ Error Handling
   • Try-catch blocks
   • Proper HTTP status codes
   • User-friendly error messages
```

---

## 📈 Scalability Considerations

**Current (JSON-based):**
- ✅ Simple setup
- ✅ No database needed
- ✅ Easy to debug
- ⚠️ Limited to ~10,000 materials
- ⚠️ No concurrent write protection

**Future (Database):**
- PostgreSQL/MongoDB for metadata
- S3/CDN for file storage
- Redis for caching
- Elasticsearch for search
- Message queue for processing

---

## 🎯 Key Design Principles

1. **Separation of Concerns**
   - Backend: Data + file handling
   - Frontend: UI + user interaction
   - API: Clean contract between layers

2. **Progressive Enhancement**
   - Static cards work without JS
   - Dynamic cards enhance experience
   - Graceful degradation

3. **Minimal Changes**
   - Existing code untouched
   - New features added alongside
   - Zero breaking changes

4. **Developer Experience**
   - Clear documentation
   - Easy testing
   - Simple debugging

---

This architecture ensures the system is maintainable, scalable, and easy to understand!
