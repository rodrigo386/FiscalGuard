import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { SCENARIOS, formatBRL } from "@/lib/scenarios";
import { callClaude, CLAUDE_MODEL } from "@/lib/anthropic";
import { logger } from "@/lib/logger";
import type {
  AgentStepKey,
  AgentStepResult,
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_DELAY = Number(process.env.DEMO_STEP_DELAY_MS ?? 1100);

interface RequestShape {
  scenario: ScenarioKey;
  autonomyMode: AutonomyMode;
  fileName?: string;
  fileMime?: string;
  fileText?: string;
  poFileName?: string;
  poFileText?: string;
}

async function extractFileText(file: File): Promise<string> {
  const mime = file.type;
  const name = file.name.toLowerCase();
  if (mime.includes("xml") || name.endsWith(".xml")) {
    const text = await file.text();
    logger.info(
      { file: file.name, size: file.size, extractedChars: text.length },
      "XML extraído"
    );
    return text;
  }
  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      // Importa direto de lib/pdf-parse.js para evitar o bloco de debug do
      // index.js de pdf-parse@1.1.1 que tenta ler um PDF de teste inexistente
      // em produção (ENOENT).
      const mod = await import("pdf-parse/lib/pdf-parse.js");
      const pdfParse = mod.default ?? (mod as unknown as typeof mod.default);
      const result = await pdfParse(buffer);
      const text = result.text?.trim() ?? "";
      logger.info(
        {
          file: file.name,
          size: file.size,
          pages: result.numpages,
          extractedChars: text.length,
          preview: text.slice(0, 120),
        },
        "PDF extraído"
      );
      if (!text) {
        return `(PDF sem camada de texto extraível — ${file.name}, ${file.size} bytes · provavelmente imagem escaneada. Sugestão: aplicar OCR antes de enviar.)`;
      }
      return text.length > 20_000 ? text.slice(0, 20_000) : text;
    } catch (err) {
      logger.error(
        { err, name: file.name, stack: (err as Error)?.stack },
        "Falha ao parsear PDF"
      );
      return `(falha ao parsear PDF ${file.name}: ${(err as Error).message})`;
    }
  }
  try {
    return await file.text();
  } catch {
    return `(conteúdo binário não extraído — ${file.name}, ${file.size} bytes)`;
  }
}

export async function POST(req: NextRequest) {
  const runId = randomUUID();
  let input: RequestShape;

  try {
    input = await parseRequest(req);
  } catch (err) {
    logger.warn({ err }, "Falha ao parse da requisição de processamento");
    return NextResponse.json(
      { error: "Formato de requisição inválido" },
      { status: 400 }
    );
  }

  logger.info(
    { runId, scenario: input.scenario, autonomyMode: input.autonomyMode },
    "Iniciando processamento"
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        if (input.scenario === "custom") {
          await runCustomPipeline({ runId, input, emit });
        } else {
          await runScenarioPipeline({ runId, input, emit });
        }

        emit({ type: "done", payload: { runId } });
        logger.info({ runId }, "Processamento concluído");
      } catch (err) {
        logger.error({ err, runId }, "Erro no pipeline");
        const message =
          err instanceof Error
            ? err.message
            : "Erro inesperado no processamento";
        emit({ type: "error", payload: { message } });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function parseRequest(req: NextRequest): Promise<RequestShape> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const scenario = (form.get("scenario") as ScenarioKey) ?? "custom";
    const autonomyMode =
      (form.get("autonomyMode") as AutonomyMode) ?? "score_based";
    const file = form.get("file");
    const poFile = form.get("poFile");
    let fileName: string | undefined;
    let fileMime: string | undefined;
    let fileText: string | undefined;
    let poFileName: string | undefined;
    let poFileText: string | undefined;
    if (file instanceof File) {
      fileName = file.name;
      fileMime = file.type;
      fileText = await extractFileText(file);
    }
    if (poFile instanceof File) {
      poFileName = poFile.name;
      poFileText = await extractFileText(poFile);
    }
    return {
      scenario,
      autonomyMode,
      fileName,
      fileMime,
      fileText,
      poFileName,
      poFileText,
    };
  }
  const body = await req.json();
  return {
    scenario: (body.scenario ?? "happy") as ScenarioKey,
    autonomyMode: (body.autonomyMode ?? "score_based") as AutonomyMode,
  };
}

