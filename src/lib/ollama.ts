export type OllamaJsonResult<T> = {
  data: T;
  provider: "ollama" | "fallback";
  model: string;
  warning?: string;
};

const defaultModel = "gemma3:1b";
const defaultTimeoutMs = 15_000;

export async function generateOllamaJson<T>(
  systemPrompt: string,
  userPrompt: string,
  fallback: T
): Promise<OllamaJsonResult<T>> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL ?? defaultModel;
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? defaultTimeoutMs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : defaultTimeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { message?: { content?: string } };
    const content = payload.message?.content;
    if (!content) {
      throw new Error("Ollama response did not include message content.");
    }

    return {
      data: JSON.parse(content) as T,
      provider: "ollama",
      model
    };
  } catch (error) {
    const warning =
      error instanceof Error && error.name === "AbortError"
        ? `Ollama took longer than ${timeoutMs}ms, so GrantForge used the fast local template.`
        : error instanceof Error
          ? error.message
          : "Ollama generation failed.";

    return {
      data: fallback,
      provider: "fallback",
      model: "deterministic-template",
      warning
    };
  } finally {
    clearTimeout(timeout);
  }
}
