"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Play, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LIVE_CONFIG,
  LIVE_NOTES,
  LIVE_STAGES,
  type LiveNote,
} from "@/lib/live-notes";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/scenarios";

export default function LivePage() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
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

  const now = Date.now();
  const elapsed = startedAt === null ? 0 : now - startedAt;
  // força re-render com tick — valor não é usado diretamente
  void tick;

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
  const posted = completed.filter((n) => n.note.finalStatus === "POSTED");
  const review = completed.filter(
    (n) => n.note.finalStatus === "HUMAN_REVIEW"
  );
  const allDone =
    startedAt !== null && completed.length === LIVE_CONFIG.total;

  const start = () => {
    setStartedAt(Date.now());
    setTick(0);
  };
  const reset = () => {
    setStartedAt(null);
    setTick(0);
  };

  const totalSeconds = Math.min(
    LIVE_CONFIG.total * LIVE_CONFIG.arrivalIntervalMs +
      LIVE_STAGES.length * LIVE_CONFIG.stageDurationMs,
    LIVE_CONFIG.total * LIVE_CONFIG.arrivalIntervalMs + 5_000
  );
  const progressPct = Math.min(100, (elapsed / totalSeconds) * 100);

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
          Simulação de um turno operacional. Uma nota chega a cada 10 segundos
          e passa pelos 5 sub-agentes. Acompanhe o throughput, a taxa
          touchless e as notas encaminhadas para revisão humana.
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
          label="POSTED"
          value={String(posted.length)}
          tone="success"
        />
        <StatChip
          label="Revisão humana"
          value={String(review.length)}
          tone="warning"
        />
        <StatChip
          label="Touchless rate"
          value={
            completed.length
              ? `${Math.round((posted.length / completed.length) * 100)}%`
              : "—"
          }
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
                  <NoteRow note={note} stage={stage} />
                </motion.li>
              ))}
          </AnimatePresence>
        </ol>
      )}

      {allDone ? <Summary posted={posted.length} review={review.length} /> : null}
    </div>
  );
}

function NoteRow({ note, stage }: { note: LiveNote; stage: number }) {
  const done = stage >= LIVE_STAGES.length;
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_auto_minmax(0,2fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-sm",
        done
          ? note.finalStatus === "POSTED"
            ? "border-status-success/20"
            : "border-status-warning/30"
          : "border-brand-teal/30 shadow-card"
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
      <FinalChip note={note} done={done} />
    </div>
  );
}

function StageDots({ stage, total }: { stage: number; total: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Etapa ${stage} de ${total}`}>
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

function FinalChip({ note, done }: { note: LiveNote; done: boolean }) {
  if (!done) {
    return (
      <span className="inline-flex min-w-[120px] justify-center rounded-full bg-brand-teal-light px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-teal">
        Processando…
      </span>
    );
  }
  if (note.finalStatus === "POSTED") {
    return (
      <span className="inline-flex min-w-[120px] items-center justify-center gap-1 rounded-full bg-status-success-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-status-success">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        POSTED · {note.confidence}%
      </span>
    );
  }
  if (note.finalStatus === "HUMAN_REVIEW") {
    return (
      <span className="inline-flex min-w-[120px] items-center justify-center gap-1 rounded-full bg-status-warning-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-status-warning">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        REVISÃO · {note.confidence}%
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-[120px] justify-center rounded-full bg-status-error-bg px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-status-error">
      REJEITADO · {note.confidence}%
    </span>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "neutral";
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
        10 segundos. Cada uma percorre os 5 sub-agentes e termina em{" "}
        <strong className="text-neutral-ink">POSTED</strong> ou encaminhada
        para <strong className="text-neutral-ink">revisão humana</strong>.
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

function Summary({ posted, review }: { posted: number; review: number }) {
  const rate = Math.round((posted / LIVE_CONFIG.total) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-xl border border-brand-teal/30 bg-brand-teal-light/30 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-semibold text-neutral-ink">
            Rodada concluída · {LIVE_CONFIG.total} notas processadas
          </h3>
          <p className="mt-1 text-sm text-neutral-muted">
            <strong className="text-neutral-ink">{posted}</strong> aprovadas
            automaticamente,{" "}
            <strong className="text-neutral-ink">{review}</strong> encaminhadas
            para revisão humana. Touchless rate de{" "}
            <strong className="text-brand-teal">{rate}%</strong> — dentro da
            meta operacional para uma operação madura.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

