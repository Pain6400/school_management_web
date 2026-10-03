"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Award,
  CheckSquare,
  Calendar,
  Users,
  ExternalLink,
  CheckCircle2,
  Search,
  BookOpen,
  BarChart3,
  UserCheck,
  GraduationCap,
  Eye,
  Pencil,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  User as UserIcon,
  Download,
  Paperclip,
  FileCheck,
} from "lucide-react";
import {
  assignmentsService,
  Assignment,
  ClassGradebook,
  StudentGradeSummary,
  StudentSubmissionSummary,
} from "@/lib/services/assignments.service";
import { academicsService, Class } from "@/lib/services/academics.service";
import { enrollmentsService, AssignmentSubmission } from "@/lib/services/enrollments.service";
import { documentsService, Document } from "@/lib/services/documents.service";
import { useAuthStore } from "@/store/auth-store";

export default function GradingPage() {
  const { user } = useAuthStore();

  // Clases del profesor
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>("");
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Gradebook de la clase seleccionada (Backend-First)
  const [gradebook, setGradebook] = useState<ClassGradebook | null>(null);
  const [loadingGradebook, setLoadingGradebook] = useState(false);

  // Modo de vista: 'gradebook' (resumen por estudiante) o 'tasks' (entregas de una tarea)
  const [viewMode, setViewMode] = useState<"gradebook" | "tasks">("gradebook");

  // Tarea activa para el modo de entregas
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [submissionDocs, setSubmissionDocs] = useState<Record<number, Document[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Filtros
  const [searchStudent, setSearchStudent] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "GRADED" | "PENDING" | "MISSING">("ALL");

  // Modal de Calificación (por tarea)
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [gradingTarget, setGradingTarget] = useState<{
    assignmentId: number;
    assignmentTitle: string;
    maxScore: number;
    studentId: string;
    studentName: string;
    userCode?: string;
    submissionId?: number | null;
    currentScore?: number | null;
    currentFeedback?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number | null;
    submittedAt?: string | null;
    submissionText?: string | null;
  } | null>(null);

  const [gradeScoreInput, setGradeScoreInput] = useState<string>("");
  const [gradeFeedbackInput, setGradeFeedbackInput] = useState<string>("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [inlinePreviewOpen, setInlinePreviewOpen] = useState(true);

  // Modal de Previsualización Independiente
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    title: string;
    url: string;
    fileName?: string;
    fileType?: string;
    studentName?: string;
  } | null>(null);

  const openDocumentPreview = (doc: {
    title: string;
    url: string;
    fileName?: string;
    fileType?: string;
    studentName?: string;
  }) => {
    setPreviewDocument(doc);
    setPreviewModalOpen(true);
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Modal de Detalle Completo del Estudiante
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentGradeSummary | null>(null);

  // 1. Cargar Clases del Profesor (Backend-First)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        // Intentar obtener las clases asignadas al profesor
        let res = await academicsService.getMyClasses().catch(() => ({ status: false, data: [] }));
        
        // Si no retorna clases específicas o hubo error, fallback a getClasses
        if (!res.status || !res.data || res.data.length === 0) {
          res = await academicsService.getClasses().catch(() => ({ status: false, data: [] }));
        }

        if (res.status && res.data && res.data.length > 0) {
          setClasses(res.data);
          setSelectedClassCode(res.data[0].code);
        } else {
          setClasses([]);
        }
      } catch (err) {
        console.error("Error loading classes:", err);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [user]);

  // 2. Cargar Gradebook cuando cambia la clase seleccionada
  const loadGradebook = async (classCode: string) => {
    if (!classCode) return;
    try {
      setLoadingGradebook(true);
      const res = await assignmentsService.getGradebook(classCode);
      if (res.status && res.data) {
        setGradebook(res.data);
        // Si no hay tarea seleccionada o la actual no pertenece a esta clase, seleccionar la primera
        if (res.data.assignments && res.data.assignments.length > 0) {
          setSelectedAssignmentId((prev) => {
            const exists = res.data.assignments.some((a) => a.id === prev);
            return exists ? prev : res.data.assignments[0].id;
          });
        } else {
          setSelectedAssignmentId(0);
        }

        // Actualizar detalle del estudiante si está abierto
        if (selectedStudentDetail) {
          const updated = res.data.students.find((s) => s.studentId === selectedStudentDetail.studentId);
          if (updated) setSelectedStudentDetail(updated);
        }
      } else {
        setGradebook(null);
      }
    } catch (err) {
      console.error("Error loading gradebook:", err);
      setGradebook(null);
    } finally {
      setLoadingGradebook(false);
    }
  };

  useEffect(() => {
    if (selectedClassCode) {
      loadGradebook(selectedClassCode);
    }
  }, [selectedClassCode]);

  // 3. Cargar entregas específicas de la tarea activa
  const loadSubmissions = async () => {
    if (!selectedAssignmentId) {
      setSubmissions([]);
      setSubmissionDocs({});
      return;
    }
    try {
      setLoadingSubmissions(true);
      const [subRes, docsRes] = await Promise.all([
        enrollmentsService.getSubmissionsByAssignment(selectedAssignmentId).catch(() => ({ status: false, data: [] })),
        documentsService.getDocumentsByAssignment(selectedAssignmentId).catch(() => ({ status: false, data: [] })),
      ]);

      if (subRes.status && subRes.data) {
        setSubmissions(subRes.data);
      } else {
        setSubmissions([]);
      }

      if (docsRes.status && docsRes.data) {
        const docsMap: Record<number, Document[]> = {};
        docsRes.data.forEach((doc: Document) => {
          if (doc.assignmentSubmissionId) {
            if (!docsMap[doc.assignmentSubmissionId]) docsMap[doc.assignmentSubmissionId] = [];
            docsMap[doc.assignmentSubmissionId].push(doc);
          }
        });
        setSubmissionDocs(docsMap);
      } else {
        setSubmissionDocs({});
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
      setSubmissions([]);
      setSubmissionDocs({});
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (selectedAssignmentId && viewMode === "tasks") {
      loadSubmissions();
    }
  }, [selectedAssignmentId, viewMode]);

  // Tarea activa seleccionada
  const activeAssignment = useMemo(() => {
    if (!gradebook || !gradebook.assignments) return null;
    return gradebook.assignments.find((a) => a.id === selectedAssignmentId) || null;
  }, [gradebook, selectedAssignmentId]);

  // Abrir modal de calificar
  const openGradingDialog = (target: {
    assignmentId: number;
    assignmentTitle: string;
    maxScore: number;
    studentId: string;
    studentName: string;
    userCode?: string;
    submissionId?: number | null;
    currentScore?: number | null;
    currentFeedback?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number | null;
    submittedAt?: string | null;
    submissionText?: string | null;
  }) => {
    setGradingTarget(target);
    setGradeScoreInput(target.currentScore !== null && target.currentScore !== undefined ? String(target.currentScore) : "");
    setGradeFeedbackInput(target.currentFeedback || "");
    setInlinePreviewOpen(!!target.fileUrl);
    setGradingModalOpen(true);
  };

  // Guardar nota usando el endpoint Backend-First
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingTarget) return;

    const numScore = parseFloat(gradeScoreInput);
    if (isNaN(numScore) || numScore < 0) {
      alert("Por favor ingresa una puntuación válida mayor o igual a 0.");
      return;
    }

    if (numScore > gradingTarget.maxScore) {
      alert(`La puntuación máxima para esta tarea es de ${gradingTarget.maxScore} pts.`);
      return;
    }

    try {
      setIsSubmittingGrade(true);
      const res = await assignmentsService.gradeStudent({
        assignmentId: gradingTarget.assignmentId,
        studentId: gradingTarget.studentId,
        score: numScore,
        feedback: gradeFeedbackInput.trim() || undefined,
        status: "GRADED",
      });

      if (res.status) {
        setGradingModalOpen(false);
        // Recargar datos actualizados
        if (selectedClassCode) {
          await loadGradebook(selectedClassCode);
        }
        if (viewMode === "tasks") {
          await loadSubmissions();
        }
      } else {
        alert(res.message || "Error al registrar la calificación");
      }
    } catch (err: any) {
      console.error("Error saving grade:", err);
      alert(err.message || "Error al registrar la calificación");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Abrir modal de detalle del estudiante
  const openStudentDetail = (student: StudentGradeSummary) => {
    setSelectedStudentDetail(student);
    setDetailModalOpen(true);
  };

  // Estudiantes filtrados en el Gradebook
  const filteredStudents = useMemo(() => {
    if (!gradebook?.students) return [];
    return gradebook.students.filter((st) => {
      // Filtro de búsqueda por nombre o carnet
      const query = searchStudent.toLowerCase().trim();
      const matchesSearch =
        !query ||
        `${st.firstName} ${st.lastName}`.toLowerCase().includes(query) ||
        (st.userCode && st.userCode.toLowerCase().includes(query)) ||
        (st.email && st.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Filtro por estado
      if (statusFilter === "GRADED") return st.gradedCount > 0 && st.missingCount === 0;
      if (statusFilter === "PENDING") return st.pendingCount > 0;
      if (statusFilter === "MISSING") return st.missingCount > 0;

      return true;
    });
  }, [gradebook, searchStudent, statusFilter]);

  // Entregas filtradas en la vista por tarea
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((sub) => {
      const query = searchStudent.toLowerCase().trim();
      if (!query) return true;
      const studentName = sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : "";
      const userCode = sub.student?.userCode || "";
      return studentName.toLowerCase().includes(query) || userCode.toLowerCase().includes(query);
    });
  }, [submissions, searchStudent]);

  return (
    <div className="space-y-6">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Centro de Calificaciones
            </h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
              Ciclo 2026
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Gestiona la evaluación continua por actividades, visualiza el acumulado total por estudiante y califica con retroalimentación formativa.
          </p>
        </div>

        {/* TOGGLE VISTA: SÁBANA DE NOTAS vs ENTREGAS POR TAREA */}
        <div className="inline-flex items-center bg-muted/70 p-1 rounded-xl border border-border/60 shadow-2xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("gradebook")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === "gradebook"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="size-4 text-primary" />
            <span>Resumen por Estudiante (Sábana)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("tasks")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === "tasks"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="size-4 text-primary" />
            <span>Entregas por Tarea</span>
          </button>
        </div>
      </div>

      {/* FILTROS PRINCIPALES: CLASE, TAREA Y BÚSQUEDA */}
      <Card className="border border-border/70 shadow-xs bg-card/60 backdrop-blur-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* 1. FILTRO DE CLASE (Multi-clase del maestro) */}
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-primary" />
                Selecciona la Clase / Asignatura
              </Label>
              {loadingClasses ? (
                <div className="h-10 flex items-center gap-2 px-3 border rounded-lg bg-muted/40 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Cargando clases asignadas...
                </div>
              ) : classes.length === 0 ? (
                <div className="h-10 flex items-center px-3 border rounded-lg bg-muted/40 text-xs text-muted-foreground">
                  No hay clases asignadas
                </div>
              ) : (
                <Select
                  value={selectedClassCode}
                  onValueChange={(val) => setSelectedClassCode(val || "")}
                >
                  <SelectTrigger className="w-full h-10 font-medium">
                    <SelectValue placeholder="Selecciona una clase...">
                      {classes.find((cls) => cls.code === selectedClassCode)?.name
                        ? `${classes.find((cls) => cls.code === selectedClassCode)?.name} (${selectedClassCode})`
                        : selectedClassCode || "Selecciona una clase..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.code} value={cls.code}>
                        {cls.name} ({cls.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 2. SI ESTÁ EN MODO ENTREGAS: SELECTOR DE TAREA */}
            {viewMode === "tasks" && (
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-primary" />
                  Selecciona la Tarea de esta Clase
                </Label>
                {loadingGradebook ? (
                  <div className="h-10 flex items-center gap-2 px-3 border rounded-lg bg-muted/40 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Cargando tareas...
                  </div>
                ) : !gradebook || gradebook.assignments.length === 0 ? (
                  <div className="h-10 flex items-center px-3 border rounded-lg bg-muted/40 text-xs text-muted-foreground">
                    Sin tareas en esta clase
                  </div>
                ) : (
                  <Select
                    value={selectedAssignmentId ? String(selectedAssignmentId) : ""}
                    onValueChange={(val) => setSelectedAssignmentId(Number(val) || 0)}
                  >
                    <SelectTrigger className="w-full h-10 font-medium">
                      <SelectValue placeholder="Selecciona una tarea...">
                        {activeAssignment
                          ? `${activeAssignment.title} — (${activeAssignment.maxScore} pts)`
                          : "Selecciona una tarea..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {gradebook.assignments.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.title} — ({a.maxScore} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* 3. FILTRO / BÚSQUEDA DE ESTUDIANTE */}
            <div className={`${viewMode === "tasks" ? "md:col-span-4" : "md:col-span-5"} space-y-1.5`}>
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Search className="size-3.5 text-muted-foreground" />
                Buscar Estudiante
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por nombre, carnet o correo..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="pl-9 h-10 text-xs"
                />
              </div>
            </div>

            {/* 4. SI ESTÁ EN MODO GRADEBOOK: FILTRO POR ESTADO */}
            {viewMode === "gradebook" && (
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Estado de Entrega
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as any)}
                >
                  <SelectTrigger className="w-full h-10 text-xs">
                    <SelectValue placeholder="Todos">
                      {statusFilter === "ALL"
                        ? "Todos los estudiantes"
                        : statusFilter === "GRADED"
                        ? "Todo calificado"
                        : statusFilter === "PENDING"
                        ? "Con pendientes por calificar"
                        : "Con tareas faltantes"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estudiantes</SelectItem>
                    <SelectItem value="GRADED">Todo calificado</SelectItem>
                    <SelectItem value="PENDING">Con pendientes por calificar</SelectItem>
                    <SelectItem value="MISSING">Con tareas faltantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* METRICAS DE LA CLASE / TAREA */}
      {gradebook && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="border border-border/60 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Estudiantes</span>
                <p className="text-xl font-extrabold text-foreground">{gradebook.totalStudents}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <BookOpen className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Tareas</span>
                <p className="text-xl font-extrabold text-foreground">{gradebook.totalAssignments}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Award className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Total Puntos Periodo</span>
                <p className="text-xl font-extrabold text-primary">{gradebook.totalMaxScore.toFixed(2)} pts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-2xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Promedio Acumulado</span>
                <p className="text-xl font-extrabold text-emerald-600">{gradebook.classAverage.toFixed(1)} pts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* VISTA 1: SÁBANA DE NOTAS / RESUMEN POR ESTUDIANTE               */}
      {/* ============================================================== */}
      {viewMode === "gradebook" && (
        <Card className="border border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="size-5 text-primary" />
                  Sábana y Resumen Acumulado por Estudiante
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Visualiza la suma total de puntos obtenidos por cada estudiante sobre el total de actividades programadas ({gradebook?.totalMaxScore || 0} pts).
                </CardDescription>
              </div>
              {gradebook && (
                <div className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border">
                  Clase: <span className="font-semibold text-foreground">{gradebook.class.name}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingGradebook ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Cargando sábana de calificaciones...</p>
              </div>
            ) : !gradebook || filteredStudents.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="size-10 text-muted-foreground/30 mx-auto mb-2.5" />
                <p className="font-semibold text-sm">No se encontraron estudiantes para los filtros actuales.</p>
                <p className="text-xs text-muted-foreground mt-0.5">Verifica la clase o ajusta los términos de búsqueda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Estudiante</TableHead>
                      <TableHead className="font-bold text-xs text-center">Progreso de Tareas</TableHead>
                      <TableHead className="font-bold text-xs text-center">Tareas Calificadas</TableHead>
                      <TableHead className="font-bold text-xs text-right">Suma Total Acumulada</TableHead>
                      <TableHead className="font-bold text-xs text-center">Rendimiento</TableHead>
                      <TableHead className="font-bold text-xs text-right pr-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((st) => (
                      <TableRow key={st.studentId} className="hover:bg-muted/30 transition-colors">
                        {/* Estudiante Info */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
                              {st.firstName[0]}{st.lastName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => openStudentDetail(st)}>
                                {st.firstName} {st.lastName}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                <code>{st.userCode || "S/C"}</code>
                                <span>•</span>
                                <span className="truncate max-w-[180px]">{st.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Progreso de Tareas */}
                        <TableCell className="text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-foreground">
                              {st.submittedCount} / {gradebook.totalAssignments} entregadas
                            </span>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                  width: `${gradebook.totalAssignments > 0 ? (st.submittedCount / gradebook.totalAssignments) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Tareas Calificadas vs Pendientes */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant="outline"
                              className={
                                st.pendingCount > 0
                                  ? "bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px]"
                                  : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]"
                              }
                            >
                              {st.gradedCount} de {gradebook.totalAssignments} calificadas
                            </Badge>
                            {st.pendingCount > 0 && (
                              <span className="text-[10px] text-amber-600 font-medium">
                                ({st.pendingCount} por calificar)
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* SUMA TOTAL ACUMULADA */}
                        <TableCell className="text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className="font-extrabold text-base text-primary">
                              {st.totalScore.toFixed(2)} pts
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              de {st.totalMaxScore.toFixed(2)} pts del periodo
                            </span>
                          </div>
                        </TableCell>

                        {/* Rendimiento / Porcentaje (calculado sobre tareas evaluadas) */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <Badge
                              className={`text-xs px-2.5 py-0.5 font-bold ${
                                st.gradedCount === 0
                                  ? "bg-muted text-muted-foreground border-border"
                                  : st.percentage >= 70
                                  ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20"
                                  : st.percentage >= 60
                                  ? "bg-amber-500/15 text-amber-700 border-amber-500/20"
                                  : "bg-red-500/15 text-red-700 border-red-500/20"
                              }`}
                            >
                              {st.gradedCount === 0 ? "Sin evaluar" : `${st.percentage.toFixed(1)}%`}
                            </Badge>
                            {st.evaluatedMaxScore !== undefined && st.evaluatedMaxScore > 0 ? (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                ({st.totalScore.toFixed(1)} / {st.evaluatedMaxScore.toFixed(1)} pts)
                              </span>
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Botón Ver Detalle */}
                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStudentDetail(st)}
                            className="h-8 gap-1.5 text-xs font-semibold hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                          >
                            <Eye className="size-3.5" />
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: ENTREGAS POR TAREA SELECCIONADA                       */}
      {/* ============================================================== */}
      {viewMode === "tasks" && (
        <Card className="border border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CheckSquare className="size-5 text-primary" />
                  Entregas de la Tarea: {activeAssignment ? activeAssignment.title : "Selecciona una tarea"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Califica cada entrega asignando una nota individual según el puntaje máximo configurado para esta tarea.
                </CardDescription>
              </div>

              {activeAssignment && (
                <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border shadow-2xs self-start sm:self-auto">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Puntaje Máximo:</span>
                    <p className="text-sm font-extrabold text-primary">{activeAssignment.maxScore} pts</p>
                  </div>
                  <div className="border-l pl-3">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Fecha Límite:</span>
                    <p className="text-xs font-medium text-foreground">
                      {activeAssignment.dueDate ? new Date(activeAssignment.dueDate).toLocaleDateString() : "Sin fecha"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingSubmissions ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Cargando entregas de la tarea...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckSquare className="size-10 stroke-1 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-semibold text-sm">No se registran entregas aún para esta tarea.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Puedes calificar a los estudiantes directamente desde la pestaña <strong>&ldquo;Resumen por Estudiante&rdquo;</strong> o cuando entreguen en su portal.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Estudiante</TableHead>
                      <TableHead className="font-bold text-xs">Fecha de Entrega</TableHead>
                      <TableHead className="font-bold text-xs">Contenido / Archivo</TableHead>
                      <TableHead className="font-bold text-xs">Calificación Obtenida</TableHead>
                      <TableHead className="font-bold text-xs text-center">Estado</TableHead>
                      <TableHead className="font-bold text-xs text-right pr-6">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5">
                          <div className="font-bold text-sm text-foreground">
                            {sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : sub.studentId}
                          </div>
                          {sub.student?.userCode && (
                            <code className="text-[11px] text-muted-foreground">{sub.student.userCode}</code>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {sub.submissionDate ? new Date(sub.submissionDate).toLocaleString() : "—"}
                        </TableCell>

                        <TableCell className="text-xs">
                          {(() => {
                            const fileUrl = sub.fileUrl || submissionDocs[sub.id]?.[0]?.fileUrl;
                            const fileName = sub.fileName || submissionDocs[sub.id]?.[0]?.originalFilename || submissionDocs[sub.id]?.[0]?.filename;
                            const studentName = sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : "Estudiante";

                            if (fileUrl) {
                              return (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openDocumentPreview({
                                        title: activeAssignment?.title || "Entrega",
                                        url: fileUrl,
                                        fileName: fileName || "Archivo_Adjunto.pdf",
                                        studentName,
                                      })
                                    }
                                    className="h-7 text-[11px] font-semibold gap-1 px-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 shadow-2xs"
                                  >
                                    <Eye className="size-3" />
                                    Previsualizar
                                  </Button>
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={fileName || "tarea.pdf"}
                                    className="size-7 rounded-lg border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs"
                                    title="Descargar archivo"
                                  >
                                    <Download className="size-3" />
                                  </a>
                                  <span className="text-[11px] text-muted-foreground truncate max-w-[130px]" title={fileName || ""}>
                                    {fileName || "Archivo adjunto"}
                                  </span>
                                </div>
                              );
                            }

                            if (sub.submissionText || sub.content) {
                              return (
                                <span className="text-xs text-muted-foreground italic truncate max-w-[180px] block" title={sub.submissionText || sub.content}>
                                  &ldquo;{sub.submissionText || sub.content}&rdquo;
                                </span>
                              );
                            }

                            return <span className="text-xs text-muted-foreground italic">Sin entrega digital</span>;
                          })()}
                        </TableCell>

                        {/* CALIFICACIÓN DE LA TAREA */}
                        <TableCell>
                          {sub.score !== undefined && sub.score !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-primary">
                                {Number(sub.score).toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                / {activeAssignment?.maxScore || 100} pts
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sin calificar</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant={sub.status === "GRADED" ? "default" : "secondary"}
                            className={
                              sub.status === "GRADED"
                                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[11px] font-semibold"
                                : "text-[11px]"
                            }
                          >
                            {sub.status === "GRADED" ? "Calificado" : sub.status || "Pendiente"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openGradingDialog({
                                assignmentId: activeAssignment?.id || sub.assignmentId,
                                assignmentTitle: activeAssignment?.title || "Tarea",
                                maxScore: activeAssignment?.maxScore || 100,
                                studentId: sub.studentId,
                                studentName: sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : sub.studentId,
                                userCode: sub.student?.userCode,
                                submissionId: sub.id,
                                currentScore: sub.score,
                                currentFeedback: sub.feedback,
                                fileUrl: sub.fileUrl || submissionDocs[sub.id]?.[0]?.fileUrl,
                                fileName: sub.fileName || submissionDocs[sub.id]?.[0]?.originalFilename || submissionDocs[sub.id]?.[0]?.filename,
                                fileType: sub.fileType || submissionDocs[sub.id]?.[0]?.fileType,
                                fileSize: sub.fileSize || submissionDocs[sub.id]?.[0]?.fileSize,
                                submittedAt: sub.submittedAt || sub.submissionDate,
                                submissionText: sub.submissionText || sub.content,
                              })
                            }
                            className="h-8 gap-1.5 text-xs font-semibold hover:bg-primary/5 hover:text-primary hover:border-primary/40 shadow-2xs"
                          >
                            <Pencil className="size-3" />
                            {sub.score !== null && sub.score !== undefined ? "Modificar Nota" : "Calificar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CALIFICAR TAREA (Validado contra maxScore de la tarea)*/}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* MODAL 1: CALIFICAR TAREA CON PREVISUALIZACIÓN Y DESCARGA       */}
      {/* ============================================================== */}
      <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
        <DialogContent size="xl" className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[92vh]">
          {gradingTarget && (
            <form onSubmit={handleSaveGrade} className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="px-8 pt-6 pb-5 bg-neutral-50/70 border-b border-neutral-200/60 shrink-0">
                <div className="flex items-center justify-between gap-4 pr-8">
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20 shadow-2xs">
                      <Award className="size-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-black text-foreground tracking-tight">
                        Calificar Actividad: {gradingTarget.assignmentTitle}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{gradingTarget.studentName}</span>
                        {gradingTarget.userCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono bg-muted text-foreground px-1.5 py-0.5 rounded text-[11px]">
                              {gradingTarget.userCode}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-bold text-primary">Puntaje Máximo: {gradingTarget.maxScore} pts</span>
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <DialogBody className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
                {/* 1. SECCIÓN: TRABAJO ENTREGADO POR EL ALUMNO */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileCheck className="size-3.5 text-primary" />
                      Trabajo y Archivo Adjunto del Alumno
                    </h3>
                    {gradingTarget.submittedAt && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        Entregado el {new Date(gradingTarget.submittedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {gradingTarget.fileUrl ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3.5 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-11 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 border border-red-500/20 font-bold text-xs">
                            <FileText className="size-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate max-w-sm sm:max-w-md">
                              {gradingTarget.fileName || "Archivo_Adjunto_Estudiante.pdf"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {gradingTarget.fileType || "Documento PDF"}
                              {gradingTarget.fileSize ? ` • ${formatFileSize(gradingTarget.fileSize)}` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Botones de Acción: Previsualizar y Descargar */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setInlinePreviewOpen(!inlinePreviewOpen)}
                            className="h-8 text-xs font-semibold gap-1.5 bg-card hover:bg-muted"
                          >
                            <Eye className="size-3.5" />
                            {inlinePreviewOpen ? "Ocultar Vista Previa" : "Previsualizar"}
                          </Button>

                          <a
                            href={gradingTarget.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={gradingTarget.fileName || "tarea.pdf"}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="size-3.5" />
                            Descargar
                          </a>

                          <a
                            href={gradingTarget.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="size-8 rounded-lg border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs"
                            title="Abrir en pestaña nueva"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Visor integrado en el modal */}
                      {inlinePreviewOpen && (
                        <div className="rounded-xl overflow-hidden border border-border/80 bg-neutral-900 shadow-md">
                          <div className="bg-neutral-800 px-3.5 py-1.5 flex items-center justify-between text-xs text-neutral-300">
                            <span className="font-medium flex items-center gap-1.5">
                              <Eye className="size-3.5 text-primary" />
                              Visor de Documento Adjunto
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              Usa los controles del visor para zoom o desplazarte
                            </span>
                          </div>
                          <div className="relative w-full h-[360px] bg-neutral-100 flex items-center justify-center">
                            <iframe
                              src={gradingTarget.fileUrl}
                              className="w-full h-full border-0"
                              title="Vista previa de tarea del estudiante"
                            />
                          </div>
                        </div>
                      )}

                      {/* Texto o comentario del alumno */}
                      {gradingTarget.submissionText && (
                        <div className="bg-card p-3 rounded-xl border text-xs text-muted-foreground">
                          <span className="font-bold text-foreground block mb-0.5">Comentarios del Estudiante:</span>
                          <p className="italic leading-relaxed text-foreground">
                            &ldquo;{gradingTarget.submissionText}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                      <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-amber-900">Sin archivo digital adjunto</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          El estudiante no ha adjuntado ningún archivo digital para esta entrega. Puedes asignar la nota si presentó el trabajo de forma física en el aula o asignar 0 puntos si no presentó la tarea.
                        </p>
                        {gradingTarget.submissionText && (
                          <div className="mt-2 bg-card/60 p-2.5 rounded-lg border border-amber-500/20 text-xs text-foreground italic">
                            &ldquo;{gradingTarget.submissionText}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SECCIÓN: ASIGNACIÓN DE CALIFICACIÓN Y RETROALIMENTACIÓN */}
                <div className="space-y-4 pt-2 border-t border-border/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Award className="size-3.5 text-primary" />
                    Evaluación y Retroalimentación Formativa
                  </h3>

                  {/* Input de Puntuación */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gradeScore" className="text-xs font-bold text-foreground">
                        Puntuación Obtenida <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        Ponderación máxima: <strong className="text-foreground">{gradingTarget.maxScore} pts</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          id="gradeScore"
                          type="number"
                          min="0"
                          max={gradingTarget.maxScore}
                          step="0.1"
                          placeholder={`Ej: ${Math.min(gradingTarget.maxScore, 10)}`}
                          value={gradeScoreInput}
                          onChange={(e) => setGradeScoreInput(e.target.value)}
                          required
                          className="text-base font-extrabold pr-20 h-11"
                        />
                        <div className="absolute right-3.5 top-3 text-xs font-bold text-muted-foreground pointer-events-none">
                          / {gradingTarget.maxScore} pts
                        </div>
                      </div>

                      {/* Botones de asignación rápida */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setGradeScoreInput(String(gradingTarget.maxScore))}
                          className="h-11 px-3 text-xs font-bold text-emerald-700 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                          100% ({gradingTarget.maxScore} pts)
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setGradeScoreInput(String((gradingTarget.maxScore * 0.8).toFixed(1)))}
                          className="h-11 px-2.5 text-xs font-semibold hover:bg-muted"
                        >
                          80%
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setGradeScoreInput("0")}
                          className="h-11 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-500/10"
                        >
                          0 pts
                        </Button>
                      </div>
                    </div>

                    {parseFloat(gradeScoreInput) > gradingTarget.maxScore && (
                      <p className="text-xs text-destructive font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3.5" />
                        La nota ingresada supera el puntaje máximo permitido ({gradingTarget.maxScore} pts).
                      </p>
                    )}
                  </div>

                  {/* Retroalimentación Formativa */}
                  <div className="space-y-1.5">
                    <Label htmlFor="gradeFeedback" className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Retroalimentación Formativa</span>
                      <span className="text-[11px] font-normal text-muted-foreground">Visible para el alumno</span>
                    </Label>
                    <Textarea
                      id="gradeFeedback"
                      rows={3}
                      placeholder="Escribe comentarios específicos sobre aciertos, procedimiento y sugerencias de mejora..."
                      value={gradeFeedbackInput}
                      onChange={(e) => setGradeFeedbackInput(e.target.value)}
                    />
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="px-8 py-4 bg-neutral-50/70 border-t border-neutral-200/60 shrink-0">
                <Button type="button" variant="outline" onClick={() => setGradingModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmittingGrade ||
                    !gradeScoreInput ||
                    parseFloat(gradeScoreInput) > gradingTarget.maxScore ||
                    parseFloat(gradeScoreInput) < 0
                  }
                  className="gap-1.5 font-bold"
                >
                  {isSubmittingGrade ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Guardar Calificación
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 2: DETALLE COMPLETO DEL ESTUDIANTE CON SUMA TOTAL ACUMULADA */}
      {/* ============================================================== */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent size="lg" className="max-w-4xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {selectedStudentDetail && (
            <>
              <DialogHeader className="px-8 pt-6 pb-5 bg-neutral-50/70 border-b border-neutral-200/60 shrink-0">
                <div className="flex items-center gap-3.5 pr-8">
                  <div className="size-13 rounded-2xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center border border-primary/20 shrink-0 shadow-2xs">
                    {selectedStudentDetail.firstName[0]}{selectedStudentDetail.lastName[0]}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
                      {selectedStudentDetail.firstName} {selectedStudentDetail.lastName}
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono bg-muted text-foreground px-2 py-0.5 rounded font-semibold text-[11px]">
                        {selectedStudentDetail.userCode || "S/C"}
                      </span>
                      <span>•</span>
                      <span className="text-muted-foreground">{selectedStudentDetail.email}</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">{gradebook?.class.name}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <DialogBody className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
                {/* TARJETAS KPI DE LA SUMA TOTAL DEL ESTUDIANTE */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. SUMA TOTAL ACUMULADA */}
                  <Card className="bg-primary/5 border-primary/20 shadow-2xs">
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Puntos Acumulados
                        </span>
                        <span className="text-[10px] font-semibold text-primary">
                          {((selectedStudentDetail.totalScore / (selectedStudentDetail.totalMaxScore || 1)) * 100).toFixed(1)}% del ciclo
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-primary">
                          {selectedStudentDetail.totalScore.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          / {selectedStudentDetail.totalMaxScore.toFixed(2)} pts del periodo
                        </span>
                      </div>
                      <div className="w-full h-2 bg-primary/15 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (selectedStudentDetail.totalScore / (selectedStudentDetail.totalMaxScore || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Suma progresiva de puntos ganados a lo largo del periodo.
                      </p>
                    </CardContent>
                  </Card>

                  {/* 2. PORCENTAJE DE RENDIMIENTO */}
                  <Card className="border border-border/70 shadow-2xs">
                    <CardContent className="p-4 space-y-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Rendimiento Académico
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-foreground">
                          {selectedStudentDetail.percentage.toFixed(1)}%
                        </span>
                        <Badge
                          className={`text-[10px] font-bold ${
                            selectedStudentDetail.gradedCount === 0
                              ? "bg-muted text-muted-foreground border-border"
                              : selectedStudentDetail.percentage >= 70
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20"
                              : selectedStudentDetail.percentage >= 60
                              ? "bg-amber-500/15 text-amber-700 border-amber-500/20"
                              : "bg-red-500/15 text-red-700 border-red-500/20"
                          }`}
                        >
                          {selectedStudentDetail.gradedCount === 0
                            ? "Sin calificar"
                            : selectedStudentDetail.percentage >= 70
                            ? "Aprobado"
                            : selectedStudentDetail.percentage >= 60
                            ? "Regular"
                            : "Requiere Apoyo"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {selectedStudentDetail.evaluatedMaxScore && selectedStudentDetail.evaluatedMaxScore > 0
                          ? `Sobre ${selectedStudentDetail.evaluatedMaxScore.toFixed(2)} pts evaluados a la fecha (${selectedStudentDetail.totalScore.toFixed(2)} / ${selectedStudentDetail.evaluatedMaxScore.toFixed(2)} pts)`
                          : "Sin tareas evaluadas hasta el momento"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* 3. PROGRESO DE ACTIVIDADES */}
                  <Card className="border border-border/70 shadow-2xs">
                    <CardContent className="p-4 space-y-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Estado de Entregas
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-foreground">
                          {selectedStudentDetail.gradedCount}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          de {selectedStudentDetail.assignments.length} calificadas
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedStudentDetail.missingCount > 0
                          ? `${selectedStudentDetail.missingCount} tarea(s) pendiente(s) o sin entregar`
                          : "Todas las tareas al día"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* TABLA DE DESGLOSE DE TAREAS Y NOTAS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Award className="size-3.5 text-primary" />
                      Desglose Detallado por Actividad
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      Puntos acumulativos hacia la nota final
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/80 overflow-hidden shadow-2xs">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="font-bold text-xs pl-4">Actividad / Tarea</TableHead>
                          <TableHead className="font-bold text-xs text-center">Tipo</TableHead>
                          <TableHead className="font-bold text-xs text-center">Fecha Límite</TableHead>
                          <TableHead className="font-bold text-xs text-right">Nota Obtenida</TableHead>
                          <TableHead className="font-bold text-xs text-center">Estado</TableHead>
                          <TableHead className="font-bold text-xs text-right pr-4">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStudentDetail.assignments.map((asg) => (
                          <TableRow key={asg.assignmentId} className="hover:bg-muted/30">
                            <TableCell className="py-3 pl-4">
                              <div className="font-bold text-xs text-foreground">{asg.title}</div>
                              {asg.feedback && (
                                <p className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-1">
                                  &ldquo;{asg.feedback}&rdquo;
                                </p>
                              )}
                              {asg.fileUrl && (
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openDocumentPreview({
                                        title: asg.title,
                                        url: asg.fileUrl!,
                                        fileName: asg.fileName || "Archivo_Adjunto.pdf",
                                        studentName: `${selectedStudentDetail.firstName} ${selectedStudentDetail.lastName}`,
                                      })
                                    }
                                    className="h-6 text-[10px] font-semibold text-primary px-2 gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20 shadow-2xs"
                                  >
                                    <Eye className="size-2.5" />
                                    Previsualizar {asg.fileName ? `(${asg.fileName})` : "Archivo"}
                                  </Button>
                                  <a
                                    href={asg.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={asg.fileName || "tarea.pdf"}
                                    className="size-6 rounded-md border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs"
                                    title="Descargar archivo adjunto"
                                  >
                                    <Download className="size-2.5" />
                                  </a>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[10px] font-medium">
                                {asg.type || "Tarea"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-center text-xs text-muted-foreground">
                              {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : "—"}
                            </TableCell>

                            <TableCell className="text-right">
                              {asg.score !== null && asg.score !== undefined ? (
                                <div className="inline-flex items-baseline gap-1">
                                  <span className="font-extrabold text-sm text-primary">
                                    {asg.score.toFixed(2)}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    / {asg.maxScore} pts
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Sin calificar</span>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  asg.status === "GRADED"
                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-bold"
                                    : asg.status === "SUBMITTED" || asg.status === "PENDING"
                                    ? "bg-blue-500/10 text-blue-700 border-blue-500/20 text-[10px]"
                                    : "bg-neutral-500/10 text-neutral-600 border-neutral-300 text-[10px]"
                                }
                              >
                                {asg.status === "GRADED"
                                  ? "Calificado"
                                  : asg.status === "SUBMITTED" || asg.status === "PENDING"
                                  ? "Entregado"
                                  : "No entregado"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right pr-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  openGradingDialog({
                                    assignmentId: asg.assignmentId,
                                    assignmentTitle: asg.title,
                                    maxScore: asg.maxScore,
                                    studentId: selectedStudentDetail.studentId,
                                    studentName: `${selectedStudentDetail.firstName} ${selectedStudentDetail.lastName}`,
                                    userCode: selectedStudentDetail.userCode,
                                    submissionId: asg.submissionId,
                                    currentScore: asg.score,
                                    currentFeedback: asg.feedback,
                                    fileUrl: asg.fileUrl,
                                    fileName: asg.fileName,
                                    fileType: asg.fileType,
                                    fileSize: asg.fileSize,
                                    submittedAt: asg.submittedAt,
                                    submissionText: asg.submissionText,
                                  });
                                }}
                                className="h-7 text-xs font-semibold px-2.5 gap-1 hover:bg-primary/5 hover:text-primary shadow-2xs"
                              >
                                <Pencil className="size-3" />
                                {asg.score !== null && asg.score !== undefined ? "Editar" : "Calificar"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="px-8 py-4 bg-neutral-50/60 border-t border-neutral-200/60 shrink-0">
                <Button type="button" variant="outline" onClick={() => setDetailModalOpen(false)}>
                  Cerrar Detalle
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 3: PREVISUALIZADOR GENERAL DE DOCUMENTOS Y ARCHIVOS      */}
      {/* ============================================================== */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent size="xl" className="max-w-5xl p-0 overflow-hidden flex flex-col max-h-[92vh]">
          {previewDocument && (
            <>
              <DialogHeader className="px-8 py-4 bg-neutral-50/80 border-b border-neutral-200/60 shrink-0">
                <div className="flex items-center justify-between gap-4 pr-8">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20 shadow-2xs">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-base font-bold text-foreground truncate">
                        {previewDocument.fileName || previewDocument.title}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        {previewDocument.studentName ? `Entregado por: ${previewDocument.studentName}` : previewDocument.title}
                      </DialogDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={previewDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={previewDocument.fileName || "tarea.pdf"}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      Descargar Archivo
                    </a>
                    <a
                      href={previewDocument.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-8 rounded-lg border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs"
                      title="Abrir en pestaña nueva"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              </DialogHeader>

              <DialogBody className="p-0 overflow-hidden flex-1 bg-neutral-900 flex items-center justify-center min-h-[500px]">
                <iframe
                  src={previewDocument.url}
                  className="w-full h-[65vh] border-0 bg-white"
                  title="Visor de entrega del estudiante"
                />
              </DialogBody>

              <DialogFooter className="px-8 py-3 bg-neutral-50/80 border-t border-neutral-200/60 shrink-0">
                <Button type="button" variant="outline" onClick={() => setPreviewModalOpen(false)}>
                  Cerrar Vista Previa
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}