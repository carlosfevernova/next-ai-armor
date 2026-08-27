import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * Server-only Anthropic client factory. Reads `ANTHROPIC_API_KEY` from env at
 * first call and caches the client. If the env is missing the call throws — we
 * fail fast rather than silently returning an unusable client.
 */
export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing");
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * The default model for the demo. Swap once via env var so upgrades don't
 * require touching handlers.
 */
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
