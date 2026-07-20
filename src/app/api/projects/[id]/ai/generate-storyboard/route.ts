import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateStoryboard } from "@/lib/ai-service";
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
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

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
    const { scriptText } = body;

    if (!scriptText) {
      return NextResponse.json(
        { success: false, error: "请提供脚本内容" },
        { status: 400 }
      );
    }

    const config = {
      apiKey: settings.apiKey!,
      apiBase: settings.apiBase || "https://api.openai.com/v1",
      modelName: settings.modelName || "gpt-4o",
    };

    const storyboard = await generateStoryboard(config, scriptText, {
      contentType: project.contentType,
      platform: project.platform || undefined,
      duration: project.duration || undefined,
      style: project.style || undefined,
    });

    return NextResponse.json({ success: true, data: storyboard });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}
