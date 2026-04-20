"use client";

import { useMemo } from "react";
import { Anchor, AlertTriangle, Scale } from "lucide-react";
import { ScenarioCard } from "@/components/demo/ScenarioCard";
import { UploadZone } from "@/components/demo/UploadZone";
import { AutonomyModeSelector } from "@/components/demo/AutonomyModeSelector";
import { AgentTimeline } from "@/components/demo/AgentTimeline";
import { SCENARIOS } from "@/lib/scenarios";
import { useDemoStore } from "@/lib/store";
import { useSSEProcessing } from "@/lib/use-sse-processing";
import type { ScenarioKey } from "@/types";

export default function DemoPage() {
  const { selectedScenario, autonomyMode, isProcessing, setAutonomyMode } =
    useDemoStore();
  const { runScenario } = useSSEProcessing();

  const cards = useMemo(
    () => [
      {
        key: "happy" as ScenarioKey,
        icon: Anchor,
        scenario: SCENARIOS.happy,
        tone: "success" as const,
        expected: "POSTED · 97%",
      },
      {
        key: "tax_exception" as ScenarioKey,
        icon: Scale,
        scenario: SCENARIOS.tax_exception,
        tone: "warning" as const,
        expected: "HUMAN_REVIEW · 88%",
      },
      {
        key: "match_divergence" as ScenarioKey,
        icon: AlertTriangle,
        scenario: SCENARIOS.match_divergence,
        tone: "warning" as const,
        expected: "HUMAN_REVIEW · 74%",
      },
    ],
    []
  );

  const handleFile = (file: File) => {
    runScenario("custom", autonomyMode, file);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <section className="flex flex-col gap-4">
        <header>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-purple">
            Passo 1
          </span>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-ink">
            Escolha um cenário
          </h1>
          <p className="mt-1 text-sm text-neutral-muted">
            Três casos canônicos que cobrem caminho feliz, exceção fiscal e
            divergência de 3-way match.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <ScenarioCard
              key={card.key}
              title={card.scenario.title}
              description={card.scenario.description}
              expected={card.expected}
              expectedTone={card.tone}
              icon={card.icon}
              selected={selectedScenario === card.key}
              disabled={isProcessing}
              onSelect={() => runScenario(card.key, autonomyMode)}
            />
          ))}
        </div>

        <UploadZone
          disabled={isProcessing}
          uploading={isProcessing && selectedScenario === "custom"}
          onFile={handleFile}
        />

        <AutonomyModeSelector
          value={autonomyMode}
          onChange={setAutonomyMode}
          disabled={isProcessing}
        />

        <div className="rounded-lg border border-black/5 bg-white p-3 text-[11px] leading-relaxed text-neutral-muted">
          A chave da API Anthropic nunca sai do servidor. As chamadas reais ao
          Claude acontecem nas rotas <code>/api/process</code> e{" "}
          <code>/api/explain</code>.
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex items-end justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-purple">
              Passo 2
            </span>
            <h2 className="mt-1 text-2xl font-semibold text-neutral-ink">
              Acompanhe a decisão em tempo real
            </h2>
          </div>
          <span className="hidden rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-medium text-neutral-muted md:inline-flex">
            5 sub-agentes · SSE · Claude Sonnet
          </span>
        </header>

        <AgentTimeline />
      </section>
    </div>
  );
}
