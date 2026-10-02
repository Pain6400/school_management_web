"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Plus, Trash2, BookOpen, Search, AlertCircle } from "lucide-react";
import { enrollmentsService, ClassEnrollment } from "@/lib/services/enrollments.service";
import { studentsService, Student } from "@/lib/services/api.service";
import { academicsService, Class } from "@/lib/services/academics.service";

export default function ClassEnrollmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

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

  const loadCatalogs = async () => {
    try {
      const [stuRes, clsRes] = await Promise.allSettled([
        studentsService.getStudents(),
        academicsService.getClasses(),
      ]);

      if (stuRes.status === "fulfilled" && stuRes.value.status) setStudents(stuRes.value.data);
      if (clsRes.status === "fulfilled" && clsRes.value.status) setClasses(clsRes.value.data);
    } catch (err) {
      console.error("Error loading catalogs:", err);
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
    loadClassEnrollments();
  }, []);

  const studentMap = useMemo(() => {
    return Object.fromEntries(
      students.map((s) => [s.publicId, `${s.firstName} ${s.lastName} (${s.userCode || s.username})`])
    );
  }, [students]);

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);
    if (!classForm.studentId || !classForm.classCode) {
      setClassError("Por favor selecciona un estudiante y una clase.");
      return;
    }

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

  const handleDeleteClass = async (id: number) => {
    if (!confirm("¿Dar de baja al alumno de esta clase?")) return;
    try {
      await enrollmentsService.deleteClassEnrollment(id);
      loadClassEnrollments();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClass = classEnrollments.filter((ce) => {
    const q = searchClass.toLowerCase();
    const studentName = studentMap[ce.studentId] || "";
    const matchSearch = !q || studentName.toLowerCase().includes(q) || ce.classCode.toLowerCase().includes(q);
    const matchClass = filterClassCode === "ALL" || ce.classCode === filterClassCode;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Inscripción a Clases y Secciones
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Asignación directa de alumnos a secciones específicas, materias y horarios académicos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Listado de Estudiantes por Clase</CardTitle>
            <CardDescription>
              Filtra por sección o materia y gestiona las inscripciones individuales.
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
              <DialogContent size="xl">
                <form onSubmit={handleSubmitClass} className="flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Inscribir Alumno en Clase</DialogTitle>
                    <DialogDescription>
                      Asigna al estudiante a una sección de materia activa.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogBody className="space-y-5">
                    {classError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <AlertCircle className="size-4 shrink-0 text-red-500" />
                        <span>{classError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  </DialogBody>

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
                          <span className="text-sm font-medium">
                            {ce.class?.name || ce.classCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ce.enrollmentDate ? new Date(ce.enrollmentDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          {ce.finalGrade !== undefined && ce.finalGrade !== null ? (
                            <span className="font-bold text-foreground">{ce.finalGrade} / 100</span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Sin calificar</span>
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
    </div>
  );
}
