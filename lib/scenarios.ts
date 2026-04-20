import type {
  AgentStepResult,
  AuditEvent,
  FinalDecision,
  GoodsReceipt,
  Invoice,
  PurchaseOrder,
  ReceiptKind,
  Retention,
  ScenarioKey,
  ThreeWayMatchResult,
} from "@/types";

export function receiptLabel(kind: ReceiptKind): { long: string; short: string } {
  switch (kind) {
    case "service_entry":
      return { long: "Service Entry Sheet", short: "SES" };
    case "delivery_proof":
      return { long: "Canhoto de Entrega", short: "CE" };
    case "goods_receipt":
    default:
      return { long: "Goods Receipt", short: "GR" };
  }
}

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
  reporto: buildReportoScenario(),
};

export const SCENARIO_ORDER: Array<Exclude<ScenarioKey, "custom">> = [
  "happy",
  "tax_exception",
  "match_divergence",
  "reporto",
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
    id: "ses-happy",
    number: "SES-2026-005678",
    confirmedAt: isoToday(18),
    status: "confirmed",
    kind: "service_entry",
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
        label: "Service Entry Sheet",
        invoice: invoice.number,
        po: purchaseOrder.number,
        gr: goodsReceipt.number,
        status: "match",
        note: "Serviço atestado em 18/04/2026",
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
      scope: "retained",
      note: "Código 20.01 · Santos/SP · ISS retido pelo tomador",
    },
    {
      kind: "IRRF",
      rate: 1.5,
      calculated: 712.5,
      declared: 712.5,
      status: "ok",
      scope: "retained",
      note: "IN RFB 1.234/2012 · serviços profissionais",
    },
    {
      kind: "INSS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
      note: "Serviço não se enquadra como cessão de mão de obra",
    },
    {
      kind: "PIS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
      note: "Serviços portuários não estão na lista da Lei 10.833/03 art. 30 (CSRF)",
    },
    {
      kind: "COFINS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
    },
    {
      kind: "CSLL",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
    },
  ];

  const decision: FinalDecision = {
    action: "POSTED",
    confidence: 97,
    summary: "Aprovação automática",
    justification:
      "Nota aderente ao PO, evidência de serviço (SES) atestada, ISS de 5% (Santos) e IRRF de 1,5% conferem com o cálculo do agente. Obrigações acessórias pendentes: evento R-4010 EFD-Reinf até 15/05/2026.",
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
      summary: "NF × PO × SES — match em todos os campos",
    },
    {
      step: "retentions",
      title: "Validação Tributária",
      status: "success",
      summary: "ISS 5% retido (Santos) e IRRF 1,5% conferem · CSRF Lei 10.833 não aplicável a serviço portuário",
    },
    {
      step: "decision",
      title: "Decisão Final",
      status: "success",
      summary: "POSTED · 97%",
    },
  ];

  const audit = defaultAudit("happy", goodsReceipt.kind);
  return {
    key: "happy",
    title: "100% Compliance — NFSe Portuário",
    shortLabel: "100% Compliance",
    description:
      "Movimentação portuária R$ 47.500. PO e evidência de serviço encontrados, retenções corretas. Aprovação automática.",
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
    id: "ce-tax",
    number: "CE-2026-008234",
    confirmedAt: isoToday(19),
    status: "confirmed",
    kind: "delivery_proof",
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
        label: "Canhoto de Entrega",
        invoice: invoice.number,
        po: purchaseOrder.number,
        gr: goodsReceipt.number,
        status: "match",
        note: "Protocolo de entrega confirmado em Campinas",
      },
    ],
  };

  const retentions: Retention[] = [
    {
      kind: "ICMS",
      rate: 12,
      calculated: 9876,
      declared: 5761,
      status: "mismatch",
      scope: "highlighted",
      note: "Transporte intraestadual SP→SP: alíquota 12%. Fornecedor destacou 7% (alíquota interestadual). CFOP correto: 5.352.",
    },
    {
      kind: "IPI",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "highlighted",
      note: "Serviço de transporte — fora do campo de incidência do IPI",
    },
    {
      kind: "PIS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
      note: "Transporte de cargas não está na lista da Lei 10.833/03 (art. 30)",
    },
    {
      kind: "COFINS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
    },
    {
      kind: "CSLL",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
    },
    {
      kind: "ISS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
      note: "Transporte intermunicipal/interestadual é tributado por ICMS, não ISS",
    },
  ];

  const decision: FinalDecision = {
    action: "HUMAN_REVIEW",
    confidence: 88,
    summary: "Revisão humana — ICMS destacado a 7% em operação intraestadual SP (correto: 12%)",
    justification:
      "ICMS destacado pelo fornecedor a 7% (alíquota interestadual). A operação Santos→Campinas é intraestadual SP, alíquota correta 12% = R$ 9.876,00. Diferença a maior de R$ 4.115,00 no imposto devido. Recomendação: solicitar CT-e de substituição ou aceitar com provisão para complemento de ICMS via GIA/SPED Fiscal.",
    flags: ["tributo.icms.aliquota", "cfop.verificar"],
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
      summary: "NF × PO × Canhoto de Entrega — match em todos os campos",
    },
    {
      step: "retentions",
      title: "Validação Tributária",
      status: "warning",
      summary:
        "ICMS: agente calculou R$ 9.876,00 (12% intraestadual SP) · fornecedor destacou R$ 5.761,00 (7%) — diferença R$ 4.115,00",
      warning: "Alíquota de ICMS inconsistente com operação intraestadual",
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
      "Transporte rodoviário R$ 82.300 com ICMS destacado a 7% quando a operação intraestadual SP exige 12%. Encaminhado para revisão.",
    expectedStatus: "HUMAN_REVIEW",
    expectedScore: 88,
    invoice,
    purchaseOrder,
    goodsReceipt,
    match,
    retentions,
    decision,
    steps,
    audit: defaultAudit("tax_exception", goodsReceipt.kind),
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
    description: "12 un. Válvula industrial X-450 · NCM 8481.80.39 · CFOP 5.101",
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
    kind: "goods_receipt",
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
      kind: "ICMS",
      rate: 18,
      calculated: 2844,
      declared: 2844,
      status: "ok",
      scope: "highlighted",
      note: "SP→SP intraestadual · alíquota 18% · CST 00",
    },
    {
      kind: "IPI",
      rate: 5,
      calculated: 790,
      declared: 790,
      status: "ok",
      scope: "highlighted",
      note: "NCM 8481.80.39 · TIPI 5%",
    },
    {
      kind: "ICMS-ST",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "highlighted",
      note: "NCM 8481 não consta do Protocolo ICMS-ST SP",
    },
    {
      kind: "PIS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
      note: "Retenção PIS/COFINS/CSLL (Lei 10.833) aplica-se a serviços, não a compra de mercadoria",
    },
    {
      kind: "COFINS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
    },
    {
      kind: "CSLL",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
    },
    {
      kind: "IRRF",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
      note: "Venda de mercadoria não é hipótese de IRRF na fonte",
    },
  ];

  const decision: FinalDecision = {
    action: "HUMAN_REVIEW",
    confidence: 74,
    summary: "Revisão humana — divergência 3-way match de preço",
    justification:
      "Preço unitário da nota 8% acima do pedido (R$ 1.316,67 vs R$ 1.219,17), fora da tolerância de 2%. Tributação destacada (ICMS 18%, IPI 5%) está correta para NCM 8481.80.39 em operação intraestadual SP. Encaminhar ao comprador para validação do reajuste.",
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
      title: "Validação Tributária",
      status: "success",
      summary: "ICMS 18% e IPI 5% destacados conferem · sem hipótese de ICMS-ST ou retenção federal nesta operação",
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
    audit: defaultAudit("match_divergence", goodsReceipt.kind),
  };
}

