import type {
  ScriptGenerateInput,
  AIModifyRequest,
  StoryboardData,
  StoryboardShot,
} from "@/types";
import {
  buildScriptGenerationPrompt,
  buildModifyPrompt,
  buildStoryboardPrompt,
  buildModifyShotPrompt,
  parseScriptResponse,
  parseStoryboardResponse,
} from "./prompt-templates";

// ============================================
// AI API Client
// ============================================
interface AIConfig {
  apiKey: string;
  apiBase: string;
  modelName: string;
}

function buildUrl(apiBase: string, path: string): string {
  const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  return `${base}${path}`;
}

async function callAI(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<string> {
  const url = buildUrl(config.apiBase, "/chat/completions");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const tip = response.status === 404
      ? `\n\n请检查 API 地址：${url}`
      : response.status === 401
        ? "\n\nAPI Key 无效"
        : "";
    throw new Error(`AI API error (${response.status}): ${errorText.slice(0, 300)}${tip}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ============================================
// Streaming script generation
// ============================================
export async function* streamScriptGeneration(
  config: AIConfig,
  input: ScriptGenerateInput
): AsyncGenerator<{
  type: "chunk" | "done" | "error";
  content?: string;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const { system, user } = buildScriptGenerationPrompt(input);

  try {
    const url = buildUrl(config.apiBase, "/chat/completions");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      yield { type: "error", error: `AI API error (${response.status}): ${errorText.slice(0, 300)}` };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: "error", error: "No response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const dataStr = trimmed.slice(6);

        if (dataStr === "[DONE]") {
          try {
            const parsed = parseScriptResponse(fullContent);
            yield { type: "done", data: parsed as unknown as Record<string, unknown> };
          } catch (err) {
            yield {
              type: "error",
              error: `解析失败：${err instanceof Error ? err.message : ""}\n原始内容：${fullContent.slice(0, 300)}`,
            };
          }
          return;
        }

        try {
          const json = JSON.parse(dataStr);
          const content = json.choices?.[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            yield { type: "chunk", content };
          }
        } catch { /* skip malformed */ }
      }
    }

    // Stream ended without [DONE]
    try {
      const parsed = parseScriptResponse(fullContent);
      yield { type: "done", data: parsed as unknown as Record<string, unknown> };
    } catch (err) {
      yield {
        type: "error",
        error: `解析失败：${err instanceof Error ? err.message : ""}\n原始内容：${fullContent.slice(0, 300)}`,
      };
    }
  } catch (err) {
    yield { type: "error", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ============================================
// Quick segment modification (non-streaming)
// ============================================
export async function modifySegment(
  config: AIConfig,
  request: AIModifyRequest
): Promise<{ modifiedText: string; reason: string }> {
  const { system, user } = buildModifyPrompt(
    request.originalText,
    request.action,
    request.context
  );

  const content = await callAI(config, system, user, 1024);

  return {
    modifiedText: content.trim(),
    reason: "已按要求修改",
  };
}

// ============================================
// Storyboard generation
// ============================================
export async function generateStoryboard(
  config: AIConfig,
  scriptText: string,
  meta?: { contentType?: string; platform?: string; duration?: string; style?: string }
): Promise<StoryboardData> {
  const { system, user } = buildStoryboardPrompt(scriptText, meta);
  const content = await callAI(config, system, user, 2048);
  const { shots } = parseStoryboardResponse(content);

  return {
    shots,
    totalDuration: "0s",
    shotCount: shots.length,
  };
}

// ============================================
// Single shot modification
// ============================================
export async function modifyShot(
  config: AIConfig,
  shot: StoryboardShot,
  instruction: string
): Promise<Partial<StoryboardShot>> {
  const { system, user } = buildModifyShotPrompt(
    shot as unknown as Record<string, unknown>,
    instruction
  );
  const content = await callAI(config, system, user, 512);
  const parts = content.trim().split("|");

  return {
    duration: parts[0]?.trim(),
    shotSize: (parts[1]?.trim() || shot.shotSize) as StoryboardShot["shotSize"],
    cameraMovement: (parts[2]?.trim() || shot.cameraMovement) as StoryboardShot["cameraMovement"],
    visualDesc: parts[3]?.trim(),
    action: parts[4]?.trim(),
    dialogue: parts[5]?.trim(),
    scene: parts[6]?.trim(),
    props: parts[7]?.trim(),
    soundEffect: parts[8]?.trim(),
    notes: parts[9]?.trim(),
  };
}
