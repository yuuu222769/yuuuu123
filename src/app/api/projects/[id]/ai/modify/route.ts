import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { modifySegment } from "@/lib/ai-service";
import type { AIAction } from "@/types";
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

    const body = await request.json();
    const { originalText, action, context } = body;

    // Validate
    const validActions: AIAction[] = [
      "optimize", "colloquial", "conflict", "emotion",
      "shorten", "expand", "de_ai",
    ];
    if (!originalText || !action || !validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: "参数不完整或无效" },
        { status: 400 }
      );
    }

    const result = await modifySegment(
      {
        apiKey: settings.apiKey!,
        apiBase: settings.apiBase || "https://api.openai.com/v1",
        modelName: settings.modelName || "gpt-4o",
      },
      { originalText, action, context }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: "修改失败，请重试" },
      { status: 500 }
    );
  }
}
