"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
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

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes, classesRes, gradesRes] = await Promise.allSettled([
        usersService.getUsers(),
        academicsService.getCourses(),
        academicsService.getClasses(),
        academicsService.getGrades(),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value.status) {
        // Teachers: either have role TEACHER or all staff
        setTeachers(usersRes.value.data);
      }
      if (coursesRes.status === "fulfilled" && coursesRes.value.status) {
        setCourses(coursesRes.value.data);
      }
      if (classesRes.status === "fulfilled" && classesRes.value.status) {
        setClasses(classesRes.value.data);
      }
      if (gradesRes.status === "fulfilled" && gradesRes.value.status) {
        setGrades(gradesRes.value.data);
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

        {/* MODAL CREAR MAESTRO (REDISEÑADO AMPLIO) */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nuevo Maestro</span>
            </Button>
          } />
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Docente</DialogTitle>
              <DialogDescription>
                Ingresa la información del profesor y crea sus credenciales de acceso.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5">
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
                      placeholder="Ej. Carlos Eduardo"
                      value={formData.firstName}
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
                      placeholder="Ej. Mendoza Castro"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Cédula / Identificación <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="identityNumber"
                      placeholder="Ej. 0801-1985-04321"
                      value={formData.identityNumber}
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
                      placeholder="Ej. carlos.mendoza"
                      value={formData.username}
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
                      placeholder="carlos.mendoza@colegio.edu"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Teléfono
                    </Label>
                    <Input
                      name="phone"
                      placeholder="+504 9876-5432"
                      value={formData.phone}
                      onChange={handleChange}
                      className="rounded-xl"
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
                      className="rounded-xl"
                    />
                    <p className="text-[11px] text-neutral-400">
                      El docente utilizará esta contraseña provisional para su primer acceso al sistema.
                    </p>
                  </div>
                </div>
              </div>

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
      <Card className="p-5">
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
            <div>
              <Combobox
                options={courseFilterOptions}
                value={filterCourse}
                onChange={(val) => setFilterCourse(val || "ALL")}
                placeholder="Materia / Curso"
                searchPlaceholder="Buscar materia..."
              />
            </div>

            {/* Grade Filter */}
            <div>
              <Combobox
                options={gradeFilterOptions}
                value={filterGrade}
                onChange={(val) => setFilterGrade(val || "ALL")}
                placeholder="Grado asignado"
                searchPlaceholder="Buscar grado..."
              />
            </div>

            {/* Status Filter */}
            <div>
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
      <Card className="p-0 overflow-hidden">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          onClick={() => handleDelete(teacher.publicId)}
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
