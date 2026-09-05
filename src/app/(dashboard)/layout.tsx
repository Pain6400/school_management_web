"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Search, Bell, Settings, Plus, Sparkles, User, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, initAuth } = useAuthStore();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const displayName = mounted
    ? (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "Usuario")
    : "Usuario";

  const displayRole = mounted
    ? (user?.roles?.[0] === "SCHOOL_ADMIN"
        ? "Director / Admin"
        : user?.roles?.[0] === "TEACHER"
        ? "Profesor Titular"
        : user?.roles?.[0] === "SUPER_ADMIN"
        ? "Super Administrador"
        : "Estudiante")
    : "Usuario";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f4f5f7]">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TOP HEADER (MATCHING ejemplo.webp) */}
          <header className="h-18 px-6 lg:px-8 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <SidebarTrigger className="text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 p-2" />
              
              {/* OMNIBOX SEARCH BAR */}
              <div className="relative w-full max-w-md hidden sm:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Quick search (alumnos, cursos, profesores...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f4f5f7] hover:bg-neutral-100 focus:bg-white text-sm text-neutral-800 placeholder-neutral-400 pl-10 pr-12 py-2 rounded-2xl border border-transparent focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-950/5 transition-all shadow-2xs"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-neutral-400 bg-white border border-neutral-200 px-1.5 py-0.5 rounded shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* RIGHT HEADER ACTIONS */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                type="button"
                className="size-10 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs relative transition-colors cursor-pointer"
                title="Notificaciones"
              >
                <Bell className="size-4.5" />
                <span className="absolute top-2 right-2 size-2 bg-lime-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Settings Gear */}
              <button
                type="button"
                className="size-10 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs transition-colors cursor-pointer"
                title="Configuración"
              >
                <Settings className="size-4.5" />
              </button>

              {/* User Profile Chip */}
              <div className="flex items-center gap-3 pl-2 sm:border-l border-neutral-200">
                <div className="size-10 rounded-full bg-neutral-950 text-lime-400 flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-lime-400/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-neutral-900 leading-tight truncate max-w-[140px]">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate max-w-[140px]">
                    {displayRole}
                  </p>
                </div>
              </div>

              {/* Quick Action Button */}
              <Link href="/school/enrollments" className="hidden lg:block">
                <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-1.5 shadow-xs">
                  <Plus className="size-3.5 text-lime-400" />
                  <span>Matricular</span>
                </Button>
              </Link>
            </div>
          </header>

          {/* MAIN PAGE CONTENT */}
          <div className="flex-1 p-5 md:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
