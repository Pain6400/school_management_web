"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  Building,
  Printer,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Layers,
  DoorOpen,
  MapPin,
  RefreshCw,
  Search,
  Eye,
  Plus,
} from "lucide-react";
import {
  academicsService,
  Class,
  Grade,
  Classroom,
  Course,
} from "@/lib/services/academics.service";

// Días escolares estándar
const DAYS = [
  { key: "LUNES", label: "Lunes", short: "LUN", aliases: ["LUNES", "LUN", "MON", "MONDAY"] },
  { key: "MARTES", label: "Martes", short: "MAR", aliases: ["MARTES", "MAR", "TUE", "TUESDAY"] },
  { key: "MIERCOLES", label: "Miércoles", short: "MIE", aliases: ["MIERCOLES", "MIÉRCOLES", "MIE", "WED", "WEDNESDAY"] },
  { key: "JUEVES", label: "Jueves", short: "JUE", aliases: ["JUEVES", "JUE", "THU", "THURSDAY"] },
  { key: "VIERNES", label: "Viernes", short: "VIE", aliases: ["VIERNES", "VIE", "FRI", "FRIDAY"] },
  { key: "SABADO", label: "Sábado", short: "SAB", aliases: ["SABADO", "SÁBADO", "SAB", "SAT", "SATURDAY"] },
];

// Bloques horarios estándar de la jornada escolar
interface TimeSlot {
  id: string;
  name: string;
  start: string;
  end: string;
  isBreak?: boolean;
}

const DEFAULT_SLOTS: TimeSlot[] = [
  { id: "slot-1", name: "1° Período", start: "07:00", end: "08:30" },
  { id: "break-1", name: "Receso Matutino", start: "08:30", end: "08:45", isBreak: true },
  { id: "slot-2", name: "2° Período", start: "08:45", end: "10:00" },
  { id: "break-2", name: "Recreo Principal", start: "10:00", end: "10:30", isBreak: true },
  { id: "slot-3", name: "3° Período", start: "10:30", end: "12:00" },
  { id: "break-3", name: "Almuerzo Institucional", start: "12:00", end: "12:45", isBreak: true },
  { id: "slot-4", name: "4° Período", start: "12:45", end: "14:15" },
];

// Colores pasteles para asignaturas
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MAT: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
  ESP: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-300 dark:border-amber-700" },
  CN: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
  CS: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700" },
  ING: { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-300 dark:border-cyan-700" },
  TEC: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-300 dark:border-rose-700" },
  EF: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
};

function getSubjectStyle(code?: string, name?: string) {
  const c = (code || name || "").toUpperCase();
  if (c.includes("MAT")) return SUBJECT_COLORS.MAT;
  if (c.includes("ESP") || c.includes("LENG")) return SUBJECT_COLORS.ESP;
  if (c.includes("CN") || c.includes("CIENC") || c.includes("NAT")) return SUBJECT_COLORS.CN;
  if (c.includes("CS") || c.includes("SOC") || c.includes("HIST")) return SUBJECT_COLORS.CS;
  if (c.includes("ING") || c.includes("ENG")) return SUBJECT_COLORS.ING;
  if (c.includes("TEC") || c.includes("ROB") || c.includes("COMP")) return SUBJECT_COLORS.TEC;
  if (c.includes("EF") || c.includes("DEP") || c.includes("FIS")) return SUBJECT_COLORS.EF;
  return { bg: "bg-slate-50 dark:bg-slate-800/50", text: "text-slate-800 dark:text-slate-200", border: "border-slate-300 dark:border-slate-700" };
}

