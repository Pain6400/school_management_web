"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assignmentsService, Assignment } from "@/lib/services/assignments.service";
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    maxScore: 100,
    dueDate: "",
    classCode: "", // Needs to be populated by the teacher's active classes
    schoolCode: "ESC001", // TODO: Get from auth context
    typeId: 1 // Default assignment type
  });

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // Idealmente, obtendríamos las tareas por clase del maestro.
      // Por ahora, obtenemos todas (o según API).
      const res = await assignmentsService.getAssignments();
      if (res.status) {
        setAssignments(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // We must format the date to ISO string if needed by backend
      const payload = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString()
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
          classCode: "",
          schoolCode: "ESC001",
          typeId: 1
        });
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Estás seguro de que deseas eliminar esta tarea?")) return;
    try {
      await assignmentsService.deleteAssignment(id);
      fetchAssignments();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tareas y Asignaciones</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nueva Tarea</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Asignación</DialogTitle>
              <DialogDescription>
                Define una nueva tarea para tus estudiantes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Tarea</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classCode">Código de Clase</Label>
                <Input id="classCode" name="classCode" placeholder="Ej: MAT1-A-2024" value={formData.classCode} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción Corta</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones Detalladas</Label>
                <Textarea 
                  id="instructions" 
                  name="instructions" 
                  rows={4}
                  value={formData.instructions} 
                  onChange={handleChange} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Puntaje Máximo</Label>
                  <Input id="maxScore" name="maxScore" type="number" min="0" value={formData.maxScore} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha de Entrega</Label>
                  <Input id="dueDate" name="dueDate" type="datetime-local" value={formData.dueDate} onChange={handleChange} required />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publicar Tarea"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Tareas</CardTitle>
          <CardDescription>Visualiza y administra las tareas asignadas a tus clases.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay tareas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>{assignment.classCode || "N/A"}</TableCell>
                      <TableCell>{assignment.maxScore}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.status}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}