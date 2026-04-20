import Anthropic from "@anthropic-ai/sdk";
import { logger } from "./logger";

const CLAUDE_MODEL = "claude-sonnet-4-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ausente no ambiente. Configure antes de chamar o cliente."
    );
  }
  client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 2 });
  return client;
}

export interface ClaudeCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  model: string;
}

export async function callClaude(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<ClaudeCallResult> {
  const started = Date.now();
  const { system, user, maxTokens = 600, temperature = 0.3 } = params;
  try {
    const resp = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = resp.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();
    return {
      text,
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
      latencyMs: Date.now() - started,
      model: CLAUDE_MODEL,
    };
  } catch (err) {
    logger.error({ err }, "Falha na chamada ao Claude");
    throw err;
  }
}

export { CLAUDE_MODEL };
