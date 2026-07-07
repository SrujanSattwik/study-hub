import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import communityService from "../../services/community.service";
import GroupWorkspace from "./GroupWorkspace";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import Toast from "../../components/ui/Toast";

export const Community: React.FC = () => {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. TanStack Query for community home bundle
  const {
    data: bundle,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["communityBundle"],
    queryFn: communityService.getHomeBundle,
  });

  // 2. Join Mutation
  const joinMutation = useMutation({
    mutationFn: communityService.joinGroup,
    onSuccess: (_, groupId) => {
      setToastMessage("Successfully joined the study group!");
      refetch();
      // Instantly open the workspace
      setActiveGroupId(groupId);
    },
    onError: () => {
      setToastMessage("Failed to join group.");
    },
  });

  if (activeGroupId) {
    return (
      <GroupWorkspace
        groupId={activeGroupId}
        onBack={() => setActiveGroupId(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader size="md" label="Loading community workspace..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 bg-white border border-red-100 rounded-2xl">
        <i className="fas fa-exclamation-circle text-4xl text-red-300 mb-4" />
        <p className="text-sm font-semibold text-gray-500 mb-3">
          Failed to load community data.
        </p>
        <button
          onClick={() => refetch()}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const {
    stats,
    joinedGroups = [],
    suggestedGroups = [],
    exploreGroups = [],
    events = [],
    challenges = [],
  } = bundle || {};

  return (
    <div className="space-y-6">
      {/* Banner */}
      <section className="p-8 bg-indigo-600 text-white rounded-2xl flex justify-between items-center flex-wrap gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Community Study Hub</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Collaborate in live study groups, check upcoming schedules, and
            complete daily tasks.
          </p>
        </div>
      </section>

      {/* Stats Widgets */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-2xl font-extrabold text-indigo-600">
            {stats?.activeMeetings || 0}
          </div>
          <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
            Live Meetings
          </div>
        </Card>
        <Card>
          <div className="text-2xl font-extrabold text-purple-600">
            {stats?.onlineUsers || 0}
          </div>
          <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
            Users Online
          </div>
        </Card>
        <Card>
          <div className="text-2xl font-extrabold text-teal-600">
            {stats?.materialsShared || 0}
          </div>
          <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
            Files Shared
          </div>
        </Card>
        <Card>
          <div className="text-2xl font-extrabold text-emerald-600">
            {stats?.upcomingEvents || 0}
          </div>
          <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
            Upcoming Events
          </div>
        </Card>
      </section>

      {/* Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* My Joined Groups */}
          <Card title="My Joined Groups">
            <div className="divide-y divide-gray-150">
              {joinedGroups.length > 0 ? (
                joinedGroups.map((g) => (
                  <div
                    key={g.group_id}
                    className="py-4 flex items-center justify-between gap-4 hover:bg-gray-50/30 transition-colors"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <i className={`${g.icon} text-lg`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-none">
                          {g.name}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 block">
                          {g.category} • {g.member_count} members
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveGroupId(g.group_id)}
                    >
                      Enter Space
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic py-3 text-center">
                  You haven't joined any groups yet. Explore groups below!
                </p>
              )}
            </div>
          </Card>

          {/* Explore / Suggested Groups */}
          <Card title="Suggested Groups to Join">
            <div className="divide-y divide-gray-150">
              {suggestedGroups.length > 0 ? (
                suggestedGroups.map((g) => (
                  <div
                    key={g.group_id}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <i className={`${g.icon} text-lg`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-none">
                          {g.name}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 block">
                          {g.category} • {g.member_count} members
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => joinMutation.mutate(g.group_id)}
                      isLoading={
                        joinMutation.isPending &&
                        joinMutation.variables === g.group_id
                      }
                    >
                      Join Group
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic py-3 text-center">
                  No new group recommendations.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card title="Upcoming Schedules" icon="fas fa-calendar-alt">
            <div className="space-y-3">
              {events.length > 0 ? (
                events.map((ev) => (
                  <div
                    key={ev.event_id}
                    className="p-3 border border-gray-150 rounded-xl space-y-1.5 bg-gray-50/50"
                  >
                    <div className="flex items-center gap-2">
                      <i
                        className={`${ev.group_icon} text-xs text-indigo-500`}
                      />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {ev.group_name}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-xs">
                      {ev.title}
                    </h4>
                    <p className="text-[9px] text-gray-500 font-medium">
                      Date: {new Date(ev.event_date).toLocaleString()} •
                      Location: {ev.location}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic py-2 text-center">
                  No upcoming events scheduled.
                </p>
              )}
            </div>
          </Card>

          {/* XP Challenges */}
          <Card title="Daily Goals" icon="fas fa-trophy">
            <div className="space-y-4">
              {challenges.map((c) => (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-900">{c.title}</span>
                    <span className="text-indigo-600">{c.reward}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {c.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
export default Community;
