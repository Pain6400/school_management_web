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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { assignmentsService, AssignmentType } from "@/lib/services/assignments.service";
import { Scale, CheckCircle2, AlertTriangle, Loader2, Sparkles, HelpCircle } from "lucide-react";

interface CategoryWeightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentTypes: AssignmentType[];
  onWeightsUpdated: () => void;
  isReadOnly?: boolean;
}

export function CategoryWeightsModal({
  open,
  onOpenChange,
  assignmentTypes,
  onWeightsUpdated,
  isReadOnly = false,
}: CategoryWeightsModalProps) {
  const [typesState, setTypesState] = useState<
    Array<{
      id: number;
      name: string;
      weight: number;
      dropLowest: boolean;
      isExtraCredit: boolean;
      description?: string;
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && assignmentTypes) {
      setTypesState(
        assignmentTypes.map((t) => ({
          id: t.id,
          name: t.name,
          weight: Number(t.weight || 0),
          dropLowest: !!t.dropLowest,
          isExtraCredit: !!t.isExtraCredit,
          description: t.description,
        }))
      );
      setErrorMessage(null);
    }
  }, [open, assignmentTypes]);

  // Compute standard weight sum (excluding extra credit)
  const standardSum = typesState
    .filter((t) => !t.isExtraCredit)
    .reduce((sum, t) => sum + (Number(t.weight) || 0), 0);

  const isExactly100 = Math.abs(standardSum - 100) < 0.05;

  const handleWeightChange = (id: number, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setTypesState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, weight: val } : t))
    );
  };

  const handleToggleDropLowest = (id: number, checked: boolean) => {
    setTypesState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dropLowest: checked } : t))
    );
  };

  const handleToggleExtraCredit = (id: number, checked: boolean) => {
    setTypesState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExtraCredit: checked } : t))
    );
  };

  const handleSave = async () => {
    if (!isExactly100) {
      setErrorMessage(
        `Las categorías regulares deben sumar exactamente el 100%. Suma actual: ${standardSum.toFixed(1)}%`
      );
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // Update all categories in parallel
      await Promise.all(
        typesState.map((t) =>
          assignmentsService.updateAssignmentType(t.id, {
            weight: t.weight,
            dropLowest: t.dropLowest,
            isExtraCredit: t.isExtraCredit,
          })
        )
      );

      onWeightsUpdated();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving weights:", err);
      setErrorMessage(err.message || "Error al guardar las ponderaciones.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Scale className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Configuración de Ponderaciones (Gradebook)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Define el porcentaje de peso de cada categoría de evaluación, descarte de la nota más baja y créditos adicionales.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 py-2">
          {/* BARRA DE VALIDACIÓN 100% */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
              isExactly100
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {isExactly100 ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              )}
              <span>
                {isExactly100
                  ? "Ponderaciones válidas: la suma estándar es exactamente 100.0%"
                  : `La suma de categorías debe ser 100.0%. Diferencia: ${(100 - standardSum).toFixed(1)}%`}
              </span>
            </div>
            <Badge
              variant="outline"
              className={`font-mono font-bold text-xs ${
                isExactly100
                  ? "bg-emerald-500/20 text-emerald-700 border-emerald-400"
                  : "bg-amber-500/20 text-amber-700 border-amber-400"
              }`}
            >
              Total: {standardSum.toFixed(1)}%
            </Badge>
          </div>

          {/* LISTA DE CATEGORÍAS */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {typesState.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl border border-border/80 bg-card/60 hover:bg-muted/30 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{cat.name}</span>
                    {cat.isExtraCredit && (
                      <Badge className="bg-blue-500/15 text-blue-700 border-blue-300 text-[10px] py-0">
                        Crédito Extra
                      </Badge>
                    )}
                    {cat.dropLowest && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 text-[10px] py-0">
                        Drop Lowest
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Label className="text-xs text-muted-foreground font-semibold">Peso:</Label>
                    <div className="relative w-24">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        disabled={isReadOnly}
                        value={cat.weight}
                        onChange={(e) => handleWeightChange(cat.id, e.target.value)}
                        className="h-8 text-right pr-6 font-mono font-bold text-xs"
                      />
                      <span className="absolute right-2 top-2 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                {/* OPCIONES AVANZADAS DE LA CATEGORÍA */}
                <div className="flex flex-wrap items-center gap-5 pt-1 text-xs border-t border-border/40">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={cat.dropLowest}
                      disabled={isReadOnly || cat.isExtraCredit}
                      onCheckedChange={(chk) => handleToggleDropLowest(cat.id, !!chk)}
                    />
                    <span className="text-muted-foreground font-medium">
                      Descartar nota más baja (*Drop lowest*)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={cat.isExtraCredit}
                      disabled={isReadOnly}
                      onCheckedChange={(chk) => handleToggleExtraCredit(cat.id, !!chk)}
                    />
                    <span className="text-muted-foreground font-medium">
                      Categoría de Crédito Extra (&gt; 100%)
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {!isReadOnly && (
            <Button
              size="sm"
              disabled={isSaving || !isExactly100}
              onClick={handleSave}
              className="font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Guardando...
                </>
              ) : (
                "Guardar Ponderaciones"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
