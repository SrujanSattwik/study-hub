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

  listGroups: async (category?: string, search?: string, sort?: string): Promise<StudyGroup[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    const res = await api.get(`/api/community/groups?${params.toString()}`);
    return res.data.groups;
  },

  createGroup: async (name: string, description: string, category?: string, meetingSchedule?: string, icon?: string): Promise<{ groupId: string }> => {
    const res = await api.post('/api/community/groups', { name, description, category, meetingSchedule, icon });
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

  deleteGroupMaterial: async (groupId: string, materialId: string): Promise<void> => {
    await api.delete(`/api/community/groups/${groupId}/materials/${materialId}`);
  },

  trackGroupMaterialDownload: async (groupId: string, materialId: string): Promise<void> => {
    await api.post(`/api/community/groups/${groupId}/materials/${materialId}/download`);
  },

  getGroupAnnouncements: async (groupId: string): Promise<any[]> => {
    const res = await api.get(`/api/community/groups/${groupId}/announcements`);
    return res.data.announcements;
  },

  createGroupAnnouncement: async (groupId: string, title: string, content: string, pinned = false): Promise<any> => {
    const res = await api.post(`/api/community/groups/${groupId}/announcements`, { title, content, pinned });
    return res.data.announcement;
  },

  updateGroupAnnouncement: async (groupId: string, announcementId: string, title: string, content: string, pinned = false): Promise<any> => {
    const res = await api.patch(`/api/community/groups/${groupId}/announcements/${announcementId}`, { title, content, pinned });
    return res.data.announcement;
  },

  deleteGroupAnnouncement: async (groupId: string, announcementId: string): Promise<void> => {
    await api.delete(`/api/community/groups/${groupId}/announcements/${announcementId}`);
  },

  getGroupQuestions: async (groupId: string): Promise<any[]> => {
    const res = await api.get(`/api/community/groups/${groupId}/questions`);
    return res.data.questions;
  },

  createGroupQuestion: async (groupId: string, formData: FormData): Promise<any> => {
    const res = await api.post(`/api/community/groups/${groupId}/questions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.question;
  },

  updateGroupQuestionStatus: async (groupId: string, questionId: string, isSolved: boolean): Promise<any> => {
    const res = await api.patch(`/api/community/groups/${groupId}/questions/${questionId}`, { isSolved });
    return res.data.question;
  },

  deleteGroupQuestion: async (groupId: string, questionId: string): Promise<void> => {
    await api.delete(`/api/community/groups/${groupId}/questions/${questionId}`);
  },

  createGroupAnswer: async (groupId: string, questionId: string, formData: FormData): Promise<any> => {
    const res = await api.post(`/api/community/groups/${groupId}/questions/${questionId}/answers`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.answer;
  },

  deleteGroupAnswer: async (groupId: string, answerId: string): Promise<void> => {
    await api.delete(`/api/community/groups/${groupId}/answers/${answerId}`);
  },

  getGroupMeetings: async (groupId: string): Promise<any[]> => {
    const res = await api.get(`/api/community/groups/${groupId}/meetings`);
    return res.data.meetings;
  },

  createGroupMeeting: async (groupId: string, title: string): Promise<any> => {
    const res = await api.post(`/api/community/groups/${groupId}/meetings`, { title });
    return res.data.meeting;
  },

  endGroupMeeting: async (groupId: string, meetingId: string): Promise<any> => {
    const res = await api.patch(`/api/community/groups/${groupId}/meetings/${meetingId}/end`);
    return res.data.meeting;
  },

  renameGroupFolder: async (groupId: string, folderId: string, name: string): Promise<any> => {
    const res = await api.patch(`/api/community/groups/${groupId}/materials/folders/${folderId}`, { name });
    return res.data.folder;
  },

  deleteGroupFolder: async (groupId: string, folderId: string): Promise<void> => {
    await api.delete(`/api/community/groups/${groupId}/materials/folders/${folderId}`);
  },

  acceptGroupAnswer: async (groupId: string, answerId: string, isAccepted: boolean): Promise<any> => {
    const res = await api.patch(`/api/community/groups/${groupId}/answers/${answerId}/accept`, { isAccepted });
    return res.data.answer;
  },

  uploadChatAttachment: async (groupId: string, formData: FormData): Promise<{ filePath: string; fileName: string; fileType: string; fileSize: number }> => {
    const res = await api.post(`/api/community/groups/${groupId}/chat/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
export default communityService;
