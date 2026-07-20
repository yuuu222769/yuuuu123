import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";

// GET members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;

    const workspace = await prisma.workspace.findUnique({ where: { slug } });
    if (!workspace) return NextResponse.json({ success: false, error: "工作空间不存在" }, { status: 404 });

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });

    return NextResponse.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        displayName: m.user.displayName,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}

// POST invite member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;

    const workspace = await prisma.workspace.findUnique({ where: { slug } });
    if (!workspace) return NextResponse.json({ success: false, error: "工作空间不存在" }, { status: 404 });

    if (!(await canManageWorkspace(workspace.id, user.id))) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: targetUser.id } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "用户已在团队中" }, { status: 409 });
    }

    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: targetUser.id, role: role || "member" },
    });

    return NextResponse.json({ success: true, data: { userId: targetUser.id, email: targetUser.email } }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "邀请失败" }, { status: 500 });
  }
}

// DELETE remove member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;

    const workspace = await prisma.workspace.findUnique({ where: { slug } });
    if (!workspace) return NextResponse.json({ success: false, error: "工作空间不存在" }, { status: 404 });

    if (!(await canManageWorkspace(workspace.id, user.id))) {
      return NextResponse.json({ success: false, error: "权限不足" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ success: false, error: "缺少memberId" }, { status: 400 });

    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId: workspace.id, role: { not: "owner" } },
    });
    if (!member) return NextResponse.json({ success: false, error: "不能移除Owner" }, { status: 400 });

    await prisma.workspaceMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "移除失败" }, { status: 500 });
  }
}
