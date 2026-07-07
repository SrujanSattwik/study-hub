import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import materialService from "../../services/material.service";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Loader from "../../components/ui/Loader";
import Toast from "../../components/ui/Toast";
import { API_URL } from "../../services/api";
import useDebounce from "../../hooks/useDebounce";

export const Materials: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("notes");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const debouncedSearch = useDebounce(searchTerm, 400);

  // 1. TanStack Query for materials list
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "materials",
      filterType,
      page,
      debouncedSearch,
      subjectFilter,
      sortBy,
    ],
    queryFn: () =>
      materialService.getMaterials(
        filterType || undefined,
        page,
        6, // Show 6 items per page for better grid alignment
        debouncedSearch || undefined,
        subjectFilter || undefined,
        sortBy
      ),
  });

  // 2. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: materialService.uploadMaterial,
    onSuccess: () => {
      setToastType("success");
      setToastMessage("Study material uploaded successfully!");
      setIsUploadOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (err: any) => {
      setToastType("error");
      setToastMessage(
        err.response?.data?.message || "Failed to upload material"
      );
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLink("");
    setType("notes");
    setAuthor("");
    setSubject("");
    setDifficulty("");
    setFile(null);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setToastType("error");
      setToastMessage("Title is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    if (link) formData.append("link", link);
    if (author) formData.append("author", author);
    if (subject) formData.append("subject", subject);
    if (difficulty) formData.append("difficulty", difficulty);
    if (file) formData.append("file", file);

    uploadMutation.mutate(formData);
  };

  const handleDownload = async (
    materialId: string,
    filePath: string | null,
    linkPath: string | null
  ) => {
    try {
      await materialService.trackDownload(materialId);
      queryClient.invalidateQueries({ queryKey: ["materials"] }); // Refresh list to update download count

      if (filePath) {
        window.open(`${API_URL}${filePath}`, "_blank");
      } else if (linkPath) {
        window.open(linkPath, "_blank");
      }
    } catch (err) {
      setToastType("error");
      setToastMessage("Failed to download material");
    }
  };

  const categories = [
    { label: "All Resources", value: "", icon: "fas fa-folder-open", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Textbooks", value: "textbook", icon: "fas fa-book", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Videos", value: "video", icon: "fas fa-video", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Audio", value: "audio", icon: "fas fa-headphones", color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Study Notes", value: "notes", icon: "fas fa-sticky-note", color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Unified Hero & Search Card */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6 relative overflow-hidden">
        {/* Background gradient subtle glow */}
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-50 blur-3xl opacity-50" />
        <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-purple-50 blur-3xl opacity-50" />

        <div className="relative flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-gray-900 font-heading">
              Study Materials Hub
            </h2>
            <p className="text-sm text-gray-600">
              Access, download, and share textbooks, videos, lectures, and revision notes.
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
            <i className="fas fa-upload mr-2" /> Upload Material
          </Button>
        </div>

        <div className="relative grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Search Resource</label>
            <Input
              id="mat-search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, description, subject, or author..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Subject Filter */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Subject</label>
              <input
                type="text"
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. Physics"
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Dropdown */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Resource Type</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="">All Types</option>
                <option value="textbook">Textbook</option>
                <option value="video">Video Lecture</option>
                <option value="audio">Audio Guide</option>
                <option value="notes">Study Notes</option>
              </select>
            </div>

            {/* Sort Select */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="newest">Newest Released</option>
                <option value="downloads">Most Downloaded</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((c) => (
          <button
            key={c.label}
            onClick={() => {
              setFilterType(c.value);
              setPage(1);
            }}
            className={`border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center justify-between h-28 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${
              filterType === c.value ? 'border-indigo-600 bg-indigo-50/20' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${c.bg} ${c.color}`}>
              <i className={`${c.icon} text-sm`} />
            </div>
            <div className="mt-2 w-full">
              <h4 className="text-xs font-extrabold text-gray-900 leading-tight truncate">{c.label}</h4>
              {filterType === c.value && data?.totalItems !== undefined && (
                <span className="text-[10px] text-indigo-600 font-bold mt-1 block">
                  {data.totalItems} Files
                </span>
              )}
            </div>
          </button>
        ))}
      </section>

      {/* Materials List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-56 animate-pulse"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 shimmer-skeleton" />
                  <div className="h-4 w-12 bg-slate-150 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  <div className="h-3 w-5/6 bg-slate-150 rounded" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-3">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-8 w-24 bg-slate-150 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-white border border-red-100 rounded-2xl">
          <i className="fas fa-exclamation-circle text-4xl text-red-300 mb-4" />
          <p className="text-sm font-semibold text-gray-500 mb-3">
            Failed to load study materials.
          </p>
          <button
            onClick={() => refetch()}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.materials && data.materials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.materials.map((m) => {
                const typeIcons: Record<string, { icon: string; color: string; bg: string }> = {
                  textbook: { icon: "fas fa-book", color: "text-indigo-600", bg: "bg-indigo-50" },
                  video: { icon: "fas fa-video", color: "text-purple-600", bg: "bg-purple-50" },
                  audio: { icon: "fas fa-volume-up", color: "text-teal-600", bg: "bg-teal-50" },
                  notes: { icon: "fas fa-file-alt", color: "text-amber-500", bg: "bg-amber-50" },
                };
                const meta = typeIcons[m.type || "notes"] || typeIcons.notes;

                return (
                  <Card
                    key={m.id}
                    className="flex flex-col justify-between border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-4">
                      {/* Header: Icon & File Type / Format */}
                      <div className="flex justify-between items-start">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                          <i className={`${meta.icon} text-lg`} />
                        </div>
                        <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-full uppercase">
                          {m.format || m.type || "notes"}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="font-extrabold text-gray-900 text-sm leading-tight line-clamp-1" title={m.title}>
                          {m.title}
                        </h3>
                        {m.description ? (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed min-h-[32px]">
                            {m.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic line-clamp-2 leading-relaxed min-h-[32px]">
                            No description provided.
                          </p>
                        )}
                      </div>

                      {/* Meta badges: Subject, Uploaded By, Date */}
                      <div className="space-y-2 border-t border-gray-100 pt-3">
                        {m.subject && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 font-semibold text-[10px] uppercase w-16 shrink-0">Subject:</span>
                            <span className="text-indigo-600 font-extrabold text-[11px] truncate bg-indigo-50/50 px-2 py-0.5 rounded-md">
                              {m.subject}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase w-16 shrink-0">Uploaded:</span>
                          <span className="text-gray-700 font-bold truncate">
                            {m.author || "Anonymous"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase w-16 shrink-0">Date:</span>
                          <span className="text-gray-500 font-medium">
                            {new Date(m.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Downloads Count & Action button */}
                    <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3 mt-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                        <i className="fas fa-download text-gray-400" />
                        <span>{m.downloadCount} downloads</span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(m.id, m.filePath, m.link)}
                      >
                        <i className="fas fa-download mr-1.5" /> Download
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
              <i className="fas fa-folder-open text-4xl text-gray-300 mb-4" />
              <p className="text-sm font-semibold text-gray-500">
                No materials match your filters. Try resetting search or filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-gray-500">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Study Resource"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadSubmit}
              isLoading={uploadMutation.isPending}
            >
              Upload Material
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleUploadSubmit}>
          <Input
            id="mat-title"
            label="Resource Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Advanced Calculus Notes"
            required
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Provide a brief summary of the resource..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="notes">Study Notes</option>
                <option value="textbook">Textbook</option>
                <option value="video">Video Lecture</option>
                <option value="audio">Audio Guide</option>
              </select>
            </div>

            <Input
              id="mat-author"
              label="Author / Prof."
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Dr. Richard Feyman"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="mat-subject"
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics"
            />
            <Input
              id="mat-difficulty"
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              placeholder="e.g. Advanced"
            />
          </div>

          <Input
            id="mat-link"
            label="External Link (Optional)"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://youtube.com/lecture-url"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Upload File
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            />
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default Materials;
