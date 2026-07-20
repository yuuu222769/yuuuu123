"use client";

import { Button } from "@/components/ui/button";
import { ScriptEditor } from "@/components/script/script-editor";
import { StoryboardEditor } from "@/components/storyboard/storyboard-editor";
import { KnowledgeBase } from "@/components/knowledge/knowledge-base";
import type { Project } from "@/types";
import { CONTENT_TYPES, PLATFORMS, PROJECT_STATUS_MAP } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Clock,
  Globe,
  Pencil,
  Target,
  MessageSquare,
  Layers,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<"info" | "knowledge" | "script" | "storyboard">("info");
  const [scriptText, setScriptText] = useState("");

  const handleScriptChange = useCallback((text: string) => {
    setScriptText(text);
  }, []);

  const contentType = CONTENT_TYPES.find((t) => t.value === project.contentType);
  const platform = PLATFORMS.find((p) => p.value === project.platform);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Project header bar */}
      <div className="px-5 py-3 border-b border-stone-100 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Link
                href="/dashboard"
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                ← 返回
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-stone-900 truncate">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {contentType && (
                <span className="text-[11px] text-stone-500">
                  {contentType.label}
                </span>
              )}
              {platform && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                  <Globe size={10} /> {platform.label}
                </span>
              )}
              {project.duration && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                  <Clock size={10} /> {project.duration}
                </span>
              )}
              <span
                className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded font-medium",
                  project.status === "done"
                    ? "bg-emerald-50 text-emerald-600"
                    : project.status === "draft"
                      ? "bg-stone-100 text-stone-500"
                      : "bg-amber-50 text-amber-600"
                )}
              >
                {PROJECT_STATUS_MAP[project.status]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/projects/${project.id}?edit=1`}>
              <Button variant="secondary" size="sm">
                <Pencil size={14} />
                <span className="hidden sm:inline">编辑</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3 -mb-3">
          {([
            { key: "info", label: "项目资料", icon: Target },
            { key: "knowledge", label: "知识库", icon: BookOpen },
            { key: "script", label: "脚本", icon: MessageSquare },
            { key: "storyboard", label: "分镜表", icon: Layers },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg transition-colors cursor-pointer",
                activeTab === tab.key
                  ? "text-stone-900 bg-white border border-b-0 border-stone-200 font-medium"
                  : "text-stone-500 hover:text-stone-700"
              )}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-5">
        {activeTab === "knowledge" && (
          <KnowledgeBase project={project} />
        )}

        {activeTab === "info" && (
          <div className="max-w-2xl space-y-5">
            {project.description && (
              <InfoBlock label="项目描述" content={project.description} />
            )}
            {project.targetAudience && (
              <InfoBlock label="目标受众" content={project.targetAudience} />
            )}
            {project.style && (
              <InfoBlock label="内容风格" content={project.style} />
            )}
            <div className="pt-3 border-t border-stone-100">
              <p className="text-xs text-stone-400">
                创建于 {formatDate(project.createdAt)} · 最后更新{" "}
                {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>
        )}

        {activeTab === "script" && (
          <ScriptEditor project={project} onScriptChange={handleScriptChange} />
        )}

        {activeTab === "storyboard" && (
          <StoryboardEditor project={project} scriptText={scriptText} />
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
        {label}
      </h3>
      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

function EmptyTab({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-stone-400" />
      </div>
      <h3 className="text-sm font-medium text-stone-600 mb-1">{title}</h3>
      <p className="text-xs text-stone-400 max-w-sm">{description}</p>
    </div>
  );
}
