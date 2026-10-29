"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalHeader } from "@/components/layout/global-header";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fa] selection:bg-neutral-900 selection:text-white">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TOP GLOBAL HEADER (ENHANCED LINEAR/CODECLOVE STYLE) */}
          <GlobalHeader />

          {/* MAIN PAGE CONTENT */}
          <div className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
