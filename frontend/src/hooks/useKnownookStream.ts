import { useState, useRef, useCallback } from 'react';
import streamService from '../services/stream.service';
import { AiMessage, SseCompletedPayload, SseMetadataPayload } from '../types/ai.types';

export interface UseKnownookStreamReturn {
  isStreaming: boolean;
  streamingText: string;
  thinkingStatus: string | null;
  metadata: SseMetadataPayload | null;
  errorMessage: string | null;
  startStream: (conversationId: string, userPrompt: string, onComplete?: (payload: SseCompletedPayload) => void) => Promise<void>;
  stopStream: () => void;
}

export function useKnownookStream(): UseKnownookStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<SseMetadataPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setThinkingStatus(null);
  }, []);

  const startStream = useCallback(
    async (
      conversationId: string,
      userPrompt: string,
      onComplete?: (payload: SseCompletedPayload) => void
    ) => {
      // Abort any active stream
      stopStream();

      setIsStreaming(true);
      setStreamingText('');
      setThinkingStatus('Connecting to KnowNook AI...');
      setMetadata(null);
      setErrorMessage(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await streamService.streamResponse(
        conversationId,
        userPrompt,
        {
          onStarted: () => {
            setThinkingStatus('Conversation initialized...');
          },
          onMetadata: (meta) => {
            setMetadata(meta);
          },
          onThinking: (data) => {
            setThinkingStatus(data.status);
          },
          onToken: (data) => {
            setThinkingStatus(null);
            setStreamingText((prev) => prev + data.text);
          },
          onCompleted: (payload) => {
            setIsStreaming(false);
            setThinkingStatus(null);
            setStreamingText('');
            onComplete?.(payload);
          },
          onAborted: () => {
            setIsStreaming(false);
            setThinkingStatus(null);
          },
          onError: (err) => {
            setIsStreaming(false);
            setThinkingStatus(null);
            setErrorMessage(err.message || 'Streaming failed');
          },
        },
        controller.signal
      );
    },
    [stopStream]
  );

  return {
    isStreaming,
    streamingText,
    thinkingStatus,
    metadata,
    errorMessage,
    startStream,
    stopStream,
  };
}
