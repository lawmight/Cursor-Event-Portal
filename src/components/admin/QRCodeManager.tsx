"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TableQRCode } from "@/types";
import { Upload, Trash2, Copy, Check, ChevronDown, ChevronRight, X, ScanQrCode } from "lucide-react";

interface QRCodeManagerProps {
  eventId: string;
  eventSlug: string;
  adminCode?: string;
  qrCodes: TableQRCode[];
}

export function QRCodeManager({ eventId, eventSlug, adminCode, qrCodes }: QRCodeManagerProps) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrDrawerOpen, setQrDrawerOpen] = useState(false);
  const [lightboxQr, setLightboxQr] = useState<TableQRCode | null>(null);

  useEffect(() => {
    setBaseUrl(
      typeof window !== "undefined"
        ? (process.env.NEXT_PUBLIC_BASE_URL || window.location.origin)
        : ""
    );
  }, []);

  const tableUrl = (num: number) => `${baseUrl}/${eventSlug}?table=${num}`;

  const copyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  const handleUpload = async () => {
    setError(null);
    setSuccess(null);

    const parsedTable = Number.parseInt(tableNumber, 10);
    if (!Number.isFinite(parsedTable) || parsedTable < 1) {
      setError("Enter a valid table number.");
      return;
    }

    if (!file) {
      setError("Select a QR image to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", eventId);
      formData.append("tableNumber", String(parsedTable));
      if (adminCode) {
        formData.append("adminCode", adminCode);
      }

      const response = await fetch("/api/admin/upload-qr", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Upload failed");
        setIsUploading(false);
        return;
      }

      setSuccess(`QR code saved for table ${parsedTable}.`);
      setFile(null);
      setTableNumber("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (qr: TableQRCode) => {
    setError(null);
    setSuccess(null);
    setDeletingId(qr.id);
    try {
      const response = await fetch("/api/admin/delete-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodeId: qr.id,
          ...(adminCode && { adminCode }),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to remove QR code");
        return;
      }
      setSuccess(`Table ${qr.table_number} QR code removed.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass rounded-[40px] p-10 border-white/[0.06]">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-[11px] uppercase tracking-[0.5em] text-gray-500 font-medium">Table QR Codes</h3>
          <div className="h-[1px] flex-1 bg-white/[0.03]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">Table Number</label>
            <input
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30"
              placeholder="e.g. 12"
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">QR Image</label>
            <label className="flex items-center justify-center gap-3 h-12 rounded-xl border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all cursor-pointer">
              <Upload strokeWidth={1.5} className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.2em]">Choose File</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <p className="text-[11px] text-gray-500">Selected: {file.name}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-6 py-3 rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload QR"}
            </button>
            {baseUrl && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600">URL to encode in QR:</span>
                <code className="text-[11px] text-white/90 bg-white/5 px-2 py-1 rounded truncate max-w-[280px]" title={tableNumber ? tableUrl(Number(tableNumber)) : `${baseUrl}/${eventSlug}?table=NUMBER`}>
                  {tableNumber ? tableUrl(Number(tableNumber)) : `${baseUrl}/${eventSlug}?table=NUMBER`}
                </code>
                {tableNumber && (
                  <button
                    type="button"
                    onClick={() => copyUrl(tableUrl(Number(tableNumber)), "upload")}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === "upload" ? <Check strokeWidth={1.5} className="w-3.5 h-3.5" /> : <Copy strokeWidth={1.5} className="w-3.5 h-3.5" />}
                    {copiedId === "upload" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            )}
          </div>
          {baseUrl && (
            <p className="text-[10px] text-gray-500">
              Use the URL above in any QR generator (e.g. qr-code-generator.com). The table number in the URL assigns the attendee to that table when they scan and check in.
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-sm">
            {success}
          </div>
        )}
      </div>

      {qrCodes.length > 0 && (
        <>
          {/* Collapsible drawer trigger */}
          <button
            type="button"
            onClick={() => setQrDrawerOpen(!qrDrawerOpen)}
            className="w-full glass rounded-[32px] p-6 border-white/[0.06] hover:bg-white/[0.03] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <ScanQrCode 
                  strokeWidth={1.5}
                  className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" 
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white/90">{qrCodes.length} Table QR Code{qrCodes.length !== 1 ? "s" : ""}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Click to browse</p>
              </div>
            </div>
            {qrDrawerOpen ? (
              <ChevronDown strokeWidth={1.5} className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            ) : (
              <ChevronRight strokeWidth={1.5} className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            )}
          </button>

          {/* Expanded folder grid */}
          {qrDrawerOpen && (
            <div className="glass rounded-[32px] p-8 border-white/[0.06] animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {qrCodes.map((qr) => (
                  <div key={qr.id} className="group/card relative">
                    <button
                      type="button"
                      onClick={() => qr.qr_image_url ? setLightboxQr(qr) : undefined}
                      className="w-full flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
                    >
                      {qr.qr_image_url ? (
                        <div className="w-full aspect-square bg-white/[0.02] rounded-xl p-2 flex items-center justify-center">
                          <img
                            src={qr.qr_image_url}
                            alt={`Table ${qr.table_number} QR`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-white/[0.02] rounded-xl flex items-center justify-center">
                          <ScanQrCode strokeWidth={1.5} className="w-8 h-8 text-gray-700" />
                        </div>
                      )}
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium">Table {qr.table_number}</p>
                    </button>
                    {/* Remove button on hover */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(qr); }}
                      disabled={deletingId === qr.id}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
                      title="Remove"
                    >
                      <X strokeWidth={1.5} className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full-size lightbox */}
          {lightboxQr && (
            <div
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
              onClick={() => setLightboxQr(null)}
            >
              <div
                className="relative max-w-md w-full bg-white/[0.05] border border-white/[0.1] rounded-[32px] p-8 flex flex-col items-center gap-6"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setLightboxQr(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <p className="text-[11px] uppercase tracking-[0.4em] text-gray-400 font-medium">Table {lightboxQr.table_number}</p>
                {lightboxQr.qr_image_url && (
                  <div className="w-full max-w-[320px] aspect-square bg-white rounded-2xl p-4">
                    <img
                      src={lightboxQr.qr_image_url}
                      alt={`Table ${lightboxQr.table_number} QR`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {baseUrl && (
                    <button
                      type="button"
                      onClick={() => copyUrl(tableUrl(lightboxQr.table_number), lightboxQr.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[10px] uppercase tracking-[0.2em] text-gray-300 hover:text-white transition-all"
                    >
                      {copiedId === lightboxQr.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === lightboxQr.id ? "Copied" : "Copy URL"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { handleRemove(lightboxQr); setLightboxQr(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-[10px] uppercase tracking-[0.2em] text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
