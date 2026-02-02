"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { SeriesAttendanceDataPoint } from "@/lib/supabase/queries";

interface AttendancePatternChartProps {
  data: SeriesAttendanceDataPoint[];
}

export function AttendancePatternChart({ data }: AttendancePatternChartProps) {
  const chartData = data.map((point) => ({
    name: point.name,
    registered: point.registered,
    checkedIn: point.checked_in,
    checkInRate: point.registered > 0 ? Math.round((point.checked_in / point.registered) * 100) : 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-[40px] p-10 border-white/[0.03]">
        <div className="text-center text-gray-600">No series attendance data available</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-[40px] p-10 border-white/[0.03] space-y-8">
      <div>
        <h2 className="text-2xl font-light tracking-tight text-white/90">Attendance Over Time</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium">
          Registered vs checked-in across the series
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="name"
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
            <Line
              type="monotone"
              dataKey="registered"
              stroke="#fff"
              strokeWidth={2}
              dot={{ fill: "#fff", r: 4 }}
              name="Registered"
            />
            <Line
              type="monotone"
              dataKey="checkedIn"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ fill: "#7c3aed", r: 4 }}
              name="Checked-in"
            >
              <LabelList
                dataKey="checkInRate"
                position="top"
                formatter={(value: number) => `${value}%`}
                fill="rgba(255,255,255,0.7)"
                fontSize={10}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
