"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { schoolsService, School } from "@/lib/services/schools.service";
import {
  Loader2, Plus, Trash2, Building2, Search, AlertCircle, Edit, MoreVertical
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_FORM = {
  code: "",
  planCode: "BASIC",
  name: "",
  email: "",
  phone: "",
  address: "",
  status: true,
};

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await schoolsService.getSchools();
      if (res.status && Array.isArray(res.data)) {
        setSchools(res.data);
      }
    } catch (err) {
      console.error("Error loading schools:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      return !q || 
        s.name.toLowerCase().includes(q) || 
        s.code.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q));
    });
  }, [schools, searchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOpenCreate = () => {
    setEditingCode(null);
    setFormData(INITIAL_FORM);
    setError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingCode(school.code);
    setFormData({
      code: school.code,
      planCode: school.planCode || "BASIC",
      name: school.name,
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      status: school.status !== undefined ? school.status : true,
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSubmitting(true);
      let res;
      if (editingCode) {
        res = await schoolsService.updateSchool(editingCode, formData);
      } else {
        res = await schoolsService.createSchool(formData);
      }
      
      if (res.status) {
        setIsDialogOpen(false);
        fetchSchools();
      } else {
        setError(res.message || "Error al procesar la solicitud");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`¿Estás seguro de eliminar la escuela ${code}?`)) return;
    try {
      await schoolsService.deleteSchool(code);
      fetchSchools();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Gestión de Instituciones (Tenants)
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Administra las escuelas cliente, sus planes y accesos en la plataforma.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="size-4 text-lime-400" />
          <span>Nueva Escuela</span>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}>
        <DialogContent size="lg">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingCode ? "Editar Escuela" : "Registrar Nueva Escuela"}</DialogTitle>
              <DialogDescription>
                {editingCode ? "Modifica los datos de la institución." : "Ingresa la información para dar de alta una nueva escuela en el sistema."}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Código Interno <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="code" placeholder="Ej. ESC002"
                    value={formData.code}
                    onChange={handleChange}
                    disabled={!!editingCode}
                    required className="h-11 rounded-xl text-sm px-4 uppercase"
                  />
                  {!editingCode && <p className="text-[10px] text-neutral-400">Identificador único (sin espacios)</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Nombre de la Institución <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="name" placeholder="Ej. Colegio Bilingüe San Juan"
                    value={formData.name}
                    onChange={handleChange}
                    required className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Correo Principal
                  </Label>
                  <Input
                    name="email" type="email" placeholder="admin@sanjuan.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Teléfono
                  </Label>
                  <Input
                    name="phone" placeholder="+123456789"
                    value={formData.phone}
                    onChange={handleChange} className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Dirección Física
                  </Label>
                  <Input
                    name="address" placeholder="Av. Principal #123, Ciudad"
                    value={formData.address}
                    onChange={handleChange} className="h-11 rounded-xl text-sm px-4"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Plan de Suscripción <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="planCode" placeholder="Ej. BASIC o PREMIUM"
                    value={formData.planCode}
                    onChange={handleChange}
                    required className="h-11 rounded-xl text-sm px-4 uppercase"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsDialogOpen(false); setFormData(INITIAL_FORM); setError(null); }}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" />Guardando...</>
                ) : (
                  editingCode ? "Actualizar Escuela" : "Crear Escuela"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-xs h-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando escuelas...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
            <Building2 className="size-12 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No hay instituciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/70 border-b border-neutral-100">
                <TableRow>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Código</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Institución</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Plan</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Contacto</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estado</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.code} className="hover:bg-neutral-50/80 transition-colors">
                    <TableCell className="py-3">
                      <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md">
                        {school.code}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 font-semibold text-neutral-900">
                      {school.name}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {school.planCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-neutral-500">
                      {school.email || "—"}<br/>
                      {school.phone || "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      {school.status ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="size-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
                          onClick={() => handleOpenEdit(school)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="size-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() => handleDelete(school.code)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
