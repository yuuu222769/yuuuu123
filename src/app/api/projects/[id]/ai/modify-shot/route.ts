import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { modifyShot } from "@/lib/ai-service";
import type { StoryboardShot } from "@/types";
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
    const { shot, instruction } = body;

    if (!shot || !instruction) {
      return NextResponse.json(
        { success: false, error: "请提供镜头信息和修改指令" },
        { status: 400 }
      );
    }

    const config = {
      apiKey: settings.apiKey!,
      apiBase: settings.apiBase || "https://api.openai.com/v1",
      modelName: settings.modelName || "gpt-4o",
    };

    const result = await modifyShot(config, shot as StoryboardShot, instruction);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "修改失败" },
      { status: 500 }
    );
  }
}
