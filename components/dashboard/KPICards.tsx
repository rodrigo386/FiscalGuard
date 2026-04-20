import type { KPI } from "@/lib/mock-data";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function KPICards({ items }: { items: KPI[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-black/5 bg-white p-5 shadow-card"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-muted">
            {kpi.label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-neutral-ink">
            {kpi.value}
          </div>
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-xs font-medium",
              kpi.trendTone === "positive" && "text-status-success",
              kpi.trendTone === "negative" && "text-status-error",
              kpi.trendTone === "neutral" && "text-neutral-muted"
            )}
          >
            {kpi.trendTone === "positive" ? (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            ) : kpi.trendTone === "negative" ? (
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Minus className="h-3.5 w-3.5" aria-hidden />
            )}
            {kpi.trend}
          </div>
        </div>
      ))}
    </div>
  );
}
