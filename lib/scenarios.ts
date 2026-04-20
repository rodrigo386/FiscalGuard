import type {
  AgentStepResult,
  AuditEvent,
  FinalDecision,
  GoodsReceipt,
  Invoice,
  PurchaseOrder,
  Retention,
  ScenarioKey,
  ThreeWayMatchResult,
} from "@/types";

export interface ScenarioBundle {
  key: Exclude<ScenarioKey, "custom">;
  title: string;
  shortLabel: string;
  description: string;
  expectedStatus: "POSTED" | "HUMAN_REVIEW" | "REJECTED";
  expectedScore: number;
  invoice: Invoice;
  purchaseOrder: PurchaseOrder;
  goodsReceipt: GoodsReceipt;
  match: ThreeWayMatchResult;
  retentions: Retention[];
  decision: FinalDecision;
  steps: AgentStepResult[];
  audit: AuditEvent[];
}

const isoToday = (day = 18) => `2026-04-${String(day).padStart(2, "0")}T09:00:00-03:00`;

export const SCENARIOS: Record<
  Exclude<ScenarioKey, "custom">,
  ScenarioBundle
> = {
  happy: buildHappyScenario(),
  tax_exception: buildTaxExceptionScenario(),
  match_divergence: buildMatchDivergenceScenario(),
};

export const SCENARIO_ORDER: Array<Exclude<ScenarioKey, "custom">> = [
  "happy",
  "tax_exception",
  "match_divergence",
];

/* ------------------------------- helpers -------------------------------- */

function buildHappyScenario(): ScenarioBundle {
  const invoice: Invoice = {
    id: "inv-happy",
    type: "NFSe",
    number: "NFSe 2026/0004711",
    accessKey: "3526041234567890000190553010000047110000000047",
    issueDate: isoToday(18),
    supplier: {
      name: "Operadora Portuária Santos Ltda",
      cnpj: "12.345.678/0001-90",
    },
    description: "Movimentação portuária — 47 TEUs",
    grossAmount: 47500,
    city: "Santos",
    stateCode: "SP",
    serviceCode: "20.01",
  };

  const purchaseOrder: PurchaseOrder = {
    id: "po-happy",
    number: "PO-2026-001234",
    supplierCnpj: "12.345.678/0001-90",
    totalAmount: 47500,
    toleranceBps: 200,
  };

  const goodsReceipt: GoodsReceipt = {
    id: "gr-happy",
    number: "GR-2026-005678",
    confirmedAt: isoToday(18),
    status: "confirmed",
  };

  const match: ThreeWayMatchResult = {
    overall: "pass",
    amountDiffPct: 0,
    fields: [
      {
        label: "CNPJ fornecedor",
        invoice: invoice.supplier.cnpj,
        po: purchaseOrder.supplierCnpj,
        status: "match",
      },
      {
        label: "Valor bruto",
        invoice: formatBRL(invoice.grossAmount),
        po: formatBRL(purchaseOrder.totalAmount),
        status: "match",
      },
      {
        label: "Goods Receipt",
        invoice: invoice.number,
        po: purchaseOrder.number,
        gr: goodsReceipt.number,
        status: "match",
        note: "Confirmado em 18/04/2026",
      },
    ],
  };

  const retentions: Retention[] = [
    {
      kind: "ISS",
      rate: 5,
      calculated: 2375,
      declared: 2375,
      status: "ok",
      note: "Código 20.01 · Santos/SP",
    },
    {
      kind: "INSS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      note: "Serviço não se enquadra como cessão de mão de obra",
    },
    {
      kind: "IRRF",
      rate: 1.5,
      calculated: 712.5,
      declared: 712.5,
      status: "ok",
    },
    { kind: "PIS", rate: 0.65, calculated: 308.75, declared: 308.75, status: "ok" },
    { kind: "COFINS", rate: 3, calculated: 1425, declared: 1425, status: "ok" },
    { kind: "CSLL", rate: 1, calculated: 475, declared: 475, status: "ok" },
  ];

  const decision: FinalDecision = {
    action: "POSTED",
    confidence: 97,
    summary: "Aprovação automática",
    justification:
      "Nota aderente ao PO, GR confirmada e todas as retenções conferem com o cálculo do agente.",
    flags: [],
  };

  const steps: AgentStepResult[] = [
    {
      step: "intake",
      title: "Intake & Classificação",
      status: "success",
      summary: "Documento classificado como NFSe · confiança 99%",
      payload: { detectedType: "NFSe", confidence: 0.99 },
    },
    {
      step: "extraction",
      title: "Extração Fiscal",
      status: "success",
      summary:
        "CNPJ, número, valor e chave de acesso extraídos com confiança total",
      payload: {
        cnpj: invoice.supplier.cnpj,
        numero: invoice.number,
        valor: invoice.grossAmount,
        data: invoice.issueDate,
        chave: invoice.accessKey,
      },
    },
    {
      step: "three_way_match",
      title: "3-Way Match",
      status: "success",
      summary: "NF × PO × GR — match em todos os campos",
    },
    {
      step: "retentions",
      title: "Validação de Retenções",
      status: "success",
      summary: "ISS, IRRF, PIS/COFINS/CSLL conferem com cálculo do agente",
    },
    {
      step: "decision",
      title: "Decisão Final",
      status: "success",
      summary: "POSTED · 97%",
    },
  ];

  const audit = defaultAudit("happy");
  return {
    key: "happy",
    title: "Caminho feliz — NFSe Portuário",
    shortLabel: "Caminho feliz",
    description:
      "Movimentação portuária R$ 47.500. PO e GR encontrados, retenções corretas. Aprovação automática.",
    expectedStatus: "POSTED",
    expectedScore: 97,
    invoice,
    purchaseOrder,
    goodsReceipt,
    match,
    retentions,
    decision,
    steps,
    audit,
  };
}

