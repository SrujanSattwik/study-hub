import { Request, Response, NextFunction } from 'express';
import { conversationEngine } from '../ai/conversation-engine';
import { BadRequestError } from '../utils/errors';
import { z } from 'zod';

const askSchema = z.object({
  conversationId: z.string().uuid('conversationId must be a valid UUID'),
  message: z.string().min(1, 'Message cannot be empty').max(32_000, 'Message too long'),
});

/**
 * AiEngineController — exposes the ConversationEngine as a REST endpoint.
 *
 * POST /api/ai/conversations/:conversationId/ask
 *
 * This replaces the stateless /api/ask for all conversation-aware queries.
 * The legacy /api/ask endpoint remains for backward compatibility.
 */
export class AiEngineController {
  async ask(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');

      const validated = askSchema.parse({
        conversationId: req.params.conversationId,
        message: req.body.message,
      });

      const engineResponse = await conversationEngine.respond({
        userId: req.user.user_id,
        conversationId: validated.conversationId,
        userMessage: validated.message,
      });

      res.json({
        success: true,
        data: {
          answer: engineResponse.answer,
          conversationId: engineResponse.conversationId,
          userMessageId: engineResponse.userMessageId,
          assistantMessageId: engineResponse.assistantMessageId,
          meta: {
            promptTokens: engineResponse.promptTokens,
            completionTokens: engineResponse.completionTokens,
            totalTokens: engineResponse.totalTokens,
            generationTimeMs: engineResponse.generationTimeMs,
            model: engineResponse.model,
            finishReason: engineResponse.finishReason,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiEngineController = new AiEngineController();
