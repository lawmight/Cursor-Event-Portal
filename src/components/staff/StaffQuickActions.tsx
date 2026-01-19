"use client";

import { useState } from "react";
import { QrCode, Mail, UserPlus, Printer, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffQuickActionsProps {
  onCheckInByQR: () => void;
  onCheckInByEmail: () => void;
  onAddGuest: () => void;
  onPrintBadge?: () => void;
}

export function StaffQuickActions({
  onCheckInByQR,
  onCheckInByEmail,
  onAddGuest,
  onPrintBadge,
}: StaffQuickActionsProps) {
  const [showQRScanner, setShowQRScanner] = useState(false);

  return (
    <div className="glass rounded-[32px] p-6 border border-white/10">
      <h3 className="text-[10px] uppercase tracking-[0.4em] font-medium text-gray-500 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCheckInByQR}
          className="glass rounded-2xl p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500 group-hover:text-white transition-colors">
            QR Check-In
          </span>
        </button>

        <button
          onClick={onCheckInByEmail}
          className="glass rounded-2xl p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500 group-hover:text-white transition-colors">
            Email Check-In
          </span>
        </button>

        <button
          onClick={onAddGuest}
          className="glass rounded-2xl p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserPlus className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500 group-hover:text-white transition-colors">
            Add Guest
          </span>
        </button>

        {onPrintBadge ? (
          <button
            onClick={onPrintBadge}
            className="glass rounded-2xl p-4 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group flex flex-col items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Printer className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-500 group-hover:text-white transition-colors">
              Print Badge
            </span>
          </button>
        ) : (
          <div className="glass rounded-2xl p-4 border border-white/5 opacity-40 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Printer className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-gray-600">
              Print Badge
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
