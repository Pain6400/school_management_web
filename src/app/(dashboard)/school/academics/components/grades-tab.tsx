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
import { Loader2, Plus, GraduationCap } from "lucide-react";
import { academicsService, Grade } from "@/lib/services/academics.service";
import { useAuthStore } from "@/store/auth-store";
import { AlertCircle } from "lucide-react";

export default function GradesTab() {
  const { user } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "", name: "", level: 1, description: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await academicsService.getGrades();
      if (res.status && res.data) setGrades(res.data);
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
      setErrorMessage(null);
      const payload = { ...formData, ...(user?.schoolCode ? { schoolCode: user.schoolCode } : {}) };
      const res = await academicsService.createGrade(payload);
      if (!res.status) setErrorMessage(res.message || "Error al crear el grado");
      if (res.status) {
        setIsDialogOpen(false);
        setFormData({ code: "", name: "", level: 1, description: "" });
        fetchData();
      }
    } catch (error: any) { console.error(error); setErrorMessage(error.message || "Error al crear el grado"); } finally { setIsSubmitting(false); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Grados Académicos</CardTitle>
          <CardDescription>Configura los niveles o grados impartidos (Ej. Primero, Segundo, Séptimo).</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nuevo Grado</span>
            </Button>
          } />
          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="size-5 text-neutral-900" />
                <span>Agregar Grado Académico</span>
              </DialogTitle>
              <DialogDescription>
                Define un nuevo grado o nivel educativo para estructurar las secciones y matrículas.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <DialogBody>
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="code" className="text-sm font-semibold text-neutral-800">
                      Código del Grado <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Ej: 1RO, 2DO, PRE"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                    <p className="text-[11px] text-neutral-400">Identificador corto único en la institución.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="level" className="text-sm font-semibold text-neutral-800">
                      Nivel Numérico / Orden <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="level"
                      name="level"
                      type="number"
                      min="0"
                      value={formData.level}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5"
                    />
                    <p className="text-[11px] text-neutral-400">Orden jerárquico (0 para Preescolar, 1 para Primero...).</p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-neutral-800">
                      Nombre del Grado <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ej: Primer Grado de Primaria"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl text-sm px-3.5 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-neutral-800">
                      Descripción (Opcional)
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Notas adicionales o especificaciones del grado..."
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
                    "Guardar Grado"
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
                <TableHead>Nivel Numérico</TableHead><TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No hay grados registrados.</TableCell></TableRow>
              ) : (
                grades.map(g => (
                  <TableRow key={g.code}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.code}</TableCell>
                    <TableCell>{g.level}</TableCell>
                    <TableCell>{g.description || "-"}</TableCell>
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