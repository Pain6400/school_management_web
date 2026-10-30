"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { parentService, WardRelationship } from "@/lib/services/parent.service";
import { StudentDetailedExpediente, studentsService } from "@/lib/services/api.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Printer,
  Sparkles,
  Loader2,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Bell,
  Pin,
  Megaphone,
  Eye,
  ExternalLink,
  Share2,
  Building,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  communicationService,
  Announcement,
} from "@/lib/services/communication.service";

export default function ParentPortalPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "resumen";

  const [activeTab, setActiveTab] = useState<"resumen" | "calificaciones" | "asistencia" | "finanzas" | "expediente" | "avisos">(
    (initialTab as any) || "resumen"
  );
  const [wards, setWards] = useState<WardRelationship[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [wardExpediente, setWardExpediente] = useState<StudentDetailedExpediente | null>(null);
  const [isLoadingWards, setIsLoadingWards] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Anuncios y circulares dirigidas a familias
  const [parentAnnouncements, setParentAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [selectedAnnouncementForReading, setSelectedAnnouncementForReading] = useState<Announcement | null>(null);
  const [isReadingOpen, setIsReadingOpen] = useState(false);

  // Sincronizar tab con URL searchParams si cambia
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["resumen", "calificaciones", "asistencia", "finanzas", "expediente", "avisos"].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Cargar anuncios oficiales para familias
  useEffect(() => {
    async function loadAnnouncements() {
      try {
        setIsLoadingAnnouncements(true);
        const schoolCode = user?.schoolCode || "ESC002";
        const res = await communicationService.getAnnouncements({
          schoolCode,
          targetAudience: "PARENTS",
        });
        if (res && res.data) {
          setParentAnnouncements(res.data);
        }
      } catch (err) {
        console.error("Error loading parent announcements:", err);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    }
    loadAnnouncements();
  }, [user]);

  // 1. Cargar la lista de hijos/tutelados del tutor autenticado
  useEffect(() => {
    async function fetchWards() {
      if (!user) return;
      try {
        setIsLoadingWards(true);
        setLoadError(null);

        // Si el usuario tiene parentId en su sesión o publicId
        const parentId = user.sub || (user as any).publicId;
        let relationships: WardRelationship[] = [];

        if (parentId) {
          const res = await parentService.getWardsByParentId(parentId);
          if (res && res.data && res.data.length > 0) {
            relationships = res.data.filter((r) => r.student !== null);
          }
        }

        // Si no tiene tutelados (o es admin probando el portal), cargamos estudiantes muestra
        if (relationships.length === 0) {
          const sampleStudentsRes = await studentsService.getStudents({ status: "true" });
          if (sampleStudentsRes && sampleStudentsRes.data && sampleStudentsRes.data.length > 0) {
            relationships = sampleStudentsRes.data.slice(0, 3).map((stu, idx) => ({
              studentId: stu.publicId,
              parentId: parentId || "sample-parent",
              relationship: idx === 0 ? "MADRE" : "TUTOR LEGAL",
              isPrimary: idx === 0,
              canViewGrades: true,
              canReceiveNotifications: true,
              student: stu as any,
              parent: user as any,
            }));
          }
        }

        setWards(relationships);
        if (relationships.length > 0) {
          setSelectedWardId(relationships[0].studentId);
        }
      } catch (err: any) {
        console.error("Error loading parent wards:", err);
        setLoadError(err.message || "No se pudieron cargar los tutelados asignados.");
      } finally {
        setIsLoadingWards(false);
      }
    }

    fetchWards();
  }, [user]);

  // 2. Cargar el expediente completo del hijo seleccionado
  useEffect(() => {
    async function loadWardDetails() {
      if (!selectedWardId) return;
      try {
        setIsLoadingDetails(true);
        const res = await parentService.getWardDetails(selectedWardId);
        if (res && res.data) {
          setWardExpediente(res.data);
        }
      } catch (err: any) {
        console.error("Error loading ward details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadWardDetails();
  }, [selectedWardId]);

  // Alumno y datos actualmente seleccionados
  const activeWardRel = useMemo(() => {
    return wards.find((w) => w.studentId === selectedWardId) || wards[0] || null;
  }, [wards, selectedWardId]);

  const student = wardExpediente?.student || activeWardRel?.student || null;
  const currentEnrollment = wardExpediente?.annualEnrollments?.[0];
  const classEnrollments = wardExpediente?.classEnrollments || [];
  const submissions = wardExpediente?.assignmentsSubmissions || [];
  const attendanceRecords = wardExpediente?.attendanceRecords || [];
  const invoices = wardExpediente?.invoices || [];
  const payments = wardExpediente?.payments || [];

  // Cálculos estadísticos
  const attendanceRate = useMemo(() => {
    if (attendanceRecords.length === 0) return 100;
    const present = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    return Math.round((present / attendanceRecords.length) * 100);
  }, [attendanceRecords]);

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;

  const outstandingBalance = useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== "PAID" && inv.status !== "PAGADA")
      .reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
  }, [invoices]);

  const gradesAverage = useMemo(() => {
    const scores = submissions.map((s) => Number(s.score)).filter((s) => !isNaN(s) && s > 0);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [submissions]);

  // Horario del día (clases de hoy)
  const todayClasses = useMemo(() => {
    const daysMap = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
    const currentDay = daysMap[new Date().getDay()];
    return classEnrollments.filter((ce) => {
      const scheduleDays = ce.schedule?.days || ["LUN", "MAR", "MIE", "JUE", "VIE"];
      return scheduleDays.includes(currentDay);
    });
  }, [classEnrollments]);

  if (isLoadingWards) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="size-10 animate-spin text-neutral-900" />
        <p className="text-sm font-semibold text-neutral-600">Cargando Portal de la Familia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================== */}
      {/* TOP PORTAL BAR: SALUDO & SELECTOR DINÁMICO DE HIJOS (STYLE CODECLOVE) */}
      {/* ============================================================== */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-lime-700 bg-lime-100 px-2.5 py-0.5 rounded-md">
              Portal de la Familia
            </span>
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">•</span>
            <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
              Supervisión académica, financiera y asistencias
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
            Bienvenido, {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.username || "Tutor"}
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Estás consultando el expediente oficial de tu tutelado en tiempo real.
          </p>
        </div>

        {/* SELECTOR DINÁMICO DE HIJOS (DROPDOWN INTERACTIVO) */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
              Tutelado Seleccionado
            </p>
            <p className="text-xs font-bold text-neutral-900">
              {wards.length} Estudiante{wards.length > 1 ? "s" : ""} a tu cargo
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="h-12 px-4 rounded-2xl border-2 border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 flex items-center gap-3 shadow-sm transition-all cursor-pointer select-none active:scale-[0.98]"
                >
                  <div className="size-8 rounded-xl bg-lime-400 text-neutral-950 flex items-center justify-center font-black text-xs">
                    {student?.firstName?.charAt(0) || "A"}
                  </div>
                  <div className="text-left pr-1">
                    <p className="text-xs font-black leading-tight truncate max-w-[170px]">
                      {student ? `${student.firstName} ${student.lastName}` : "Seleccionar Alumno"}
                    </p>
                    <p className="text-[10px] text-lime-300/90 font-semibold truncate max-w-[170px]">
                      {activeWardRel?.relationship || "Hijo"} • {currentEnrollment?.gradeCode || "En Curso"}
                    </p>
                  </div>
                  <ChevronDown className="size-4 text-lime-400 shrink-0 ml-1" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-72 p-2 rounded-2xl shadow-2xl border-neutral-200">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-2 py-1">
                Cambiar de Alumno a Cargo
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <div className="space-y-1">
                {wards.map((rel) => {
                  const s = rel.student;
                  const isSelected = s?.publicId === selectedWardId;
                  return (
                    <DropdownMenuItem
                      key={rel.studentId}
                      onClick={() => setSelectedWardId(rel.studentId)}
                      className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                        isSelected ? "bg-neutral-100 font-bold" : "hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected ? "bg-neutral-950 text-lime-400" : "bg-neutral-200 text-neutral-700"
                          }`}
                        >
                          {s?.firstName?.charAt(0) || "E"}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-neutral-900 leading-tight">
                            {s?.firstName} {s?.lastName}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-medium">
                            {rel.relationship} • ID: {s?.identityNumber || "S/N"}
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="size-4 text-lime-600 shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4 TARJETAS KPI RESUMEN EJECUTIVO (ESTILO CODECLOVE PORTAL) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Asistencia */}
        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Asistencia Global
            </span>
            <div className="size-8 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {attendanceRate}%
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {presentCount} presentes • {absentCount} inasistencias
          </p>
        </Card>

        {/* Asignaturas Activas */}
        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Asignaturas en Curso
            </span>
            <div className="size-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {classEnrollments.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Materias registradas este ciclo
          </p>
        </Card>

        {/* Estado Financiero */}
        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Estado Financiero
            </span>
            <div
              className={`size-8 rounded-xl flex items-center justify-center ${
                outstandingBalance > 0 ? "bg-amber-100 text-amber-800" : "bg-lime-100 text-lime-800"
              }`}
            >
              <CreditCard className="size-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black mt-2 ${
              outstandingBalance > 0 ? "text-amber-600" : "text-neutral-900"
            }`}
          >
            {outstandingBalance > 0 ? `$${outstandingBalance.toFixed(2)}` : "Al día"}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {outstandingBalance > 0 ? "Saldo pendiente de colegiatura" : "Sin pagos vencidos"}
          </p>
        </Card>

        {/* Promedio General */}
        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Promedio General
            </span>
            <div className="size-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Award className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {gradesAverage !== null ? `${gradesAverage.toFixed(1)}%` : "—"}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {gradesAverage !== null ? "Rendimiento evaluado" : "Sin notas registradas aún"}
          </p>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* BARRA DE PESTAÑAS ERGONÓMICA */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-200/60 border border-neutral-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("resumen")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "resumen" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Clock className="size-3.5" />
          <span>Agenda & Horario</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calificaciones")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "calificaciones"
              ? "bg-white text-neutral-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Award className="size-3.5" />
          <span>Calificaciones & Tareas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("asistencia")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "asistencia" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Calendar className="size-3.5" />
          <span>Historial de Asistencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("finanzas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "finanzas" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <CreditCard className="size-3.5" />
          <span>Colegiaturas & Pagos</span>
          {outstandingBalance > 0 && (
            <span className="size-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expediente")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "expediente" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Ficha del Alumno</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("avisos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "avisos" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <Bell className="size-3.5" />
          <span>Avisos & Circulares</span>
          {parentAnnouncements.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-neutral-950 text-lime-400 text-[10px] font-black">
              {parentAnnouncements.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* CONTENIDO DE PESTAÑA: AGENDA & HORARIO */}
      {/* ============================================================== */}
      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Horario de Clases del Día */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-6 rounded-3xl bg-white border-neutral-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-neutral-950 text-lime-400 flex items-center justify-center font-bold">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">
                      Horario de Clases de Hoy (Today's Schedule)
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Horas de clase programadas para {student?.firstName}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-neutral-600">
                  {todayClasses.length} Bloques de Clase
                </Badge>
              </div>

              {todayClasses.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  No hay clases programadas para el día de hoy según el horario oficial.
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((clase, idx) => (
                    <div
                      key={clase.id || idx}
                      className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 hover:bg-white transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-xl bg-neutral-900 text-lime-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {clase.schedule?.start || `0${idx + 8}:00`}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900">
                            {clase.courseName || clase.className || "Asignatura"}
                          </h4>
                          <p className="text-xs text-neutral-500 font-medium">
                            Docente: {clase.teacherFirstName ? `${clase.teacherFirstName} ${clase.teacherLastName || ""}` : "Profesor Asignado"}
                            {clase.classroomName ? ` • Aula: ${clase.classroomName}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-lime-100 text-lime-800 border-lime-300 text-[10px] font-bold">
                        Activa
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Próximas Tareas y Tareas Entregadas */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 rounded-3xl bg-white border-neutral-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-lime-600" />
                  <span>Tareas Recientes</span>
                </h4>
                <span className="text-[10px] font-bold text-neutral-400 font-mono">
                  {submissions.length} Registradas
                </span>
              </div>

              {submissions.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-6">
                  No hay tareas registradas para este período.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {submissions.slice(0, 5).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl border border-neutral-100 bg-neutral-50 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900 truncate max-w-[180px]">
                          {sub.assignmentTitle || "Tarea de Curso"}
                        </span>
                        {sub.score !== undefined ? (
                          <Badge className="bg-lime-100 text-lime-900 text-[10px] font-mono font-bold">
                            {sub.score} pts
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-neutral-500">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 font-medium">
                        {sub.courseName || "Asignatura"} • Entrega: {sub.dueDate ? sub.dueDate.split("T")[0] : "Sin fecha"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONTENIDO DE PESTAÑA: CALIFICACIONES & BOLETÍN */}
      {/* ============================================================== */}
      {activeTab === "calificaciones" && (
        <Card className="p-6 rounded-3xl bg-white border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Boletín de Calificaciones de {student?.firstName} {student?.lastName}
              </h3>
              <p className="text-xs text-neutral-500">
                Evaluaciones acumuladas por materia en el ciclo escolar actual
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>Imprimir Boletín</span>
            </Button>
          </div>

          {classEnrollments.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8">
              El alumno no tiene asignaturas inscritas en este ciclo.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {classEnrollments.map((clase) => (
                <div key={clase.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">
                      {clase.courseName || clase.className}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-medium">
                      Profesor: {clase.teacherFirstName ? `${clase.teacherFirstName} ${clase.teacherLastName || ""}` : "Titular"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-neutral-900">
                      {clase.finalGrade !== undefined ? `${clase.finalGrade}%` : "En curso"}
                    </span>
                    <Badge
                      className={`text-[10px] font-bold ${
                        clase.finalGrade && clase.finalGrade >= 70
                          ? "bg-lime-100 text-lime-900"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {clase.finalGrade && clase.finalGrade >= 70 ? "Aprobando" : "Regular"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ============================================================== */}
      {/* CONTENIDO DE PESTAÑA: ASISTENCIA */}
      {/* ============================================================== */}
      {activeTab === "asistencia" && (
        <Card className="p-6 rounded-3xl bg-white border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Registro Diario de Asistencias</h3>
              <p className="text-xs text-neutral-500">Historial completo de asistencias, faltas y tardanzas</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-lime-700 bg-lime-100 px-2.5 py-1 rounded-lg">
                {attendanceRate}% Asistencia Acumulada
              </span>
            </div>
          </div>

          {attendanceRecords.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8">
              No hay registros de asistencia archivados para este estudiante.
            </p>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((att) => (
                <div
                  key={att.id}
                  className="p-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        att.status === "PRESENT"
                          ? "bg-lime-100 text-lime-900"
                          : att.status === "LATE"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-900"
                      }`}
                    >
                      {att.status === "PRESENT" ? "P" : att.status === "LATE" ? "T" : "A"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">
                        {att.date ? att.date.split("T")[0] : "Fecha"}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-medium">
                        {att.className || att.courseName || "Jornada Completa"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`text-[10px] font-bold ${
                      att.status === "PRESENT"
                        ? "bg-lime-100 text-lime-900"
                        : att.status === "LATE"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-red-100 text-red-900"
                    }`}
                  >
                    {att.status === "PRESENT"
                      ? "Presente"
                      : att.status === "LATE"
                      ? "Tardanza"
                      : "Ausente"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ============================================================== */}
      {/* CONTENIDO DE PESTAÑA: FINANZAS & PAGOS */}
      {/* ============================================================== */}
      {activeTab === "finanzas" && (
        <Card className="p-6 rounded-3xl bg-white border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Estado de Cuenta y Cuotas Escolares</h3>
              <p className="text-xs text-neutral-500">Historial de facturación de colegiaturas y comprobantes</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Total por Cobrar</span>
              <span
                className={`text-base font-black ${
                  outstandingBalance > 0 ? "text-amber-600" : "text-neutral-900"
                }`}
              >
                ${outstandingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {invoices.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-8">
              No hay facturas registradas a nombre del estudiante.
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center">
                      <CreditCard className="size-5 text-lime-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 font-mono">
                        Factura #{inv.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        Emisión: {inv.issueDate ? inv.issueDate.split("T")[0] : "—"} • Vencimiento:{" "}
                        {inv.dueDate ? inv.dueDate.split("T")[0] : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-sm font-black font-mono text-neutral-950">
                      ${Number(inv.totalAmount).toFixed(2)}
                    </span>
                    <Badge
                      className={`text-[10px] font-bold ${
                        inv.status === "PAID" || inv.status === "PAGADA"
                          ? "bg-lime-100 text-lime-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {inv.status === "PAID" || inv.status === "PAGADA" ? "Pagada" : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ============================================================== */}
      {/* CONTENIDO DE PESTAÑA: FICHA DEL ALUMNO */}
      {/* ============================================================== */}
      {activeTab === "expediente" && (
        <Card className="p-6 rounded-3xl bg-white border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Ficha Personal y Residencia</h3>
              <p className="text-xs text-neutral-500">Datos registrados en el expediente escolar</p>
            </div>
            <Link href={`/school/students/${student?.publicId}`}>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1 cursor-pointer">
                <span>Ver Expediente Completo</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Nombre Completo</span>
              <p className="text-xs font-bold text-neutral-900">{student?.firstName} {student?.lastName}</p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Documento de Identidad</span>
              <p className="text-xs font-mono font-bold text-neutral-900">{student?.identityNumber || "Sin Cédula"}</p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Fecha de Nacimiento</span>
              <p className="text-xs font-bold text-neutral-900">
                {student?.dateOfBirth ? student.dateOfBirth.split("T")[0] : "No registrada"}
              </p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Teléfono de Contacto</span>
              <p className="text-xs font-bold text-neutral-900">{student?.phone || "No registrado"}</p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Dirección Residencial</span>
              <p className="text-xs font-bold text-neutral-900">{student?.address || "No especificada"}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ============================================================== */}
      {/* CONTENIDO DE PESTAÑA: AVISOS & CIRCULARES A FAMILIAS */}
      {/* ============================================================== */}
      {activeTab === "avisos" && (
        <div className="space-y-6">
          {/* Encabezado y resumen del muro */}
          <div className="p-6 rounded-3xl bg-neutral-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 bg-lime-950/60 border border-lime-800/60 px-2.5 py-0.5 rounded-md">
                  Muro Oficial de la Escuela
                </span>
                <span className="text-xs text-neutral-400">•</span>
                <span className="text-xs text-neutral-300 font-medium">
                  Centro Educativo Luz del Saber
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Circulares y Notificaciones a la Comunidad Familiar
              </h2>
              <p className="text-xs text-neutral-400 max-w-2xl font-medium">
                Aquí recibirás citatorios oficiales, comunicados de dirección, suspensiones de emergencia y avisos de eventos directamente emitidos por la administración escolar.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <div className="px-3.5 py-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Total Circulares</p>
                <p className="text-lg font-black text-lime-400">{parentAnnouncements.length}</p>
              </div>
              <div className="px-3.5 py-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Urgentes / Fijadas</p>
                <p className="text-lg font-black text-amber-400">
                  {parentAnnouncements.filter((a) => a.isPinned || a.priority === "URGENT").length}
                </p>
              </div>
            </div>
          </div>

          {/* Banner de Aviso Urgente / Destacado si existe */}
          {parentAnnouncements.filter((a) => a.isPinned || a.priority === "URGENT").length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-red-600">
                  Comunicados Oficiales de Alta Prioridad
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parentAnnouncements
                  .filter((a) => a.isPinned || a.priority === "URGENT")
                  .map((notice) => (
                    <Card
                      key={`pinned-${notice.id}`}
                      className="p-5 rounded-3xl border-2 border-red-200 bg-linear-to-br from-red-50/60 via-white to-amber-50/30 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 flex items-center gap-1.5 shadow-xs">
                            <Pin className="size-3 fill-current" />
                            <span>{notice.priority === "URGENT" ? "ALERTA URGENTE" : "FIJADO EN PORTADA"}</span>
                          </Badge>
                          <span className="text-[11px] font-bold text-neutral-500 flex items-center gap-1">
                            <Calendar className="size-3 text-neutral-400" />
                            {notice.publishDate ? notice.publishDate.split("T")[0] : "Hoy"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-neutral-950 leading-snug">
                            {notice.title}
                          </h4>
                          <p className="text-xs text-neutral-600 font-normal line-clamp-3 mt-1.5 leading-relaxed">
                            {notice.content}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-red-100/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-neutral-500">
                          {notice.targetAudience === "PARENTS" ? "Exclusivo para Padres" : "Toda la Comunidad"}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAnnouncementForReading(notice);
                            setIsReadingOpen(true);
                          }}
                          className="rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer gap-1.5"
                        >
                          <Eye className="size-3.5" />
                          <span>Leer Circular</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Listado Completo de Anuncios */}
          <Card className="p-6 rounded-3xl bg-white border-neutral-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Historial de Circulares y Notificaciones</h3>
                <p className="text-xs text-neutral-500">
                  Documentos oficiales emitidos durante el presente ciclo escolar
                </p>
              </div>
              <span className="text-xs font-bold text-neutral-400">
                {parentAnnouncements.length} comunicados
              </span>
            </div>

            {isLoadingAnnouncements ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-neutral-400">
                <Loader2 className="size-8 animate-spin text-neutral-900" />
                <p className="text-xs font-semibold">Cargando circulares oficiales...</p>
              </div>
            ) : parentAnnouncements.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Megaphone className="size-10 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-neutral-700">No hay circulares pendientes</p>
                <p className="text-xs text-neutral-500">
                  La institución no ha publicado avisos dirigidos a tutores en este momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {parentAnnouncements.map((item) => {
                  const typeLabel =
                    item.type === "URGENT"
                      ? "Urgente"
                      : item.type === "MEETING"
                      ? "Reunión de Padres"
                      : item.type === "ACADEMIC"
                      ? "Académico"
                      : item.type === "EVENT"
                      ? "Evento"
                      : "General";

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl border border-neutral-200/80 hover:border-neutral-300 hover:shadow-xs transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-bold ${
                              item.type === "URGENT"
                                ? "bg-red-100 text-red-800"
                                : item.type === "MEETING"
                                ? "bg-purple-100 text-purple-800"
                                : item.type === "ACADEMIC"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {typeLabel}
                          </Badge>
                          {item.isPinned && (
                            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold">
                              Fijado
                            </Badge>
                          )}
                          <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                            <Clock className="size-3" />
                            {item.publishDate ? item.publishDate.split("T")[0] : "Reciente"}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-neutral-900 leading-snug">
                          {item.title}
                        </h4>

                        <p className="text-xs text-neutral-600 line-clamp-2 font-normal leading-relaxed">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAnnouncementForReading(item);
                            setIsReadingOpen(true);
                          }}
                          className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer hover:bg-neutral-100"
                        >
                          <Eye className="size-3.5" />
                          <span>Ver Comunicado</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL LECTOR OFICIAL DE CIRCULAR ESCOLAR (VISTA FAMILIA) */}
      {/* ============================================================== */}
      <Dialog open={isReadingOpen} onOpenChange={setIsReadingOpen}>
        <DialogContent size="lg" className="p-0 overflow-hidden rounded-3xl">
          {/* Membrete institucional oficial */}
          <div className="bg-neutral-950 text-white p-6 sm:p-7 border-b border-neutral-800">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-lime-400 text-neutral-950 flex items-center justify-center font-black text-base shadow-sm">
                  ESC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-lime-400">
                      Comunicación Oficial
                    </span>
                    <span className="text-xs text-neutral-500">•</span>
                    <span className="text-xs text-neutral-300 font-medium">ESC002</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Centro Educativo Luz del Saber
                  </h3>
                </div>
              </div>

              <Badge
                className={`text-[10px] font-bold ${
                  selectedAnnouncementForReading?.priority === "URGENT"
                    ? "bg-red-500 text-white"
                    : selectedAnnouncementForReading?.type === "MEETING"
                    ? "bg-purple-500 text-white"
                    : "bg-neutral-800 text-neutral-200"
                }`}
              >
                {selectedAnnouncementForReading?.type || "CIRCULAR"}
              </Badge>
            </div>
          </div>

          <DialogBody className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2 border-b border-neutral-100 pb-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Fecha de Emisión:{" "}
                {selectedAnnouncementForReading?.publishDate
                  ? selectedAnnouncementForReading.publishDate.split("T")[0]
                  : "Fecha Oficial"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-950 leading-tight">
                {selectedAnnouncementForReading?.title}
              </h2>
              <div className="flex items-center gap-2 pt-1 text-xs text-neutral-500">
                <Users className="size-3.5 text-neutral-400" />
                <span>
                  Destinatarios:{" "}
                  <strong className="text-neutral-700">
                    {selectedAnnouncementForReading?.targetAudience === "PARENTS"
                      ? "Padres de Familia y Tutores Legales"
                      : selectedAnnouncementForReading?.targetAudience === "STUDENTS"
                      ? "Cuerpo Estudiantil"
                      : "Toda la Comunidad Educativa"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Contenido íntegro de la circular */}
            <div className="space-y-4 text-sm text-neutral-800 leading-relaxed font-normal whitespace-pre-line bg-neutral-50/70 p-5 rounded-2xl border border-neutral-100">
              {selectedAnnouncementForReading?.content}
            </div>

            {/* Firma institucional */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-500">
              <div>
                <p className="font-bold text-neutral-800">Dirección y Secretaría Académica</p>
                <p>Centro Educativo Luz del Saber • Código ESC002</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex items-center gap-1 text-lime-700 bg-lime-50 border border-lime-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  <CheckCircle2 className="size-3" />
                  Documento Verificado y Válido
                </span>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-200/80 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="rounded-xl text-xs font-bold gap-2 cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>Imprimir Circular</span>
            </Button>

            <Button
              type="button"
              onClick={() => setIsReadingOpen(false)}
              className="rounded-xl text-xs font-bold bg-neutral-950 text-white hover:bg-neutral-800 cursor-pointer px-5"
            >
              Entendido / Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
