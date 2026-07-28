# StudyHub — KnowNook Phase 3: AI Conversation Engine Walkthrough

## Overview

Phase 3 transforms KnowNook from a stateless Gemini wrapper into a production-grade AI learning assistant with full conversation memory, context intelligence, prompt engineering, safety filtering, and token management.

---

## Architecture Diagram

```
User HTTP Request
       │
       ▼
AiEngineController
  (ai-engine.controller.ts)
       │  Validates UUID + message body
       ▼
ConversationEngine.respond()
  (ai/conversation-engine.ts)
       │
       ├─ 1. Verify conversation ownership (DB)
       │
       ├─ 2. Load assets in parallel:
       │      ├─ Messages (from findFullById include)
       │      ├─ Attachments (by conversationId)
       │      └─ Flashcards (by userId)
       │
       ├─ 3. MemoryManager.package()
       │      ├─ Sliding window (last 15 msgs)
       │      ├─ Token budget enforcement (8,000 tokens)
       │      ├─ Keyword relevance scoring for docs
       │      ├─ Document budget (6,000 tokens, truncated)
       │      └─ Flashcard scoring + top-10 selection
       │
       ├─ 4. PromptBuilder (Builder Pattern)
       │      ├─ System instruction (KnowNook persona)
       │      ├─ Conversation summary (if present)
       │      ├─ Document context section
       │      ├─ Flashcard context section
       │      ├─ History turns (sliding window)
       │      └─ Current user message
       │
       ├─ 5. GeminiClient.generate()
       │      ├─ Multi-turn contents[]
       │      ├─ systemInstruction parameter
       │      ├─ Safety settings (4 categories)
       │      ├─ Retry engine (exponential backoff, 3 retries)
       │      └─ Token counts from usageMetadata
       │
       ├─ 6. ResponseProcessor.process()
       │      ├─ Prompt injection sanitization
       │      ├─ Code/math/table detection
       │      └─ Reading time estimation
       │
       ├─ 7. Persist user message (AiMessage)
       ├─ 8. Persist assistant message (AiMessage + metadata)
       ├─ 9. Increment conversation stats
       ├─ 10. Record usage (AiUsage)
       └─ 11. Async summarization trigger (if msgs >= 30)
              └─ SummarizationService → Gemini → DB
```

---

## Files Created (`/backend/src/ai/`)

| File | Responsibility |
| :--- | :--- |
| [`token-counter.ts`](file:///d:/code/code/raw/study-hub/backend/src/ai/token-counter.ts) | Char-to-token estimation, budget enforcement, text truncation |
| [`memory-manager.ts`](file:///d:/code/code/raw/study-hub/backend/src/ai/memory-manager.ts) | Sliding window selection, keyword relevance scoring, document/flashcard budgeting |
| [`prompt-builder.ts`](file:///d:/code/code/raw/study-hub/backend/src/ai/prompt-builder.ts) | Builder-pattern structured prompt assembly (persona, summary, docs, cards, history, question) |
| [`gemini-client.ts`](file:///d:/code/code/raw/study-hub/backend/src/ai/gemini-client.ts) | Provider-agnostic HTTP client with safety settings, retry engine, and token parsing |
| [`response-processor.ts`](file:///d:/code/code/raw/study-hub/backend/src/ai/response-processor.ts) | Injection sanitization, code/math/table detection, reading time annotation |
| [`summarization.service.ts`](file:///d:/code/code/raw/study-hub/backend/src/ai/summarization.service.ts) | Summarization prompt builder, async summary persistence |
| [`conversation-engine.ts`](file:///d:/code/code/raw/study-hub/backend/src/ai/conversation-engine.ts) | Central orchestrator — entire 11-step pipeline |

## Files Modified

| File | Change |
| :--- | :--- |
| [`ai.config.ts`](file:///d:/code/code/raw/study-hub/backend/src/config/ai.config.ts) | Added `GEMINI_MODEL_CONFIG`, `TOKEN_BUDGET`, `MEMORY_CONFIG`, `RETRY_CONFIG`, `GEMINI_SAFETY_SETTINGS` |
| [`ai.types.ts`](file:///d:/code/code/raw/study-hub/backend/src/types/ai.types.ts) | Added `AiEngineRequest`, `AiEngineResponse`, `BuiltPrompt`, `GeminiContent`, `MemoryPackage`, `ContextDocument`, `ContextFlashcard` |
| [`ai.routes.ts`](file:///d:/code/code/raw/study-hub/backend/src/routes/ai.routes.ts) | Registered `POST /api/ai/conversations/:conversationId/ask` |
| [`ai-engine.controller.ts`](file:///d:/code/code/raw/study-hub/backend/src/controllers/ai-engine.controller.ts) | HTTP handler for the engine endpoint |

---

## New Endpoint

| Method | Route | Auth | Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/conversations/:conversationId/ask` | `Bearer JWT` | `{ message: string }` | `{ success, data: { answer, userMessageId, assistantMessageId, meta: { tokens, model, time } } }` |

---

## Memory Strategy

| Strategy | Implementation |
| :--- | :--- |
| **Sliding Window** | Last 15 messages always included |
| **Token Budget** | History capped at 8,000 tokens; documents at 6,000; flashcards at 2,000 |
| **Relevance Scoring** | Keyword overlap score; threshold 0.3 |
| **Summarization Trigger** | Auto-triggered async at 30+ messages |
| **Summary Reuse** | Stored summary injected into all future requests |

---

## Verification

| Check | Result |
| :--- | :--- |
| **Backend TypeScript Build** | ✅ `tsc` — 0 errors |
| **Git Push** | ✅ Commit `e724935` pushed |
| **Legacy `/ask` endpoint** | ✅ Preserved unchanged |

---

## Phase Readiness

The AI Engine is fully ready for **Phase 4 — Real-Time SSE Streaming**. The `GeminiClient` is provider-isolated; adding streaming requires only a `generateStream()` method. `ConversationEngine` can call it without architectural changes.
