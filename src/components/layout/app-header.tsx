"use client";

import { Button } from "@/components/ui/button";
import { WorkspaceSelector, type WorkspaceInfo } from "@/components/workspace/workspace-selector";
import { cn } from "@/lib/utils";
import { Clapperboard, LogOut, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface AppHeaderProps {
  userName?: string;
  onMenuToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export function AppHeader({
  userName,
  onMenuToggle,
  sidebarCollapsed,
}: AppHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const currentSlug = searchParams.get("workspace");

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((j) => { if (j.success) setWorkspaces(j.data); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-12 border-b border-stone-200 bg-white flex items-center justify-between px-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500 cursor-pointer lg:hidden"
        >
          <Menu size={18} />
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-stone-900 font-semibold text-sm hover:opacity-80 transition-opacity"
        >
          <Clapperboard size={18} className="text-stone-700" />
          <span className="hidden sm:inline">AI 编导工作台</span>
        </Link>
        <span className="w-px h-4 bg-stone-200" />
        <WorkspaceSelector workspaces={workspaces} currentSlug={currentSlug} />
      </div>

      {/* Center - Search */}
      <div className="hidden sm:flex items-center flex-1 max-w-md mx-8">
        {searchOpen ? (
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchOpen(false);
                  setSearchQuery("");
                }
                if (e.key === "Enter") {
                  router.push(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
                }
              }}
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
              placeholder="搜索项目…"
              className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:bg-white transition-colors"
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 w-full h-8 px-3 text-sm text-stone-400 rounded-md border border-transparent hover:border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <Search size={14} />
            <span>搜索项目…</span>
          </button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-500 hidden sm:block">
          {userName || "用户"}
        </span>
        <Link href="/workspace/settings" className="text-xs text-stone-500 hover:text-stone-700 hidden sm:block">
          设置
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={14} />
          <span className="hidden sm:inline">退出</span>
        </Button>
      </div>
    </header>
  );
}
