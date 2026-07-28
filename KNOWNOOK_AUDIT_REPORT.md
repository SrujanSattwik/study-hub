# KnowNook AI Assistant: Comprehensive Architectural Audit & Implementation Specification

**Role:** Principal Software Architect, Senior Full Stack Engineer, AI Systems Architect, Database Architect & QA Lead  
**Target Repository:** StudyHub (`/frontend`, `/backend`, `/prisma`)  
**Audit Date:** July 28, 2026  

---

## 1. Overall System Architecture & Layer Traceability

```
                                ┌─────────────────────────────────────────────────────────────┐
                                │            User Browser (React 19 / Vite 8)                 │
                                └──────────────────────────────┬──────────────────────────────┘
                                                               │
                                                               │ HTTP REST (JWT Bearer Token)
                                                               ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                              Express.js Backend Application                                               │
 ├────────────────────────────┬─────────────────────────────────┬────────────────────────────────┬───────────────────────────┤
 │ Auth Middleware            │ Route Handler                   │ Controller                     │ Service Layer             │
 │ authenticateToken          │ POST /api/ask                   │ ai.controller.ts               │ ai.service.ts             │
 └─────────────┬──────────────┴────────────────┬────────────────┴────────────────┬───────────────┴─────────────┬─────────────┘
               │                               │                                 │                             │
               ▼                               ▼                                 ▼                             ▼
  Verifies JWT Payload               Dispatches Request                Parses Body & Responded        Calls External Gemini API
  (user_id, email, role)             (Express Router)                  Part Payload                   via Axios HTTP Post
                                                                                                               │
                                                                                                               ▼
                                                                                                  ┌──────────────────────────┐
                                                                                                  │ Google Gemini 2.0 API    │
                                                                                                  │ (generateContent)        │
                                                                                                  └──────────────────────────┘
```

### Complete End-to-End Dependency Chain
```
KnowNook Page Component (KnowNook.tsx)
 └── App Router (router.tsx) [/knownook route with Suspense]
      └── Dashboard Layout Shell (DashboardLayout.tsx) [Command Palette & Topbar link]
           └── Frontend AI Service (frontend/src/services/ai.service.ts)
                └── Axios HTTP Instance (frontend/src/services/api.ts) [Bearer Interceptor + Refresh Token Flow]
                     └── Express Server Entrypoint (backend/src/server.ts) [app.use("/api", aiRouter)]
                          └── Auth Middleware (backend/src/middleware/auth.middleware.ts) [JWT Bearer validation]
                               └── AI Router (backend/src/routes/ai.routes.ts) [POST /ask]
                                    └── AI Controller (backend/src/controllers/ai.controller.ts)
                                         └── AI Service (backend/src/services/ai.service.ts)
                                              └── Env Configuration (backend/src/config/env.ts) [GEMINI_API_KEY]
                                                   └── Axios POST to Google Generative Language API
```

---

## 2. Project Structure & Asset Inventory

