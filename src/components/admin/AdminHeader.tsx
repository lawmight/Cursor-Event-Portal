"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface AdminHeaderProps {
  eventSlug: string;
  subtitle: string;
  rightElement?: React.ReactNode;
  showBackArrow?: boolean;
}

export function AdminHeader({ eventSlug, subtitle, rightElement, showBackArrow = true }: AdminHeaderProps) {
  return (
    <header className="z-10 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {showBackArrow && (
              <Link 
                href={`/admin/${eventSlug}`}
                className="text-white/40 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
            )}
            <Link 
              href={`/admin/${eventSlug}`}
              className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:bg-white/10 transition-all cursor-pointer group"
            >
              <Image
                src="/cursor-icon.png"
                alt="Cursor"
                width={48}
                height={48}
                className="object-contain group-hover:scale-105 transition-transform"
              />
            </Link>
            <div className="space-y-1">
              <h1 className="text-4xl font-light tracking-tight text-white">Calgary Cursor Meetup - Admin Dashboard</h1>
              <p className="text-[12px] uppercase tracking-[0.4em] text-gray-700 font-medium">{subtitle}</p>
            </div>
          </div>
          {rightElement && (
            <div className="flex items-center gap-4">
              {rightElement}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
