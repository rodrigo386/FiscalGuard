import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecentInvoice } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  RecentInvoice["status"],
  { bg: string; fg: string; label: string }
> = {
  POSTED: {
    bg: "bg-status-success-bg",
    fg: "text-status-success",
    label: "Aprovada",
  },
  HUMAN_REVIEW: {
    bg: "bg-status-warning-bg",
    fg: "text-status-warning",
    label: "Revisão",
  },
  REJECTED: {
    bg: "bg-status-error-bg",
    fg: "text-status-error",
    label: "Rejeitada",
  },
};

export function RecentInvoicesTable({ items }: { items: RecentInvoice[] }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white shadow-card">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-ink">
            Últimas notas processadas
          </h3>
          <p className="text-xs text-neutral-muted">
            Instantâneo das 10 mais recentes · ordenado pelo horário
          </p>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-bg/60">
            <TableHead className="w-[80px]">Horário</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead className="w-[120px] text-right">Valor</TableHead>
            <TableHead className="w-[80px]">Tipo</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[80px] text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => {
            const styles = STATUS_STYLES[row.status];
            return (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs text-neutral-muted">
                  {row.time}
                </TableCell>
                <TableCell className="font-medium text-neutral-ink">
                  {row.supplier}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.amount}
                </TableCell>
                <TableCell>
                  <span className="rounded-md bg-neutral-bg px-2 py-0.5 text-xs font-medium text-neutral-ink/70">
                    {row.type}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      styles.bg,
                      styles.fg
                    )}
                  >
                    {styles.label}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold">
                  {row.score}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
