import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { GEMINI_MODEL_CONFIG, GEMINI_SAFETY_SETTINGS, RETRY_CONFIG } from '../config/ai.config';
import { BuiltPrompt } from '../types/ai.types';

interface GeminiApiResponse {
  answer: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  finishReason: string;
  model: string;
}

/**
 * GeminiClient — thin, provider-agnostic HTTP wrapper around the Gemini
 * generateContent API. Business logic lives in ConversationEngine.
 *
 * Supports:
 *   - Multi-turn conversation via contents[]
 *   - systemInstruction parameter
 *   - Safety settings
 *   - Exponential-backoff retry engine
 *   - Configurable model, temperature, topP, topK, maxOutputTokens
 *
 * To swap providers (Claude, OpenAI, local LLM), replace only this file.
 * ConversationEngine remains untouched.
 */
export class GeminiClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.model = GEMINI_MODEL_CONFIG.model;
    this.baseUrl = `${GEMINI_MODEL_CONFIG.baseUrl}/${this.model}:generateContent`;
  }

  async generate(prompt: BuiltPrompt): Promise<GeminiApiResponse> {
    const payload = this.buildPayload(prompt);
    return this.executeWithRetry(payload);
  }

  private buildPayload(prompt: BuiltPrompt): Record<string, any> {
    return {
      systemInstruction: {
        parts: [{ text: prompt.systemInstruction }],
      },
      contents: prompt.contents,
      generationConfig: {
        temperature: GEMINI_MODEL_CONFIG.temperature,
        topP: GEMINI_MODEL_CONFIG.topP,
        topK: GEMINI_MODEL_CONFIG.topK,
        maxOutputTokens: GEMINI_MODEL_CONFIG.maxOutputTokens,
      },
      safetySettings: GEMINI_SAFETY_SETTINGS,
    };
  }

  private async executeWithRetry(payload: Record<string, any>, attempt = 1): Promise<GeminiApiResponse> {
    try {
      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': config.GEMINI_API_KEY,
        },
        timeout: GEMINI_MODEL_CONFIG.timeoutMs,
      });

      return this.parseResponse(response.data);
    } catch (err: any) {
      const statusCode = err.response?.status;
      const isRetryable = RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(statusCode);

      if (isRetryable && attempt <= RETRY_CONFIG.MAX_RETRIES) {
        const delay = Math.min(
          RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
          RETRY_CONFIG.MAX_DELAY_MS
        );
        logger.warn(`🔄 [GEMINI CLIENT] Retry ${attempt}/${RETRY_CONFIG.MAX_RETRIES} after ${delay}ms (status: ${statusCode})`);
        await this.sleep(delay);
        return this.executeWithRetry(payload, attempt + 1);
      }

      const errorMessage = err.response?.data?.error?.message || err.message;
      logger.error(`❌ [GEMINI CLIENT] Failed after ${attempt} attempt(s): ${errorMessage}`);
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }

  private parseResponse(data: any): GeminiApiResponse {
    const candidates = data?.candidates || [];
    if (!candidates.length) {
      throw new Error('Gemini returned no candidates in response');
    }

    const candidate = candidates[0];
    const responseParts = candidate?.content?.parts || [];
    const answer = responseParts.map((p: any) => p.text || '').join('\n').trim() || 'No response generated.';

    const finishReason = candidate?.finishReason || 'STOP';
    const usageMetadata = data?.usageMetadata || {};

    const promptTokens = usageMetadata.promptTokenCount || 0;
    const completionTokens = usageMetadata.candidatesTokenCount || 0;
    const totalTokens = usageMetadata.totalTokenCount || (promptTokens + completionTokens);

    return {
      answer,
      promptTokens,
      completionTokens,
      totalTokens,
      finishReason,
      model: this.model,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const geminiClient = new GeminiClient();
