import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/projects/:id/knowledge — list entries
export async function GET(
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
      return NextResponse.json({ success: false, error: "项目不存在" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const entries = await prisma.knowledgeEntry.findMany({
      where: {
        projectId: id,
        userId: user.id,
        ...(type && type !== "all" ? { type } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
                { tags: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: entries.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}

// POST /api/projects/:id/knowledge — create entry
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
      return NextResponse.json({ success: false, error: "项目不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { type, title, content, tags, fileUrl } = body;

    if (!type || !title) {
      return NextResponse.json({ success: false, error: "类型和标题为必填项" }, { status: 400 });
    }

    const entry = await prisma.knowledgeEntry.create({
      data: {
        projectId: id,
        userId: user.id,
        type,
        title,
        content: content || "",
        tags: tags || "",
        fileUrl: fileUrl || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...entry,
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: "创建失败" }, { status: 500 });
  }
}
