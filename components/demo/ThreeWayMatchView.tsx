"use client";

import { Check, X } from "lucide-react";
import type { ThreeWayMatchResult } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  match: ThreeWayMatchResult;
}

export function ThreeWayMatchView({ match }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/5 bg-neutral-bg">
      <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))_auto] gap-x-3 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-muted">
        <span>Campo</span>
        <span>Nota fiscal</span>
        <span>Purchase Order</span>
        <span>Goods Receipt</span>
        <span>Status</span>
      </div>
      <ul>
        {match.fields.map((field) => (
          <li
            key={field.label}
            className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))_auto] items-center gap-x-3 border-t border-black/5 bg-white/70 px-3 py-2 text-sm"
          >
            <span className="font-medium text-neutral-ink">{field.label}</span>
            <span
              className={cn(
                "truncate",
                field.status === "mismatch" && "font-semibold text-status-error"
              )}
            >
              {field.invoice}
            </span>
            <span className="truncate text-neutral-ink/80">{field.po}</span>
            <span className="truncate text-neutral-ink/80">{field.gr ?? "—"}</span>
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full",
                field.status === "match"
                  ? "bg-status-success-bg text-status-success"
                  : field.status === "mismatch"
                    ? "bg-status-error-bg text-status-error"
                    : "bg-neutral-bg text-neutral-muted"
              )}
              aria-label={
                field.status === "match"
                  ? "Match"
                  : field.status === "mismatch"
                    ? "Divergência"
                    : "Não se aplica"
              }
            >
              {field.status === "match" ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : field.status === "mismatch" ? (
                <X className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <span className="text-xs">—</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {match.overall === "fail" ? (
        <div className="border-t border-status-error/20 bg-status-error-bg px-3 py-2 text-xs font-medium text-status-error">
          Match falhou — divergência acumulada {match.amountDiffPct.toFixed(1)}%
        </div>
      ) : (
        <div className="border-t border-status-success/20 bg-status-success-bg px-3 py-2 text-xs font-medium text-status-success">
          3-way match aprovado.
        </div>
      )}
    </div>
  );
}