export default function TimetablePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Modos de visualización
  const [viewMode, setViewMode] = useState<"grade" | "teacher" | "classroom" | "all">("grade");
  const [selectedGradeCode, setSelectedGradeCode] = useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("ALL");
  const [selectedClassroomCode, setSelectedClassroomCode] = useState<string>("ALL");
  const [showSaturday, setShowSaturday] = useState(false);

  // Detalle de clase seleccionada
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Carga de datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [classesRes, gradesRes, classroomsRes] = await Promise.all([
        academicsService.getClasses(),
        academicsService.getGrades(),
        academicsService.getClassrooms(),
      ]);

      if (classesRes?.data) setClasses(classesRes.data);
      if (gradesRes?.data) {
        setGrades(gradesRes.data);
        if (gradesRes.data.length > 0 && selectedGradeCode === "ALL") {
          setSelectedGradeCode(gradesRes.data[0].code);
        }
      }
      if (classroomsRes?.data) setClassrooms(classroomsRes.data);
    } catch (err) {
      console.error("Error al cargar datos del horario:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lista única de docentes extraída de las clases
  const teachersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    classes.forEach((c) => {
      if (c.teacherId && c.teacher) {
        const name = `${c.teacher.firstName} ${c.teacher.lastName || ""}`.trim();
        map.set(c.teacherId, { id: c.teacherId, name });
      }
    });
    return Array.from(map.values());
  }, [classes]);

  // Días activos a mostrar
  const activeDays = useMemo(() => {
    return showSaturday ? DAYS : DAYS.filter((d) => d.key !== "SABADO");
  }, [showSaturday]);

  // Clases filtradas según el modo seleccionado
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (viewMode === "grade") {
        if (selectedGradeCode !== "ALL" && c.gradeCode !== selectedGradeCode) {
          return false;
        }
      } else if (viewMode === "teacher") {
        if (selectedTeacherId !== "ALL" && c.teacherId !== selectedTeacherId) {
          return false;
        }
      } else if (viewMode === "classroom") {
        if (selectedClassroomCode !== "ALL" && c.classroomCode !== selectedClassroomCode) {
          return false;
        }
      }
      return true;
    });
  }, [classes, viewMode, selectedGradeCode, selectedTeacherId, selectedClassroomCode]);

  // Función para determinar si una clase cae en un día específico
  const classIsInDay = (c: Class, dayKey: string): boolean => {
    if (!c.schedule || !c.schedule.days || !Array.isArray(c.schedule.days)) {
      return false;
    }
    const dayObj = DAYS.find((d) => d.key === dayKey);
    if (!dayObj) return false;

    return c.schedule.days.some((schedDay: string) => {
      const clean = schedDay.trim().toUpperCase();
      return dayObj.aliases.includes(clean);
    });
  };

  // Función para determinar si la clase se solapa con un slot horario
  const classMatchesSlot = (c: Class, slot: TimeSlot): boolean => {
    if (slot.isBreak) return false;
    const start = c.schedule?.start_time || c.schedule?.start || "08:00";
    const end = c.schedule?.end_time || c.schedule?.end || "09:00";

    // Si la hora de inicio de la clase coincide o cae dentro del bloque
    return start <= slot.start && end >= slot.end ||
      start >= slot.start && start < slot.end ||
      end > slot.start && end <= slot.end;
  };

  // Detectar conflictos o colisiones
  const conflictsCount = useMemo(() => {
    let count = 0;
    // Agrupar por aula y día
    const roomDayMap = new Map<string, Class[]>();
    classes.forEach((c) => {
      if (!c.classroomCode || !c.schedule?.days) return;
      c.schedule.days.forEach((day: string) => {
        const key = `${c.classroomCode}_${day}_${c.schedule?.start_time || c.schedule?.start}`;
        if (!roomDayMap.has(key)) roomDayMap.set(key, []);
        roomDayMap.get(key)!.push(c);
      });
    });

    roomDayMap.forEach((classList) => {
      if (classList.length > 1) {
        count += classList.length - 1;
      }
    });

    return count;
  }, [classes]);

  // Obtener el día actual para destacar columna
  const currentDayIndex = new Date().getDay(); // 0 Dom, 1 Lun, 2 Mar, 3 Mie, 4 Jue, 5 Vie, 6 Sab
  const currentDayKey =
    currentDayIndex === 1 ? "LUNES" :
      currentDayIndex === 2 ? "MARTES" :
        currentDayIndex === 3 ? "MIERCOLES" :
          currentDayIndex === 4 ? "JUEVES" :
            currentDayIndex === 5 ? "VIERNES" :
              currentDayIndex === 6 ? "SABADO" : "";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  Horario Semanal Interactivo
                </h1>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold border-0 text-xs">
                  Timetable Grid
                </Badge>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Visualizador matricial de distribución de materias, ocupación física de aulas y carga académica docente.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaturday(!showSaturday)}
            className="rounded-xl text-xs font-semibold"
          >
            {showSaturday ? "Ocultar Sábado" : "+ Incluir Sábado"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Horario</span>
          </Button>

          <Button
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* BARRA DE MODOS Y SELECTORES DE FILTRO */}
      <Card className="p-4 rounded-3xl shadow-sm border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Selector de Modo de Vista */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl gap-1 overflow-x-auto">
            <button
              data-testid="mode-tab-grade"
              onClick={() => setViewMode("grade")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${viewMode === "grade"
                  ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Por Grado Escolar</span>
            </button>

            <button
              data-testid="mode-tab-teacher"
              onClick={() => setViewMode("teacher")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${viewMode === "teacher"
                  ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Por Docente</span>
            </button>

            <button
              data-testid="mode-tab-classroom"
              onClick={() => setViewMode("classroom")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${viewMode === "classroom"
                  ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Por Aula Física</span>
            </button>

            <button
              data-testid="mode-tab-all"
              onClick={() => setViewMode("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${viewMode === "all"
                  ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visión Global</span>
            </button>
          </div>

          {/* Menú Desplegable Contextual según Modo */}
          <div className="flex items-center gap-3">
            {viewMode === "grade" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">Grado:</span>
                <select
                  value={selectedGradeCode}
                  onChange={(e) => setSelectedGradeCode(e.target.value)}
                  className="h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todos los Grados</option>
                  {grades.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {viewMode === "teacher" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">Docente:</span>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todos los Docentes</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {viewMode === "classroom" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">Aula:</span>
                <select
                  value={selectedClassroomCode}
                  onChange={(e) => setSelectedClassroomCode(e.target.value)}
                  className="h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todas las Aulas</option>
                  {classrooms.map((cr) => (
                    <option key={cr.code} value={cr.code}>
                      {cr.name} ({cr.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Alerta de Colisión / Conflicto si existe */}
            {conflictsCount > 0 ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs flex items-center gap-1 py-1.5 px-3 rounded-xl font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{conflictsCount} conflicto(s) de aula</span>
              </Badge>
            ) : (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-1 py-1.5 px-3 rounded-xl font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sin conflictos</span>
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* TIMETABLE GRID MATRIX */}
      <Card className="rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-neutral-500 font-medium">Cargando matriz semanal de horarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              {/* ENCABEZADO DE DÍAS */}
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50">
                  <th className="w-32 py-4 px-4 text-left font-bold text-xs uppercase tracking-wider text-neutral-400 border-r border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Bloque</span>
                    </div>
                  </th>
                  {activeDays.map((day) => {
                    const isToday = day.key === currentDayKey;
                    return (
                      <th
                        key={day.key}
                        className={`py-4 px-3 text-center border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 ${isToday
                            ? "bg-blue-50/60 dark:bg-blue-950/30"
                            : ""
                          }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? "text-blue-600 dark:text-blue-400 font-black" : "text-neutral-700 dark:text-neutral-300"
                            }`}>
                            {day.label}
                          </span>
                          {isToday && (
                            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                              (Hoy)
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* FILAS DE HORAS Y CELDAS DE ASIGNATURAS */}
              <tbody>
                {DEFAULT_SLOTS.map((slot) => {
                  if (slot.isBreak) {
                    return (
                      <tr
                        key={slot.id}
                        className="bg-neutral-100/60 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800"
                      >
                        <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-neutral-400 border-r border-neutral-200 dark:border-neutral-800">
                          {slot.start} - {slot.end}
                        </td>
                        <td
                          colSpan={activeDays.length}
                          className="py-2.5 px-4 text-center text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
                        >
                          ☕ {slot.name} ({slot.start} - {slot.end})
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={slot.id}
                      className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50/30 transition-colors"
                    >
                      {/* COLUMNA DE TIEMPO */}
                      <td className="py-4 px-4 border-r border-neutral-200 dark:border-neutral-800 align-top">
                        <div className="space-y-1">
                          <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white block">
                            {slot.start}
                          </span>
                          <span className="font-mono text-[11px] text-neutral-400 block">
                            {slot.end}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-semibold text-neutral-500 px-1.5 py-0 rounded">
                            {slot.name}
                          </Badge>
                        </div>
                      </td>

                      {/* CELDAS POR CADA DÍA */}
                      {activeDays.map((day) => {
                        const isToday = day.key === currentDayKey;
                        // Clases que tocan este día y este slot
                        const dayClasses = filteredClasses.filter(
                          (c) => classIsInDay(c, day.key) && classMatchesSlot(c, slot)
                        );

                        return (
                          <td
                            key={day.key}
                            className={`p-2.5 border-r border-neutral-200 dark:border-neutral-800 last:border-r-0 align-top h-32 transition-colors ${isToday ? "bg-blue-50/20 dark:bg-blue-950/10" : ""
                              }`}
                          >
                            {dayClasses.length === 0 ? (
                              <div className="h-full w-full rounded-2xl border border-dashed border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center group hover:border-neutral-300">
                                <span className="text-[11px] text-neutral-300 dark:text-neutral-700 font-medium group-hover:text-neutral-400 transition-colors">
                                  Libre
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {dayClasses.map((item) => {
                                  const style = getSubjectStyle(item.courseCode, item.name);
                                  return (
                                    <button
                                      type="button"
                                      key={item.code}
                                      onClick={() => {
                                        setSelectedClass(item);
                                        setIsDetailOpen(true);
                                      }}
                                      data-testid={`class-card-${item.code}-${day.key}`}
                                      className={`w-full text-left p-3 rounded-2xl border ${style.border} ${style.bg} transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer group`}
                                    >
                                      {/* Cabecera de la Tarjeta */}
                                      <div className="flex items-center justify-between gap-1 mb-1.5">
                                        <Badge
                                          className={`text-[10px] font-black px-2 py-0.5 rounded-lg border-0 ${style.text} bg-white/70 dark:bg-neutral-900/70`}
                                        >
                                          {item.grade?.name || item.gradeCode || "Primaria"}
                                        </Badge>
                                        <span className="font-mono text-[10px] text-neutral-400">
                                          {item.schedule?.start_time || item.schedule?.start}
                                        </span>
                                      </div>

                                      {/* Título de la Materia */}
                                      <h4 className="font-extrabold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                        {item.course?.name || item.name}
                                      </h4>

                                      {/* Detalles: Docente y Aula */}
                                      <div className="mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                                          <Users className="w-3 h-3 text-neutral-400 shrink-0" />
                                          <span className="truncate font-medium">
                                            {item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName || ""}` : "Por asignar"}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                                          <DoorOpen className="w-3 h-3 text-neutral-400 shrink-0" />
                                          <span className="truncate">
                                            {item.classroom?.name || item.classroomCode || "Aula regular"}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* LEYENDA Y RESUMEN INFERIOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 rounded-2xl border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-bold uppercase tracking-wider">Total Materias</span>
            <strong className="text-lg font-black text-neutral-900 dark:text-white">
              {classes.length} Clases Programadas
            </strong>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-bold uppercase tracking-wider">Plantel Docente</span>
            <strong className="text-lg font-black text-neutral-900 dark:text-white">
              {teachersList.length} Profesores Asignados
            </strong>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 block font-bold uppercase tracking-wider">Espacios Físicos</span>
            <strong className="text-lg font-black text-neutral-900 dark:text-white">
              {classrooms.length} Aulas Habilitadas
            </strong>
          </div>
        </Card>
      </div>

      {/* DIALOG DE DETALLE DE CLASE */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          {selectedClass && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs font-bold text-blue-600">
                    {selectedClass.code}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 font-semibold text-xs border-0">
                    {selectedClass.status}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  {selectedClass.course?.name || selectedClass.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  {selectedClass.course?.description || "Clase oficial registrada en el plan de estudios."}
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 py-3 text-xs">
                {/* Cuadrícula de Datos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block mb-1">Grado Escolar</span>
                    <strong className="text-neutral-800 dark:text-neutral-200 font-bold">
                      {selectedClass.grade?.name || selectedClass.gradeCode}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block mb-1">Cupo Máximo</span>
                    <strong className="text-neutral-800 dark:text-neutral-200 font-bold">
                      {selectedClass.maxStudents} Estudiantes
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block mb-1">Docente Asignado</span>
                    <strong className="text-neutral-800 dark:text-neutral-200 font-bold">
                      {selectedClass.teacher ? `${selectedClass.teacher.firstName} ${selectedClass.teacher.lastName || ""}` : "No asignado"}
                    </strong>
                    <span className="text-[11px] text-neutral-500 block truncate">
                      {selectedClass.teacher?.email}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block mb-1">Aula / Espacio</span>
                    <strong className="text-neutral-800 dark:text-neutral-200 font-bold">
                      {selectedClass.classroom?.name || selectedClass.classroomCode}
                    </strong>
                    <span className="text-[11px] text-neutral-500 block">
                      {selectedClass.classroom?.location || "Campus Central"}
                    </span>
                  </div>
                </div>

                {/* Días y Horarios */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold text-xs mb-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cronograma Asignado:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedClass.schedule?.days?.map((d: string) => (
                      <Badge key={d} className="bg-blue-600 text-white font-semibold text-[11px]">
                        {d}
                      </Badge>
                    ))}
                    <span className="font-mono font-bold text-blue-900 dark:text-blue-200 text-xs ml-2">
                      {selectedClass.schedule?.start_time || selectedClass.schedule?.start} - {selectedClass.schedule?.end_time || selectedClass.schedule?.end}
                    </span>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="flex items-center justify-between border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl"
                >
                  Cerrar
                </Button>
                <Link href="/school/academics/classes">
                  <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1">
                    <span>Gestionar en Clases</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}