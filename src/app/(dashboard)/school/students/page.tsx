"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { studentsService, Student } from "@/lib/services/api.service";
import { academicsService, Grade, Class } from "@/lib/services/academics.service";
import { enrollmentsService, StudentEnrollment, ClassEnrollment } from "@/lib/services/enrollments.service";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2, Plus, Trash2, GraduationCap, Mail, Search,
  User, Phone, CreditCard, AtSign, BookOpen, AlertCircle,
  Filter, RotateCcw, CheckCircle2, XCircle, Layers,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  identityNumber: "",
  username: "",
  phone: "",
};

type FormState = typeof EMPTY_FORM;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [annualEnrollments, setAnnualEnrollments] = useState<StudentEnrollment[]>([]);
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [stuRes, grdRes, clsRes, annRes, ceRes] = await Promise.allSettled([
        studentsService.getStudents(),
        academicsService.getGrades(),
        academicsService.getClasses(),
        enrollmentsService.getStudentEnrollments(),
        enrollmentsService.getClassEnrollments(),
      ]);

      if (stuRes.status === "fulfilled" && stuRes.value.status) setStudents(stuRes.value.data);
      if (grdRes.status === "fulfilled" && grdRes.value.status) setGrades(grdRes.value.data);
      if (clsRes.status === "fulfilled" && clsRes.value.status) setClasses(clsRes.value.data);
      if (annRes.status === "fulfilled" && annRes.value.status) setAnnualEnrollments(annRes.value.data);
      if (ceRes.status === "fulfilled" && ceRes.value.status) setClassEnrollments(ceRes.value.data);
    } catch (err) {
      console.error("Error loading students data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Map of studentId -> gradeCode
  const studentGradeMap = useMemo(() => {
    const map: Record<string, string> = {};
    annualEnrollments.forEach((ae) => {
      if (ae.studentId && ae.gradeCode) {
        map[ae.studentId] = ae.gradeCode;
      }
    });
    return map;
  }, [annualEnrollments]);

  // Map of studentId -> Set of classCodes
  const studentClassesMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    classEnrollments.forEach((ce) => {
      if (ce.studentId && ce.classCode) {
        if (!map[ce.studentId]) map[ce.studentId] = new Set();
        map[ce.studentId].add(ce.classCode);
      }
    });
    return map;
  }, [classEnrollments]);

  // Options for Grade Combobox filter
  const gradeFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todos los Grados" },
      ...grades.map((g) => ({
        value: g.code,
        label: g.name,
        badge: g.code,
      })),
    ];
  }, [grades]);

  // Options for Class Combobox filter
  const classFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todas las Clases" },
      ...classes.map((c) => ({
        value: c.code,
        label: c.name,
        description: c.course?.name || c.grade?.name,
        badge: c.code,
      })),
    ];
  }, [classes]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Text Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.userCode?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.identityNumber?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Grade Filter
      if (filterGrade !== "ALL") {
        const studentGrade = studentGradeMap[s.publicId];
        if (studentGrade !== filterGrade) return false;
      }

      // 3. Class Filter
      if (filterClass !== "ALL") {
        const studentClasses = studentClassesMap[s.publicId];
        if (!studentClasses || !studentClasses.has(filterClass)) return false;
      }

      // 4. Status Filter
      if (filterStatus === "ACTIVE" && !s.status) return false;
      if (filterStatus === "INACTIVE" && s.status) return false;

      return true;
    });
  }, [students, searchQuery, filterGrade, filterClass, filterStatus, studentGradeMap, studentClassesMap]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterGrade("ALL");
    setFilterClass("ALL");
    setFilterStatus("ALL");
  };

  const hasActiveFilters = searchQuery !== "" || filterGrade !== "ALL" || filterClass !== "ALL" || filterStatus !== "ALL";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000/api";

      const res = await fetch(`${apiUrl}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          identityNumber: form.identityNumber,
          username: form.username,
          phone: form.phone || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al crear el estudiante");
      }

      setIsDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchAllData();
    } catch (err: any) {
      setError(err.message || "Error al registrar al estudiante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("¿Eliminar este estudiante?")) return;
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000/api";
      await fetch(`${apiUrl}/students/${publicId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Directorio de Estudiantes
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Administra los alumnos registrados, matrículas por grado y pertenencia a clases.
          </p>
        </div>

        {/* MODAL CREAR ESTUDIANTE (REDISEÑADO AMPLIO) */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nuevo Estudiante</span>
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Estudiante</DialogTitle>
              <DialogDescription>
                Ingresa los datos personales para crear la cuenta del alumno en la plataforma.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              {/* DIALOG BODY */}
              <DialogBody>
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombres <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="firstName"
                      placeholder="Ej. Sofía Mariana"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="lastName"
                      placeholder="Ej. Gómez Navarro"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Documento de Identidad / Cédula <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="identityNumber"
                      placeholder="Ej. 0801-2008-12345"
                      value={form.identityNumber}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombre de Usuario <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="username"
                      placeholder="Ej. sofia.gomez"
                      value={form.username}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="sofia@colegio.edu"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Teléfono de Contacto
                    </Label>
                    <Input
                      name="phone"
                      placeholder="+504 9988-7766"
                      value={form.phone}
                      onChange={handleChange}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Nota informativa */}
                <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-3.5 flex items-start gap-2.5 text-xs text-neutral-600">
                  <BookOpen className="size-4 shrink-0 mt-0.5 text-neutral-900" />
                  <span>
                    El alumno podrá ingresar al portal con su <strong>nombre de usuario</strong>. La inscripción a su grado y clases se realiza en el módulo de <strong>Matrículas</strong>.
                  </span>
                </div>
              </DialogBody>

              {/* DIALOG FOOTER */}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsDialogOpen(false); setForm(EMPTY_FORM); setError(null); }}
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-xl text-sm font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold shadow-xs"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 size-3.5 animate-spin" />Guardando...</>
                  ) : (
                    "Crear Estudiante"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Estudiantes</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <GraduationCap className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{students.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Alumnos registrados en el colegio</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Con Matrícula</span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">
            {Object.keys(studentGradeMap).length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Alumnos asignados a un grado</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Resultados Filtrados</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Search className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{filteredStudents.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Coinciden con los filtros actuales</p>
        </Card>
      </div>

      {/* ADVANCED FILTERS BAR */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900">Filtros de Búsqueda</h3>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <Input
                placeholder="Buscar por nombre, cédula o usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl text-sm"
              />
            </div>

            {/* Grade Filter with Combobox */}
            <div>
              <Combobox
                options={gradeFilterOptions}
                value={filterGrade}
                onChange={(val) => setFilterGrade(val || "ALL")}
                placeholder="Filtrar por Grado"
                searchPlaceholder="Buscar grado..."
              />
            </div>

            {/* Class Filter with Combobox */}
            <div>
              <Combobox
                options={classFilterOptions}
                value={filterClass}
                onChange={(val) => setFilterClass(val || "ALL")}
                placeholder="Filtrar por Clase / Sección"
                searchPlaceholder="Buscar clase..."
              />
            </div>

            {/* Status Filter */}
            <div>
              <Combobox
                options={[
                  { value: "ALL", label: "Todos los Estados" },
                  { value: "ACTIVE", label: "Solo Activos" },
                  { value: "INACTIVE", label: "Solo Inactivos" },
                ]}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val || "ALL")}
                placeholder="Estado"
                searchPlaceholder="Buscar estado..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* STUDENTS TABLE */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Listado de Estudiantes</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Mostrando {filteredStudents.length} de {students.length} alumnos registrados.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando directorio de estudiantes...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
            <GraduationCap className="size-12 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No se encontraron estudiantes</p>
            <p className="text-xs text-neutral-500 max-w-sm">
              {hasActiveFilters
                ? "Prueba cambiando o limpiando los filtros seleccionados."
                : "Aún no hay estudiantes registrados en la institución."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl mt-2 text-xs">
                Restablecer filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/70 border-b border-neutral-100">
                <TableRow>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estudiante</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Identificación</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Grado Asignado</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Contacto</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Clases Inscritas</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estado</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const studentGradeCode = studentGradeMap[student.publicId];
                  const gradeObj = grades.find((g) => g.code === studentGradeCode);
                  const enrolledClassesCount = studentClassesMap[student.publicId]?.size || 0;

                  return (
                    <TableRow key={student.publicId} className="hover:bg-neutral-50/80 transition-colors">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-neutral-900 text-lime-400 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                            {student.firstName?.[0]?.toUpperCase()}{student.lastName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 text-sm">
                              {student.firstName} {student.lastName}
                            </div>
                            <span className="text-[11px] text-neutral-400">@{student.username}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                          {student.identityNumber || student.userCode || "—"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        {gradeObj ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 text-neutral-900 font-bold text-xs border border-neutral-200/60">
                            <GraduationCap className="size-3 text-neutral-600" />
                            {gradeObj.name}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 italic">Sin matricular</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Mail className="size-3 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                              <Phone className="size-3 text-neutral-400 shrink-0" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                          <Layers className="size-3 text-neutral-500" />
                          <span>{enrolledClassesCount} {enrolledClassesCount === 1 ? "clase" : "clases"}</span>
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          variant={student.status ? "default" : "secondary"}
                          className={
                            student.status
                              ? "bg-lime-100 text-lime-800 border-lime-200 text-[10px] font-bold"
                              : "bg-neutral-100 text-neutral-600 text-[10px]"
                          }
                        >
                          {student.status ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          onClick={() => handleDelete(student.publicId)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
