"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Users, MessageCircle, ClipboardCheck } from "lucide-react";
import type { Event, Registration, Question, Survey, SurveyResponse } from "@/types";

interface ExportClientProps {
  event: Event;
  registrations: Registration[];
  questions: Question[];
  survey: Survey | null;
  surveyResponses: SurveyResponse[];
}

export function ExportClient({
  event,
  registrations,
  questions,
  survey,
  surveyResponses,
}: ExportClientProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value).replace(/"/g, '""');
          })
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRegistrations = () => {
    setExporting("registrations");
    const data = registrations.map((reg) => ({
      name: reg.user?.name || "",
      email: reg.user?.email || "",
      checked_in: reg.checked_in_at ? "Yes" : "No",
      checked_in_at: reg.checked_in_at || "",
      registered_at: reg.created_at,
      source: reg.source,
    }));
    exportToCSV(data, `${event.slug}-registrations`);
    setTimeout(() => setExporting(null), 1000);
  };

  const exportQuestions = () => {
    setExporting("questions");
    const data = questions.map((q) => ({
      content: q.content,
      author: q.user?.name || "Anonymous",
      upvotes: q.upvotes,
      status: q.status,
      tags: q.tags.join("; "),
      created_at: q.created_at,
      answer_count: q.answers?.length || 0,
    }));
    exportToCSV(data, `${event.slug}-questions`);
    setTimeout(() => setExporting(null), 1000);
  };

  const exportSurveyResponses = () => {
    if (!survey) {
      alert("No survey available");
      return;
    }
    setExporting("survey");
    const data = surveyResponses.map((response) => ({
      user_id: response.user_id || "anonymous",
      responses: JSON.stringify(response.responses),
      created_at: response.created_at,
    }));
    exportToCSV(data, `${event.slug}-survey-responses`);
    setTimeout(() => setExporting(null), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Registrations */}
      <div className="glass rounded-[40px] p-10 border-white/[0.03] group hover:bg-white/[0.01] transition-all">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
              <Users className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-light tracking-tight text-white/90">Identity Matrix</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                {registrations.length} Verified Registrations
              </p>
            </div>
          </div>
          <button
            onClick={exportRegistrations}
            disabled={exporting !== null || registrations.length === 0}
            className={`px-8 py-4 rounded-2xl font-medium text-sm transition-all flex items-center gap-3 ${
              exporting !== null || registrations.length === 0
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-white text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            }`}
          >
            {exporting === "registrations" ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download CSV
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="glass rounded-[40px] p-10 border-white/[0.03] group hover:bg-white/[0.01] transition-all">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-6 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
              <MessageCircle className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-light tracking-tight text-white/90">Query Streams</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                {questions.length} Active Submissions
              </p>
            </div>
          </div>
          <button
            onClick={exportQuestions}
            disabled={exporting !== null || questions.length === 0}
            className={`px-8 py-4 rounded-2xl font-medium text-sm transition-all flex items-center gap-3 ${
              exporting !== null || questions.length === 0
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-white text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            }`}
          >
            {exporting === "questions" ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download CSV
          </button>
        </div>
      </div>

      {/* Survey Responses */}
      {survey ? (
        <div className="glass rounded-[40px] p-10 border-white/[0.03] group hover:bg-white/[0.01] transition-all">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-6 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-all">
                <ClipboardCheck className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-light tracking-tight text-white/90">Feedback Pulses</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-800 font-medium">
                  {surveyResponses.length} Received Inputs
                </p>
              </div>
            </div>
            <button
              onClick={exportSurveyResponses}
              disabled={exporting !== null || surveyResponses.length === 0}
              className={`px-8 py-4 rounded-2xl font-medium text-sm transition-all flex items-center gap-3 ${
                exporting !== null || surveyResponses.length === 0
                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                  : "bg-white text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              }`}
            >
              {exporting === "survey" ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-[40px] p-12 text-center border-dashed border-white/5 opacity-40">
          <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-600">
            No survey matrix detected
          </p>
        </div>
      )}
    </div>
  );
}
  );
}
