"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  CircleCheck,
  FileText,
  Play,
  RotateCcw,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LIVE_CONFIG,
  LIVE_NOTES,
  LIVE_STAGES,
  type LiveNote,
  type LiveTaxLine,
} from "@/lib/live-notes";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/scenarios";

type ManualDecision = "approved" | "rejected";

export default function LivePage() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, ManualDecision>>(
    {}
  );
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    intervalRef.current = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 150);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [startedAt]);

  void tick;

  const now = Date.now();
  const elapsed = startedAt === null ? 0 : now - startedAt;

  const notes = useMemo(
    () =>
      LIVE_NOTES.map((note, idx) => {
        const arriveAt = idx * LIVE_CONFIG.arrivalIntervalMs;
        const displayed = startedAt !== null && elapsed >= arriveAt;
        const sinceArrival = displayed ? elapsed - arriveAt : 0;
        const stage = Math.min(
          LIVE_STAGES.length,
          Math.floor(sinceArrival / LIVE_CONFIG.stageDurationMs)
        );
        return { note, displayed, stage, arriveAt };
      }),
    [elapsed, startedAt]
  );

  const visible = notes.filter((n) => n.displayed);
  const completed = visible.filter((n) => n.stage >= LIVE_STAGES.length);

  // POSTED auto = agente aprovou sem intervenção
  const postedAuto = completed.filter(
    (n) => n.note.finalStatus === "POSTED"
  );
  // Revisões que ainda pendem de ação
  const reviewPending = completed.filter(
    (n) => n.note.finalStatus === "HUMAN_REVIEW" && !decisions[n.note.id]
  );
  // Aprovadas manualmente pelo analista
  const approvedManual = completed.filter(
    (n) =>
      n.note.finalStatus === "HUMAN_REVIEW" &&
      decisions[n.note.id] === "approved"
  );
  // Rejeitadas pelo analista
  const rejected = completed.filter(
    (n) =>
      n.note.finalStatus === "HUMAN_REVIEW" &&
      decisions[n.note.id] === "rejected"
  );

  const allDone =
    startedAt !== null && completed.length === LIVE_CONFIG.total;
  const touchlessRate = completed.length
    ? Math.round((postedAuto.length / completed.length) * 100)
    : 0;

  const totalSeconds =
    LIVE_CONFIG.total * LIVE_CONFIG.arrivalIntervalMs + 5_000;
  const progressPct = Math.min(100, (elapsed / totalSeconds) * 100);

  const openNote = openNoteId
    ? LIVE_NOTES.find((n) => n.id === openNoteId) ?? null
    : null;
  const openNoteStage = notes.find((n) => n.note.id === openNoteId)?.stage ?? 0;

  const start = () => {
    setStartedAt(Date.now());
    setTick(0);
    setDecisions({});
  };
  const reset = () => {
    setStartedAt(null);
    setTick(0);
    setDecisions({});
    setOpenNoteId(null);
  };

  const act = (noteId: string, decision: ManualDecision) => {
    setDecisions((prev) => ({ ...prev, [noteId]: decision }));
  };

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header>
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-purple">
          Fluxo ao vivo
        </span>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-ink">
          10 notas em 100 segundos
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-muted">
          Simulação de um turno operacional. Uma nota chega a cada
          10 segundos e passa pelos 5 sub-agentes. Clique em uma linha
          para ver o detalhe; notas em revisão ficam prontas para
          decisão do analista.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-black/5 bg-white p-4 shadow-card">
        <Button
          onClick={startedAt === null || allDone ? start : reset}
          className="h-10 bg-brand-teal hover:bg-brand-teal-dark"
        >
          {startedAt === null ? (
            <>
              <Play className="h-4 w-4" aria-hidden />
              Iniciar rodada
            </>
          ) : allDone ? (
            <>
              <Play className="h-4 w-4" aria-hidden />
              Rodar de novo
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reiniciar
            </>
          )}
        </Button>

        <StatChip
          label="Chegadas"
          value={`${visible.length}/${LIVE_CONFIG.total}`}
          tone="neutral"
        />
        <StatChip
          label="Auto (POSTED)"
          value={String(postedAuto.length)}
          tone="success"
        />
        <StatChip
          label="Pendentes"
          value={String(reviewPending.length)}
          tone="warning"
        />
        <StatChip
          label="Aprovadas manual"
          value={String(approvedManual.length)}
          tone="success"
        />
        <StatChip
          label="Rejeitadas"
          value={String(rejected.length)}
          tone="error"
        />
        <StatChip
          label="Touchless rate"
          value={completed.length ? `${touchlessRate}%` : "—"}
          tone="neutral"
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-xs text-neutral-muted">
            {(elapsed / 1000).toFixed(1)}s
          </span>
          <div className="relative h-2 w-40 overflow-hidden rounded-full bg-neutral-bg">
            <div
              className="absolute inset-y-0 left-0 bg-brand-teal transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {startedAt === null ? (
        <EmptyState onStart={start} />
      ) : (
        <ol className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {visible
              .slice()
              .reverse()
              .map(({ note, stage }) => (
                <motion.li
                  key={note.id}
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="will-animate"
                >
                  <NoteRow
                    note={note}
                    stage={stage}
                    decision={decisions[note.id]}
                    onOpen={() => setOpenNoteId(note.id)}
                  />
                </motion.li>
              ))}
          </AnimatePresence>
        </ol>
      )}

      {allDone ? (
        <Summary
          postedAuto={postedAuto.length}
          approvedManual={approvedManual.length}
          rejected={rejected.length}
          pending={reviewPending.length}
          touchless={touchlessRate}
        />
      ) : null}

      <Sheet
        open={!!openNoteId}
        onOpenChange={(open) => !open && setOpenNoteId(null)}
      >
        <SheetContent side="right" className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {openNote ? (
            <NoteDetailContent
              note={openNote}
              stage={openNoteStage}
              decision={decisions[openNote.id]}
              onApprove={() => act(openNote.id, "approved")}
              onReject={() => act(openNote.id, "rejected")}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NoteRow({
  note,
  stage,
  decision,
  onOpen,
}: {
  note: LiveNote;
  stage: number;
  decision?: ManualDecision;
  onOpen: () => void;
}) {
  const done = stage >= LIVE_STAGES.length;
  const finalClass = borderFor(note, decision, done);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group grid w-full grid-cols-[auto_auto_minmax(0,2fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left text-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
        finalClass
      )}
    >
      <span className="font-mono text-[11px] text-neutral-muted">
        {note.arrivedAt}
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-bg px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-ink/70">
        <FileText className="h-3 w-3" aria-hidden />
        {note.type}
      </span>
      <div className="min-w-0">
        <div className="truncate font-semibold text-neutral-ink">
          {note.supplier}
        </div>
        <div className="truncate text-[11px] text-neutral-muted">
          {note.description}
          {note.reason && done ? ` · ${note.reason}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums text-sm font-mono text-neutral-ink">
          {formatBRL(note.amount)}
        </span>
        <StageDots stage={stage} total={LIVE_STAGES.length} />
      </div>
      <FinalChip note={note} done={done} decision={decision} />
    </button>
  );
}

function borderFor(
  note: LiveNote,
  decision: ManualDecision | undefined,
  done: boolean
) {
  if (!done) return "border-brand-teal/30 shadow-card";
  if (note.finalStatus === "POSTED") return "border-status-success/20";
  if (decision === "approved") return "border-status-success/30";
  if (decision === "rejected") return "border-status-error/30";
  return "border-status-warning/30";
}

function StageDots({ stage, total }: { stage: number; total: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Etapa ${stage} de ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const past = i < stage;
        const current = i === stage;
        return (
          <span
            key={i}
            className={cn(
              "h-1.5 w-5 rounded-full transition-colors",
              past && "bg-brand-teal",
              current && "bg-brand-teal/70 animate-pulse",
              !past && !current && "bg-neutral-bg"
            )}
          />
        );
      })}
    </div>
  );
}

function FinalChip({
  note,
  done,
  decision,
}: {
  note: LiveNote;
  done: boolean;
  decision?: ManualDecision;
}) {
  if (!done) {
    return (
      <span className="inline-flex min-w-[130px] justify-center rounded-full bg-brand-teal-light px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-teal">
        Processando…
      </span>
    );
  }
  if (note.finalStatus === "POSTED") {
    return (
      <span className="inline-flex min-w-[130px] items-center justify-center gap-1 rounded-full bg-status-success-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-status-success">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        POSTED · {note.confidence}%
      </span>
    );
  }
  if (note.finalStatus === "HUMAN_REVIEW") {
    if (decision === "approved") {
      return (
        <span className="inline-flex min-w-[130px] items-center justify-center gap-1 rounded-full bg-status-success-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-status-success">
          <ThumbsUp className="h-3 w-3" aria-hidden />
          Aprovada manual
        </span>
      );
    }
    if (decision === "rejected") {
      return (
        <span className="inline-flex min-w-[130px] items-center justify-center gap-1 rounded-full bg-status-error-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-status-error">
          <ThumbsDown className="h-3 w-3" aria-hidden />
          Rejeitada
        </span>
      );
    }
    return (
      <span className="inline-flex min-w-[130px] items-center justify-center gap-1 rounded-full bg-status-warning-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-status-warning">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        Revisão · {note.confidence}%
      </span>
    );
  }
  return null;
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "neutral" | "error";
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-lg font-semibold",
          tone === "success" && "text-status-success",
          tone === "warning" && "text-status-warning",
          tone === "error" && "text-status-error",
          tone === "neutral" && "text-neutral-ink"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white/60 p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
        <Play className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold text-neutral-ink">
        Pronto para rodar
      </h2>
      <p className="max-w-md text-sm text-neutral-muted">
        Ao iniciar, 10 notas chegam à operação em ritmo de uma a cada
        10 segundos. As que caem em revisão humana esperam sua decisão
        — clique na linha para ver o detalhe e aprovar ou rejeitar.
      </p>
      <Button
        onClick={onStart}
        className="mt-2 h-10 bg-brand-teal hover:bg-brand-teal-dark"
      >
        <Play className="h-4 w-4" aria-hidden />
        Iniciar rodada de 10 notas
      </Button>
    </div>
  );
}

function Summary({
  postedAuto,
  approvedManual,
  rejected,
  pending,
  touchless,
}: {
  postedAuto: number;
  approvedManual: number;
  rejected: number;
  pending: number;
  touchless: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-brand-teal/30 bg-brand-teal-light/30 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
          <CircleCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-semibold text-neutral-ink">
            Rodada concluída · {LIVE_CONFIG.total} notas processadas
          </h3>
          <p className="mt-1 text-sm text-neutral-muted">
            <strong className="text-status-success">{postedAuto}</strong>{" "}
            aprovadas automaticamente,{" "}
            <strong className="text-status-success">{approvedManual}</strong>{" "}
            aprovadas manualmente,{" "}
            <strong className="text-status-error">{rejected}</strong>{" "}
            rejeitadas,{" "}
            <strong className="text-status-warning">{pending}</strong>{" "}
            ainda pendentes. Touchless rate de{" "}
            <strong className="text-brand-teal">{touchless}%</strong>.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function NoteDetailContent({
  note,
  stage,
  decision,
  onApprove,
  onReject,
}: {
  note: LiveNote;
  stage: number;
  decision?: ManualDecision;
  onApprove: () => void;
  onReject: () => void;
}) {
  const done = stage >= LIVE_STAGES.length;
  const { detail } = note;
  const needsDecision =
    done && note.finalStatus === "HUMAN_REVIEW" && !decision;
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-bg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-ink/70">
            <FileText className="h-3 w-3" aria-hidden />
            {note.type}
          </span>
          <span className="font-mono text-[11px] text-neutral-muted">
            {note.arrivedAt}
          </span>
        </div>
        <SheetTitle className="truncate">{note.supplier}</SheetTitle>
        <SheetDescription className="text-xs">
          {detail.number} · CNPJ {detail.cnpj} · Valor bruto{" "}
          <span className="font-mono">{formatBRL(note.amount)}</span>
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-5">
        {/* Status final / decisão */}
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3",
            note.finalStatus === "POSTED"
              ? "border-status-success/20 bg-status-success-bg"
              : decision === "approved"
                ? "border-status-success/20 bg-status-success-bg"
                : decision === "rejected"
                  ? "border-status-error/20 bg-status-error-bg"
                  : "border-status-warning/30 bg-status-warning-bg"
          )}
        >
          <StatusIcon note={note} decision={decision} done={done} />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-neutral-ink">
              {titleFor(note, decision, done)}
            </div>
            <div className="mt-1 text-xs text-neutral-muted">
              Confiança do agente: <strong>{note.confidence}%</strong>
              {note.reason ? ` · ${note.reason}` : ""}
            </div>
          </div>
        </div>

        {/* Justificativa + recomendação */}
        <section>
          <SectionTitle>Análise do agente</SectionTitle>
          <p className="mt-2 text-sm leading-relaxed text-neutral-ink">
            {detail.justification}
          </p>
          {detail.recommendation ? (
            <div className="mt-3 rounded-md border border-brand-purple/20 bg-brand-purple-light/60 p-3 text-xs leading-relaxed text-brand-purple">
              <div className="font-semibold uppercase tracking-wide">
                Recomendação
              </div>
              <p className="mt-1 text-neutral-ink/80">{detail.recommendation}</p>
            </div>
          ) : null}
        </section>

        {/* Tributos */}
        <section>
          <SectionTitle>Validação tributária</SectionTitle>
          <ul className="mt-2 divide-y divide-black/5 overflow-hidden rounded-md border border-black/5">
            {detail.taxes.map((t) => (
              <li
                key={t.kind}
                className="grid grid-cols-[1fr_auto_auto] items-start gap-3 bg-white px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-ink">{t.kind}</div>
                  {t.note ? (
                    <div className="text-[11px] leading-snug text-neutral-muted">
                      {t.note}
                    </div>
                  ) : null}
                </div>
                <TaxValues t={t} />
                <TaxStatus t={t} />
              </li>
            ))}
          </ul>
        </section>

        {/* 3-way match */}
        {detail.po || detail.receipt ? (
          <section>
            <SectionTitle>3-Way Match</SectionTitle>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-neutral-bg p-3 text-xs">
              {detail.po ? (
                <>
                  <dt className="text-neutral-muted">Purchase Order</dt>
                  <dd className="font-mono text-neutral-ink">
                    {detail.po.number} · {formatBRL(detail.po.total)}
                    {detail.po.diffPct !== 0 ? (
                      <span className="ml-1 font-semibold text-status-error">
                        (Δ {detail.po.diffPct.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="ml-1 text-status-success">(match)</span>
                    )}
                  </dd>
                  <dt className="text-neutral-muted">Tolerância</dt>
                  <dd className="font-mono text-neutral-ink">
                    {(detail.po.toleranceBps / 100).toFixed(1)}%
                  </dd>
                </>
              ) : null}
              {detail.receipt ? (
                <>
                  <dt className="text-neutral-muted">{detail.receipt.label}</dt>
                  <dd className="font-mono text-neutral-ink">
                    {detail.receipt.number}
                  </dd>
                </>
              ) : null}
            </dl>
          </section>
        ) : null}

        {/* Ações */}
        {needsDecision ? (
          <section>
            <SectionTitle>Decisão do analista</SectionTitle>
            <p className="mt-1 text-xs text-neutral-muted">
              A nota foi encaminhada para revisão humana. Registre sua
              decisão — a trilha de auditoria fica vinculada ao seu usuário.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                onClick={onApprove}
                className="h-10 bg-status-success hover:brightness-110"
              >
                <ThumbsUp className="h-4 w-4" aria-hidden />
                Aprovar com ressalva
              </Button>
              <Button
                onClick={onReject}
                variant="destructive"
                className="h-10"
              >
                <ThumbsDown className="h-4 w-4" aria-hidden />
                Rejeitar
              </Button>
            </div>
          </section>
        ) : done && note.finalStatus === "HUMAN_REVIEW" ? (
          <section>
            <SectionTitle>Decisão registrada</SectionTitle>
            <p className="mt-1 text-sm text-neutral-ink">
              {decision === "approved"
                ? "Você aprovou esta nota manualmente. Encaminhada para pagamento com ressalva anexada à trilha de auditoria."
                : "Você rejeitou esta nota. O fornecedor será notificado e a nota aguardará correção."}
            </p>
          </section>
        ) : !done ? (
          <section>
            <SectionTitle>Processando</SectionTitle>
            <p className="mt-1 text-sm text-neutral-muted">
              Agente em execução — etapa {stage + 1} de {LIVE_STAGES.length}{" "}
              ({LIVE_STAGES[Math.min(stage, LIVE_STAGES.length - 1)].label}).
            </p>
          </section>
        ) : null}
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-muted">
      {children}
    </h3>
  );
}

function StatusIcon({
  note,
  decision,
  done,
}: {
  note: LiveNote;
  decision?: ManualDecision;
  done: boolean;
}) {
  if (!done) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
        <ShieldCheck className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  if (note.finalStatus === "POSTED" || decision === "approved") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-success text-white">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  if (decision === "rejected") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-error text-white">
        <XCircle className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-warning text-white">
      <AlertTriangle className="h-4 w-4" aria-hidden />
    </span>
  );
}

function titleFor(
  note: LiveNote,
  decision: ManualDecision | undefined,
  done: boolean
) {
  if (!done) return "Processando pelo agente…";
  if (note.finalStatus === "POSTED") return "Aprovada automaticamente · POSTED";
  if (decision === "approved") return "Aprovada manualmente pelo analista";
  if (decision === "rejected") return "Rejeitada pelo analista";
  return "Encaminhada para revisão humana";
}

function TaxValues({ t }: { t: LiveTaxLine }) {
  if (t.status === "na") {
    return <span className="text-xs text-neutral-muted">—</span>;
  }
  if (t.status === "suspended") {
    return (
      <span className="text-xs font-medium text-brand-teal">
        R$ 0,00 · suspenso
      </span>
    );
  }
  const diff = t.status === "mismatch";
  return (
    <div className="text-right text-xs leading-tight">
      <div
        className={cn(
          "font-mono tabular-nums",
          diff ? "font-semibold text-status-error" : "text-neutral-ink"
        )}
      >
        {formatBRL(t.calculated)}
      </div>
      <div className="font-mono tabular-nums text-neutral-muted">
        {formatBRL(t.declared)}{" "}
        <span className="text-[9px] uppercase">declarado</span>
      </div>
    </div>
  );
}

function TaxStatus({ t }: { t: LiveTaxLine }) {
  if (t.status === "ok")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-status-success-bg text-status-success">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  if (t.status === "mismatch")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-status-error-bg text-status-error">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  if (t.status === "suspended")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-bg text-neutral-muted">
      —
    </span>
  );
}
