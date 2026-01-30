"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TableQRCode } from "@/types";
import { Upload } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-6 py-3 rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload QR"}
          </button>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
            Link format: /{eventSlug}?table=NUMBER
          </p>
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
                <span className="text-[10px] text-gray-600">Stored</span>
              </div>
              {qr.qr_image_url ? (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
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
