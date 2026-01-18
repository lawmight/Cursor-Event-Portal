"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event, SlideDeck } from "@/types";
import { PdfDeckViewer } from "@/components/slides/PdfDeckViewer";
import { removeSlideDeck } from "@/lib/actions/slideDecks";

interface SlidesAdminClientProps {
  event: Event;
  eventSlug: string;
  initialDeck: SlideDeck | null;
}

export function SlidesAdminClient({ event, eventSlug, initialDeck }: SlidesAdminClientProps) {
  const router = useRouter();
  const [deck, setDeck] = useState<SlideDeck | null>(initialDeck);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadProgress("Uploading PDF deck...");

    try {
      const fileName = file.name.toLowerCase();
      const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
      if (!isPdf) {
        throw new Error("Please upload a PDF slide deck.");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", event.id);

      const uploadResponse = await fetch("/api/admin/upload-deck", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload deck");
      }

      const { deck: uploadedDeck } = await uploadResponse.json();
      setDeck(uploadedDeck);
      router.refresh();
      setShowUploadModal(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload deck";
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleRemoveDeck = async () => {
    if (!confirm("Remove the current slide deck?")) return;

    setError(null);
    const result = await removeSlideDeck(event.id, eventSlug);
    if (result.error) {
      setError(result.error);
      return;
    }

    setDeck(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black-gradient text-white pb-20">
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
            Slide Deck
          </h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-xl"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-fade-in">
        {error && (
          <div className="glass rounded-[32px] p-6 bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="glass rounded-[32px] p-6 bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            Upload one PDF deck per event. This replaces the previous deck and is shown to attendees in the display view.
          </p>
        </div>

        {deck ? (
          <div className="glass rounded-[40px] p-8 border-white/[0.03] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Current Deck</p>
                <p className="text-xl font-light text-white/90 mt-2">{event.name} Slide Deck</p>
              </div>
              <button
                onClick={handleRemoveDeck}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 text-red-400 text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>

            <div className="w-full aspect-video bg-black/40 rounded-[28px] border border-white/10 overflow-hidden">
              <PdfDeckViewer pdfUrl={deck.pdf_url} className="w-full h-full" />
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowUploadModal(true)}
            className="text-center py-24 glass rounded-[40px] border-dashed border-white/10 cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all group"
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-600 group-hover:text-white transition-colors" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600 group-hover:text-white transition-colors">
              No deck uploaded yet
            </p>
            <p className="text-[9px] text-gray-800 group-hover:text-gray-400 mt-2 transition-colors">
              Click here or the + button to upload a PDF deck
            </p>
          </div>
        )}
      </main>

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
              <h2 className="text-2xl font-light text-white">Upload Slide Deck</h2>
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
                  Select PDF Deck
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                    id="deck-upload"
                  />
                  <label
                    htmlFor="deck-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-56 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                      uploading
                        ? "border-white/10 bg-white/5 cursor-not-allowed"
                        : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
                    )}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 mb-3 text-blue-400 animate-spin" />
                        <p className="text-sm text-blue-400 font-medium">
                          {uploadProgress || "Uploading..."}
                        </p>
                        <p className="text-[9px] text-gray-600 mt-2">
                          Please wait while the deck is being uploaded
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-7 h-7 text-red-400" />
                          <Upload className="w-7 h-7 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-400">Click to select PDF deck</p>
                        <p className="text-[9px] text-gray-600 mt-1">Each page becomes a slide in the viewer</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
