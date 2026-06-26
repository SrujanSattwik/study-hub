# 🏗️ Materials Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (materials.html + materials.js + materials.css)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ (localhost:5500)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                            │
│                    (server.js)                               │
│                    Port: 5500                                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CORS Middleware                                    │    │
│  │  Body Parser                                        │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Materials Router                                   │    │
│  │  (/api/materials)                                   │    │
│  │                                                      │    │
│  │  • GET  /api/materials                             │    │
│  │  • POST /api/materials                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ File I/O
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA STORAGE                              │
│              (data/materials.json)                           │
│                                                              │
│  [                                                           │
│    {                                                         │
│      "id": "uuid",                                          │
│      "title": "...",                                        │
│      "description": "...",                                  │
│      "category": "...",                                     │
│      "author": "...",                                       │
│      "difficulty": "...",                                   │
│      "tags": [...],                                         │
│      "thumbnailUrl": "...",                                 │
│      "link": "...",                                         │
│      "createdAt": "..."                                     │
│    }                                                         │
│  ]                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

### Adding a Material (POST)

```
User fills form
      │
      ▼
materials.js: submitMaterial()
      │
      ▼
POST /api/materials
      │
      ▼
routes/materials.js
      │
      ├─► Validate title (required)
      ├─► Validate link (required + valid URL)
      ├─► Check thumbnail URL (fallback if invalid)
      ├─► Parse tags (comma-separated → array)
      ├─► Generate UUID
      ├─► Add timestamp
      │
      ▼
Read materials.json
      │
      ▼
Append new material
      │
      ▼
Write materials.json
      │
      ▼
Return new material
      │
      ▼
materials.js: renderMaterials()
      │
      ▼
New card appears in UI
```

### Loading Materials (GET)

```
Page loads
      │
      ▼
materials.js: loadMaterials()
      │
      ▼
GET /api/materials?category=...&difficulty=...&q=...
      │
      ▼
routes/materials.js
      │
      ├─► Read materials.json
      ├─► Apply category filter (if provided)
      ├─► Apply difficulty filter (if provided)
      ├─► Apply search filter (if provided)
      ├─► Sort by createdAt (newest first)
      │
      ▼
Return filtered materials
      │
      ▼
materials.js: renderMaterials()
      │
      ▼
Cards displayed in grid
```

## Component Breakdown

### Backend Components

```
backend/know_nook_backend/
│
├── server.js
│   ├─ Express app initialization
│   ├─ CORS configuration
│   ├─ Body parser middleware
│   ├─ Materials router mounting
│   └─ Server listening on port 5500
│
├── routes/materials.js
│   ├─ GET /api/materials
│   │   ├─ Read JSON file
│   │   ├─ Apply filters
│   │   ├─ Sort by date
│   │   └─ Return JSON
│   │
│   ├─ POST /api/materials
│   │   ├─ Validate input
│   │   ├─ Generate UUID
│   │   ├─ Create material object
│   │   ├─ Read JSON file
│   │   ├─ Append material
│   │   ├─ Write JSON file
│   │   └─ Return new material
│   │
│   └─ Helper functions
│       ├─ ensureDataFile()
│       ├─ readMaterials()
│       ├─ writeMaterials()
│       └─ isValidUrl()
│
└── data/materials.json
    └─ JSON array of material objects
```

### Frontend Components

```
frontend/
│
├── pages/materials.html
│   ├─ Navigation bar
│   ├─ Search section
│   ├─ Materials categories (static)
│   ├─ Filters section
│   │   ├─ Category dropdown
│   │   └─ Difficulty dropdown
│   ├─ Materials container (dynamic)
│   ├─ Add material button (floating)
│   └─ Add material modal
│       └─ Form with all fields
│
├── assets/js/materials.js
│   ├─ loadMaterials()
│   │   └─ Fetch from API
│   ├─ renderMaterials()
│   │   └─ Create card HTML
│   ├─ submitMaterial()
│   │   └─ POST to API
│   ├─ showToast()
│   │   └─ Display notifications
│   ├─ Event listeners
│   │   ├─ Form submit
│   │   ├─ Search input
│   │   └─ Filter changes
│   └─ Modal functions
│       ├─ openModal()
│       └─ closeModal()
│
└── assets/css/materials.css
    ├─ Material card styles
    ├─ Grid layout
    ├─ Badge styles
    ├─ Modal styles
    ├─ Form styles
    ├─ Toast styles
    └─ Responsive breakpoints
```

