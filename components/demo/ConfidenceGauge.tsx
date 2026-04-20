"use client";

import { useMemo } from "react";

interface ConfidenceGaugeProps {
  value: number;
  label?: string;
}

export function ConfidenceGauge({ value, label }: ConfidenceGaugeProps) {
  const safe = Math.max(0, Math.min(100, value));
  const { color, tone } = useMemo(() => bandFor(safe), [safe]);
  const radius = 70;
  const stroke = 14;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - safe / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 180 110"
        className="h-32 w-40"
        role="img"
        aria-label={`Score de confiança: ${safe}%`}
      >
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 70 70 0 0 1 160 100"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="-mt-10 text-center">
        <div className="text-4xl font-semibold tracking-tight text-neutral-ink">
          {safe}
          <span className="ml-0.5 text-xl text-neutral-muted">%</span>
        </div>
        <div className="text-xs font-medium uppercase tracking-wide" style={{ color }}>
          {tone}
        </div>
        {label ? (
          <div className="mt-1 text-sm text-neutral-muted">{label}</div>
        ) : null}
      </div>
    </div>
  );
}

function bandFor(value: number): { color: string; tone: string } {
  if (value >= 90) return { color: "#10B981", tone: "Alta confiança" };
  if (value >= 70) return { color: "#F59E0B", tone: "Revisão sugerida" };
  return { color: "#EF4444", tone: "Baixa confiança" };
}
