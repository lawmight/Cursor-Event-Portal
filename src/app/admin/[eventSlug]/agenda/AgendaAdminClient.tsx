"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { createAgendaItem, updateAgendaItem, deleteAgendaItem } from "@/lib/actions/agenda";
import type { Event, AgendaItem } from "@/types";
import { ArrowLeft, Plus, Trash2, Edit2, Clock, MapPin, User } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface AgendaAdminClientProps {
  event: Event;
  eventSlug: string;
  adminCode?: string;
  initialItems: AgendaItem[];
}

export function AgendaAdminClient({
  event,
  eventSlug,
  adminCode,
  initialItems,
}: AgendaAdminClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this agenda item?")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteAgendaItem(itemId, eventSlug);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        router.refresh();
      } else {
        setError(result.error || "Failed to delete agenda item");
      }
    });
  };

  const handleCreate = async (data: {
    title: string;
    description?: string;
    location?: string;
    speaker?: string;
    start_time?: string;
    end_time?: string;
  }) => {
    setError(null);
    startTransition(async () => {
      const result = await createAgendaItem(event.id, eventSlug, data);
      if (result.success) {
        router.refresh();
        setShowCreateModal(false);
      } else {
        setError(result.error || "Failed to create agenda item");
      }
    });
  };

  const handleUpdate = async (itemId: string, data: Partial<AgendaItem>) => {
    setError(null);
    startTransition(async () => {
      const result = await updateAgendaItem(itemId, eventSlug, data);
      if (result.success) {
        router.refresh();
        setEditingItem(null);
      } else {
        setError(result.error || "Failed to update agenda item");
      }
    });
  };

  const handleInitAgenda = async () => {
    if (!confirm("This will create default agenda items for the event. Continue?")) return;

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/init-agenda", {
          method: "POST",
        });

        if (response.ok) {
          router.refresh();
        } else {
          const errorData = await response.json().catch(() => ({ error: "Failed to initialize agenda" }));
          setError(errorData.error || "Failed to initialize agenda");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
      }
    });
  };

  return (
    <div className="min-h-screen bg-black-gradient text-white pb-20">
      <AdminHeader 
        eventSlug={eventSlug} 
        subtitle="Agenda Management"
        rightElement={
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-xl"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in">
        {/* Error Message */}
        {error && (
          <div className="glass rounded-[32px] p-6 bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Agenda Items */}
        {items.length === 0 ? (
          <div className="text-center py-24 glass rounded-[40px] border-dashed border-white/5 space-y-6">
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
              No agenda items yet
            </p>
            <button
              onClick={handleInitAgenda}
              disabled={isPending}
              className="px-8 py-4 rounded-2xl bg-white text-black hover:bg-gray-200 transition-all text-[10px] uppercase tracking-[0.2em] font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Initializing..." : "Initialize Default Agenda"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass rounded-[32px] p-8 border-white/[0.03] hover:bg-white/[0.01] transition-all"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      {item.start_time && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-[0.2em]">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.start_time, event.timezone || "America/Edmonton")}
                          {item.end_time && ` – ${formatTime(item.end_time, event.timezone || "America/Edmonton")}`}
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-light tracking-tight text-white/90">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-[10px] text-gray-700">
                      {item.speaker && (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {item.speaker}
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingItem(item)}
                      disabled={isPending}
                      className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 text-gray-600 hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 text-gray-800 hover:text-red-500 hover:border-red-500/20 transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-12 px-6 border-t border-white/[0.03] flex justify-between items-center z-10">
        <p className="text-[10px] uppercase tracking-[0.6em] text-gray-500 font-medium">Pop-Up System / MMXXVI</p>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Agenda</p>
        </div>
      </footer>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingItem) && (
        <CreateEditModal
          item={editingItem}
          onClose={() => {
            setShowCreateModal(false);
            setEditingItem(null);
          }}
          onCreate={handleCreate}
          onUpdate={editingItem ? (data) => handleUpdate(editingItem.id, data) : undefined}
          isPending={isPending}
        />
      )}
    </div>
  );
}

interface CreateEditModalProps {
  item: AgendaItem | null;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    location?: string;
    speaker?: string;
    start_time?: string;
    end_time?: string;
  }) => void;
  onUpdate?: (data: Partial<AgendaItem>) => void;
  isPending: boolean;
}

function CreateEditModal({
  item,
  onClose,
  onCreate,
  onUpdate,
  isPending,
}: CreateEditModalProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [location, setLocation] = useState(item?.location || "");
  const [speaker, setSpeaker] = useState(item?.speaker || "");
  const [startTime, setStartTime] = useState(
    item?.start_time ? new Date(item.start_time).toISOString().slice(0, 16) : ""
  );
  const [endTime, setEndTime] = useState(
    item?.end_time ? new Date(item.end_time).toISOString().slice(0, 16) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      speaker: speaker.trim() || undefined,
      start_time: startTime ? new Date(startTime).toISOString() : undefined,
      end_time: endTime ? new Date(endTime).toISOString() : undefined,
    };

    if (item && onUpdate) {
      onUpdate(data);
    } else {
      onCreate(data);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl glass rounded-[40px] p-10 space-y-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light text-white">
            {item ? "Edit Agenda Item" : "Create Agenda Item"}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
              placeholder="e.g., Welcome & Introductions"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all resize-none"
              placeholder="Additional details about this agenda item..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-2">
                Speaker/Host
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
                placeholder="e.g., Jia Ming Huang"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
                placeholder="e.g., Main Hall"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-14 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
            >
              {isPending ? "..." : item ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-8 h-14 rounded-full bg-white/5 border border-white/10 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