/* ------------------------------ mocked pipeline ------------------------------ */

async function runScenarioPipeline({
  runId,
  input,
  emit,
}: {
  runId: string;
  input: RequestShape;
  emit: (event: SSEEvent) => void;
}) {
  const bundle = SCENARIOS[input.scenario as Exclude<ScenarioKey, "custom">];
  if (!bundle) throw new Error(`Cenário desconhecido: ${input.scenario}`);

  emit({ type: "invoice", payload: bundle.invoice });
  emit({ type: "po", payload: bundle.purchaseOrder });
  emit({ type: "gr", payload: bundle.goodsReceipt });

  for (const event of bundle.audit) {
    emit({ type: "audit", payload: event });
  }

  const stepsByKey = new Map(bundle.steps.map((s) => [s.step, s]));

  // 1. intake
  await runStep({
    emit,
    stepsByKey,
    key: "intake",
    beforeFinish: async () => {},
  });

  // 2. extraction
  await runStep({
    emit,
    stepsByKey,
    key: "extraction",
  });

  // 3. three_way_match
  await runStep({
    emit,
    stepsByKey,
    key: "three_way_match",
    beforeFinish: async () => {
      emit({ type: "match", payload: bundle.match });
    },
  });

  // 4. retentions
  await runStep({
    emit,
    stepsByKey,
    key: "retentions",
    beforeFinish: async () => {
      emit({ type: "retentions", payload: bundle.retentions });
    },
  });

  // 5. decision with real Claude justification
  await runStep({
    emit,
    stepsByKey,
    key: "decision",
    beforeFinish: async () => {
      const finalDecision = await generateFinalDecision({
        bundle,
        emit,
        autonomyMode: input.autonomyMode,
      });
      emit({ type: "decision", payload: finalDecision });
    },
  });

  emit({
    type: "audit",
    payload: {
      timestamp: new Date().toISOString(),
      step: "decision",
      action: "Run finalizada",
      detail: `runId=${runId}`,
    },
  });
}

async function runStep({
  emit,
  stepsByKey,
  key,
  beforeFinish,
}: {
  emit: (event: SSEEvent) => void;
  stepsByKey: Map<AgentStepKey, AgentStepResult>;
  key: AgentStepKey;
  beforeFinish?: () => Promise<void>;
}) {
  const target = stepsByKey.get(key);
  if (!target) return;

  emit({
    type: "step",
    payload: { ...target, status: "processing" },
  });
  await delay(jitter(DEFAULT_DELAY));
  if (beforeFinish) await beforeFinish();
  emit({
    type: "step",
    payload: { ...target, finishedAt: new Date().toISOString() },
  });
  emit({
    type: "audit",
    payload: {
      timestamp: new Date().toISOString(),
      step: key,
      action: `Etapa ${key} concluída`,
      detail: target.summary,
    },
  });
}

async function generateFinalDecision({
  bundle,
  emit,
  autonomyMode,
}: {
  bundle: (typeof SCENARIOS)[keyof typeof SCENARIOS];
  emit: (event: SSEEvent) => void;
  autonomyMode: AutonomyMode;
}): Promise<FinalDecision> {
  const baseDecision = bundle.decision;
  const modeHint = describeMode(autonomyMode);
  const system =
    "Você é um analista sênior de contas a pagar. Sua tarefa é explicar, em português brasileiro objetivo, a decisão tomada por um agente autônomo sobre uma nota fiscal. Responda em 2 a 3 frases curtas, sem jargão técnico, destacando o motivo central da decisão.";
  const user = buildDecisionPrompt({ bundle, autonomyMode });

  try {
    const result = await callClaude({ system, user, maxTokens: 400 });
    const trace: ClaudeTrace = {
      step: "decision",
      model: result.model,
      promptPreview: user.slice(0, 600),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
      simulated: false,
    };
    emit({ type: "trace", payload: trace });
    return {
      ...baseDecision,
      justification: result.text || baseDecision.justification,
      summary:
        autonomyMode === "hitl_strong" && baseDecision.action === "POSTED"
          ? "Sugerido — aprovação final com analista"
          : baseDecision.summary,
    };
  } catch (err) {
    logger.warn({ err }, "Falha Claude — usando justificativa determinística");
    const trace: ClaudeTrace = {
      step: "decision",
      model: CLAUDE_MODEL,
      promptPreview: user.slice(0, 600),
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      simulated: true,
    };
    emit({ type: "trace", payload: trace });
    return {
      ...baseDecision,
      justification:
        baseDecision.justification +
        ` (modo: ${modeHint} — fallback sem chamada Claude)`,
    };
  }
}

