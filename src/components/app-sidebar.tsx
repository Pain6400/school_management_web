"use client";

import { useEffect, useState } from "react";
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
  Settings, Home, BookOpen, GraduationCap, Users, LogOut,
  CheckSquare, Calendar, CreditCard, Building2,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

type NavItem = { title: string; url: string; icon: React.ElementType };

function getNavItems(roles: string[]): NavItem[] {
  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
    return [
      { title: "SaaS Dashboard", url: "/admin", icon: Settings },
      { title: "Escuelas", url: "/admin/schools", icon: Building2 },
      { title: "Planes", url: "/admin/plans", icon: CreditCard },
    ];
  }
  if (roles.includes("SCHOOL_ADMIN") || roles.includes("DIRECTOR")) {
    return [
      { title: "Mi Escuela", url: "/school", icon: Home },
      { title: "Maestros", url: "/school/teachers", icon: Users },
      { title: "Estudiantes", url: "/school/students", icon: GraduationCap },
      { title: "Gestión Académica", url: "/school/academics", icon: BookOpen },
    ];
  }
  if (roles.includes("TEACHER")) {
    return [
      { title: "Mis Clases", url: "/teacher", icon: BookOpen },
      { title: "Tareas", url: "/teacher/assignments", icon: CheckSquare },
      { title: "Asistencia", url: "/teacher/attendance", icon: Calendar },
    ];
  }
  if (roles.includes("STUDENT") || roles.includes("PARENT")) {
    return [
      { title: "Tablero", url: "/student", icon: Home },
      { title: "Mis Tareas", url: "/student/assignments", icon: CheckSquare },
      { title: "Calificaciones", url: "/student/grades", icon: BookOpen },
    ];
  }
  return [];
}

export function AppSidebar() {
  const { user, login, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (!user) {
      const token = localStorage.getItem("token");
      if (token) {
        login(token);
      }
    }
  }, [user, login]);

  const roles = mounted ? (user?.roles ?? []) : [];
  const items = getNavItems(roles);
  const displayName = mounted ? (user?.firstName || user?.username || "") : "";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">EduManage</p>
            {displayName && (
              <p className="text-xs text-muted-foreground mt-0.5">{displayName}</p>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { logout(); router.push("/login"); }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}