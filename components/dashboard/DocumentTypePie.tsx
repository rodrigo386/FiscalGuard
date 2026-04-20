"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { DocTypeSlice } from "@/lib/mock-data";

export function DocumentTypePie({ data }: { data: DocTypeSlice[] }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-neutral-ink">
        Distribuição por tipo de documento
      </h3>
      <p className="text-xs text-neutral-muted">
        Mix das notas recebidas na semana
      </p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.08)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              align="center"
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
