import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/projects — list user's projects
export async function GET(request: Request) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
        ...(search
          ? { name: { contains: search, mode: "insensitive" } }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: projects.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { name, contentType, platform, targetAudience, duration, style, description } = body;

    if (!name || !contentType) {
      return NextResponse.json(
        { success: false, error: "项目名称和内容类型为必填项" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        contentType,
        platform: platform || null,
        targetAudience: targetAudience || null,
        duration: duration || null,
        style: style || null,
        description: description || null,
        status: "draft",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...project,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: "创建失败，请重试" },
      { status: 500 }
    );
  }
}
