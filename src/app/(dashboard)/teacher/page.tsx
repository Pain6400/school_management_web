"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckSquare, Calendar, Users, ArrowRight, Clock, MapPin, Award } from "lucide-react";
import Link from "next/link";
import { academicsService, Class } from "@/lib/services/academics.service";
import { assignmentsService, Assignment } from "@/lib/services/assignments.service";

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        setLoading(true);
        const [clsRes, asgRes] = await Promise.allSettled([
          academicsService.getClasses(),
          assignmentsService.getAssignments(),
        ]);

        if (clsRes.status === "fulfilled" && clsRes.value.status) {
          setClasses(clsRes.value.data);
        }
        if (asgRes.status === "fulfilled" && asgRes.value.status) {
          setAssignments(asgRes.value.data);
        }
      } catch (err) {
        console.error("Error loading teacher data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portal del Docente</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido, Prof. {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.username}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/teacher/attendance">
            <Button variant="outline" className="gap-2">
              <Calendar className="size-4" /> Tomar Asistencia
            </Button>
          </Link>
          <Link href="/teacher/assignments">
            <Button className="gap-2 shadow-xs">
              <CheckSquare className="size-4" /> Nueva Tarea
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clases Asignadas</CardTitle>
            <BookOpen className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : classes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Secciones activas en el período</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tareas Publicadas</CardTitle>
            <CheckSquare className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : assignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Actividades y proyectos vigentes</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
            <Award className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="flex gap-2 pt-1">
            <Link href="/teacher/grading" className="flex-1">
              <Button size="sm" variant="secondary" className="w-full text-xs">
                Calificar
              </Button>
            </Link>
            <Link href="/teacher/attendance" className="flex-1">
              <Button size="sm" variant="secondary" className="w-full text-xs">
                Asistencia
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* MIS CLASES ACTIVAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Clases</CardTitle>
              <CardDescription>Grupos y materias que tienes programados.</CardDescription>
            </div>
            <Link href="/teacher/assignments">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver tareas <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Cargando tus clases...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tienes clases asignadas por el momento.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <div
                  key={c.code}
                  className="rounded-lg border p-4 hover:border-primary/50 transition-colors bg-card flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded">{c.code}</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.course?.name || c.courseCode || "Materia general"}
                    </p>
                    {c.classroom && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        <MapPin className="size-3" />
                        <span>{c.classroom.name} ({c.classroom.location})</span>
                      </div>
                    )}
                    {c.schedule && c.schedule.days && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{c.schedule.days.join(", ")} {c.schedule.start ? `(${c.schedule.start} - ${c.schedule.end})` : ""}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t mt-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="size-3" /> Máx {c.maxStudents} alumnos
                    </span>
                    <Link href={`/teacher/attendance`}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Asistencia
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}