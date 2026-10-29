"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogBody, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import {
  Loader2, ArrowRight, UserCheck, RefreshCw, AlertCircle, CheckCircle2,
  GraduationCap, Users, ArrowUpRight, ShieldCheck, FileText, ChevronRight
} from "lucide-react";
import { academicsService, AcademicYear, Grade } from "@/lib/services/academics.service";
import { enrollmentsService, StudentEnrollment, PromoteBatchResult } from "@/lib/services/enrollments.service";
import Link from "next/link";

interface CandidateStudent {
  enrollmentId: number;
  studentId: string;
  fullName: string;
  nationalId: string;
  sourceGradeCode: string;
  sourceGradeName: string;
  selected: boolean;
  action: "PROMOTE" | "REPEAT" | "GRADUATE";
}

export default function PromotionPage() {
  const { user } = useAuthStore();
  const schoolCode = user?.schoolCode || "ESC002";

  // Data sources
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter selections
  const [sourceYearId, setSourceYearId] = useState<number>(0);
  const [sourceGradeCode, setSourceGradeCode] = useState<string>("ALL");
  const [targetYearId, setTargetYearId] = useState<number>(0);
  const [targetGradeCode, setTargetGradeCode] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Candidates state
  const [candidates, setCandidates] = useState<CandidateStudent[]>([]);

  // Execution states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<PromoteBatchResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial academic years, grades, and enrollments
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [yearsRes, gradesRes, enrollmentsRes] = await Promise.all([
          academicsService.getAcademicYears(),
          academicsService.getGrades(),
          enrollmentsService.getStudentEnrollments(schoolCode),
        ]);

        const loadedYears = (yearsRes.status && yearsRes.data) ? yearsRes.data : [];
        const loadedGrades = (gradesRes.status && gradesRes.data) ? gradesRes.data : [];
        const loadedEnrollments = (enrollmentsRes.status && enrollmentsRes.data) ? enrollmentsRes.data : [];

        setYears(loadedYears);
        setGrades(loadedGrades);
        setAllEnrollments(loadedEnrollments);

        // Auto-select source and target years if available
        if (loadedYears.length >= 2) {
          // Sort years by code or id ascending
          const sorted = [...loadedYears].sort((a, b) => a.yearCode - b.yearCode);
          setSourceYearId(sorted[sorted.length - 2].id);
          setTargetYearId(sorted[sorted.length - 1].id);
        } else if (loadedYears.length === 1) {
          setSourceYearId(loadedYears[0].id);
          setTargetYearId(loadedYears[0].id);
        }

        // Auto-select first target grade
        if (loadedGrades.length > 0) {
          setTargetGradeCode(loadedGrades[0].code);
        }
      } catch (err: any) {
        console.error("Error loading promotion data:", err);
        setErrorMsg("Error cargando ciclos y grados académicos");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [schoolCode]);

  // When source year or source grade change, filter candidates
  useEffect(() => {
    if (!sourceYearId) {
      setCandidates([]);
      return;
    }

    const filtered = allEnrollments.filter((e) => {
      if (Number(e.academicYearId) !== Number(sourceYearId)) return false;
      if (e.status !== "ACTIVE") return false;
      if (sourceGradeCode !== "ALL" && e.gradeCode !== sourceGradeCode) return false;
      return true;
    });

    const mapped: CandidateStudent[] = filtered.map((e) => {
      const u = e.student?.user;
      const fullName = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "Estudiante";
      const nationalId = u?.nationalId || e.studentId.substring(0, 8);
      const gradeObj = grades.find((g) => g.code === e.gradeCode);

      return {
        enrollmentId: e.id,
        studentId: e.studentId,
        fullName,
        nationalId,
        sourceGradeCode: e.gradeCode || "",
        sourceGradeName: gradeObj ? gradeObj.name : e.gradeCode || "Sin grado",
        selected: true,
        action: "PROMOTE",
      };
    });

    setCandidates(mapped);
  }, [sourceYearId, sourceGradeCode, allEnrollments, grades]);

  // Suggest next grade when source grade changes
  useEffect(() => {
    if (sourceGradeCode && sourceGradeCode !== "ALL") {
      const currentGrade = grades.find((g) => g.code === sourceGradeCode);
      if (currentGrade) {
        const nextLevel = currentGrade.level + 1;
        const nextGrade = grades.find((g) => g.level === nextLevel);
        if (nextGrade) {
          setTargetGradeCode(nextGrade.code);
        }
      }
    }
  }, [sourceGradeCode, grades]);

  // Filtered candidate list by search
  const visibleCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter(
      (c) => c.fullName.toLowerCase().includes(q) || c.nationalId.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  // Counters
  const selectedCount = candidates.filter((c) => c.selected).length;
  const promoteCount = candidates.filter((c) => c.selected && c.action === "PROMOTE").length;
  const repeatCount = candidates.filter((c) => c.selected && c.action === "REPEAT").length;
  const graduateCount = candidates.filter((c) => c.selected && c.action === "GRADUATE").length;

  const allSelected = visibleCandidates.length > 0 && visibleCandidates.every((c) => c.selected);

  const toggleSelectAll = () => {
    const nextVal = !allSelected;
    setCandidates((prev) =>
      prev.map((c) => {
        const isVisible = visibleCandidates.some((v) => v.studentId === c.studentId);
        return isVisible ? { ...c, selected: nextVal } : c;
      })
    );
  };

  const toggleSelectCandidate = (studentId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.studentId === studentId ? { ...c, selected: !c.selected } : c))
    );
  };

  const setCandidateAction = (studentId: string, action: "PROMOTE" | "REPEAT" | "GRADUATE") => {
    setCandidates((prev) =>
      prev.map((c) => (c.studentId === studentId ? { ...c, action, selected: true } : c))
    );
  };

  const setBulkAction = (action: "PROMOTE" | "REPEAT" | "GRADUATE") => {
    setCandidates((prev) =>
      prev.map((c) => (c.selected ? { ...c, action } : c))
    );
  };

  // Execution handler
  const handleExecutePromotion = async () => {
    if (!sourceYearId || !targetYearId || !targetGradeCode) {
      alert("Por favor selecciona los ciclos y grados de origen y destino.");
      return;
    }

    const selectedList = candidates.filter((c) => c.selected);
    if (selectedList.length === 0) {
      alert("No hay ningún estudiante seleccionado.");
      return;
    }

    try {
      setIsExecuting(true);
      setErrorMsg(null);

      // Group students by action
      const promoteStudents = selectedList.filter((c) => c.action === "PROMOTE").map((c) => c.studentId);
      const repeatStudents = selectedList.filter((c) => c.action === "REPEAT").map((c) => c.studentId);
      const graduateStudents = selectedList.filter((c) => c.action === "GRADUATE").map((c) => c.studentId);

      let totalProcessed = 0;
      let totalSuccess = 0;
      let totalSkipped = 0;
      const combinedDetails: any[] = [];

      // 1. Promote batch
      if (promoteStudents.length > 0) {
        const res = await enrollmentsService.promoteBatch({
          sourceAcademicYearId: Number(sourceYearId),
          targetAcademicYearId: Number(targetYearId),
          targetGradeCode,
          studentIds: promoteStudents,
          action: "PROMOTE",
        });
        if (res.status && res.data) {
          totalProcessed += res.data.totalProcessed;
          totalSuccess += res.data.successCount;
          totalSkipped += res.data.skippedCount;
          combinedDetails.push(...res.data.details);
        }
      }

      // 2. Repeat batch
      if (repeatStudents.length > 0) {
        const res = await enrollmentsService.promoteBatch({
          sourceAcademicYearId: Number(sourceYearId),
          targetAcademicYearId: Number(targetYearId),
          targetGradeCode, // Will be overridden in service to keep source grade
          studentIds: repeatStudents,
          action: "REPEAT",
        });
        if (res.status && res.data) {
          totalProcessed += res.data.totalProcessed;
          totalSuccess += res.data.successCount;
          totalSkipped += res.data.skippedCount;
          combinedDetails.push(...res.data.details);
        }
      }

      // 3. Graduate batch
      if (graduateStudents.length > 0) {
        const res = await enrollmentsService.promoteBatch({
          sourceAcademicYearId: Number(sourceYearId),
          targetAcademicYearId: Number(targetYearId),
          targetGradeCode,
          studentIds: graduateStudents,
          action: "GRADUATE",
        });
        if (res.status && res.data) {
          totalProcessed += res.data.totalProcessed;
          totalSuccess += res.data.successCount;
          totalSkipped += res.data.skippedCount;
          combinedDetails.push(...res.data.details);
        }
      }

      setExecutionResult({
        totalProcessed,
        successCount: totalSuccess,
        skippedCount: totalSkipped,
        details: combinedDetails,
      });

      setIsConfirmOpen(false);
      setIsResultOpen(true);

      // Refresh enrollments from server
      const refreshRes = await enrollmentsService.getStudentEnrollments(schoolCode);
      if (refreshRes.status && refreshRes.data) {
        setAllEnrollments(refreshRes.data);
      }
    } catch (err: any) {
      console.error("Error executing promotion:", err);
      setErrorMsg(err.message || "Error al procesar la promoción masiva.");
    } finally {
      setIsExecuting(false);
    }
  };

  const sourceYearObj = years.find((y) => y.id === Number(sourceYearId));
  const targetYearObj = years.find((y) => y.id === Number(targetYearId));
  const targetGradeObj = grades.find((g) => g.code === targetGradeCode);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/school/enrollments/annual" className="hover:underline">
              Matrículas
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Promoción Masiva (Rollover)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Promoción Anual & Rollover Académico
          </h1>
          <p className="text-sm text-muted-foreground">
            Transfiere y promueve estudiantes masivamente de un ciclo lectivo al siguiente con validación atómica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="top-execute-btn"
            onClick={() => setIsConfirmOpen(true)}
            disabled={selectedCount === 0 || !targetYearId || isExecuting}
            className="flex items-center gap-2 px-4 py-2 shadow-sm rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Ejecutar Traspaso
          </button>
          <Link href="/school/academics/certificates">
            <Button variant="outline" className="gap-2 shadow-sm rounded-xl">
              <FileText className="h-4 w-4 text-primary" />
              Certificados & Diplomas
            </Button>
          </Link>
          <Link href="/school/enrollments/annual">
            <Button variant="outline" className="gap-2 shadow-sm rounded-xl">
              <GraduationCap className="h-4 w-4" />
              Matrícula Anual
            </Button>
          </Link>
        </div>
      </div>

      {/* Configuration Card: Origen vs Destino */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 p-5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Configuración del Traspaso de Ciclo</h3>
                <p className="text-xs text-muted-foreground">
                  Selecciona el período de origen y define el ciclo y grado de llegada para los estudiantes.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-background/80 text-xs">
              Paso 1 de 2: Definir Criterios
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Origen (5 cols) */}
            <div className="lg:col-span-5 space-y-4 p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-700 text-white hover:bg-slate-700 text-xs">Origen</Badge>
                <span className="font-medium text-sm">Ciclo y Grado Actual</span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Ciclo Lectivo Origen
                  </Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    value={sourceYearId}
                    onChange={(e) => setSourceYearId(Number(e.target.value))}
                  >
                    <option value={0}>Selecciona Ciclo Origen...</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} ({y.yearCode}) {y.isCurrent ? "— [Ciclo Activo]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Grado Escolar Origen
                  </Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    value={sourceGradeCode}
                    onChange={(e) => setSourceGradeCode(e.target.value)}
                  >
                    <option value="ALL">Todos los grados (Filtrado Global)</option>
                    {grades.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.name} (Nivel {g.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Separator / Arrow (2 cols) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mb-1 shadow-sm">
                <ArrowRight className="h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Promoción a</span>
            </div>

            {/* Destino (5 cols) */}
            <div className="lg:col-span-5 space-y-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground hover:bg-primary text-xs">Destino</Badge>
                <span className="font-medium text-sm text-foreground">Ciclo y Grado de Promoción</span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-primary/80 mb-1 block">
                    Ciclo Lectivo Destino
                  </Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-primary/30 bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    value={targetYearId}
                    onChange={(e) => setTargetYearId(Number(e.target.value))}
                  >
                    <option value={0}>Selecciona Ciclo Destino...</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} ({y.yearCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-primary/80 mb-1 block">
                    Grado Destino (Para Promovidos)
                  </Label>
                  <select
                    data-testid="target-grade-select"
                    className="w-full h-10 px-3 rounded-lg border border-primary/30 bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    value={targetGradeCode}
                    onChange={(e) => setTargetGradeCode(e.target.value)}
                  >
                    <option value="">Selecciona Grado de Destino...</option>
                    {grades.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.name} (Nivel {g.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Candidatos Activos</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold">{candidates.length}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">En ciclo {sourceYearObj?.name || "origen"}</p>
        </Card>

        <Card className="rounded-xl border-border/60 bg-emerald-500/5 border-emerald-500/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">A Promover</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{promoteCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Hacia {targetGradeObj?.name || "grado destino"}</p>
        </Card>

        <Card className="rounded-xl border-border/60 bg-amber-500/5 border-amber-500/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">A Repetir</span>
            <RefreshCw className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{repeatCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Mantienen grado en {targetYearObj?.name || "destino"}</p>
        </Card>

        <Card className="rounded-xl border-border/60 bg-purple-500/5 border-purple-500/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">A Graduar / Egresar</span>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{graduateCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Finalizan ciclo sin nueva matrícula</p>
        </Card>
      </div>

      {/* Candidate List Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar estudiante por nombre o DNI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 md:w-80 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">
              Mostrando {visibleCandidates.length} de {candidates.length} estudiantes
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Acción masiva:</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              onClick={() => setBulkAction("PROMOTE")}
              disabled={selectedCount === 0}
            >
              Promover Todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              onClick={() => setBulkAction("REPEAT")}
              disabled={selectedCount === 0}
            >
              Repetir Todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-purple-600 border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() => setBulkAction("GRADUATE")}
              disabled={selectedCount === 0}
            >
              Graduar Todos
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Cargando nómina académica...</p>
            </div>
          ) : visibleCandidates.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h4 className="font-semibold text-base mb-1">No se encontraron estudiantes activos</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No hay estudiantes con matrícula activa en el ciclo y grado de origen seleccionados. Prueba cambiando el ciclo o el grado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>DNI / Matrícula</TableHead>
                    <TableHead>Grado Actual</TableHead>
                    <TableHead>Destino Asignado</TableHead>
                    <TableHead className="text-right">Acción Individual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleCandidates.map((c) => {
                    return (
                      <TableRow
                        key={c.studentId}
                        className={!c.selected ? "opacity-50 bg-muted/10" : "hover:bg-muted/20"}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={c.selected}
                            onChange={() => toggleSelectCandidate(c.studentId)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                              {c.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-foreground">{c.fullName}</div>
                              <span className="text-xs text-muted-foreground">Matrícula #{c.enrollmentId}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.nationalId}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-background">
                            {c.sourceGradeName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.action === "PROMOTE" ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              Promover a {targetGradeObj?.name || targetGradeCode} ({targetYearObj?.yearCode})
                            </div>
                          ) : c.action === "REPEAT" ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                              <RefreshCw className="h-3.5 w-3.5" />
                              Repetir {c.sourceGradeName} ({targetYearObj?.yearCode})
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                              <GraduationCap className="h-3.5 w-3.5" />
                              Egresar / Graduar
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex rounded-lg border border-border/80 p-0.5 bg-muted/40">
                            <button
                              type="button"
                              onClick={() => setCandidateAction(c.studentId, "PROMOTE")}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                c.action === "PROMOTE"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Promover
                            </button>
                            <button
                              type="button"
                              onClick={() => setCandidateAction(c.studentId, "REPEAT")}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                c.action === "REPEAT"
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Repetir
                            </button>
                            <button
                              type="button"
                              onClick={() => setCandidateAction(c.studentId, "GRADUATE")}
                              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                                c.action === "GRADUATE"
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Graduar
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Bottom Bar for Bulk Execution */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/80 px-6 py-3.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {selectedCount} estudiantes seleccionados para traspaso
            </div>
            <div className="text-xs text-muted-foreground">
              {promoteCount} promoción • {repeatCount} repitencia • {graduateCount} graduación
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="execute-promotion-btn"
            className="flex items-center rounded-xl px-6 py-2.5 gap-2 bg-primary hover:bg-primary/90 text-white shadow-md font-semibold text-sm cursor-pointer disabled:opacity-50"
            disabled={selectedCount === 0 || !targetYearId || isExecuting}
            onClick={() => setIsConfirmOpen(true)}
          >
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Ejecutar Traspaso Masivo
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Confirmar Traspaso de Ciclo Lectivo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Esta acción actualizará la matrícula de origen y registrará a los estudiantes seleccionados en el ciclo lectivo de destino.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ciclo Origen:</span>
                <span className="font-semibold text-foreground">{sourceYearObj?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ciclo Destino:</span>
                <span className="font-semibold text-primary">{targetYearObj?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Grado Destino (Promoción):</span>
                <span className="font-semibold text-foreground">{targetGradeObj?.name || targetGradeCode}</span>
              </div>
              <div className="border-t border-border/40 my-1 pt-1 flex justify-between text-xs font-semibold">
                <span>Total a procesar:</span>
                <span className="text-primary">{selectedCount} estudiantes</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Los estudiantes promovidos quedarán con estado <strong>PROMOTED</strong> en el ciclo anterior y <strong>ACTIVE</strong> en el nuevo.</p>
              <p>• Los repetidores mantendrán su grado original en el nuevo ciclo lectivo.</p>
              <p>• Si algún estudiante ya tiene matrícula en el ciclo destino, se omitirá automáticamente para evitar duplicados.</p>
            </div>
          </DialogBody>

          <DialogFooter className="gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isExecuting}>
              Cancelar
            </Button>
            <Button data-testid="confirm-promotion-btn" onClick={handleExecutePromotion} disabled={isExecuting} className="gap-2">
              {isExecuting && <Loader2 className="h-4 w-4 animate-spin" />}
              Proceder con la Promoción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              Promoción Masiva Completada
            </DialogTitle>
            <DialogDescription>
              El proceso de traspaso anual se completó con éxito en el servidor.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 py-3">
            {executionResult && (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-600">{executionResult.totalProcessed}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">Procesados</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-600">{executionResult.successCount}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">Matriculados/Egresados</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-2xl font-bold text-amber-600">{executionResult.skippedCount}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5">Ya Existentes</div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Puedes emitir de inmediato las constancias de estudio y diplomas para los alumnos promovidos, o revisar el listado completo de matrículas en el nuevo ciclo.
            </p>
          </DialogBody>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Link href="/school/academics/certificates" className="w-full sm:w-auto">
              <Button className="w-full gap-2 bg-primary text-white shadow-sm">
                <FileText className="h-4 w-4" />
                Emitir Certificados Oficiales
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsResultOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
