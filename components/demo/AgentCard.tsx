"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { AgentStepResult, AgentStepStatus } from "@/types";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  index: number;
  step: AgentStepResult;
  children?: React.ReactNode;
}

const STATUS_META: Record<
  AgentStepStatus,
  {
    icon: LucideIcon;
    label: string;
    container: string;
    iconWrap: string;
    spin?: boolean;
  }
> = {
  idle: {
    icon: Clock,
    label: "Aguardando",
    container: "border-black/5 bg-white",
    iconWrap: "bg-neutral-bg text-neutral-muted",
  },
  processing: {
    icon: Loader2,
    label: "Analisando...",
    container: "border-brand-teal/40 bg-white shadow-card-hover",
    iconWrap: "bg-brand-teal-light text-brand-teal",
    spin: true,
  },
  success: {
    icon: CheckCircle2,
    label: "Concluído",
    container: "border-status-success/30 bg-white",
    iconWrap: "bg-status-success-bg text-status-success",
  },
  warning: {
    icon: AlertTriangle,
    label: "Atenção necessária",
    container: "border-status-warning/40 bg-white",
    iconWrap: "bg-status-warning-bg text-status-warning",
  },
  error: {
    icon: ShieldAlert,
    label: "Erro",
    container: "border-status-error/40 bg-white",
    iconWrap: "bg-status-error-bg text-status-error",
  },
};

export function AgentCard({ index, step, children }: AgentCardProps) {
  const meta = STATUS_META[step.status];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
      className={cn(
        "will-animate relative flex gap-4 rounded-xl border p-4 transition-shadow",
        meta.container
      )}
    >
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            meta.iconWrap
          )}
          aria-hidden
        >
          <Icon className={cn("h-5 w-5", meta.spin && "animate-spin")} />
        </span>
        <span className="mt-1 text-[11px] font-mono text-neutral-muted">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-ink">
            {step.title}
          </h3>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
              step.status === "processing" && "bg-brand-teal-light text-brand-teal",
              step.status === "success" && "bg-status-success-bg text-status-success",
              step.status === "warning" && "bg-status-warning-bg text-status-warning",
              step.status === "error" && "bg-status-error-bg text-status-error",
              step.status === "idle" && "bg-neutral-bg text-neutral-muted"
            )}
          >
            {meta.label}
          </span>
        </div>
        {step.summary ? (
          <p className="mt-1 text-sm text-neutral-ink/80">{step.summary}</p>
        ) : (
          <p className="mt-1 text-xs text-neutral-muted">
            {step.status === "idle"
              ? "Na fila do orquestrador."
              : "Executando..."}
          </p>
        )}
        {step.warning ? (
          <p className="mt-2 text-xs font-medium text-status-warning">
            ⚠ {step.warning}
          </p>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </motion.div>
  );
}
