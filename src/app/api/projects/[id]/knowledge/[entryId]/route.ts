import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET single entry
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, entryId } = await params;

    const entry = await prisma.knowledgeEntry.findFirst({
      where: { id: entryId, projectId: id, userId: user.id },
    });
    if (!entry) {
      return NextResponse.json({ success: false, error: "条目不存在" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}

// PUT update entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, entryId } = await params;

    const existing = await prisma.knowledgeEntry.findFirst({
      where: { id: entryId, projectId: id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "条目不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { type, title, content, tags, fileUrl } = body;

    const entry = await prisma.knowledgeEntry.update({
      where: { id: entryId },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && { tags }),
        ...(fileUrl !== undefined && { fileUrl }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...entry, createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}

// DELETE entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, entryId } = await params;

    const existing = await prisma.knowledgeEntry.findFirst({
      where: { id: entryId, projectId: id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "条目不存在" }, { status: 404 });
    }

    await prisma.knowledgeEntry.delete({ where: { id: entryId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
