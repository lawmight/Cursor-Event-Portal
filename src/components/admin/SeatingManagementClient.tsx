"use client";

import { useState } from "react";
import { QRCodeManager } from "./QRCodeManager";
import { GroupFormation } from "./GroupFormation";
import type { AttendeeIntake, SuggestedGroup, TableQRCode } from "@/types";
import { QrCode, Users, Sparkles, LayoutGrid } from "lucide-react";

interface SeatingManagementClientProps {
  eventId: string;
  eventSlug: string;
  adminCode?: string;
  intakes: AttendeeIntake[];
  groups: SuggestedGroup[];
  qrCodes: TableQRCode[];
}

const TABS = [
  { id: "seating", label: "Smart Seating", icon: Sparkles },
  { id: "attendees", label: "Input Matrix", icon: Users },
  { id: "qr", label: "QR Setup", icon: QrCode },
];

export function SeatingManagementClient({
  eventId,
  eventSlug,
  adminCode,
  intakes,
  groups,
  qrCodes,
}: SeatingManagementClientProps) {
  const [activeTab, setActiveTab] = useState("seating");

  return (
    <div className="space-y-8">
      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-end gap-1 px-4 relative z-10">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative px-8 py-5 rounded-t-[32px] text-[11px] uppercase tracking-[0.3em] font-bold transition-all duration-500 group flex items-center gap-3
                ${isActive 
                  ? "bg-[#0A0A0A] text-white border-t border-l border-r border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.5)] z-20" 
                  : "bg-white/[0.02] text-gray-500 hover:bg-white/[0.05] hover:text-gray-300 border-t border-l border-r border-transparent z-10 hover:z-15 hover:-translate-y-1"}
              `}
            >
              <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-blue-400" : "text-gray-600 group-hover:text-gray-400"}`} />
              <span>{tab.label}</span>
              
              {isActive && (
                <>
                  <div className="absolute -bottom-[2px] left-0 right-0 h-[4px] bg-[#0A0A0A] z-30" />
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative z-0">
        {/* Content Area */}
        {activeTab === "seating" && (
          <div className="animate-fade-in space-y-12">
            <GroupFormation
              eventId={eventId}
              eventSlug={eventSlug}
              adminCode={adminCode}
              intakes={intakes}
              groups={groups}
              initialView="groups"
            />
          </div>
        )}

        {activeTab === "attendees" && (
          <div className="animate-fade-in">
            <GroupFormation
              eventId={eventId}
              eventSlug={eventSlug}
              adminCode={adminCode}
              intakes={intakes}
              groups={groups}
              initialView="attendees"
            />
          </div>
        )}

        {activeTab === "qr" && (
          <div className="animate-fade-in">
            <QRCodeManager
              eventId={eventId}
              eventSlug={eventSlug}
              adminCode={adminCode}
              qrCodes={qrCodes}
            />
          </div>
        )}
      </div>
    </div>
  );
}
