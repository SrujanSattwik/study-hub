import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { BadRequestError } from '../utils/errors';

export class AiService {
  async askGemini(parts: any[], question?: string): Promise<string> {
    let finalParts = parts;
    if (!finalParts && question) {
      finalParts = [{ text: question }];
    }

    if (!finalParts || !finalParts.length) {
      throw new BadRequestError('No question or content provided.');
    }

    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          contents: [{ parts: finalParts }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': config.GEMINI_API_KEY
          },
          timeout: 30000
        }
      );

      let answer = 'No answer found.';
      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const responseParts = candidates[0]?.content?.parts;
        if (responseParts && responseParts.length > 0) {
          answer = responseParts.map((p: any) => p.text || '').join('\n');
        }
      }

      return answer;
    } catch (err: any) {
      logger.error(`[AI SERVICE ERROR] Failed to connect to Gemini API: ${err.response?.data || err.message}`);
      throw new Error('Error contacting Gemini AI services.');
    }
  }
}
export const aiService = new AiService();