function buildDecisionPrompt({
  bundle,
  autonomyMode,
}: {
  bundle: (typeof SCENARIOS)[keyof typeof SCENARIOS];
  autonomyMode: AutonomyMode;
}): string {
  const flagsLine = bundle.decision.flags.length
    ? `Flags levantadas: ${bundle.decision.flags.join(", ")}`
    : "Nenhuma flag levantada.";
  const retentionDiffs = bundle.retentions
    .filter((r) => r.status === "mismatch")
    .map(
      (r) =>
        `${r.kind} calculado ${formatBRL(r.calculated)} vs declarado ${formatBRL(
          r.declared
        )}`
    )
    .join("; ");

  return [
    `Nota fiscal: ${bundle.invoice.type} ${bundle.invoice.number}`,
    `Fornecedor: ${bundle.invoice.supplier.name} (CNPJ ${bundle.invoice.supplier.cnpj})`,
    `Valor bruto: ${formatBRL(bundle.invoice.grossAmount)}`,
    `3-way match: ${bundle.match.overall.toUpperCase()} — diferença de valor ${bundle.match.amountDiffPct.toFixed(1)}%`,
    `Retenções divergentes: ${retentionDiffs || "nenhuma"}`,
    `Score consolidado: ${bundle.decision.confidence}%`,
    `Ação tomada: ${bundle.decision.action}`,
    `Modo de autonomia escolhido: ${describeMode(autonomyMode)}`,
    flagsLine,
    "",
    "Escreva em português uma explicação curta (2-3 frases) para o analista financeiro que vai receber esta decisão. Foque no motivo central e, se for HUMAN_REVIEW, diga exatamente o que ele precisa verificar.",
  ].join("\n");
}

function describeMode(mode: AutonomyMode): string {
  switch (mode) {
    case "hitl_strong":
      return "HITL Forte (toda decisão passa pelo analista)";
    case "full_autonomous":
      return "Full Autonomous (agente decide sozinho)";
    default:
      return "Score-Based (aprova automaticamente ≥ 95%)";
  }
}

/* ------------------------------ custom pipeline ------------------------------ */

