"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QRCodeManager } from "./QRCodeManager";
import { GroupFormation } from "./GroupFormationView";
import { toggleSeatingEnabled } from "@/lib/actions/seating";
import type { AttendeeIntake, Event, SuggestedGroup, TableQRCode } from "@/types";
import { ScanQrCode, LayoutGrid, BrainCircuit, ToggleRight, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface SeatingManagementClientProps {
  event: Event;
  eventSlug: string;
  adminCode?: string;
  intakes: AttendeeIntake[];
  groups: SuggestedGroup[];
  qrCodes: TableQRCode[];
}

const TABS = [
  { id: "seating", label: "Smart Seating", icon: BrainCircuit },
  { id: "attendees", label: "Guest List", icon: LayoutGrid },
  { id: "qr", label: "QR Setup", icon: ScanQrCode },
];

export function SeatingManagementClient({
  event,
  eventSlug,
  adminCode,
  intakes,
  groups,
  qrCodes,
}: SeatingManagementClientProps) {
  const eventId = event.id;
  const [activeTab, setActiveTab] = useState("seating");
  const [isSeatingEnabled, setIsSeatingEnabled] = useState(event.seating_enabled);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggleSeating = () => {
    const newState = !isSeatingEnabled;

    if (!newState) {
      const confirmed = confirm(
        "DISABLE SEATING?\n\n" +
        "This will hide all seating features from attendees, including table assignments, " +
        "QR seating, and any seating-related onboarding text.\n\n" +
        "You can re-enable seating at any time."
      );
      if (!confirmed) return;
    }

    startTransition(async () => {
      const result = await toggleSeatingEnabled(eventId, newState, eventSlug, adminCode);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsSeatingEnabled(newState);
        toast.success(newState ? "Seating enabled for attendees" : "Seating disabled for attendees");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Seating Enable/Disable Toggle */}
      <div className={`glass rounded-[40px] p-8 border-2 transition-all ${
        isSeatingEnabled
          ? "border-white/20 hover:bg-white/5"
          : "border-orange-500/30 bg-orange-500/5"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
              isSeatingEnabled
                ? "bg-white/10 border-white/5"
                : "bg-orange-500/15 border-orange-500/25"
            }`}>
              {isSeatingEnabled ? (
                <ToggleRight className="w-6 h-6 text-gray-400" />
              ) : (
                <EyeOff className="w-6 h-6 text-orange-400" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-light tracking-tight text-white/90">
                Seating Feature
              </h3>
              <p className={`text-[10px] uppercase tracking-[0.2em] font-medium ${
                isSeatingEnabled ? "text-gray-500" : "text-orange-400/80"
              }`}>
                {isSeatingEnabled
                  ? "Enabled — Attendees can see table assignments"
                  : "Disabled — Seating is hidden from attendees"}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleSeating}
            disabled={isPending}
            className={`px-8 py-3 rounded-full font-bold text-[11px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 ${
              isSeatingEnabled
                ? "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                : "bg-orange-500 text-white hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            }`}
          >
            {isPending ? "..." : isSeatingEnabled ? "Disable Seating" : "Enable Seating"}
          </button>
        </div>

        {!isSeatingEnabled && (
          <div className="mt-6 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <p className="text-xs text-orange-300/80 leading-relaxed">
              Seating is off. Attendees will not see any table assignments, QR seating prompts, or seating-related onboarding text. You can still manage groups here — they just won&apos;t be shown to attendees.
            </p>
          </div>
        )}
      </div>

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
                  : "bg-white/2 text-gray-500 hover:bg-white/5 hover:text-gray-300 border-t border-l border-r border-transparent z-10 hover:z-15 hover:-translate-y-1"}
              `}
            >
              <Icon
                strokeWidth={1.5}
                className={`w-5 h-5 transition-colors ${isActive ? "text-blue-400" : "text-gray-600 group-hover:text-gray-400"}`}
              />
              <span>{tab.label}</span>

              {isActive && (
                <>
                  <div className="absolute -bottom-[2px] left-0 right-0 h-[4px] bg-[#0A0A0A] z-30" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
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
