"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usersService, User } from "@/lib/services/api.service";
import { Loader2, Plus, Trash2, Users, Mail, IdCard } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_FORM = {
  identityNumber: "",
  schoolCode: "ESC001",
  userCode: "",
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  roleId: 3, // TEACHER role
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await usersService.getUsers();
      if (res.status) {
        // Filter only users with teacher role if roles info is present
        const data = res.data.filter((u) =>
          !u.roles || u.roles.some((r) => r.name === "TEACHER") || u.roles.length === 0
        );
        setTeachers(res.data);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      const { roleId, ...userData } = formData;
      const res = await usersService.createUser(userData);
      if (res.status) {
        // Assign teacher role
        try {
          await usersService.assignRole(res.data.publicId, roleId);
        } catch (roleErr) {
          console.warn("No se pudo asignar el rol:", roleErr);
        }
        setIsDialogOpen(false);
        setFormData(INITIAL_FORM);
        fetchTeachers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el maestro");
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este maestro?")) return;
    try { await usersService.deleteUser(id); fetchTeachers(); } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maestros</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona el personal docente de la institución.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setError(null); }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Agregar Maestro</Button>} />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Maestro</DialogTitle>
              <DialogDescription>
                Se creará el usuario con rol de Maestro automáticamente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre <span className="text-destructive">*</span></Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido <span className="text-destructive">*</span></Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico <span className="text-destructive">*</span></Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="identityNumber">Documento de Identidad</Label>
                  <Input id="identityNumber" name="identityNumber" value={formData.identityNumber} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario <span className="text-destructive">*</span></Label>
                  <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña <span className="text-destructive">*</span></Label>
                  <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userCode">Código de Empleado <span className="text-destructive">*</span></Label>
                <Input id="userCode" name="userCode" placeholder="Ej: EMP-001" value={formData.userCode} onChange={handleChange} required />
              </div>
              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar Maestro"}
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
            <CardTitle className="text-sm font-medium">Total Maestros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">Personal docente registrado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter((t) => t.status).length}</div>
            <p className="text-xs text-muted-foreground">Con cuenta habilitada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter((t) => !t.status).length}</div>
            <p className="text-xs text-muted-foreground">Con cuenta deshabilitada</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Personal Docente</CardTitle>
          <CardDescription>Visualiza y administra a los maestros de la escuela.</CardDescription>
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
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Código Empleado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="size-10 stroke-1 text-muted-foreground/40" />
                          <p className="font-medium">No hay maestros registrados.</p>
                          <p className="text-xs">Usa el botón "Agregar Maestro" para comenzar.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    teachers.map((teacher) => (
                      <TableRow key={teacher.publicId} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                              {teacher.phone && (
                                <div className="text-xs text-muted-foreground">{teacher.phone}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            @{teacher.username}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {teacher.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                            {teacher.userCode || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={teacher.status ? "default" : "secondary"}
                            className={teacher.status
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[11px]"
                              : "text-[11px]"
                            }
                          >
                            {teacher.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost" size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(teacher.publicId)}
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