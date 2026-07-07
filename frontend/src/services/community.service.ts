import api from './api';
import { StudyGroup, GroupEvent, ActiveMeeting, OnlineUser, Notification } from '../types';

export interface HomeBundle {
  stats: {
    activeMembers: number;
    myGroups: number;
    onlineUsers: number;
    activeMeetings: number;
    questionsAskedToday: number;
    questionsSolved: number;
    materialsShared: number;
    upcomingEvents: number;
  };
  joinedGroups: StudyGroup[];
  exploreGroups: StudyGroup[];
  feed: any[];
  events: GroupEvent[];
  suggestedGroups: StudyGroup[];
  activeMeetings: ActiveMeeting[];
  onlineUsers: OnlineUser[];
  notifications: Notification[];
  challenges: any[];
}

export const communityService = {
  getHomeBundle: async (): Promise<HomeBundle> => {
    const res = await api.get('/api/community/home-bundle');
    return res.data.bundle;
  },

  listGroups: async (category?: string, search?: string): Promise<StudyGroup[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await api.get(`/api/community/groups?${params.toString()}`);
    return res.data.groups;
  },

  createGroup: async (name: string, description: string, category?: string, meetingSchedule?: string): Promise<{ groupId: string }> => {
    const res = await api.post('/api/community/groups', { name, description, category, meetingSchedule });
    return res.data;
  },

  joinGroup: async (id: string): Promise<void> => {
    await api.post(`/api/community/groups/${id}/join`);
  },

  leaveGroup: async (id: string): Promise<void> => {
    await api.post(`/api/community/groups/${id}/leave`);
  },

  getGroupWorkspace: async (id: string): Promise<any> => {
    const res = await api.get(`/api/community/groups/${id}`);
    return res.data;
  },

  getFeed: async (): Promise<any[]> => {
    const res = await api.get('/api/community/feed');
    return res.data.posts;
  },

  createPost: async (formData: FormData): Promise<void> => {
    await api.post('/api/community/feed', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  likePost: async (id: string): Promise<{ liked: boolean }> => {
    const res = await api.post(`/api/community/feed/${id}/like`);
    return res.data;
  },

  getComments: async (id: string): Promise<any[]> => {
    const res = await api.get(`/api/community/feed/${id}/comments`);
    return res.data.comments;
  },

  addComment: async (postId: string, content: string, parentId?: string | null): Promise<void> => {
    await api.post(`/api/community/feed/${postId}/comments`, { content, parentId });
  },

  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/api/community/feed/${id}`);
  },

  getGroupMaterials: async (groupId: string, categoryId?: string | null): Promise<any> => {
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    const res = await api.get(`/api/community/groups/${groupId}/materials?${params.toString()}`);
    return res.data;
  },

  createGroupFolder: async (groupId: string, name: string, parentId?: string | null): Promise<{ folderId: string }> => {
    const res = await api.post(`/api/community/groups/${groupId}/materials/folders`, { name, parentId });
    return res.data;
  },

  uploadGroupMaterial: async (groupId: string, formData: FormData): Promise<void> => {
    await api.post(`/api/community/groups/${groupId}/materials`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
export default communityService;
