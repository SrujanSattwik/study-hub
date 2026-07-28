import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { streamingConversationEngine } from '../ai/streaming-conversation-engine';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const streamParamsSchema = z.object({
  conversationId: z.string().uuid('conversationId must be a valid UUID'),
});

const streamBodySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(32_000, 'Message too long'),
});

/**
 * AiStreamController — HTTP handler for SSE streaming endpoint.
 *
 * POST /api/ai/conversations/:conversationId/stream
 *
 * Why POST (not GET)?
 *   - The user message must be in the request body.
 *   - GET requests cannot reliably carry a body.
 *   - POST body is never logged/cached by proxies.
 *
 * The response is a long-lived SSE stream — the client must read it as
 * an event stream (EventSource API or fetch with ReadableStream).
 *
 * Error handling:
 *   - Validation errors are sent as SSE `error` events (not HTTP 4xx),
 *     because once the SSE headers are set, HTTP status codes are frozen.
 *   - Hard errors before headers are set return normal JSON 400/500.
 */
export class AiStreamController {
  stream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');

      const params = streamParamsSchema.parse({ conversationId: req.params.conversationId });
      const body = streamBodySchema.parse(req.body);

      logger.info(
        `📡 [STREAM CTRL] user=${req.user.user_id} conv=${params.conversationId} msg_len=${body.message.length}`
      );

      await streamingConversationEngine.stream(
        {
          userId: req.user.user_id,
          conversationId: params.conversationId,
          userMessage: body.message,
        },
        res
      );
    } catch (err: any) {
      // Validation or early errors — headers not yet set
      if (!res.headersSent) {
        next(err);
      }
      // If headers already sent (SSE active), engine handles the error event internally
    }
  };
}

export const aiStreamController = new AiStreamController();
