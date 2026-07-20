import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkQuota, logUsage, getOrCreateDefaultWorkspace } from "@/lib/workspace";
import { parseScriptResponse } from "@/lib/prompt-templates";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });
    if (!project) {
      return NextResponse.json({ success: false, error: "项目不存在" }, { status: 404 });
    }

    const settings = await prisma.userSetting.findUnique({
      where: { userId: user.id },
    });
    if (!settings?.apiKey) {
      return NextResponse.json({ success: false, error: "请先配置 API Key" }, { status: 400 });
    }

    const workspace = await getOrCreateDefaultWorkspace(user);
    const quota = await checkQuota(workspace.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { success: false, error: `AI 额度已用完 (${quota.used}/${quota.total})` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { currentScript, feedback } = body;

    if (!currentScript || !feedback) {
      return NextResponse.json(
        { success: false, error: "请提供脚本内容和修改意见" },
        { status: 400 }
      );
    }

    const apiBase = settings.apiBase || "https://api.openai.com/v1";
    const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
    const url = `${base}/chat/completions`;

    const system = `你是短视频编导。领导给了修改意见，你根据意见修改脚本。

严格用以下格式输出：
[TITLE]
修改后的标题
[HOOK]
修改后的钩子
[SEGMENT hook]
修改后的开场
[/SEGMENT]
[SEGMENT body]
修改后的正文
[/SEGMENT]
[SEGMENT cta]
修改后的结尾
[/SEGMENT]

规则：
- 只改领导提到的部分，保留其他内容
- 保持原风格和语调
- 口语化，像真人说话`;

    const userPrompt = `当前脚本：\n${currentScript}\n\n领导修改意见：\n${feedback}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.modelName || "gpt-4o",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { success: false, error: `AI error (${response.status}): ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    await logUsage({
      workspaceId: workspace.id,
      userId: user.id,
      projectId: id,
      operation: "revise_script",
      modelName: settings.modelName || "",
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const revised = parseScriptResponse(content);

    return NextResponse.json({ success: true, data: revised });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "修改失败" },
      { status: 500 }
    );
  }
}
