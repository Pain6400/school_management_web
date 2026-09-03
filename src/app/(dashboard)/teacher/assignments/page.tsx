"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assignmentsService, Assignment, AssignmentType } from "@/lib/services/assignments.service";
import { academicsService, Class } from "@/lib/services/academics.service";
import { Loader2, Plus, Trash2, CalendarIcon, Search, CheckSquare, BookOpen, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [types, setTypes] = useState<AssignmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("ALL");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    maxScore: 100,
    dueDate: "",
    classCode: "",
    schoolCode: user?.schoolCode || "ESC001",
    typeId: 1,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [asgRes, clsRes, typRes] = await Promise.all([
        assignmentsService.getAssignments().catch(() => ({ status: false, data: [] })),
        academicsService.getClasses().catch(() => ({ status: false, data: [] })),
        assignmentsService.getAssignmentTypes().catch(() => ({ status: false, data: [] })),
      ]);

      if (asgRes.status && asgRes.data) setAssignments(asgRes.data);
      if (clsRes.status && clsRes.data) {
        setClasses(clsRes.data);
        if (clsRes.data.length > 0 && !formData.classCode) {
          setFormData((prev) => ({ ...prev, classCode: clsRes.data[0].code }));
        }
      }
      if (typRes.status && typRes.data) {
        setTypes(typRes.data);
        if (typRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, typeId: typRes.data[0].id }));
        }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classCode) {
      alert("Por favor selecciona una clase.");
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        schoolCode: user?.schoolCode || "ESC001",
        maxScore: Number(formData.maxScore) || 100,
        typeId: Number(formData.typeId) || 1,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : new Date().toISOString(),
      };
      const res = await assignmentsService.createAssignment(payload);
      if (res.status) {
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          instructions: "",
          maxScore: 100,
          dueDate: "",
          classCode: classes[0]?.code || "",
          schoolCode: user?.schoolCode || "ESC001",
          typeId: types[0]?.id || 1,
        });
        fetchData();
      } else {
        alert(res.message || "Error al crear la tarea");
      }
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      alert(error.message || "Error al crear la tarea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;
    try {
      await assignmentsService.deleteAssignment(id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        a.title.toLowerCase().includes(q) ||
        (a.classCode && a.classCode.toLowerCase().includes(q));

      const matchesClass = filterClass === "ALL" || a.classCode === filterClass;
      return matchesSearch && matchesClass;
    });
  }, [assignments, searchQuery, filterClass]);  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tareas y Asignaciones</h2>
          <p className="text-sm text-muted-foreground">
            Crea y administra las actividades, exámenes y proyectos para tus estudiantes.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 shadow-xs">
                <Plus className="size-4" /> Nueva Tarea
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <CheckSquare className="size-5 text-primary" /> Crear Asignación
              </DialogTitle>
              <DialogDescription>
                Define los detalles, puntaje y fecha de entrega de la actividad.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Clase / Sección</Label>
                  <Select
                    value={formData.classCode}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, classCode: val || "" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona Clase" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <div className="p-2 text-xs text-center text-muted-foreground">
                          No hay clases registradas
                        </div>
                      ) : (
                        classes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tipo de Actividad</Label>
                  <Select
                    value={String(formData.typeId)}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, typeId: Number(val) || 1 }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.length === 0 ? (
                        <>
                          <SelectItem value="1">Tarea Regular</SelectItem>
                          <SelectItem value="2">Examen / Evaluación</SelectItem>
                          <SelectItem value="3">Proyecto</SelectItem>
                        </>
                      ) : (
                        types.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Título de la Tarea</Label>
                <Input
                  name="title"
                  placeholder="Ej: Ensayo sobre el calentamiento global"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Descripción Corta</Label>
                <Input
                  name="description"
                  placeholder="Resumen del objetivo..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instrucciones Detalladas</Label>
                <Textarea
                  name="instructions"
                  rows={3}
                  placeholder="Escribe paso a paso lo que el alumno debe entregar..."
                  value={formData.instructions}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Puntaje Máximo</Label>
                  <Input
                    name="maxScore"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.maxScore}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fecha Límite</Label>
                  <Input
                    name="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" /> Publicando...
                    </>
                  ) : (
                    "Publicar Tarea"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Listado de Tareas</CardTitle>
            <CardDescription>
              Seguimiento de tareas asignadas a tus grupos.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o clase..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterClass} onValueChange={(val) => setFilterClass(val || "ALL")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las Clases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las Clases</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Clase</TableHead>
                    <TableHead>Puntaje</TableHead>
                    <TableHead>Fecha Límite</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CheckSquare className="size-10 text-muted-foreground/40 stroke-1" />
                          <p className="font-medium">No hay tareas programadas</p>
                          <p className="text-xs text-muted-foreground">
                            {searchQuery || filterClass !== "ALL"
                              ? "No se encontraron tareas con los filtros actuales."
                              : "Crea tu primera tarea para que los alumnos puedan entregarla."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssignments.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground">{a.title}</div>
                          {a.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {a.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {a.classCode || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">{a.maxScore}</span>
                          <span className="text-xs text-muted-foreground"> pts</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                            <CalendarIcon className="size-3.5 text-primary/70" />
                            <span>
                              {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "Sin fecha"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={a.status === "ACTIVE" ? "default" : "secondary"}
                            className="text-[11px]"
                          >
                            {a.status || "Publicada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(a.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
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
    </div>
  );
}