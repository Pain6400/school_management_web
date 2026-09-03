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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
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
          <DialogTrigger render={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nuevo Curso</Button>} />
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Agregar Curso / Materia</DialogTitle>
              <DialogDescription>
                Define una nueva asignatura dentro del plan de estudios de un grado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código del Curso <span className="text-destructive">*</span></Label>
                  <Input id="code" name="code" placeholder="Ej: MAT-1RO"
                    value={formData.code} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Grado <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.gradeCode}
                    onValueChange={(v) => setFormData({ ...formData, gradeCode: v ?? "" })}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Materia <span className="text-destructive">*</span></Label>
                <Input id="name" name="name" placeholder="Ej: Matemáticas I"
                  value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Créditos</Label>
                <Input id="credits" name="credits" type="number" min="0"
                  value={formData.credits} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description"
                  value={formData.description} onChange={handleChange} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Curso"}
                </Button>
              </div>
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