## Data Flow Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Browser  │────▶│  Server  │────▶│   JSON   │
│  Action  │     │   (JS)   │     │  (API)   │     │   File   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                 │                 │
     │                │                 │                 │
     ▼                ▼                 ▼                 ▼
  Click +      submitMaterial()    POST handler      Write file
  Fill form    ─────────────▶      Validate data     materials.json
  Submit       Fetch API            Generate UUID
                                    Create object
     │                │                 │                 │
     │                │                 │                 │
     ▼                ▼                 ▼                 ▼
  See card     renderMaterials()   Return JSON       Data persisted
  Update UI    ◀─────────────      200 OK            Survives restart
```

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **CORS**: Cross-origin resource sharing
- **Body Parser**: JSON request parsing
- **File System (fs)**: JSON file operations
- **Crypto**: UUID generation

### Frontend
- **Vanilla JavaScript**: No frameworks
- **Fetch API**: HTTP requests
- **DOM Manipulation**: Dynamic rendering
- **CSS Grid**: Responsive layout
- **CSS Flexbox**: Component layout
- **HTML5**: Semantic markup

### Storage
- **JSON File**: Simple, lightweight storage
- **No Database**: Easy deployment
- **File-based**: Portable and version-controllable

## Security Features

```
┌─────────────────────────────────────┐
│         Input Validation            │
├─────────────────────────────────────┤
│ • Title required                    │
│ • Link required                     │
│ • URL format validation             │
│ • HTML escaping (XSS prevention)    │
│ • Sanitized tags                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         CORS Configuration          │
├─────────────────────────────────────┤
│ • Enabled for all origins           │
│ • Supports local development        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         Error Handling              │
├─────────────────────────────────────┤
│ • Try-catch blocks                  │
│ • Proper HTTP status codes          │
│ • User-friendly error messages      │
└─────────────────────────────────────┘
```

## Performance Considerations

- **Lightweight**: No database overhead
- **Fast reads**: Direct file access
- **Atomic writes**: Prevents data corruption
- **Client-side filtering**: Reduces server load
- **Minimal dependencies**: Quick startup
- **No authentication**: Simplified for MVP

## Scalability Path

```
Current (MVP)          →    Future Enhancement
─────────────────────────────────────────────────
JSON File              →    MongoDB/PostgreSQL
No Auth                →    JWT Authentication
Single Server          →    Load Balancer
File Storage           →    Cloud Storage (S3)
No Caching             →    Redis Cache
Synchronous I/O        →    Async/Await + Queues
```

## API Contract

### GET /api/materials

**Request:**
```
GET /api/materials?category=Textbooks&difficulty=Easy&q=python
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Python Basics",
    "description": "Learn Python fundamentals",
    "category": "Textbooks",
    "author": "John Doe",
    "difficulty": "Easy",
    "tags": ["python", "programming"],
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "link": "https://example.com/resource",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

### POST /api/materials

**Request:**
```json
{
  "title": "Python Basics",
  "description": "Learn Python fundamentals",
  "category": "Textbooks",
  "author": "John Doe",
  "difficulty": "Easy",
  "tags": "python,programming",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "link": "https://example.com/resource"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Python Basics",
  "description": "Learn Python fundamentals",
  "category": "Textbooks",
  "author": "John Doe",
  "difficulty": "Easy",
  "tags": ["python", "programming"],
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "link": "https://example.com/resource",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

## File Structure Summary

```
study hub/
├── backend/
│   └── know_nook_backend/
│       ├── routes/
│       │   └── materials.js          (API logic)
│       ├── data/
│       │   └── materials.json        (Storage)
│       ├── server.js                 (Entry point)
│       ├── package.json              (Dependencies)
│       ├── README.md                 (API docs)
│       └── TEST.md                   (Test guide)
│
├── frontend/
│   ├── pages/
│   │   └── materials.html            (UI)
│   └── assets/
│       ├── js/
│       │   └── materials.js          (Logic)
│       └── css/
│           └── materials.css         (Styles)
│
├── MATERIALS-BACKEND-COMPLETE.md     (Summary)
├── QUICKSTART-MATERIALS.md           (Quick start)
└── MATERIALS-ARCHITECTURE.md         (This file)
```
