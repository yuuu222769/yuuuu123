import type { AIAction, ScriptGenerateInput } from "@/types";
import { CONTENT_TYPES, PLATFORMS } from "@/types";

// ============================================
// Script Generation Prompt (Text markers — fast)
// ============================================
export function buildScriptGenerationPrompt(input: ScriptGenerateInput): {
  system: string;
  user: string;
} {
  const contentType = CONTENT_TYPES.find((t) => t.value === input.contentType)?.label || input.contentType;
  const platform = PLATFORMS.find((p) => p.value === input.platform)?.label || input.platform;

  const system = `你是专业短视频编导。严格按以下格式输出脚本（使用英文半角方括号 [ ]）：

[TITLE]
视频标题

[HOOK]
开头钩子一句话

[SEGMENT hook]
开场段落内容写在这里
[/SEGMENT]

[SEGMENT body]
正文段落内容写在这里
[/SEGMENT]

[SEGMENT cta]
结尾号召写在这里
[/SEGMENT]

规则：
- 风格${input.style || "轻松自然"}，受众${input.targetAudience || "广泛人群"}
- ${contentType}，${platform}平台，约${input.duration || "60秒"}
- 口语化，像真人聊天
- 开头3秒必须抓人`;

  let user = `主题：${input.topic}`;

  if (input.reference) {
    user += `\n参考：${input.reference}`;
  }
  if (input.projectContext?.name) {
    user += `\n项目：${input.projectContext.name}`;
  }
  if (input.knowledgeContext) {
    user += `\n知识库资料（必须遵守）：\n${input.knowledgeContext}`;
  }

  return { system, user };
}

