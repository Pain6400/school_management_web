"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClassGradebook,
  StudentGradeSummary,
  assignmentsService,
} from "@/lib/services/assignments.service";
import {
  Save,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  MoreVertical,
  MinusCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface GradeSheetMatrixProps {
  gradebook: ClassGradebook;
  filteredStudents: StudentGradeSummary[];
  onOpenManualOverride: (student: StudentGradeSummary) => void;
  onRefreshGradebook: () => void;
}

export function GradeSheetMatrix({
  gradebook,
  filteredStudents,
  onOpenManualOverride,
  onRefreshGradebook,
}: GradeSheetMatrixProps) {
  const isConcluded = !!gradebook.class.isConcluded;

  // Local state for modified cells: key = `${studentId}_${assignmentId}` -> { score?, gradeCode? }
  const [pendingChanges, setPendingChanges] = useState<
    Record<
      string,
      {
        assignmentId: number;
        studentId: string;
        score?: number | null;
        gradeCode?: string | null;
      }
    >
  >({});
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Clear pending changes when gradebook reloads
  useEffect(() => {
    setPendingChanges({});
  }, [gradebook]);

  const handleCellScoreChange = (
    studentId: string,
    assignmentId: number,
    valueStr: string,
    maxScore: number
  ) => {
    const key = `${studentId}_${assignmentId}`;
    if (valueStr.trim() === "") {
      setPendingChanges((prev) => ({
        ...prev,
        [key]: { assignmentId, studentId, score: null, gradeCode: null },
      }));
      return;
    }

    const num = parseFloat(valueStr);
    if (!isNaN(num) && num >= 0 && num <= maxScore) {
      setPendingChanges((prev) => ({
        ...prev,
        [key]: { assignmentId, studentId, score: num, gradeCode: null },
      }));
    }
  };

  const handleSetGradeCode = (
    studentId: string,
    assignmentId: number,
    code: "EX" | "INC" | "AB" | null
  ) => {
    const key = `${studentId}_${assignmentId}`;
    setPendingChanges((prev) => ({
      ...prev,
      [key]: {
        assignmentId,
        studentId,
        score: code === "INC" ? 0 : null,
        gradeCode: code,
      },
    }));
  };

  const handleSaveAll = async () => {
    const changesArray = Object.values(pendingChanges);
    if (changesArray.length === 0) return;

    try {
      setIsSavingBulk(true);
      setSaveSuccessMessage(null);

      const payload = changesArray.map((c) => ({
        assignmentId: c.assignmentId,
        studentId: c.studentId,
        score: c.score !== null ? c.score : undefined,
        gradeCode: c.gradeCode || undefined,
      }));

      const res = await assignmentsService.bulkGrade(payload);
      if (res.status) {
        setPendingChanges({});
        setSaveSuccessMessage(`Se guardaron ${res.data.count} calificaciones con éxito.`);
        setTimeout(() => setSaveSuccessMessage(null), 3500);
        onRefreshGradebook();
      }
    } catch (err) {
      console.error("Error bulk grading:", err);
    } finally {
      setIsSavingBulk(false);
    }
  };

  const pendingCount = Object.keys(pendingChanges).length;

  return (
    <div className="space-y-3">
      {/* BARRA DE ACCIÓN Y ESTADO DE GUARDADO */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border border-border/80">
        <div className="flex items-center gap-2 text-xs">
          {isConcluded ? (
            <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2.5">
              <Lock className="size-3.5" />
              <span>Cuaderno Bloqueado (Clase Concluida)</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-500/10 text-emerald-700 border-emerald-300">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>Cuaderno Activo para Edición</span>
            </Badge>
          )}

          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 border-amber-300 font-semibold text-xs">
              {pendingCount} cambio(s) sin guardar
            </Badge>
          )}

          {saveSuccessMessage && (
            <span className="text-emerald-600 font-semibold animate-pulse text-xs">
              ✓ {saveSuccessMessage}
            </span>
          )}
        </div>

        {!isConcluded && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPendingChanges({})}
                className="text-xs text-muted-foreground"
              >
                Descartar cambios
              </Button>
            )}
            <Button
              size="sm"
              disabled={isSavingBulk || pendingCount === 0}
              onClick={handleSaveAll}
              className="font-bold text-xs shadow-xs"
            >
              {isSavingBulk ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Guardando matriz...
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" /> Guardar Notas ({pendingCount})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* MATRIZ TIPO HOJA DE CÁLCULO */}
      <div className="border border-border/80 rounded-xl overflow-hidden bg-card/60 shadow-xs">
        <div className="overflow-x-auto max-h-[650px] relative">
          <Table className="border-collapse text-xs">
            <TableHeader className="bg-muted/80 sticky top-0 z-20 backdrop-blur-xs">
              <TableRow className="border-b border-border/80">
                {/* 1. COLUMNAS FIJAS: ALUMNO */}
                <TableHead className="w-28 font-bold text-xs sticky left-0 z-30 bg-muted/95 border-r min-w-[120px]">
                  Carnet
                </TableHead>
                <TableHead className="w-48 font-bold text-xs sticky left-[120px] z-30 bg-muted/95 border-r min-w-[200px]">
                  Estudiante
                </TableHead>

                {/* 2. COLUMNAS DE TAREAS DINÁMICAS */}
                {gradebook.assignments.map((asg) => (
                  <TableHead
                    key={asg.id}
                    className="min-w-[140px] max-w-[170px] text-center p-2 border-r border-border/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 font-bold truncate max-w-[120px]"
                        >
                          {asg.type} ({asg.weight}%)
                        </Badge>
                      </div>
                      <div className="font-bold text-foreground text-xs truncate" title={asg.title}>
                        {asg.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Máx: {asg.maxScore} pts
                      </div>
                    </div>
                  </TableHead>
                ))}

                {/* 3. COLUMNA PROMEDIO PONDERADO FINAL */}
                <TableHead className="min-w-[160px] text-center sticky right-0 z-30 bg-muted/95 border-l font-bold text-xs">
                  Promedio Ponderado Final
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredStudents.map((st) => (
                <TableRow key={st.studentId} className="hover:bg-muted/20 border-b border-border/50">
                  {/* Carnet (Sticky) */}
                  <TableCell className="font-mono text-[11px] font-bold text-muted-foreground sticky left-0 z-10 bg-card/95 border-r">
                    {st.userCode || "S/C"}
                  </TableCell>

                  {/* Nombre Alumno (Sticky) */}
                  <TableCell className="sticky left-[120px] z-10 bg-card/95 border-r py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                        {st.firstName[0]}{st.lastName[0]}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-foreground truncate block">
                          {st.firstName} {st.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {st.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Celdas de Tareas */}
                  {gradebook.assignments.map((asg) => {
                    const taskSummary = st.assignments.find((a) => a.assignmentId === asg.id);
                    const cellKey = `${st.studentId}_${asg.id}`;
                    const pending = pendingChanges[cellKey];

                    // Determine current active score and code (pending local change overrides server)
                    const activeScore = pending !== undefined ? pending.score : taskSummary?.score;
                    const activeCode = pending !== undefined ? pending.gradeCode : taskSummary?.gradeCode;
                    const isExempt = activeCode === "EX" || taskSummary?.isExempt;
                    const isDropped = taskSummary?.isDropped;

                    return (
                      <TableCell
                        key={asg.id}
                        className={`text-center p-1.5 border-r border-border/50 transition-colors ${
                          pending !== undefined ? "bg-amber-500/10" : ""
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* SI ESTÁ EXONERADO (EX) */}
                          {activeCode === "EX" ? (
                            <Badge className="bg-purple-500/15 text-purple-700 border-purple-300 font-mono text-[10px] py-0.5 px-2">
                              EX (Exento)
                            </Badge>
                          ) : activeCode === "INC" ? (
                            <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 font-mono text-[10px] py-0.5 px-2">
                              INC (0.0)
                            </Badge>
                          ) : activeCode === "AB" ? (
                            <Badge className="bg-gray-500/15 text-gray-700 border-gray-300 font-mono text-[10px] py-0.5 px-2">
                              AB (Ausente)
                            </Badge>
                          ) : (
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                max={asg.maxScore}
                                step="0.5"
                                disabled={isConcluded}
                                value={activeScore !== null && activeScore !== undefined ? activeScore : ""}
                                onChange={(e) =>
                                  handleCellScoreChange(
                                    st.studentId,
                                    asg.id,
                                    e.target.value,
                                    asg.maxScore
                                  )
                                }
                                placeholder="—"
                                className={`h-8 w-18 text-center font-mono font-bold text-xs p-1 ${
                                  isDropped
                                    ? "line-through text-muted-foreground/60 bg-muted/40"
                                    : ""
                                }`}
                              />
                              {isDropped && (
                                <span
                                  className="absolute -top-2 -right-1 size-3 rounded-full bg-emerald-500"
                                  title="Nota más baja descartada automáticamente por regla Drop Lowest"
                                />
                              )}
                            </div>
                          )}

                          {/* MENU DE CODIGOS ESPECIALES (EX, INC, AB) */}
                          {!isConcluded && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
                                <MoreVertical className="size-3" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                <DropdownMenuItem
                                  onClick={() => handleSetGradeCode(st.studentId, asg.id, "EX")}
                                  className="text-purple-600 font-medium"
                                >
                                  Marcar EX (Exonerado - No penaliza)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSetGradeCode(st.studentId, asg.id, "INC")}
                                  className="text-amber-600 font-medium"
                                >
                                  Marcar INC (Incompleto)
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSetGradeCode(st.studentId, asg.id, "AB")}
                                  className="text-gray-600 font-medium"
                                >
                                  Marcar AB (Ausente)
                                </DropdownMenuItem>
                                {(activeCode || activeScore !== null) && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetGradeCode(st.studentId, asg.id, null)}
                                    className="text-muted-foreground"
                                  >
                                    Limpiar calificación
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}

                  {/* Columna Promedio Ponderado Final (Sticky Right) */}
                  <TableCell className="sticky right-0 z-10 bg-card/95 border-l py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              st.isPassing ? "text-foreground" : "text-destructive"
                            }`}
                          >
                            {st.percentage.toFixed(1)}%
                          </span>
                          <Badge
                            className={`text-[10px] py-0 px-1.5 font-bold ${
                              st.isPassing
                                ? "bg-emerald-500/15 text-emerald-700 border-emerald-300"
                                : "bg-destructive/15 text-destructive border-destructive/30"
                            }`}
                          >
                            {st.letterGrade || (st.isPassing ? "A" : "F")}
                          </Badge>
                        </div>

                        {st.isGradeOverridden && (
                          <div
                            className="text-[10px] text-amber-600 flex items-center gap-1 justify-end font-semibold"
                            title={`Ajuste manual: ${st.overrideReason}. Calculado original: ${st.calculatedGrade}%`}
                          >
                            <Pencil className="size-2.5" />
                            <span>Manual ({st.calculatedGrade}%)</span>
                          </div>
                        )}
                      </div>

                      {/* Botón de Ajuste Manual (Override) */}
                      {!isConcluded && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onOpenManualOverride(st)}
                          title="Ajustar calificación final manualmente"
                          className="size-7 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
