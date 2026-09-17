"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, CheckSquare, Calendar, Users, ArrowRight, Clock,
  MapPin, Award, Plus, Sparkles, Search, Layers, CheckCircle2,
  CalendarCheck2, ChevronRight, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { academicsService, Class } from "@/lib/services/academics.service";
import { assignmentsService, Assignment } from "@/lib/services/assignments.service";
import { enrollmentsService, ClassEnrollment } from "@/lib/services/enrollments.service";

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        setLoading(true);
        const [clsRes, asgRes, ceRes] = await Promise.allSettled([
          academicsService.getClasses(),
          assignmentsService.getAssignments(),
          enrollmentsService.getClassEnrollments(),
        ]);

        if (clsRes.status === "fulfilled" && clsRes.value.status) {
          setClasses(clsRes.value.data);
        }
        if (asgRes.status === "fulfilled" && asgRes.value.status) {
          setAssignments(asgRes.value.data);
        }
        if (ceRes.status === "fulfilled" && ceRes.value.status) {
          setClassEnrollments(ceRes.value.data);
        }
      } catch (err) {
        console.error("Error loading teacher data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, []);

  // Alumnos inscritos por cada clase
  const studentsPerClass = useMemo(() => {
    const map: Record<string, number> = {};
    classEnrollments.forEach((ce) => {
      if (ce.classCode) {
        map[ce.classCode] = (map[ce.classCode] || 0) + 1;
      }
    });
    return map;
  }, [classEnrollments]);

  // Filtrar clases por búsqueda
  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.course?.name?.toLowerCase().includes(q) ||
        c.grade?.name?.toLowerCase().includes(q)
    );
  }, [classes, searchQuery]);

  const totalStudents = useMemo(() => {
    const uniqueStudents = new Set<string>();
    classEnrollments.forEach((ce) => {
      if (ce.studentId) uniqueStudents.add(ce.studentId);
    });
    return uniqueStudents.size;
  }, [classEnrollments]);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER ESTILO EDUSYS */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="size-16 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-lime-400/20">
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "P"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Panel Docente • Prof. {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                <Sparkles className="size-3" /> Claustro Docente
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Gestión de clases, control de asistencia y revisión de asignaciones académicas.
            </p>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS PRINCIPALES */}
        <div className="flex items-center gap-3">
          <Link href="/teacher/attendance">
            <Button className="h-12 px-5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200 text-xs font-bold shadow-2xs gap-2">
              <CalendarCheck2 className="size-4 text-neutral-800" />
              <span>Tomar Asistencia</span>
            </Button>
          </Link>
          <Link href="/teacher/assignments">
            <Button className="h-12 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs gap-2">
              <Plus className="size-4 text-lime-400" />
              <span>Crear Tarea</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Mis Clases</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{classes.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Grupos asignados en el periodo actual</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Alumnos Atendidos</span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <Users className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{totalStudents}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Estudiantes únicos matriculados</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tareas Activas</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <CheckSquare className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{assignments.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Evaluaciones y trabajos vigentes</p>
        </Card>
      </div>

      {/* LISTADO DE CLASES INTERACTIVAS */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-neutral-900">Tus Clases y Secciones</h3>
            <p className="text-xs text-neutral-400">Accede directamente al registro de asistencia o calificaciones de cada grupo</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar clase o materia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-neutral-50 border border-neutral-200/90 pl-10 pr-3 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-medium">Cargando tus clases...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-medium">
            {searchQuery ? "No se encontraron clases que coincidan con la búsqueda." : "No tienes clases asignadas actualmente."}
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((c) => {
              const enrolledCount = studentsPerClass[c.code] || 0;
              const courseName = c.course?.name || c.courseCode || "Materia General";
              const gradeName = c.grade?.name || "Grado General";

              return (
                <div
                  key={c.code}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-5 hover:border-neutral-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                          {gradeName}
                        </span>
                        <h4 className="text-base font-black text-neutral-900 leading-snug group-hover:text-neutral-950">
                          {c.name}
                        </h4>
                        <p className="text-xs font-medium text-neutral-500 mt-0.5">{courseName}</p>
                      </div>
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                        {c.code}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs text-neutral-500 border-t border-neutral-100">
                      {c.classroom && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-neutral-400 shrink-0" />
                          <span>Aula {c.classroom.name} ({c.classroom.location})</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-neutral-400 shrink-0" />
                        <span>
                          <strong>{enrolledCount}</strong> de {c.maxStudents} alumnos inscritos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACCIONES DIRECTAS POR CLASE */}
                  <div className="grid grid-cols-2 gap-2 pt-4 mt-3 border-t border-neutral-100">
                    <Link href="/teacher/attendance" className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 rounded-xl text-xs font-bold border-neutral-200 hover:bg-neutral-50 text-neutral-800 shadow-2xs"
                      >
                        <CalendarCheck2 className="size-3.5 mr-1 text-neutral-600" />
                        <span>Asistencia</span>
                      </Button>
                    </Link>

                    <Link href="/teacher/grading" className="w-full">
                      <Button
                        type="button"
                        className="w-full h-10 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white shadow-2xs"
                      >
                        <Award className="size-3.5 mr-1 text-lime-400" />
                        <span>Calificar</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
