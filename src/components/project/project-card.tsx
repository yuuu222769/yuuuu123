"use client";

import { Card } from "@/components/ui/card";
import { CONTENT_TYPES, PLATFORMS, PROJECT_STATUS_MAP } from "@/types";
import type { Project } from "@/types";
import { cn, formatDate, truncate } from "@/lib/utils";
import { Clock, Globe, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const contentType = CONTENT_TYPES.find(
    (t) => t.value === project.contentType
  );
  const platform = PLATFORMS.find((p) => p.value === project.platform);

  return (
    <Link href={`/projects/${project.id}`}>
      <Card hover className="group relative">
        {/* Top */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2 group-hover:text-stone-700 transition-colors">
              {project.name}
            </h3>
            {/* Context menu */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="shrink-0 p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
              {truncate(project.description, 80)}
            </p>
          )}
        </div>

        {/* Meta tags */}
        <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap">
          {contentType && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-[11px] text-stone-600 font-medium">
              {contentType.label}
            </span>
          )}
          {platform && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-stone-500">
              <Globe size={10} />
              {platform.label}
            </span>
          )}
          {project.duration && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-stone-500">
              <Clock size={10} />
              {project.duration}
            </span>
          )}
        </div>

        {/* Bottom bar */}
        <div className="px-4 py-2 border-t border-stone-100 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            {formatDate(project.updatedAt)}
          </span>
          <span
            className={cn(
              "text-[11px] font-medium",
              project.status === "done"
                ? "text-emerald-600"
                : project.status === "draft"
                  ? "text-stone-400"
                  : "text-amber-600"
            )}
          >
            {PROJECT_STATUS_MAP[project.status]}
          </span>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            className="absolute top-10 right-3 z-20 bg-white border border-stone-200 rounded-lg shadow-lg py-1 min-w-[120px]"
            onClick={(e) => e.preventDefault()}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(project.id);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              删除项目
            </button>
          </div>
        )}
      </Card>
    </Link>
  );
}
