"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { studentsService, Student, usersService } from "@/lib/services/api.service";
import { Loader2, Plus, Trash2, GraduationCap, Mail, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState as useLocalState } from "react";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  identityNumber: "",
  username: "",
  userCode: "",
  phone: "",
  schoolCode: "ESC001",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentsService.getStudents();
      if (res.status) setStudents(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.userCode?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      const formElement = e.currentTarget;
      const formData = new FormData(formElement);
      const res = await studentsService.createStudent(formData);
      if (res.status) {
        setIsDialogOpen(false);
        formElement.reset();
        fetchStudents();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el estudiante");
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este estudiante?")) return;
    try { await studentsService.deleteStudent(id); fetchStudents(); } catch (error) { console.error(error); }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estudiantes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona el alumnado inscrito en la institución.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setError(null); }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Registrar Estudiante</Button>} />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Estudiante</DialogTitle>
              <DialogDescription>
                Se creará el usuario con acceso al portal de alumnos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <input type="hidden" name="schoolCode" value={INITIAL_FORM.schoolCode} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre <span className="text-destructive">*</span></Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido <span className="text-destructive">*</span></Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico <span className="text-destructive">*</span></Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identityNumber">Documento de Identidad</Label>
                  <Input id="identityNumber" name="identityNumber" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono / Contacto</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario para Portal <span className="text-destructive">*</span></Label>
                  <Input id="username" name="username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userCode">Matrícula (Código) <span className="text-destructive">*</span></Label>
                  <Input id="userCode" name="userCode" placeholder="Ej: ALU-2025-001" required />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar Estudiante"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Alumnos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.status).length}</div>
            <p className="text-xs text-muted-foreground">Con acceso habilitado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resultados</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
            <p className="text-xs text-muted-foreground">Según filtros actuales</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <CardTitle>Listado de Alumnos</CardTitle>
              <CardDescription>Todos los estudiantes inscritos en el sistema.</CardDescription>
            </div>
            <div className="sm:ml-auto relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alumno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <GraduationCap className="size-10 stroke-1 text-muted-foreground/40" />
                          <p className="font-medium">
                            {searchQuery ? "Sin resultados para tu búsqueda." : "No hay estudiantes registrados."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.publicId} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 font-semibold text-sm">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium">{student.firstName} {student.lastName}</div>
                              <code className="text-[11px] text-muted-foreground">@{student.username}</code>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{student.userCode || "—"}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {student.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={student.status ? "default" : "secondary"}
                            className={student.status
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[11px]"
                              : "text-[11px]"
                            }
                          >
                            {student.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost" size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(student.publicId)}
                          >
                            <Trash2 className="h-4 w-4" />
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