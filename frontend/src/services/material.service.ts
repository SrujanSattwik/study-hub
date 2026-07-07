import api from './api';
import { Material } from '../types';

export interface GetMaterialsResponse {
  page: number;
  totalPages: number;
  totalItems: number;
  materials: Material[];
}

export const materialService = {
  getMaterials: async (
    type?: string,
    page = 1,
    limit = 5,
    search?: string,
    subject?: string,
    sort?: string
  ): Promise<GetMaterialsResponse> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (subject) params.append('subject', subject);
    if (sort) params.append('sort', sort);
    
    const res = await api.get(`/api/materials?${params.toString()}`);
    return res.data;
  },

  uploadMaterial: async (formData: FormData): Promise<Material> => {
    const res = await api.post('/api/materials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  trackDownload: async (id: string): Promise<{ downloadCount: number }> => {
    const res = await api.post(`/api/materials/${id}/download`);
    return res.data;
  },
};
export default materialService;
