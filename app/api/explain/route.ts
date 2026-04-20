import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";
import { logger } from "@/lib/logger";
import type { FinalDecision, Invoice, ThreeWayMatchResult } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExplainBody {
  invoice: Invoice;
  match?: ThreeWayMatchResult;
  decision: FinalDecision;
}

export async function POST(req: NextRequest) {
  let body: ExplainBody;
  try {
    body = (await req.json()) as ExplainBody;
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400 }
    );
  }

  if (!body.invoice || !body.decision) {
    return NextResponse.json(
      { error: "invoice e decision são obrigatórios" },
      { status: 400 }
    );
  }

  const system =
    "Você é um analista financeiro sênior. Explique de forma executiva e objetiva (3 a 4 frases, em português do Brasil, sem jargão técnico) o que aconteceu com esta nota fiscal e por que o agente tomou a decisão indicada. Fale para um gestor que não é contador.";
  const user = [
    `Nota fiscal: ${body.invoice.type} ${body.invoice.number} — ${body.invoice.supplier.name}`,
    `Valor bruto: ${body.invoice.grossAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    body.match
      ? `3-way match: ${body.match.overall.toUpperCase()} (Δ ${body.match.amountDiffPct.toFixed(1)}%)`
      : "3-way match: não aplicável",
    `Decisão do agente: ${body.decision.action} · score ${body.decision.confidence}%`,
    body.decision.flags.length
      ? `Flags: ${body.decision.flags.join(", ")}`
      : "Sem flags.",
    "",
    "Escreva a explicação executiva agora.",
  ].join("\n");

  try {
    const result = await callClaude({
      system,
      user,
      maxTokens: 400,
      temperature: 0.4,
    });
    return NextResponse.json({
      explanation: result.text,
      model: result.model,
      latencyMs: result.latencyMs,
      tokens: {
        input: result.inputTokens,
        output: result.outputTokens,
      },
    });
  } catch (err) {
    logger.error({ err }, "Falha no /api/explain");
    return NextResponse.json(
      {
        error: "Falha ao gerar explicação",
        fallback:
          body.decision.justification ??
          "Explicação não disponível. Tente novamente em instantes.",
      },
      { status: 502 }
    );
  }
}
