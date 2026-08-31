import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Users } from "lucide-react";
import { academicsService, Class } from "@/lib/services/academics.service";

export default function ClassesTab() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "", schoolCode: "ESC001", academicYearId: 1,
    courseCode: "", gradeCode: "", classroomCode: "", teacherId: "",
    name: "", maxStudents: 25,
    schedule: { days: ["MON", "WED"], start: "08:00", end: "09:00" },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await academicsService.getClasses();
      if (res.status) setClasses(res.data);
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
      const res = await academicsService.createClass(formData);
      if (res.status) { setIsDialogOpen(false); fetchData(); }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Clases y Secciones</CardTitle>
          <CardDescription>Crea las secciones específicas donde se combinan curso, maestro y aula.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva Clase</Button>} />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Abrir Sección / Clase</DialogTitle>
              <DialogDescription>Configura los detalles de una nueva sección para este año académico.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código de la Clase</Label>
                  <Input id="code" name="code" placeholder="Ej: MAT1-A-2024" value={formData.code} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre / Sección</Label>
                  <Input id="name" name="name" placeholder="Ej: Matemáticas 1ro Sección A" value={formData.name} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">ID Curso</Label>
                  <Input id="courseCode" name="courseCode" value={formData.courseCode} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradeCode">ID Grado</Label>
                  <Input id="gradeCode" name="gradeCode" value={formData.gradeCode} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYearId">ID Año Académico</Label>
                  <Input id="academicYearId" name="academicYearId" type="number" value={formData.academicYearId} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classroomCode">ID Aula</Label>
                  <Input id="classroomCode" name="classroomCode" value={formData.classroomCode} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacherId">ID Maestro</Label>
                  <Input id="teacherId" name="teacherId" value={formData.teacherId} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Estudiantes</Label>
                  <Input id="maxStudents" name="maxStudents" type="number" value={formData.maxStudents} onChange={handleChange} required />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Clase"}
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
                <TableHead>Nombre / Sección</TableHead><TableHead>Código</TableHead>
                <TableHead>Cupos</TableHead><TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No hay clases programadas.</TableCell></TableRow>
              ) : (
                classes.map(c => (
                  <TableRow key={c.code}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.code}</TableCell>
                    <TableCell><div className="flex items-center text-sm text-muted-foreground"><Users className="mr-1 h-4 w-4" /> {c.maxStudents}</div></TableCell>
                    <TableCell>{c.status}</TableCell>
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