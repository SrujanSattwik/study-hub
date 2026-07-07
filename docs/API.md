# StudyClub — API Reference

## Base URL

```
Development:  http://localhost:3001
Production:   https://api.yourdomain.com
```

## Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

Refresh tokens are sent automatically via HttpOnly cookie (`withCredentials: true`).

---

## Auth Routes — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | ❌ | Start registration, sends OTP |
| POST | `/auth/verify-otp` | ❌ | Verify OTP, complete signup |
| POST | `/auth/login` | ❌ | Login with email + password |
| POST | `/auth/logout` | ✅ | Invalidate refresh token |
| POST | `/auth/refresh` | 🍪 | Issue new access token via cookie |
| GET | `/auth/me` | ✅ | Get current user profile |
| PUT | `/auth/profile` | ✅ | Update profile |
| POST | `/auth/send-otp` | ❌ | Resend OTP email |

### POST `/auth/login`

**Request:**
```json
{ "email": "alice@example.com", "password": "SecurePass123!" }
```

**Response 200:**
```json
{
  "success": true,
  "access_token": "eyJ...",
  "user": {
    "user_id": "uuid",
    "full_name": "Alice Chen",
    "email": "alice@example.com",
    "role": "student"
  }
}
```

**Response 401:**
```json
{ "success": false, "message": "Invalid email or password" }
```

---

## Materials Routes — `/api/materials`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/materials` | ❌ | Browse all materials (paginated) |
| POST | `/api/materials/upload` | ✅ | Upload material file |
| GET | `/api/materials/:id` | ❌ | Get material details |
| DELETE | `/api/materials/:id` | ✅ | Delete own material |
| POST | `/api/materials/:id/like` | ✅ | Like a material |
| POST | `/api/materials/:id/download` | ✅ | Increment download count |

### GET `/api/materials`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `type` | string | — | Filter by type (notes, textbook, video) |
| `subject` | string | — | Filter by subject |
| `search` | string | — | Full-text search |
| `difficulty` | string | — | beginner, intermediate, advanced |

---

## Community Routes — `/api/community`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/community/groups` | ✅ | List all groups |
| POST | `/api/community/groups` | ✅ | Create a group |
| GET | `/api/community/groups/:id` | ✅ | Get group details |
| POST | `/api/community/groups/:id/join` | ✅ | Join a group |
| POST | `/api/community/groups/:id/leave` | ✅ | Leave a group |
| GET | `/api/community/groups/:id/messages` | ✅ | Fetch group messages |
| GET | `/api/community/posts` | ✅ | List community posts |
| POST | `/api/community/posts` | ✅ | Create a post |
| POST | `/api/community/posts/:id/like` | ✅ | Like a post |

---

## AI Routes — `/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ask` | ✅ | Send question to KnowNook AI |

### POST `/api/ask`

**Request:**
```json
{ "question": "Explain Newton's second law with examples" }
```

**Response 200:**
```json
{
  "success": true,
  "answer": "Newton's second law states that..."
}
```

---

## Health Check — `/health`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | ❌ | System health status |

**Response 200 (healthy):**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600,
  "version": "1.0.0",
  "env": "production",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

**Response 503 (degraded):**
```json
{
  "status": "degraded",
  "database": "disconnected",
  "uptime": 3600,
  "version": "1.0.0",
  "env": "production",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 300 req / 15 min |
| `/auth/login` | 20 req / 15 min |
| `/auth/send-otp` | 20 req / 15 min |
| `/auth/refresh` | 20 req / 15 min |

---

## WebSocket Events (Socket.io)

Connect to: `ws://localhost:3001`

| Event (emit) | Payload | Description |
|-------------|---------|-------------|
| `join-group` | `{ groupId }` | Join a group chat room |
| `send-message` | `{ groupId, content }` | Send a chat message |
| `user-typing` | `{ groupId, userId }` | Broadcast typing indicator |
| `whiteboard-draw` | `{ groupId, data }` | Share canvas draw event |

| Event (listen) | Payload | Description |
|---------------|---------|-------------|
| `new-message` | `{ message }` | Receive a new chat message |
| `user-joined` | `{ userId }` | Member joined group |
| `user-left` | `{ userId }` | Member left group |
| `typing` | `{ userId }` | Someone is typing |
