"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Search,
  Bell,
  Plus,
  Calendar,
  ChevronDown,
  GraduationCap,
  CreditCard,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  Building2,
  Users,
  Shield,
  User,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Fetch active academic years for school contexts
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

  const displayEmail = mounted
    ? user?.email || (user?.username ? `${user.username}@edusys.pro` : "usuario@edusys.pro")
    : "usuario@edusys.pro";

  const isSuperAdmin = mounted && !!user?.roles?.includes("SUPER_ADMIN");
  const isSchoolAdmin = mounted && !!user?.roles?.includes("SCHOOL_ADMIN");
  const isDirector = mounted && !!user?.roles?.includes("DIRECTOR");
  const isAccountant = mounted && !!user?.roles?.includes("ACCOUNTANT");
  const isSchoolContext = mounted && !isSuperAdmin && !pathname.startsWith("/admin");

  const getRoleInfo = (roles?: string[]) => {
    if (roles?.includes("SUPER_ADMIN")) {
      return {
        badgeText: "SUPER ADMIN",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        avatarClass: "bg-blue-100 text-blue-700",
        accountLabel: "Super Admin Account",
      };
    }
    if (roles?.includes("SCHOOL_ADMIN")) {
      return {
        badgeText: "ADMIN",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        avatarClass: "bg-blue-100 text-blue-700",
        accountLabel: "Admin Account",
      };
    }
    if (roles?.includes("DIRECTOR")) {
      return {
        badgeText: "DIRECTOR",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        avatarClass: "bg-purple-100 text-purple-700",
        accountLabel: "Director Account",
      };
    }
    if (roles?.includes("ACCOUNTANT")) {
      return {
        badgeText: "FINANCE",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        avatarClass: "bg-emerald-100 text-emerald-700",
        accountLabel: "Finance Account",
      };
    }
    if (roles?.includes("ADMISSIONS_OFFICER")) {
      return {
        badgeText: "ADMISSIONS",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        avatarClass: "bg-amber-100 text-amber-700",
        accountLabel: "Admissions Account",
      };
    }
    if (roles?.includes("TEACHER")) {
      return {
        badgeText: "FACULTY",
        badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
        avatarClass: "bg-violet-100 text-violet-700",
        accountLabel: "Faculty Account",
      };
    }
    if (roles?.includes("PARENT")) {
      return {
        badgeText: "PARENT",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        avatarClass: "bg-indigo-100 text-indigo-700",
        accountLabel: "Parent Account",
      };
    }
    return {
      badgeText: "STUDENT",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      avatarClass: "bg-sky-100 text-sky-700",
      accountLabel: "Student Account",
    };
  };

  const roleInfo = getRoleInfo(user?.roles);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 sticky top-0 z-30 flex items-center justify-between gap-3">
        {/* LEFT SECTION: Sidebar trigger + Omnibox search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <SidebarTrigger className="text-neutral-600 hover:text-neutral-950 rounded-xl hover:bg-neutral-100 p-2 active:scale-95 transition-all cursor-pointer" />

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

        {/* RIGHT SECTION: Context Pills + Quick Actions + Notifications + CodeClove Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* PÍLDORA DEL CICLO LECTIVO ACTIVO (Solo para contexto de escuela) */}
          {isSchoolContext && (
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
                  {(isSchoolAdmin || isDirector) && (
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
          )}

          {/* BOTÓN DE ACCIÓN RÁPIDA: + NUEVO ▾ (SOLO PARA ROLES ESCOLARES, OCULTO EN SUPER ADMIN) */}
          {!isSuperAdmin && (isSchoolAdmin || isDirector) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-9 px-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer inline-flex items-center"
              >
                <Plus className="size-3.5 text-lime-400" />
                <span>+ Nuevo</span>
                <ChevronDown className="size-3 text-neutral-400 ml-0.5" />
              </DropdownMenuTrigger>
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

          {!isSuperAdmin && isAccountant && (
            <Link
              href="/school/finance"
              className="h-9 px-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer inline-flex items-center"
            >
              <Plus className="size-3.5 text-lime-400" />
              <span>Cobro / Factura</span>
            </Link>
          )}

          {/* Notificaciones (Solo en barra superior para roles escolares, Super Admin las tiene en el menú lateral) */}
          {!isSuperAdmin && (
            <Link
              href="/school/announcements"
              className="size-9 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-2xs relative active:scale-95 transition-all cursor-pointer"
              title="Notificaciones y Comunicados Escolares"
            >
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 bg-lime-500 rounded-full ring-2 ring-white" />
            </Link>
          )}

          {/* MENÚ DE PERFIL DE USUARIO ESTILO CODECLOVE */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="h-10 px-2.5 sm:px-3 rounded-2xl border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center gap-2.5 text-xs shadow-2xs transition-all cursor-pointer select-none"
                >
                  {/* Initials Avatar Pill */}
                  <div
                    className={`size-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${roleInfo.avatarClass}`}
                  >
                    {getInitials(displayName)}
                  </div>

                  {/* Display Name */}
                  <span className="hidden sm:inline font-bold text-neutral-800 truncate max-w-[120px]">
                    {displayName}
                  </span>

                  {/* Role Badge Pill */}
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${roleInfo.badgeClass}`}
                  >
                    {roleInfo.badgeText}
                  </span>

                  {/* Chevron */}
                  <ChevronDown className="size-3.5 text-neutral-400 shrink-0" />
                </button>
              }
            />

            <DropdownMenuContent align="end" className="w-64 p-2.5 rounded-2xl shadow-xl border-neutral-200 bg-white">
              {/* Header con Nombre, Correo y Tipo de Cuenta */}
              <div className="px-1.5 py-1">
                <p className="text-sm font-bold text-neutral-900 leading-tight truncate">
                  {displayName}
                </p>
                <p className="text-xs text-neutral-400 font-medium truncate mt-0.5">
                  {displayEmail}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {roleInfo.accountLabel}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator className="my-2" />

              {/* Opción 1: Mi Perfil */}
              <DropdownMenuItem
                className="text-xs font-semibold py-2 px-2.5 rounded-xl cursor-pointer"
                render={
                  <Link href="/profile" className="flex items-center w-full">
                    <User className="size-4 text-neutral-500 mr-2.5" />
                    <span>Mi Perfil</span>
                  </Link>
                }
              />

              {/* Opción 2: Consola Administrativa */}
              <DropdownMenuItem
                className="text-xs font-semibold py-2 px-2.5 rounded-xl cursor-pointer"
                render={
                  <Link
                    href={isSuperAdmin ? "/admin" : "/school"}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center">
                      <Shield className="size-4 text-blue-600 mr-2.5" />
                      <span>{isSuperAdmin ? "Consola SaaS" : "Consola Admin"}</span>
                    </div>
                    <ExternalLink className="size-3 text-neutral-400" />
                  </Link>
                }
              />

              <DropdownMenuSeparator className="my-2" />

              {/* Opción 3: Cerrar Sesión */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs font-bold py-2 px-2.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
              >
                <LogOut className="size-4 mr-2.5 text-rose-600" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Command Palette Dialog (Ctrl+K) */}
      <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} />
    </>
  );
}