async function runCustomPipeline({
  runId,
  input,
  emit,
}: {
  runId: string;
  input: RequestShape;
  emit: (event: SSEEvent) => void;
}) {
  emit({
    type: "audit",
    payload: {
      timestamp: new Date().toISOString(),
      step: "system",
      action: "Processamento customizado iniciado",
      detail: input.fileName ?? "arquivo anônimo",
    },
  });

  const rawTextLen = input.fileText?.length ?? 0;
  const rawTextIsError = (input.fileText ?? "").startsWith("(");
  emit({
    type: "audit",
    payload: {
      timestamp: new Date().toISOString(),
      step: "intake",
      action: rawTextIsError
        ? "Falha ao extrair texto do arquivo"
        : `Texto bruto do arquivo: ${rawTextLen} caracteres`,
      detail: rawTextIsError
        ? input.fileText
        : (input.fileText ?? "").slice(0, 160).replace(/\s+/g, " "),
    },
  });
  if (input.poFileText) {
    const poTextLen = input.poFileText.length;
    const poIsError = input.poFileText.startsWith("(");
    emit({
      type: "audit",
      payload: {
        timestamp: new Date().toISOString(),
        step: "intake",
        action: poIsError
          ? "Falha ao extrair texto da PO"
          : `Texto bruto da PO: ${poTextLen} caracteres`,
        detail: poIsError
          ? input.poFileText
          : input.poFileText.slice(0, 160).replace(/\s+/g, " "),
      },
    });
  }

  // 1. Intake
  emit({
    type: "step",
    payload: {
      step: "intake",
      title: "Intake & Classificação",
      status: "processing",
    },
  });
  await delay(jitter(800));
  const detected = detectType(input.fileName, input.fileText);
  emit({
    type: "step",
    payload: {
      step: "intake",
      title: "Intake & Classificação",
      status: "success",
      summary: `Documento classificado como ${detected} · (classificação heurística na demo)`,
      payload: { detectedType: detected },
    },
  });

  // 2. Extraction via Claude
  emit({
    type: "step",
    payload: {
      step: "extraction",
      title: "Extração Fiscal",
      status: "processing",
    },
  });

  let extractedInvoice: Invoice;
  let extractionTrace: ClaudeTrace;
  try {
    const { invoice, trace } = await extractInvoiceViaClaude(input, detected);
    extractedInvoice = invoice;
    extractionTrace = trace;
  } catch (err) {
    logger.error({ err }, "Falha extração via Claude — usando fallback");
    extractedInvoice = buildFallbackInvoice(input, detected);
    extractionTrace = {
      step: "extraction",
      model: CLAUDE_MODEL,
      promptPreview: "(chamada falhou — dados simulados na demo)",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      simulated: true,
    };
  }

  emit({ type: "invoice", payload: extractedInvoice });
  emit({ type: "trace", payload: extractionTrace });
  const extractionOk =
    extractedInvoice.grossAmount > 0 &&
    extractedInvoice.supplier.cnpj !== "—" &&
    !rawTextIsError;
  emit({
    type: "step",
    payload: {
      step: "extraction",
      title: "Extração Fiscal",
      status: extractionOk ? "success" : "warning",
      summary: extractionOk
        ? `Campos extraídos via Claude Sonnet${extractionTrace.simulated ? " (simulado na demo)" : ""}`
        : rawTextIsError
          ? "Não foi possível ler o arquivo enviado — veja detalhe no log técnico"
          : "Claude não conseguiu estruturar os dados fiscais do arquivo",
      warning: extractionOk
        ? undefined
        : "Extração incompleta — confira se o PDF tem camada de texto (não é imagem escaneada) e se o arquivo não está criptografado",
      payload: extractedInvoice as unknown as Record<string, unknown>,
    },
  });

  // 3. 3-way match — real se PO enviada, pulado se não
  const hasPO = !!input.poFileText;
  let po: PurchaseOrder | null = null;
  let match: ThreeWayMatchResult | null = null;

  if (hasPO) {
    emit({
      type: "step",
      payload: {
        step: "three_way_match",
        title: "3-Way Match",
        status: "processing",
      },
    });
    try {
      const extractedPO = await extractPOViaClaude(input, extractedInvoice);
      po = extractedPO.po;
      emit({ type: "trace", payload: extractedPO.trace });
      emit({ type: "po", payload: po });

      const gr = simulateGR(extractedInvoice);
      emit({ type: "gr", payload: gr });

      match = simulateMatch(extractedInvoice, po);
      emit({ type: "match", payload: match });
      emit({
        type: "step",
        payload: {
          step: "three_way_match",
          title: "3-Way Match",
          status: match.overall === "pass" ? "success" : "warning",
          summary: `PO extraída do documento enviado · divergência ${match.amountDiffPct.toFixed(1)}% · GR simulado (integração Oracle não conectada)`,
          warning:
            match.overall === "fail"
              ? `Divergência de ${match.amountDiffPct.toFixed(1)}% acima da tolerância de 2%`
              : undefined,
        },
      });
    } catch (err) {
      logger.error({ err }, "Falha na extração da PO via Claude");
      emit({
        type: "step",
        payload: {
          step: "three_way_match",
          title: "3-Way Match",
          status: "warning",
          summary: "Não foi possível extrair a PO enviada",
          warning: (err as Error).message,
        },
      });
    }
  } else {
    emit({
      type: "step",
      payload: {
        step: "three_way_match",
        title: "3-Way Match",
        status: "success",
        summary:
          "Etapa pulada — PO não enviada · análise segue apenas com extração fiscal e validação tributária",
      },
    });
  }

  // 4. Validação Tributária (heurística)
  emit({
    type: "step",
    payload: {
      step: "retentions",
      title: "Validação Tributária",
      status: "processing",
    },
  });
  await delay(jitter(900));
  const retentions = simulateRetentions(extractedInvoice);
  emit({ type: "retentions", payload: retentions });
  emit({
    type: "step",
    payload: {
      step: "retentions",
      title: "Validação Tributária",
      status: "success",
      summary: "Tributos calculados heuristicamente a partir da extração · tabela oficial por município/NCM não integrada na demo",
    },
  });

  // 5. Decision via Claude
  emit({
    type: "step",
    payload: {
      step: "decision",
      title: "Decisão Final",
      status: "processing",
    },
  });
  const { decision, trace: decisionTrace } = await decideCustom({
    invoice: extractedInvoice,
    po,
    match,
    autonomyMode: input.autonomyMode,
    hasPO,
  });
  emit({ type: "trace", payload: decisionTrace });
  emit({ type: "decision", payload: decision });
  emit({
    type: "step",
    payload: {
      step: "decision",
      title: "Decisão Final",
      status: decision.action === "POSTED" ? "success" : "warning",
      summary: `${decision.action} · ${decision.confidence}%${hasPO ? "" : " · sem 3-way match"}`,
    },
  });

  emit({
    type: "audit",
    payload: {
      timestamp: new Date().toISOString(),
      step: "system",
      action: "Run customizada finalizada",
      detail: `runId=${runId}`,
    },
  });
}

