"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TableQRCode } from "@/types";
import { Upload, Trash2, Copy, Check } from "lucide-react";

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
              <Upload className="w-4 h-4" />
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
                    {copiedId === "upload" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="glass rounded-[32px] p-6 border-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-medium">Table {qr.table_number}</p>
                <div className="flex items-center gap-2">
                  {baseUrl && (
                    <button
                      type="button"
                      onClick={() => copyUrl(tableUrl(qr.table_number), qr.id)}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors"
                      title="Copy table URL"
                    >
                      {copiedId === qr.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === qr.id ? "Copied" : "Copy URL"}
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => handleRemove(qr)}
                  disabled={deletingId === qr.id}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Remove QR code"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
                </div>
              </div>
              {baseUrl && (
                <p className="text-[10px] text-gray-600 mb-3 truncate" title={tableUrl(qr.table_number)}>
                  {tableUrl(qr.table_number)}
                </p>
              )}
              {qr.qr_image_url ? (
                <div className="w-[25%] min-w-[80px] bg-white/[0.02] border border-white/[0.05] rounded-2xl p-2">
                  <img
                    src={qr.qr_image_url}
                    alt={`Table ${qr.table_number} QR`}
                    className="w-full h-auto rounded-xl"
                  />
                </div>
              ) : (
                <div className="text-[11px] text-gray-600">No image uploaded.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
