import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/workspaces — list user's workspaces
export async function GET() {
  try {
    const user = await requireAuth();

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true, projects: true } },
            subscription: { select: { planTier: true, quotaUsed: true, quotaTotal: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        planTier: m.workspace.planTier,
        role: m.role,
        memberCount: m.workspace._count.members,
        projectCount: m.workspace._count.projects,
        quota: m.workspace.subscription
          ? { used: m.workspace.subscription.quotaUsed, total: m.workspace.subscription.quotaTotal }
          : { used: 0, total: 10 },
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/workspaces — create new workspace
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "请输入工作空间名称" }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        slug,
        ownerId: user.id,
        planTier: "free",
        members: { create: { userId: user.id, role: "owner" } },
      },
    });

    // Create free subscription
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await prisma.subscription.create({
      data: {
        workspaceId: workspace.id,
        planTier: "free",
        quotaTotal: 10,
        quotaUsed: 0,
        quotaResetAt: nextMonth,
        projectLimit: 3,
        memberLimit: 1,
        features: JSON.stringify(["basic_ai", "knowledge_base", "export_copy"]),
      },
    });

    return NextResponse.json({ success: true, data: { id: workspace.id, slug: workspace.slug } }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
