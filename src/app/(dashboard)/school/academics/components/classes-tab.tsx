"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Plus, Trash2, Users, Clock, MapPin, BookOpen, Search,
} from "lucide-react";
import { academicsService, Class, Grade, Classroom, Course, AcademicYear } from "@/lib/services/academics.service";
import { usersService, User } from "@/lib/services/api.service";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const DAY_LABELS: Record<string, string> = {
  MON: "Lun", TUE: "Mar", WED: "Mié", THU: "Jue", FRI: "Vie", SAT: "Sáb",
};

export default function ClassesTab() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");

  const [formData, setFormData] = useState({
    code: "",
    schoolCode: "ESC001",
    academicYearId: 0,
    courseCode: "",
    gradeCode: "",
    classroomCode: "",
    teacherId: "",
    name: "",
    maxStudents: 25,
    scheduleStart: "08:00",
    scheduleEnd: "09:00",
    scheduleDays: [] as string[],
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [classesRes, gradesRes, classroomsRes, coursesRes, yearsRes, usersRes] =
        await Promise.allSettled([
          academicsService.getClasses(),
          academicsService.getGrades(),
          academicsService.getClassrooms(),
          academicsService.getCourses(),
          academicsService.getAcademicYears(),
          usersService.getUsers(),
        ]);

      if (classesRes.status === "fulfilled" && classesRes.value.status)
        setClasses(classesRes.value.data);
      if (gradesRes.status === "fulfilled" && gradesRes.value.status)
        setGrades(gradesRes.value.data);
      if (classroomsRes.status === "fulfilled" && classroomsRes.value.status)
        setClassrooms(classroomsRes.value.data);
      if (coursesRes.status === "fulfilled" && coursesRes.value.status)
        setCourses(coursesRes.value.data);
      if (yearsRes.status === "fulfilled" && yearsRes.value.status)
        setAcademicYears(yearsRes.value.data);
      if (usersRes.status === "fulfilled" && usersRes.value.status)
        setTeachers(usersRes.value.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Filtrar cursos según el grado seleccionado en el form
  const filteredCoursesForForm = useMemo(
    () => formData.gradeCode
      ? courses.filter((c) => c.gradeCode === formData.gradeCode)
      : courses,
    [courses, formData.gradeCode]
  );

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade =
        filterGrade === "ALL" || c.gradeCode === filterGrade;
      return matchSearch && matchGrade;
    });
  }, [classes, searchQuery, filterGrade]);

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter((d) => d !== day)
        : [...prev.scheduleDays, day],
    }));
  };

  const handleSelectChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        code: formData.code,
        schoolCode: formData.schoolCode,
        name: formData.name,
        academicYearId: Number(formData.academicYearId),
        courseCode: formData.courseCode,
        gradeCode: formData.gradeCode,
        classroomCode: formData.classroomCode,
        teacherId: formData.teacherId || undefined,
        maxStudents: formData.maxStudents,
        schedule: {
          days: formData.scheduleDays,
          start: formData.scheduleStart,
          end: formData.scheduleEnd,
        },
      };
      const res = await academicsService.createClass(payload);
      if (res.status) {
        setIsDialogOpen(false);
        setFormData({
          code: "", schoolCode: "ESC001", academicYearId: 0, courseCode: "",
          gradeCode: "", classroomCode: "", teacherId: "", name: "",
          maxStudents: 25, scheduleStart: "08:00", scheduleEnd: "09:00", scheduleDays: [],
        });
        fetchAll();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta clase?")) return;
    try { await academicsService.deleteClass(code); fetchAll(); } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Clases y Secciones</CardTitle>
              <CardDescription>
                Combinación de materia, maestro y aula para un año académico.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva Clase</Button>} />
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Abrir Nueva Sección / Clase</DialogTitle>
                  <DialogDescription>
                    Selecciona los datos relacionados desde los catálogos del sistema.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">

                  {/* Fila 1: Código y Nombre */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código de la Clase <span className="text-destructive">*</span></Label>
                      <Input id="code" name="code" placeholder="Ej: MAT1-A-2025"
                        value={formData.code} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre / Sección <span className="text-destructive">*</span></Label>
                      <Input id="name" name="name" placeholder="Ej: Matemáticas 1ro - A"
                        value={formData.name} onChange={handleInputChange} required />
                    </div>
                  </div>

                  {/* Fila 2: Año Académico */}
                  <div className="space-y-2">
                    <Label>Año Académico <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.academicYearId ? String(formData.academicYearId) : ""}
                      onValueChange={(v) => handleSelectChange("academicYearId", Number(v ?? 0))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un año académico..." />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((y) => (
                          <SelectItem key={y.id} value={String(y.id)}>
                            {y.name} ({y.yearCode}) {y.isCurrent ? "— Actual" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fila 3: Grado y Curso (dependiente) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Grado <span className="text-destructive">*</span></Label>
                      <Select
                        value={formData.gradeCode}
                        onValueChange={(v) => {
                          handleSelectChange("gradeCode", v ?? "");
                          handleSelectChange("courseCode", ""); // reset curso
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un grado..." />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((g) => (
                            <SelectItem key={g.code} value={g.code}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Materia / Curso <span className="text-destructive">*</span></Label>
                      <Select
                        value={formData.courseCode}
                        onValueChange={(v) => handleSelectChange("courseCode", v ?? "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={formData.gradeCode ? "Selecciona materia..." : "Primero selecciona grado"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCoursesForForm.length === 0 ? (
                            <SelectItem value="__none" disabled>
                              No hay materias para este grado
                            </SelectItem>
                          ) : (
                            filteredCoursesForForm.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fila 4: Aula y Maestro */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Aula <span className="text-destructive">*</span></Label>
                      <Select
                        value={formData.classroomCode}
                        onValueChange={(v) => handleSelectChange("classroomCode", v ?? "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un aula..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classrooms.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name} — {c.location} ({c.capacity} alumnos)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Maestro Asignado</Label>
                      <Select
                        value={formData.teacherId}
                        onValueChange={(v) => handleSelectChange("teacherId", v ?? "")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un maestro..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.publicId} value={t.publicId}>
                              {t.firstName} {t.lastName} ({t.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fila 5: Cupo Máximo */}
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">Cupo Máximo de Alumnos</Label>
                    <Input id="maxStudents" name="maxStudents" type="number"
                      min="1" max="100" value={formData.maxStudents} onChange={handleInputChange} />
                  </div>

                  {/* Fila 6: Horario */}
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <Label className="text-sm font-semibold">Horario de Clases</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            formData.scheduleDays.includes(day)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-muted"
                          }`}
                        >
                          {DAY_LABELS[day]}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduleStart">Hora Inicio</Label>
                        <Input id="scheduleStart" name="scheduleStart" type="time"
                          value={formData.scheduleStart} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scheduleEnd">Hora Fin</Label>
                        <Input id="scheduleEnd" name="scheduleEnd" type="time"
                          value={formData.scheduleEnd} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                      ) : (
                        "Crear Clase"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Grado:</Label>
              <Select value={filterGrade} onValueChange={(val) => setFilterGrade(val || "ALL")}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos los Grados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los Grados</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g.code} value={g.code}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando clases...</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Clase / Sección</TableHead>
                    <TableHead>Materia</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Aula</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Cupo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <BookOpen className="size-10 text-muted-foreground/40 stroke-1" />
                          <p className="font-medium">No se encontraron clases</p>
                          <p className="text-xs max-w-sm">
                            {searchQuery || filterGrade !== "ALL"
                              ? "Prueba cambiando los filtros."
                              : "Comienza creando tu primera clase."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClasses.map((c) => {
                      const daysText = c.schedule?.days?.join(", ") ?? "Por definir";
                      const timeText = c.schedule?.start && c.schedule?.end
                        ? `${c.schedule.start} - ${c.schedule.end}` : "";
                      return (
                        <TableRow key={c.code} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="font-semibold">{c.name}</div>
                            <div className="text-xs font-mono text-muted-foreground">{c.code}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{c.course?.name || c.courseCode || "Sin materia"}</div>
                            {c.grade?.name && (
                              <Badge variant="outline" className="text-[10px] mt-0.5 px-1.5 py-0">
                                {c.grade.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.teacher ? (
                              <div className="text-sm">
                                <span className="font-medium">{c.teacher.firstName} {c.teacher.lastName}</span>
                                <div className="text-xs text-muted-foreground">@{c.teacher.username}</div>
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.classroom ? (
                              <div className="text-sm">
                                <span className="font-medium">{c.classroom.name}</span>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="size-3" />{c.classroom.location || "Edificio"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{c.classroomCode || "Sin aula"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs flex flex-col gap-0.5">
                              <span className="font-medium">{daysText}</span>
                              {timeText && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="size-3" />{timeText}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-xs gap-1">
                              <Users className="size-3.5 text-muted-foreground" />
                              <span className="font-medium">{c.maxStudents}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={c.status === "ACTIVE" ? "default" : "secondary"}
                              className={c.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[11px]"
                                : "text-[11px]"}
                            >
                              {c.status === "ACTIVE" ? "Activa" : c.status || "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(c.code)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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