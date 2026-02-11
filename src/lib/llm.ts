import { getUserApiKeyWithMeta } from "./user-api-keys";

// OpenAI-compatible message format (supports text + vision)
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<LLMContentPart>;
}

export type LLMContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface LLMOptions {
  max_tokens?: number;
  temperature?: number;
  /** When true and userId is set, only use the user's API key; do not fall back to OPENAI_API_KEY. */
  requireUserKey?: boolean;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o";

/**
 * Unified LLM call — works with OpenAI, OpenRouter, Together, Groq, Ollama, etc.
 * All use the same POST /chat/completions format.
 *
 * @param userId  – null is allowed; skips DB lookup and uses env fallback only.
 * @param messages – standard chat messages (supports vision via image_url parts).
 * @param options  – max_tokens, temperature, etc.
 * @returns        – the text content of the first choice.
 */
export async function callLLM(
  userId: string | null,
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  let apiKey: string | null = null;
  let baseUrl = DEFAULT_BASE_URL;
  let model = DEFAULT_MODEL;

  const { requireUserKey = false, ...apiOptions } = options;

  // Try per-user config first
  if (userId) {
    const config = await getUserApiKeyWithMeta(userId, "llm");
    if (config.key) {
      apiKey = config.key;
      baseUrl = config.metadata?.base_url || DEFAULT_BASE_URL;
      model = config.metadata?.model || DEFAULT_MODEL;
    }
  }

  // Env fallback only when not requiring user key (e.g. AI Writer must use user's key)
  if (!apiKey && !requireUserKey) {
    apiKey = process.env.OPENAI_API_KEY || null;
  }

  if (!apiKey) {
    if (requireUserKey && userId) {
      throw new Error(
        "No AI key configured. Add your API key in Settings → API Keys (AI Model / LLM) to use AI generation."
      );
    }
    throw new Error(
      "No AI key configured. Add one in Settings → AI Model, or set OPENAI_API_KEY env."
    );
  }

  const url = baseUrl.replace(/\/+$/, "") + "/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      ...apiOptions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Log token usage (all OpenAI-compatible APIs return this)
  if (data.usage) {
    console.log("[LLM] usage", {
      model,
      prompt_tokens: data.usage.prompt_tokens,
      completion_tokens: data.usage.completion_tokens,
      total_tokens: data.usage.total_tokens,
    });
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response from LLM API");
  }

  return content as string;
}
