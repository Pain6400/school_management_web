"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { assignmentsService, StudentGradeSummary } from "@/lib/services/assignments.service";
import { Pencil, RotateCcw, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface ManualOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentGradeSummary | null;
  classCode: string;
  onGradeUpdated: () => void;
  isReadOnly?: boolean;
}

export function ManualOverrideModal({
  open,
  onOpenChange,
  student,
  classCode,
  onGradeUpdated,
  isReadOnly = false,
}: ManualOverrideModalProps) {
  const [manualScoreInput, setManualScoreInput] = useState<string>("");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && student) {
      setManualScoreInput(student.percentage ? String(student.percentage) : "");
      setReasonInput(student.overrideReason || "");
      setErrorMessage(null);
    }
  }, [open, student]);

  if (!student) return null;

  const handleSaveOverride = async () => {
    const num = parseFloat(manualScoreInput);
    if (isNaN(num) || num < 0 || num > 100) {
      setErrorMessage("La calificación forzada debe estar entre 0.0 y 100.0%.");
      return;
    }

    if (!reasonInput.trim()) {
      setErrorMessage("El motivo o justificación pedagógica es obligatorio para auditoría.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await assignmentsService.overrideFinalGrade({
        classCode,
        studentId: student.studentId,
        manualScore: num,
        reason: reasonInput.trim(),
      });

      if (res.status) {
        onGradeUpdated();
        onOpenChange(false);
      } else {
        setErrorMessage(res.message || "Error al sobrescribir la calificación.");
      }
    } catch (err: any) {
      console.error("Error overriding grade:", err);
      setErrorMessage(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreCalculated = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await assignmentsService.restoreCalculatedGrade({
        classCode,
        studentId: student.studentId,
      });

      if (res.status) {
        onGradeUpdated();
        onOpenChange(false);
      } else {
        setErrorMessage(res.message || "Error al restaurar la calificación.");
      }
    } catch (err: any) {
      console.error("Error restoring grade:", err);
      setErrorMessage(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Ajuste Manual de Promedio Final (*Manual Override*)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modifica de forma excepcional la nota final de un estudiante respetando trazabilidad y auditoría.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          {/* INFO ESTUDIANTE */}
          <div className="p-3 rounded-xl bg-muted/40 border text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Estudiante:</span>
              <span className="font-bold text-foreground">
                {student.firstName} {student.lastName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Carnet / Código:</span>
              <code className="font-mono text-primary font-bold">{student.userCode}</code>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-muted-foreground font-semibold">Promedio Matemático (Backend):</span>
              <Badge variant="outline" className="font-mono font-bold text-xs bg-primary/10 text-primary">
                {student.calculatedGrade !== undefined ? `${student.calculatedGrade}%` : "Calculando..."}
              </Badge>
            </div>
          </div>

          {/* ESTADO ACTUAL DE SOBRESCRITURA */}
          {student.isGradeOverridden && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="size-4" />
                <span>Esta calificación ya fue ajustada manualmente</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Motivo registrado: &ldquo;{student.overrideReason}&rdquo;
              </p>
            </div>
          )}

          {/* INPUT NOTA MANUAL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Nueva Calificación Final Oficial (%)
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                disabled={isReadOnly}
                value={manualScoreInput}
                onChange={(e) => setManualScoreInput(e.target.value)}
                placeholder="Ej: 85.0"
                className="h-10 text-lg font-mono font-bold pr-8"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">%</span>
            </div>
          </div>

          {/* TEXTAREA MOTIVO */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
              <span>Motivo / Justificación Pedagógica</span>
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={3}
              disabled={isReadOnly}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Ej: Aprobó prueba de recuperación extraordinaria el 10/10/2026..."
              className="text-xs"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-col sm:flex-row justify-between gap-2">
          {student.isGradeOverridden && !isReadOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleRestoreCalculated}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              Restaurar Cálculo ({student.calculatedGrade}%)
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {!isReadOnly && (
              <Button size="sm" disabled={isSubmitting} onClick={handleSaveOverride} className="font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" /> Guardando...
                  </>
                ) : (
                  "Aplicar Ajuste Manual"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
