import { API_URL } from './api';
import {
  SseCompletedPayload,
  SseMetadataPayload,
  SseTokenPayload,
} from '../types/ai.types';

export interface StreamCallbacks {
  onStarted?: (data: { conversationId: string }) => void;
  onMetadata?: (data: SseMetadataPayload) => void;
  onThinking?: (data: { status: string }) => void;
  onToken?: (data: SseTokenPayload) => void;
  onCompleted?: (data: SseCompletedPayload) => void;
  onError?: (error: { code: string; message: string }) => void;
  onAborted?: (data: { conversationId: string; reason: string }) => void;
}

/**
 * streamService — consumes W3C Server-Sent Events from POST /api/ai/conversations/:id/stream
 * using native fetch API and ReadableStream.
 *
 * Supports JWT authentication headers, line-by-line SSE parsing, typed event handlers,
 * and AbortSignal cancellation.
 */
export const streamService = {
  streamResponse: async (
    conversationId: string,
    message: string,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> => {
    const token = localStorage.getItem('studyhub_token');
    const url = `${API_URL}/api/ai/conversations/${conversationId}/stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ message }),
        signal: abortSignal,
      });

      if (!response.ok) {
        let errMessage = `Stream error: HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.message) errMessage = errData.message;
        } catch { /* ignore JSON parse error */ }

        callbacks.onError?.({ code: `HTTP_${response.status}`, message: errMessage });
        return;
      }

      if (!response.body) {
        callbacks.onError?.({ code: 'NO_STREAM_BODY', message: 'ReadableStream not supported by browser' });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        let currentEvent = 'message';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const rawData = trimmed.slice(5).trim();
            if (!rawData) continue;

            try {
              const data = JSON.parse(rawData);

              switch (currentEvent) {
                case 'conversation_started':
                  callbacks.onStarted?.(data);
                  break;
                case 'metadata':
                  callbacks.onMetadata?.(data);
                  break;
                case 'thinking':
                  callbacks.onThinking?.(data);
                  break;
                case 'token':
                  callbacks.onToken?.(data);
                  break;
                case 'completed':
                  callbacks.onCompleted?.(data);
                  break;
                case 'aborted':
                  callbacks.onAborted?.(data);
                  break;
                case 'error':
                  callbacks.onError?.(data);
                  break;
                default:
                  break;
              }
            } catch {
              // Partial data line — skip
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onAborted?.({ conversationId, reason: 'user_cancelled' });
      } else {
        callbacks.onError?.({ code: 'STREAM_FETCH_FAILED', message: err.message || 'Stream connection failed' });
      }
    }
  },
};

export default streamService;
