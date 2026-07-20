import { Suspense } from "react";
import { AppShell } from "./app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-screen bg-stone-50" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
