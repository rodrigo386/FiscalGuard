"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioCardProps {
  title: string;
  description: string;
  expected: string;
  expectedTone: "success" | "warning" | "error";
  icon: LucideIcon;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

const TONE_STYLES: Record<
  ScenarioCardProps["expectedTone"],
  { bg: string; fg: string }
> = {
  success: { bg: "bg-status-success-bg", fg: "text-status-success" },
  warning: { bg: "bg-status-warning-bg", fg: "text-status-warning" },
  error: { bg: "bg-status-error-bg", fg: "text-status-error" },
};

export function ScenarioCard({
  title,
  description,
  expected,
  expectedTone,
  icon: Icon,
  selected,
  disabled,
  onSelect,
}: ScenarioCardProps) {
  const tone = TONE_STYLES[expectedTone];
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-xl border bg-white p-4 text-left shadow-card transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
        selected
          ? "border-brand-teal ring-2 ring-brand-teal/20"
          : "border-black/5 hover:-translate-y-0.5 hover:border-brand-teal/30 hover:shadow-card-hover",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple-light text-brand-purple">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-neutral-ink">
              {title}
            </h3>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-muted">
            {description}
          </p>
          <span
            className={cn(
              "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              tone.bg,
              tone.fg
            )}
          >
            {expected}
          </span>
        </div>
      </div>
    </button>
  );
}
