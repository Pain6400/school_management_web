import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, BookOpen } from "lucide-react";
import { academicsService, Course } from "@/lib/services/academics.service";

export default function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    schoolCode: "ESC001",
    gradeCode: "",
    name: "",
    credits: 1,
    description: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await academicsService.getCourses();
      if (res.status) {
        setCourses(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await academicsService.createCourse(formData);
      if (res.status) {
        setIsDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cursos y Materias</CardTitle>
          <CardDescription>Crea las materias que se impartirán en los diferentes grados (Ej: Matemáticas I).</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nuevo Curso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Curso</DialogTitle>
              <DialogDescription>Define una nueva materia o asignatura dentro del plan de estudios.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código del Curso</Label>
                  <Input id="code" name="code" placeholder="Ej: MAT-1RO" value={formData.code} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradeCode">Código de Grado (Ej: 1RO)</Label>
                  <Input id="gradeCode" name="gradeCode" value={formData.gradeCode} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Materia</Label>
                <Input id="name" name="name" placeholder="Ej: Matemáticas I" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credits">Créditos</Label>
                  <Input id="credits" name="credits" type="number" min="0" value={formData.credits} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>
              <div className="flex justify-end pt-4">
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
          <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
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
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No hay cursos registrados.</TableCell></TableRow>
              ) : (
                courses.map(c => (
                  <TableRow key={c.code}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                        {c.name}
                      </div>
                    </TableCell>
                    <TableCell>{c.code}</TableCell>
                    <TableCell>{c.gradeCode}</TableCell>
                    <TableCell>{c.credits}</TableCell>
                    <TableCell>{c.status ? "Activo" : "Inactivo"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}