async function extractInvoiceViaClaude(
  input: RequestShape,
  detected: Invoice["type"]
): Promise<{ invoice: Invoice; trace: ClaudeTrace }> {
  const system =
    "Você é um extrator de dados fiscais brasileiros. Responda APENAS um objeto JSON (sem texto adicional, sem markdown). Preencha campos ausentes com null.";
  const user = [
    "Extraia do documento abaixo os campos fiscais em JSON com as chaves:",
    "{ cnpj, numero, valor, data, chaveAcesso, fornecedor, cidade, uf, descricao, codigoServico }",
    `Tipo provável: ${detected}`,
    "",
    "Conteúdo:",
    (input.fileText ?? "").slice(0, 8000),
  ].join("\n");
  const result = await callClaude({
    system,
    user,
    maxTokens: 800,
    temperature: 0.1,
  });

  const json = tryParseJson(result.text);
  const invoice: Invoice = {
    id: `custom-${Date.now()}`,
    type: detected,
    number: json?.numero ?? "—",
    accessKey: json?.chaveAcesso ?? undefined,
    issueDate: json?.data ?? new Date().toISOString(),
    supplier: {
      name: json?.fornecedor ?? "Fornecedor não identificado",
      cnpj: json?.cnpj ?? "—",
    },
    description: json?.descricao ?? input.fileName ?? "Documento enviado",
    grossAmount: Number(json?.valor ?? 0) || 0,
    city: json?.cidade ?? undefined,
    stateCode: json?.uf ?? undefined,
    serviceCode: json?.codigoServico ?? undefined,
  };
  const trace: ClaudeTrace = {
    step: "extraction",
    model: result.model,
    promptPreview: user.slice(0, 600),
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: result.latencyMs,
    simulated: false,
  };
  return { invoice, trace };
}

async function extractPOViaClaude(
  input: RequestShape,
  invoice: Invoice
): Promise<{ po: PurchaseOrder; trace: ClaudeTrace }> {
  const system =
    "Você é um extrator de dados de purchase orders (pedidos de compra) brasileiros. Responda APENAS um objeto JSON (sem texto adicional, sem markdown). Preencha campos ausentes com null.";
  const user = [
    "Extraia do documento de PO abaixo os campos em JSON com as chaves:",
    "{ numero, cnpjFornecedor, valorTotal, quantidade, precoUnitario, toleranciaPct }",
    `A nota fiscal associada tem valor bruto ${formatBRL(invoice.grossAmount)} e fornecedor ${invoice.supplier.name} (CNPJ ${invoice.supplier.cnpj}).`,
    "",
    "Conteúdo da PO:",
    (input.poFileText ?? "").slice(0, 8000),
  ].join("\n");

  const result = await callClaude({
    system,
    user,
    maxTokens: 600,
    temperature: 0.1,
  });
  const json = tryParseJson(result.text) as
    | {
        numero?: string;
        cnpjFornecedor?: string;
        valorTotal?: number | string;
        quantidade?: number | string;
        precoUnitario?: number | string;
        toleranciaPct?: number | string;
      }
    | null;

  const po: PurchaseOrder = {
    id: `po-ext-${Date.now()}`,
    number: json?.numero?.toString() ?? `PO-CUSTOM-${Date.now().toString().slice(-6)}`,
    supplierCnpj:
      json?.cnpjFornecedor?.toString() ?? invoice.supplier.cnpj ?? "—",
    totalAmount: Number(json?.valorTotal ?? invoice.grossAmount) || invoice.grossAmount,
    quantity: json?.quantidade ? Number(json.quantidade) : undefined,
    unitPrice: json?.precoUnitario ? Number(json.precoUnitario) : undefined,
    toleranceBps: json?.toleranciaPct ? Number(json.toleranciaPct) * 100 : 200,
  };

  return {
    po,
    trace: {
      step: "three_way_match",
      model: result.model,
      promptPreview: user.slice(0, 600),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
      simulated: false,
    },
  };
}