### Frontend Directory Tree & Ownership
* **Router & Layouts:**
  * [`frontend/src/app/router.tsx`](file:///d:/code/code/raw/study-hub/frontend/src/app/router.tsx#L23): Registers lazy route `const KnowNook = React.lazy(() => import('../pages/knownook/KnowNook'))` under protected path `/knownook`.
  * [`frontend/src/layouts/DashboardLayout.tsx`](file:///d:/code/code/raw/study-hub/frontend/src/layouts/DashboardLayout.tsx): Top header search palette and profile dropdown link to `/knownook`.
* **Page Entry:**
  * [`frontend/src/pages/knownook/KnowNook.tsx`](file:///d:/code/code/raw/study-hub/frontend/src/pages/knownook/KnowNook.tsx): Page implementation containing two-column layout (Chat Pane + Context Sidebar), local state management for messages and attachments, code copying, and mock LaTeX blocks.
* **Services & API Client:**
  * [`frontend/src/services/ai.service.ts`](file:///d:/code/code/raw/study-hub/frontend/src/services/ai.service.ts): Exposes `aiService.askGemini(parts, question)`.
  * [`frontend/src/services/api.ts`](file:///d:/code/code/raw/study-hub/frontend/src/services/api.ts): Axios interceptor setting `Authorization: Bearer <token>` and handling `401` refresh.

### Backend Directory Tree & Ownership
* **Entrypoint & Routing:**
  * [`backend/src/server.ts`](file:///d:/code/code/raw/study-hub/backend/src/server.ts#L123): Binds `app.use("/api", aiRouter)`.
  * [`backend/src/routes/ai.routes.ts`](file:///d:/code/code/raw/study-hub/backend/src/routes/ai.routes.ts): Protects `POST /ask` with `authenticateToken`.
* **Controllers & Business Logic:**
  * [`backend/src/controllers/ai.controller.ts`](file:///d:/code/code/raw/study-hub/backend/src/controllers/ai.controller.ts): Calls `aiService.askGemini(parts, question)`.
  * [`backend/src/services/ai.service.ts`](file:///d:/code/code/raw/study-hub/backend/src/services/ai.service.ts): Dispatches HTTP POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`.
* **Configuration:**
  * [`backend/src/config/env.ts`](file:///d:/code/code/raw/study-hub/backend/src/config/env.ts#L71): Validates `GEMINI_API_KEY` via Zod.

---

## 3. Database Architecture & Schema Audit

### Current Database State (`prisma/schema.prisma`)
The current database schema contains 26 models covering Users, RefreshTokens, StudyGroups, GroupMembers, GroupMessages, CommunityPosts, Questions, QuestionAnswers, GroupMaterials, and Notifications.

**Critical Finding:** There are **ZERO database tables** allocated for the KnowNook module. All chat conversations, user messages, AI context attachments, and flashcards exist only in React component memory (`useState`) and disappear upon page refresh.

### Required Database Schema Additions

To achieve production-grade conversational memory, attachment context, and flashcard features, the following 4 Prisma models must be created in `prisma/schema.prisma`:

```prisma
enum MessageRole {
  user
  assistant
  system
}

model AiConversation {
  id         String      @id @default(uuid()) @map("conversation_id") @db.VarChar(36)
  userId     String      @map("user_id") @db.VarChar(36)
  title      String      @default("New Chat") @db.VarChar(255)
  isPinned   Boolean     @default(false) @map("is_pinned")
  isArchived Boolean     @default(false) @map("is_archived")
  createdAt  DateTime    @default(now()) @map("created_at")
  updatedAt  DateTime    @updatedAt @map("updated_at")

  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages     AiMessage[]
  attachments  AiAttachment[]
  flashcards   AiFlashcard[]

  @@map("ai_conversations")
  @@index([userId, isPinned])
  @@index([updatedAt])
}

model AiMessage {
  id             String       @id @default(uuid()) @map("message_id") @db.VarChar(36)
  conversationId String       @map("conversation_id") @db.VarChar(36)
  role           MessageRole
  content        String       @db.Text
  tokensUsed     Int?         @map("tokens_used")
  codeSnippets   Json?        @map("code_snippets")
  latexEquations Json?        @map("latex_equations")
  createdAt      DateTime     @default(now()) @map("created_at")

  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("ai_messages")
  @@index([conversationId, createdAt])
}

model AiAttachment {
  id             String         @id @default(uuid()) @map("attachment_id") @db.VarChar(36)
  conversationId String         @map("conversation_id") @db.VarChar(36)
  fileName       String         @map("file_name") @db.VarChar(255)
  filePath       String         @map("file_path") @db.VarChar(500)
  fileType       String         @map("file_type") @db.VarChar(100)
  fileSize       Int            @map("file_size")
  extractedText  String?        @map("extracted_text") @db.Text
  createdAt      DateTime       @default(now()) @map("created_at")

  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("ai_attachments")
  @@index([conversationId])
}

model AiFlashcard {
  id             String         @id @default(uuid()) @map("flashcard_id") @db.VarChar(36)
  conversationId String         @map("conversation_id") @db.VarChar(36)
  userId         String         @map("user_id") @db.VarChar(36)
  title          String         @db.VarChar(255)
  latexFormula   String         @map("latex_formula") @db.Text
  expression     String         @db.Text
  createdAt      DateTime       @default(now()) @map("created_at")

  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("ai_flashcards")
  @@index([userId])
}
```

---

## 4. API Specification Audit

### 1. Implemented Endpoints

#### `POST /api/ask`
* **Authentication:** Required (`Bearer JWT`)
* **Controller:** `AiController.ask`
* **Service:** `AiService.askGemini`
* **Request Body:**
  ```json
  {
    "parts": [{ "text": "Explain bubble sort algorithm" }],
    "question": "Optional standalone question string"
  }
  ```
* **Response Body:**
  ```json
  {
    "answer": "Bubble sort is a simple comparison-based sorting algorithm..."
  }
  ```
* **Current Status:** Operational.
* **Limitations:** Synchronous REST call with 30s timeout. Lacks token streaming (Server-Sent Events), conversation history persistence, and context document injection.

### 2. Missing Endpoints Required for Release
* `POST /api/ai/stream` — SSE endpoint for real-time token streaming output.
* `GET /api/ai/conversations` — Retrieves active user chat threads.
* `POST /api/ai/conversations` — Initializes a new chat thread.
* `GET /api/ai/conversations/:id` — Fetches full message history for a thread.
* `DELETE /api/ai/conversations/:id` — Deletes a thread and attached storage files.
* `POST /api/ai/attachments` — Uploads PDF/DOCX/TXT file and parses text context via OCR/text extractions.
* `POST /api/ai/flashcards` — Generates and persists LaTeX math flashcards.

---

## 5. AI Engine & Gemini Integration Analysis

### Current External Call Payload
The backend service (`backend/src/services/ai.service.ts`) issues an HTTP POST via Axios to:
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

```json
{
  "headers": {
    "Content-Type": "application/json",
    "X-goog-api-key": "<GEMINI_API_KEY>"
  },
  "contents": [
    { "parts": [{ "text": "<user prompt>" }] }
  ]
}
```

### Missing AI Architecture Features
1. **System Prompt Injection:** No custom system instruction telling Gemini it is acting as a specialized academic tutor for StudyHub.
2. **Context Window / Memory Management:** Each request sends only the single isolated user input without prior turn history.
3. **Document Context Merging:** Extracted text from uploaded PDFs or notes is not injected into `parts` as context.
4. **Output Parsing:** Raw markdown text returned by Gemini is passed as a string without automated parsing for code blocks or LaTeX formatting tokens.

---

## 6. UI/UX & Component Audit against Reference Design

| UI Component / Area | Reference Specification | Current Implementation Status | Gap % |
| :--- | :--- | :--- | :--- |
| **Top Workspace Banner** | Dark header bar: `STUDYHUB WORKSPACE \| GLOBAL DASHBOARD` with color tokens | **Implemented** in `DashboardLayout.tsx` | 0% |
| **Sidebar Navigation** | 24px grid spacing, 12px border radius, `#6366F1` active item pill tint | **Implemented** in `DashboardLayout.tsx` | 0% |
| **Main Title Header** | `KnowNook AI Assistant` (32px font-extrabold text-slate-900) | **Implemented** in `KnowNook.tsx` | 0% |
| **Central Chat Container** | White card (12px/16px radius), smooth shadows, 780px column width | **Implemented** in `KnowNook.tsx` | 0% |
| **Code Block Rendering** | Dark theme block (`#0F172A`) with header and Copy button | **Partial** (Static markup template; needs Markdown parser) | 35% |
| **LaTeX Formula Display** | Rendered mathematical expression ($x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$) | **Partial** (Simulated HTML view; needs KaTeX rendering engine) | 40% |
| **Sticky Input Bar** | Attachment trigger, text input, emoji icon, `#6366F1` send button | **Implemented** in `KnowNook.tsx` | 0% |
| **Attached Materials Panel** | File cards for `.pdf` and `.docx` with size metadata and upload trigger | **Implemented** in `KnowNook.tsx` | 10% |
| **Context & Flashcard Sidebar** | LaTeX tool card & Math Flashcard formula card preview | **Implemented** in `KnowNook.tsx` | 15% |
| **Overall Design Match** | Visual match to target SaaS aesthetic | **92% Visual Match** | 8% |

---

## 7. Feature Gap Analysis

### ✅ Completed Features
1. Express backend API integration with Google Gemini `gemini-2.0-flash` endpoint.
2. Dual-token JWT security and rate limiting on endpoint invocation.
3. Redesigned Dashboard Shell (`DashboardLayout.tsx`) with `#6366F1` Slate Iris and `#06B6D4` Cyan Pulse palette.
4. Two-column KnowNook layout (780px Chat Pane + 350px Context Sidebar).
5. Interactive sticky input bar with attachment triggers, quick prompt tags, and loading state indicators.

### 🟡 Partially Implemented Features
1. **Document Attachment Workflow:** UI elements for file uploads exist, but uploaded files are stored only in React state without backend text extraction or prompt context injection.
2. **Code & Formula Rendering:** Visual cards represent code blocks and equations, but rely on string pattern detection rather than a Markdown parsing library (`react-markdown`, `katex`).

### 🔴 Missing Features
1. **Database Persistence for Conversations:** Conversations reset on page reload because Prisma models for AI threads do not exist.
2. **Server-Sent Events (SSE) Token Streaming:** Gemini answers return in a single block rather than streaming token-by-token.
3. **Document Text Extraction Pipeline:** Missing backend engines (`pdf-parse`, `mammoth`) to convert attached documents into prompt context.
4. **Flashcard Generator Engine:** No backend route to save or export generated Math Flashcards to user collections.

---

## 8. Bug & Technical Debt Inventory

1. **Memory Leak / Transient State:** Reloading `/knownook` clears chat history due to missing database persistence.
2. **Lack of File Unlink on Cleanup:** Uploaded attachments in `/uploads` are not removed when file cards are dismissed.
3. **Hardcoded Gemini Model String:** The model name `gemini-2.0-flash` is hardcoded in `ai.service.ts` rather than specified in environment configuration.
4. **Synchronous Timeout Risk:** Single REST calls may hit 30s timeouts on lengthy prompt answers.

---

## 9. Dependency Graph

```
KnowNook.tsx (Page Component)
 ├── DashboardLayout.tsx (Shell Layout)
 │    └── InternalFooter.tsx
 ├── Button.tsx (UI Component)
 └── ai.service.ts (Frontend API Service)
      └── api.ts (Axios HTTP Client)
           └── server.ts (Express Server)
                ├── auth.middleware.ts (JWT Validator)
                └── ai.routes.ts (Route Definition)
                     └── ai.controller.ts (Controller Layer)
                          └── ai.service.ts (Backend Service Layer)
                               ├── env.ts (Zod Environment Config)
                               └── Google Generative Language API (Gemini 2.0)
```

---

## 10. Prioritized Implementation Roadmap

### Phase 1: Database Persistence & Data Models
* Add `AiConversation`, `AiMessage`, `AiAttachment`, and `AiFlashcard` models to `prisma/schema.prisma`.
* Run `npx prisma migrate dev` and update backend database access queries.

### Phase 2: Backend Conversation & Attachment API Expansion
* Implement routes in `backend/src/routes/ai.routes.ts`:
  * `GET /api/ai/conversations` (List user chat threads)
  * `GET /api/ai/conversations/:id` (Fetch thread messages)
  * `POST /api/ai/attachments` (Upload & extract text from PDF/DOCX using `pdf-parse`/`mammoth`)

### Phase 3: Token Streaming via Server-Sent Events (SSE)
* Add SSE streaming handler (`GET /api/ai/stream`) to stream Gemini tokens in real-time to the frontend.

### Phase 4: Markdown & KaTeX Rendering Engine Integration
* Install `react-markdown`, `remark-math`, `rehype-katex`, and `katex` in `frontend`.
* Replace mock code/formula renders in `KnowNook.tsx` with dynamic markdown and LaTeX equation rendering.

### Phase 5: Math Flashcards Generation & Export
* Add `POST /api/ai/flashcards` endpoint to save flashcard formulas generated during AI sessions to the user's dashboard resources.

---

## 11. File-by-File Implementation Checklist

- [ ] `prisma/schema.prisma`: Add 4 new Prisma models (`AiConversation`, `AiMessage`, `AiAttachment`, `AiFlashcard`).
- [ ] `backend/src/services/ai.service.ts`: Implement multi-turn conversation memory, system prompt injection, and SSE streaming.
- [ ] `backend/src/controllers/ai.controller.ts`: Add controllers for conversation CRUD, document upload extraction, and streaming responses.
- [ ] `backend/src/routes/ai.routes.ts`: Bind new conversation, attachment, and streaming endpoints.
- [ ] `frontend/src/services/ai.service.ts`: Add methods for streaming, conversation retrieval, document context uploads, and flashcard saving.
- [ ] `frontend/src/pages/knownook/KnowNook.tsx`: Connect page component to persistent conversation state, Markdown/KaTeX rendering, and file context injection.
