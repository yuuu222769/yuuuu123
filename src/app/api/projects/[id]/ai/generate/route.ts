import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { streamScriptGeneration } from "@/lib/ai-service";
import { checkQuota, logUsage, getOrCreateDefaultWorkspace } from "@/lib/workspace";
import type { ScriptGenerateInput } from "@/types";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

    // Get user's AI config
    const settings = await prisma.userSetting.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.apiKey) {
      return NextResponse.json(
        { success: false, error: "请先在设置中配置 API Key" },
        { status: 400 }
      );
    }

    // Fetch knowledge base entries
    const knowledgeEntries = await prisma.knowledgeEntry.findMany({
      where: { projectId: id, userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    let knowledgeContext = "";
    if (knowledgeEntries.length > 0) {
      knowledgeContext = knowledgeEntries
        .map((e) => {
          const typeLabel = { client_info: "客户资料", brand_info: "品牌信息", character: "人物设定", historical_script: "历史脚本", reference_video: "参考视频", banned_expression: "禁用表达", common_style: "常用风格", other: "其他" }[e.type] || e.type;
          return `【${typeLabel}】${e.title}\n${e.content}`;
        })
        .join("\n\n---\n\n");
    }

    const body = await request.json();
    const input: ScriptGenerateInput = {
      topic: body.topic,
      contentType: body.contentType || project.contentType,
      platform: body.platform || project.platform || "douyin",
      duration: body.duration || project.duration || "60s",
      targetAudience: body.targetAudience || project.targetAudience || "",
      style: body.style || project.style || "",
      reference: body.reference,
      projectContext: {
        name: project.name,
        description: project.description,
      },
      knowledgeContext,
    };

    // Check quota
    const workspace = await getOrCreateDefaultWorkspace({ id: user.id, email: user.email, displayName: user.displayName });
    const quota = await checkQuota(workspace.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { success: false, error: `AI 额度已用完 (${quota.used}/${quota.total})。请升级套餐或等待下月重置。` },
        { status: 429 }
      );
    }

    // Log usage
    await logUsage({
      workspaceId: workspace.id,
      userId: user.id,
      projectId: id,
      operation: "generate_script",
      modelName: settings.modelName || "gpt-4o",
    });

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const generator = streamScriptGeneration(
          {
            apiKey: settings.apiKey!,
            apiBase: settings.apiBase || "https://api.openai.com/v1",
            modelName: settings.modelName || "gpt-4o",
          },
          input
        );

        for await (const event of generator) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: "生成失败，请重试" },
      { status: 500 }
    );
  }
}
