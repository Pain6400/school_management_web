"use client";

import { useSyncExternalStore } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Home, BookOpen, GraduationCap, Users, LogOut,
  CheckSquare, Calendar, CreditCard, Building2, UserCheck, Award,
  HelpCircle, Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

type NavItem = { 
  title: string; 
  url: string; 
  icon: React.ElementType;
  badge?: string | number;
};

function getNavSections(roles: string[]): { label: string; items: NavItem[] }[] {
  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
    return [
      {
        label: "Gestión SaaS",
        items: [
          { title: "Dashboard", url: "/admin", icon: Home },
          { title: "Escuelas", url: "/admin/schools", icon: Building2, badge: "12" },
          { title: "Planes & Pagos", url: "/admin/plans", icon: CreditCard },
        ]
      }
    ];
  }
  if (roles.includes("SCHOOL_ADMIN") || roles.includes("DIRECTOR")) {
    return [
      {
        label: "Principal",
        items: [
          { title: "Dashboard", url: "/school", icon: Home },
        ]
      },
      {
        label: "Gestión Escolar",
        items: [
          { title: "Matrículas", url: "/school/enrollments", icon: UserCheck, badge: "19" },
          { title: "Estudiantes", url: "/school/students", icon: GraduationCap },
          { title: "Maestros", url: "/school/teachers", icon: Users },
          { title: "Gestión Académica", url: "/school/academics", icon: BookOpen },
        ]
      }
    ];
  }
  if (roles.includes("TEACHER")) {
    return [
      {
        label: "Aula Virtual",
        items: [
          { title: "Mis Clases", url: "/teacher", icon: Home },
          { title: "Tareas", url: "/teacher/assignments", icon: CheckSquare, badge: "5" },
          { title: "Calificaciones", url: "/teacher/grading", icon: Award },
          { title: "Asistencia", url: "/teacher/attendance", icon: Calendar },
        ]
      }
    ];
  }
  if (roles.includes("STUDENT") || roles.includes("PARENT")) {
    return [
      {
        label: "Mi Portal",
        items: [
          { title: "Tablero", url: "/student", icon: Home },
          { title: "Mis Tareas", url: "/student", icon: CheckSquare, badge: "2" },
        ]
      }
    ];
  }
  return [];
}

const emptySubscribe = () => () => {};

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
                {section.items.map((item) => {
                  const isActive = pathname === item.url || (item.url !== "/school" && pathname.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-neutral-100 text-neutral-950 font-semibold shadow-xs"
                            : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
                        }`}
                      >
                        {/* Left Active Indicator Bar */}
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
                })}
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
                  render={<Link href="/school/academics" />}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
                >
                  <BookOpen className="size-4 text-neutral-500" />
                  <span className="flex-1">Guías & Recursos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/school" />}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
                >
                  <HelpCircle className="size-4 text-neutral-500" />
                  <span className="flex-1">Soporte Técnico</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* BOTTOM PROMO WIDGET (Like Upgrade to Pro in ejemplo.webp) */}
        <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 shadow-xs relative">
          <div className="flex items-center justify-between mb-3">
            <div className="size-8 rounded-xl bg-neutral-950 text-lime-400 flex items-center justify-center shadow-xs">
              <Zap className="size-4 fill-lime-400 text-lime-400" />
            </div>
            <span className="text-[10px] font-bold bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full">
              Ciclo 2025
            </span>
          </div>
          <h4 className="text-xs font-bold text-neutral-900 mb-1">Periodo 1 en Curso</h4>
          <p className="text-[11px] text-neutral-500 leading-snug mb-3">
            Cierre oficial de actas y calificaciones programado para el 15 de marzo.
          </p>
          <Link href="/school/academics">
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
