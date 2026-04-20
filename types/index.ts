/* Tipos compartilhados da POC Fiscal Guardian. */

export type ScenarioKey =
  | "happy"
  | "tax_exception"
  | "match_divergence"
  | "custom";

export type AutonomyMode = "hitl_strong" | "score_based" | "full_autonomous";

export type AgentStepKey =
  | "intake"
  | "extraction"
  | "three_way_match"
  | "retentions"
  | "decision";

export type AgentStepStatus = "idle" | "processing" | "success" | "warning" | "error";

export type DocumentType = "NFSe" | "CTe" | "NFe" | "Outro";

export interface Supplier {
  name: string;
  cnpj: string;
}

export interface Invoice {
  id: string;
  type: DocumentType;
  number: string;
  accessKey?: string;
  issueDate: string; // ISO
  supplier: Supplier;
  description: string;
  grossAmount: number;
  netAmount?: number;
  city?: string;
  stateCode?: string;
  serviceCode?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierCnpj: string;
  totalAmount: number;
  unitPrice?: number;
  quantity?: number;
  toleranceBps: number; // basis points (200 = 2%)
}

export type ReceiptKind = "goods_receipt" | "service_entry" | "delivery_proof";

export interface GoodsReceipt {
  id: string;
  number: string;
  confirmedAt: string; // ISO
  quantity?: number;
  status: "confirmed" | "pending" | "partial";
  kind: ReceiptKind;
}

export type MatchFieldStatus = "match" | "mismatch" | "na";

export interface MatchField {
  label: string;
  invoice: string;
  po: string;
  gr?: string;
  status: MatchFieldStatus;
  note?: string;
}

export interface ThreeWayMatchResult {
  overall: "pass" | "fail";
  amountDiffPct: number;
  fields: MatchField[];
}

export type RetentionKind =
  | "ISS"
  | "INSS"
  | "IRRF"
  | "PIS"
  | "COFINS"
  | "CSLL";

export type RetentionStatus = "ok" | "mismatch" | "not_applicable";

export interface Retention {
  kind: RetentionKind;
  calculated: number;
  declared: number;
  rate: number; // percentage
  status: RetentionStatus;
  note?: string;
}

export type FinalAction = "POSTED" | "HUMAN_REVIEW" | "REJECTED";

export interface FinalDecision {
  action: FinalAction;
  confidence: number; // 0..100
  summary: string;
  justification: string;
  flags: string[];
}

export interface AgentStepResult {
  step: AgentStepKey;
  title: string;
  status: AgentStepStatus;
  startedAt?: string;
  finishedAt?: string;
  payload?: Record<string, unknown>;
  summary?: string;
  warning?: string;
}

export interface AuditEvent {
  timestamp: string;
  step: AgentStepKey | "system";
  action: string;
  detail?: string;
}

export interface ClaudeTrace {
  step: AgentStepKey | "explain";
  model: string;
  promptPreview: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  simulated: boolean;
}

export interface ProcessingState {
  scenario: ScenarioKey;
  autonomyMode: AutonomyMode;
  invoice: Invoice;
  purchaseOrder?: PurchaseOrder;
  goodsReceipt?: GoodsReceipt;
  match?: ThreeWayMatchResult;
  retentions: Retention[];
  decision?: FinalDecision;
  steps: AgentStepResult[];
  audit: AuditEvent[];
  traces: ClaudeTrace[];
}

export type SSEEvent =
  | { type: "step"; payload: AgentStepResult }
  | { type: "match"; payload: ThreeWayMatchResult }
  | { type: "retentions"; payload: Retention[] }
  | { type: "decision"; payload: FinalDecision }
  | { type: "audit"; payload: AuditEvent }
  | { type: "trace"; payload: ClaudeTrace }
  | { type: "invoice"; payload: Invoice }
  | { type: "po"; payload: PurchaseOrder }
  | { type: "gr"; payload: GoodsReceipt }
  | { type: "done"; payload: { runId: string } }
  | { type: "error"; payload: { message: string } };
