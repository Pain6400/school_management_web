"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogBody, DialogFooter
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2, Plus, Trash2, GraduationCap, Search, AlertCircle,
  Tag, Sparkles, DollarSign, Calendar, Edit3, CheckCircle2, ShieldCheck
} from "lucide-react";
import { enrollmentsService, StudentEnrollment } from "@/lib/services/enrollments.service";
import { studentsService, Student } from "@/lib/services/api.service";
import { academicsService, AcademicYear, Grade } from "@/lib/services/academics.service";
import { AsyncStudentSearch } from "@/components/finance/async-student-search";

export default function AnnualEnrollmentsPage() {
  const { user } = useAuthStore();
  const schoolCode = user?.schoolCode || "ESC001";

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [loadingAnnual, setLoadingAnnual] = useState(true);

  // Search filter
  const [searchAnnual, setSearchAnnual] = useState("");

  // New Enrollment Modal State
  const [isAnnualOpen, setIsAnnualOpen] = useState(false);
  const [annualError, setAnnualError] = useState<string | null>(null);
  const [isSubmittingAnnual, setIsSubmittingAnnual] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [annualForm, setAnnualForm] = useState({
    academicYearId: 0,
    gradeCode: "",
    enrollmentDate: new Date().toISOString().split("T")[0],
    monthlyFee: 1500,
    scholarshipPercentage: 0,
    dueDay: 10,
    notes: "",
  });

  // Edit Fee Modal State
  const [isEditFeeOpen, setIsEditFeeOpen] = useState(false);
  const [enrollmentToEdit, setEnrollmentToEdit] = useState<StudentEnrollment | null>(null);
  const [editFeeForm, setEditFeeForm] = useState({
    monthlyFee: 1500,
    scholarshipPercentage: 0,
    dueDay: 10,
    notes: "",
  });
  const [isSubmittingEditFee, setIsSubmittingEditFee] = useState(false);
  const [editFeeError, setEditFeeError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    return years.map((y) => ({
      value: String(y.id),
      label: y.name,
      badge: String(y.yearCode),
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
      const [yrsRes, grdRes] = await Promise.allSettled([
        academicsService.getAcademicYears(),
        academicsService.getGrades(),
      ]);

      if (yrsRes.status === "fulfilled" && yrsRes.value.status && yrsRes.value.data) {
        setYears(yrsRes.value.data);
        const currentYear = yrsRes.value.data.find((y) => y.isCurrent) || yrsRes.value.data[0];
        if (currentYear) {
          setAnnualForm((prev) => ({ ...prev, academicYearId: currentYear.id }));
        }
      }
      if (grdRes.status === "fulfilled" && grdRes.value.status && grdRes.value.data) {
        setGrades(grdRes.value.data);
      }
    } catch (err) {
      console.error("Error loading catalogs:", err);
    }
  };

  const loadAnnualEnrollments = async () => {
    try {
      setLoadingAnnual(true);
      const res = await enrollmentsService.getStudentEnrollments(schoolCode);
      if (res.status && res.data) {
        setStudentEnrollments(res.data);
      }
    } catch (err) {
      console.error("Error loading enrollments:", err);
    } finally {
      setLoadingAnnual(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
    loadAnnualEnrollments();
  }, [schoolCode]);

  // When student is selected in New Enrollment, pre-fill scholarship
  const handleSelectStudentForEnrollment = (student: Student | null) => {
    setSelectedStudent(student);
    if (student) {
      setAnnualForm((prev) => ({
        ...prev,
        scholarshipPercentage: Number(student.scholarshipPercentage) || 0,
      }));
    } else {
      setAnnualForm((prev) => ({
        ...prev,
        scholarshipPercentage: 0,
      }));
    }
  };

  // Submit New Enrollment
  const handleSubmitAnnual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setAnnualError("Debes buscar y seleccionar un estudiante titular.");
      return;
    }
    if (!annualForm.academicYearId) {
      setAnnualError("Debes seleccionar el ciclo escolar.");
      return;
    }
    if (!annualForm.gradeCode) {
      setAnnualError("Debes seleccionar el grado escolar.");
      return;
    }

    try {
      setIsSubmittingAnnual(true);
      setAnnualError(null);

      const res = await enrollmentsService.createStudentEnrollment({
        studentId: selectedStudent.publicId,
        academicYearId: annualForm.academicYearId,
        gradeCode: annualForm.gradeCode,
        schoolCode,
        enrollmentDate: annualForm.enrollmentDate,
        monthlyFee: Number(annualForm.monthlyFee) || 0,
        scholarshipPercentage: Number(annualForm.scholarshipPercentage) || 0,
        dueDay: Number(annualForm.dueDay) || 10,
        status: "ACTIVE",
        notes: annualForm.notes,
      });

      if (res.status) {
        setIsAnnualOpen(false);
        setSelectedStudent(null);
        setAnnualForm({
          academicYearId: years[0]?.id || 0,
          gradeCode: "",
          enrollmentDate: new Date().toISOString().split("T")[0],
          monthlyFee: 1500,
          scholarshipPercentage: 0,
          dueDay: 10,
          notes: "",
        });
        await loadAnnualEnrollments();
      } else {
        setAnnualError(res.message || "Error al registrar matrícula.");
      }
    } catch (err: any) {
      setAnnualError(err?.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmittingAnnual(false);
    }
  };

  // Open Edit Fee Modal
  const handleOpenEditFee = (enrollment: StudentEnrollment) => {
    setEnrollmentToEdit(enrollment);
    setEditFeeForm({
      monthlyFee: Number(enrollment.monthlyFee) || 1500,
      scholarshipPercentage: Number(enrollment.scholarshipPercentage) || 0,
      dueDay: Number(enrollment.dueDay) || 10,
      notes: enrollment.notes || "",
    });
    setEditFeeError(null);
    setIsEditFeeOpen(true);
  };

  // Save Fee/Scholarship Changes
  const handleSaveEditFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentToEdit) return;

    try {
      setIsSubmittingEditFee(true);
      setEditFeeError(null);

      const res = await enrollmentsService.updateStudentEnrollment(enrollmentToEdit.id, {
        monthlyFee: Number(editFeeForm.monthlyFee) || 0,
        scholarshipPercentage: Number(editFeeForm.scholarshipPercentage) || 0,
        dueDay: Number(editFeeForm.dueDay) || 10,
        notes: editFeeForm.notes,
      });

      if (res.status) {
        setIsEditFeeOpen(false);
        setEnrollmentToEdit(null);
        await loadAnnualEnrollments();
      } else {
        setEditFeeError(res.message || "Error al actualizar tarifa.");
      }
    } catch (err: any) {
      setEditFeeError(err?.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmittingEditFee(false);
    }
  };

  // Delete enrollment
  const handleDeleteAnnual = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta matrícula?")) return;
    try {
      await enrollmentsService.deleteStudentEnrollment(id);
      loadAnnualEnrollments();
    } catch (err: any) {
      alert("Error al eliminar: " + (err?.message || "Error de red"));
    }
  };

  const filteredAnnual = useMemo(() => {
    const q = searchAnnual.toLowerCase().trim();
    if (!q) return studentEnrollments;

    return studentEnrollments.filter((se) => {
      const studentName = se.student ? `${se.student.firstName} ${se.student.lastName}`.toLowerCase() : "";
      const dni = se.student?.identityNumber?.toLowerCase() || "";
      const code = se.student?.userCode?.toLowerCase() || "";
      const grade = se.grade?.name?.toLowerCase() || se.gradeCode?.toLowerCase() || "";

      return (
        studentName.includes(q) ||
        dni.includes(q) ||
        code.includes(q) ||
        grade.includes(q)
      );
    });
  }, [studentEnrollments, searchAnnual]);

  // Live net calculation for new enrollment
  const newNetFee = useMemo(() => {
    const base = Number(annualForm.monthlyFee) || 0;
    const sch = Number(annualForm.scholarshipPercentage) || 0;
    return Math.max(0, base - (base * sch) / 100);
  }, [annualForm.monthlyFee, annualForm.scholarshipPercentage]);

  // Live net calculation for edit modal
  const editNetFee = useMemo(() => {
    const base = Number(editFeeForm.monthlyFee) || 0;
    const sch = Number(editFeeForm.scholarshipPercentage) || 0;
    return Math.max(0, base - (base * sch) / 100);
  }, [editFeeForm.monthlyFee, editFeeForm.scholarshipPercentage]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Matrícula Anual & Tarifas Escolares
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
              Sede {schoolCode}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Asigna el grado, la colegiatura mensual pactada y el porcentaje de beca por estudiante para el ciclo lectivo.
          </p>
        </div>

        <Button
          onClick={() => {
            setIsAnnualOpen(true);
            setAnnualError(null);
          }}
          className="h-11 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="size-4 text-lime-400" />
          <span>Nueva Matrícula con Tarifa</span>
        </Button>
      </div>

      <Card className="border-neutral-200/80 bg-white">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-black">Estudiantes Matriculados & Cuotas Asignadas</CardTitle>
            <CardDescription className="text-xs">
              Listado oficial con mensualidad fija acordada, becas y día de vencimiento.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              placeholder="Buscar por DNI, nombre o grado..."
              value={searchAnnual}
              onChange={(e) => setSearchAnnual(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          {loadingAnnual ? (
            <div className="flex justify-center p-12">
              <Loader2 className="size-6 animate-spin text-neutral-500" />
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-neutral-50/80 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  <TableRow>
                    <TableHead className="py-3 px-4">Estudiante</TableHead>
                    <TableHead className="py-3 px-4">Grado & Ciclo</TableHead>
                    <TableHead className="py-3 px-4 text-right">Mensualidad Base</TableHead>
                    <TableHead className="py-3 px-4 text-center">Beca / Condición</TableHead>
                    <TableHead className="py-3 px-4 text-right">Cuota Neta Mensual</TableHead>
                    <TableHead className="py-3 px-4 text-center">Vencimiento</TableHead>
                    <TableHead className="py-3 px-4 text-center">Estado</TableHead>
                    <TableHead className="py-3 px-4 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-neutral-100">
                  {filteredAnnual.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-neutral-400">
                        <div className="flex flex-col items-center gap-2">
                          <GraduationCap className="size-8 stroke-1 text-neutral-300" />
                          <p className="text-xs font-medium">No hay matrículas registradas para este criterio.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAnnual.map((m) => {
                      const baseFee = Number(m.monthlyFee || 0);
                      const sch = Number(m.scholarshipPercentage || m.student?.scholarshipPercentage || 0);
                      const isFullSch = sch === 100;
                      const netFee = Math.max(0, baseFee - (baseFee * sch) / 100);

                      return (
                        <tr key={m.id} className="hover:bg-neutral-50/70 transition-colors">
                          <TableCell className="py-3 px-4">
                            <div className="font-bold text-xs text-neutral-900">
                              {m.student ? `${m.student.firstName} ${m.student.lastName}` : `Estudiante #${m.studentId.slice(0, 8)}`}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-400">
                              {m.student?.identityNumber ? `DNI: ${m.student.identityNumber}` : m.student?.userCode || ""}
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-4">
                            <div className="text-xs font-bold text-neutral-800">
                              {m.grade?.name || m.gradeCode || "Grado General"}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {m.academicYear?.name || `Año ${m.academicYearId}`}
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-4 text-right font-mono text-xs text-neutral-600">
                            L. {baseFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </TableCell>

                          <TableCell className="py-3 px-4 text-center">
                            {isFullSch ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                <Sparkles className="size-3 text-amber-600" /> Beca 100%
                              </span>
                            ) : sch > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                                <Tag className="size-3 text-blue-600" /> Beca {sch}%
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-neutral-400">
                                Regular (0%)
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-3 px-4 text-right">
                            {isFullSch ? (
                              <span className="text-xs font-black text-amber-700">Exonerado (L. 0.00)</span>
                            ) : (
                              <span className="font-black text-xs text-neutral-900">
                                L. {netFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-3 px-4 text-center text-xs text-neutral-600 font-mono">
                            Día {m.dueDay || 10}
                          </TableCell>

                          <TableCell className="py-3 px-4 text-center">
                            <Badge className="bg-lime-100 text-lime-800 border-lime-200 text-[10px] font-bold">
                              {m.status || "ACTIVA"}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditFee(m)}
                                className="h-8 px-2.5 rounded-lg text-[11px] font-bold gap-1 cursor-pointer"
                                title="Editar tarifa mensual y beca"
                              >
                                <Edit3 className="size-3" />
                                <span>Tarifa</span>
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleDeleteAnnual(m.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar matrícula"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: NUEVA MATRÍCULA CON ASIGNACIÓN DE TARIFA */}
      <Dialog open={isAnnualOpen} onOpenChange={setIsAnnualOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Matricular Estudiante & Asignar Tarifa Mensual</DialogTitle>
            <DialogDescription>
              Localiza al estudiante por DNI o nombre, define su grado y su mensualidad pactada para el ciclo escolar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAnnual} className="flex flex-col flex-1">
            <DialogBody className="space-y-5">
              {annualError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{annualError}</span>
                </div>
              )}

              {/* 1. SELECCIÓN DE ALUMNO CON ASYNC SEARCH */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-800">
                  Estudiante Titular <span className="text-red-500">*</span>
                </Label>
                <AsyncStudentSearch
                  selectedStudent={selectedStudent}
                  schoolCode={schoolCode}
                  onSelectStudent={handleSelectStudentForEnrollment}
                  placeholder="Escribe DNI (ej. 0501199710597) o nombre del estudiante..."
                />
              </div>

              {/* 2. CICLO Y GRADO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">
                    Ciclo / Año Académico <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={yearOptions}
                    value={String(annualForm.academicYearId || "")}
                    onChange={(val) => setAnnualForm({ ...annualForm, academicYearId: Number(val || 0) })}
                    placeholder="Seleccionar año..."
                    searchPlaceholder="Buscar año..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">
                    Grado Escolar <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={gradeOptions}
                    value={annualForm.gradeCode}
                    onChange={(val) => setAnnualForm({ ...annualForm, gradeCode: val || "" })}
                    placeholder="Seleccionar grado..."
                    searchPlaceholder="Buscar grado..."
                  />
                </div>
              </div>

              {/* 3. TARIFA MENSUAL & BECA (EL CORE DEL NEGOCIO) */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-neutral-900">
                  <DollarSign className="size-4 text-lime-600" />
                  <span>Tarifa Mensual Pactada para el Estudiante</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-neutral-700">
                      Mensualidad Base (Lempiras) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      className="h-10 rounded-xl text-xs font-black bg-white"
                      value={annualForm.monthlyFee}
                      onChange={(e) => setAnnualForm({ ...annualForm, monthlyFee: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-neutral-700">
                      Porcentaje de Beca / Descuento (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="h-10 rounded-xl text-xs font-black bg-white"
                      value={annualForm.scholarshipPercentage}
                      onChange={(e) => setAnnualForm({ ...annualForm, scholarshipPercentage: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-neutral-700">
                      Día Vencimiento Mensual
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      className="h-10 rounded-xl text-xs font-mono bg-white"
                      value={annualForm.dueDay}
                      onChange={(e) => setAnnualForm({ ...annualForm, dueDay: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* RESUMEN EN TIEMPO REAL */}
                <div className="p-3 rounded-xl bg-white border border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500">Monto Base: </span>
                    <span className="font-bold">L. {Number(annualForm.monthlyFee || 0).toFixed(2)}</span>
                    {Number(annualForm.scholarshipPercentage) > 0 && (
                      <span className="text-blue-600 font-bold ml-2">
                        (-L. {((Number(annualForm.monthlyFee) * Number(annualForm.scholarshipPercentage)) / 100).toFixed(2)} por beca {annualForm.scholarshipPercentage}%)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-neutral-500">Cuota Neta Mensual: </span>
                    <span className="text-base font-black text-neutral-900">
                      L. {newNetFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. FECHA & OBSERVACIONES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">Fecha de Matrícula</Label>
                  <Input
                    type="date"
                    value={annualForm.enrollmentDate}
                    onChange={(e) => setAnnualForm({ ...annualForm, enrollmentDate: e.target.value })}
                    required
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">Observaciones</Label>
                  <Input
                    placeholder="Ej: Cuota acordada con dirección, convenio especial..."
                    value={annualForm.notes}
                    onChange={(e) => setAnnualForm({ ...annualForm, notes: e.target.value })}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAnnualOpen(false)}
                disabled={isSubmittingAnnual}
                className="h-10 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingAnnual}
                className="h-10 rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmittingAnnual ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" />Matriculando...</>
                ) : (
                  "Guardar Matrícula con Tarifa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDITAR TARIFA Y BECA DE MATRÍCULA EXISTENTE */}
      <Dialog open={isEditFeeOpen} onOpenChange={setIsEditFeeOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Modificar Tarifa Mensual y Beca</DialogTitle>
            <DialogDescription>
              Ajusta la cuota mensual asignada para {enrollmentToEdit?.student?.firstName} {enrollmentToEdit?.student?.lastName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditFee} className="flex flex-col flex-1">
            <DialogBody className="space-y-4">
              {editFeeError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{editFeeError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <div className="size-10 rounded-xl bg-neutral-950 text-lime-400 font-black flex items-center justify-center text-sm">
                  {enrollmentToEdit?.student?.firstName?.[0] || "E"}
                </div>
                <div>
                  <div className="text-xs font-black text-neutral-900">
                    {enrollmentToEdit?.student?.firstName} {enrollmentToEdit?.student?.lastName}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    Grado: {enrollmentToEdit?.grade?.name || enrollmentToEdit?.gradeCode} • Ciclo: {enrollmentToEdit?.academicYear?.name}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-neutral-700">
                    Mensualidad Base (Lempiras)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    className="h-10 rounded-xl text-xs font-black"
                    value={editFeeForm.monthlyFee}
                    onChange={(e) => setEditFeeForm({ ...editFeeForm, monthlyFee: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-neutral-700">
                    Beca / Descuento (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="h-10 rounded-xl text-xs font-black"
                    value={editFeeForm.scholarshipPercentage}
                    onChange={(e) => setEditFeeForm({ ...editFeeForm, scholarshipPercentage: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-neutral-700">
                    Día Vencimiento
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    className="h-10 rounded-xl text-xs font-mono"
                    value={editFeeForm.dueDay}
                    onChange={(e) => setEditFeeForm({ ...editFeeForm, dueDay: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* RESUMEN EN TIEMPO REAL */}
              <div className="p-3.5 rounded-xl bg-lime-50/50 border border-lime-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-600">Nueva Cuota Neta: </span>
                  <span className="text-base font-black text-neutral-900">
                    L. {editNetFee.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  {editFeeForm.scholarshipPercentage === 100
                    ? "Exonerado al 100%"
                    : `Descuento: L. ${((editFeeForm.monthlyFee * editFeeForm.scholarshipPercentage) / 100).toFixed(2)}`}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Observaciones del Ajuste</Label>
                <Input
                  placeholder="Ej. Beca deportiva aprobada por dirección..."
                  value={editFeeForm.notes}
                  onChange={(e) => setEditFeeForm({ ...editFeeForm, notes: e.target.value })}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditFeeOpen(false)}
                disabled={isSubmittingEditFee}
                className="h-10 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingEditFee}
                className="h-10 rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmittingEditFee ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" />Actualizando...</>
                ) : (
                  "Guardar Ajuste de Tarifa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
