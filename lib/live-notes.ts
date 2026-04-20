/* Conjunto de 10 notas para a rodada "ao vivo" — mix de 4 cenários canônicos
 * em proporção realista (70% touchless). */

import type { DocumentType } from "@/types";

export type LiveStatus = "POSTED" | "HUMAN_REVIEW" | "REJECTED";

export type LiveTaxStatus = "ok" | "mismatch" | "suspended" | "na";

export interface LiveTaxLine {
  kind: string;
  rate: number;
  calculated: number;
  declared: number;
  status: LiveTaxStatus;
  note?: string;
}

export interface LiveDetail {
  cnpj: string;
  number: string;
  issueDate: string;
  taxes: LiveTaxLine[];
  po?: {
    number: string;
    total: number;
    diffPct: number;
    toleranceBps: number;
  };
  receipt?: {
    number: string;
    label: string;
  };
  justification: string;
  recommendation?: string;
}

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
  detail: LiveDetail;
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
    detail: {
      cnpj: "12.345.678/0001-90",
      number: "NFSe 2026/0004711",
      issueDate: "2026-04-20T13:58:12-03:00",
      taxes: [
        { kind: "ISS", rate: 5, calculated: 2375, declared: 2375, status: "ok", note: "Código 20.01 · Santos/SP · retido pelo tomador" },
        { kind: "IRRF", rate: 1.5, calculated: 712.5, declared: 712.5, status: "ok", note: "Serviços profissionais · IN RFB 1.234" },
        { kind: "CSRF", rate: 0, calculated: 0, declared: 0, status: "na", note: "Serviço portuário não está na lista da Lei 10.833" },
      ],
      po: { number: "PO-2026-001234", total: 47_500, diffPct: 0, toleranceBps: 200 },
      receipt: { number: "SES-2026-005678", label: "Service Entry Sheet" },
      justification:
        "Nota aderente ao PO, SES atestada, ISS 5% e IRRF 1,5% conferem. EFD-Reinf R-4010 agendado para 15/05.",
    },
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
    detail: {
      cnpj: "98.765.432/0001-10",
      number: "CTe 2026/0091234",
      issueDate: "2026-04-20T14:00:04-03:00",
      taxes: [
        { kind: "ICMS", rate: 12, calculated: 9876, declared: 5761, status: "mismatch", note: "SP→SP intraestadual exige 12% · fornecedor destacou 7%" },
        { kind: "IPI", rate: 0, calculated: 0, declared: 0, status: "na", note: "Serviço de transporte · fora do campo do IPI" },
        { kind: "CSRF", rate: 0, calculated: 0, declared: 0, status: "na", note: "Transporte de cargas não está na Lei 10.833" },
      ],
      po: { number: "PO-2026-002891", total: 82_300, diffPct: 0, toleranceBps: 200 },
      receipt: { number: "CE-2026-008234", label: "Canhoto de Entrega" },
      justification:
        "ICMS destacado a 7% enquanto operação intraestadual SP exige 12%. Diferença de R$ 4.115,00.",
      recommendation:
        "Devolver ao fornecedor com solicitação de CT-e de substituição, ou aceitar e provisionar complemento via GIA.",
    },
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
    detail: {
      cnpj: "55.444.333/0001-22",
      number: "NFe 2026/0017823",
      issueDate: "2026-04-20T13:59:47-03:00",
      taxes: [
        { kind: "ICMS", rate: 18, calculated: 2844, declared: 2844, status: "ok", note: "SP→SP · CST 00 · CFOP 5.101" },
        { kind: "IPI", rate: 5, calculated: 790, declared: 790, status: "ok", note: "NCM 8481.80.39 · TIPI 5%" },
        { kind: "ICMS-ST", rate: 0, calculated: 0, declared: 0, status: "na", note: "NCM 8481 fora do protocolo ICMS-ST SP" },
      ],
      po: { number: "PO-2026-003456", total: 14_630, diffPct: 8, toleranceBps: 200 },
      receipt: { number: "GR-2026-009112", label: "Goods Receipt" },
      justification:
        "Preço unitário +8% acima do pedido (R$ 1.316,67 vs R$ 1.219,17), fora da tolerância de 2%.",
      recommendation:
        "Encaminhar ao comprador responsável pela PO-2026-003456 para validar reajuste ou glosar diferença.",
    },
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
    detail: {
      cnpj: "11.222.333/0001-44",
      number: "NFe 2026/0025701",
      issueDate: "2026-04-20T13:55:19-03:00",
      taxes: [
        { kind: "ICMS", rate: 18, calculated: 432_000, declared: 432_000, status: "ok", note: "SP→SP · REPORTO não desonera ICMS estadual" },
        { kind: "IPI", rate: 0, calculated: 0, declared: 0, status: "suspended", note: "Suspenso por REPORTO · CST 55" },
        { kind: "PIS", rate: 0, calculated: 0, declared: 0, status: "suspended", note: "Alíquota zero · Lei 11.033/04 art. 14" },
        { kind: "COFINS", rate: 0, calculated: 0, declared: 0, status: "suspended", note: "Alíquota zero · Lei 11.033/04 art. 14" },
      ],
      po: { number: "PO-2026-005001", total: 2_400_000, diffPct: 0, toleranceBps: 100 },
      receipt: { number: "GR-2026-011223", label: "Goods Receipt" },
      justification:
        "Guindaste destinado ao ativo imobilizado portuário · enquadramento REPORTO validado · PIS/COFINS/IPI suspensos corretamente.",
    },
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
    detail: {
      cnpj: "22.333.444/0001-55",
      number: "NFSe 2026/0003002",
      issueDate: "2026-04-20T13:52:08-03:00",
      taxes: [
        { kind: "ISS", rate: 5, calculated: 462, declared: 462, status: "ok", note: "Santos/SP · código 20.02" },
        { kind: "IRRF", rate: 1.5, calculated: 138.6, declared: 138.6, status: "ok" },
      ],
      po: { number: "PO-2026-003102", total: 9_240, diffPct: 0, toleranceBps: 300 },
      receipt: { number: "SES-2026-005910", label: "Service Entry Sheet" },
      justification: "Praticagem atestada pelo comandante de turno · valores conferem com contrato mestre.",
    },
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
    detail: {
      cnpj: "44.555.666/0001-77",
      number: "NFSe 2026/0008421",
      issueDate: "2026-04-20T13:47:54-03:00",
      taxes: [
        { kind: "ISS", rate: 5, calculated: 1405, declared: 1405, status: "ok", note: "Santos/SP · agenciamento marítimo" },
        { kind: "IRRF", rate: 1.5, calculated: 421.5, declared: 421.5, status: "ok" },
      ],
      po: { number: "PO-2026-003998", total: 28_100, diffPct: 0, toleranceBps: 300 },
      receipt: { number: "SES-2026-006044", label: "Service Entry Sheet" },
      justification: "Agenciamento de navio MV Santos Express · escalas e documentos conferem com booking.",
    },
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
    detail: {
      cnpj: "33.222.111/0001-88",
      number: "CTe 2026/0045502",
      issueDate: "2026-04-20T13:45:33-03:00",
      taxes: [
        { kind: "ICMS", rate: 12, calculated: 7668, declared: 7668, status: "ok", note: "RJ→SP interestadual · alíquota 12%" },
      ],
      po: { number: "PO-2026-004210", total: 63_900, diffPct: 0, toleranceBps: 300 },
      receipt: { number: "CE-2026-008502", label: "Canhoto de Entrega" },
      justification: "Transporte interestadual RJ→SP · ICMS 12% correto · canhoto digital confirmado.",
    },
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
    detail: {
      cnpj: "66.777.888/0001-99",
      number: "NFSe 2026/0011088",
      issueDate: "2026-04-20T13:40:11-03:00",
      taxes: [
        { kind: "ISS", rate: 5, calculated: 643.5, declared: 643.5, status: "ok", note: "Santos/SP · armazenagem" },
        { kind: "IRRF", rate: 1.5, calculated: 193.05, declared: 193.05, status: "ok" },
      ],
      po: { number: "PO-2026-004322", total: 12_870, diffPct: 0, toleranceBps: 300 },
      receipt: { number: "SES-2026-006180", label: "Service Entry Sheet" },
      justification: "Contrato mensal de armazenagem externa · volumes e diárias conferem com medição.",
    },
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
    detail: {
      cnpj: "77.888.999/0001-10",
      number: "NFSe 2026/0014770",
      issueDate: "2026-04-20T13:38:09-03:00",
      taxes: [
        { kind: "ISS", rate: 5, calculated: 5127.5, declared: 5127.5, status: "ok", note: "Santos/SP · capatazia" },
        { kind: "IRRF", rate: 1.5, calculated: 1538.25, declared: 1538.25, status: "ok" },
      ],
      po: { number: "PO-2026-004505", total: 102_550, diffPct: 0, toleranceBps: 200 },
      receipt: { number: "SES-2026-006233", label: "Service Entry Sheet" },
      justification:
        "Tributação correta e 3-way match aderente, mas valor supera alçada automática do agente (R$ 100.000).",
      recommendation:
        "Encaminhar para Gerente de Operações Portuárias · matriz de alçada exige aprovação manual acima de R$ 100K.",
    },
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
    detail: {
      cnpj: "88.999.000/0001-21",
      number: "NFSe 2026/0019045",
      issueDate: "2026-04-20T13:35:22-03:00",
      taxes: [
        { kind: "ISS", rate: 5, calculated: 861, declared: 861, status: "ok", note: "Santos/SP · despacho aduaneiro" },
        { kind: "IRRF", rate: 1.5, calculated: 258.3, declared: 258.3, status: "ok" },
      ],
      po: { number: "PO-2026-004668", total: 17_220, diffPct: 0, toleranceBps: 300 },
      receipt: { number: "SES-2026-006287", label: "Service Entry Sheet" },
      justification: "Despacho de 3 DIs · valores por DI conferem com tabela contratada · retenções corretas.",
    },
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
