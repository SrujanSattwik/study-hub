import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import materialService from "../../services/material.service";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Loader from "../../components/ui/Loader";
import Toast from "../../components/ui/Toast";
import { API_URL } from "../../services/api";

export const Materials: React.FC = () => {
  const [filterType, setFilterType] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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

  // 1. TanStack Query for materials list
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["materials", filterType, page],
    queryFn: () =>
      materialService.getMaterials(filterType || undefined, page, 5),
  });

  // 2. Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: materialService.uploadMaterial,
    onSuccess: () => {
      setToastType("success");
      setToastMessage("Study material uploaded successfully!");
      setIsUploadOpen(false);
      resetForm();
      refetch();
    },
    onError: (err: any) => {
      setToastType("error");
      setToastMessage(
        err.response?.data?.message || "Failed to upload material",
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
    linkPath: string | null,
  ) => {
    try {
      await materialService.trackDownload(materialId);
      refetch(); // Refresh list to update download count

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
    { label: "All Resources", value: "" },
    { label: "Textbooks", value: "textbook" },
    { label: "Videos", value: "video" },
    { label: "Audio", value: "audio" },
    { label: "Study Notes", value: "notes" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <section className="p-8 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Study Materials Hub
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Access, download, and share textbooks, videos, lectures, and
            revision notes.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
          <i className="fas fa-upload mr-2" /> Upload Material
        </Button>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-150 pb-4">
        {categories.map((c) => (
          <button
            key={c.label}
            onClick={() => {
              setFilterType(c.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all ${
              filterType === c.value
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Materials List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader size="md" label="Retrieving study materials..." />
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
        <div className="space-y-4">
          {data?.materials && data.materials.length > 0 ? (
            data.materials.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 items-start">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xl">
                    <i
                      className={
                        m.type === "textbook"
                          ? "fas fa-book"
                          : m.type === "video"
                            ? "fas fa-video"
                            : m.type === "audio"
                              ? "fas fa-volume-up"
                              : "fas fa-file-alt"
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-sm">
                      {m.title}
                    </h3>
                    {m.description && (
                      <p className="text-xs text-gray-500 max-w-lg">
                        {m.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <span>By: {m.author}</span>
                      <span>•</span>
                      <span>Format: {m.format || "Link"}</span>
                      <span>•</span>
                      <span>Downloads: {m.downloadCount}</span>
                      {m.subject && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-500">{m.subject}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(m.id, m.filePath, m.link)}
                >
                  <i className="fas fa-download mr-2" /> Download
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
              <i className="fas fa-folder-open text-4xl text-gray-300 mb-4" />
              <p className="text-sm font-semibold text-gray-500">
                No materials found in this category.
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
