# StudyClub Backend

This directory contains all backend files for the StudyClub application.

## Structure

```
backend/
└── know_nook_backend/        # KnowNook AI Chat Backend
    ├── server.js             # Express server with Gemini API integration
    ├── package.json          # Node.js dependencies
    ├── package-lock.json
    └── node_modules/         # Dependencies
```

## Setup

1. Navigate to the backend directory:
   ```bash
   cd backend/know_nook_backend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the `know_nook_backend` directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. Start the server:
   ```bash
   node server.js
   ```

The server will run on `http://localhost:3000`

## API Endpoints

- `POST /api/chat` - Send messages to the AI chat
  - Request body: `{ message: string, conversationHistory: array }`
  - Response: AI-generated response

- `POST /api/upload-image` - Upload images for AI analysis
  - Multipart form data with image file
  - Response: Image analysis from AI

## CORS Configuration

The server is configured to accept requests from:
- `http://localhost` (any port)
- `http://127.0.0.1` (any port)
- File protocol (`file://`)

## Dependencies

- express: Web server framework
- cors: Cross-origin resource sharing
- body-parser: Parse incoming request bodies
- axios: HTTP client for API requests
- Other dependencies as listed in package.json
