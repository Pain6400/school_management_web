"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { assignmentsService, ClassGradebook } from "@/lib/services/assignments.service";
import { Lock, Unlock, AlertTriangle, CheckCircle2, Loader2, Award, Users } from "lucide-react";

interface ConcludeClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gradebook: ClassGradebook;
  onConcludeStateChanged: () => void;
}

export function ConcludeClassDialog({
  open,
  onOpenChange,
  gradebook,
  onConcludeStateChanged,
}: ConcludeClassDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAlreadyConcluded = !!gradebook.class.isConcluded;

  const handleToggleConclude = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isAlreadyConcluded) {
        // Reopen class
        const res = await assignmentsService.unconcludeClass(gradebook.class.code);
        if (res.status) {
          onConcludeStateChanged();
          onOpenChange(false);
        } else {
          setErrorMessage(res.message || "Error al reabrir la clase.");
        }
      } else {
        // Conclude class
        const res = await assignmentsService.concludeClass(gradebook.class.code);
        if (res.status) {
          onConcludeStateChanged();
          onOpenChange(false);
        } else {
          setErrorMessage(res.message || "Error al concluir la clase.");
        }
      }
    } catch (err: any) {
      console.error("Error toggling conclude status:", err);
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
            <div
              className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                isAlreadyConcluded
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isAlreadyConcluded ? <Unlock className="size-5" /> : <Lock className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isAlreadyConcluded ? "Reabrir Edición de Calificaciones" : "Concluir Clase y Bloquear Notas"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAlreadyConcluded
                  ? "Desbloquea el cuaderno para realizar rectificaciones de notas."
                  : "Finaliza formalmente el período académico para esta asignatura."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          {/* RESUMEN ESTADÍSTICO */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-muted/40 border">
              <span className="text-muted-foreground block text-[11px] font-semibold">Total Alumnos</span>
              <span className="text-lg font-extrabold text-foreground">{gradebook.totalStudents}</span>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border">
              <span className="text-muted-foreground block text-[11px] font-semibold">Promedio Grupal</span>
              <span className="text-lg font-extrabold text-primary">{gradebook.classAverage}%</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
              <span className="block text-[11px] font-semibold">Aprobados</span>
              <span className="text-lg font-extrabold">{gradebook.passingCount ?? 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
              <span className="block text-[11px] font-semibold">Reprobados</span>
              <span className="text-lg font-extrabold">{gradebook.failingCount ?? 0}</span>
            </div>
          </div>

          {/* ADVERTENCIA DE BLOQUEO / REAPERTURA */}
          {isAlreadyConcluded ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="size-4 shrink-0" />
                <span>¿Deseas desbloquear esta clase?</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Al reabrir la clase, los docentes podrán modificar nuevamente las tareas y calificaciones. Recuerda volver a concluirla antes de emitir los boletines definitivos.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Atención: Acción de Cierre Oficial</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Al concluir la clase, el cuaderno de notas quedará congelado en **solo-lectura**. Las notas oficiales calculadas y ajustadas se consolidarán para los reportes y boletines en PDF.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {errorMessage}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant={isAlreadyConcluded ? "default" : "destructive"}
            disabled={isSubmitting}
            onClick={handleToggleConclude}
            className="font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" /> Procesando...
              </>
            ) : isAlreadyConcluded ? (
              "Reabrir Clase"
            ) : (
              "Confirmar y Concluir Clase"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
