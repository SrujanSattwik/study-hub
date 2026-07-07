import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import communityService from '../../services/community.service';
import useSocket from '../../hooks/useSocket';
import GroupChat from './GroupChat';
import WhiteboardCanvas from './WhiteboardCanvas';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

interface GroupWorkspaceProps {
  groupId: string;
  onBack: () => void;
}

export const GroupWorkspace: React.FC<GroupWorkspaceProps> = ({ groupId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'whiteboard'>('overview');

  // 1. Fetch workspace stats
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workspace', groupId],
    queryFn: () => communityService.getGroupWorkspace(groupId),
  });

  // 2. Set up WebSockets hook
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

  const handleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    sendRaiseHand(newState);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader size="md" label="Entering group workspace..." />
      </div>
    );
  }

  const { group, userRole, announcements = [], files = [], meetings = [], activity = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <section className="bg-white border border-gray-200 p-6 rounded-2xl flex justify-between items-center flex-wrap gap-4 shadow-sm">
        <div className="flex gap-4 items-center">
          <button
            onClick={onBack}
            className="h-10 w-10 border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 transition-colors"
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
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-150 rounded-full text-[10px] font-bold text-gray-400">
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-150 pb-4">
        {(['overview', 'chat', 'whiteboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white border border-gray-250 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main workspace widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcements */}
            <Card title="Announcements" icon="fas fa-bullhorn">
              <div className="divide-y divide-gray-50 space-y-3">
                {announcements.length > 0 ? (
                  announcements.map((a: any) => (
                    <div key={a.announcement_id} className="pt-3 first:pt-0 space-y-1">
                      <h4 className="font-bold text-gray-900 text-sm">{a.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{a.content}</p>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                        By {a.author_name} • {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic py-2">No announcements in this study group.</p>
                )}
              </div>
            </Card>

            {/* Folder / Files */}
            <Card title="Shared Materials" icon="fas fa-folder-open">
              <div className="divide-y divide-gray-50">
                {files.length > 0 ? (
                  files.map((f: any) => (
                    <div key={f.material_id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex gap-3 items-center">
                        <i className="fas fa-file-alt text-indigo-500 text-lg" />
                        <div>
                          <p className="text-xs font-bold text-gray-800 leading-none">{f.title}</p>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">
                            By {f.uploaded_by_name || 'Anonymous'} • {(f.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:3001${f.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic py-2">No files shared yet.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Activity Log / Info */}
          <div className="space-y-6">
            {/* Live Meetings */}
            <Card title="Live Meetings" icon="fas fa-video">
              {meetings.length > 0 ? (
                meetings.map((m: any) => (
                  <div key={m.meeting_id} className="p-3 border border-indigo-150 bg-indigo-50/20 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-700 leading-none">{m.title}</p>
                      <span className="text-[9px] text-gray-400 font-bold tracking-wider mt-1 block">Host: {m.host_name}</span>
                    </div>
                    <Button variant="primary" size="sm" className="px-3.5 py-1.5 text-xs">
                      Join
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic py-2">No active video meetings.</p>
              )}
            </Card>

            {/* Hand Raised Notices */}
            {Object.values(raisedHands).some((h) => h.raised) && (
              <Card title="Active Queries" icon="fas fa-hand-paper">
                <div className="space-y-2">
                  {Object.entries(raisedHands)
                    .filter(([_, h]) => h.raised)
                    .map(([uId, h]) => (
                      <div key={uId} className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-xl">
                        <i className="fas fa-hand-paper" />
                        <span>{h.userName} raised a hand</span>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Activity History */}
            <Card title="Group History">
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

      {activeTab === 'chat' && (
        <GroupChat
          messages={messages}
          typingUsers={typingUsers}
          sendMessage={sendMessage}
          sendTyping={sendTyping}
        />
      )}

      {activeTab === 'whiteboard' && (
        <WhiteboardCanvas
          isConnected={isConnected}
          socket={socket}
          sendDraw={sendDraw}
          sendClearWhiteboard={sendClearWhiteboard}
        />
      )}
    </div>
  );
};
export default GroupWorkspace;
