"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitSurveyResponse } from "@/lib/actions/survey";
import type { Survey, SurveyField } from "@/types";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyFormProps {
  survey: Survey;
  eventSlug: string;
}

export function SurveyForm({ survey, eventSlug }: SurveyFormProps) {
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    for (const field of survey.schema.fields) {
      if (field.required && !responses[field.id]) {
        setError(`Please answer: ${field.label}`);
        return;
      }
    }

    setLoading(true);

    try {
      const result = await submitSurveyResponse(survey.id, eventSlug, responses);

      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Thank You!
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your feedback has been submitted. We appreciate your input!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{survey.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.schema.fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={responses[field.id]}
              onChange={(value) =>
                setResponses({ ...responses, [field.id]: value })
              }
              disabled={loading}
            />
          ))}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Submit Feedback
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface FieldRendererProps {
  field: SurveyField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function FieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  switch (field.type) {
    case "text":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <Input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <Textarea
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={4}
          />
        </div>
      );

    case "rating":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange(rating)}
                disabled={disabled}
                className={cn(
                  "w-10 h-10 rounded-lg font-medium transition-colors",
                  value === rating
                    ? "bg-cursor-purple text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      );

    case "nps":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                disabled={disabled}
                className={cn(
                  "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                  value === score
                    ? "bg-cursor-purple text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </div>
      );

    case "select":
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cursor-purple"
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    default:
      return null;
  }
}
