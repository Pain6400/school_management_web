"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usersService, User, Role } from "@/lib/services/api.service";
import { useAuthStore } from "@/store/auth-store";
import {
  Loader2, Plus, Users, Search, AlertCircle, Shield,
  Building2, Key, CheckCircle2, Mail, Phone,
  UserCheck, DollarSign, Eye, EyeOff, ShieldCheck,
  GraduationCap, Copy, Check, Sparkles, UserPlus
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Los únicos 3 roles permitidos para creación por Administrador Escolar o Directora
const ALLOWED_STAFF_ROLES = ["ACCOUNTANT", "DIRECTOR", "ADMISSIONS_OFFICER"];

export default function SchoolStaffUsersPage() {
  const { user: currentUser } = useAuthStore();
  const schoolCode = currentUser?.schoolCode || "ESC002";

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Success modal
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    fullName: string;
    username: string;
    password: string;
    roleName: string;
    accountNumber: string;
    email: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    identityNumber: "",
    schoolCode: schoolCode,
    userCode: "",
    username: "",
    email: "",
    password: "Password123!",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    roleId: 7, // Default: ACCOUNTANT
  });

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.allSettled([
        usersService.getUsers(),
        usersService.getRoles(),
      ]);

      if (usersRes.status === "fulfilled" && usersRes.value.status && Array.isArray(usersRes.value.data)) {
        // Filtrar usuarios pertenecientes a la escuela actual y con roles de staff
        const schoolStaff = usersRes.value.data.filter((u) => {
          const belongsToSchool = !u.schoolCode || u.schoolCode === schoolCode;
          return belongsToSchool;
        });
        setUsers(schoolStaff);
      }

      if (rolesRes.status === "fulfilled" && rolesRes.value.status && Array.isArray(rolesRes.value.data)) {
        setRoles(rolesRes.value.data);
      }
    } catch (err) {
      console.error("Error loading staff data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [schoolCode]);

  // Roles estrictamente permitidos para la creación
  const staffRoleOptions = useMemo(() => {
    return roles.filter((r) => r.code && (ALLOWED_STAFF_ROLES as readonly string[]).includes(r.code));
  }, [roles]);

  // Al abrir el modal, asegurar valores limpios y autogenerar código
  const handleOpenCreateModal = () => {
    const randomCode = `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    const defaultRole = staffRoleOptions.find((r) => r.code === "ACCOUNTANT") || staffRoleOptions[0];

    setFormData({
      identityNumber: "",
      schoolCode: schoolCode,
      userCode: randomCode,
      username: "",
      email: "",
      password: "Password123!",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      roleId: defaultRole ? defaultRole.id : 7,
    });
    setError(null);
    setIsDialogOpen(true);
  };

  // Autogenerar usuario al tipear nombre y apellido
  const handleNameChange = (first: string, last: string) => {
    const cleanFirst = first.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLast = last.toLowerCase().replace(/[^a-z0-9]/g, "");
    let suggestedUsername = "";
    if (cleanFirst && cleanLast) {
      suggestedUsername = `${cleanFirst}.${cleanLast}`;
    } else if (cleanFirst) {
      suggestedUsername = cleanFirst;
    }
    setFormData((prev) => ({
      ...prev,
      firstName: first,
      lastName: last,
      username: prev.username && !prev.username.includes(".") ? prev.username : suggestedUsername,
      email: prev.email ? prev.email : (suggestedUsername ? `${suggestedUsername}@edusys.pro` : ""),
    }));
  };

  const selectedRoleObj = useMemo(() => {
    return staffRoleOptions.find((r) => r.id === formData.roleId) || null;
  }, [staffRoleOptions, formData.roleId]);

  // KPIs
  const kpis = useMemo(() => {
    let directors = 0;
    let accountants = 0;
    let admissions = 0;
    let admins = 0;

    users.forEach((u) => {
      const roleCodes = u.roles?.map((r) => r.code) || [];
      if (roleCodes.includes("DIRECTOR")) directors++;
      if (roleCodes.includes("ACCOUNTANT")) accountants++;
      if (roleCodes.includes("ADMISSIONS_OFFICER")) admissions++;
      if (roleCodes.includes("SCHOOL_ADMIN")) admins++;
    });

    return {
      total: users.length,
      directors,
      accountants,
      admissions,
      admins,
    };
  }, [users]);

  // Usuarios filtrados para la tabla
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return users.filter((u) => {
      // Filtrar por rol
      if (selectedRoleFilter !== "ALL") {
        const hasRole = u.roles?.some((r) => r.code === selectedRoleFilter || String(r.id) === selectedRoleFilter);
        if (!hasRole) return false;
      }

      if (!q) return true;

      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const username = (u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const dni = (u.identityNumber || "").toLowerCase();
      const userCode = (u.userCode || "").toLowerCase();

      return (
        fullName.includes(q) ||
        username.includes(q) ||
        email.includes(q) ||
        dni.includes(q) ||
        userCode.includes(q)
      );
    });
  }, [users, searchQuery, selectedRoleFilter]);

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("Por favor ingresa los nombres y apellidos del titular.");
      return;
    }
    if (!formData.identityNumber.trim()) {
      setError("Por favor ingresa el DNI o número de identidad.");
      return;
    }
    if (!formData.userCode.trim()) {
      setError("Por favor ingresa el número de cuenta.");
      return;
    }
    if (!formData.username.trim()) {
      setError("Por favor ingresa el nombre de usuario para inicio de sesión.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await usersService.createUser({
        ...formData,
        schoolCode: schoolCode,
        roleId: Number(formData.roleId),
      });

      if (res.status && res.data) {
        setIsDialogOpen(false);
        setCreatedUserCredentials({
          fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          username: formData.username,
          password: formData.password,
          roleName: selectedRoleObj?.name || "Staff",
          accountNumber: formData.userCode,
          email: formData.email,
        });
        setIsSuccessOpen(true);
        await fetchStaffData();
      } else {
        setError(res.message || "Error al crear usuario staff.");
      }
    } catch (err: any) {
      setError(err?.message || "Error de conexión con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getRoleBadge = (rolesArr?: Role[]) => {
    if (!rolesArr || rolesArr.length === 0) {
      return <Badge variant="outline" className="text-xs">Sin Rol</Badge>;
    }
    const r = rolesArr[0];
    if (r.code === "DIRECTOR") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Shield className="size-3" />
          Directora Institucional
        </span>
      );
    }
    if (r.code === "ACCOUNTANT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <DollarSign className="size-3" />
          Contador / Cajero (Finance)
        </span>
      );
    }
    if (r.code === "ADMISSIONS_OFFICER") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <UserPlus className="size-3" />
          Oficial de Admisiones
        </span>
      );
    }
    if (r.code === "SCHOOL_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <ShieldCheck className="size-3" />
          Administrador Escolar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
        {r.name || r.code}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Personal Administrativo (Staff)
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
              Sede {schoolCode}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Gestión y apertura de cuentas operativas para Directores, Cajeros/Contadores y Oficiales de Admisiones.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="h-11 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="size-4 text-lime-400" />
          <span>Nuevo Usuario Staff</span>
        </Button>
      </div>

      {/* KPIS DE EQUIPO STAFF */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Personal Staff Registrado</p>
                <p className="text-2xl font-black text-neutral-900 mt-1">{loading ? "..." : kpis.total}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-800">
                <Users className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Directores & Supervisión</p>
                <p className="text-2xl font-black text-purple-600 mt-1">{loading ? "..." : kpis.directors}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-900">
                <Shield className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Cajeros & Tesorería</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{loading ? "..." : kpis.accountants}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900">
                <DollarSign className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-500">Oficiales de Admisiones</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{loading ? "..." : kpis.admissions}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
                <UserPlus className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CARD CON BARRA DE FILTROS Y TABLA */}
      <Card className="rounded-3xl border-neutral-200/90 shadow-xs overflow-hidden bg-white">
        {/* BARRA DE BÚSQUEDA Y FILTRO */}
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, usuario, DNI, cuenta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs h-10 bg-white"
              />
            </div>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-800"
            >
              <option value="ALL">Todos los Roles Staff</option>
              {staffRoleOptions.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.name}
                </option>
              ))}
              <option value="SCHOOL_ADMIN">Administrador Escolar</option>
            </select>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Mostrando <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> colaboradores
          </div>
        </div>

        {/* TABLA DE PERSONAL STAFF */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando directorio de staff institucional...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
            <Users className="size-12 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No se encontraron usuarios staff</p>
            <p className="text-xs text-neutral-400 max-w-sm">
              Crea una cuenta para cajero/contador, director u oficial de admisiones usando el botón superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/80 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <TableRow>
                  <TableHead className="py-3 px-4">Colaborador / Titular</TableHead>
                  <TableHead className="py-3 px-4">Rol del Sistema</TableHead>
                  <TableHead className="py-3 px-4">Número de Cuenta</TableHead>
                  <TableHead className="py-3 px-4">Login & Contacto</TableHead>
                  <TableHead className="py-3 px-4">Teléfono</TableHead>
                  <TableHead className="py-3 px-4 text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-neutral-100 text-xs">
                {filteredUsers.map((u) => {
                  const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username;
                  return (
                    <TableRow key={u.publicId || u.username} className="hover:bg-neutral-50/60 transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-lime-100 text-lime-900 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{fullName}</p>
                            <p className="text-[11px] text-neutral-500 font-mono">DNI: {u.identityNumber || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        {getRoleBadge(u.roles)}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200/80">
                          {u.userCode || "N/A"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div>
                          <p className="font-mono text-xs font-bold text-neutral-900">@{u.username}</p>
                          <p className="text-[11px] text-neutral-500 truncate max-w-[200px]">{u.email || "Sin correo"}</p>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-neutral-700">
                        {u.phone ? (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Phone className="size-3 text-neutral-400" />
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">No registrado</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
                          <CheckCircle2 className="size-3 text-lime-600" />
                          Activo
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ============================================================== */}
      {/* MODAL: CREAR NUEVO USUARIO STAFF (SOLO LOS 3 ROLES PERMITIDOS) */}
      {/* ============================================================== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent size="lg">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-lime-100 text-lime-900 flex items-center justify-center shadow-2xs">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <DialogTitle>Crear Usuario Administrativo (Staff)</DialogTitle>
                  <DialogDescription>
                    Asigna una cuenta para Cajera/Contador, Directora u Oficial de Admisiones de la sede escolar.
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

              {/* SECCIÓN 1: ÁMBITO INSTITUCIONAL Y ROL (SOLO 3 ROLES) */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4">
                <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="size-4 text-lime-600" />
                  <span>1. Ámbito Institucional & Rol del Sistema</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ESCUELA FIJA DE LA SEDE */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Escuela / Sede Asignada <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={`${schoolCode} — Sede Institucional`}
                      disabled
                      className="h-11 rounded-xl bg-neutral-100 border-neutral-200 text-neutral-600 text-xs font-bold"
                    />
                  </div>

                  {/* SELECCIÓN EXCLUSIVA DE LOS 3 ROLES */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Rol Operativo Staff <span className="text-red-500">*</span>
                    </Label>
                    <select
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value, 10) })}
                      className="h-11 w-full rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-lime-500 cursor-pointer"
                    >
                      {staffRoleOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ALCANCE EXPLICATIVO DEL ROL */}
                {selectedRoleObj && (
                  <div className="p-3 rounded-xl bg-white border border-neutral-200/80 text-neutral-700 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-neutral-900">
                      <CheckCircle2 className="size-3.5 text-lime-600" />
                      <span>Alcance oficial: {selectedRoleObj.name}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                      {selectedRoleObj.description}
                    </p>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: DATOS DEL TITULAR */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="size-4 text-neutral-500" />
                  <span>2. Datos del Titular</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombres <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej. Roberto Carlos"
                      value={formData.firstName}
                      onChange={(e) => handleNameChange(e.target.value, formData.lastName)}
                      className="h-11 rounded-xl text-xs bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Apellidos <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej. Morales Rivas"
                      value={formData.lastName}
                      onChange={(e) => handleNameChange(formData.firstName, e.target.value)}
                      className="h-11 rounded-xl text-xs bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      DNI / Número de Identidad <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej. 0801-1990-12345"
                      value={formData.identityNumber}
                      onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                      className="h-11 rounded-xl text-xs bg-white font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Número de Cuenta <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej. USR-9237"
                      value={formData.userCode}
                      onChange={(e) => setFormData({ ...formData, userCode: e.target.value })}
                      className="h-11 rounded-xl text-xs bg-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">Teléfono</Label>
                    <Input
                      placeholder="Ej. +504 9988-7766"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11 rounded-xl text-xs bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">Dirección</Label>
                    <Input
                      placeholder="Ej. Colonia El Trapiche, Tegucigalpa"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="h-11 rounded-xl text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: CREDENCIALES DE INICIO DE SESIÓN */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Key className="size-4 text-lime-600" />
                  <span>3. Credenciales de Inicio de Sesión</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombre de Usuario (Login) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ej. roberto.morales"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                      className="h-11 rounded-xl text-xs bg-white font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="Ej. rmorales@escuela.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                      className="h-11 rounded-xl text-xs bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Contraseña Inicial <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 rounded-xl text-xs bg-white font-mono pr-20"
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-700"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, password: `Pass${Math.floor(1000 + Math.random() * 9000)}!` })}
                        className="h-7 px-2 text-[10px] font-bold rounded-lg border-neutral-200 hover:bg-neutral-100"
                      >
                        Generar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-neutral-100 p-4 bg-neutral-50/50 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-10 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar & Asignar Credenciales</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL DE ÉXITO: MOSTRAR CREDENCIALES AL ADMINISTRADOR          */}
      {/* ============================================================== */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-2xl bg-lime-100 text-lime-900 flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="size-6 text-lime-600" />
              </div>
              <div>
                <DialogTitle>¡Usuario Staff Creado Exitosamente!</DialogTitle>
                <DialogDescription>
                  Comparte estas credenciales oficiales con el colaborador para que inicie sesión.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Colaborador:</span>
                <span className="text-xs font-bold text-neutral-900">{createdUserCredentials?.fullName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Rol Asignado:</span>
                <span className="text-xs font-bold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-md">
                  {createdUserCredentials?.roleName}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Número de Cuenta:</span>
                <span className="text-xs font-mono font-bold text-neutral-900">{createdUserCredentials?.accountNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Usuario Login:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-neutral-900">{createdUserCredentials?.username}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdUserCredentials?.username || "", "user")}
                    className="h-6 w-6 p-0"
                  >
                    {copiedKey === "user" ? <Check className="size-3 text-lime-600" /> : <Copy className="size-3 text-neutral-400" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-semibold">Contraseña Inicial:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    {createdUserCredentials?.password}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdUserCredentials?.password || "", "pass")}
                    className="h-6 w-6 p-0"
                  >
                    {copiedKey === "pass" ? <Check className="size-3 text-lime-600" /> : <Copy className="size-3 text-neutral-400" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                const creds = `Credenciales de Acceso a EduSys:\nColaborador: ${createdUserCredentials?.fullName}\nRol: ${createdUserCredentials?.roleName}\nUsuario: ${createdUserCredentials?.username}\nContraseña: ${createdUserCredentials?.password}\nEnlace: http://localhost:3000/login`;
                copyToClipboard(creds, "all");
              }}
              className="w-full h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
            >
              {copiedKey === "all" ? (
                <>
                  <Check className="size-4 text-lime-400" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4 text-lime-400" />
                  <span>Copiar Todo el Mensaje de Bienvenida</span>
                </>
              )}
            </Button>
          </DialogBody>

          <DialogFooter className="p-4 bg-neutral-50/50 border-t border-neutral-100 flex justify-end">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="h-10 px-6 rounded-xl bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
