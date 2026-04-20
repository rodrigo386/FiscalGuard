/* Conjunto de 10 notas para a rodada "ao vivo" — mix de 4 cenários canônicos
 * em proporção realista (70% touchless). */

import type { DocumentType } from "@/types";

export type LiveStatus = "POSTED" | "HUMAN_REVIEW" | "REJECTED";

export interface LiveNote {
  id: string;
  /** Horário estimado de chegada na operação (narrativa). */
  arrivedAt: string;
  type: DocumentType;
  supplier: string;
  description: string;
  amount: number;
  finalStatus: LiveStatus;
  confidence: number;
  reason?: string;
}

export const LIVE_NOTES: LiveNote[] = [
  {
    id: "live-1",
    arrivedAt: "14:00:00",
    type: "NFSe",
    supplier: "Operadora Portuária Santos Ltda",
    description: "Movimentação de 47 TEUs",
    amount: 47_500,
    finalStatus: "POSTED",
    confidence: 97,
  },
  {
    id: "live-2",
    arrivedAt: "14:00:10",
    type: "CTe",
    supplier: "Rodovias do Sul Transportes",
    description: "Transporte Santos → Campinas",
    amount: 82_300,
    finalStatus: "HUMAN_REVIEW",
    confidence: 88,
    reason: "ICMS 7% vs 12% intraestadual SP",
  },
  {
    id: "live-3",
    arrivedAt: "14:00:20",
    type: "NFe",
    supplier: "Equipamentos Industriais BR",
    description: "12 un. Válvula X-450",
    amount: 15_800,
    finalStatus: "HUMAN_REVIEW",
    confidence: 74,
    reason: "Preço +8% acima da PO",
  },
  {
    id: "live-4",
    arrivedAt: "14:00:30",
    type: "NFe",
    supplier: "Indústria Portuária Nacional",
    description: "Guindaste RTG-P450 · REPORTO",
    amount: 2_400_000,
    finalStatus: "POSTED",
    confidence: 96,
    reason: "REPORTO confirmado",
  },
  {
    id: "live-5",
    arrivedAt: "14:00:40",
    type: "NFSe",
    supplier: "Praticagem Baía de Santos",
    description: "Serviço de praticagem · 2 manobras",
    amount: 9_240,
    finalStatus: "POSTED",
    confidence: 99,
  },
  {
    id: "live-6",
    arrivedAt: "14:00:50",
    type: "NFSe",
    supplier: "Norton Lilly Agência Marítima",
    description: "Agenciamento MV Santos Express",
    amount: 28_100,
    finalStatus: "POSTED",
    confidence: 95,
  },
  {
    id: "live-7",
    arrivedAt: "14:01:00",
    type: "CTe",
    supplier: "Transmar Logística",
    description: "Transporte 4 contêineres · Rio → Santos",
    amount: 63_900,
    finalStatus: "POSTED",
    confidence: 94,
  },
  {
    id: "live-8",
    arrivedAt: "14:01:10",
    type: "NFSe",
    supplier: "LogFlex Armazéns Gerais",
    description: "Armazenagem externa · abril 2026",
    amount: 12_870,
    finalStatus: "POSTED",
    confidence: 96,
  },
  {
    id: "live-9",
    arrivedAt: "14:01:20",
    type: "NFSe",
    supplier: "Unisantos Terminal",
    description: "Capatazia · janela 42 h",
    amount: 102_550,
    finalStatus: "HUMAN_REVIEW",
    confidence: 81,
    reason: "Valor acima do histórico — exige matriz de alçada",
  },
  {
    id: "live-10",
    arrivedAt: "14:01:30",
    type: "NFSe",
    supplier: "Aduaneiros Associados",
    description: "Despacho aduaneiro · 3 DIs",
    amount: 17_220,
    finalStatus: "POSTED",
    confidence: 96,
  },
];

export const LIVE_STAGES: Array<{ key: string; label: string }> = [
  { key: "intake", label: "Intake" },
  { key: "extraction", label: "Extração" },
  { key: "match", label: "3-Way Match" },
  { key: "tax", label: "Tributário" },
  { key: "decision", label: "Decisão" },
];

export const LIVE_CONFIG = {
  /** Intervalo entre chegadas de NFs (ms). */
  arrivalIntervalMs: 10_000,
  /** Duração de cada etapa de processamento (ms). */
  stageDurationMs: 1_000,
  /** Total de notas na rodada. */
  total: 10,
};
