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
  UserCheck, Briefcase, GraduationCap, DollarSign, Eye,
  ArrowRight, ArrowLeft, School as SchoolIcon, ChevronRight
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
  // selectedSchoolFilter: "" means NO school selected yet (user must choose one)
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

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

  // Compute number of users per school
  const schoolUserCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const code = u.schoolCode || "GLOBAL";
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Selected school object metadata
  const selectedSchoolObj = useMemo(() => {
    if (!selectedSchoolFilter) return null;
    if (selectedSchoolFilter === "GLOBAL") {
      return {
        code: "GLOBAL",
        name: "Plataforma Central SaaS",
        address: "Administración global sin sede escolar",
        planCode: "SUPERADMIN",
      };
    }
    return schools.find((s) => s.code === selectedSchoolFilter) || null;
  }, [selectedSchoolFilter, schools]);

  // Users belonging to the selected school
  const schoolUsers = useMemo(() => {
    if (!selectedSchoolFilter) return [];
    return users.filter((u) => {
      if (selectedSchoolFilter === "GLOBAL") {
        return !u.schoolCode || u.schoolCode === "GLOBAL";
      }
      return u.schoolCode === selectedSchoolFilter;
    });
  }, [users, selectedSchoolFilter]);

  // Filtered Users for table (within selected school)
  const filteredUsers = useMemo(() => {
    if (!selectedSchoolFilter) return [];
    return schoolUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const matchSearch = !q ||
        fullName.includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.identityNumber && u.identityNumber.toLowerCase().includes(q)) ||
        (u.userCode && u.userCode.toLowerCase().includes(q));

      const matchRole = selectedRoleFilter === "ALL" || 
        (u.roles && u.roles.some((r) => r.code === selectedRoleFilter || String(r.id) === selectedRoleFilter));

      return matchSearch && matchRole;
    });
  }, [schoolUsers, searchQuery, selectedRoleFilter, selectedSchoolFilter]);

  // KPIs for the selected school
  const kpis = useMemo(() => {
    const total = schoolUsers.length;
    const admins = schoolUsers.filter((u) => u.roles?.some((r) => r.code === "SCHOOL_ADMIN" || r.code === "DIRECTOR")).length;
    const teachers = schoolUsers.filter((u) => u.roles?.some((r) => r.code === "TEACHER")).length;
    const financeAdmissions = schoolUsers.filter((u) => u.roles?.some((r) => r.code === "ACCOUNTANT" || r.code === "ADMISSIONS_OFFICER")).length;
    return { total, admins, teachers, financeAdmissions };
  }, [schoolUsers]);

  // Filtered Schools for the School Picker
  const filteredSchools = useMemo(() => {
    const q = schoolSearchQuery.toLowerCase().trim();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.planCode && s.planCode.toLowerCase().includes(q))
    );
  }, [schools, schoolSearchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const defaultSchool = (selectedSchoolFilter && selectedSchoolFilter !== "GLOBAL")
      ? selectedSchoolFilter
      : (schools[0]?.code || "ESC002");

    setFormData({
      ...INITIAL_FORM,
      schoolCode: defaultSchool,
      identityNumber: `0801-199${Math.floor(10 + Math.random() * 89)}-${rand}`,
      userCode: `USR-${rand}`,
      username: `user.${rand}`,
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
              Gestión de Usuarios por Escuela
            </h2>
            <Badge className="bg-lime-400 text-neutral-950 font-bold">Super Admin</Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Selecciona una institución educativa para consultar, gestionar o dar de alta cuentas de usuario y roles.
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

      {/* ============================================================== */}
      {/* VISTA 1: NINGUNA ESCUELA SELECCIONADA -> SELECTOR DE INSTITUCIÓN */}
      {/* ============================================================== */}
      {!selectedSchoolFilter ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* BANNER INFORMATIVO */}
          <div className="p-6 rounded-3xl bg-neutral-900 text-white relative overflow-hidden shadow-sm border border-neutral-800">
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 text-lime-400 text-xs font-bold border border-lime-400/30">
                <Building2 className="size-3.5" />
                <span>Paso 1: Selecciona una Institución Educativa</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                ¿Qué escuela deseas consultar?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Para garantizar la privacidad y mantener aisladas las cuentas de cada cliente, elige una sede a continuación para cargar su directorio de usuarios.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
              <SchoolIcon className="size-64 text-lime-400" />
            </div>
          </div>

          {/* BUSCADOR DE ESCUELAS */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Filtrar por código o nombre de institución..."
                value={schoolSearchQuery}
                onChange={(e) => setSchoolSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl text-xs h-11 bg-white border-neutral-200 shadow-2xs"
              />
            </div>
            <div className="text-xs text-neutral-500 font-semibold self-end sm:self-center">
              {filteredSchools.length} {filteredSchools.length === 1 ? "institución encontrada" : "instituciones encontradas"}
            </div>
          </div>

          {/* GRID DE ESCUELAS DISPONIBLES */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <Loader2 className="size-8 animate-spin text-neutral-900" />
              <p className="text-xs text-neutral-500 font-medium">Cargando catálogo de escuelas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map((s) => {
                const count = schoolUserCounts[s.code] || 0;
                return (
                  <Card
                    key={s.code}
                    onClick={() => {
                      setSelectedSchoolFilter(s.code);
                      setSearchQuery("");
                      setSelectedRoleFilter("ALL");
                    }}
                    className="group rounded-3xl border border-neutral-200/90 hover:border-lime-500/80 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden bg-white hover:bg-neutral-50/50"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-3">
                        {/* HEADER DE LA CARD */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-neutral-950 text-lime-400 border border-neutral-800">
                            {s.code}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold ${s.status ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-neutral-500"}`}
                          >
                            {s.status ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>

                        {/* NOMBRE & DIRECCIÓN */}
                        <div>
                          <h4 className="text-base font-black text-neutral-900 group-hover:text-lime-600 transition-colors line-clamp-1">
                            {s.name}
                          </h4>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                            {s.address || s.email || "Sede educativa registrada"}
                          </p>
                        </div>
                      </div>

                      {/* FOOTER DE LA CARD CON CONTEO Y BOTÓN */}
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                          <Users className="size-3.5 text-neutral-400" />
                          <span>{count} {count === 1 ? "usuario" : "usuarios"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-lime-600 group-hover:translate-x-1 transition-transform">
                          <span>Ver Usuarios</span>
                          <ArrowRight className="size-3.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* CARD ADICIONAL: SUPER ADMINISTRADORES GLOBALES */}
              <Card
                onClick={() => {
                  setSelectedSchoolFilter("GLOBAL");
                  setSearchQuery("");
                  setSelectedRoleFilter("ALL");
                }}
                className="group rounded-3xl border border-dashed border-neutral-300 hover:border-neutral-900 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden bg-neutral-50 hover:bg-white"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-lime-400 text-neutral-950">
                        GLOBAL SaaS
                      </span>
                      <Badge className="bg-neutral-900 text-white text-[10px] font-bold">
                        Super Admin
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-neutral-900 group-hover:text-neutral-700 transition-colors">
                        Plataforma SaaS Central
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Usuarios y creadores con privilegios globales (sin sede escolar).
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                      <Shield className="size-3.5 text-neutral-500" />
                      <span>{schoolUserCounts["GLOBAL"] || 0} cuentas globales</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-neutral-900 group-hover:translate-x-1 transition-transform">
                      <span>Ver Cuentas</span>
                      <ArrowRight className="size-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* VISTA 2: ESCUELA SELECCIONADA -> KPIS Y TABLA DE ESA ESCUELA   */
        /* ============================================================== */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* BARRA SUPERIOR DE ESCUELA ACTIVA CON CAMBIO RÁPIDO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-neutral-900 text-white shadow-sm border border-neutral-800">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSchoolFilter("")}
                className="size-9 p-0 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
                title="Volver a la selección de escuelas"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-lime-400 text-neutral-950">
                    {selectedSchoolObj?.code || selectedSchoolFilter}
                  </span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white line-clamp-1">
                    {selectedSchoolObj?.name || "Institución Educativa"}
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Viendo los usuarios, credenciales y roles asignados a esta sede.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* SELECTOR RÁPIDO DE CAMBIO DE SEDE */}
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="h-9 rounded-xl border border-neutral-700 bg-neutral-800 px-3 text-xs font-bold text-neutral-100 focus:outline-none focus:ring-1 focus:ring-lime-400"
              >
                <option value="" disabled>-- Cambiar Escuela --</option>
                {schools.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
                <option value="GLOBAL">GLOBAL — Plataforma SaaS</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSchoolFilter("")}
                className="h-9 rounded-xl bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white text-xs font-bold cursor-pointer"
              >
                Todas las Escuelas
              </Button>
            </div>
          </div>

          {/* KPIS ESPECÍFICOS DE LA ESCUELA SELECCIONADA */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-neutral-200/90 shadow-2xs">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-500">Usuarios en Sede</p>
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
                    <p className="text-xs font-bold text-neutral-500">Administración & Dirección</p>
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
                Mostrando <strong>{filteredUsers.length}</strong> de <strong>{schoolUsers.length}</strong> usuarios en esta sede
              </div>
            </div>

            {/* TABLE */}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-2">
                <Loader2 className="size-8 animate-spin text-neutral-900" />
                <p className="text-xs text-neutral-500 font-medium">Cargando directorio de usuarios...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
                <Users className="size-12 text-neutral-300 stroke-1" />
                <p className="text-sm font-bold text-neutral-800">
                  {schoolUsers.length === 0
                    ? `No hay usuarios registrados en ${selectedSchoolObj?.name || selectedSchoolFilter}`
                    : "No se encontraron usuarios con los filtros aplicados"}
                </p>
                <p className="text-xs text-neutral-400 max-w-sm">
                  {schoolUsers.length === 0
                    ? "Puedes crear el primer administrador o docente para esta institución haciendo clic en el botón inferior."
                    : "Prueba cambiando el rol o el texto de búsqueda."}
                </p>
                {schoolUsers.length === 0 && (
                  <Button
                    onClick={handleOpenCreate}
                    size="sm"
                    className="mt-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-2 cursor-pointer"
                  >
                    <Plus className="size-4 text-lime-400" />
                    <span>Crear Usuario para {selectedSchoolFilter}</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-neutral-50/80 border-b border-neutral-100">
                    <TableRow>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Usuario & Nombre</TableHead>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">DNI & Nº Cuenta</TableHead>
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
        </div>
      )}

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
                      Número de Cuenta <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.userCode}
                      onChange={(e) => setFormData({ ...formData, userCode: e.target.value.toUpperCase() })}
                      placeholder="Ej. 2026-0042 o ADM-002"
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
