"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Home, BookOpen, GraduationCap, Users, LogOut,
  CheckSquare, Calendar, CreditCard, Building2, UserCheck, Award,
  HelpCircle, Zap, Bell, ChevronDown, School, Layers, FileText, MessageSquare, UserPlus, ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export type NavSubItem = {
  title: string;
  url: string;
  badge?: string | number;
};

export type NavItem = { 
  title: string; 
  url?: string; 
  icon: React.ElementType;
  badge?: string | number;
  subItems?: NavSubItem[];
};

function getNavSections(roles: string[], pathname: string = ""): { label: string; items: NavItem[] }[] {
  const sections: { label: string; items: NavItem[] }[] = [];

  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const isSchoolAdmin = roles.includes("SCHOOL_ADMIN");
  const isDirector = roles.includes("DIRECTOR");
  const isAccountant = roles.includes("ACCOUNTANT");
  const isAdmissions = roles.includes("ADMISSIONS_OFFICER");
  const isTeacher = roles.includes("TEACHER");
  const isParent = roles.includes("PARENT");
  const isStudent = roles.includes("STUDENT");

  // ==============================================================
  // 1. CONTEXTO EXCLUSIVO: SUPER ADMIN SAAS (CREADOR DEL SISTEMA)
  // El creador vende la suscripción a las escuelas y gestiona sedes y planes SaaS.
  // ==============================================================
  if (isSuperAdmin && (!pathname.startsWith("/school") && !pathname.startsWith("/parent") && !pathname.startsWith("/teacher") && !pathname.startsWith("/student"))) {
    sections.push({
      label: "Gestión SaaS (Plataforma)",
      items: [
        { title: "Dashboard Global", url: "/admin", icon: Home },
        { title: "Escuelas & Suscripciones", url: "/admin/schools", icon: Building2, badge: "SaaS" },
        { title: "Planes & Suscripciones", url: "/admin/plans", icon: CreditCard },
      ]
    });
    return sections;
  }

  // ==============================================================
  // 2. CONTEXTO EXCLUSIVO: CAJERO / CONTADOR (ACCOUNTANT - FINANCE)
  // Solo tiene acceso a opciones de caja, cobranza y facturación escolar.
  // ==============================================================
  if (isAccountant && !isSchoolAdmin && !isDirector && !isSuperAdmin) {
    sections.push({
      label: "Tesorería & Caja",
      items: [
        { title: "Módulo de Finanzas & Caja", url: "/school/finance", icon: CreditCard },
        { title: "Directorio de Alumnos", url: "/school/students", icon: GraduationCap },
        { title: "Comunicados Oficiales", url: "/school/announcements", icon: Bell },
      ]
    });
    return sections;
  }

  // ==============================================================
  // 3. CONTEXTO EXCLUSIVO: OFICIAL DE ADMISIONES (ADMISSIONS_OFFICER)
  // Solo gestiona pre-matrículas, aspirantes y revisión de expedientes.
  // ==============================================================
  if (isAdmissions && !isSchoolAdmin && !isDirector && !isSuperAdmin) {
    sections.push({
      label: "Oficina de Admisiones",
      items: [
        { title: "Admisiones & Aspirantes", url: "/school/admissions", icon: UserPlus, badge: "Nuevo" },
        {
          title: "Matrículas",
          icon: UserCheck,
          subItems: [
            { title: "Matrícula Anual", url: "/school/enrollments/annual" },
            { title: "Inscripción a Clases", url: "/school/enrollments/classes" },
          ]
        },
        { title: "Directorio de Alumnos", url: "/school/students", icon: GraduationCap },
        { title: "Comunicados Oficiales", url: "/school/announcements", icon: Bell },
      ]
    });
    return sections;
  }

  // ==============================================================
  // 4. CONTEXTO EXCLUSIVO: PORTAL DE LA FAMILIA (PADRES / TUTORES)
  // ==============================================================
  if (isParent && (!isTeacher && !isSchoolAdmin && !isDirector && !isSuperAdmin || pathname.startsWith("/parent"))) {
    sections.push({
      label: "Portal de la Familia",
      items: [
        { title: "Tablero Familiar", url: "/parent", icon: Home },
        { title: "Asistencia de Hijos", url: "/parent?tab=asistencia", icon: CheckSquare },
        { title: "Boletín de Notas", url: "/parent?tab=calificaciones", icon: Award },
        { title: "Horarios & Agenda", url: "/parent?tab=resumen", icon: Calendar },
        { title: "Colegiaturas & Pagos", url: "/parent?tab=finanzas", icon: CreditCard },
        { title: "Expediente del Alumno", url: "/parent?tab=expediente", icon: GraduationCap },
        { title: "Avisos & Circulares", url: "/parent?tab=avisos", icon: Bell, badge: "Nuevo" },
      ]
    });
    if (pathname.startsWith("/parent") || (!isTeacher && !isSchoolAdmin && !isDirector && !isSuperAdmin)) {
      return sections;
    }
  }

  // ==============================================================
  // 5. CONTEXTO EXCLUSIVO: PORTAL DEL ESTUDIANTE
  // ==============================================================
  if (isStudent && (!isTeacher && !isSchoolAdmin && !isDirector && !isSuperAdmin || pathname.startsWith("/student"))) {
    sections.push({
      label: "Portal del Estudiante",
      items: [
        { title: "Tablero General", url: "/student", icon: Home },
        { title: "Mis Tareas", url: "/student?tab=assignments", icon: CheckSquare },
        { title: "Calificaciones", url: "/student?tab=grades", icon: Award },
        { title: "Asistencia", url: "/student?tab=attendance", icon: Calendar },
        { title: "Mis Pagos & Colegiaturas", url: "/student/payments", icon: CreditCard },
      ]
    });
    if (pathname.startsWith("/student") || (!isTeacher && !isSchoolAdmin && !isDirector && !isSuperAdmin)) {
      return sections;
    }
  }

  // ==============================================================
  // 6. CONTEXTO EXCLUSIVO: AULA VIRTUAL (DOCENTES)
  // ==============================================================
  if (isTeacher && (!isSchoolAdmin && !isDirector && !isSuperAdmin || pathname.startsWith("/teacher"))) {
    sections.push({
      label: "Aula Virtual",
      items: [
        { title: "Mis Clases", url: "/teacher", icon: Home },
        { title: "Tareas & Entregas", url: "/teacher/assignments", icon: CheckSquare, badge: "5" },
        { title: "Pruebas en Línea", url: "/teacher/quizzes", icon: FileText, badge: "Novedad" },
        { title: "Calificaciones", url: "/teacher/grading", icon: Award },
        { title: "Pase de Asistencia", url: "/teacher/attendance", icon: Calendar },
        { title: "Mensajería", url: "/teacher/messages", icon: MessageSquare, badge: "2" },
        { title: "Comunicados", url: "/school/announcements", icon: Bell },
      ]
    });
    if (pathname.startsWith("/teacher") || (!isSchoolAdmin && !isDirector && !isSuperAdmin)) {
      return sections;
    }
  }

  // ==============================================================
  // 7. GESTIÓN ESCOLAR (ADMINISTRADORES DE ESCUELA / DIRECTORES)
  // ==============================================================
  if (isSchoolAdmin || isDirector || (isSuperAdmin && pathname.startsWith("/school"))) {
    sections.push(
      {
        label: isDirector ? "Dirección Institucional" : "Principal",
        items: [
          { title: "Dashboard Escolar", url: "/school", icon: Home },
        ]
      },
      {
        label: "Gestión Escolar",
        items: [
          { title: "Admisiones", url: "/school/admissions", icon: UserPlus, badge: "Nuevo" },
          {
            title: "Matrículas",
            icon: UserCheck,
            badge: "19",
            subItems: [
              { title: "Matrícula Anual", url: "/school/enrollments/annual" },
              { title: "Inscripción a Clases", url: "/school/enrollments/classes" },
              { title: "Promoción (Rollover)", url: "/school/enrollments/promotion", badge: "Nuevo" },
            ]
          },
          { title: "Estudiantes", url: "/school/students", icon: GraduationCap },
          {
            title: "Personal & Docentes",
            icon: Users,
            subItems: [
              { title: "Directorio Docente", url: "/school/teachers" },
              { title: "Bolsa de Empleo (Staff)", url: "/school/teachers/applications", badge: "Nuevo" },
              { title: "Matriz de Roles & RBAC", url: "/school/teachers/roles", badge: "Nuevo" },
            ]
          },
          {
            title: "Gestión Académica",
            icon: BookOpen,
            subItems: [
              { title: "Horario Semanal", url: "/school/academics/timetable", badge: "Nuevo" },
              { title: "Certificados & Diplomas", url: "/school/academics/certificates", badge: "Nuevo" },
              { title: "Años & Períodos", url: "/school/academics/years" },
              { title: "Grados Escolares", url: "/school/academics/grades" },
              { title: "Materias / Cursos", url: "/school/academics/courses" },
              { title: "Aulas Físicas", url: "/school/academics/classrooms" },
              { title: "Clases y Secciones", url: "/school/academics/classes" },
            ]
          },
          { title: "Finanzas & Pagos", url: "/school/finance", icon: CreditCard },
          { title: "Comunicados", url: "/school/announcements", icon: Bell },
          { title: "Auditoría & Logs", url: "/school/audit", icon: ShieldCheck, badge: "Seguridad" },
        ]
      }
    );
  }

  // ==============================================================
  // 8. ACCESO SAAS ADICIONAL PARA SUPER ADMIN
  // ==============================================================
  if (isSuperAdmin && sections.length === 0) {
    sections.unshift({
      label: "Gestión SaaS",
      items: [
        { title: "Dashboard Global", url: "/admin", icon: Home },
        { title: "Escuelas & Sedes", url: "/admin/schools", icon: Building2 },
        { title: "Usuarios & Accesos", url: "/admin/users", icon: Users },
        { title: "Planes de Servicio", url: "/admin/plans", icon: CreditCard },
      ]
    });
  }

  return sections;
}

