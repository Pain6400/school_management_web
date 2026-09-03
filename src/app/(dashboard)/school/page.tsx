"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BookOpen, UserCheck, ArrowRight, PlusCircle, CalendarCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usersService } from "@/lib/services/api.service";
import { studentsService } from "@/lib/services/api.service";
import { academicsService } from "@/lib/services/academics.service";

export default function SchoolDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    academicYears: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [studentsRes, usersRes, classesRes, yearsRes] = await Promise.allSettled([
          studentsService.getStudents(),
          usersService.getUsers(),
          academicsService.getClasses(),
          academicsService.getAcademicYears(),
        ]);

        setStats({
          students: studentsRes.status === "fulfilled" && studentsRes.value.status ? studentsRes.value.data.length : 0,
          teachers: usersRes.status === "fulfilled" && usersRes.value.status ? usersRes.value.data.length : 0,
          classes: classesRes.status === "fulfilled" && classesRes.value.status ? classesRes.value.data.length : 0,
          academicYears: yearsRes.status === "fulfilled" && yearsRes.value.status ? yearsRes.value.data.length : 0,
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Control de la Escuela</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido, {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.username || "Administrador"}. Resumen en tiempo real del colegio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/school/enrollments">
            <Button className="gap-2 shadow-xs">
              <UserCheck className="size-4" /> Matricular Alumno
            </Button>
          </Link>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Inscritos</CardTitle>
            <div className="size-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600">
              <GraduationCap className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.students}</div>
            <p className="text-xs text-muted-foreground mt-1">Alumnos activos en la institución</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Personal Docente</CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.teachers}</div>
            <p className="text-xs text-muted-foreground mt-1">Maestros y profesores registrados</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clases / Secciones</CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <BookOpen className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.classes}</div>
            <p className="text-xs text-muted-foreground mt-1">Grupos escolares configurados</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ciclos Escolares</CardTitle>
            <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <CalendarCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.academicYears}</div>
            <p className="text-xs text-muted-foreground mt-1">Años académicos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS & MODULES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <UserCheck className="size-5" />
            </div>
            <CardTitle className="text-lg">Gestión de Matrículas</CardTitle>
            <CardDescription>
              Inscribe a los estudiantes en el ciclo escolar actual y asígnalos a sus clases y secciones correspondientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/school/enrollments">
              <Button variant="outline" className="w-full justify-between group">
                <span>Ir a Matrículas</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <BookOpen className="size-5" />
            </div>
            <CardTitle className="text-lg">Estructura Académica</CardTitle>
            <CardDescription>
              Configura grados escolares, aulas, materias/cursos y apertura de nuevas secciones con horarios.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/school/academics">
              <Button variant="outline" className="w-full justify-between group">
                <span>Ir a Gestión Académica</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Users className="size-5" />
            </div>
            <CardTitle className="text-lg">Comunidad Escolar</CardTitle>
            <CardDescription>
              Administra el padrón de maestros y alumnos, credenciales de acceso al portal y expedientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex gap-2">
            <Link href="/school/teachers" className="flex-1">
              <Button variant="outline" className="w-full text-xs">Maestros</Button>
            </Link>
            <Link href="/school/students" className="flex-1">
              <Button variant="outline" className="w-full text-xs">Estudiantes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}