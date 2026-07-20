"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="h-screen flex flex-col">
      <AppHeader
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 min-h-0">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarCollapsed(true)}
        />
        <main className="flex-1 min-w-0 flex flex-col bg-stone-50">
          {children}
        </main>
      </div>
    </div>
  );
}
