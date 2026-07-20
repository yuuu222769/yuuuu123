"use client";

import { cn } from "@/lib/utils";
import { FileText, FolderOpen, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppSidebarProps {
  collapsed: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "全部项目",
    icon: FolderOpen,
  },
  {
    href: "/settings",
    label: "设置",
    icon: Settings,
  },
];

export function AppSidebar({ collapsed, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-56 bg-stone-50 border-r border-stone-200 flex flex-col shrink-0 transition-transform duration-200",
          collapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className="h-12 flex items-center px-4 border-b border-stone-200 lg:hidden">
          <span className="text-sm font-semibold text-stone-900">
            AI 编导工作台
          </span>
        </div>

        {/* New Project button */}
        <div className="p-3">
          <Link
            href="/projects/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 h-9 w-full rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:bg-stone-950 transition-colors"
          >
            <Plus size={16} />
            <span>新建项目</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-3 h-8 rounded-md text-sm transition-colors mb-0.5",
                  isActive
                    ? "bg-white text-stone-900 font-medium shadow-sm border border-stone-200"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200">
          <p className="text-[10px] text-stone-400 leading-relaxed">
            AI 编导工作台 v0.1
          </p>
        </div>
      </aside>
    </>
  );
}
