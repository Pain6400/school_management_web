"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, UserCheck, BookOpen, GraduationCap, Search, Calendar, AlertCircle } from "lucide-react";
import { enrollmentsService, StudentEnrollment, ClassEnrollment } from "@/lib/services/enrollments.service";
import { studentsService, Student } from "@/lib/services/api.service";
import { academicsService, AcademicYear, Grade, Class } from "@/lib/services/academics.service";

export default function EnrollmentsPage() {
  const [activeTab, setActiveTab] = useState("annual");

  // Shared Catalogs
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  // Tab 1: Student Enrollments (Annual)
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

  // Tab 2: Class Enrollments
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([]);
  const [loadingClass, setLoadingClass] = useState(true);
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [searchClass, setSearchClass] = useState("");
  const [filterClassCode, setFilterClassCode] = useState("ALL");
  const [classForm, setClassForm] = useState({
    studentId: "",
    classCode: "",
    schoolCode: "ESC001",
    enrollmentDate: new Date().toISOString().split("T")[0],
  });


  // Combobox options
  const studentOptions = useMemo(() => {
    return students.map((s) => ({
      value: s.publicId,
      label: `${s.firstName} ${s.lastName}`,
      description: `@${s.username} • ${s.identityNumber || s.userCode || 'Sin código'}`,
    }));
  }, [students]);

  const classOptions = useMemo(() => {
    return classes.map((c) => ({
      value: c.code,
      label: c.name,
      description: `${c.course?.name || ''} • Aula: ${c.classroom?.name || c.classroomCode || 'S/A'}`,
      badge: c.code,
    }));
  }, [classes]);

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
      const [stuRes, yrsRes, grdRes, clsRes] = await Promise.allSettled([
        studentsService.getStudents(),
        academicsService.getAcademicYears(),
        academicsService.getGrades(),
        academicsService.getClasses(),
      ]);

      if (stuRes.status === "fulfilled" && stuRes.value.status) setStudents(stuRes.value.data);
      if (yrsRes.status === "fulfilled" && yrsRes.value.status) setYears(yrsRes.value.data);
      if (grdRes.status === "fulfilled" && grdRes.value.status) setGrades(grdRes.value.data);
      if (clsRes.status === "fulfilled" && clsRes.value.status) setClasses(clsRes.value.data);
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

  const loadClassEnrollments = async () => {
    try {
      setLoadingClass(true);
      const res = await enrollmentsService.getClassEnrollments();
      if (res.status && res.data) setClassEnrollments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClass(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
    loadAnnualEnrollments();
    loadClassEnrollments();
  }, []);

  // Quick Mappings
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

  const classMap = useMemo(() => {
    return Object.fromEntries(classes.map((c) => [c.code, `${c.name} (${c.code})`]));
  }, [classes]);

  // Submit Annual Enrollment
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

  // Submit Class Enrollment
  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);
    if (!classForm.studentId || !classForm.classCode) {
      setClassError("Por favor selecciona un estudiante y una clase.");
      return;
    }

    // Validación preventiva en frontend para evitar duplicados
    const isAlreadyEnrolled = classEnrollments.some(
      (ce) => ce.studentId === classForm.studentId && ce.classCode === classForm.classCode
    );
    if (isAlreadyEnrolled) {
      setClassError("Este estudiante ya se encuentra inscrito en esta clase.");
      return;
    }

    try {
      setIsSubmittingClass(true);
      const res = await enrollmentsService.createClassEnrollment({
        ...classForm,
        status: "ACTIVE",
      });
      if (res.status) {
        setIsClassOpen(false);
        setClassForm({
          studentId: "",
          classCode: classes[0]?.code || "",
          schoolCode: "ESC001",
          enrollmentDate: new Date().toISOString().split("T")[0],
        });
        loadClassEnrollments();
      } else {
        alert(res.message || "Error al inscribir al estudiante");
      }
    } catch (err: any) {
      console.error(err);
      setClassError(err.message || "Error al inscribir al estudiante");
    } finally {
      setIsSubmittingClass(false);
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

  const handleDeleteClass = async (id: number) => {
    if (!confirm("¿Dar de baja al alumno de esta clase?")) return;
    try {
      await enrollmentsService.deleteClassEnrollment(id);
      loadClassEnrollments();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered lists
  const filteredAnnual = studentEnrollments.filter((se) => {
    const q = searchAnnual.toLowerCase();
    const studentName = studentMap[se.studentId] || "";
    return !q || studentName.toLowerCase().includes(q) || (se.gradeCode && se.gradeCode.toLowerCase().includes(q));
  });

  const filteredClass = classEnrollments.filter((ce) => {
    const q = searchClass.toLowerCase();
    const studentName = studentMap[ce.studentId] || "";
    const matchSearch = !q || studentName.toLowerCase().includes(q) || ce.classCode.toLowerCase().includes(q);
    const matchClass = filterClassCode === "ALL" || ce.classCode === filterClassCode;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Matrículas e Inscripciones</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Matricula alumnos al ciclo escolar y asígnalos a sus clases y materias.
          </p>
        </div>
      </div>

      <Tabs defaultValue="annual" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full sm:w-[450px] grid-cols-2">
          <TabsTrigger value="annual" className="gap-2">
            <UserCheck className="size-4" /> Matrículas Anuales
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <BookOpen className="size-4" /> Inscripción a Clases
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MATRÍCULA ANUAL */}
        <TabsContent value="annual" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Matrículas por Año Escolar</CardTitle>
                <CardDescription>
                  Registro oficial de los estudiantes inscritos en el ciclo escolar institucional.
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
                  <DialogContent className="sm:max-w-xl md:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Matricular Estudiante en Ciclo Escolar</DialogTitle>
                      <DialogDescription>
                        Selecciona el estudiante, el año académico y el grado al que ingresa.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitAnnual} className="flex flex-col flex-1">
                      <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
                        {annualError && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
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
        </TabsContent>

        {/* TAB 2: INSCRIPCIÓN A CLASES */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Inscripción a Clases y Secciones</CardTitle>
                <CardDescription>
                  Asignación de alumnos a materias y grupos de clase específicos.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchClass}
                    onChange={(e) => setSearchClass(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterClassCode} onValueChange={(val) => setFilterClassCode(val || "ALL")}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas las Clases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las Clases</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={isClassOpen} onOpenChange={(open) => { setIsClassOpen(open); if (open) setClassError(null); }}>
                  <DialogTrigger render={<Button size="sm"><Plus className="mr-2 size-4" /> Inscribir en Clase</Button>} />
                  <DialogContent className="sm:max-w-xl md:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Inscribir Alumno en Clase</DialogTitle>
                      <DialogDescription>
                        Asigna al estudiante a una sección de materia activa.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitClass} className="flex flex-col flex-1">
                      <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
                        {classError && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                            <AlertCircle className="size-4 shrink-0 text-red-500" />
                            <span>{classError}</span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-neutral-700">
                            Estudiante <span className="text-red-500">*</span>
                          </Label>
                          <Combobox
                            options={studentOptions}
                            value={classForm.studentId}
                            onChange={(val) => setClassForm({ ...classForm, studentId: val })}
                            placeholder="Buscar y seleccionar alumno..."
                            searchPlaceholder="Escribe el nombre o código..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-neutral-700">
                            Clase / Sección <span className="text-red-500">*</span>
                          </Label>
                          <Combobox
                            options={classOptions}
                            value={classForm.classCode}
                            onChange={(val) => setClassForm({ ...classForm, classCode: val })}
                            placeholder="Buscar y seleccionar clase..."
                            searchPlaceholder="Escribe el nombre o materia..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="classEnrollmentDate" className="text-xs font-bold text-neutral-700">
                            Fecha de Inscripción
                          </Label>
                          <Input
                            id="classEnrollmentDate"
                            type="date"
                            value={classForm.enrollmentDate}
                            onChange={(e) => setClassForm({ ...classForm, enrollmentDate: e.target.value })}
                            required
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setIsClassOpen(false); setClassError(null); }}
                          disabled={isSubmittingClass}
                          className="rounded-xl text-xs font-bold"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmittingClass}
                          className="rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
                        >
                          {isSubmittingClass ? <><Loader2 className="mr-2 size-3.5 animate-spin" />Inscribiendo...</> : "Inscribir en Clase"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {loadingClass ? (
                <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Clase / Sección</TableHead>
                        <TableHead>Fecha Asignación</TableHead>
                        <TableHead>Nota Final</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClass.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <BookOpen className="size-8 stroke-1 text-muted-foreground/40" />
                              <p>No hay alumnos inscritos en esta clase.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClass.map((ce) => (
                          <TableRow key={ce.id} className="hover:bg-muted/20">
                            <TableCell>
                              <div className="font-semibold text-foreground">
                                {ce.student ? `${ce.student.firstName} ${ce.student.lastName}` : studentMap[ce.studentId] || ce.studentId}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-sm">
                                {ce.class?.name || classMap[ce.classCode] || ce.classCode}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {ce.enrollmentDate ? new Date(ce.enrollmentDate).toLocaleDateString() : "—"}
                            </TableCell>
                            <TableCell>
                              {ce.finalGrade !== undefined && ce.finalGrade !== null ? (
                                <span className="font-bold text-primary">{ce.finalGrade} pts</span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">En curso</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[11px]">
                                {ce.status || "Activo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteClass(ce.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}