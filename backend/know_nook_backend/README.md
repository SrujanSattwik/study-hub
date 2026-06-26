# StudyClub Backend

Backend server for StudyClub features including KnowNook AI Chat and Materials Management.

## Features

- **KnowNook API**: AI-powered Q&A using Gemini API
- **Materials API**: User-submitted study materials with JSON storage

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Server runs on `http://localhost:5500`

## API Endpoints

### Materials API

#### GET /api/materials
Fetch all materials with optional filters.

**Query Parameters:**
- `category` - Filter by category (e.g., "Textbooks", "Video Lectures")
- `difficulty` - Filter by difficulty ("Easy", "Medium", "Hard")
- `q` - Search in title, description, and tags

**Example:**
```
GET /api/materials?category=Textbooks&difficulty=Medium
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Calculus Fundamentals",
    "description": "Complete guide to calculus",
    "category": "Textbooks",
    "author": "John Doe",
    "difficulty": "Medium",
    "tags": ["math", "calculus"],
    "thumbnailUrl": "https://example.com/image.jpg",
    "link": "https://example.com/resource",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
]
```

#### POST /api/materials
Add a new material.

**Request Body:**
```json
{
  "title": "Calculus Fundamentals",
  "description": "Complete guide to calculus",
  "category": "Textbooks",
  "author": "John Doe",
  "difficulty": "Medium",
  "tags": "math,calculus,tutorial",
  "thumbnailUrl": "https://example.com/image.jpg",
  "link": "https://example.com/resource"
}
```

**Required Fields:**
- `title` (string)
- `link` (valid URL)

**Response:**
```json
{
  "id": "generated-uuid",
  "title": "Calculus Fundamentals",
  ...
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### KnowNook API

#### POST /api/ask
Ask a question to the AI assistant.

**Request Body:**
```json
{
  "question": "What is calculus?"
}
```

**Response:**
```json
{
  "answer": "Calculus is a branch of mathematics..."
}
```

## Data Storage

Materials are stored in `data/materials.json` as a JSON array. The file is created automatically if it doesn't exist.

## CORS

CORS is enabled for all origins to support local development.
