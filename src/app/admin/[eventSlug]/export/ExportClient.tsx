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
    <div className="space-y-4">
      {/* Registrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Registrations</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {registrations.length} total registrations
                </p>
              </div>
            </div>
            <Button
              onClick={exportRegistrations}
              disabled={exporting !== null || registrations.length === 0}
              loading={exporting === "registrations"}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Includes: name, email, check-in status, registration date, and source
          </p>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Q&A</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {questions.length} total questions
                </p>
              </div>
            </div>
            <Button
              onClick={exportQuestions}
              disabled={exporting !== null || questions.length === 0}
              loading={exporting === "questions"}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Includes: question content, author, upvotes, status, tags, and answer count
          </p>
        </CardContent>
      </Card>

      {/* Survey Responses */}
      {survey && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Survey Responses</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {surveyResponses.length} total responses
                  </p>
                </div>
              </div>
              <Button
                onClick={exportSurveyResponses}
                disabled={exporting !== null || surveyResponses.length === 0}
                loading={exporting === "survey"}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Survey: {survey.title}
            </p>
          </CardContent>
        </Card>
      )}

      {!survey && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No survey published for this event
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