function buildTaxExceptionScenario(): ScenarioBundle {
  const invoice: Invoice = {
    id: "inv-tax",
    type: "CTe",
    number: "CTe 2026/0091234",
    accessKey: "3526049876543210000010570010000912340000000823",
    issueDate: isoToday(19),
    supplier: {
      name: "Rodovias do Sul Transportes S.A.",
      cnpj: "98.765.432/0001-10",
    },
    description: "Transporte rodoviário Santos → Campinas · 3 cargas",
    grossAmount: 82300,
    city: "Santos",
    stateCode: "SP",
    serviceCode: "transporte",
  };

  const purchaseOrder: PurchaseOrder = {
    id: "po-tax",
    number: "PO-2026-002891",
    supplierCnpj: "98.765.432/0001-10",
    totalAmount: 82300,
    toleranceBps: 200,
  };

  const goodsReceipt: GoodsReceipt = {
    id: "gr-tax",
    number: "GR-2026-008234",
    confirmedAt: isoToday(19),
    status: "confirmed",
  };

  const match: ThreeWayMatchResult = {
    overall: "pass",
    amountDiffPct: 0,
    fields: [
      {
        label: "CNPJ fornecedor",
        invoice: invoice.supplier.cnpj,
        po: purchaseOrder.supplierCnpj,
        status: "match",
      },
      {
        label: "Valor bruto",
        invoice: formatBRL(invoice.grossAmount),
        po: formatBRL(purchaseOrder.totalAmount),
        status: "match",
      },
      {
        label: "Goods Receipt",
        invoice: invoice.number,
        po: purchaseOrder.number,
        gr: goodsReceipt.number,
        status: "match",
      },
    ],
  };

  const retentions: Retention[] = [
    {
      kind: "ISS",
      rate: 5,
      calculated: 4115,
      declared: 1646,
      status: "mismatch",
      note: "Santos/SP aplica 5% para transporte. Fornecedor declarou 2%.",
    },
    {
      kind: "INSS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
    },
    {
      kind: "IRRF",
      rate: 1.5,
      calculated: 1234.5,
      declared: 1234.5,
      status: "ok",
    },
    { kind: "PIS", rate: 0.65, calculated: 535.0, declared: 535.0, status: "ok" },
    { kind: "COFINS", rate: 3, calculated: 2469, declared: 2469, status: "ok" },
    { kind: "CSLL", rate: 1, calculated: 823, declared: 823, status: "ok" },
  ];

  const decision: FinalDecision = {
    action: "HUMAN_REVIEW",
    confidence: 88,
    summary: "Revisão humana — divergência fiscal ISS",
    justification:
      "ISS declarado a 2% enquanto o município prestador (Santos/SP) aplica 5% para serviços de transporte. Recomendação: devolver ao fornecedor ou aceitar com retenção corrigida de R$ 4.115,00.",
    flags: ["retencao.iss.diff"],
  };

  const steps: AgentStepResult[] = [
    {
      step: "intake",
      title: "Intake & Classificação",
      status: "success",
      summary: "Documento classificado como CTe · confiança 98%",
      payload: { detectedType: "CTe", confidence: 0.98 },
    },
    {
      step: "extraction",
      title: "Extração Fiscal",
      status: "success",
      summary:
        "CNPJ, número, valor e chave de acesso extraídos sem divergência",
      payload: {
        cnpj: invoice.supplier.cnpj,
        numero: invoice.number,
        valor: invoice.grossAmount,
        data: invoice.issueDate,
        chave: invoice.accessKey,
      },
    },
    {
      step: "three_way_match",
      title: "3-Way Match",
      status: "success",
      summary: "NF × PO × GR — match em todos os campos",
    },
    {
      step: "retentions",
      title: "Validação de Retenções",
      status: "warning",
      summary:
        "ISS: agente calculou R$ 4.115,00 (5%) · fornecedor declarou R$ 1.646,00 (2%) — diferença R$ 2.469,00",
      warning: "Alíquota ISS inconsistente com município prestador",
    },
    {
      step: "decision",
      title: "Decisão Final",
      status: "warning",
      summary: "HUMAN_REVIEW · 88%",
    },
  ];

  return {
    key: "tax_exception",
    title: "Exceção fiscal — CTe Transporte",
    shortLabel: "Exceção fiscal",
    description:
      "Transporte rodoviário R$ 82.300 com ISS em alíquota incorreta (2% vs 5%). Encaminhado para revisão.",
    expectedStatus: "HUMAN_REVIEW",
    expectedScore: 88,
    invoice,
    purchaseOrder,
    goodsReceipt,
    match,
    retentions,
    decision,
    steps,
    audit: defaultAudit("tax_exception"),
  };
}