async function decideCustom({
  invoice,
  po,
  match,
  autonomyMode,
  hasPO,
}: {
  invoice: Invoice;
  po: PurchaseOrder | null;
  match: ThreeWayMatchResult | null;
  autonomyMode: AutonomyMode;
  hasPO: boolean;
}): Promise<{ decision: FinalDecision; trace: ClaudeTrace }> {
  const system =
    "Você é um analista sênior de contas a pagar. Explique em português (2-3 frases) a decisão sobre a nota fiscal com base nos dados fornecidos. Sem jargão técnico. Se houver divergência, diga o que o analista deve verificar. Se o 3-way match foi pulado (PO ausente), deixe claro que a aprovação é parcial e depende de confirmação do pedido.";

  const contextLines = [
    `Nota ${invoice.type} ${invoice.number} — ${invoice.supplier.name}`,
    `Valor: ${formatBRL(invoice.grossAmount)}`,
    `Modo: ${describeMode(autonomyMode)}`,
  ];
  if (hasPO && po && match) {
    contextLines.push(
      `PO extraída: ${po.number} · ${formatBRL(po.totalAmount)} (tolerância 2%)`,
      `Diferença: ${match.amountDiffPct.toFixed(1)}%`
    );
  } else {
    contextLines.push(
      "3-way match: não realizado (PO não enviada pelo usuário)",
      "Análise restrita à extração fiscal e validação tributária"
    );
  }
  contextLines.push("", "Escreva a explicação executiva.");
  const user = contextLines.join("\n");

  let action: FinalDecision["action"];
  let confidence: number;
  let flags: string[];

  if (!hasPO) {
    action = "HUMAN_REVIEW";
    confidence = 65;
    flags = ["match.po.missing"];
  } else if (match && match.overall === "fail") {
    action = "HUMAN_REVIEW";
    confidence = 78;
    flags = ["match.amount.diff"];
  } else {
    action = "POSTED";
    confidence = 93;
    flags = [];
  }

  try {
    const result = await callClaude({
      system,
      user,
      maxTokens: 350,
      temperature: 0.4,
    });
    const fallbackSummary =
      action === "POSTED"
        ? "Aprovação automática"
        : hasPO
          ? "Revisão humana — divergência 3-way match"
          : "Revisão humana — PO não enviada";
    return {
      decision: {
        action,
        confidence,
        summary: fallbackSummary,
        justification:
          result.text ||
          "Documento processado. Dados fiscais extraídos via Claude e tributos calculados heuristicamente.",
        flags,
      },
      trace: {
        step: "decision",
        model: result.model,
        promptPreview: user.slice(0, 600),
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: result.latencyMs,
        simulated: false,
      },
    };
  } catch (err) {
    logger.warn({ err }, "Falha Claude na decisão — fallback");
    return {
      decision: {
        action,
        confidence,
        summary: action === "POSTED" ? "Aprovação automática (simulada)" : "Revisão humana",
        justification:
          "Documento processado com dados simulados na demo (fallback sem chamada Claude).",
        flags: ["custom.fallback"],
      },
      trace: {
        step: "decision",
        model: CLAUDE_MODEL,
        promptPreview: user.slice(0, 600),
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        simulated: true,
      },
    };
  }
}