function buildReportoScenario(): ScenarioBundle {
  const invoice: Invoice = {
    id: "inv-reporto",
    type: "NFe",
    number: "NFe 2026/0025701",
    accessKey: "3526041122233300000140550010000257010000000240",
    issueDate: isoToday(21),
    supplier: {
      name: "Indústria Portuária Nacional S.A.",
      cnpj: "11.222.333/0001-44",
    },
    description:
      "1 un. Guindaste móvel portuário RTG-P450 · NCM 8426.41.00 · CFOP 5.101 · REPORTO",
    grossAmount: 2_400_000,
    quantity: 1,
    unitPrice: 2_400_000,
    city: "Santos",
    stateCode: "SP",
  };

  const purchaseOrder: PurchaseOrder = {
    id: "po-reporto",
    number: "PO-2026-005001",
    supplierCnpj: "11.222.333/0001-44",
    totalAmount: 2_400_000,
    unitPrice: 2_400_000,
    quantity: 1,
    toleranceBps: 100,
  };

  const goodsReceipt: GoodsReceipt = {
    id: "gr-reporto",
    number: "GR-2026-011223",
    confirmedAt: isoToday(21),
    quantity: 1,
    status: "confirmed",
    kind: "goods_receipt",
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
        label: "Quantidade",
        invoice: String(invoice.quantity),
        po: String(purchaseOrder.quantity),
        gr: String(goodsReceipt.quantity),
        status: "match",
      },
      {
        label: "Valor bruto",
        invoice: formatBRL(invoice.grossAmount),
        po: formatBRL(purchaseOrder.totalAmount),
        status: "match",
      },
      {
        label: "Destinação",
        invoice: "Ativo imobilizado portuário",
        po: "Ativo imobilizado portuário",
        status: "match",
        note: "Enquadrado em REPORTO (Lei 11.033/2004) · ADE Receita Federal 217/2023",
      },
    ],
  };

  const retentions: Retention[] = [
    {
      kind: "ICMS",
      rate: 18,
      calculated: 432_000,
      declared: 432_000,
      status: "ok",
      scope: "highlighted",
      note: "SP→SP intraestadual · alíquota 18% · CST 00 (REPORTO não desonera ICMS)",
    },
    {
      kind: "IPI",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "ok",
      scope: "suspended",
      note: "Suspenso por REPORTO · CST IPI 55 · bem para ativo imobilizado portuário",
    },
    {
      kind: "PIS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "ok",
      scope: "suspended",
      note: "Alíquota zero · REPORTO art. 14 da Lei 11.033/04",
    },
    {
      kind: "COFINS",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "ok",
      scope: "suspended",
      note: "Alíquota zero · REPORTO art. 14 da Lei 11.033/04",
    },
    {
      kind: "ICMS-ST",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "highlighted",
      note: "NCM 8426 não consta do Protocolo ICMS-ST",
    },
    {
      kind: "IRRF",
      rate: 0,
      calculated: 0,
      declared: 0,
      status: "not_applicable",
      scope: "retained",
      note: "Venda de mercadoria não é hipótese de IRRF",
    },
  ];

  const decision: FinalDecision = {
    action: "POSTED",
    confidence: 96,
    summary: "Aprovação automática · REPORTO confirmado",
    justification:
      "Guindaste RTG-P450 destinado ao ativo imobilizado portuário — enquadramento REPORTO (Lei 11.033/2004) validado. PIS/COFINS/IPI suspensos corretamente aplicados pelo fornecedor. ICMS destacado a 18% (REPORTO não desonera ICMS estadual). PO, GR e valores conferem. Registro do benefício será enviado ao SPED Contribuições bloco M210/M610 com CST 49.",
    flags: [],
  };

  const steps: AgentStepResult[] = [
    {
      step: "intake",
      title: "Intake & Classificação",
      status: "success",
      summary: "Documento classificado como NFe · CFOP 5.101 · confiança 99%",
      payload: { detectedType: "NFe", confidence: 0.99, cfop: "5.101" },
    },
    {
      step: "extraction",
      title: "Extração Fiscal",
      status: "success",
      summary:
        "NCM 8426.41.00 extraída · CST IPI 55 (suspenso) · CST PIS/COFINS 49 (alíquota zero)",
      payload: {
        cnpj: invoice.supplier.cnpj,
        numero: invoice.number,
        valor: invoice.grossAmount,
        data: invoice.issueDate,
        chave: invoice.accessKey,
        ncm: "8426.41.00",
        cfop: "5.101",
      },
    },
    {
      step: "three_way_match",
      title: "3-Way Match",
      status: "success",
      summary: "NF × PO × GR — match · destinação como ativo imobilizado confirmada",
    },
    {
      step: "retentions",
      title: "Validação Tributária",
      status: "success",
      summary:
        "REPORTO: PIS/COFINS/IPI suspensos · ICMS 18% destacado corretamente (REPORTO não abrange ICMS)",
    },
    {
      step: "decision",
      title: "Decisão Final",
      status: "success",
      summary: "POSTED · 96% · benefício REPORTO confirmado",
    },
  ];

  return {
    key: "reporto",
    title: "Regime REPORTO — Aquisição de Bem Portuário",
    shortLabel: "REPORTO",
    description:
      "Guindaste portuário RTG R$ 2.400.000. Agente confirma enquadramento no REPORTO (Lei 11.033/2004) e valida suspensão de PIS/COFINS/IPI. ICMS mantido.",
    expectedStatus: "POSTED",
    expectedScore: 96,
    invoice,
    purchaseOrder,
    goodsReceipt,
    match,
    retentions,
    decision,
    steps,
    audit: defaultAudit("reporto", goodsReceipt.kind),
  };
}

function defaultAudit(key: string, kind: ReceiptKind): AuditEvent[] {
  const base = Date.now();
  const t = (offset: number) => new Date(base + offset).toISOString();
  const receiptLocated =
    kind === "service_entry"
      ? "SES localizada"
      : kind === "delivery_proof"
        ? "Canhoto de entrega confirmado"
        : "GR localizada";
  return [
    { timestamp: t(0), step: "intake", action: "Documento recebido", detail: key },
    { timestamp: t(120), step: "intake", action: "Classificação concluída" },
    { timestamp: t(620), step: "extraction", action: "Extração iniciada" },
    { timestamp: t(1450), step: "extraction", action: "Campos fiscais extraídos" },
    { timestamp: t(2100), step: "three_way_match", action: "Busca de PO no Oracle" },
    { timestamp: t(2600), step: "three_way_match", action: receiptLocated },
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
