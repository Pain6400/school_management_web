"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Plus, Trash2, GraduationCap, Search, AlertCircle } from "lucide-react";
import { enrollmentsService, StudentEnrollment } from "@/lib/services/enrollments.service";
import { studentsService, Student } from "@/lib/services/api.service";
import { academicsService, AcademicYear, Grade } from "@/lib/services/academics.service";

export default function AnnualEnrollmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [loadingAnnual, setLoadingAnnual] = useState(true);
  const [isAnnualOpen, setIsAnnualOpen] = useState(false);
  const [annualError, setAnnualError] = useState<string | null>(null);
  const [isSubmittingAnnual, setIsSubmittingAnnual] = useState(false);
  const [searchAnnual, setSearchAnnual] = useState("");
  const [annualForm, setAnnualForm] = useState({
    studentId: "",
    academicYearId: 0,
    gradeCode: "",
    schoolCode: "ESC001",
    enrollmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const studentOptions = useMemo(() => {
    return students.map((s) => ({
      value: s.publicId,
      label: `${s.firstName} ${s.lastName}`,
      description: `@${s.username} • ${s.identityNumber || s.userCode || 'Sin código'}`,
    }));
  }, [students]);

  const yearOptions = useMemo(() => {
    return years.map((y) => ({
      value: String(y.id),
      label: y.name,
      badge: y.yearCode,
    }));
  }, [years]);

  const gradeOptions = useMemo(() => {
    return grades.map((g) => ({
      value: g.code,
      label: g.name,
      badge: g.code,
    }));
  }, [grades]);

  const loadCatalogs = async () => {
    try {
      const [stuRes, yrsRes, grdRes] = await Promise.allSettled([
        studentsService.getStudents(),
        academicsService.getAcademicYears(),
        academicsService.getGrades(),
      ]);

      if (stuRes.status === "fulfilled" && stuRes.value.status) setStudents(stuRes.value.data);
      if (yrsRes.status === "fulfilled" && yrsRes.value.status) setYears(yrsRes.value.data);
      if (grdRes.status === "fulfilled" && grdRes.value.status) setGrades(grdRes.value.data);
    } catch (err) {
      console.error("Error loading catalogs:", err);
    }
  };

  const loadAnnualEnrollments = async () => {
    try {
      setLoadingAnnual(true);
      const res = await enrollmentsService.getStudentEnrollments();
      if (res.status && res.data) setStudentEnrollments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnnual(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
    loadAnnualEnrollments();
  }, []);

  const studentMap = useMemo(() => {
    return Object.fromEntries(
      students.map((s) => [s.publicId, `${s.firstName} ${s.lastName} (${s.userCode || s.username})`])
    );
  }, [students]);

  const yearMap = useMemo(() => {
    return Object.fromEntries(years.map((y) => [y.id, `${y.name} (${y.yearCode})`]));
  }, [years]);

  const gradeMap = useMemo(() => {
    return Object.fromEntries(grades.map((g) => [g.code, g.name]));
  }, [grades]);

  const handleSubmitAnnual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annualForm.studentId || !annualForm.academicYearId) {
      alert("Por favor selecciona un estudiante y un año escolar.");
      return;
    }
    try {
      setIsSubmittingAnnual(true);
      const res = await enrollmentsService.createStudentEnrollment({
        ...annualForm,
        academicYearId: Number(annualForm.academicYearId),
        gradeCode: annualForm.gradeCode || undefined,
        status: "ACTIVE",
      });
      if (res.status) {
        setIsAnnualOpen(false);
        setAnnualForm({
          studentId: "",
          academicYearId: years[0]?.id || 0,
          gradeCode: "",
          schoolCode: "ESC001",
          enrollmentDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
        loadAnnualEnrollments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAnnual(false);
    }
  };

  const handleDeleteAnnual = async (id: number) => {
    if (!confirm("¿Eliminar esta matrícula anual?")) return;
    try {
      await enrollmentsService.deleteStudentEnrollment(id);
      loadAnnualEnrollments();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAnnual = studentEnrollments.filter((se) => {
    const q = searchAnnual.toLowerCase();
    const studentName = studentMap[se.studentId] || "";
    return !q || studentName.toLowerCase().includes(q) || (se.gradeCode && se.gradeCode.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Matrículas por Año Escolar
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Registro oficial de estudiantes formalmente matriculados en el ciclo escolar institucional.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Listado de Estudiantes Matriculados</CardTitle>
            <CardDescription>
              Filtra por nombre o grado y realiza nuevas inscripciones institucionales.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estudiante..."
                value={searchAnnual}
                onChange={(e) => setSearchAnnual(e.target.value)}
                className="pl-9"
              />
            </div>

            <Dialog open={isAnnualOpen} onOpenChange={(open) => { setIsAnnualOpen(open); if (open) setAnnualError(null); }}>
              <DialogTrigger render={<Button size="sm"><Plus className="mr-2 size-4" /> Nueva Matrícula</Button>} />
              <DialogContent size="xl">
                <form onSubmit={handleSubmitAnnual} className="flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Matricular Estudiante en Ciclo Escolar</DialogTitle>
                    <DialogDescription>
                      Selecciona el estudiante, el año académico y el grado al que ingresa.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogBody className="space-y-5">
                    {annualError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <AlertCircle className="size-4 shrink-0 text-red-500" />
                        <span>{annualError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-neutral-700">
                        Estudiante <span className="text-red-500">*</span>
                      </Label>
                      <Combobox
                        options={studentOptions}
                        value={annualForm.studentId}
                        onChange={(val) => setAnnualForm({ ...annualForm, studentId: val })}
                        placeholder="Buscar y seleccionar estudiante..."
                        searchPlaceholder="Escribe el nombre o documento..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-neutral-700">
                          Año Académico <span className="text-red-500">*</span>
                        </Label>
                        <Combobox
                          options={yearOptions}
                          value={String(annualForm.academicYearId || '')}
                          onChange={(val) => setAnnualForm({ ...annualForm, academicYearId: Number(val || 0) })}
                          placeholder="Seleccionar año..."
                          searchPlaceholder="Buscar año..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-neutral-700">
                          Grado Escolar <span className="text-red-500">*</span>
                        </Label>
                        <Combobox
                          options={gradeOptions}
                          value={annualForm.gradeCode}
                          onChange={(val) => setAnnualForm({ ...annualForm, gradeCode: val })}
                          placeholder="Seleccionar grado..."
                          searchPlaceholder="Buscar grado..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="enrollmentDate" className="text-xs font-bold text-neutral-700">
                          Fecha de Matrícula
                        </Label>
                        <Input
                          id="enrollmentDate"
                          type="date"
                          value={annualForm.enrollmentDate}
                          onChange={(e) => setAnnualForm({ ...annualForm, enrollmentDate: e.target.value })}
                          required
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-xs font-bold text-neutral-700">
                          Observaciones (Opcional)
                        </Label>
                        <Input
                          id="notes"
                          placeholder="Ej: Beca parcial, ingreso tardío, etc."
                          value={annualForm.notes}
                          onChange={(e) => setAnnualForm({ ...annualForm, notes: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </DialogBody>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setIsAnnualOpen(false); setAnnualError(null); }}
                      disabled={isSubmittingAnnual}
                      className="rounded-xl text-xs font-bold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingAnnual}
                      className="rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
                    >
                      {isSubmittingAnnual ? <><Loader2 className="mr-2 size-3.5 animate-spin" />Guardando...</> : "Completar Matrícula"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loadingAnnual ? (
            <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Año Académico</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Fecha Inscripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnual.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <GraduationCap className="size-8 stroke-1 text-muted-foreground/40" />
                          <p>No hay matrículas registradas para este filtro.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnnual.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="font-semibold text-foreground">
                            {m.student ? `${m.student.firstName} ${m.student.lastName}` : studentMap[m.studentId] || m.studentId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {m.academicYear?.name || yearMap[m.academicYearId] || `Año ${m.academicYearId}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {m.grade?.name || gradeMap[m.gradeCode || ""] || m.gradeCode || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.enrollmentDate ? new Date(m.enrollmentDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[11px]">
                            {m.status || "Activa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteAnnual(m.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
