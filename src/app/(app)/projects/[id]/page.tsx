import { ProjectDetail } from "@/components/project/project-detail";
import { ProjectForm } from "@/components/project/project-form";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Project } from "@/types";
import { notFound, redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { edit } = await searchParams;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });

  if (!project) notFound();

  // Edit mode
  if (edit === "1") {
    const plainProject = {
      name: project.name,
      contentType: project.contentType,
      platform: project.platform,
      targetAudience: project.targetAudience,
      duration: project.duration,
      style: project.style,
      description: project.description,
    };

    return (
      <div className="flex-1 overflow-auto bg-stone-50">
        <div className="max-w-lg mx-auto p-5 lg:p-8">
          <h1 className="text-lg font-semibold text-stone-900 mb-1">
            编辑项目
          </h1>
          <p className="text-sm text-stone-500 mb-6">修改项目资料</p>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 lg:p-6">
            <ProjectForm
              initialData={plainProject as Parameters<typeof ProjectForm>[0]["initialData"]}
              projectId={id}
              isEditing
            />
          </div>
        </div>
      </div>
    );
  }

  // View mode
  const plainProject: Project = {
    id: project.id,
    userId: project.userId,
    name: project.name,
    contentType: project.contentType as Project["contentType"],
    platform: project.platform as Project["platform"],
    targetAudience: project.targetAudience,
    duration: project.duration,
    style: project.style,
    description: project.description,
    status: project.status as Project["status"],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };

  return <ProjectDetail project={plainProject} />;
}
