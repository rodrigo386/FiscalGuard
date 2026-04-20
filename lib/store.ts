"use client";

import { create } from "zustand";
import type {
  AgentStepKey,
  AgentStepResult,
  AgentStepStatus,
  AuditEvent,
  AutonomyMode,
  ClaudeTrace,
  FinalDecision,
  GoodsReceipt,
  Invoice,
  PurchaseOrder,
  Retention,
  ScenarioKey,
  SSEEvent,
  ThreeWayMatchResult,
} from "@/types";

export const AGENT_STEP_ORDER: AgentStepKey[] = [
  "intake",
  "extraction",
  "three_way_match",
  "retentions",
  "decision",
];

export const AGENT_STEP_TITLES: Record<AgentStepKey, string> = {
  intake: "Intake & Classificação",
  extraction: "Extração Fiscal",
  three_way_match: "3-Way Match",
  retentions: "Validação de Retenções",
  decision: "Decisão Final",
};

interface DemoState {
  selectedScenario: ScenarioKey | null;
  autonomyMode: AutonomyMode;
  isProcessing: boolean;
  invoice: Invoice | null;
  purchaseOrder: PurchaseOrder | null;
  goodsReceipt: GoodsReceipt | null;
  match: ThreeWayMatchResult | null;
  retentions: Retention[];
  decision: FinalDecision | null;
  steps: AgentStepResult[];
  audit: AuditEvent[];
  traces: ClaudeTrace[];
  error: string | null;
  runId: string | null;

  setAutonomyMode: (mode: AutonomyMode) => void;
  beginRun: (scenario: ScenarioKey) => void;
  ingest: (event: SSEEvent) => void;
  finish: (runId: string) => void;
  fail: (message: string) => void;
  resetAll: () => void;
}

function makeInitialSteps(): AgentStepResult[] {
  return AGENT_STEP_ORDER.map((step) => ({
    step,
    title: AGENT_STEP_TITLES[step],
    status: "idle" as AgentStepStatus,
  }));
}

const initialState = (): Omit<
  DemoState,
  "setAutonomyMode" | "beginRun" | "ingest" | "finish" | "fail" | "resetAll"
> => ({
  selectedScenario: null,
  autonomyMode: "score_based",
  isProcessing: false,
  invoice: null,
  purchaseOrder: null,
  goodsReceipt: null,
  match: null,
  retentions: [],
  decision: null,
  steps: makeInitialSteps(),
  audit: [],
  traces: [],
  error: null,
  runId: null,
});

export const useDemoStore = create<DemoState>((set, get) => ({
  ...initialState(),

  setAutonomyMode: (mode) => set({ autonomyMode: mode }),

  beginRun: (scenario) =>
    set({
      ...initialState(),
      autonomyMode: get().autonomyMode,
      selectedScenario: scenario,
      isProcessing: true,
    }),

  ingest: (event) =>
    set((state) => applyEvent(state, event)),

  finish: (runId) => set({ isProcessing: false, runId }),

  fail: (message) => set({ isProcessing: false, error: message }),

  resetAll: () => set(initialState()),
}));

function applyEvent(state: DemoState, event: SSEEvent): Partial<DemoState> {
  switch (event.type) {
    case "step": {
      const next = state.steps.map((s) =>
        s.step === event.payload.step ? { ...s, ...event.payload } : s
      );
      return { steps: next };
    }
    case "match":
      return { match: event.payload };
    case "retentions":
      return { retentions: event.payload };
    case "decision":
      return { decision: event.payload };
    case "audit":
      return { audit: [...state.audit, event.payload] };
    case "trace":
      return { traces: [...state.traces, event.payload] };
    case "invoice":
      return { invoice: event.payload };
    case "po":
      return { purchaseOrder: event.payload };
    case "gr":
      return { goodsReceipt: event.payload };
    case "error":
      return { error: event.payload.message, isProcessing: false };
    default:
      return {};
  }
}

export function currentStepKey(steps: AgentStepResult[]): AgentStepKey | null {
  const processing = steps.find((s) => s.status === "processing");
  if (processing) return processing.step;
  const lastCompleted = [...steps]
    .reverse()
    .find((s) => s.status !== "idle");
  return lastCompleted?.step ?? null;
}