function buildMatchDivergenceScenario(): ScenarioBundle {
  const invoice: Invoice = {
    id: "inv-match",
    type: "NFe",
    number: "NFe 2026/0017823",
    accessKey: "3526045544433300000200550010000178230000000158",
    issueDate: isoToday(20),
    supplier: {
      name: "Equipamentos Industriais Brasil Ltda",
      cnpj: "55.444.333/0001-22",
    },
    description: "12 un. Válvula industrial X-450",
    grossAmount: 15800,
    quantity: 12,
    unitPrice: 1316.67,
    city: "Campinas",
    stateCode: "SP",
  };

  const purchaseOrder: PurchaseOrder = {
    id: "po-match",
    number: "PO-2026-003456",
    supplierCnpj: "55.444.333/0001-22",
    totalAmount: 14630,
    unitPrice: 1219.17,
    quantity: 12,
    toleranceBps: 200,
  };

  const goodsReceipt: GoodsReceipt = {
    id: "gr-match",
    number: "GR-2026-009112",
    confirmedAt: isoToday(20),
    quantity: 12,
    status: "confirmed",
  };

  const match: ThreeWayMatchResult = {
    overall: "fail",
    amountDiffPct: 8,
    fields: [
      {
        label: "CNPJ fornecedor",
        invoice: invoice.supplier.cnpj,
        po: purchaseOrder.supplierCnpj,
        status: "match",
      },
      {
        label: "Quantidade",
        invoice: String(invoice.quantity),
        po: String(purchaseOrder.quantity),
        gr: String(goodsReceipt.quantity),
        status: "match",
      },
      {
        label: "Preço unitário",
        invoice: formatBRL(invoice.unitPrice ?? 0),
        po: formatBRL(purchaseOrder.unitPrice ?? 0),
        status: "mismatch",
        note: "+8% sobre o PO (tolerância 2%)",
      },
      {
        label: "Valor bruto",
        invoice: formatBRL(invoice.grossAmount),
        po: formatBRL(purchaseOrder.totalAmount),
        status: "mismatch",
        note: "Δ R$ 1.170,00",
      },
    ],
  };

  const retentions: Retention[] = [
    {
      kind: "ISS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      note: "Mercadoria não sujeita a ISS",
    },
    {
      kind: "INSS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
    },
    {
      kind: "IRRF",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
    },
    { kind: "PIS", rate: 0.65, calculated: 102.7, declared: 102.7, status: "ok" },
    { kind: "COFINS", rate: 3, calculated: 474, declared: 474, status: "ok" },
    { kind: "CSLL", rate: 1, calculated: 158, declared: 158, status: "ok" },
  ];

  const decision: FinalDecision = {
    action: "HUMAN_REVIEW",
    confidence: 74,
    summary: "Revisão humana — divergência 3-way match",
    justification:
      "Valor da nota 8% acima do PO, fora da tolerância de 2%. Possível reajuste não formalizado ou erro de faturamento. Encaminhar ao comprador para validação.",
    flags: ["match.amount.diff"],
  };

  const steps: AgentStepResult[] = [
    {
      step: "intake",
      title: "Intake & Classificação",
      status: "success",
      summary: "Documento classificado como NFe · confiança 99%",
      payload: { detectedType: "NFe", confidence: 0.99 },
    },
    {
      step: "extraction",
      title: "Extração Fiscal",
      status: "success",
      summary: "Campos estruturais extraídos sem divergência",
      payload: {
        cnpj: invoice.supplier.cnpj,
        numero: invoice.number,
        valor: invoice.grossAmount,
        data: invoice.issueDate,
        chave: invoice.accessKey,
      },
    },
    {
      step: "three_way_match",
      title: "3-Way Match",
      status: "warning",
      summary:
        "Valor +8% acima do PO (tolerância 2%). Quantidade e CNPJ conferem.",
      warning: "Divergência de preço unitário",
    },
    {
      step: "retentions",
      title: "Validação de Retenções",
      status: "success",
      summary: "PIS/COFINS/CSLL conferem com cálculo do agente",
    },
    {
      step: "decision",
      title: "Decisão Final",
      status: "warning",
      summary: "HUMAN_REVIEW · 74%",
    },
  ];

  return {
    key: "match_divergence",
    title: "Divergência 3-way match — NFe MRO",
    shortLabel: "Divergência 3-way match",
    description:
      "NFe MRO R$ 15.800 com valor 8% acima do PO (tolerância 2%). Bloqueio com justificativa.",
    expectedStatus: "HUMAN_REVIEW",
    expectedScore: 74,
    invoice,
    purchaseOrder,
    goodsReceipt,
    match,
    retentions,
    decision,
    steps,
    audit: defaultAudit("match_divergence"),
  };
}

function defaultAudit(key: string): AuditEvent[] {
  const base = Date.now();
  const t = (offset: number) => new Date(base + offset).toISOString();
  return [
    { timestamp: t(0), step: "intake", action: "Documento recebido", detail: key },
    { timestamp: t(120), step: "intake", action: "Classificação concluída" },
    { timestamp: t(620), step: "extraction", action: "Extração iniciada" },
    { timestamp: t(1450), step: "extraction", action: "Campos fiscais extraídos" },
    { timestamp: t(2100), step: "three_way_match", action: "Busca de PO no Oracle" },
    { timestamp: t(2600), step: "three_way_match", action: "GR localizada" },
    { timestamp: t(3300), step: "retentions", action: "Retenções recalculadas" },
    { timestamp: t(4200), step: "decision", action: "Score consolidado" },
  ];
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export { formatBRL };
