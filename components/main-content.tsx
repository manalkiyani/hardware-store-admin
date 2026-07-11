"use client";

import { useSidebar } from "./sidebar-context";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className="min-h-screen transition-all duration-200"
      style={{ marginLeft: collapsed ? "4rem" : "14rem" }}
    >
      <div className="max-w-screen-2xl mx-auto px-12 pt-6 pb-16">{children}</div>
    </main>
  );
}
