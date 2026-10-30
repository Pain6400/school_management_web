"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usersService, User } from "@/lib/services/api.service";
import { academicsService, Course, Class, Grade } from "@/lib/services/academics.service";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2, Plus, Trash2, Users, Mail, Search,
  Phone, BookOpen, AlertCircle, Filter, RotateCcw,
  CheckCircle2, Layers, Briefcase, Key, UserCheck,
  Calendar, Eye, ShieldCheck, MapPin, Clock, ExternalLink,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_FORM = {
  identityNumber: "",
  schoolCode: "ESC001",
  userCode: "",
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  roleId: 3, // TEACHER role
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacherWorkload, setSelectedTeacherWorkload] = useState<User | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("ALL");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const extractData = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes, classesRes, gradesRes] = await Promise.allSettled([
        usersService.getTeachers(),
        academicsService.getCourses(),
        academicsService.getClasses(),
        academicsService.getGrades(),
      ]);

      if (usersRes.status === "fulfilled") {
        setTeachers(extractData(usersRes.value));
      }
      if (coursesRes.status === "fulfilled") {
        setCourses(extractData(coursesRes.value));
      }
      if (classesRes.status === "fulfilled") {
        setClasses(extractData(classesRes.value));
      }
      if (gradesRes.status === "fulfilled") {
        setGrades(extractData(gradesRes.value));
      }
    } catch (err) {
      console.error("Error loading teachers data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Map of teacherId -> classes array
  const teacherClassesMap = useMemo(() => {
    const map: Record<string, Class[]> = {};
    classes.forEach((c) => {
      if (c.teacherId) {
        if (!map[c.teacherId]) map[c.teacherId] = [];
        map[c.teacherId].push(c);
      }
    });
    return map;
  }, [classes]);

  // Options for Course/Subject Filter
  const courseFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todas las Materias / Cursos" },
      ...courses.map((c) => ({
        value: c.code,
        label: c.name,
        badge: c.code,
      })),
    ];
  }, [courses]);

  // Options for Grade Filter
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

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      // 1. Text Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.username?.toLowerCase().includes(q) ||
        t.identityNumber?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const teacherClasses = teacherClassesMap[t.publicId] || [];

      // 2. Course Filter
      if (filterCourse !== "ALL") {
        const teachesCourse = teacherClasses.some((c) => c.courseCode === filterCourse);
        if (!teachesCourse) return false;
      }

      // 3. Grade Filter
      if (filterGrade !== "ALL") {
        const teachesGrade = teacherClasses.some((c) => c.gradeCode === filterGrade);
        if (!teachesGrade) return false;
      }

      // 4. Status Filter
      if (filterStatus === "ASSIGNED" && teacherClasses.length === 0) return false;
      if (filterStatus === "UNASSIGNED" && teacherClasses.length > 0) return false;

      return true;
    });
  }, [teachers, searchQuery, filterCourse, filterGrade, filterStatus, teacherClassesMap]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterCourse("ALL");
    setFilterGrade("ALL");
    setFilterStatus("ALL");
  };

  const hasActiveFilters = searchQuery !== "" || filterCourse !== "ALL" || filterGrade !== "ALL" || filterStatus !== "ALL";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      const { roleId, ...userData } = formData;
      const res = await usersService.createUser(userData);
      if (res.status) {
        try {
          await usersService.assignRole(res.data.publicId, roleId);
        } catch (roleErr) {
          console.warn("No se pudo asignar el rol:", roleErr);
        }
        setIsDialogOpen(false);
        setFormData(INITIAL_FORM);
        fetchAllData();
      } else {
        setError(res.message || "Error al crear el docente");
      }
    } catch (err: any) {
      setError(err.message || "Error al registrar al docente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("¿Eliminar este profesor?")) return;
    try {
      await usersService.deleteUser(publicId);
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
            Cuerpo Docente
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Administra a los profesores, materias asignadas y horarios de clase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/school/teachers/applications">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              <Briefcase className="size-3.5 text-lime-600" />
              <span>Bolsa de Empleo</span>
              <Badge variant="outline" className="bg-lime-50 text-lime-800 border-lime-300 text-[9px] py-0 px-1 font-bold">
                Staff
              </Badge>
            </Button>
          </Link>

          <Link href="/school/teachers/roles">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              <ShieldCheck className="size-3.5 text-purple-600" />
              <span>Matriz RBAC</span>
            </Button>
          </Link>

        {/* MODAL CREAR MAESTRO (REDISEÑADO AMPLIO) */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nuevo Maestro</span>
            </Button>
          } />
          <DialogContent size="xl">
            <form onSubmit={handleSubmit} className="flex flex-col">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Docente</DialogTitle>
                <DialogDescription>
                  Ingresa la información del profesor y crea sus credenciales de acceso.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombres <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="firstName" placeholder="Ej. Carlos Eduardo"
                      value={formData.firstName}
                      onChange={handleChange}
                      required className="h-11 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="lastName" placeholder="Ej. Mendoza Castro"
                      value={formData.lastName}
                      onChange={handleChange}
                      required className="h-11 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Cédula / Identificación <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="identityNumber" placeholder="Ej. 0801-1985-04321"
                      value={formData.identityNumber}
                      onChange={handleChange}
                      required className="h-11 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombre de Usuario <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="username" placeholder="Ej. carlos.mendoza"
                      value={formData.username}
                      onChange={handleChange}
                      required className="h-11 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="email" type="email"
                      placeholder="carlos.mendoza@colegio.edu"
                      value={formData.email}
                      onChange={handleChange}
                      required className="h-11 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Teléfono
                    </Label>
                    <Input
                      name="phone" placeholder="+504 9876-5432"
                      value={formData.phone}
                      onChange={handleChange} className="h-11 rounded-xl text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-neutral-700">
                      Contraseña Temporal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                    <p className="text-[11px] text-neutral-400">
                      El docente utilizará esta contraseña provisional para su primer acceso al sistema.
                    </p>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsDialogOpen(false); setFormData(INITIAL_FORM); setError(null); }}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 size-3.5 animate-spin" />Guardando...</>
                  ) : (
                    "Guardar Maestro"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Maestros</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Users className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{teachers.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Docentes en plantilla</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Con Asignación</span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">
            {Object.keys(teacherClassesMap).length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Profesores con clases activas</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Resultados Filtrados</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Search className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{filteredTeachers.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Coinciden con los filtros</p>
        </Card>
      </div>

      {/* ADVANCED FILTERS BAR */}
      <Card className="p-5 overflow-visible relative z-20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900">Filtros de Docentes</h3>
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
            {/* Text Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, email o cédula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs h-10"
              />
            </div>

            {/* Course Filter */}
            <div className="w-full">
              <Combobox
                options={courseFilterOptions}
                value={filterCourse}
                onChange={(val) => setFilterCourse(val || "ALL")}
                placeholder="Materia / Curso"
                searchPlaceholder="Buscar materia..."
              />
            </div>

            {/* Grade Filter */}
            <div className="w-full">
              <Combobox
                options={gradeFilterOptions}
                value={filterGrade}
                onChange={(val) => setFilterGrade(val || "ALL")}
                placeholder="Grado asignado"
                searchPlaceholder="Buscar grado..."
              />
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <Combobox
                options={[
                  { value: "ALL", label: "Todas las Asignaciones" },
                  { value: "ASSIGNED", label: "Con Clases Asignadas" },
                  { value: "UNASSIGNED", label: "Sin Clases Asignadas" },
                ]}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val || "ALL")}
                placeholder="Asignación"
                searchPlaceholder="Buscar estado..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* TEACHERS TABLE */}
      <Card className="p-0 overflow-hidden relative z-10">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Listado de Docentes</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Mostrando {filteredTeachers.length} de {teachers.length} profesores registrados.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando directorio de docentes...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
            <Users className="size-12 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No se encontraron profesores</p>
            <p className="text-xs text-neutral-500 max-w-sm">
              {hasActiveFilters
                ? "Prueba cambiando o limpiando los filtros seleccionados."
                : "Aún no hay profesores registrados en el sistema."}
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
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Profesor</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Cédula / ID</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Materias que Imparte</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Clases Activas</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Contacto</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => {
                  const teacherClasses = teacherClassesMap[teacher.publicId] || [];
                  const distinctCourses = Array.from(
                    new Set(teacherClasses.map((c) => c.course?.name || c.courseCode).filter(Boolean))
                  );

                  return (
                    <TableRow key={teacher.publicId} className="hover:bg-neutral-50/80 transition-colors">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-neutral-900 text-lime-400 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                            {teacher.firstName?.[0]?.toUpperCase()}{teacher.lastName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 text-sm">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <span className="text-[11px] text-neutral-400">@{teacher.username}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                          {teacher.identityNumber || "—"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {distinctCourses.length === 0 ? (
                            <span className="text-xs text-neutral-400 italic">Sin materias asignadas</span>
                          ) : (
                            distinctCourses.map((courseName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-lime-100 text-lime-900 border border-lime-200/60"
                              >
                                <BookOpen className="size-2.5" />
                                <span>{courseName}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                          <Layers className="size-3 text-neutral-500" />
                          <span>{teacherClasses.length} {teacherClasses.length === 1 ? "sección" : "secciones"}</span>
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Mail className="size-3 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{teacher.email}</span>
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                              <Phone className="size-3 text-neutral-400 shrink-0" />
                              <span>{teacher.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl text-xs font-bold gap-1 text-neutral-700 hover:bg-neutral-100"
                            onClick={() => setSelectedTeacherWorkload(teacher)}
                          >
                            <Calendar className="size-3.5 text-lime-700" />
                            <span>Carga Académica</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            onClick={() => handleDelete(teacher.publicId)}
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
    
      {/* TEACHER ACADEMIC WORKLOAD MODAL */}
      <Dialog open={!!selectedTeacherWorkload} onOpenChange={(open) => !open && setSelectedTeacherWorkload(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          {selectedTeacherWorkload && (() => {
            const tClasses = teacherClassesMap[selectedTeacherWorkload.publicId] || [];
            const tCourses = Array.from(new Set(tClasses.map((c) => c.course?.name || c.courseCode).filter(Boolean)));
            const tClassrooms = Array.from(new Set(tClasses.map((c) => c.classroom?.name).filter(Boolean)));
            const tGrades = Array.from(new Set(tClasses.map((c) => c.grade?.name || c.gradeCode).filter(Boolean)));

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="size-11 rounded-2xl bg-neutral-900 text-lime-400 font-bold text-sm flex items-center justify-center">
                      {selectedTeacherWorkload.firstName?.[0]}{selectedTeacherWorkload.lastName?.[0]}
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-black text-neutral-900">
                        {selectedTeacherWorkload.firstName} {selectedTeacherWorkload.lastName}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-neutral-500">
                        Expediente de Carga Académica y Horario de Clases · @{selectedTeacherWorkload.username}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {/* WORKLOAD METRICS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Clases Asignadas
                      </span>
                      <span className="text-xl font-black text-neutral-900 mt-1 block">
                        {tClasses.length}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-lime-50/60 border border-lime-200 text-center">
                      <span className="text-[10px] font-bold text-lime-800 uppercase tracking-wider block">
                        Materias Únicas
                      </span>
                      <span className="text-xl font-black text-lime-900 mt-1 block">
                        {tCourses.length}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 text-center">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                        Aulas Asignadas
                      </span>
                      <span className="text-xl font-black text-blue-900 mt-1 block">
                        {tClassrooms.length}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 text-center">
                      <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                        Grados
                      </span>
                      <span className="text-xl font-black text-purple-900 mt-1 block">
                        {tGrades.length}
                      </span>
                    </div>
                  </div>

                  {/* CLASSES BREAKDOWN */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Detalle de Secciones y Cursos</span>
                      <Link href="/school/academics/timetable" className="text-lime-700 hover:underline normal-case font-semibold text-xs flex items-center gap-1">
                        <span>Ver Horario Semanal</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </h4>

                    {tClasses.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                        <BookOpen className="size-8 text-neutral-300 mx-auto mb-1 stroke-1" />
                        <p className="text-xs font-bold text-neutral-700">Sin clases asignadas actualmente</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Puedes asignarle clases en el módulo de Académico &gt; Clases y Secciones.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tClasses.map((cls, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 font-bold text-xs">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                                  <span>{cls.name}</span>
                                  <Badge variant="outline" className="bg-lime-50 text-lime-900 border-lime-300 text-[9px] font-bold py-0">
                                    {cls.code}
                                  </Badge>
                                </div>
                                <div className="text-[11px] text-neutral-500 mt-0.5 flex flex-wrap items-center gap-2">
                                  <span>{cls.course?.name || cls.courseCode}</span>
                                  <span>·</span>
                                  <span>{cls.grade?.name || cls.gradeCode}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700 font-semibold text-[11px]">
                                <MapPin className="size-3 text-neutral-400" />
                                {cls.classroom?.name || "Sin aula fija"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogBody>

                <DialogFooter className="border-t border-neutral-200 pt-3">
                  <Button
                    onClick={() => setSelectedTeacherWorkload(null)}
                    className="rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white"
                  >
                    Cerrar Detalle
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}
