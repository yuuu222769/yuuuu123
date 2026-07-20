import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET current settings
export async function GET() {
  try {
    const user = await requireAuth();

    let settings = await prisma.userSetting.findUnique({
      where: { userId: user.id },
    });

    // Auto-create if not exists
    if (!settings) {
      settings = await prisma.userSetting.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        apiKey: settings.apiKey ? "••••••••" : "",
        apiBase: settings.apiBase || "https://api.openai.com/v1",
        modelName: settings.modelName || "gpt-4o",
        defaultStyle: settings.defaultStyle || "",
        defaultType: settings.defaultType || "",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}

// PUT update settings
export async function PUT(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const data: Record<string, unknown> = {};
    // Skip masked/empty API keys (contains bullet char or empty)
    if (body.apiKey && body.apiKey.length > 10 && !body.apiKey.includes("•")) {
      data.apiKey = body.apiKey;
    }
    if (body.apiBase !== undefined) data.apiBase = body.apiBase;
    if (body.modelName !== undefined) data.modelName = body.modelName;
    if (body.defaultStyle !== undefined) data.defaultStyle = body.defaultStyle;
    if (body.defaultType !== undefined) data.defaultType = body.defaultType;

    const settings = await prisma.userSetting.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: settings.apiKey ? "••••••••" : "",
        apiBase: settings.apiBase,
        modelName: settings.modelName,
        defaultStyle: settings.defaultStyle,
        defaultType: settings.defaultType,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "保存失败" }, { status: 500 });
  }
}
