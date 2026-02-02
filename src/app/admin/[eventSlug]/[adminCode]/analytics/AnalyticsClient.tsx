"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Event } from "@/types";
import type {
  CheckInDataPoint,
  QAAnalytics,
  PollParticipation,
  IntakeAnalytics,
  SeriesAttendanceDataPoint,
} from "@/lib/supabase/queries";
import { TrendingUp, Clock, MessageCircle, BarChart3, Users, AlertCircle } from "lucide-react";
import { AttendancePatternChart } from "@/components/analytics/AttendancePatternChart";

interface AnalyticsClientProps {
  event: Event;
  checkInCurve: CheckInDataPoint[];
  qaAnalytics: QAAnalytics;
  pollParticipation: PollParticipation[];
  intakeAnalytics: IntakeAnalytics;
  seriesAttendanceData?: SeriesAttendanceDataPoint[];
}

export function AnalyticsClient({
  event,
  checkInCurve,
  qaAnalytics,
  pollParticipation,
  intakeAnalytics,
  seriesAttendanceData,
}: AnalyticsClientProps) {
  // Format check-in data for chart
  const chartData = checkInCurve.map((point) => ({
    time: new Date(point.time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    cumulative: point.cumulative,
    count: point.count,
  }));

  // Format poll participation data
  const pollChartData = pollParticipation.map((poll) => ({
    name: poll.pollTitle.length > 30 ? poll.pollTitle.substring(0, 30) + "..." : poll.pollTitle,
    participation: Math.round(poll.participationRate),
    votes: poll.totalVotes,
  }));

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Check-In Curve */}
      <div className="glass rounded-[40px] p-10 border-white/[0.03] space-y-8">
        <div className="flex items-center gap-4">
          <TrendingUp className="w-6 h-6 text-white/60" />
          <h2 className="text-2xl font-light tracking-tight text-white/90">Check-In Curve</h2>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
          Attendee arrival pattern over time
        </p>
        {checkInCurve.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: "11px" }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: "11px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#fff"
                  strokeWidth={2}
                  dot={{ fill: "#fff", r: 4 }}
                  name="Total Check-Ins"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-600">
            <p className="text-sm">No check-in data available yet</p>
          </div>
        )}
      </div>

      {/* Q&A Analytics */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Most Upvoted */}
        <div className="glass rounded-[40px] p-10 border-white/[0.03] space-y-6">
          <div className="flex items-center gap-4">
            <MessageCircle className="w-6 h-6 text-white/60" />
            <h3 className="text-xl font-light tracking-tight text-white/90">Most Upvoted</h3>
          </div>
          {qaAnalytics.mostUpvoted.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {qaAnalytics.mostUpvoted.slice(0, 10).map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-light text-white/90 leading-relaxed line-clamp-2">
                        {q.content}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                        {q.user?.name || "Anonymous"}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-lg font-light tabular-nums text-white">{q.upvotes}</span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-600">votes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-600">
              <p className="text-sm">No questions yet</p>
            </div>
          )}
        </div>

        {/* Unanswered Aging */}
        <div className="glass rounded-[40px] p-10 border-white/[0.03] space-y-6">
          <div className="flex items-center gap-4">
            <Clock className="w-6 h-6 text-white/60" />
            <h3 className="text-xl font-light tracking-tight text-white/90">Unanswered Aging</h3>
          </div>
          {qaAnalytics.unansweredAging.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {qaAnalytics.unansweredAging.slice(0, 10).map(({ question, ageMinutes }) => {
                const hours = Math.floor(ageMinutes / 60);
                const minutes = ageMinutes % 60;
                const ageText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                const isUrgent = ageMinutes > 60; // More than 1 hour

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isUrgent
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-white/[0.02] border-white/[0.05]"
                    } hover:bg-white/[0.05]`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-light text-white/90 leading-relaxed line-clamp-2">
                          {question.content}
                        </p>
                        <div className="flex items-center gap-2">
                          {isUrgent && (
                            <AlertCircle className="w-3 h-3 text-red-400" />
                          )}
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
                            {ageText} ago
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-lg font-light tabular-nums text-white">
                          {question.upvotes}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-gray-600">votes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-600">
              <p className="text-sm">All questions answered! 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Poll Participation */}
      <div className="glass rounded-[40px] p-10 border-white/[0.03] space-y-8">
        <div className="flex items-center gap-4">
          <BarChart3 className="w-6 h-6 text-white/60" />
          <h2 className="text-2xl font-light tracking-tight text-white/90">Poll Participation Rate</h2>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
          Percentage of checked-in attendees who participated
        </p>
        {pollChartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pollChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: "11px" }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  style={{ fontSize: "11px" }}
                  label={{ value: "% Participation", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, "Participation Rate"]}
                />
                <Bar dataKey="participation" fill="#fff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-600">
            <p className="text-sm">No polls created yet</p>
          </div>
        )}
      </div>

      {/* Networking Intake Completion */}
      <div className="glass rounded-[40px] p-10 border-white/[0.03] space-y-8">
        <div className="flex items-center gap-4">
          <Users className="w-6 h-6 text-white/60" />
          <h2 className="text-2xl font-light tracking-tight text-white/90">Networking Intake</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">Completion Rate</p>
            <p className="text-4xl font-light tracking-tight tabular-nums text-white">
              {Math.round(intakeAnalytics.completionRate)}%
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">Drop-Off Rate</p>
            <p className="text-4xl font-light tracking-tight tabular-nums text-white">
              {Math.round(intakeAnalytics.dropOffRate)}%
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">Completed</p>
            <p className="text-4xl font-light tracking-tight tabular-nums text-white">
              {intakeAnalytics.completed}
            </p>
            <p className="text-[9px] text-gray-600">of {intakeAnalytics.total} registered</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">Skipped</p>
            <p className="text-4xl font-light tracking-tight tabular-nums text-white">
              {intakeAnalytics.skipped}
            </p>
            <p className="text-[9px] text-gray-600">of {intakeAnalytics.started} started</p>
          </div>
        </div>
        <div className="pt-6 border-t border-white/10">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Started</span>
              <span className="text-white/90">{intakeAnalytics.started}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Not Started</span>
              <span className="text-white/90">{intakeAnalytics.total - intakeAnalytics.started}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${intakeAnalytics.completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {seriesAttendanceData && seriesAttendanceData.length > 0 && (
        <AttendancePatternChart data={seriesAttendanceData} />
      )}
    </div>
  );
}