function detectType(
  fileName?: string,
  fileText?: string
): Invoice["type"] {
  const name = (fileName ?? "").toLowerCase();
  const text = (fileText ?? "").toLowerCase();
  if (name.includes("nfse") || text.includes("<nfse")) return "NFSe";
  if (name.includes("cte") || text.includes("<cte")) return "CTe";
  if (name.includes("nfe") || text.includes("<nfe")) return "NFe";
  return "NFe";
}

function buildFallbackInvoice(
  input: RequestShape,
  detected: Invoice["type"]
): Invoice {
  return {
    id: `custom-${Date.now()}`,
    type: detected,
    number: "—",
    issueDate: new Date().toISOString(),
    supplier: {
      name: "Fornecedor não identificado (simulado)",
      cnpj: "00.000.000/0000-00",
    },
    description: input.fileName ?? "Documento enviado",
    grossAmount: 10000,
  };
}

function simulateGR(invoice: Invoice): GoodsReceipt {
  const suffix = String(Math.floor(Math.random() * 9000 + 1000));
  if (invoice.type === "NFSe") {
    return {
      id: `ses-sim-${Date.now()}`,
      number: `SES-SIM-${suffix}`,
      confirmedAt: invoice.issueDate,
      status: "confirmed",
      kind: "service_entry",
    };
  }
  if (invoice.type === "CTe") {
    return {
      id: `ce-sim-${Date.now()}`,
      number: `CE-SIM-${suffix}`,
      confirmedAt: invoice.issueDate,
      status: "confirmed",
      kind: "delivery_proof",
    };
  }
  return {
    id: `gr-sim-${Date.now()}`,
    number: `GR-SIM-${suffix}`,
    confirmedAt: invoice.issueDate,
    status: "confirmed",
    kind: "goods_receipt",
  };
}

function simulateMatch(
  invoice: Invoice,
  po: PurchaseOrder
): ThreeWayMatchResult {
  const diffPct = po.totalAmount
    ? ((invoice.grossAmount - po.totalAmount) / po.totalAmount) * 100
    : 0;
  const overall = Math.abs(diffPct) > 2 ? "fail" : "pass";
  return {
    overall,
    amountDiffPct: Number(diffPct.toFixed(2)),
    fields: [
      {
        label: "CNPJ fornecedor",
        invoice: invoice.supplier.cnpj,
        po: po.supplierCnpj,
        status: "match",
      },
      {
        label: "Valor bruto",
        invoice: formatBRL(invoice.grossAmount),
        po: formatBRL(po.totalAmount),
        status: Math.abs(diffPct) > 2 ? "mismatch" : "match",
        note: `Δ ${diffPct.toFixed(1)}% (PO simulada na demo)`,
      },
    ],
  };
}

function simulateRetentions(invoice: Invoice): Retention[] {
  const base = invoice.grossAmount;
  return [
    {
      kind: "ISS",
      rate: 5,
      calculated: round2(base * 0.05),
      declared: round2(base * 0.05),
      status: "ok",
      note: "Alíquota simulada na demo (5%)",
    },
    {
      kind: "IRRF",
      rate: 1.5,
      calculated: round2(base * 0.015),
      declared: round2(base * 0.015),
      status: "ok",
    },
    {
      kind: "PIS",
      rate: 0.65,
      calculated: round2(base * 0.0065),
      declared: round2(base * 0.0065),
      status: "ok",
    },
    {
      kind: "COFINS",
      rate: 3,
      calculated: round2(base * 0.03),
      declared: round2(base * 0.03),
      status: "ok",
    },
    {
      kind: "CSLL",
      rate: 1,
      calculated: round2(base * 0.01),
      declared: round2(base * 0.01),
      status: "ok",
    },
  ];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface ExtractedJson {
  cnpj?: string;
  numero?: string;
  valor?: number | string;
  data?: string;
  chaveAcesso?: string;
  fornecedor?: string;
  cidade?: string;
  uf?: string;
  descricao?: string;
  codigoServico?: string;
}

function tryParseJson(raw: string): ExtractedJson | null {
  if (!raw) return null;
  try {
    const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
    return JSON.parse(trimmed) as ExtractedJson;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as ExtractedJson;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function jitter(base: number): number {
  const delta = Math.round(base * 0.3);
  return base + (Math.random() * delta * 2 - delta);
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, Math.max(200, ms)));
}
