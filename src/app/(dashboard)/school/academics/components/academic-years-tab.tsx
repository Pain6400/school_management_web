import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { academicsService, AcademicYear } from "@/lib/services/academics.service";

export default function AcademicYearsTab() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    schoolCode: "ESC001",
    yearCode: new Date().getFullYear(),
    name: `Año Escolar ${new Date().getFullYear()}`,
    startDate: "",
    endDate: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await academicsService.getAcademicYears();
      if (res.status) setYears(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      const res = await academicsService.createAcademicYear(formData);
      if (res.status) { setIsDialogOpen(false); fetchData(); }
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
          <CardTitle>Años Académicos</CardTitle>
          <CardDescription>Gestiona los años escolares de la institución.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nuevo Año</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Año Académico</DialogTitle>
              <DialogDescription>Define las fechas de inicio y fin del año escolar.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearCode">Código (Año)</Label>
                  <Input id="yearCode" name="yearCode" type="number" value={formData.yearCode} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar"}
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
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No hay años académicos registrados.</TableCell></TableRow>
              ) : (
                years.map(y => (
                  <TableRow key={y.id}>
                    <TableCell className="font-medium">{y.name}</TableCell>
                    <TableCell>{y.yearCode}</TableCell>
                    <TableCell>{new Date(y.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(y.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{y.status ? "Activo" : "Inactivo"}</TableCell>
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