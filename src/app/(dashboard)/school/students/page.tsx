"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { studentsService, Student } from "@/lib/services/api.service";
import { academicsService, Grade, Class, Classroom } from "@/lib/services/academics.service";
import { enrollmentsService, StudentEnrollment, ClassEnrollment } from "@/lib/services/enrollments.service";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2, Plus, Trash2, GraduationCap, Mail, Search,
  User, Users, Phone, CreditCard, AtSign, BookOpen, AlertCircle,
  Filter, RotateCcw, CheckCircle2, XCircle, Layers,
  FileText, ChevronRight, DoorOpen, Sparkles, School, Eye,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogBody,
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
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [annualEnrollments, setAnnualEnrollments] = useState<StudentEnrollment[]>([]);
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([]);

  // Metadata Loading vs Students Query Loading
  const [metaLoading, setMetaLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterClassroom, setFilterClassroom] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAll, setShowAll] = useState(false);

  // Modal State for New Student
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const extractData = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };

  // 1. Initial metadata loading (Grades, Classes, Classrooms, Enrollments)
  const fetchMetadata = async () => {
    try {
      setMetaLoading(true);
      const [grdRes, clsRes, clrRes, annRes, ceRes] = await Promise.allSettled([
        academicsService.getGrades(),
        academicsService.getClasses(),
        academicsService.getClassrooms(),
        enrollmentsService.getStudentEnrollments(),
        enrollmentsService.getClassEnrollments(),
      ]);

      if (grdRes.status === "fulfilled") setGrades(extractData(grdRes.value));
      if (clsRes.status === "fulfilled") setClasses(extractData(clsRes.value));
      if (clrRes.status === "fulfilled") setClassrooms(extractData(clrRes.value));
      if (annRes.status === "fulfilled") setAnnualEnrollments(extractData(annRes.value));
      if (ceRes.status === "fulfilled") setClassEnrollments(extractData(ceRes.value));
    } catch (err) {
      console.error("Error loading school metadata:", err);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Is at least one filter selected or search active or showAll clicked?
  const hasActiveFilter = useMemo(() => {
    return (
      filterGrade !== "ALL" ||
      filterClass !== "ALL" ||
      filterClassroom !== "ALL" ||
      searchQuery.trim() !== "" ||
      filterStatus !== "ALL" ||
      showAll
    );
  }, [filterGrade, filterClass, filterClassroom, searchQuery, filterStatus, showAll]);

  // 2. Fetch Students from Backend only when filters are active
  const fetchFilteredStudents = useCallback(async () => {
    if (!hasActiveFilter) {
      setStudents([]);
      return;
    }

    try {
      setStudentsLoading(true);
      const res = await studentsService.getStudents({
        gradeCode: filterGrade !== "ALL" ? filterGrade : undefined,
        classCode: filterClass !== "ALL" ? filterClass : undefined,
        classroomCode: filterClassroom !== "ALL" ? filterClassroom : undefined,
        search: searchQuery.trim() !== "" ? searchQuery.trim() : undefined,
        status: filterStatus !== "ALL" ? filterStatus : undefined,
      });

      setStudents(extractData(res));
    } catch (err) {
      console.error("Error fetching filtered students:", err);
    } finally {
      setStudentsLoading(false);
    }
  }, [hasActiveFilter, filterGrade, filterClass, filterClassroom, searchQuery, filterStatus]);

  useEffect(() => {
    fetchFilteredStudents();
  }, [fetchFilteredStudents]);

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

  // Options for Classroom Combobox filter
  const classroomFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todas las Aulas" },
      ...classrooms.map((cr) => ({
        value: cr.code,
        label: cr.name,
        description: cr.location,
        badge: cr.code,
      })),
    ];
  }, [classrooms]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterGrade("ALL");
    setFilterClass("ALL");
    setFilterClassroom("ALL");
    setFilterStatus("ALL");
    setShowAll(false);
    setStudents([]);
  };

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
      // Refresh students query if active
      if (hasActiveFilter) {
        fetchFilteredStudents();
      }
    } catch (err: any) {
      setError(err.message || "Error al registrar al estudiante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("¿Eliminar este estudiante? Esta acción desvinculará sus registros de matrícula.")) return;
    try {
      await studentsService.deleteStudent(publicId);
      fetchFilteredStudents();
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
            Módulo administrativo escolar con expedientes integrales, calificaciones y gestión de matrículas.
          </p>
        </div>

        {/* MODAL CREAR ESTUDIANTE */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nuevo Estudiante</span>
            </Button>
          } />
          <DialogContent size="xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Estudiante</DialogTitle>
              <DialogDescription>
                Ingresa los datos personales para crear la cuenta del alumno en la institución.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <DialogBody>
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-800">
                      Nombres <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="firstName" placeholder="Ej. Sofía Mariana"
                      value={form.firstName}
                      onChange={handleChange}
                      required className="h-12 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-800">
                      Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="lastName" placeholder="Ej. Gómez Navarro"
                      value={form.lastName}
                      onChange={handleChange}
                      required className="h-12 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-800">
                      Documento de Identidad / Cédula <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="identityNumber" placeholder="Ej. 0801-2008-12345"
                      value={form.identityNumber}
                      onChange={handleChange}
                      required className="h-12 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-800">
                      Nombre de Usuario <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="username" placeholder="Ej. sofia.gomez"
                      value={form.username}
                      onChange={handleChange}
                      required className="h-12 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-800">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="email" type="email"
                      placeholder="sofia@colegio.edu"
                      value={form.email}
                      onChange={handleChange}
                      required className="h-12 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-800">
                      Teléfono de Contacto
                    </Label>
                    <Input
                      name="phone" placeholder="+504 9988-7766"
                      value={form.phone}
                      onChange={handleChange} className="h-12 rounded-xl text-sm px-4"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-3.5 flex items-start gap-2.5 text-xs text-neutral-600">
                  <BookOpen className="size-4 shrink-0 mt-0.5 text-neutral-900" />
                  <span>
                    El alumno podrá ingresar al portal con su <strong>nombre de usuario</strong>. La inscripción a su grado y clases se realiza en el módulo de <strong>Matrículas</strong>.
                  </span>
                </div>
              </DialogBody>

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
                  className="h-11 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold shadow-xs cursor-pointer"
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

      {/* ADVANCED FILTERS BAR (SIEMPRE VISIBLE) */}
      <Card className="p-5 overflow-visible relative z-20 shadow-xs border-neutral-200/90">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-900" />
              <h3 className="text-sm font-bold text-neutral-900">
                Filtros de Búsqueda Escolar
              </h3>
              <Badge variant="outline" className="text-[10px] font-semibold text-neutral-500">
                Selecciona al menos uno
              </Badge>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Restablecer filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <Input
                placeholder="Nombre, cédula..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (showAll) setShowAll(false);
                }}
                className="pl-10 h-11 rounded-xl text-xs sm:text-sm"
              />
            </div>

            {/* Grade Filter with Combobox */}
            <div className="w-full">
              <Combobox
                options={gradeFilterOptions}
                value={filterGrade}
                onChange={(val) => {
                  setFilterGrade(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Filtrar por Grado"
                searchPlaceholder="Buscar grado..."
              />
            </div>

            {/* Class Filter with Combobox */}
            <div className="w-full">
              <Combobox
                options={classFilterOptions}
                value={filterClass}
                onChange={(val) => {
                  setFilterClass(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Filtrar por Clase"
                searchPlaceholder="Buscar clase..."
              />
            </div>

            {/* Classroom Filter with Combobox */}
            <div className="w-full">
              <Combobox
                options={classroomFilterOptions}
                value={filterClassroom}
                onChange={(val) => {
                  setFilterClassroom(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Filtrar por Aula"
                searchPlaceholder="Buscar aula..."
              />
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <Combobox
                options={[
                  { value: "ALL", label: "Todos los Estados" },
                  { value: "ACTIVE", label: "Solo Activos" },
                  { value: "INACTIVE", label: "Solo Inactivos" },
                ]}
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Estado"
                searchPlaceholder="Buscar estado..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* STATE A: NO FILTER SELECTED YET -> SHOW GUIDED HERO PANEL */}
      {!hasActiveFilter && (
        <Card className="p-8 sm:p-12 text-center border-dashed border-2 border-neutral-300 bg-linear-to-b from-neutral-50/50 to-white relative z-10 space-y-6">
          <div className="size-16 rounded-3xl bg-neutral-900 text-lime-400 mx-auto flex items-center justify-center shadow-lg shadow-neutral-950/10">
            <Filter className="size-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Selecciona un Filtro para Consultar Alumnos
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Para optimizar la visualización y rendimiento del sistema, selecciona al menos un criterio (<strong>Grado</strong>, <strong>Aula</strong> o <strong>Clase</strong>) o realiza una búsqueda por nombre o identificación.
            </p>
          </div>

          {/* Quick shortcuts */}
          <div className="pt-2 max-w-2xl mx-auto space-y-4">
            {/* Quick Grades */}
            {grades.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Accesos Rápidos por Grado
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {grades.slice(0, 6).map((g) => (
                    <button
                      key={g.code}
                      type="button"
                      onClick={() => setFilterGrade(g.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-bold text-neutral-800 transition-all cursor-pointer shadow-2xs group"
                    >
                      <GraduationCap className="size-3 text-neutral-400 group-hover:text-lime-400" />
                      <span>{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Classrooms */}
            {classrooms.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Filtrar por Aula Asignada
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {classrooms.slice(0, 5).map((cr) => (
                    <button
                      key={cr.code}
                      type="button"
                      onClick={() => setFilterClassroom(cr.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold text-neutral-700 transition-all cursor-pointer shadow-2xs group"
                    >
                      <DoorOpen className="size-3 text-neutral-400 group-hover:text-lime-400" />
                      <span>{cr.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View All Button */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="rounded-xl text-xs font-bold gap-2 text-neutral-600 hover:text-neutral-950 cursor-pointer"
              >
                <Users className="size-3.5" />
                <span>Mostrar todos los alumnos registrados sin filtros</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STATE B: FILTER APPLIED -> SHOW METRICS & DATA TABLE */}
      {hasActiveFilter && (
        <>
          {/* METRIC CARDS */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Alumnos Encontrados
                </span>
                <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                  <GraduationCap className="size-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-neutral-900 mt-2">{students.length}</div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Coinciden con los criterios seleccionados</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Con Matrícula Asignada
                </span>
                <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-neutral-900 mt-2">
                {students.filter((s) => Boolean(studentGradeMap[s.publicId])).length}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Alumnos con grado escolar oficial</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Filtro Aplicado
                </span>
                <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                  <Filter className="size-4" />
                </div>
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-2 truncate">
                {filterGrade !== "ALL"
                  ? `Grado: ${grades.find((g) => g.code === filterGrade)?.name || filterGrade}`
                  : filterClass !== "ALL"
                  ? `Clase: ${classes.find((c) => c.code === filterClass)?.name || filterClass}`
                  : filterClassroom !== "ALL"
                  ? `Aula: ${classrooms.find((cr) => cr.code === filterClassroom)?.name || filterClassroom}`
                  : searchQuery
                  ? `Búsqueda: "${searchQuery}"`
                  : "Todos los alumnos"}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Criterio activo de consulta</p>
            </Card>
          </div>

          {/* STUDENTS TABLE */}
          <Card className="p-0 overflow-hidden relative z-10 shadow-xs border-neutral-200/90">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Listado de Estudiantes</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mostrando {students.length} estudiantes según los filtros aplicados.
                </p>
              </div>
            </div>

            {studentsLoading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="size-8 animate-spin text-neutral-900" />
                <p className="text-xs text-neutral-500 font-semibold">Cargando directorio de estudiantes...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center space-y-2">
                <GraduationCap className="size-12 text-neutral-300 stroke-1" />
                <p className="text-sm font-bold text-neutral-800">No se encontraron estudiantes</p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Ningún alumno coincide con los filtros especificados. Prueba cambiando el grado, aula o término de búsqueda.
                </p>
                <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl mt-3 text-xs font-bold cursor-pointer">
                  Restablecer filtros
                </Button>
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
                    {students.map((student) => {
                      const studentGradeCode = studentGradeMap[student.publicId];
                      const gradeObj = grades.find((g) => g.code === studentGradeCode);
                      const enrolledClassesCount = studentClassesMap[student.publicId]?.size || 0;

                      return (
                        <TableRow key={student.publicId} className="hover:bg-neutral-50/80 transition-colors">
                          {/* Student Name & Avatar */}
                          <TableCell className="py-3.5">
                            <Link
                              href={`/school/students/${student.publicId}`}
                              className="group flex items-center gap-3 cursor-pointer"
                            >
                              <div className="size-9 rounded-2xl bg-neutral-900 text-lime-400 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                                {student.profilePicture ? (
                                  <img
                                    src={student.profilePicture}
                                    alt={student.firstName}
                                    className="size-full object-cover rounded-2xl"
                                  />
                                ) : (
                                  <span>
                                    {student.firstName?.[0]?.toUpperCase()}
                                    {student.lastName?.[0]?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 text-sm group-hover:text-lime-600 transition-colors flex items-center gap-1.5">
                                  <span>{student.firstName} {student.lastName}</span>
                                </div>
                                <span className="text-[11px] text-neutral-400">@{student.username}</span>
                              </div>
                            </Link>
                          </TableCell>

                          {/* Identification */}
                          <TableCell className="py-3.5">
                            <span className="font-mono text-xs text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
                              {student.identityNumber || student.userCode || "—"}
                            </span>
                          </TableCell>

                          {/* Grade */}
                          <TableCell className="py-3.5">
                            {gradeObj ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 text-neutral-900 font-bold text-xs border border-neutral-200/60">
                                <GraduationCap className="size-3 text-neutral-600" />
                                {gradeObj.name}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">Sin matricular</span>
                            )}
                          </TableCell>

                          {/* Contact Info */}
                          <TableCell className="py-3.5">
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

                          {/* Enrolled Classes Count */}
                          <TableCell className="py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                              <Layers className="size-3 text-neutral-500" />
                              <span>{enrolledClassesCount} {enrolledClassesCount === 1 ? "clase" : "clases"}</span>
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3.5">
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

                          {/* Actions: Ver Detalle / Expediente + Delete */}
                          <TableCell className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/school/students/${student.publicId}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-900 text-xs font-bold gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                >
                                  <FileText className="size-3.5 text-lime-400" />
                                  <span>Ver Detalle</span>
                                  <ChevronRight className="size-3 text-neutral-400" />
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                                title="Eliminar estudiante"
                                onClick={() => handleDelete(student.publicId)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
