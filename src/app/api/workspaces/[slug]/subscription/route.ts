import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";
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

    const sub = await prisma.subscription.findUnique({ where: { workspaceId: workspace.id } });

    const currentPlan = PLANS[workspace.planTier as keyof typeof PLANS] || PLANS.free;

    return NextResponse.json({
      success: true,
      data: {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        currentPlan: {
          tier: workspace.planTier,
          ...currentPlan,
        },
        quota: sub
          ? { used: sub.quotaUsed, total: sub.quotaTotal, remaining: Math.max(0, sub.quotaTotal - sub.quotaUsed), resetAt: sub.quotaResetAt.toISOString() }
          : null,
        availablePlans: Object.entries(PLANS).map(([tier, plan]) => ({
          tier,
          ...plan,
          isCurrent: tier === workspace.planTier,
        })),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}
