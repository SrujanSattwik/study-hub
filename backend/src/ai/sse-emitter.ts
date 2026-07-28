import { Response } from 'express';
import { SseEvent, SseEventType } from '../types/ai.types';
import { SSE_CONFIG } from '../config/ai.config';
import { logger } from '../utils/logger';

/**
 * SseEmitter — writes structured Server-Sent Events to an Express Response
 * stream. Handles HTTP headers, heartbeats, and graceful close.
 *
 * Protocol format per W3C SSE spec:
 *   id: <optional_id>\n
 *   event: <event_name>\n
 *   data: <json_payload>\n\n
 */
export class SseEmitter {
  private readonly res: Response;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private streamTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private eventIndex = 0;
  private closed = false;

  constructor(res: Response) {
    this.res = res;
  }

  /** Set SSE HTTP headers and start heartbeat. */
  initialize(conversationId: string): void {
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache, no-transform');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.setHeader('X-Accel-Buffering', 'no'); // nginx: disable response buffering
    this.res.flushHeaders();

    // Heartbeat to prevent proxy/browser timeouts
    this.heartbeatTimer = setInterval(() => {
      if (!this.closed) {
        this.emit({ event: 'heartbeat', data: { ts: Date.now() } });
      }
    }, SSE_CONFIG.HEARTBEAT_INTERVAL_MS);

    // Hard stream timeout
    this.streamTimeoutTimer = setTimeout(() => {
      if (!this.closed) {
        logger.warn(`⏱️ [SSE] Stream timeout reached for conversation ${conversationId}`);
        this.emit({ event: 'error', data: { code: 'STREAM_TIMEOUT', message: 'Stream timed out' } });
        this.close();
      }
    }, SSE_CONFIG.STREAM_TIMEOUT_MS);
  }

  /** Write a structured SSE event to the response. */
  emit<T = unknown>(event: SseEvent<T>): void {
    if (this.closed || this.res.writableEnded) return;

    const id = event.id ?? String(this.eventIndex++);
    const payload = [
      `id: ${id}`,
      `event: ${event.event}`,
      `data: ${JSON.stringify(event.data)}`,
      '',
      '',
    ].join('\n');

    try {
      this.res.write(payload);
      // Force Node.js to flush TCP buffer immediately — critical for low-latency streaming
      if (typeof (this.res as any).flush === 'function') {
        (this.res as any).flush();
      }
    } catch (err: any) {
      logger.warn(`[SSE] Write failed (client likely disconnected): ${err.message}`);
      this.close();
    }
  }

  /** Tell client how many ms to wait before reconnecting. */
  setRetryDelay(): void {
    if (!this.closed) {
      this.res.write(`retry: ${SSE_CONFIG.MAX_RETRY_DELAY_MS}\n\n`);
    }
  }

  /** Gracefully shut down the emitter and clean up timers. */
  close(): void {
    if (this.closed) return;
    this.closed = true;

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.streamTimeoutTimer) clearTimeout(this.streamTimeoutTimer);

    try {
      if (!this.res.writableEnded) {
        this.res.end();
      }
    } catch (_) { /* already closed */ }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}
