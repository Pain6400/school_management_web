"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CheckSquare, Calendar, BookOpen, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { assignmentsService, Assignment } from "@/lib/services/assignments.service";

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        const res = await assignmentsService.getAssignments();
        if (res.status && res.data) {
          setAssignments(res.data);
        }
      } catch (err) {
        console.error("Error loading student data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Portal del Estudiante</h2>
            <p className="text-sm text-muted-foreground">
              Bienvenido(a), {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.username}.
            </p>
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tareas y Evaluaciones</CardTitle>
            <CheckSquare className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : assignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Actividades programadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <Calendar className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">Al día</div>
            <p className="text-xs text-muted-foreground mt-1">Sin inasistencias críticas</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estado de Matrícula</CardTitle>
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-xs">
              ACTIVA
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">Ciclo Escolar Vigente</div>
            <p className="text-xs text-muted-foreground mt-1">Inscrito en cursos oficiales</p>
          </CardContent>
        </Card>
      </div>

      {/* TAREAS PRÓXIMAS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="size-5 text-primary" /> Tareas y Actividades
          </CardTitle>
          <CardDescription>
            Revisa las asignaciones pendientes y fechas de entrega.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Cargando actividades...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              ¡Genial! No tienes tareas pendientes en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{a.title}</span>
                      <Badge variant="outline" className="text-xs font-mono">{a.classCode || "General"}</Badge>
                    </div>
                    {a.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-primary" />
                        Entrega: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "Sin fecha"}
                      </span>
                      <span>Puntaje: {a.maxScore} pts</span>
                    </div>
                  </div>
                  <div>
                    <Badge variant="secondary" className="text-xs">
                      {a.status || "Pendiente"}
                    </Badge>
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