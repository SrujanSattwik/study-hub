# StudyClub — Architecture

## System Overview

StudyClub is a full-stack web application built on a layered, service-oriented architecture. The frontend is a Single Page Application (SPA) that communicates with the backend via a REST API and WebSocket connections.

```
┌────────────────────────────────────────────────────────────┐
│                        Browser                             │
│        React SPA (Vite + TypeScript + Tailwind)            │
│   TanStack Query  │  React Router  │  Socket.io Client     │
└───────────────┬───────────────────────────────┬────────────┘
                │ HTTP REST (Axios)             │ WebSocket
                ▼                               ▼
┌────────────────────────────────────────────────────────────┐
│                     Backend (Node.js)                      │
│              Express TypeScript API — Port 3001            │
│                                                            │
│  Routes → Controllers → Services → Database               │
│                                                            │
│  Middleware Stack:                                         │
│   Helmet │ CORS │ Rate Limit │ Compression │ Cookie Parser │
│   Perf Logger │ Error Handler                              │
│                                                            │
│  Socket.io Server (real-time events)                       │
└───────────────────────────────┬────────────────────────────┘
                                │ Prisma ORM
                                ▼
┌────────────────────────────────────────────────────────────┐
│                    PostgreSQL 16                           │
│               32 models, named volumes                     │
└────────────────────────────────────────────────────────────┘
```

---

## Backend Layer Architecture

```
src/
├── server.ts           Entry point — mounts all middleware + routes
├── routes/             Express routers (thin — delegate to controllers)
├── controllers/        Request handlers — validate input, call service
├── services/           Business logic — DB queries, transformations
├── middleware/         Auth, errors, performance profiler
├── database/
│   └── client.ts       Prisma client singleton + testDbConnection()
├── validators/         Zod schemas for request body validation
├── utils/
│   ├── config.ts       Env var validation with Zod
│   └── logger.ts       Winston structured logger
└── types/              Shared TypeScript interfaces
```

### Request Lifecycle

```
Request
  → Helmet (security headers)
  → CORS
  → Rate Limiter
  → Body Parser + Cookie Parser
  → Auth Middleware (JWT verify)
  → Perf Logger (start timer)
  → Router → Controller → Service → Prisma → PostgreSQL
  → Perf Logger (log duration)
  → Response
  → Error Handler (if thrown)
```

---

## Frontend Layer Architecture

```
src/
├── app/
│   ├── App.tsx         Root router configuration
│   └── providers.tsx   QueryClient + AuthContext providers
├── pages/              Full route-level components
├── components/
│   ├── ui/             Reusable primitives (Button, Card, Modal)
│   ├── forms/          Form components with validation
│   └── shared/         ProtectedRoute, Layout wrappers
├── hooks/              Custom React hooks (useSocket, useAuth)
├── services/
│   └── api.ts          Axios instance with JWT + refresh interceptors
├── context/
│   └── AuthContext.tsx Global auth state (user, token, isAuthenticated)
└── types/              TypeScript interfaces matching API contracts
```

### Authentication Flow

```
1. POST /auth/login
   → Backend validates credentials, issues:
     - Short-lived JWT access token (15m) → returned in response body
     - Long-lived refresh token (30d) → set as HttpOnly cookie

2. Frontend stores access token in localStorage
   → Axios interceptor attaches as Authorization: Bearer <token>

3. On 401 response:
   → Axios interceptor silently calls POST /auth/refresh
   → HttpOnly cookie sent automatically (withCredentials: true)
   → New access token returned → retry original request

4. On refresh failure:
   → Clear localStorage → redirect to /login
```

---

## Real-time Architecture (Socket.io)

```
Backend: io = new SocketServer(httpServer)
         initSocket(io) registers all event handlers

Events:
  join-group      → user joins a group chat room
  send-message    → broadcast message to group room
  user-typing     → typing indicator broadcast
  whiteboard-draw → canvas draw events broadcast
  user-presence   → online/offline status updates
```

---

## Database Schema Summary

32 Prisma models organized into functional domains:

| Domain | Models |
|--------|--------|
| Auth | User, RefreshToken |
| Groups | StudyGroup, GroupMember, GroupAnnouncement |
| Meetings | GroupMeeting, MeetingParticipant, MeetingRecording |
| Chat | GroupMessage, MessageReaction, MessageAttachment |
| Community | CommunityPost, PostLike, PostComment |
| Q&A | Question, QuestionAnswer, AnswerVote, AnswerAttachment |
| Materials | Material, GroupMaterial, MaterialCategory, GroupMaterialLike, GroupMaterialComment, MaterialDownload |
| Events | StudyEvent, EventRsvp |
| Tracking | ActivityLog, Notification, UserBookmark, Report, Invitation |
| Scheduler | SyllabusItem |

---

## Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Compose                        │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ │
│  │  postgres   │  │   backend   │  │    frontend    │ │
│  │  :5432      │  │   :3001     │  │    :80         │ │
│  │             │◄─┤  Express TS │  │  Nginx + SPA   │ │
│  │ pg:16-alpine│  │  node:20-   │  │  nginx:alpine  │ │
│  │             │  │  alpine     │  │                │ │
│  └──────┬──────┘  └─────────────┘  └────────────────┘ │
│         │                                               │
│  Named Volume: postgres_data, uploads_data              │
│  Network: studyclub-net (bridge)                        │
└─────────────────────────────────────────────────────────┘
```
