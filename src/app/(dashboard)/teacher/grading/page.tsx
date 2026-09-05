"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Award, CheckSquare, Calendar, Users, ExternalLink, CheckCircle2 } from "lucide-react";
import { assignmentsService, Assignment } from "@/lib/services/assignments.service";
import { enrollmentsService, AssignmentSubmission } from "@/lib/services/enrollments.service";

export default function GradingPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Dialog de Calificación
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeForm, setGradeForm] = useState({
    score: 0,
    feedback: "",
  });
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // 1. Cargar tareas activas
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true);
        const res = await assignmentsService.getAssignments();
        if (res.status && res.data && res.data.length > 0) {
          setAssignments(res.data);
          setSelectedAssignmentId(res.data[0].id);
        }
      } catch (err) {
        console.error("Error loading assignments:", err);
      } finally {
        setLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, []);

  // 2. Cargar entregas al cambiar la tarea seleccionada
  const loadSubmissions = async () => {
    if (!selectedAssignmentId) return;
    try {
      setLoadingSubmissions(true);
      const res = await enrollmentsService.getSubmissionsByAssignment(selectedAssignmentId);
      if (res.status && res.data) {
        setSubmissions(res.data);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (selectedAssignmentId) {
      loadSubmissions();
    }
  }, [selectedAssignmentId]);

  const activeAssignment = assignments.find((a) => a.id === selectedAssignmentId);

  const openGradingDialog = (submission: AssignmentSubmission) => {
    setCurrentSubmission(submission);
    setGradeForm({
      score: submission.score || 0,
      feedback: submission.feedback || "",
    });
    setGradingModalOpen(true);
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubmission) return;

    try {
      setIsSubmittingGrade(true);
      const res = await enrollmentsService.gradeSubmission(currentSubmission.id, {
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback || undefined,
        status: "GRADED",
      });

      if (res.status) {
        setGradingModalOpen(false);
        loadSubmissions();
      }
    } catch (err) {
      console.error("Error grading submission:", err);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Centro de Calificaciones</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa las entregas de tus estudiantes, califica y envía retroalimentación formativa.
          </p>
        </div>
      </div>

      {/* SELECTOR DE TAREA */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold">Selecciona la Tarea / Actividad</Label>
              <Select
                value={selectedAssignmentId ? String(selectedAssignmentId) : ""}
                onValueChange={(val) => setSelectedAssignmentId(Number(val) || 0)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una tarea..." />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.title} — {a.classCode || "General"} (Máx {a.maxScore} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeAssignment && (
              <div className="flex flex-wrap items-center gap-3 pt-4 sm:pt-0 sm:border-l sm:pl-4">
                <div>
                  <span className="text-xs text-muted-foreground">Puntaje Máximo:</span>
                  <p className="font-bold text-primary">{activeAssignment.maxScore} pts</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Fecha Límite:</span>
                  <p className="font-semibold text-xs text-foreground">
                    {activeAssignment.dueDate ? new Date(activeAssignment.dueDate).toLocaleDateString() : "Sin fecha"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SUBMISSIONS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" /> Entregas Recibidas
          </CardTitle>
          <CardDescription>
            Lista de estudiantes que han enviado sus respuestas o archivos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSubmissions ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Cargando entregas de la tarea...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="size-10 stroke-1 text-muted-foreground/40 mx-auto mb-2" />
              <p className="font-medium">No se registran entregas aún para esta tarea.</p>
              <p className="text-xs">Los estudiantes pueden entregar sus trabajos a través de su portal.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Fecha de Entrega</TableHead>
                    <TableHead>Contenido / Archivo</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-semibold text-sm">
                          {sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : sub.studentId}
                        </div>
                        {sub.student?.userCode && (
                          <code className="text-[11px] text-muted-foreground">{sub.student.userCode}</code>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {sub.submissionDate ? new Date(sub.submissionDate).toLocaleString() : "—"}
                      </TableCell>

                      <TableCell className="max-w-xs truncate text-xs">
                        {sub.fileUrl ? (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <span>Ver Archivo Adjunto</span>
                            <ExternalLink className="size-3" />
                          </a>
                        ) : sub.content ? (
                          <span className="text-muted-foreground">{sub.content}</span>
                        ) : (
                          <span className="italic text-muted-foreground">Sin contenido adicional</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {sub.score !== undefined && sub.score !== null ? (
                          <span className="font-bold text-primary">
                            {sub.score} / {activeAssignment?.maxScore || 100} pts
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin calificar</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={sub.status === "GRADED" ? "default" : "secondary"}
                          className={
                            sub.status === "GRADED"
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[11px]"
                              : "text-[11px]"
                          }
                        >
                          {sub.status === "GRADED" ? "Calificado" : sub.status || "Entregado"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openGradingDialog(sub)}>
                          Calificar
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

      {/* MODAL DE CALIFICAR */}
      <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Calificar Entrega</DialogTitle>
            <DialogDescription>
              Asigna la nota obtenida sobre {activeAssignment?.maxScore || 100} puntos posibles.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="score">
                Puntuación (Máx {activeAssignment?.maxScore || 100} pts) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="score"
                type="number"
                min="0"
                max={activeAssignment?.maxScore || 100}
                step="0.5"
                value={gradeForm.score}
                onChange={(e) => setGradeForm({ ...gradeForm, score: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Retroalimentación / Comentario</Label>
              <Textarea
                id="feedback"
                rows={3}
                placeholder="Escribe comentarios formativos para el estudiante..."
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmittingGrade}>
                {isSubmittingGrade ? <Loader2 className="size-4 animate-spin mr-1" /> : <CheckCircle2 className="size-4 mr-1" />}
                Guardar Nota
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}