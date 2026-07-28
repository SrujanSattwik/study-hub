import api from './api';
import { AiAttachment } from '../types/ai.types';

export const attachmentService = {
  listAttachments: async (
    conversationId: string,
    signal?: AbortSignal
  ): Promise<AiAttachment[]> => {
    const res = await api.get<{ success: boolean; data: AiAttachment[] }>(
      `/api/ai/conversations/${conversationId}/attachments`,
      { signal }
    );
    return res.data.data;
  },

  registerAttachment: async (
    conversationId: string,
    fileData: {
      originalName: string;
      storedName: string;
      extension: string;
      mimeType: string;
      fileSize: number;
      uploadPath: string;
      extractedText?: string;
    },
    signal?: AbortSignal
  ): Promise<AiAttachment> => {
    const res = await api.post<{ success: boolean; data: AiAttachment }>(
      `/api/ai/conversations/${conversationId}/attachments`,
      fileData,
      { signal }
    );
    return res.data.data;
  },

  deleteAttachment: async (attachmentId: string, signal?: AbortSignal): Promise<void> => {
    await api.delete(`/api/ai/attachments/${attachmentId}`, { signal });
  },
};

export default attachmentService;
