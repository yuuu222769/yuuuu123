import { ProjectCard } from "@/components/project/project-card";
import { CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

interface DashboardPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { search } = await searchParams;

  // Fetch projects for current user
  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-5 lg:p-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-stone-900">
              我的项目
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {projects.length > 0
                ? `共 ${projects.length} 个项目`
                : "创建你的第一个项目"}
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:bg-stone-950 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>新建项目</span>
          </Link>
        </div>

        {/* Search result indicator */}
        {search && (
          <p className="text-sm text-stone-500 mb-4">
            搜索 &ldquo;{search}&rdquo; 的结果 —{" "}
            <Link
              href="/dashboard"
              className="text-stone-700 underline underline-offset-2"
            >
              清除搜索
            </Link>
          </p>
        )}

        {/* Project grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project) => {
              // Convert Prisma model to plain object
              const plainProject = {
                id: project.id,
                userId: project.userId,
                name: project.name,
                contentType: project.contentType,
                platform: project.platform,
                targetAudience: project.targetAudience,
                duration: project.duration,
                style: project.style,
                description: project.description,
                status: project.status,
                createdAt: project.createdAt.toISOString(),
                updatedAt: project.updatedAt.toISOString(),
              };

              return (
                <ProjectCard
                  key={project.id}
                  project={plainProject as Parameters<typeof ProjectCard>[0]["project"]}
                  onDelete={async () => {
                    "use server";
                    // handled client-side
                  }}
                />
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <FolderOpen size={28} className="text-stone-300" />
            </div>
            <h2 className="text-sm font-medium text-stone-500 mb-1">
              还没有项目
            </h2>
            <p className="text-xs text-stone-400 max-w-xs mb-4">
              创建你的第一个项目，开始 AI 辅助创作
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <Plus size={16} />
              <span>新建项目</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
