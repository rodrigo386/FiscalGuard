"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AutonomyMode } from "@/types";
import { cn } from "@/lib/utils";

const MODES: Array<{
  key: AutonomyMode;
  label: string;
  tooltip: string;
}> = [
  {
    key: "hitl_strong",
    label: "HITL Forte",
    tooltip:
      "Toda decisão passa pelo analista. O agente sugere, nunca aprova sozinho.",
  },
  {
    key: "score_based",
    label: "Score-Based",
    tooltip:
      "Aprova quando confiança ≥ 95%. Abaixo disso encaminha para revisão.",
  },
  {
    key: "full_autonomous",
    label: "Full Autonomous",
    tooltip:
      "Aprova, rejeita ou escala sem intervenção. Sugerido apenas para fornecedores com histórico estável.",
  },
];

interface Props {
  value: AutonomyMode;
  onChange: (value: AutonomyMode) => void;
  disabled?: boolean;
}

export function AutonomyModeSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-muted">
        Modo de autonomia
      </div>
      <div
        role="radiogroup"
        aria-label="Modo de autonomia do agente"
        className="inline-flex w-full rounded-lg bg-neutral-bg p-1"
      >
        {MODES.map((mode) => {
          const selected = mode.key === value;
          return (
            <Tooltip key={mode.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange(mode.key)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "bg-white text-brand-teal shadow-sm"
                      : "text-neutral-muted hover:text-neutral-ink",
                    disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  {mode.label}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {mode.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