// ============================================
// Parse text-marked script into structured data
// Handles both [TAG] and 「TAG」 formats
// ============================================
export function parseScriptResponse(text: string) {
  // Normalize: convert full-width brackets to half-width
  let normalized = text
    .replace(/「/g, "[")
    .replace(/」/g, "]")
    .replace(/『/g, "[")
    .replace(/』/g, "]");

  function extract(tag: string): string {
    const re = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[|$)`, "i");
    const m = normalized.match(re);
    return m ? m[1].trim() : "";
  }

  function extractBlock(tag: string): string {
    const m = normalized.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[/${tag}\\]`, "i"));
    return m ? m[1].trim() : "";
  }

  function extractAllBlocks(tag: string): string[] {
    const results: string[] = [];
    // Try [/TAG] closing first
    const re = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[/${tag}\\]`, "gi");
    let m;
    while ((m = re.exec(normalized)) !== null) {
      results.push(m[1].trim());
    }
    return results;
  }

  function extractAllWithRole(): { role: string; content: string }[] {
    const results: { role: string; content: string }[] = [];
    // Pattern: [SEGMENT role]content[/SEGMENT] or [SEGMENT]content[/SEGMENT]
    const re = /\[SEGMENT(?:\s+(\w+))?\]([\s\S]*?)\[\/SEGMENT\]/gi;
    let m;
    while ((m = re.exec(normalized)) !== null) {
      results.push({ role: m[1]?.toLowerCase() || "body", content: m[2].trim() });
    }
    return results;
  }

  const title = extract("TITLE") || "未命名脚本";
  const hook = extract("HOOK") || "";

  // Try [/SEGMENT] blocks first, then fallback
  let segmentData = extractAllWithRole();

  // If no [/SEGMENT] blocks, split by [SEGMENT] markers
  if (segmentData.length === 0) {
    const parts = normalized.split(/\[SEGMENT(?:\s+\w+)?\]/gi).filter(Boolean);
    if (parts.length > 0) {
      // First part before any SEGMENT is the title/hook area
      segmentData = parts.map((content, i) => ({
        role: i === 0 ? "hook" : i === parts.length - 1 ? "cta" : "body",
        content: content.trim(),
      }));
    }
  }

  // If still nothing, treat entire text as one body segment
  if (segmentData.length === 0) {
    // Split by double newlines as paragraph separators
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
    if (paragraphs.length > 0) {
      segmentData = paragraphs.map((content, i) => ({
        role: i === 0 ? "hook" : i === paragraphs.length - 1 ? "cta" : "body",
        content: content.replace(/[\n\r]+/g, " ").trim(),
      }));
    } else {
      segmentData = [{ role: "body", content: text.trim() || "（等待生成…）" }];
    }
  }

  const segments = segmentData.map((d, i) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `seg-${i}-${Date.now()}`,
    index: i,
    role: d.role as "hook" | "body" | "cta",
    content: d.content,
  }));

  // Parse structure
  const structureText = extractBlock("STRUCTURE") || "";
  const structureLines = structureText.split("\n").filter(Boolean);
  const sections = structureLines.length > 0
    ? structureLines.map((line) => {
        const parts = line.match(/^(.+?)\((.+?)\):\s*(.+)$/);
        return {
          label: parts?.[1]?.trim() || line.slice(0, 10),
          duration: parts?.[2]?.trim() || "",
          description: parts?.[3]?.trim() || "",
        };
      })
    : [{ label: "完整视频", duration: "", description: "" }];

  // Parse rhythm
  const rhythmText = extractBlock("RHYTHM") || "";
  const rhythmPoints = rhythmText
    .split(/→|->|→/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^(\S+)\s*(\S+)\s*(.+)/);
      return {
        position: m?.[1] || "0s",
        emotion: m?.[3]?.trim() || m?.[2] || p,
        icon: m?.[2] || "",
      };
    });

  if (rhythmPoints.length === 0) {
    rhythmPoints.push(
      { position: "0s", emotion: "开场", icon: "🎬" },
      { position: "中段", emotion: "高潮", icon: "🔥" },
      { position: "结尾", emotion: "收尾", icon: "👋" }
    );
  }

  const fullText = segments.map((s) => s.content).join("\n\n");

  return {
    title,
    hook: hook || segments[0]?.content?.slice(0, 50) || "",
    segments,
    structure: { sections },
    rhythm: { points: rhythmPoints },
    fullText,
  };
}

// ============================================
// Segment Modification Prompt
// ============================================
const ACTION_PROMPTS: Record<AIAction, string> = {
  optimize: "优化这段文字的表达，让语句更流畅，保持原意不变。只输出修改后的文字，不要任何解释。",
  colloquial: "把这段文字改得更口语化，像朋友聊天一样自然。只输出修改后的文字。",
  conflict: "增强这段内容的戏剧冲突和张力。只输出修改后的文字。",
  emotion: "增强情绪感染力，让观众产生更强共情。只输出修改后的文字。",
  shorten: "精简这段内容，删除冗余，保留核心信息。只输出精简后的文字。",
  expand: "在保持原意基础上扩展内容，增加细节描写。只输出扩展后的文字。",
  de_ai: "改写这段文字，去除AI痕迹，让读起来像真人写的。只输出修改后的文字。",
};

export function buildModifyPrompt(
  originalText: string,
  action: AIAction,
  context?: string
): { system: string; user: string } {
  const actionDesc = ACTION_PROMPTS[action];

  const system = `你是短视频文案修改专家。${actionDesc}`;

  let user = `原文：\n${originalText}`;
  if (context) user += `\n\n上下文：${context}`;

  return { system, user };
}

// ============================================
// Storyboard Generation Prompt
// ============================================
export function buildStoryboardPrompt(scriptText: string, meta?: {
  contentType?: string;
  platform?: string;
  duration?: string;
  style?: string;
}): { system: string; user: string } {
  const system = `你是专业影视分镜师。将脚本转为分镜表。用以下格式输出（每行一个镜头，|分隔）：

SHOT_NUM|DURATION|SHOT_SIZE|CAMERA|VISUAL|ACTION|DIALOGUE|SCENE|PROPS|SOUND|NOTES
1|3s|medium|static|画面描述|动作|台词|场景|道具|音效|备注
2|5s|close_up|push_in|画面描述|动作|台词|场景|道具|音效|备注

景别: extreme_wide远景 wide全景 full全身 medium中景 medium_close近景 close_up特写 extreme_close大特写
运镜: static固定 push_in推 pull_out拉 tracking横移 follow跟拍 handheld手持 aerial航拍

规则：每个镜头2-8秒，景别要有变化，描述要具体可执行`;

  let user = `脚本：\n${scriptText}`;

  return { system, user };
}

// ============================================
// Storyboard parsing
// ============================================
export function parseStoryboardResponse(text: string) {
  const lines = text.split("\n").filter((l) => /^\d+\|/.test(l));
  const shots = lines.map((line, i) => {
    const parts = line.split("|");
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `shot-${i}-${Date.now()}`,
      shotNumber: parseInt(parts[0]) || i + 1,
      duration: parts[1]?.trim() || "3s",
      shotSize: (parts[2]?.trim() || "medium") as any,
      cameraMovement: (parts[3]?.trim() || "static") as any,
      visualDesc: parts[4]?.trim() || "",
      action: parts[5]?.trim() || "",
      dialogue: parts[6]?.trim() || "",
      scene: parts[7]?.trim() || "",
      props: parts[8]?.trim() || "",
      soundEffect: parts[9]?.trim() || "",
      notes: parts[10]?.trim() || "",
    };
  });

  return { shots };
}

// ============================================
// Single Shot Modification
// ============================================
export function buildModifyShotPrompt(
  shot: Record<string, unknown>,
  instruction: string
): { system: string; user: string } {
  const system = `修改这个分镜镜头。按此格式输出：DURATION|SHOT_SIZE|CAMERA|VISUAL|ACTION|DIALOGUE|SCENE|PROPS|SOUND|NOTES`;
  const user = `指令：${instruction}\n当前镜头：${JSON.stringify(shot)}`;
  return { system, user };
}
