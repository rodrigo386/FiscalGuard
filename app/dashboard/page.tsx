import { KPICards } from "@/components/dashboard/KPICards";
import { HourlyChart } from "@/components/dashboard/HourlyChart";
import { DocumentTypePie } from "@/components/dashboard/DocumentTypePie";
import { RecentInvoicesTable } from "@/components/dashboard/RecentInvoicesTable";
import {
  DOC_TYPE_SLICES,
  HOURLY_POINTS,
  KPIS,
  RECENT_INVOICES,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 pt-4">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-purple">
          Dashboard executivo
        </span>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-ink">
          O que o Fiscal Guardian faz no dia a dia
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-muted">
          Visão consolidada de uma operação plena — métricas de throughput,
          distribuição de documentos e trilha de decisões recentes.
        </p>
      </header>

      <KPICards items={KPIS} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <HourlyChart data={HOURLY_POINTS} />
        <DocumentTypePie data={DOC_TYPE_SLICES} />
      </div>

      <RecentInvoicesTable items={RECENT_INVOICES} />
    </div>
  );
}
