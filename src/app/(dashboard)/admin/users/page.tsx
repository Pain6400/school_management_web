"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usersService, User, Role } from "@/lib/services/api.service";
import { schoolsService, School } from "@/lib/services/schools.service";
import {
  Loader2, Plus, Trash2, Users, Search, AlertCircle, Shield,
  Building2, Key, CheckCircle2, RefreshCw, Mail, Phone,
  UserCheck, Briefcase, GraduationCap, DollarSign, Eye
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_FORM = {
  identityNumber: "",
  schoolCode: "ESC002",
  userCode: "",
  username: "",
  email: "",
  password: "Password123!",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  roleId: 2, // Default: SCHOOL_ADMIN
};

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersRes, schoolsRes, rolesRes] = await Promise.allSettled([
        usersService.getUsers(),
        schoolsService.getSchools(),
        usersService.getRoles(),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value.status && Array.isArray(usersRes.value.data)) {
        setUsers(usersRes.value.data);
      }
      if (schoolsRes.status === "fulfilled" && schoolsRes.value.status && Array.isArray(schoolsRes.value.data)) {
        setSchools(schoolsRes.value.data);
        if (schoolsRes.value.data.length > 0 && !formData.schoolCode) {
          setFormData((prev) => ({ ...prev, schoolCode: schoolsRes.value.data[0].code }));
        }
      }
      if (rolesRes.status === "fulfilled" && rolesRes.value.status && Array.isArray(rolesRes.value.data)) {
        setRoles(rolesRes.value.data);
      }
    } catch (err) {
      console.error("Error loading users data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const matchSearch = !q ||
        fullName.includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.identityNumber && u.identityNumber.toLowerCase().includes(q)) ||
        (u.userCode && u.userCode.toLowerCase().includes(q));

      const matchSchool = selectedSchoolFilter === "ALL" || 
        (selectedSchoolFilter === "GLOBAL" ? !u.schoolCode || u.schoolCode === "GLOBAL" : u.schoolCode === selectedSchoolFilter);

      const matchRole = selectedRoleFilter === "ALL" || 
        (u.roles && u.roles.some((r) => r.code === selectedRoleFilter || String(r.id) === selectedRoleFilter));

      return matchSearch && matchSchool && matchRole;
    });
  }, [users, searchQuery, selectedSchoolFilter, selectedRoleFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.roles?.some((r) => r.code === "SCHOOL_ADMIN" || r.code === "DIRECTOR")).length;
    const teachers = users.filter((u) => u.roles?.some((r) => r.code === "TEACHER")).length;
    const financeAdmissions = users.filter((u) => u.roles?.some((r) => r.code === "ACCOUNTANT" || r.code === "ADMISSIONS_OFFICER")).length;
    return { total, admins, teachers, financeAdmissions };
  }, [users]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      ...INITIAL_FORM,
      schoolCode: schools[0]?.code || "ESC002",
      identityNumber: `0801-199${Math.floor(10 + Math.random() * 89)}-${rand}`,
      userCode: `USR-${rand}`,
      username: `admin.user${rand}`,
      roleId: 2, // SCHOOL_ADMIN
    });
    setError(null);
    setSuccessMessage(null);
    setIsDialogOpen(true);
  };

  // Submit User Creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      setIsSubmitting(true);
      const res = await usersService.createUser({
        ...formData,
        roleId: Number(formData.roleId),
      });

      if (res.status && res.data) {
        setIsDialogOpen(false);
        fetchAllData();
      } else {
        setError(res.message || "Error al crear el usuario");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User
  const handleDelete = async (publicId: string, username: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) return;
    try {
      await usersService.deleteUser(publicId);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (roleCode: string) => {
    switch (roleCode) {
      case "SUPER_ADMIN":
        return <Badge className="bg-neutral-950 text-lime-400 font-bold border border-lime-400/40">Super Admin</Badge>;
      case "SCHOOL_ADMIN":
        return <Badge className="bg-lime-400 text-neutral-950 font-bold">Admin Escolar</Badge>;
      case "DIRECTOR":
        return <Badge className="bg-blue-100 text-blue-900 font-bold">Directora</Badge>;
      case "ACCOUNTANT":
        return <Badge className="bg-amber-400 text-neutral-950 font-bold">Cajero / Finanzas</Badge>;
      case "ADMISSIONS_OFFICER":
        return <Badge className="bg-cyan-100 text-cyan-900 font-bold">Admisiones</Badge>;
      case "TEACHER":
        return <Badge className="bg-purple-100 text-purple-900 font-bold">Docente</Badge>;
      case "STUDENT":
        return <Badge className="bg-emerald-100 text-emerald-900 font-bold">Estudiante</Badge>;
      case "PARENT":
        return <Badge className="bg-orange-100 text-orange-900 font-bold">Padre / Tutor</Badge>;
      default:
        return <Badge variant="outline">{roleCode}</Badge>;
    }
  };

  const selectedRoleObj = roles.find((r) => r.id === Number(formData.roleId));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Gestión Global de Usuarios & Roles
            </h2>
            <Badge className="bg-lime-400 text-neutral-950 font-bold">Super Admin</Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Crea cuentas de acceso para cualquier institución cliente y asigna el rol que corresponda (Administrador Escolar, Directora, Cajero, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={loading}
            className="rounded-xl text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
          <Button 
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl px-4 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="size-4 text-lime-400" />
            <span>Crear Usuario</span>
          </Button>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Total Usuarios</p>
                <p className="text-2xl font-black text-neutral-900 mt-1">{loading ? "..." : kpis.total}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-900">
                <Users className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Administradores & Dirección</p>
                <p className="text-2xl font-black text-lime-600 mt-1">{loading ? "..." : kpis.admins}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-lime-100 text-lime-900">
                <Shield className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Cuerpo Docente</p>
                <p className="text-2xl font-black text-purple-600 mt-1">{loading ? "..." : kpis.teachers}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-900">
                <Briefcase className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Caja & Admisiones</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{loading ? "..." : kpis.financeAdmissions}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
                <DollarSign className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & TABLE CARD */}
      <Card className="rounded-3xl border-neutral-200/90 shadow-xs overflow-hidden">
        {/* FILTERS TOOLBAR */}
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, usuario, email, DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs h-10 bg-white"
              />
            </div>

            {/* FILTRO SEDE */}
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-800"
            >
              <option value="ALL">Todas las Sedes / Escuelas</option>
              {schools.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
              <option value="GLOBAL">Global SaaS (Sin escuela)</option>
            </select>

            {/* FILTRO ROL */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-800"
            >
              <option value="ALL">Todos los Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.code || String(r.id)}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-neutral-500 font-medium whitespace-nowrap">
            Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuarios
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando directorio de usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-2">
            <Users className="size-12 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No se encontraron usuarios</p>
            <p className="text-xs text-neutral-400">Prueba ajustando los filtros de sede, rol o texto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/80 border-b border-neutral-100">
                <TableRow>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Usuario & Nombre</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">DNI & Código</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Sede / Escuela</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Rol Oficial</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Contacto</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estado</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.publicId} className="hover:bg-neutral-50/80 transition-colors">
                    {/* USUARIO & NOMBRE */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-neutral-100 border border-neutral-200/80 flex items-center justify-center font-bold text-xs text-neutral-800 shrink-0 uppercase">
                          {u.firstName ? u.firstName.charAt(0) : u.username.charAt(0)}
                          {u.lastName ? u.lastName.charAt(0) : ""}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-neutral-900 leading-tight">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] font-mono font-medium text-neutral-500 mt-0.5">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* DNI & CODIGO */}
                    <TableCell className="py-3.5 font-mono text-xs text-neutral-600">
                      <div>{u.identityNumber || "—"}</div>
                      <div className="text-[10px] text-neutral-400">{u.userCode || "—"}</div>
                    </TableCell>

                    {/* SEDE / ESCUELA */}
                    <TableCell className="py-3.5">
                      {u.schoolCode ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                          <Building2 className="size-3 text-neutral-500" />
                          {u.schoolCode}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-lime-900 bg-lime-100 px-2 py-0.5 rounded-md border border-lime-300">
                          GLOBAL SaaS
                        </span>
                      )}
                    </TableCell>

                    {/* ROL OFICIAL */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <span key={r.id}>
                              {getRoleBadge(r.code || "")}
                            </span>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-neutral-400">Sin Rol</Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* CONTACTO */}
                    <TableCell className="py-3.5 text-xs text-neutral-600">
                      <div>{u.email}</div>
                      {u.phone && <div className="text-[11px] text-neutral-400">{u.phone}</div>}
                    </TableCell>

                    {/* ESTADO */}
                    <TableCell className="py-3.5">
                      {u.status ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">
                          Inactivo
                        </span>
                      )}
                    </TableCell>

                    {/* ACCIONES */}
                    <TableCell className="py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        onClick={() => handleDelete(u.publicId, u.username)}
                        title="Eliminar usuario"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ============================================================== */}
      {/* MODAL: CREAR NUEVO USUARIO CON SELECCIÓN DE ESCUELA Y ROL     */}
      {/* ============================================================== */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}
      >
        <DialogContent size="lg">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-lime-100 text-lime-900 flex items-center justify-center">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <DialogTitle>Crear Nuevo Usuario en la Plataforma</DialogTitle>
                  <DialogDescription>
                    Asigna la escuela cliente y el rol oficial que tendrá el usuario (Administrador Escolar, Docente, Cajero, etc.).
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECCIÓN 1: ASIGNACIÓN DE SEDE Y ROL */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4">
                <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="size-4 text-lime-600" />
                  <span>1. Ámbito Institucional & Rol del Sistema</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SELECCIÓN DE ESCUELA */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Escuela / Sede Asignada <span className="text-red-500">*</span>
                    </Label>
                    <select
                      value={formData.schoolCode}
                      onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                      className="h-11 w-full rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-semibold text-neutral-900"
                    >
                      {schools.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SELECCIÓN DE ROL */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Rol del Sistema <span className="text-red-500">*</span>
                    </Label>
                    <select
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value, 10) })}
                      className="h-11 w-full rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-semibold text-neutral-900"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DESCRIPCIÓN DEL ROL SELECCIONADO */}
                {selectedRoleObj && (
                  <div className="p-3 rounded-xl bg-white border border-neutral-200/80 text-xs text-neutral-600">
                    <div className="font-bold text-neutral-900 mb-0.5 flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-lime-600" />
                      <span>Alcance de {selectedRoleObj.name}:</span>
                    </div>
                    <p className="leading-relaxed text-[11px] text-neutral-500">
                      {selectedRoleObj.description}
                    </p>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: DATOS PERSONALES */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="size-4 text-neutral-600" />
                  <span>2. Datos del Titular</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombres <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Ej. Roberto Carlos"
                      required
                      className="h-11 rounded-xl text-xs px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Ej. Vásquez Reyes"
                      required
                      className="h-11 rounded-xl text-xs px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      DNI / Número de Identidad <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.identityNumber}
                      onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                      placeholder="0801-1990-12345"
                      required
                      className="h-11 rounded-xl text-xs px-4 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Código de Usuario <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.userCode}
                      onChange={(e) => setFormData({ ...formData, userCode: e.target.value.toUpperCase() })}
                      placeholder="Ej. ADM-002"
                      required
                      className="h-11 rounded-xl text-xs px-4 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Teléfono
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+504 9988-7766"
                      className="h-11 rounded-xl text-xs px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Dirección
                    </Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Col. El Prado, Bloque 4"
                      className="h-11 rounded-xl text-xs px-4"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: CREDENCIALES DE ACCESO */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Key className="size-4 text-neutral-600" />
                  <span>3. Credenciales de Inicio de Sesión</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombre de Usuario (Login) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                      placeholder="admin.colegio"
                      required
                      className="h-11 rounded-xl text-xs px-4 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@colegio.edu"
                      required
                      className="h-11 rounded-xl text-xs px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Contraseña Inicial <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11 rounded-xl text-xs px-4 font-mono"
                    />
                  </div>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" /> Creando Usuario...</>
                ) : (
                  "Guardar & Asignar Credenciales"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
