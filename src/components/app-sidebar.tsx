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
  HelpCircle, Zap, Bell, ChevronDown, School, Layers,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

function getNavSections(roles: string[]): { label: string; items: NavItem[] }[] {
  const sections: { label: string; items: NavItem[] }[] = [];

  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
    sections.push({
      label: "Gestión SaaS",
      items: [
        { title: "Dashboard", url: "/admin", icon: Home },
        { title: "Escuelas", url: "/admin/schools", icon: Building2, badge: "12" },
        { title: "Planes & Pagos", url: "/admin/plans", icon: CreditCard },
      ]
    });
  }

  if (roles.includes("SCHOOL_ADMIN") || roles.includes("DIRECTOR") || roles.includes("SUPER_ADMIN")) {
    sections.push(
      {
        label: "Principal",
        items: [
          { title: "Dashboard", url: "/school", icon: Home },
        ]
      },
      {
        label: "Gestión Escolar",
        items: [
          {
            title: "Matrículas",
            icon: UserCheck,
            badge: "19",
            subItems: [
              { title: "Matrícula Anual", url: "/school/enrollments/annual" },
              { title: "Inscripción a Clases", url: "/school/enrollments/classes" },
            ]
          },
          { title: "Estudiantes", url: "/school/students", icon: GraduationCap },
          { title: "Maestros", url: "/school/teachers", icon: Users },
          {
            title: "Gestión Académica",
            icon: BookOpen,
            subItems: [
              { title: "Años & Períodos", url: "/school/academics/years" },
              { title: "Grados Escolares", url: "/school/academics/grades" },
              { title: "Materias / Cursos", url: "/school/academics/courses" },
              { title: "Aulas Físicas", url: "/school/academics/classrooms" },
              { title: "Clases y Secciones", url: "/school/academics/classes" },
            ]
          },
          { title: "Finanzas & Pagos", url: "/school/finance", icon: CreditCard },
          { title: "Asistencia", url: "/teacher/attendance", icon: Calendar },
          { title: "Comunicados", url: "/school/announcements", icon: Bell },
        ]
      }
    );
  }

  if (roles.includes("TEACHER") || roles.includes("SUPER_ADMIN")) {
    sections.push({
      label: "Aula Virtual",
      items: [
        { title: "Mis Clases", url: "/teacher", icon: Home },
        { title: "Tareas", url: "/teacher/assignments", icon: CheckSquare, badge: "5" },
        { title: "Calificaciones", url: "/teacher/grading", icon: Award },
        { title: "Asistencia", url: "/teacher/attendance", icon: Calendar },
        { title: "Comunicados", url: "/school/announcements", icon: Bell },
      ]
    });
  }

  if (roles.includes("STUDENT") || roles.includes("PARENT") || roles.includes("SUPER_ADMIN")) {
    sections.push({
      label: "Mi Portal",
      items: [
        { title: "Tablero", url: "/student", icon: Home },
        { title: "Mis Tareas", url: "/student", icon: CheckSquare, badge: "2" },
      ]
    });
  }

  return sections;
}

const emptySubscribe = () => () => {};

function CollapsibleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
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
    const isActive = pathname === item.url || (Boolean(item.url) && item.url !== "/school" && pathname.startsWith(item.url!));
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          render={<Link href={item.url || "#"} />}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            isActive
              ? "bg-neutral-100 text-neutral-950 font-semibold shadow-xs"
              : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
          }`}
        >
          <div
            className={`w-1 h-4 rounded-full transition-all ${
              isActive ? "bg-neutral-950 opacity-100" : "opacity-0 -ml-1"
            }`}
          />
          <item.icon className={`size-4 ${isActive ? "text-neutral-950" : "text-neutral-500"}`} />
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-200/80 text-neutral-700"
              }`}
            >
              {item.badge}
            </span>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Collapsible dropdown menu
  return (
    <SidebarMenuItem key={item.title}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
          isAnySubActive
            ? "bg-neutral-100 text-neutral-950 font-semibold shadow-2xs"
            : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-1 h-4 rounded-full transition-all ${
              isAnySubActive ? "bg-neutral-950 opacity-100" : "opacity-0 -ml-1"
            }`}
          />
          <item.icon className={`size-4 ${isAnySubActive ? "text-neutral-950" : "text-neutral-500"}`} />
          <span className="truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {item.badge && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-700">
              {item.badge}
            </span>
          )}
          <ChevronDown
            className={`size-4 text-neutral-400 transition-transform duration-200 ${
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
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
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
  const router = useRouter();

  const roles = mounted ? (user?.roles ?? []) : [];
  const sections = getNavSections(roles);

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
                  <CollapsibleNavItem key={item.title} item={item} pathname={pathname} />
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

      {/* FOOTER */}
      <SidebarFooter className="p-3 border-t border-neutral-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { logout(); router.push("/login"); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
