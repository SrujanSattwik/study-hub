import api from './api';

export const aiService = {
  askGemini: async (parts: any[], question?: string): Promise<string> => {
    const res = await api.post('/api/ask', { parts, question });
    return res.data?.answer || 'No answer found.';
  },
};
export default aiService;
