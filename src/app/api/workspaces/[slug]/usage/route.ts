import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;

    const workspace = await prisma.workspace.findUnique({ where: { slug } });
    if (!workspace) return NextResponse.json({ success: false, error: "工作空间不存在" }, { status: 404 });

    // Get subscription
    const sub = await prisma.subscription.findUnique({ where: { workspaceId: workspace.id } });

    // Get last 30 days usage breakdown
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.aIUsageLog.findMany({
      where: {
        workspaceId: workspace.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        operation: true,
        modelName: true,
        tokensIn: true,
        tokensOut: true,
        cost: true,
        createdAt: true,
        user: { select: { displayName: true, email: true } },
        project: { select: { name: true } },
      },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    logs.forEach((l) => {
      const day = l.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        quota: sub ? { used: sub.quotaUsed, total: sub.quotaTotal, remaining: Math.max(0, sub.quotaTotal - sub.quotaUsed) } : null,
        planTier: workspace.planTier,
        totalCalls: logs.length,
        totalCost: parseFloat(logs.reduce((s, l) => s + l.cost, 0).toFixed(4)),
        recentLogs: logs.slice(0, 20).map((l) => ({
          operation: l.operation,
          model: l.modelName,
          tokens: l.tokensIn + l.tokensOut,
          cost: l.cost,
          user: l.user.displayName || l.user.email,
          project: l.project?.name || "—",
          createdAt: l.createdAt.toISOString(),
        })),
        byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}
