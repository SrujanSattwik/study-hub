import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import communityService from '../../services/community.service';
import useSocket from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GroupChat from './GroupChat';
import WhiteboardCanvas from './WhiteboardCanvas';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { API_URL } from '../../services/api';

interface GroupWorkspaceProps {
  groupId: string;
  onBack: () => void;
}

export const GroupWorkspace: React.FC<GroupWorkspaceProps> = ({ groupId, onBack }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'announcements' | 'materials' | 'questions' | 'chat' | 'whiteboard' | 'meetings'>('overview');

  // Socket
  const {
    socket,
    isConnected,
    messages,
    typingUsers,
    onlineMembers,
    raisedHands,
    sendMessage,
    sendTyping,
    sendDraw,
    sendClearWhiteboard,
    sendRaiseHand,
  } = useSocket(groupId);

  const [handRaised, setHandRaised] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal / Form States
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announcePinned, setAnnouncePinned] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qSubject, setQSubject] = useState('');
  const [qTags, setQTags] = useState('');
  const [qAttachment, setQAttachment] = useState('');
  const [questionFile, setQuestionFile] = useState<File | null>(null);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [answerAttachment, setAnswerAttachment] = useState('');
  const [answerFile, setAnswerFile] = useState<File | null>(null);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');

  // Materials folder explorer state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Root' }]);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderFormName, setFolderFormName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Helper helper to format attachment links
  const getAttachmentLink = (url: string) => {
    if (!url) return '';
    return url.startsWith('/') ? `${API_URL}${url}` : url;
  };

  // 1. Fetch group workspace details (Real-time logs, folder, members)
  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ['workspace', groupId],
    queryFn: () => communityService.getGroupWorkspace(groupId),
  });

  // 1b. Fetch materials explorer (folders & files) based on currentFolderId
  const { data: materialsData, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ['materials', groupId, currentFolderId],
    queryFn: () => communityService.getGroupMaterials(groupId, currentFolderId),
  });

  const foldersList = materialsData?.folders || [];
  const filesList = materialsData?.files || [];

  const handleOpenFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const nextBreadcrumbs = breadcrumbs.slice(0, index + 1);
    const target = nextBreadcrumbs[nextBreadcrumbs.length - 1];
    setBreadcrumbs(nextBreadcrumbs);
    setCurrentFolderId(target.id);
  };

  // 2. Fetch Announcements
  const { data: announcements = [], refetch: refetchAnnouncements } = useQuery({
    queryKey: ['announcements', groupId],
    queryFn: () => communityService.getGroupAnnouncements(groupId),
  });

  // 3. Fetch Questions
  const { data: questions = [], refetch: refetchQuestions } = useQuery({
    queryKey: ['questions', groupId],
    queryFn: () => communityService.getGroupQuestions(groupId),
  });

  // 4. Fetch Meetings
  const { data: meetings = [], refetch: refetchMeetings } = useQuery({
    queryKey: ['meetings', groupId],
    queryFn: () => communityService.getGroupMeetings(groupId),
  });

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleAnnouncement = () => queryClient.invalidateQueries({ queryKey: ['announcements', groupId] });
    const handleMaterial = () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', groupId] });
      queryClient.invalidateQueries({ queryKey: ['materials', groupId] });
    };
    const handleQuestion = () => queryClient.invalidateQueries({ queryKey: ['questions', groupId] });
    const handleMeeting = () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', groupId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', groupId] });
    };

    socket.on('announcementCreated', handleAnnouncement);
    socket.on('announcementUpdated', handleAnnouncement);
    socket.on('announcementDeleted', handleAnnouncement);
    socket.on('materialUploaded', handleMaterial);
    socket.on('materialUpdated', handleMaterial);
    socket.on('materialDeleted', handleMaterial);
    socket.on('questionCreated', handleQuestion);
    socket.on('questionUpdated', handleQuestion);
    socket.on('questionDeleted', handleQuestion);
    socket.on('answerCreated', handleQuestion);
    socket.on('answerDeleted', handleQuestion);
    socket.on('meetingStarted', handleMeeting);
    socket.on('meetingEnded', handleMeeting);

    return () => {
      socket.off('announcementCreated', handleAnnouncement);
      socket.off('announcementUpdated', handleAnnouncement);
      socket.off('announcementDeleted', handleAnnouncement);
      socket.off('materialUploaded', handleMaterial);
      socket.off('materialUpdated', handleMaterial);
      socket.off('materialDeleted', handleMaterial);
      socket.off('questionCreated', handleQuestion);
      socket.off('questionUpdated', handleQuestion);
      socket.off('questionDeleted', handleQuestion);
      socket.off('answerCreated', handleQuestion);
      socket.off('answerDeleted', handleQuestion);
      socket.off('meetingStarted', handleMeeting);
      socket.off('meetingEnded', handleMeeting);
    };
  }, [socket, groupId, queryClient]);

  // Mutations
  const createAnnounceMutation = useMutation({
    mutationFn: (data: { title: string; content: string; pinned: boolean }) =>
      communityService.createGroupAnnouncement(groupId, data.title, data.content, data.pinned),
    onSuccess: () => {
      setToastMessage('Announcement posted!');
      setIsAnnounceModalOpen(false);
      setAnnounceTitle('');
      setAnnounceContent('');
      setAnnouncePinned(false);
      queryClient.invalidateQueries({ queryKey: ['announcements', groupId] });
    },
  });

  const updateAnnounceMutation = useMutation({
    mutationFn: (data: { announcementId: string; title: string; content: string; pinned: boolean }) =>
      communityService.updateGroupAnnouncement(groupId, data.announcementId, data.title, data.content, data.pinned),
    onSuccess: () => {
      setToastMessage('Announcement updated!');
      setIsAnnounceModalOpen(false);
      setAnnounceTitle('');
      setAnnounceContent('');
      setAnnouncePinned(false);
      setEditingAnnouncementId(null);
      queryClient.invalidateQueries({ queryKey: ['announcements', groupId] });
    },
  });

  const deleteAnnounceMutation = useMutation({
    mutationFn: (announcementId: string) =>
      communityService.deleteGroupAnnouncement(groupId, announcementId),
    onSuccess: () => {
      setToastMessage('Announcement deleted!');
      queryClient.invalidateQueries({ queryKey: ['announcements', groupId] });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: (materialId: string) =>
      communityService.deleteGroupMaterial(groupId, materialId),
    onSuccess: () => {
      setToastMessage('Resource deleted!');
      queryClient.invalidateQueries({ queryKey: ['materials', groupId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', groupId] });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; parentId: string | null }) =>
      communityService.createGroupFolder(groupId, data.name, data.parentId),
    onSuccess: () => {
      setToastMessage('Folder created!');
      setIsFolderModalOpen(false);
      setFolderFormName('');
      queryClient.invalidateQueries({ queryKey: ['materials', groupId] });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: (data: { folderId: string; name: string }) =>
      communityService.renameGroupFolder(groupId, data.folderId, data.name),
    onSuccess: () => {
      setToastMessage('Folder renamed!');
      setIsFolderModalOpen(false);
      setFolderFormName('');
      setEditingFolderId(null);
      queryClient.invalidateQueries({ queryKey: ['materials', groupId] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) =>
      communityService.deleteGroupFolder(groupId, folderId),
    onSuccess: () => {
      setToastMessage('Folder deleted!');
      queryClient.invalidateQueries({ queryKey: ['materials', groupId] });
    },
  });

  const uploadMaterialMutation = useMutation({
    mutationFn: (formData: FormData) =>
      communityService.uploadGroupMaterial(groupId, formData),
    onSuccess: () => {
      setToastMessage('Resource uploaded successfully!');
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadTags('');
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['materials', groupId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', groupId] });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (formData: FormData) =>
      communityService.createGroupQuestion(groupId, formData),
    onSuccess: () => {
      setToastMessage('Question posted!');
      setIsQuestionModalOpen(false);
      setQTitle('');
      setQDesc('');
      setQSubject('');
      setQTags('');
      setQAttachment('');
      setQuestionFile(null);
      queryClient.invalidateQueries({ queryKey: ['questions', groupId] });
    },
  });

  const updateQuestionStatusMutation = useMutation({
    mutationFn: (data: { questionId: string; isSolved: boolean }) =>
      communityService.updateGroupQuestionStatus(groupId, data.questionId, data.isSolved),
    onSuccess: () => {
      setToastMessage('Question status updated!');
      queryClient.invalidateQueries({ queryKey: ['questions', groupId] });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) =>
      communityService.deleteGroupQuestion(groupId, questionId),
    onSuccess: () => {
      setToastMessage('Question deleted!');
      queryClient.invalidateQueries({ queryKey: ['questions', groupId] });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: (data: { questionId: string; formData: FormData }) =>
      communityService.createGroupAnswer(groupId, data.questionId, data.formData),
    onSuccess: () => {
      setToastMessage('Answer submitted!');
      setAnswerContent('');
      setAnswerAttachment('');
      setAnswerFile(null);
      queryClient.invalidateQueries({ queryKey: ['questions', groupId] });
    },
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: (answerId: string) =>
      communityService.deleteGroupAnswer(groupId, answerId),
    onSuccess: () => {
      setToastMessage('Answer deleted!');
      queryClient.invalidateQueries({ queryKey: ['questions', groupId] });
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: (data: { answerId: string; isAccepted: boolean }) =>
      communityService.acceptGroupAnswer(groupId, data.answerId, data.isAccepted),
    onSuccess: () => {
      setToastMessage('Answer solution status updated!');
      queryClient.invalidateQueries({ queryKey: ['questions', groupId] });
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: (title: string) =>
      communityService.createGroupMeeting(groupId, title),
    onSuccess: () => {
      setToastMessage('Meeting started!');
      setIsMeetingModalOpen(false);
      setMeetingTitle('');
      queryClient.invalidateQueries({ queryKey: ['meetings', groupId] });
    },
  });

  const endMeetingMutation = useMutation({
    mutationFn: (meetingId: string) =>
      communityService.endGroupMeeting(groupId, meetingId),
    onSuccess: () => {
      setToastMessage('Meeting ended!');
      queryClient.invalidateQueries({ queryKey: ['meetings', groupId] });
    },
  });

  const handleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    sendRaiseHand(newState);
  };

  const handleAnnounceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceContent.trim()) return;

    if (editingAnnouncementId) {
      updateAnnounceMutation.mutate({
        announcementId: editingAnnouncementId,
        title: announceTitle,
        content: announceContent,
        pinned: announcePinned,
      });
    } else {
      createAnnounceMutation.mutate({
        title: announceTitle,
        content: announceContent,
        pinned: announcePinned,
      });
    }
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qDesc.trim()) return;

    const formData = new FormData();
    formData.append('title', qTitle);
    formData.append('description', qDesc);
    if (qSubject) formData.append('subject', qSubject);
    if (qTags) formData.append('tags', qTags);
    if (qAttachment) formData.append('attachmentUrl', qAttachment);
    if (questionFile) formData.append('file', questionFile);

    createQuestionMutation.mutate(formData);
  };

  const handleAnswerSubmit = (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    const formData = new FormData();
    formData.append('content', answerContent);
    if (answerAttachment) formData.append('attachmentUrl', answerAttachment);
    if (answerFile) formData.append('file', answerFile);

    createAnswerMutation.mutate({ questionId, formData });
  };

  const handleMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;
    createMeetingMutation.mutate(meetingTitle);
  };

  const handleDownloadTrack = async (materialId: string, filePath: string) => {
    try {
      await communityService.trackGroupMaterialDownload(groupId, materialId);
      queryClient.invalidateQueries({ queryKey: ['workspace', groupId] });
      window.open(`${API_URL}${filePath}`, '_blank');
    } catch {
      setToastMessage('Failed to download material');
    }
  };

  if (isWorkspaceLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader size="md" label="Entering group workspace..." />
      </div>
    );
  }

  const { group, userRole, files = [], activity = [] } = workspaceData || {};
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator';
  const activeMeeting = meetings.find((m: any) => m.status === 'active');

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <section className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center flex-wrap gap-4 shadow-sm">
        <div className="flex gap-4 items-center">
          <button
            onClick={onBack}
            className="h-10 w-10 border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center text-gray-500 transition-colors"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
              <i className={`${group?.icon || 'fas fa-users'} text-indigo-600`} />
              <span>{group?.name}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">{group?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-150 rounded-full text-[10px] font-bold text-gray-400">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{isConnected ? 'Sync Active' : 'Offline'}</span>
          </div>

          <Button
            variant={handRaised ? 'success' : 'secondary'}
            size="sm"
            onClick={handleRaiseHand}
            disabled={!isConnected}
          >
            <i className="fas fa-hand-paper mr-2" />
            {handRaised ? 'Hand Raised' : 'Raise Hand'}
          </Button>
        </div>
      </section>

      {/* Tabs Layout */}
      <div className="flex flex-wrap gap-2 border-b border-slate-150 pb-4">
        {([
          { key: 'overview', name: 'Overview', icon: 'fas fa-home' },
          { key: 'announcements', name: 'Announcements', icon: 'fas fa-bullhorn' },
          { key: 'materials', name: 'Materials', icon: 'fas fa-folder-open' },
          { key: 'questions', name: 'Questions', icon: 'fas fa-question-circle' },
          { key: 'chat', name: 'Chat', icon: 'fas fa-comments' },
          { key: 'whiteboard', name: 'Whiteboard', icon: 'fas fa-paint-brush' },
          { key: 'meetings', name: 'Meetings', icon: 'fas fa-video' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-gray-500 hover:bg-slate-50 hover:text-gray-700'
            }`}
          >
            <i className={tab.icon} />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}

      {/* OVERVIEW PANEL */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Announcement */}
            <Card title="Latest Announcement" icon="fas fa-bullhorn">
              {announcements.length > 0 ? (
                <div className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-sm text-gray-900">{announcements[0].title}</h4>
                    {announcements[0].pinned && (
                      <span className="text-[9px] uppercase font-black tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{announcements[0].content}</p>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-1.5 border-t border-slate-100">
                    By {announcements[0].creator?.fullName || 'Teacher'} • {new Date(announcements[0].createdAt).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic py-2">No announcements in this study group.</p>
              )}
            </Card>

            {/* Shared Materials */}
            <Card title="Shared Materials" icon="fas fa-folder-open">
              <div className="divide-y divide-slate-100">
                {files.length > 0 ? (
                  files.slice(0, 3).map((f: any) => (
                    <div key={f.material_id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex gap-3 items-center">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <i className="fas fa-file-alt text-sm" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 leading-none">{f.title}</p>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">
                            By {f.uploaded_by_name || 'Student'} • {f.file_type} • {f.downloadCount ?? 0} downloads
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadTrack(f.material_id, f.file_path)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Download
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic py-2">No files shared yet.</p>
                )}
              </div>
            </Card>

            {/* Recent doubts */}
            <Card title="Recent Doubts Board" icon="fas fa-question-circle">
              <div className="divide-y divide-slate-100">
                {questions.length > 0 ? (
                  questions.slice(0, 3).map((q: any) => (
                    <div key={q.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-none">{q.title}</h4>
                        <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                          Asked by {q.user?.fullName} • {q.answers?.length ?? 0} answers
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        q.isSolved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {q.isSolved ? 'Solved' : 'Open'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic py-2">No questions asked yet.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Live Meetings */}
            <Card title="Live Meetings" icon="fas fa-video">
              {activeMeeting ? (
                <div className="p-3.5 border border-rose-150 bg-rose-50/20 rounded-xl space-y-3">
                  <div>
                    <span className="text-[8px] uppercase font-black text-rose-600 tracking-widest bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                      Live Running
                    </span>
                    <p className="text-xs font-bold text-gray-900 mt-2 leading-none">{activeMeeting.title}</p>
                    <span className="text-[9px] text-gray-400 font-bold tracking-wider mt-1 block">Host: {activeMeeting.host?.fullName}</span>
                  </div>
                  <Button variant="primary" size="sm" className="w-full" onClick={() => setActiveTab('meetings')}>
                    Join Meeting
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic py-2">No active video meetings.</p>
              )}
            </Card>

            {/* Timeline */}
            <Card title="Group History" icon="fas fa-history">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {activity.map((act: any) => (
                  <div key={act.log_id} className="text-xs text-gray-600">
                    <span className="font-bold text-gray-900">{act.user_name}</span> {act.action}
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS PANEL */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Announcements</h3>
            {isAdminOrOwner && (
              <Button variant="primary" size="sm" onClick={() => {
                setEditingAnnouncementId(null);
                setAnnounceTitle('');
                setAnnounceContent('');
                setAnnouncePinned(false);
                setIsAnnounceModalOpen(true);
              }}>
                Post Announcement
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((a: any) => (
                <Card
                  key={a.id}
                  className={`border transition-all ${a.pinned ? 'border-indigo-200 bg-indigo-50/10' : 'border-slate-200'}`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-150 text-indigo-600 font-extrabold text-xs flex items-center justify-center">
                          {a.creator?.fullName?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 leading-none">{a.title}</h4>
                          <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                            By {a.creator?.fullName} • {new Date(a.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.pinned && (
                          <span className="text-[9px] uppercase font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full tracking-wider">
                            Pinned
                          </span>
                        )}
                        {isAdminOrOwner && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditingAnnouncementId(a.id);
                                setAnnounceTitle(a.title);
                                setAnnounceContent(a.content);
                                setAnnouncePinned(a.pinned);
                                setIsAnnounceModalOpen(true);
                              }}
                              className="p-1 hover:bg-slate-100 text-gray-400 hover:text-indigo-600 rounded"
                            >
                              <i className="fas fa-edit text-xs" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete announcement?')) {
                                  deleteAnnounceMutation.mutate(a.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded"
                            >
                              <i className="fas fa-trash text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-650 leading-relaxed pl-12 pt-1">{a.content}</p>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                <i className="fas fa-bullhorn text-3xl text-gray-300 mb-3" />
                <p className="text-xs font-semibold text-gray-500">No announcements yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MATERIALS PANEL */}
      {activeTab === 'materials' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Shared Materials</h3>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => {
                setEditingFolderId(null);
                setFolderFormName('');
                setIsFolderModalOpen(true);
              }}>
                Create Folder
              </Button>
              <Button variant="primary" size="sm" onClick={() => {
                setUploadTitle('');
                setUploadDesc('');
                setUploadTags('');
                setUploadFile(null);
                setIsUploadModalOpen(true);
              }}>
                Upload File
              </Button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-4 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl select-none">
            {breadcrumbs.map((bc, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-350 font-normal">/</span>}
                <button
                  onClick={() => handleNavigateBreadcrumb(idx)}
                  className={`hover:text-indigo-600 transition-colors uppercase tracking-wider ${
                    idx === breadcrumbs.length - 1 ? 'text-slate-800 font-extrabold cursor-default' : ''
                  }`}
                  disabled={idx === breadcrumbs.length - 1}
                >
                  {bc.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {isMaterialsLoading ? (
            <div className="py-12 flex justify-center">
              <Loader size="sm" label="Loading folder contents..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Folders */}
              {foldersList.map((folder: any) => (
                <Card
                  key={folder.category_id}
                  className="flex flex-col justify-between border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-white rounded-2xl min-h-[140px]"
                  onClick={() => handleOpenFolder(folder.category_id, folder.name)}
                >
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-650 border border-purple-100 flex items-center justify-center shrink-0">
                      <i className="fas fa-folder text-lg" />
                    </div>
                    {isAdminOrOwner && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingFolderId(folder.category_id);
                            setFolderFormName(folder.name);
                            setIsFolderModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-gray-400 hover:text-indigo-650 rounded"
                        >
                          <i className="fas fa-edit text-xs" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete folder? Files inside will be moved to Root.')) {
                              deleteFolderMutation.mutate(folder.category_id);
                            }
                          }}
                          className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded"
                        >
                          <i className="fas fa-trash text-xs" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-extrabold text-slate-800 truncate" title={folder.name}>
                      {folder.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Directory Folder</span>
                  </div>
                </Card>
              ))}

              {/* Files */}
              {filesList.map((f: any) => {
                const isUploader = f.uploadedBy === user?.user_id;
                const canDelete = isUploader || isAdminOrOwner;
                return (
                  <Card
                    key={f.material_id}
                    className="flex flex-col justify-between border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 bg-white rounded-2xl min-h-[180px]"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <i className="fas fa-file-alt text-base" />
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete resource?')) {
                                deleteMaterialMutation.mutate(f.material_id);
                              }
                            }}
                            className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded"
                          >
                            <i className="fas fa-trash text-xs" />
                          </button>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-none truncate" title={f.title}>
                          {f.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-snug line-clamp-2 min-h-[32px]">
                          {f.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {f.downloadCount ?? 0} DLs
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadTrack(f.material_id, f.file_path)}
                        className="py-1.5 px-4 text-xs font-bold transition-all duration-200 h-9"
                      >
                        Download
                      </Button>
                    </div>
                  </Card>
                );
              })}

              {foldersList.length === 0 && filesList.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white border border-slate-200 rounded-2xl">
                  <i className="fas fa-folder-open text-3xl text-gray-300 mb-3" />
                  <p className="text-xs font-semibold text-gray-500">This folder is empty.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* QUESTIONS PANEL */}
      {activeTab === 'questions' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Doubts Q&A Board</h3>
            <Button variant="primary" size="sm" onClick={() => setIsQuestionModalOpen(true)}>
              Ask a Doubt
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Questions List */}
            <div className="lg:col-span-2 space-y-4">
              {questions.length > 0 ? (
                questions.map((q: any) => {
                  const isSelected = selectedQuestionId === q.id;
                  const canDeleteQ = q.userId === user?.user_id || isAdminOrOwner;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestionId(isSelected ? null : q.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
                        isSelected ? 'border-indigo-500 shadow-md' : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                              q.isSolved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {q.isSolved ? 'Solved' : 'Open'}
                            </span>
                            {q.subject && (
                              <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase">
                                {q.subject}
                              </span>
                            )}
                          </div>
                          {canDeleteQ && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Delete this doubt?')) {
                                  deleteQuestionMutation.mutate(q.id);
                                }
                              }}
                              className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded"
                            >
                              <i className="fas fa-trash text-xs" />
                            </button>
                          )}
                        </div>
                        <h4 className="text-[15px] font-semibold text-gray-900 tracking-tight leading-snug">{q.title}</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">{q.description}</p>
                        
                        {q.attachmentUrl && (
                          <a
                            href={getAttachmentLink(q.attachmentUrl)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full hover:underline uppercase tracking-wider mt-2"
                          >
                            <i className="fas fa-paperclip text-[10px]" /> View Attachment
                          </a>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-3 text-[10px] text-gray-400 font-bold uppercase select-none">
                          <span>Asked by {q.user?.fullName}</span>
                          <span>{q.answers?.length ?? 0} Answers</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                  <i className="fas fa-question-circle text-3xl text-gray-300 mb-3" />
                  <p className="text-xs font-semibold text-gray-500">Ask the first question.</p>
                </div>
              )}
            </div>

            {/* Answer detail panel */}
            <div className="space-y-4">
              {selectedQuestionId ? (() => {
                const q = questions.find((x: any) => x.id === selectedQuestionId);
                if (!q) return null;
                const canToggleSolved = q.userId === user?.user_id || isAdminOrOwner;
                const isQuestionAuthor = q.userId === user?.user_id;
                const canAcceptAns = isQuestionAuthor || isAdminOrOwner;

                return (
                  <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-extrabold text-gray-900 uppercase tracking-widest">Nested Answers</span>
                      {canToggleSolved && (
                        <button
                          onClick={() => updateQuestionStatusMutation.mutate({ questionId: q.id, isSolved: !q.isSolved })}
                          className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border transition-all ${
                            q.isSolved ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}
                        >
                          {q.isSolved ? 'Mark Open' : 'Mark Solved'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 divide-y divide-slate-50">
                      {q.answers && q.answers.length > 0 ? (
                        q.answers.map((ans: any) => {
                          const canDeleteAns = ans.userId === user?.user_id || isAdminOrOwner;
                          return (
                            <div
                              key={ans.id}
                              className={`pt-3 first:pt-0 space-y-1.5 p-3.5 rounded-xl border ${
                                ans.isAccepted
                                  ? 'border-emerald-300 bg-emerald-50/10 shadow-sm'
                                  : 'border-transparent'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-indigo-650 leading-none">{ans.user?.fullName}</span>
                                  {ans.isAccepted && (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase leading-none select-none">
                                      <i className="fas fa-check-circle text-[9px]" /> Solution
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {canAcceptAns && (
                                    <button
                                      onClick={() => acceptAnswerMutation.mutate({ answerId: ans.id, isAccepted: !ans.isAccepted })}
                                      className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                                        ans.isAccepted ? 'bg-slate-50 text-gray-500 border-slate-200 hover:bg-slate-100' : 'bg-emerald-50 text-emerald-600 border-emerald-150 hover:bg-emerald-100'
                                      }`}
                                    >
                                      {ans.isAccepted ? 'Revoke Accept' : 'Accept Solution'}
                                    </button>
                                  )}
                                  {canDeleteAns && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Delete answer?')) {
                                          deleteAnswerMutation.mutate(ans.id);
                                        }
                                      }}
                                      className="text-gray-400 hover:text-rose-600 p-0.5 rounded text-[10px]"
                                    >
                                      <i className="fas fa-trash" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-750 leading-relaxed font-medium">{ans.content}</p>
                              {ans.attachmentUrl && (
                                <a
                                  href={getAttachmentLink(ans.attachmentUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] font-extrabold text-indigo-500 hover:underline mt-1 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider"
                                >
                                  <i className="fas fa-paperclip text-[8px]" /> Attachment file
                                </a>
                              )}
                              <span className="text-[9px] text-gray-400 block mt-1">
                                {new Date(ans.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-400 italic py-2 text-center">No answers yet.</p>
                      )}
                    </div>

                    {/* Answer Form */}
                    <form onSubmit={(e) => handleAnswerSubmit(e, q.id)} className="space-y-3 pt-3 border-t border-slate-100">
                      <Input
                        id="ans-content"
                        value={answerContent}
                        onChange={(e) => setAnswerContent(e.target.value)}
                        placeholder="Write your answer..."
                        required
                      />
                      <div className="flex gap-2 items-end">
                        <Input
                          id="ans-attachment"
                          value={answerAttachment}
                          onChange={(e) => setAnswerAttachment(e.target.value)}
                          placeholder="Attachment URL (Optional)"
                          className="flex-1"
                        />
                        <div className="flex flex-col shrink-0">
                          <input
                            type="file"
                            id="ans-file"
                            onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <label
                            htmlFor="ans-file"
                            className={`px-3 py-2 text-xs font-bold border rounded-xl cursor-pointer select-none transition-colors h-[42px] flex items-center justify-center gap-1.5 ${
                              answerFile ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold' : 'bg-white border-gray-250 text-gray-600 hover:bg-slate-50'
                            }`}
                          >
                            <i className="fas fa-paperclip text-[10px]" />
                            {answerFile ? 'Attached' : 'Attach File'}
                          </label>
                        </div>
                      </div>
                      {answerFile && (
                        <div className="text-[10px] text-indigo-650 font-bold pl-1.5">
                          Selected File: {answerFile.name} ({(answerFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                      )}
                      <Button variant="primary" size="sm" type="submit" className="w-full" isLoading={createAnswerMutation.isPending}>
                        Submit Answer
                      </Button>
                    </form>
                  </div>
                );
              })() : (
                <div className="p-5 text-center text-xs text-gray-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                  Select a question on the left to view nested answers and participate.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAT PANEL */}
      {activeTab === 'chat' && (
        <GroupChat
          groupId={groupId}
          messages={messages}
          typingUsers={typingUsers}
          sendMessage={sendMessage}
          sendTyping={sendTyping}
        />
      )}

      {/* WHITEBOARD PANEL */}
      {activeTab === 'whiteboard' && (
        <WhiteboardCanvas
          isConnected={isConnected}
          socket={socket}
          sendDraw={sendDraw}
          sendClearWhiteboard={sendClearWhiteboard}
        />
      )}

      {/* MEETINGS PANEL */}
      {activeTab === 'meetings' && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Video Meetings</h3>
            <Button variant="primary" size="sm" onClick={() => setIsMeetingModalOpen(true)}>
              Start Live Meeting
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Active Running Card */}
            <div className="lg:col-span-2 space-y-4">
              {activeMeeting ? (
                <div className="p-6 border border-rose-150 bg-rose-50/10 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-rose-50 blur-3xl opacity-50" />
                  <div className="relative space-y-2">
                    <span className="text-[9px] uppercase font-black text-rose-600 tracking-widest bg-rose-100 px-3 py-1 rounded-full animate-pulse inline-block select-none">
                      Live Session Running
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 pt-2 leading-tight">{activeMeeting.title}</h4>
                    <p className="text-xs text-gray-500 font-semibold">
                      Started At: {new Date(activeMeeting.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-indigo-650 font-bold">
                      Host: {activeMeeting.host?.fullName || 'Teacher'}
                    </p>
                  </div>
                  <div className="flex gap-3 relative z-10 pt-2">
                    <Button variant="primary" onClick={() => alert('Launching WebRTC Meeting Container...')}>
                      Join Meeting
                    </Button>
                    {(activeMeeting.hostId === user?.user_id || isAdminOrOwner) && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (window.confirm('End this meeting?')) {
                            endMeetingMutation.mutate(activeMeeting.id);
                          }
                        }}
                        isLoading={endMeetingMutation.isPending}
                      >
                        End Meeting
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <i className="fas fa-video-slash text-3xl text-gray-300 mb-3" />
                  <p className="text-xs font-semibold text-gray-500">No active video meetings running.</p>
                </div>
              )}
            </div>

            {/* Meetings History */}
            <Card title="Meeting History" icon="fas fa-history">
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {meetings.length > 0 ? (
                  meetings.map((m: any) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-gray-900 leading-none">{m.title}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          Host: {m.host?.fullName}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        m.status === 'active' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-gray-400'
                      }`}>
                        {m.status === 'active' ? 'Active' : 'Ended'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic py-2 text-center">No meeting history yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Modal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        title={editingAnnouncementId ? 'Update Announcement' : 'Post Announcement'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAnnounceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAnnounceSubmit}
              isLoading={createAnnounceMutation.isPending || updateAnnounceMutation.isPending}
            >
              {editingAnnouncementId ? 'Update' : 'Post'}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleAnnounceSubmit}>
          <Input
            id="announce-title"
            label="Announcement Title"
            value={announceTitle}
            onChange={(e) => setAnnounceTitle(e.target.value)}
            placeholder="e.g. Exam dates released"
            required
          />
          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Message Content
            </label>
            <textarea
              value={announceContent}
              onChange={(e) => setAnnounceContent(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all duration-200 h-24"
              placeholder="Post a group notification update..."
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="announce-pinned"
              checked={announcePinned}
              onChange={(e) => setAnnouncePinned(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
            />
            <label htmlFor="announce-pinned" className="text-xs font-extrabold text-gray-700 uppercase">
              Pin announcement at the top
            </label>
          </div>
        </form>
      </Modal>

      {/* ASK DOUBT MODAL */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title="Ask a Doubt"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleQuestionSubmit}
              isLoading={createQuestionMutation.isPending}
            >
              Ask Doubt
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleQuestionSubmit}>
          <Input
            id="q-title"
            label="Question / Doubt Title"
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
            placeholder="e.g. How to solve this double integration problem?"
            required
          />
          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Question details
            </label>
            <textarea
              value={qDesc}
              onChange={(e) => setQDesc(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all duration-200 h-24"
              placeholder="Provide context and explain your academic doubt..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="q-subject"
              label="Subject"
              value={qSubject}
              onChange={(e) => setQSubject(e.target.value)}
              placeholder="e.g. Mathematics"
            />
            <Input
              id="q-tags"
              label="Tags (comma-separated)"
              value={qTags}
              onChange={(e) => setQTags(e.target.value)}
              placeholder="e.g. calculus, integration"
            />
          </div>
          <div className="flex gap-2 items-end">
            <Input
              id="q-attachment"
              label="Attachment URL (Optional)"
              value={qAttachment}
              onChange={(e) => setQAttachment(e.target.value)}
              placeholder="https://drive.google.com/attachment-link"
              className="flex-1"
            />
            <div className="flex flex-col shrink-0">
              <input
                type="file"
                id="question-file-upload"
                onChange={(e) => setQuestionFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="question-file-upload"
                className={`px-3 py-2 text-xs font-bold border rounded-xl cursor-pointer select-none transition-colors h-[42px] flex items-center justify-center gap-1.5 ${
                  questionFile ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold' : 'bg-white border-gray-250 text-gray-600 hover:bg-slate-50'
                }`}
              >
                <i className="fas fa-paperclip text-[10px]" />
                {questionFile ? 'Attached' : 'Attach File'}
              </label>
            </div>
          </div>
          {questionFile && (
            <div className="text-[10px] text-indigo-650 font-bold pl-1.5">
              Selected File: {questionFile.name} ({(questionFile.size / (1024 * 1024)).toFixed(2)} MB)
            </div>
          )}
        </form>
      </Modal>

      {/* START MEETING MODAL */}
      <Modal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        title="Start Live Meeting"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsMeetingModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleMeetingSubmit}
              isLoading={createMeetingMutation.isPending}
            >
              Start Session
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleMeetingSubmit}>
          <Input
            id="meet-title"
            label="Meeting Room Title"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="e.g. Math Revision & Homework Help"
            required
          />
        </form>
      </Modal>

      {/* FOLDER MODAL */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title={editingFolderId ? 'Rename Folder' : 'Create Folder'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!folderFormName.trim()) return;
                if (editingFolderId) {
                  renameFolderMutation.mutate({ folderId: editingFolderId, name: folderFormName });
                } else {
                  createFolderMutation.mutate({ name: folderFormName, parentId: currentFolderId });
                }
              }}
              isLoading={createFolderMutation.isPending || renameFolderMutation.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="folder-name"
            label="Folder Name"
            value={folderFormName}
            onChange={(e) => setFolderFormName(e.target.value)}
            placeholder="e.g. Lecture Notes"
            required
          />
        </div>
      </Modal>

      {/* UPLOAD FILE MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Material"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!uploadTitle.trim() || !uploadFile) return;
                const formData = new FormData();
                formData.append('title', uploadTitle);
                formData.append('description', uploadDesc);
                formData.append('tags', uploadTags);
                if (currentFolderId) {
                  formData.append('categoryId', currentFolderId);
                }
                formData.append('file', uploadFile);
                uploadMaterialMutation.mutate(formData);
              }}
              isLoading={uploadMaterialMutation.isPending}
              disabled={!uploadTitle.trim() || !uploadFile}
            >
              Upload
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input
            id="upload-title"
            label="Material Title"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="e.g. Calculus Cheat Sheet"
            required
          />
          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all duration-200 h-20"
              placeholder="Provide a brief summary of the file contents..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="upload-tags"
              label="Tags"
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
              placeholder="e.g. math, exam, revision"
            />
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Folder Destination
              </label>
              <select
                disabled
                className="w-full px-4 py-2.5 border border-gray-250 bg-slate-50 rounded-xl text-xs font-extrabold text-gray-500 uppercase tracking-wider h-[42px]"
              >
                <option>{breadcrumbs[breadcrumbs.length - 1]?.name || 'Root'}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Attach File
            </label>
            <input
              type="file"
              id="material-file-upload"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="material-file-upload"
              className={`w-full p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                uploadFile ? 'border-indigo-300 bg-indigo-50/10 text-indigo-750 font-semibold' : 'border-gray-250 hover:bg-slate-50 text-gray-500'
              }`}
            >
              <i className={`fas ${uploadFile ? 'fa-file-alt text-indigo-650' : 'fa-cloud-upload-alt'} text-2xl mb-2`} />
              <span className="text-xs font-bold text-center">
                {uploadFile ? uploadFile.name : 'Select PDF, DOC, Image, or Video file'}
              </span>
              {uploadFile && (
                <span className="text-[10px] text-gray-400 mt-1 font-semibold">
                  ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              )}
            </label>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default GroupWorkspace;
