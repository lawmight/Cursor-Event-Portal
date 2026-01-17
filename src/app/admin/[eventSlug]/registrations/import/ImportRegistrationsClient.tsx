"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
} from "lucide-react";

interface ImportRegistrationsClientProps {
  eventId: string;
  eventSlug: string;
  existingEmails: string[];
}

interface ParsedAttendee {
  name: string;
  email: string;
  status: "new" | "existing" | "invalid";
}

export function ImportRegistrationsClient({
  eventId,
  eventSlug,
  existingEmails,
}: ImportRegistrationsClientProps) {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ParsedAttendee[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const existingSet = new Set(existingEmails.map((e) => e.toLowerCase()));

  // Parse Luma CSV/TSV format (handles both comma and tab delimiters)
  const parseCSV = useCallback(
    (text: string) => {
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        setParsed([]);
        return;
      }

      // Detect delimiter (tab or comma)
      const firstLine = lines[0];
      const delimiter = firstLine.includes("\t") ? "\t" : ",";

      // Find header row - Luma exports have headers like "name", "email", etc.
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/"/g, ""));

      const nameIdx = headers.findIndex(
        (h) => h === "name" || h === "full name" || h === "attendee name"
      );
      const firstNameIdx = headers.findIndex((h) => h === "first_name" || h === "first name");
      const lastNameIdx = headers.findIndex((h) => h === "last_name" || h === "last name");
      const emailIdx = headers.findIndex(
        (h) => h === "email" || h === "attendee email" || h === "email address"
      );

      if (emailIdx === -1) {
        // Try to find email column by content pattern
        setParsed([]);
        return;
      }

      const attendees: ParsedAttendee[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse line based on detected delimiter
        const values: string[] = [];

        if (delimiter === "\t") {
          // Tab-separated: simple split
          values.push(...line.split("\t").map((v) => v.trim().replace(/"/g, "")));
        } else {
          // Comma-separated: handle quoted fields
          let current = "";
          let inQuotes = false;

          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim());
        }

        const email = values[emailIdx]?.replace(/"/g, "").toLowerCase().trim();

        // Build name: prefer "name" column, fall back to first_name + last_name
        let name = "";
        if (nameIdx >= 0 && values[nameIdx]) {
          name = values[nameIdx].replace(/"/g, "").trim();
        } else if (firstNameIdx >= 0 || lastNameIdx >= 0) {
          const firstName = firstNameIdx >= 0 ? values[firstNameIdx]?.replace(/"/g, "").trim() || "" : "";
          const lastName = lastNameIdx >= 0 ? values[lastNameIdx]?.replace(/"/g, "").trim() || "" : "";
          name = `${firstName} ${lastName}`.trim();
        }

        if (!name) {
          name = email?.split("@")[0] || "Unknown";
        }

        if (!email || !email.includes("@")) {
          continue; // Skip invalid emails
        }

        const status: "new" | "existing" | "invalid" = existingSet.has(email)
          ? "existing"
          : "new";

        attendees.push({ name, email, status });
      }

      setParsed(attendees);
    },
    [existingSet]
  );

  const handleTextChange = (text: string) => {
    setCsvText(text);
    parseCSV(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const toImport = parsed.filter((a) => a.status === "new");
    if (toImport.length === 0) return;

    setImporting(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/import-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          attendees: toImport.map((a) => ({ name: a.name, email: a.email })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: 0,
          skipped: toImport.length,
          errors: [data.error || "Import failed"],
        });
      } else {
        setResult({
          success: data.imported || 0,
          skipped: data.skipped || 0,
          errors: data.errors || [],
        });

        // Refresh the page to show updated registrations
        if (data.imported > 0) {
          router.refresh();
        }
      }
    } catch (error) {
      setResult({
        success: 0,
        skipped: toImport.length,
        errors: ["Network error - please try again"],
      });
    } finally {
      setImporting(false);
    }
  };

  const newCount = parsed.filter((a) => a.status === "new").length;
  const existingCount = parsed.filter((a) => a.status === "existing").length;

  return (
    <div className="space-y-6">
      {/* CSV Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Paste CSV or Upload File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload CSV file
                </p>
              </div>
            </label>
          </div>

          <div className="relative">
            <Textarea
              placeholder={`Paste Luma CSV export here...\n\nExpected format:\nname,email\nJohn Doe,john@example.com\nJane Smith,jane@example.com`}
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Preview ({parsed.length} attendees found)
              </span>
              <div className="flex gap-4 text-sm font-normal">
                <span className="text-green-600 dark:text-green-400">
                  {newCount} new
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">
                  {existingCount} existing
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((attendee, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 px-2">
                        {attendee.status === "new" ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            New
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                            <XCircle className="w-4 h-4" />
                            Exists
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">{attendee.name}</td>
                      <td className="py-2 px-2 text-gray-500">{attendee.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {result && (
        <Card
          className={
            result.success > 0
              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
              : "border-red-500 bg-red-50 dark:bg-red-950/20"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {result.success > 0 ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  {result.success > 0
                    ? `Successfully imported ${result.success} attendees`
                    : "Import failed"}
                </p>
                {result.skipped > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {result.skipped} skipped (already registered)
                  </p>
                )}
                {result.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleImport}
          disabled={newCount === 0 || importing}
          className="flex-1"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import {newCount} New Attendees
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCsvText("");
            setParsed([]);
            setResult(null);
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
