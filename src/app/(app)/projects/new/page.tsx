import { ProjectForm } from "@/components/project/project-form";

export default function NewProjectPage() {
  return (
    <div className="flex-1 overflow-auto bg-stone-50">
      <div className="max-w-lg mx-auto p-5 lg:p-8">
        <h1 className="text-lg font-semibold text-stone-900 mb-1">新建项目</h1>
        <p className="text-sm text-stone-500 mb-6">
          填写项目资料，让 AI 更好地理解你的创作需求
        </p>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 lg:p-6">
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}