const emptySubscribe = () => () => {};

function CollapsibleNavItem({ item, pathname, fullUrl }: { item: NavItem; pathname: string; fullUrl: string }) {
  const isAnySubActive = Boolean(
    item.subItems?.some(
      (sub) => pathname === sub.url || (sub.url !== "/school" && pathname.startsWith(sub.url + "/"))
    )
  );

  const [isOpen, setIsOpen] = useState(isAnySubActive);

  // Keep dropdown open automatically if active subroute is visited
  useEffect(() => {
    if (isAnySubActive) {
      setIsOpen(true);
    }
  }, [isAnySubActive]);

  // Regular single-link item
  if (!item.subItems || item.subItems.length === 0) {
    let isActive = false;
    if (item.url) {
      if (item.url.includes("?")) {
        isActive = fullUrl === item.url;
      } else if (item.url === "/parent" || item.url === "/student" || item.url === "/teacher" || item.url === "/school" || item.url === "/admin") {
        isActive = pathname === item.url && (!fullUrl.includes("?tab=") || fullUrl.endsWith("tab=resumen"));
      } else {
        isActive = pathname === item.url || pathname.startsWith(item.url + "/");
      }
    }

    return (
      <SidebarMenuItem key={item.title}>
        <Link
          href={item.url || "#"}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] ${
            isActive
              ? "bg-neutral-100/90 text-neutral-950 font-semibold shadow-2xs"
              : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
          }`}
        >
          <div
            className={`w-1 h-4 rounded-full transition-[opacity,transform] duration-150 ease-out ${
              isActive ? "bg-neutral-950 opacity-100" : "opacity-0 -ml-1"
            }`}
          />
          <item.icon className={`size-4 ${isActive ? "text-neutral-950" : "text-neutral-500"}`} />
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums font-mono ${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-200/80 text-neutral-700"
              }`}
            >
              {item.badge}
            </span>
          )}
        </Link>
      </SidebarMenuItem>
    );
  }

  // Collapsible dropdown menu
  return (
    <SidebarMenuItem key={item.title}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out cursor-pointer active:scale-[0.98] ${
          isAnySubActive
            ? "bg-neutral-100/90 text-neutral-950 font-semibold shadow-2xs"
            : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-1 h-4 rounded-full transition-[opacity,transform] duration-150 ease-out ${
              isAnySubActive ? "bg-neutral-950 opacity-100" : "opacity-0 -ml-1"
            }`}
          />
          <item.icon className={`size-4 ${isAnySubActive ? "text-neutral-950" : "text-neutral-500"}`} />
          <span className="truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {item.badge && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-700 tabular-nums font-mono">
              {item.badge}
            </span>
          )}
          <ChevronDown
            className={`size-4 text-neutral-400 transition-transform duration-200 ease-out ${
              isOpen ? "rotate-180 text-neutral-900" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <SidebarMenuSub className="ml-5 border-l-2 border-neutral-200/70 pl-2.5 py-1 space-y-1 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {item.subItems.map((sub) => {
            const isSubActive = pathname === sub.url || (sub.url !== "/school" && pathname.startsWith(sub.url + "/"));
            return (
              <SidebarMenuSubItem key={sub.title}>
                <Link
                  href={sub.url}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] ${
                    isSubActive
                      ? "bg-neutral-950 text-white font-semibold shadow-xs"
                      : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full transition-colors ${
                        isSubActive ? "bg-lime-400" : "bg-neutral-300"
                      }`}
                    />
                    <span>{sub.title}</span>
                  </div>
                  {sub.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                        isSubActive ? "bg-neutral-800 text-neutral-300" : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {sub.badge}
                    </span>
                  )}
                </Link>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchStr = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const fullUrl = `${pathname}${searchStr}`;

  const roles = mounted ? (user?.roles ?? []) : [];
  const sections = getNavSections(roles, pathname);

  return (
    <Sidebar className="border-r border-neutral-200/70 bg-white">
      {/* BRAND HEADER */}
      <SidebarHeader className="px-5 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold shadow-xs transition-transform group-hover:scale-105">
              <span className="text-lime-400 text-base font-black">E</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-neutral-900 uppercase">EDUSYS</span>
              <p className="text-[10px] text-neutral-400 font-medium tracking-wide">SCHOOL MANAGEMENT</p>
            </div>
          </Link>
        </div>
      </SidebarHeader>

      {/* NAVIGATION SECTIONS */}
      <SidebarContent className="px-3 py-4 space-y-6">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3 mb-1">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <CollapsibleNavItem key={item.title} item={item} pathname={pathname} fullUrl={fullUrl} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* SECONDARY NAVIGATION */}
        <SidebarGroup className="p-0 pt-2 border-t border-neutral-100">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-3 mb-1">
            Centro de Ayuda
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="#" />}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
                >
                  <BookOpen className="size-4 text-neutral-500" />
                  <span className="flex-1">Guías & Recursos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="#" />}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
                >
                  <HelpCircle className="size-4 text-neutral-500" />
                  <span className="flex-1">Soporte Técnico</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* BOTTOM PROMO WIDGET */}
        <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 shadow-xs relative">
          <div className="flex items-center justify-between mb-3">
            <div className="size-8 rounded-xl bg-neutral-950 text-lime-400 flex items-center justify-center shadow-xs">
              <Zap className="size-4 fill-lime-400 text-lime-400" />
            </div>
            <span className="text-[10px] font-bold bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full">
              Ciclo 2026
            </span>
          </div>
          <h4 className="text-xs font-bold text-neutral-900 mb-1">Periodo 1 en Curso</h4>
          <p className="text-[11px] text-neutral-500 leading-snug mb-3">
            Cierre oficial de actas y calificaciones programado para el 15 de marzo.
          </p>
          <Link href="#">
            <button className="w-full py-2 px-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
              Ver Cronograma
            </button>
          </Link>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
