"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourlyPoint } from "@/lib/mock-data";

export function HourlyChart({ data }: { data: HourlyPoint[] }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-ink">
            Notas por hora — últimas 24h
          </h3>
          <p className="text-xs text-neutral-muted">
            Processamento contínuo · revisão humana destacada em roxo
          </p>
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(29, 158, 117, 0.08)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
            />
            <Bar
              dataKey="processed"
              name="Processadas"
              fill="#1D9E75"
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="humanReview"
              name="Revisão humana"
              fill="#6B46C1"
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
