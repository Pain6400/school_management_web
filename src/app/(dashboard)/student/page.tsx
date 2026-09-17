"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogBody, DialogFooter
} from "@/components/ui/dialog";
import {
  GraduationCap, CheckSquare, Calendar, BookOpen, Clock,
  FileText, Award, AlertCircle, CheckCircle2, UploadCloud,
  ExternalLink, MessageSquare, TrendingUp, Sparkles, Filter, Loader2,
  CalendarCheck2, AlertTriangle, XCircle
} from "lucide-react";
import { assignmentsService, Assignment } from "@/lib/services/assignments.service";
import { enrollmentsService, AssignmentSubmission, AttendanceRecord } from "@/lib/services/enrollments.service";

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"assignments" | "grades" | "attendance">("assignments");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de entrega de tarea
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({ fileUrl: "", feedback: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const studentId = user?.sub || "";

  const loadData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [assRes, subRes, attRes] = await Promise.allSettled([
        assignmentsService.getAssignments(),
        enrollmentsService.getSubmissionsByStudent(studentId),
        enrollmentsService.getAttendanceByStudent(studentId),
      ]);

      if (assRes.status === "fulfilled" && assRes.value.status && assRes.value.data) {
        setAssignments(assRes.value.data);
      }
      if (subRes.status === "fulfilled" && subRes.value.status && subRes.value.data) {
        setSubmissions(subRes.value.data);
      }
      if (attRes.status === "fulfilled" && attRes.value.status && attRes.value.data) {
        setAttendance(attRes.value.data);
      }
    } catch (err) {
      console.error("Error al cargar datos del estudiante:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  // Mapa de entregas por assignmentId
  const submissionMap = useMemo(() => {
    const map: Record<number, AssignmentSubmission> = {};
    submissions.forEach((sub) => {
      map[sub.assignmentId] = sub;
    });
    return map;
  }, [submissions]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = assignments.length;
    let submittedCount = 0;
    let gradedCount = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;

    assignments.forEach((a) => {
      const sub = submissionMap[a.id];
      if (sub) {
        submittedCount++;
        if (sub.status === "GRADED" && sub.score != null) {
          gradedCount++;
          totalScore += Number(sub.score);
          maxPossibleScore += Number(a.maxScore || 100);
        }
      }
    });

    const averagePercent = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : null;
    const pendingCount = Math.max(0, total - submittedCount);

    // Asistencia
    const present = attendance.filter((a) => a.status === "PRESENT").length;
    const late = attendance.filter((a) => a.status === "LATE").length;
    const absent = attendance.filter((a) => a.status === "ABSENT").length;
    const excused = attendance.filter((a) => a.status === "EXCUSED").length;
    const totalAtt = attendance.length;
    const attendancePercent = totalAtt > 0 ? Math.round(((present + excused + late * 0.5) / totalAtt) * 100) : 100;

    return {
      total,
      submittedCount,
      gradedCount,
      pendingCount,
      averagePercent,
      present,
      late,
      absent,
      excused,
      totalAtt,
      attendancePercent,
    };
  }, [assignments, submissionMap, attendance]);

  const handleOpenSubmit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const existing = submissionMap[assignment.id];
    setSubmissionForm({
      fileUrl: existing?.fileUrl || "",
      feedback: existing?.feedback || "",
    });
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !studentId) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await enrollmentsService.submitAssignment({
        assignmentId: selectedAssignment.id,
        studentId,
        status: "SUBMITTED",
        feedback: submissionForm.feedback || submissionForm.fileUrl,
      });

      if (res.status) {
        setSubmitSuccess("¡Tarea entregada exitosamente!");
        setTimeout(() => {
          setIsSubmitOpen(false);
          loadData();
        }, 1200);
      } else {
        setSubmitError(res.message || "No se pudo entregar la tarea");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER ESTILO EDUSYS */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="size-16 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-lime-400/20">
            {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "E"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                ¡Hola, {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username}!
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                <Sparkles className="size-3" /> Alumno Activo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Portal Académico Personal • Código Institucional: <span className="font-mono font-bold text-neutral-800">{user?.schoolCode || "EDUSYS"}</span>
            </p>
          </div>
        </div>

        {/* METRICS SUMMARY IN HEADER */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Promedio General</span>
            <span className="text-xl font-black text-neutral-900">
              {metrics.averagePercent != null ? `${metrics.averagePercent}%` : "S/C"}
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Asistencia</span>
            <span className="text-xl font-black text-emerald-600">
              {metrics.attendancePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "assignments"
              ? "bg-neutral-950 text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 border border-neutral-200/80"
          }`}
        >
          <CheckSquare className="size-4" />
          <span>Tareas y Entregas ({metrics.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("grades")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "grades"
              ? "bg-neutral-950 text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 border border-neutral-200/80"
          }`}
        >
          <Award className="size-4" />
          <span>Libreta de Calificaciones ({metrics.gradedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "attendance"
              ? "bg-neutral-950 text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 border border-neutral-200/80"
          }`}
        >
          <Calendar className="size-4" />
          <span>Registro de Asistencia ({metrics.totalAtt})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: TAREAS */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="p-5">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tareas Pendientes</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pendingCount}</div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Requieren tu envío pronto</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Entregadas</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">{metrics.submittedCount}</div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Enviadas a tus docentes</p>
            </Card>

            <Card className="p-5">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Calificadas</span>
              <div className="text-2xl font-black text-lime-600 mt-1">{metrics.gradedCount}</div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Con nota y retroalimentación</p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Listado de Actividades Asignadas</h3>
                <p className="text-xs text-neutral-400">Revisa los objetivos y envía tus respuestas antes de la fecha límite</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-6 animate-spin text-neutral-400" />
                <span className="text-xs text-neutral-400">Cargando tareas...</span>
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 font-medium text-xs">
                No tienes tareas asignadas en este momento.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const sub = submissionMap[a.id];
                  const isGraded = sub?.status === "GRADED";
                  const isSubmitted = sub != null;

                  return (
                    <div
                      key={a.id}
                      className="p-4 sm:p-5 rounded-2xl border border-neutral-200/80 bg-white hover:border-neutral-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-neutral-900">{a.title}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                            {a.classCode || "General"}
                          </span>
                          {isGraded ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                              Nota: {sub.score} / {a.maxScore || 100} pts
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              ✓ Entregada
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Pendiente
                            </span>
                          )}
                        </div>

                        {a.description && (
                          <p className="text-xs text-neutral-600 line-clamp-2">{a.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            Límite: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "Sin fecha"}
                          </span>
                          <span>Puntuación máxima: <strong>{a.maxScore} pts</strong></span>
                        </div>

                        {/* Si el profesor dejó feedback */}
                        {sub?.feedback && isGraded && (
                          <div className="mt-2 p-3 rounded-xl bg-lime-50/70 border border-lime-200/70 text-xs text-lime-900 flex items-start gap-2">
                            <MessageSquare className="size-3.5 shrink-0 mt-0.5 text-lime-700" />
                            <div>
                              <strong className="font-semibold block">Comentario del Profesor:</strong>
                              <span>{sub.feedback}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => handleOpenSubmit(a)}
                          className={`h-11 px-5 rounded-xl text-xs font-bold shadow-2xs ${
                            isSubmitted
                              ? "bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200"
                              : "bg-neutral-950 hover:bg-neutral-800 text-white"
                          }`}
                        >
                          <UploadCloud className="size-3.5 mr-1.5" />
                          <span>{isSubmitted ? "Actualizar Entrega" : "Entregar Tarea"}</span>
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

      {/* TAB CONTENT 2: LIBRETA DE CALIFICACIONES */}
      {activeTab === "grades" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Libreta Oficial de Calificaciones</h3>
              <p className="text-xs text-neutral-400">Puntajes obtenidos en evaluaciones y tareas calificadas por tus profesores</p>
            </div>
          </div>

          {metrics.gradedCount === 0 ? (
            <div className="py-12 text-center text-neutral-400 font-medium text-xs">
              Aún no tienes tareas calificadas en este periodo escolar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 text-neutral-400 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200/80">
                  <tr>
                    <th className="py-3 px-4">Actividad / Tarea</th>
                    <th className="py-3 px-4">Clase / Materia</th>
                    <th className="py-3 px-4 text-center">Nota Obtenida</th>
                    <th className="py-3 px-4 text-center">Rendimiento</th>
                    <th className="py-3 px-4">Retroalimentación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {assignments
                    .filter((a) => submissionMap[a.id]?.status === "GRADED")
                    .map((a) => {
                      const sub = submissionMap[a.id];
                      const score = Number(sub.score || 0);
                      const max = Number(a.maxScore || 100);
                      const percent = Math.round((score / max) * 100);

                      return (
                        <tr key={a.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-neutral-900">{a.title}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded-lg text-neutral-700 font-semibold">
                              {a.classCode || "General"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-sm text-neutral-900">
                            {score} <span className="text-[10px] text-neutral-400 font-normal">/ {max}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                percent >= 80
                                  ? "bg-lime-100 text-lime-800"
                                  : percent >= 60
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {percent}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 italic">
                            {sub.feedback || "Sin comentarios"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT 3: ASISTENCIA */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="p-4 text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Presentes</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">{metrics.present}</div>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Tardanzas</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">{metrics.late}</div>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Ausencias</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">{metrics.absent}</div>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Justificados</span>
              <div className="text-2xl font-black text-neutral-900 mt-1">{metrics.excused}</div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-base font-bold text-neutral-900 mb-3">Historial Cronológico de Asistencias</h3>
            {attendance.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 font-medium text-xs">
                No hay registros de asistencia en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-400 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200/80">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Clase / Asignatura</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {attendance.map((att, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-neutral-900">
                          {new Date(att.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-700">
                          {att.classCode}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                              att.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : att.status === "LATE"
                                ? "bg-amber-100 text-amber-800"
                                : att.status === "ABSENT"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {att.status === "PRESENT"
                              ? "Presente"
                              : att.status === "LATE"
                              ? "Tardanza"
                              : att.status === "ABSENT"
                              ? "Ausente"
                              : "Justificado"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500">
                          {att.notes || "Sin observaciones"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL AMPLIO DE ENTREGA DE TAREA */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entregar Tarea</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title} • {selectedAssignment?.classCode || "General"} (Máx {selectedAssignment?.maxScore || 100} pts)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitTask} className="flex flex-col flex-1">
            <DialogBody>
              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3.5 rounded-xl bg-lime-50 border border-lime-200 text-lime-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-lime-600" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              {selectedAssignment?.instructions && (
                <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-4 text-xs text-neutral-700 space-y-1">
                  <strong className="font-bold text-neutral-900 block">Instrucciones del Docente:</strong>
                  <p className="whitespace-pre-line leading-relaxed">{selectedAssignment.instructions}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-neutral-800">
                  Enlace al Trabajo o Archivo (Google Drive, Dropbox, GitHub, PDF) <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-12 rounded-xl text-sm px-4"
                  placeholder="https://docs.google.com/document/d/..."
                  value={submissionForm.fileUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, fileUrl: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-neutral-800">
                  Comentarios o Mensaje para el Docente (Opcional)
                </Label>
                <Textarea
                  rows={4}
                  className="rounded-xl text-sm p-3 border-neutral-200"
                  placeholder="Estimado profesor, adjunto el informe con las conclusiones solicitadas..."
                  value={submissionForm.feedback}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, feedback: e.target.value })}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubmitOpen(false)}
                disabled={isSubmitting}
                className="h-12 px-6 rounded-xl text-sm font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold shadow-xs"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Enviando...</>
                ) : (
                  "Confirmar y Enviar Entrega"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
