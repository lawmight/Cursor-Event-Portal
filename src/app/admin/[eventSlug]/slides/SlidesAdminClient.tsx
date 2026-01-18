"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { uploadSlide, deleteSlide, updateSlide, reorderSlides, toggleSlideLive } from "@/lib/actions/slides";
import type { Event, Slide } from "@/types";
import { ArrowLeft, Plus, Trash2, Edit2, GripVertical, Upload, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlidesAdminClientProps {
  event: Event;
  eventSlug: string;
  initialSlides: Slide[];
}

export function SlidesAdminClient({
  event,
  eventSlug,
  initialSlides,
}: SlidesAdminClientProps) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // Upload slide deck to server
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", event.id);

      const uploadResponse = await fetch("/api/admin/upload-slide", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload slide deck");
      }

      const { slides, count } = await uploadResponse.json();

      if (!slides || slides.length === 0) {
        throw new Error("No slides were extracted from the file");
      }

      // Create slide records for each extracted slide
      startTransition(async () => {
        let successCount = 0;
        let errorCount = 0;

        for (const slide of slides) {
          const result = await uploadSlide(
            event.id,
            eventSlug,
            slide.url,
            `Slide ${slide.pageNumber}`
          );
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }

        if (errorCount > 0) {
          setError(
            `Uploaded ${successCount} of ${slides.length} slides. ${errorCount} failed.`
          );
        } else {
          router.refresh();
          setShowUploadModal(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
        setUploading(false);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload slide deck";
      setError(errorMessage);
      setUploading(false);
    }
  };

  const handleDelete = async (slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteSlide(slideId, eventSlug);
      if (result.success) {
        setSlides((prev) => prev.filter((s) => s.id !== slideId));
        router.refresh();
      } else {
        setError(result.error || "Failed to delete slide");
      }
    });
  };

  const handleUpdate = async (slideId: string, data: { title?: string }) => {
    setError(null);
    startTransition(async () => {
      const result = await updateSlide(slideId, eventSlug, data);
      if (result.success) {
        router.refresh();
        setEditingSlide(null);
      } else {
        setError(result.error || "Failed to update slide");
      }
    });
  };

  const handleReorder = async (newOrder: Slide[]) => {
    const slideIds = newOrder.map((s) => s.id);
    setSlides(newOrder);
    
    startTransition(async () => {
      await reorderSlides(eventSlug, slideIds);
      router.refresh();
    });
  };

  const handleToggleLive = async (slideId: string, isLive: boolean) => {
    setError(null);
    
    // Optimistic update
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        is_live: s.id === slideId ? isLive : false, // Turn off others when enabling
      }))
    );

    startTransition(async () => {
      const result = await toggleSlideLive(slideId, eventSlug, isLive);
      if (result.error) {
        setError(result.error);
        router.refresh(); // Revert on error
      } else {
        router.refresh();
      }
    });
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newSlides = [...slides];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newSlides.length) return;

    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    handleReorder(newSlides);
  };

  return (
    <div className="min-h-screen bg-black-gradient text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 backdrop-blur-3xl">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href={`/admin/${eventSlug}`}
            className="flex items-center gap-2 text-gray-600 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exit</span>
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-[0.4em]">
            Slides Management
          </h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-xl"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in">
        {/* Error Message */}
        {error && (
          <div className="glass rounded-[32px] p-6 bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="glass rounded-[32px] p-6 bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            Upload slide images (PNG, JPG) one at a time. <span className="text-blue-300">To export from PowerPoint: File → Export → Change File Type → PNG</span>. Slides will be displayed to attendees when marked as "Live" (eye icon). Only one slide can be live at a time.
          </p>
        </div>

        {/* Slides Grid */}
        {slides.length === 0 ? (
          <div
            onClick={() => setShowUploadModal(true)}
            className="text-center py-24 glass rounded-[40px] border-dashed border-white/10 cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all group"
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-600 group-hover:text-white transition-colors" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600 group-hover:text-white transition-colors">
              No slides yet
            </p>
            <p className="text-[9px] text-gray-800 group-hover:text-gray-400 mt-2 transition-colors">
              Click here or the + button to upload your first slide
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="glass rounded-[32px] p-6 border-white/[0.03] hover:bg-white/[0.01] transition-all relative group"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 mb-4">
                  <Image
                    src={slide.image_url}
                    alt={slide.title || `Slide ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {slide.title ? (
                      <p className="text-sm font-light text-white/90 truncate">{slide.title}</p>
                    ) : (
                      <p className="text-xs text-gray-600">Slide {index + 1}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[9px] text-gray-700">
                        Position {index + 1} of {slides.length}
                      </p>
                      {slide.is_live && (
                        <span className="text-[9px] uppercase tracking-wider text-green-400 font-medium flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleLive(slide.id, !slide.is_live)}
                      disabled={isPending}
                      className={cn(
                        "w-8 h-8 rounded-lg border transition-all flex items-center justify-center",
                        slide.is_live
                          ? "bg-green-500/20 border-green-500/30 text-green-400"
                          : "bg-white/[0.02] border-white/5 text-gray-600 hover:text-white hover:border-white/20"
                      )}
                      title={slide.is_live ? "Hide from attendees" : "Show to attendees"}
                    >
                      {slide.is_live ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => moveSlide(index, "up")}
                      disabled={index === 0 || isPending}
                      className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white hover:border-white/20 transition-all flex items-center justify-center disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSlide(index, "down")}
                      disabled={index === slides.length - 1 || isPending}
                      className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white hover:border-white/20 transition-all flex items-center justify-center disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setEditingSlide(slide)}
                      disabled={isPending}
                      className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id)}
                      disabled={isPending}
                      className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 text-gray-800 hover:text-red-500 hover:border-red-500/20 transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !uploading && setShowUploadModal(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md glass rounded-[40px] p-10 space-y-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light text-white">Upload Slide</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">
                <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-3">
                  Select Slide Image
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                    id="slide-upload"
                  />
                  <label
                    htmlFor="slide-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                      uploading
                        ? "border-white/10 bg-white/5 cursor-not-allowed"
                        : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
                    )}
                  >
                    <Upload className={cn("w-8 h-8 mb-3", uploading ? "text-gray-700" : "text-gray-500")} />
                    <p className="text-sm text-gray-400">
                      {uploading ? "Uploading..." : "Click to select slide image"}
                    </p>
                    <p className="text-[9px] text-gray-700 mt-1">
                      PNG, JPG, WebP up to 50MB
                    </p>
                    <p className="text-[8px] text-gray-800 mt-2 text-center max-w-xs">
                      Export slides from PowerPoint as images
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSlide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingSlide(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md glass rounded-[40px] p-10 space-y-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light text-white">Edit Slide</h2>
              <button
                onClick={() => setEditingSlide(null)}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                handleUpdate(editingSlide.id, { title: title.trim() || undefined });
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingSlide.title || ""}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
                  placeholder="e.g., Welcome Slide"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-14 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
                >
                  {isPending ? "..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  disabled={isPending}
                  className="px-8 h-14 rounded-full bg-white/5 border border-white/10 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
