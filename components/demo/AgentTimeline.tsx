"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AgentCard } from "./AgentCard";
import { ThreeWayMatchView } from "./ThreeWayMatchView";
import { RetentionsTable } from "./RetentionsTable";
import { ConfidenceGauge } from "./ConfidenceGauge";
import { TechnicalLogDrawer } from "./TechnicalLogDrawer";
import { useDemoStore } from "@/lib/store";
import { formatBRL } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

export function AgentTimeline() {
  const state = useDemoStore();
  const hasRun = state.selectedScenario !== null;

  if (!hasRun) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white/70 p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-neutral-ink">
          Escolha um cenário ou envie uma nota
        </h2>
        <p className="max-w-md text-sm text-neutral-muted">
          A timeline à direita vai acompanhar em tempo real o trabalho dos 5
          sub-agentes: intake, extração fiscal, 3-way match, retenções e decisão
          final.
        </p>
      </div>
    );
  }

  const decisionFinished =
    state.decision !== null &&
    state.steps.every((s) => s.status !== "processing" && s.status !== "idle");

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {state.steps.map((step, idx) => (
          <AgentCard key={step.step} index={idx} step={step}>
            {step.step === "extraction" && state.invoice ? (
              <ExtractionPreview />
            ) : null}
            {step.step === "three_way_match" && state.match ? (
              <ThreeWayMatchView
                match={state.match}
                receiptKind={state.goodsReceipt?.kind}
              />
            ) : null}
            {step.step === "retentions" && state.retentions.length ? (
              <RetentionsTable retentions={state.retentions} />
            ) : null}
            {step.step === "decision" && state.decision ? (
              <DecisionBlock />
            ) : null}
          </AgentCard>
        ))}
      </AnimatePresence>

      {decisionFinished ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
          className="flex justify-end"
        >
          <TechnicalLogDrawer />
        </motion.div>
      ) : null}

      {state.error ? (
        <div className="rounded-lg border border-status-error/30 bg-status-error-bg p-3 text-sm text-status-error">
          {state.error}
        </div>
      ) : null}
    </div>
  );
}

function ExtractionPreview() {
  const { invoice } = useDemoStore();
  if (!invoice) return null;
  const rows: Array<[string, string]> = [
    ["Tipo", invoice.type],
    ["Número", invoice.number],
    ["CNPJ", invoice.supplier.cnpj],
    ["Fornecedor", invoice.supplier.name],
    ["Valor bruto", formatBRL(invoice.grossAmount)],
    [
      "Emissão",
      new Date(invoice.issueDate).toLocaleDateString("pt-BR"),
    ],
    ["Chave de acesso", invoice.accessKey ?? "—"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-neutral-bg p-3 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2 border-b border-black/5 py-1 last:border-0">
          <dt className="font-medium text-neutral-muted">{k}</dt>
          <dd className="truncate text-right font-mono text-neutral-ink">
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DecisionBlock() {
  const { decision } = useDemoStore();
  if (!decision) return null;
  const actionStyles: Record<
    typeof decision.action,
    { bg: string; fg: string }
  > = {
    POSTED: { bg: "bg-status-success-bg", fg: "text-status-success" },
    HUMAN_REVIEW: { bg: "bg-status-warning-bg", fg: "text-status-warning" },
    REJECTED: { bg: "bg-status-error-bg", fg: "text-status-error" },
  };
  const styles = actionStyles[decision.action];
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/5 bg-neutral-bg p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5">
        <ConfidenceGauge value={decision.confidence} />
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
              styles.bg,
              styles.fg
            )}
          >
            {decision.action}
          </span>
          <p className="mt-2 text-sm font-semibold text-neutral-ink">
            {decision.summary}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-ink/80">
            {decision.justification}
          </p>
        </div>
      </div>
    </div>
  );
}
