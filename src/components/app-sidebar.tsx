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
} from "@/components/ui/sidebar";
import { Settings, Home, BookOpen, GraduationCap, Users, LogOut, CheckSquare, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const { user, login, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Initialize store from localStorage on first load
    if (!user) {
      const token = localStorage.getItem("token");
      if (token) {
        login(token);
      }
    }
  }, [user, login]);

  if (!mounted) return null;

  const roles = user?.roles || [];
  
  // Define menu items based on role
  let items: any[] = [];
  
  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
    items = [
      { title: "SaaS Dashboard", url: "/admin", icon: Settings },
      { title: "Escuelas", url: "/admin/schools", icon: Home },
      { title: "Planes", url: "/admin/plans", icon: CreditCard },
    ];
  } else if (roles.includes("SCHOOL_ADMIN") || roles.includes("DIRECTOR")) {
    items = [
      { title: "Mi Escuela", url: "/school", icon: Home },
      { title: "Maestros", url: "/school/teachers", icon: Users },
      { title: "Estudiantes", url: "/school/students", icon: GraduationCap },
      { title: "Cursos y Clases", url: "/school/academics", icon: BookOpen },
    ];
  } else if (roles.includes("TEACHER")) {
    items = [
      { title: "Mis Clases", url: "/teacher", icon: BookOpen },
      { title: "Tareas", url: "/teacher/assignments", icon: CheckSquare },
      { title: "Asistencia", url: "/teacher/attendance", icon: Calendar },
    ];
  } else if (roles.includes("STUDENT") || roles.includes("PARENT")) {
    items = [
      { title: "Tablero", url: "/student", icon: Home },
      { title: "Mis Tareas", url: "/student/assignments", icon: CheckSquare },
      { title: "Calificaciones", url: "/student/grades", icon: BookOpen },
    ];
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>School Management</SidebarGroupLabel>
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
            <SidebarMenuButton onClick={() => logout()} className="text-red-500 hover:text-red-600">
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}