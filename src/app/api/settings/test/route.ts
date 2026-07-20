import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    let { apiKey, apiBase, modelName } = body;

    // Fall back to stored key if none provided
    if (!apiKey) {
      const settings = await prisma.userSetting.findUnique({ where: { userId: user.id } });
      apiKey = settings?.apiKey || "";
    }

    if (!apiKey || !apiBase) {
      return NextResponse.json({ success: false, error: "请填写 API Key 和 API 地址" }, { status: 400 });
    }

    // Build URL
    const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
    const url = `${base}/chat/completions`;

    const start = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName || "gpt-4o",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      }),
    });

    const elapsed = Date.now() - start;
    const bodyText = await response.text();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        data: {
          url,
          status: response.status,
          latency: `${elapsed}ms`,
          message: "连接成功！API 配置正确",
        },
      });
    }

    return NextResponse.json({
      success: false,
      data: {
        url,
        status: response.status,
        latency: `${elapsed}ms`,
        errorBody: bodyText.slice(0, 500),
      },
      error: getErrorMessage(response.status, bodyText),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({
      success: false,
      error: `网络错误：${err instanceof Error ? err.message : "未知错误"}`,
    });
  }
}

function getErrorMessage(status: number, body: string): string {
  if (status === 401 || status === 403) {
    return "API Key 无效或没有权限";
  }
  if (status === 404) {
    if (body.includes("openresty") || body.includes("nginx")) {
      return "API 地址错误 — 该地址不存在此接口。请检查 API 地址是否正确（通常是 /v1 结尾）";
    }
    return "接口不存在 — 请检查 API 地址和模型名称";
  }
  if (status === 429) {
    return "请求频率过高或余额不足";
  }
  return `HTTP ${status} — ${body.slice(0, 200)}`;
}
