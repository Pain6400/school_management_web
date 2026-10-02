"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, BookOpen } from "lucide-react";
import { academicsService, Course, Grade } from "@/lib/services/academics.service";

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "", schoolCode: "ESC001", gradeCode: "", name: "", credits: 1, description: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, gradesRes] = await Promise.allSettled([
        academicsService.getCourses(),
        academicsService.getGrades(),
      ]);
      if (coursesRes.status === "fulfilled" && coursesRes.value.status)
        setCourses(coursesRes.value.data);
      if (gradesRes.status === "fulfilled" && gradesRes.value.status)
        setGrades(gradesRes.value.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await academicsService.createCourse(formData);
      if (res.status) { setIsDialogOpen(false); fetchData(); }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const gradeMap = Object.fromEntries(grades.map((g) => [g.code, g.name]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cursos y Materias</CardTitle>
          <CardDescription>
            Asignaturas que se imparten en cada grado.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nuevo Curso</span>
            </Button>
          } />
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="size-5 text-neutral-900" />
                <span>Agregar Curso o Asignatura</span>
              </DialogTitle>
              <DialogDescription>
                Define una nueva asignatura dentro del plan de estudios y vincúlala a un grado escolar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <DialogBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-sm font-semibold text-neutral-800">
                      Código del Curso <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Ej: MAT-1RO, CIEN-01"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                    <p className="text-[11px] text-neutral-400">Identificador corto único de la materia.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-800">
                      Grado Correspondiente <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.gradeCode}
                      onValueChange={(v) => setFormData({ ...formData, gradeCode: v ?? "" })}
                    >
                      <SelectTrigger className="w-full h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Selecciona un grado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g.code} value={g.code}>
                            {g.name} ({g.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-neutral-800">
                      Nombre de la Materia <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ej: Matemáticas I, Lengua y Literatura"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="credits" className="text-sm font-semibold text-neutral-800">
                      Créditos / Carga Horaria <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="credits"
                      name="credits"
                      type="number"
                      min="0"
                      value={formData.credits}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-neutral-800">
                      Descripción del Curso
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Objetivos o especificaciones de la materia..."
                      value={formData.description}
                      onChange={handleChange}
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                  </div>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl px-5 text-xs font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl px-6 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 size-3.5 animate-spin" /> Guardando...</>
                  ) : (
                    "Guardar Curso"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="size-8 stroke-1 text-muted-foreground/40" />
                        <p>No hay cursos registrados.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((c) => (
                    <TableRow key={c.code} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {c.name}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{c.code}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          {gradeMap[c.gradeCode] ?? c.gradeCode}
                        </span>
                      </TableCell>
                      <TableCell>{c.credits}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${c.status ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {c.status ? "Activo" : "Inactivo"}
                        </span>
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
  );
}