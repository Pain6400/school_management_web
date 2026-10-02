import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Loader2, Plus, Users, MapPin, Building2 } from "lucide-react";
import { academicsService, Classroom } from "@/lib/services/academics.service";

export default function ClassroomsTab() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "", name: "", capacity: 30, location: "", description: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await academicsService.getClassrooms();
      if (res.status && res.data) setClassrooms(res.data);
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
      const res = await academicsService.createClassroom(formData);
      if (res.status) {
        setIsDialogOpen(false);
        setFormData({ code: "", name: "", capacity: 30, location: "", description: "" });
        fetchData();
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Aulas y Espacios</CardTitle>
          <CardDescription>Gestiona los espacios físicos donde se imparten las clases.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nueva Aula</span>
            </Button>
          } />
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-neutral-900" />
                <span>Registrar Nueva Aula o Espacio</span>
              </DialogTitle>
              <DialogDescription>
                Registra un nuevo espacio físico (Ej: Aula 101, Laboratorio de Ciencias, Auditorio).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <DialogBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-sm font-semibold text-neutral-800">
                      Código del Aula <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Ej: A-101, LAB-B"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                    <p className="text-[11px] text-neutral-400">Identificador físico del aula.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-semibold text-neutral-800">
                      Nombre del Aula <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ej: Aula 101 - Edificio Central"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="capacity" className="text-sm font-semibold text-neutral-800">
                      Capacidad Máxima (Alumnos) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-sm font-semibold text-neutral-800">
                      Ubicación (Edificio / Piso) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Ej: Edificio Norte, 2do Piso"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-neutral-800">
                      Descripción o Equipamiento
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Ej: Proyector, aire acondicionado, 30 pupitres..."
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
                    "Guardar Aula"
                  )}
                </Button>
              </DialogFooter>
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
                <TableHead>Nombre</TableHead><TableHead>Código</TableHead>
                <TableHead>Ubicación</TableHead><TableHead>Capacidad</TableHead><TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classrooms.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No hay aulas registradas.</TableCell></TableRow>
              ) : (
                classrooms.map(c => (
                  <TableRow key={c.code}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.code}</TableCell>
                    <TableCell><div className="flex items-center text-muted-foreground text-sm"><MapPin className="mr-1 h-3 w-3" /> {c.location}</div></TableCell>
                    <TableCell><div className="flex items-center text-muted-foreground text-sm"><Users className="mr-1 h-3 w-3" /> {c.capacity}</div></TableCell>
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