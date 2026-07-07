import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import communityService from "../../services/community.service";
import GroupWorkspace from "./GroupWorkspace";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import Toast from "../../components/ui/Toast";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import useDebounce from "../../hooks/useDebounce";

export const Community: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("popular");

  // Create Community Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [commName, setCommName] = useState("");
  const [commDesc, setCommDesc] = useState("");
  const [commCategory, setCommCategory] = useState("other");
  const [commVisibility, setCommVisibility] = useState("public");
  const [commIcon, setCommIcon] = useState("fas fa-users");

  const debouncedSearch = useDebounce(searchTerm, 400);

  // 1. TanStack Query for community home bundle
  const {
    data: bundle,
    isLoading: isBundleLoading,
    isError: isBundleError,
    refetch: refetchBundle,
  } = useQuery({
    queryKey: ["communityBundle"],
    queryFn: communityService.getHomeBundle,
  });

  // 2. TanStack Query for searchable & filterable explore groups
  const {
    data: exploreGroups = [],
    isLoading: isExploreLoading,
    isError: isExploreError,
    refetch: refetchExplore,
  } = useQuery({
    queryKey: ["exploreGroupsList", filterCategory, debouncedSearch, sortOrder],
    queryFn: () =>
      communityService.listGroups(
        filterCategory === "all" ? undefined : filterCategory,
        debouncedSearch || undefined,
        sortOrder
      ),
  });

  // 3. Join Mutation
  const joinMutation = useMutation({
    mutationFn: communityService.joinGroup,
    onSuccess: (_, groupId) => {
      setToastMessage("Successfully joined the study group!");
      queryClient.invalidateQueries({ queryKey: ["communityBundle"] });
      queryClient.invalidateQueries({ queryKey: ["exploreGroupsList"] });
      setActiveGroupId(groupId);
    },
    onError: () => {
      setToastMessage("Failed to join group.");
    },
  });

  // 4. Create Group Mutation
  const createMutation = useMutation({
    mutationFn: (newGroup: {
      name: string;
      description: string;
      category: string;
      meetingSchedule?: string;
    }) =>
      communityService.createGroup(
        newGroup.name,
        newGroup.description,
        newGroup.category,
        newGroup.meetingSchedule
      ),
    onSuccess: (res) => {
      setToastMessage("Community created successfully!");
      setIsCreateOpen(false);
      setCommName("");
      setCommDesc("");
      setCommCategory("other");
      setCommVisibility("public");
      setCommIcon("fas fa-users");
      queryClient.invalidateQueries({ queryKey: ["communityBundle"] });
      queryClient.invalidateQueries({ queryKey: ["exploreGroupsList"] });
      if (res.groupId) {
        setActiveGroupId(res.groupId);
      }
    },
    onError: (err: any) => {
      setToastMessage(
        err.response?.data?.message || "Failed to create community."
      );
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName.trim()) {
      setToastMessage("Community name is required");
      return;
    }
    if (!commDesc.trim()) {
      setToastMessage("Description is required");
      return;
    }

    createMutation.mutate({
      name: commName,
      description: commDesc,
      category: commCategory,
      meetingSchedule: "Not scheduled",
    });
  };

  if (activeGroupId) {
    return (
      <GroupWorkspace
        groupId={activeGroupId}
        onBack={() => setActiveGroupId(null)}
      />
    );
  }

  if (isBundleLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader size="md" label="Loading community workspace..." />
      </div>
    );
  }

  if (isBundleError) {
    return (
      <div className="text-center py-20 bg-white border border-red-100 rounded-2xl">
        <i className="fas fa-exclamation-circle text-4xl text-red-300 mb-4" />
        <p className="text-sm font-semibold text-gray-500 mb-3">
          Failed to load community data.
        </p>
        <button
          onClick={() => refetchBundle()}
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
    events = [],
    challenges = [],
  } = bundle || {};

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Banner */}
      <section className="p-8 bg-white border border-slate-200 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-50 blur-3xl opacity-50" />
        <div className="relative flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 font-heading tracking-tight">Community Study Hub</h2>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              Collaborate in live study groups, check upcoming schedules, and complete daily tasks.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <i className="fas fa-plus mr-2" /> Create Community
          </Button>
        </div>
      </section>

      {/* Stats Widgets */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 hover:border-indigo-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-28 transition-all duration-200 hover:shadow-md">
          <div className="text-2xl font-black text-indigo-600 font-heading">{stats?.activeMeetings || 0}</div>
          <div className="text-[9px] uppercase font-black text-gray-400 mt-2 tracking-widest">
            Live Meetings
          </div>
        </div>
        <div className="bg-white border border-slate-200 hover:border-purple-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-28 transition-all duration-200 hover:shadow-md">
          <div className="text-2xl font-black text-purple-600 font-heading">{stats?.onlineUsers || 0}</div>
          <div className="text-[9px] uppercase font-black text-gray-400 mt-2 tracking-widest">
            Users Online
          </div>
        </div>
        <div className="bg-white border border-slate-200 hover:border-teal-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-28 transition-all duration-200 hover:shadow-md">
          <div className="text-2xl font-black text-teal-600 font-heading">{stats?.materialsShared || 0}</div>
          <div className="text-[9px] uppercase font-black text-gray-400 mt-2 tracking-widest">
            Files Shared
          </div>
        </div>
        <div className="bg-white border border-slate-200 hover:border-emerald-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-28 transition-all duration-200 hover:shadow-md">
          <div className="text-2xl font-black text-emerald-600 font-heading">{stats?.upcomingEvents || 0}</div>
          <div className="text-[9px] uppercase font-black text-gray-400 mt-2 tracking-widest">
            Upcoming Events
          </div>
        </div>
      </section>

      {/* Explore, Search & Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-50/50 blur-3xl opacity-50" />
        <div className="relative space-y-1">
          <h3 className="text-sm font-extrabold text-gray-900 tracking-tight leading-none uppercase tracking-widest text-[10px] text-gray-400">Search Communities</h3>
        </div>
        <div className="relative grid grid-cols-1 gap-4 pt-2">
          <div>
            <Input
              id="comm-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by community name, description, category..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-bold"
              >
                <option value="all">All Categories</option>
                <option value="mathematics">Mathematics</option>
                <option value="science">Science</option>
                <option value="programming">Programming</option>
                <option value="languages">Languages</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Sort Select */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-bold"
              >
                <option value="popular">Popularity</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Explore Communities Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Explore Groups</h3>
            {isExploreLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                {[1, 2, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-48 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 shimmer-skeleton" />
                        <div className="h-4 w-12 bg-slate-150 rounded-full" />
                      </div>
                      <div className="h-4 w-3/4 bg-slate-100 rounded" />
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <div className="h-3 w-16 bg-slate-100 rounded" />
                      <div className="h-8 w-24 bg-slate-150 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isExploreError ? (
              <div className="p-6 text-center text-xs text-red-500 font-semibold bg-white border border-red-100 rounded-2xl">
                Failed to load explore groups.
              </div>
            ) : exploreGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exploreGroups.map((g) => {
                  const isJoined = joinedGroups.some(
                    (jg: any) => jg.group_id === g.group_id
                  );
                  return (
                    <Card
                      key={g.group_id}
                      className="flex flex-col justify-between h-48 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-300"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50">
                            <i className={`${g.icon || "fas fa-users"} text-md`} />
                          </div>
                          <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {g.category || "other"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-sm leading-tight line-clamp-1">
                          {g.name}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                          {g.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                          {g.member_count ?? 0} members
                        </span>
                        {isJoined ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveGroupId(g.group_id)}
                          >
                            Enter Space
                          </Button>
                        ) : (
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
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <i className="fas fa-search text-3xl text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-500">
                  No communities found matching your filters.
                </p>
              </div>
            )}
          </div>

          {/* My Joined Groups */}
          <Card title="My Joined Groups">
            <div className="divide-y divide-slate-100">
              {joinedGroups.length > 0 ? (
                joinedGroups.map((g) => (
                  <div
                    key={g.group_id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors px-1"
                  >
                    <div className="flex gap-3.5 items-center">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                        <i className={`${g.icon} text-lg`} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm leading-none">
                          {g.name}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 block">
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
                  You haven't joined any groups yet. Explore groups above!
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Suggested Groups (Not Joined) */}
          <Card title="Suggested Groups to Join">
            <div className="divide-y divide-slate-100">
              {suggestedGroups.length > 0 ? (
                suggestedGroups.map((g) => (
                  <div
                    key={g.group_id}
                    className="py-3.5 flex items-center justify-between gap-4 px-1"
                  >
                    <div className="flex gap-3.5 items-center">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                        <i className={`${g.icon} text-lg`} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm leading-none">
                          {g.name}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 block">
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

          {/* Upcoming Events */}
          <Card title="Upcoming Schedules" icon="fas fa-calendar-alt">
            <div className="space-y-3">
              {events.length > 0 ? (
                events.map((ev) => (
                  <div
                    key={ev.event_id}
                    className="p-3.5 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50 hover:border-slate-350 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <i className={`${ev.group_icon} text-[10px] text-indigo-500`} />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {ev.group_name}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-xs leading-snug">
                      {ev.title}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-semibold">
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
                <div key={c.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-900">{c.title}</span>
                    <span className="text-indigo-600 text-[10px] uppercase font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full">{c.reward}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-400">
                      {c.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Create Community Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Study Group / Community"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              isLoading={createMutation.isPending}
            >
              Create Community
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          <Input
            id="comm-name-modal"
            label="Community Name"
            value={commName}
            onChange={(e) => setCommName(e.target.value)}
            placeholder="e.g. Calculus Conquerors"
            required
          />

          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={commDesc}
              onChange={(e) => setCommDesc(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all duration-200 h-24"
              placeholder="What is this community about? Provide details..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Category/Subject
              </label>
              <select
                value={commCategory}
                onChange={(e) => setCommCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-bold"
              >
                <option value="mathematics">Mathematics</option>
                <option value="science">Science</option>
                <option value="programming">Programming</option>
                <option value="languages">Languages</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Visibility
              </label>
              <select
                value={commVisibility}
                onChange={(e) => setCommVisibility(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-bold"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <Input
            id="comm-icon-modal"
            label="Icon Class (Optional)"
            value={commIcon}
            onChange={(e) => setCommIcon(e.target.value)}
            placeholder="e.g. fas fa-calculator"
          />
        </form>
      </Modal>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default Community;
