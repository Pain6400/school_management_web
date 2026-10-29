"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Search,
  Bell,
  Settings,
  Plus,
  Calendar,
  ChevronDown,
  GraduationCap,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { academicsService, AcademicYear } from "@/lib/services/academics.service";
import { CommandPalette } from "./command-palette";

const emptySubscribe = () => () => {};

export function GlobalHeader() {
  const { user } = useAuthStore();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Fetch active academic years
  useEffect(() => {
    let isMounted = true;
    async function loadYears() {
      try {
        const res = await academicsService.getAcademicYears();
        if (isMounted && res && res.data && res.data.length > 0) {
          setAcademicYears(res.data);
          const active = res.data.find((y) => y.isCurrent) || res.data[0];
          setCurrentYear(active);
        }
      } catch (err) {
        // Fallback default
        if (isMounted) {
          setCurrentYear({
            id: 1,
            yearCode: 2026,
            name: "Ciclo Lectivo 2026",
            startDate: "2026-02-01",
            endDate: "2026-11-30",
            isCurrent: true,
            status: true,
          });
        }
      }
    }
    loadYears();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = mounted
    ? user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user?.username || "Usuario"
    : "Usuario";

  const displayRole = mounted
    ? user?.roles?.[0] === "SCHOOL_ADMIN"
      ? "Director / Admin"
      : user?.roles?.[0] === "TEACHER"
      ? "Profesor Titular"
      : user?.roles?.[0] === "PARENT"
      ? "Padre / Tutor"
      : user?.roles?.[0] === "SUPER_ADMIN"
      ? "Super Administrador"
      : "Estudiante"
    : "Usuario";

  const isAdminOrDirector = mounted && (
    user?.roles?.includes("SCHOOL_ADMIN") ||
    user?.roles?.includes("DIRECTOR") ||
    user?.roles?.includes("SUPER_ADMIN")
  );

  return (
    <>
      <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 sticky top-0 z-30 flex items-center justify-between gap-3">
        {/* LEFT SECTION: Sidebar trigger + Omnibox search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <SidebarTrigger className="text-neutral-600 hover:text-neutral-950 rounded-xl hover:bg-neutral-100 p-2 active:scale-95 transition-all" />

          {/* OMNIBOX SEARCH TRIGGER */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="relative w-full max-w-md hidden sm:flex items-center justify-between bg-neutral-100/80 hover:bg-neutral-100 text-xs font-medium text-neutral-400 pl-3.5 pr-2.5 py-2 rounded-xl border border-transparent hover:border-neutral-200 focus:outline-none transition-all cursor-pointer shadow-2xs group text-left"
          >
            <div className="flex items-center gap-2.5">
              <Search className="size-4 text-neutral-400 group-hover:text-neutral-700 transition-colors" />
              <span className="truncate">Búsqueda rápida (alumnos, cursos, maestros...)...</span>
            </div>
            <kbd className="text-[10px] font-mono font-bold text-neutral-500 bg-white border border-neutral-200/90 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* RIGHT SECTION: Academic Year Pill + Quick Action + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* PÍLDORA DEL CICLO LECTIVO ACTIVO (STYLE CODECLOVE) */}
          <div className="hidden md:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="h-9 px-3 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center gap-2 text-xs font-bold text-neutral-800 shadow-2xs transition-all cursor-pointer select-none"
                  >
                    <Calendar className="size-3.5 text-neutral-500" />
                    <span className="truncate max-w-[150px]">
                      {currentYear?.name || "Ciclo Lectivo 2026"}
                    </span>
                    <span className="size-2 rounded-full bg-lime-500 ring-2 ring-lime-100 shrink-0" />
                    <ChevronDown className="size-3 text-neutral-400 ml-0.5" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl">
                <DropdownMenuLabel className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
                  Ciclo Lectivo en Curso
                </DropdownMenuLabel>
                <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-100 mb-1 space-y-0.5">
                  <p className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-lime-600" />
                    <span>{currentYear?.name || "Ciclo Lectivo 2026"}</span>
                  </p>
                  <p className="text-[10px] text-neutral-500 font-medium">
                    Período oficial activo para calificaciones, asistencias y cobros.
                  </p>
                </div>
                {academicYears.length > 1 && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuLabel className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
                      Otros Ciclos Registrados
                    </DropdownMenuLabel>
                    {academicYears
                      .filter((y) => y.id !== currentYear?.id)
                      .map((y) => (
                        <DropdownMenuItem
                          key={y.id}
                          onClick={() => setCurrentYear(y)}
                          className="text-xs font-semibold py-2 px-2.5 rounded-xl cursor-pointer"
                        >
                          <Calendar className="size-3.5 text-neutral-400 mr-2" />
                          <span>{y.name}</span>
                        </DropdownMenuItem>
                      ))}
                  </>
                )}
                {isAdminOrDirector && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      className="text-xs font-bold text-neutral-700 py-2 px-2.5 rounded-xl cursor-pointer"
                      render={
                        <Link href="/school/academics/years" className="flex items-center w-full">
                          <ExternalLink className="size-3.5 text-neutral-400 mr-2" />
                          <span>Administrar Años Lectivos</span>
                        </Link>
                      }
                    />
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* BOTÓN DE ACCIÓN RÁPIDA: + NUEVO ▾ */}
          {isAdminOrDirector && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="h-9 px-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="size-3.5 text-lime-400" />
                    <span>+ Nuevo</span>
                    <ChevronDown className="size-3 text-neutral-400 ml-0.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-2 py-1">
                  Acciones Rápidas
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                  render={
                    <Link href="/school/students?action=create" className="flex items-center gap-2 w-full">
                      <GraduationCap className="size-4 text-lime-600" />
                      <span>Nuevo Estudiante</span>
                    </Link>
                  }
                />
                <DropdownMenuItem
                  className="text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                  render={
                    <Link href="/school/finance" className="flex items-center gap-2 w-full">
                      <CreditCard className="size-4 text-amber-600" />
                      <span>Registrar Cobro / Factura</span>
                    </Link>
                  }
                />
                <DropdownMenuItem
                  className="text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                  render={
                    <Link href="/school/enrollments/annual" className="flex items-center gap-2 w-full">
                      <UserCheck className="size-4 text-blue-600" />
                      <span>Nueva Matrícula Anual</span>
                    </Link>
                  }
                />
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  className="text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer"
                  render={
                    <Link href="/school/announcements" className="flex items-center gap-2 w-full">
                      <Bell className="size-4 text-purple-600" />
                      <span>Publicar Comunicado</span>
                    </Link>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notificaciones */}
          <Link href="/school/announcements">
            <button
              type="button"
              className="size-9 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs relative active:scale-95 transition-all cursor-pointer"
              title="Notificaciones y Comunicados"
            >
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 bg-lime-500 rounded-full ring-2 ring-white" />
            </button>
          </Link>

          {/* Perfil de Usuario */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200">
            <div className="size-9 rounded-xl bg-neutral-950 text-lime-400 flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-neutral-950/10 shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-neutral-900 leading-tight truncate max-w-[130px]">
                {displayName}
              </p>
              <p className="text-[10px] font-semibold text-neutral-400 truncate max-w-[130px]">
                {displayRole}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette Dialog (Ctrl+K) */}
      <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} />
    </>
  );
}

