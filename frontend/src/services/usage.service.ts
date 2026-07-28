import api from './api';
import { AiUsageStats } from '../types/ai.types';

export const usageService = {
  getUsageStats: async (signal?: AbortSignal): Promise<AiUsageStats> => {
    const res = await api.get<{ success: boolean; data: AiUsageStats }>('/api/ai/usage', { signal });
    return res.data.data;
  },
};

export default usageService;
