"use client";

import { Check, Minus, X } from "lucide-react";
import type { Retention, TaxScope } from "@/types";
import { formatBRL } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

interface Props {
  retentions: Retention[];
}

export function RetentionsTable({ retentions }: Props) {
  if (!retentions.length) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-black/5 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-bg text-[11px] uppercase tracking-wide text-neutral-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Tributo</th>
            <th className="px-3 py-2 text-left font-semibold">Escopo</th>
            <th className="px-3 py-2 text-right font-semibold">Alíquota</th>
            <th className="px-3 py-2 text-right font-semibold">Calculado</th>
            <th className="px-3 py-2 text-right font-semibold">Declarado</th>
            <th className="px-3 py-2 text-center font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {retentions.map((r) => (
            <tr key={r.kind} className="border-t border-black/5">
              <td className="px-3 py-2">
                <div className="font-semibold text-neutral-ink">{r.kind}</div>
                {r.note ? (
                  <div className="text-[11px] leading-snug text-neutral-muted">
                    {r.note}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-2">
                <ScopeBadge scope={r.scope} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-neutral-ink/80">
                {r.status === "not_applicable" ? "—" : `${r.rate}%`}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right tabular-nums",
                  r.status === "mismatch"
                    ? "font-semibold text-status-error"
                    : r.scope === "suspended"
                      ? "text-brand-teal"
                      : "text-neutral-ink/80"
                )}
              >
                {r.status === "not_applicable"
                  ? "—"
                  : r.scope === "suspended"
                    ? "R$ 0,00"
                    : formatBRL(r.calculated)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right tabular-nums",
                  r.status === "mismatch" && "text-status-error"
                )}
              >
                {r.status === "not_applicable"
                  ? "—"
                  : r.scope === "suspended"
                    ? "R$ 0,00"
                    : formatBRL(r.declared)}
              </td>
              <td className="px-3 py-2 text-center">
                <StatusPill status={r.status} suspended={r.scope === "suspended"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScopeBadge({ scope }: { scope?: TaxScope }) {
  if (!scope) {
    return <span className="text-[11px] text-neutral-muted">—</span>;
  }
  const styles: Record<TaxScope, { label: string; bg: string; fg: string }> = {
    retained: {
      label: "Retido",
      bg: "bg-brand-purple-light",
      fg: "text-brand-purple",
    },
    highlighted: {
      label: "Destacado",
      bg: "bg-neutral-bg",
      fg: "text-neutral-ink/80",
    },
    suspended: {
      label: "Suspenso · REPORTO",
      bg: "bg-brand-teal-light",
      fg: "text-brand-teal",
    },
  };
  const s = styles[scope];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide",
        s.bg,
        s.fg
      )}
    >
      {s.label}
    </span>
  );
}

function StatusPill({
  status,
  suspended,
}: {
  status: Retention["status"];
  suspended?: boolean;
}) {
  if (status === "ok")
    return (
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full",
          suspended
            ? "bg-brand-teal-light text-brand-teal"
            : "bg-status-success-bg text-status-success"
        )}
        aria-label={suspended ? "Suspenso" : "Ok"}
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  if (status === "mismatch")
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-status-error-bg text-status-error"
        aria-label="Divergência"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-bg text-neutral-muted"
      aria-label="Não aplicável"
    >
      <Minus className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
