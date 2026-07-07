export interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  format: string | null;
  filePath: string | null;
  link: string | null;
  thumbnail: string | null;
  downloadCount: number;
  author: string;
  createdAt: string;
  subject?: string | null;
  difficulty?: string | null;
}

export interface StudyGroup {
  group_id: string;
  name: string;
  description: string | null;
  category: string | null;
  meeting_schedule: string | null;
  cover_image: string | null;
  icon: string;
  role?: string;
  joined_at?: string;
  member_count?: number;
}

export interface GroupMessage {
  messageId: string;
  groupId: string;
  userId: string;
  authorName: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface GroupEvent {
  event_id: string;
  group_id: string;
  title: string;
  event_date: string;
  location: string;
  type: string | null;
  group_name: string;
  group_icon: string;
  rsvp_going_count: number;
  user_rsvp_status: 'going' | 'maybe' | 'declined' | 'none';
}

export interface ActiveMeeting {
  meeting_id: string;
  group_id: string;
  title: string;
  status: string;
  created_at: string;
  group_name: string;
  group_icon: string;
  host_name: string;
}

export interface OnlineUser {
  user_id: string;
  status: string;
  full_name: string;
}

export interface Notification {
  notification_id: string;
  type: string | null;
  title: string | null;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}
