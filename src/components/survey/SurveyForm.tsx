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
      <div className="glass rounded-[40px] p-20 text-center space-y-6 animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
          <CheckCircle className="w-10 h-10 text-white/40" />
        </div>
        <h2 className="text-3xl font-light text-white tracking-tight">
          Feedback Received
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-700 font-bold">
          Contribution acknowledged
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-[40px] p-10 space-y-12 animate-slide-up relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-gray-700 uppercase tracking-[0.4em]">
          Evaluation
        </p>
        <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="space-y-12">
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
        </div>

        {error && (
          <div className="text-center p-4 rounded-2xl bg-red-500/5 text-red-400/80 text-[10px] font-medium uppercase tracking-widest animate-fade-in">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full h-16 rounded-full bg-white text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
        >
          {loading ? "..." : "Submit Response"}
        </button>
      </form>
    </div>
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
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em] px-1">
            {field.label} {field.required && <span className="opacity-30">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Input response"
            className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all text-2xl font-light"
          />
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em] px-1">
            {field.label} {field.required && <span className="opacity-30">*</span>}
          </label>
          <textarea
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={1}
            placeholder="Detailed thoughts"
            className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white placeholder:text-gray-800 focus:outline-none focus:border-white/30 transition-all text-xl font-light resize-none overflow-hidden min-h-[60px]"
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        </div>
      );

    case "rating":
      return (
        <div className="space-y-6">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em] px-1">
            {field.label} {field.required && <span className="opacity-30">*</span>}
          </label>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange(rating)}
                disabled={disabled}
                className={cn(
                  "h-14 rounded-2xl font-light transition-all border text-lg",
                  value === rating
                    ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02]"
                    : "bg-white/[0.01] border-white/5 text-gray-700 hover:text-white hover:border-white/20"
                )}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="flex justify-between px-2 text-[8px] uppercase tracking-[0.4em] font-bold text-gray-800">
            <span>Minimum</span>
            <span>Maximum</span>
          </div>
        </div>
      );

    case "nps":
      return (
        <div className="space-y-6">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em] px-1">
            {field.label} {field.required && <span className="opacity-30">*</span>}
          </label>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                disabled={disabled}
                className={cn(
                  "h-10 rounded-xl text-[10px] font-medium transition-all border",
                  value === score
                    ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : "bg-white/[0.01] border-white/5 text-gray-700 hover:text-white"
                )}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex justify-between px-2 text-[8px] uppercase tracking-[0.4em] font-bold text-gray-800">
            <span>Unlikely</span>
            <span>Highly Likely</span>
          </div>
        </div>
      );

    case "select":
      return (
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.3em] px-1">
            {field.label} {field.required && <span className="opacity-30">*</span>}
          </label>
          <div className="relative">
            <select
              value={(value as string) || ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="w-full bg-transparent border-b border-white/10 rounded-none py-4 text-white appearance-none focus:outline-none focus:border-white/30 transition-all text-xl font-light"
            >
              <option value="" className="bg-black">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option} className="bg-[#0a0a0a]">
                  {option}
                </option>
              ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700">
              <ChevronRight className="w-4 h-4 rotate-90 stroke-[1px]" />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

    default:
      return null;
  }
}
