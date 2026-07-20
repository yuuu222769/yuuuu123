"use client";

import { cn } from "@/lib/utils";
import { Building2, Check, ChevronDown, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  role: string;
  memberCount: number;
  projectCount: number;
  quota: { used: number; total: number };
}

interface WorkspaceSelectorProps {
  workspaces: WorkspaceInfo[];
  currentSlug: string | null;
}

export function WorkspaceSelector({ workspaces, currentSlug }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const current = workspaces.find((w) => w.slug === currentSlug) || workspaces[0];

  if (!current) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-7 px-2 rounded-md hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors"
      >
        <Building2 size={13} />
        <span className="text-xs font-medium max-w-[100px] truncate">{current.name}</span>
        <ChevronDown size={10} className="text-stone-400" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-stone-100">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide">工作空间</p>
          </div>
          <div className="max-h-64 overflow-auto">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { router.push(`/dashboard?workspace=${ws.slug}`); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-stone-50 transition-colors cursor-pointer",
                  ws.slug === currentSlug && "bg-stone-50"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  ws.planTier === "free" ? "bg-stone-100 text-stone-500" :
                  ws.planTier === "pro" ? "bg-amber-100 text-amber-600" :
                  "bg-violet-100 text-violet-600"
                )}>
                  {ws.memberCount > 1 ? <Building2 size={13} /> : <User size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-stone-800 truncate">{ws.name}</p>
                    {ws.slug === currentSlug && <Check size={12} className="text-stone-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-stone-400">
                    {ws.memberCount} 人 · {ws.projectCount} 项目 · {ws.planTier.toUpperCase()}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-stone-100 px-3 py-2">
            <button
              onClick={() => { router.push("/workspace/new"); setOpen(false); }}
              className="flex items-center gap-1.5 w-full text-xs text-stone-600 hover:text-stone-900 transition-colors cursor-pointer py-1"
            >
              <Plus size={12} />
              创建新工作空间
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
