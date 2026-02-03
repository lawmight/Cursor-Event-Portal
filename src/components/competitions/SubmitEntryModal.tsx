"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { submitEntry } from "@/lib/actions/competitions";

interface SubmitEntryModalProps {
  competitionId: string;
  eventSlug: string;
  onClose: () => void;
}

export function SubmitEntryModal({
  competitionId,
  eventSlug,
  onClose,
}: SubmitEntryModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a project title");
      return;
    }
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub URL");
      return;
    }
    if (!previewImageUrl.trim() && !videoUrl.trim()) {
      setError("Add at least one: preview image URL or video URL (so we can show your project on screen)");
      return;
    }

    setLoading(true);
    const result = await submitEntry(competitionId, eventSlug, {
      title: title.trim(),
      description: description.trim() || undefined,
      repo_url: repoUrl.trim(),
      project_url: projectUrl.trim() || undefined,
      preview_image_url: previewImageUrl.trim() || undefined,
      video_url: videoUrl.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass rounded-[32px] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative z-10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-light text-white">Submit Project</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Project"
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your project..."
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
              GitHub URL
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
              Project URL (optional)
            </label>
            <input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://your-project-demo.com"
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
              Preview image URL
            </label>
            <input
              type="url"
              value={previewImageUrl}
              onChange={(e) => setPreviewImageUrl(e.target.value)}
              placeholder="https://imgur.com/... or direct image link"
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all"
            />
            <p className="mt-1 text-[10px] text-gray-500">
              Screenshot or hero image — shown on the voting screen and big screen. At least one of image or video is required.
            </p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
              Video URL (optional)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or Vimeo link"
              disabled={loading}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
