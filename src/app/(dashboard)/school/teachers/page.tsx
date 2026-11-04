"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usersService, User, Role } from "@/lib/services/api.service";
import { academicsService, Course, Class, Grade } from "@/lib/services/academics.service";
import { useAuthStore } from "@/store/auth-store";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2, Plus, Trash2, Users, Mail, Search,
  Phone, BookOpen, AlertCircle, Filter, RotateCcw,
  CheckCircle2, Layers, Briefcase, Key, UserCheck,
  Calendar, Eye, EyeOff, ShieldCheck, MapPin, Clock, ExternalLink,
  GraduationCap, Copy, Check, Shield,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogBody, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_FORM = {
  identityNumber: "",
  schoolCode: "ESC001",
  userCode: "",
  username: "",
  email: "",
  password: "Password123!",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  roleId: 3, // TEACHER role
};

export default function TeachersPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = !!user?.roles?.includes("SUPER_ADMIN");
  const schoolCode = user?.schoolCode;
  const [teachers, setTeachers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacherWorkload, setSelectedTeacherWorkload] = useState<User | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("ALL");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [createdTeacherCredentials, setCreatedTeacherCredentials] = useState<{
    fullName: string;
    username: string;
    password: string;
    roleName: string;
    accountNumber: string;
    email: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    if (schoolCode) {
      setFormData((prev) => ({ ...prev, schoolCode }));
    }
  }, [schoolCode]);

  const extractData = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const targetSchool = isSuperAdmin ? undefined : schoolCode;
      const [usersRes, coursesRes, classesRes, gradesRes, rolesRes] = await Promise.allSettled([
        usersService.getTeachers(targetSchool),
        academicsService.getCourses(),
        academicsService.getClasses(),
        academicsService.getGrades(),
        usersService.getRoles(),
      ]);

      if (usersRes.status === "fulfilled") {
        const rawTeachers = extractData(usersRes.value);
        const filteredTeachers = (!isSuperAdmin && targetSchool)
          ? rawTeachers.filter((t: User) => t.schoolCode === targetSchool)
          : rawTeachers;
        setTeachers(filteredTeachers);
      }
      if (coursesRes.status === "fulfilled") {
        setCourses(extractData(coursesRes.value));
      }
      if (classesRes.status === "fulfilled") {
        setClasses(extractData(classesRes.value));
      }
      if (gradesRes.status === "fulfilled") {
        setGrades(extractData(gradesRes.value));
      }
      if (rolesRes.status === "fulfilled" && rolesRes.value && Array.isArray((rolesRes.value as any).data)) {
        setRoles((rolesRes.value as any).data);
      }
    } catch (err) {
      console.error("Error loading teachers data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [schoolCode, isSuperAdmin]);

  // Map of teacherId -> classes array
  const teacherClassesMap = useMemo(() => {
    const map: Record<string, Class[]> = {};
    classes.forEach((c) => {
      if (c.teacherId) {
        if (!map[c.teacherId]) map[c.teacherId] = [];
        map[c.teacherId].push(c);
      }
    });
    return map;
  }, [classes]);

  // Options for Course/Subject Filter
  const courseFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todas las Materias / Cursos" },
      ...courses.map((c) => ({
        value: c.code,
        label: c.name,
        badge: c.code,
      })),
    ];
  }, [courses]);

  // Options for Grade Filter
  const gradeFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todos los Grados" },
      ...grades.map((g) => ({
        value: g.code,
        label: g.name,
        badge: g.code,
      })),
    ];
  }, [grades]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      // 1. Text Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.username?.toLowerCase().includes(q) ||
        t.identityNumber?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const teacherClasses = teacherClassesMap[t.publicId] || [];

      // 2. Course Filter
      if (filterCourse !== "ALL") {
        const teachesCourse = teacherClasses.some((c) => c.courseCode === filterCourse);
        if (!teachesCourse) return false;
      }

      // 3. Grade Filter
      if (filterGrade !== "ALL") {
        const teachesGrade = teacherClasses.some((c) => c.gradeCode === filterGrade);
        if (!teachesGrade) return false;
      }

      // 4. Status Filter
      if (filterStatus === "ASSIGNED" && teacherClasses.length === 0) return false;
      if (filterStatus === "UNASSIGNED" && teacherClasses.length > 0) return false;

      return true;
    });
  }, [teachers, searchQuery, filterCourse, filterGrade, filterStatus, teacherClassesMap]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterCourse("ALL");
    setFilterGrade("ALL");
    setFilterStatus("ALL");
  };

  const hasActiveFilters = searchQuery !== "" || filterCourse !== "ALL" || filterGrade !== "ALL" || filterStatus !== "ALL";

  const teacherRoleId = useMemo(() => {
    const r = roles.find((role) => role.code === "TEACHER");
    return r ? r.id : 3;
  }, [roles]);

  const handleOpenCreateModal = () => {
    const randomCode = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      identityNumber: "",
      schoolCode: schoolCode || "ESC001",
      userCode: randomCode,
      username: "",
      email: "",
      password: "Password123!",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      roleId: teacherRoleId,
    });
    setError(null);
    setShowPassword(false);
    setIsDialogOpen(true);
  };

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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
      const targetSchool = schoolCode || formData.schoolCode || "ESC001";
      const res = await usersService.createUser({
        ...formData,
        schoolCode: targetSchool,
        roleId: Number(teacherRoleId),
      });

      if (res.status && res.data) {
        setIsDialogOpen(false);
        setCreatedTeacherCredentials({
          fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          username: formData.username,
          password: formData.password,
          roleName: "Docente Titular",
          accountNumber: formData.userCode,
          email: formData.email,
        });
        setIsSuccessOpen(true);
        await fetchAllData();
      } else {
        setError(res.message || "Error al crear el docente.");
      }
    } catch (err: any) {
      setError(err?.message || "Error al registrar al docente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("¿Eliminar este profesor?")) return;
    try {
      await usersService.deleteUser(publicId);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Cuerpo Docente
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Administra a los profesores, materias asignadas y horarios de clase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/school/teachers/applications">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              <Briefcase className="size-3.5 text-lime-600" />
              <span>Bolsa de Empleo</span>
              <Badge variant="outline" className="bg-lime-50 text-lime-800 border-lime-300 text-[9px] py-0 px-1 font-bold">
                Staff
              </Badge>
            </Button>
          </Link>

        {/* BOTÓN NUEVO MAESTRO */}
        <Button
          onClick={handleOpenCreateModal}
          className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="size-4 text-lime-400" />
          <span>Nuevo Maestro</span>
        </Button>

        {/* MODAL CREAR MAESTRO */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent size="lg">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-xl bg-lime-100 text-lime-900 flex items-center justify-center shadow-2xs">
                    <GraduationCap className="size-5 text-lime-700" />
                  </div>
                  <div>
                    <DialogTitle>Registrar Nuevo Docente</DialogTitle>
                    <DialogDescription>
                      Crea la cuenta de usuario del profesor y asigna sus credenciales de acceso institucional.
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

                {/* SECCIÓN 1: ÁMBITO INSTITUCIONAL Y ROL DOCENTE */}
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
                        value={`${schoolCode || formData.schoolCode || "ESC001"} — Sede Institucional`}
                        disabled
                        className="h-11 rounded-xl bg-neutral-100 border-neutral-200 text-neutral-600 text-xs font-bold"
                      />
                    </div>

                    {/* ROL DOCENTE */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-neutral-700">
                        Rol Operativo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value="Docente Titular (Profesor)"
                        disabled
                        className="h-11 rounded-xl bg-neutral-100 border-neutral-200 text-neutral-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-neutral-200/80 text-neutral-700 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-neutral-900">
                      <CheckCircle2 className="size-3.5 text-lime-600" />
                      <span>Alcance oficial: Docente Titular</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                      Gestión académica de materias asignadas, pase de asistencia, asignación de tareas, publicación de calificaciones y registro de observaciones.
                    </p>
                  </div>
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
                        placeholder="Ej. DOC-9237"
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
                          className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, password: `Doc${Math.floor(1000 + Math.random() * 9000)}!` })}
                          className="h-7 px-2 text-[10px] font-bold rounded-lg border-neutral-200 hover:bg-neutral-100 cursor-pointer"
                        >
                          Generar
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      El docente utilizará esta contraseña provisional para su primer acceso al sistema escolar.
                    </p>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="border-t border-neutral-100 p-4 bg-neutral-50/50 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-10 rounded-xl text-xs font-semibold cursor-pointer"
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
                      <span>Guardando Docente...</span>
                    </>
                  ) : (
                    <span>Guardar Maestro & Asignar Credenciales</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Maestros</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Users className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{teachers.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Docentes en plantilla</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Con Asignación</span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">
            {Object.keys(teacherClassesMap).length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Profesores con clases activas</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Resultados Filtrados</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Search className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">{filteredTeachers.length}</div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Coinciden con los filtros</p>
        </Card>
      </div>

      {/* ADVANCED FILTERS BAR */}
      <Card className="p-5 overflow-visible relative z-20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900">Filtros de Docentes</h3>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Text Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, email o cédula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs h-10"
              />
            </div>

            {/* Course Filter */}
            <div className="w-full">
              <Combobox
                options={courseFilterOptions}
                value={filterCourse}
                onChange={(val) => setFilterCourse(val || "ALL")}
                placeholder="Materia / Curso"
                searchPlaceholder="Buscar materia..."
              />
            </div>

            {/* Grade Filter */}
            <div className="w-full">
              <Combobox
                options={gradeFilterOptions}
                value={filterGrade}
                onChange={(val) => setFilterGrade(val || "ALL")}
                placeholder="Grado asignado"
                searchPlaceholder="Buscar grado..."
              />
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <Combobox
                options={[
                  { value: "ALL", label: "Todas las Asignaciones" },
                  { value: "ASSIGNED", label: "Con Clases Asignadas" },
                  { value: "UNASSIGNED", label: "Sin Clases Asignadas" },
                ]}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val || "ALL")}
                placeholder="Asignación"
                searchPlaceholder="Buscar estado..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* TEACHERS TABLE */}
      <Card className="p-0 overflow-hidden relative z-10">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Listado de Docentes</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Mostrando {filteredTeachers.length} de {teachers.length} profesores registrados.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando directorio de docentes...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
            <Users className="size-12 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No se encontraron profesores</p>
            <p className="text-xs text-neutral-500 max-w-sm">
              {hasActiveFilters
                ? "Prueba cambiando o limpiando los filtros seleccionados."
                : "Aún no hay profesores registrados en el sistema."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl mt-2 text-xs">
                Restablecer filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/70 border-b border-neutral-100">
                <TableRow>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Profesor</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Cédula / ID</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Materias que Imparte</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Clases Activas</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Contacto</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => {
                  const teacherClasses = teacherClassesMap[teacher.publicId] || [];
                  const distinctCourses = Array.from(
                    new Set(teacherClasses.map((c) => c.course?.name || c.courseCode).filter(Boolean))
                  );

                  return (
                    <TableRow key={teacher.publicId} className="hover:bg-neutral-50/80 transition-colors">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-neutral-900 text-lime-400 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                            {teacher.firstName?.[0]?.toUpperCase()}{teacher.lastName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 text-sm">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <span className="text-[11px] text-neutral-400">@{teacher.username}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                          {teacher.identityNumber || "—"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {distinctCourses.length === 0 ? (
                            <span className="text-xs text-neutral-400 italic">Sin materias asignadas</span>
                          ) : (
                            distinctCourses.map((courseName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-lime-100 text-lime-900 border border-lime-200/60"
                              >
                                <BookOpen className="size-2.5" />
                                <span>{courseName}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                          <Layers className="size-3 text-neutral-500" />
                          <span>{teacherClasses.length} {teacherClasses.length === 1 ? "sección" : "secciones"}</span>
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Mail className="size-3 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{teacher.email}</span>
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                              <Phone className="size-3 text-neutral-400 shrink-0" />
                              <span>{teacher.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl text-xs font-bold gap-1 text-neutral-700 hover:bg-neutral-100"
                            onClick={() => setSelectedTeacherWorkload(teacher)}
                          >
                            <Calendar className="size-3.5 text-lime-700" />
                            <span>Carga Académica</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            onClick={() => handleDelete(teacher.publicId)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    
      {/* TEACHER ACADEMIC WORKLOAD MODAL */}
      <Dialog open={!!selectedTeacherWorkload} onOpenChange={(open) => !open && setSelectedTeacherWorkload(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          {selectedTeacherWorkload && (() => {
            const tClasses = teacherClassesMap[selectedTeacherWorkload.publicId] || [];
            const tCourses = Array.from(new Set(tClasses.map((c) => c.course?.name || c.courseCode).filter(Boolean)));
            const tClassrooms = Array.from(new Set(tClasses.map((c) => c.classroom?.name).filter(Boolean)));
            const tGrades = Array.from(new Set(tClasses.map((c) => c.grade?.name || c.gradeCode).filter(Boolean)));

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="size-11 rounded-2xl bg-neutral-900 text-lime-400 font-bold text-sm flex items-center justify-center">
                      {selectedTeacherWorkload.firstName?.[0]}{selectedTeacherWorkload.lastName?.[0]}
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-black text-neutral-900">
                        {selectedTeacherWorkload.firstName} {selectedTeacherWorkload.lastName}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-neutral-500">
                        Expediente de Carga Académica y Horario de Clases · @{selectedTeacherWorkload.username}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {/* WORKLOAD METRICS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Clases Asignadas
                      </span>
                      <span className="text-xl font-black text-neutral-900 mt-1 block">
                        {tClasses.length}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-lime-50/60 border border-lime-200 text-center">
                      <span className="text-[10px] font-bold text-lime-800 uppercase tracking-wider block">
                        Materias Únicas
                      </span>
                      <span className="text-xl font-black text-lime-900 mt-1 block">
                        {tCourses.length}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 text-center">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                        Aulas Asignadas
                      </span>
                      <span className="text-xl font-black text-blue-900 mt-1 block">
                        {tClassrooms.length}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 text-center">
                      <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                        Grados
                      </span>
                      <span className="text-xl font-black text-purple-900 mt-1 block">
                        {tGrades.length}
                      </span>
                    </div>
                  </div>

                  {/* CLASSES BREAKDOWN */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Detalle de Secciones y Cursos</span>
                      <Link href="/school/academics/timetable" className="text-lime-700 hover:underline normal-case font-semibold text-xs flex items-center gap-1">
                        <span>Ver Horario Semanal</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </h4>

                    {tClasses.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                        <BookOpen className="size-8 text-neutral-300 mx-auto mb-1 stroke-1" />
                        <p className="text-xs font-bold text-neutral-700">Sin clases asignadas actualmente</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Puedes asignarle clases en el módulo de Académico &gt; Clases y Secciones.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tClasses.map((cls, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 font-bold text-xs">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                                  <span>{cls.name}</span>
                                  <Badge variant="outline" className="bg-lime-50 text-lime-900 border-lime-300 text-[9px] font-bold py-0">
                                    {cls.code}
                                  </Badge>
                                </div>
                                <div className="text-[11px] text-neutral-500 mt-0.5 flex flex-wrap items-center gap-2">
                                  <span>{cls.course?.name || cls.courseCode}</span>
                                  <span>·</span>
                                  <span>{cls.grade?.name || cls.gradeCode}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700 font-semibold text-[11px]">
                                <MapPin className="size-3 text-neutral-400" />
                                {cls.classroom?.name || "Sin aula fija"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogBody>

                <DialogFooter className="border-t border-neutral-200 pt-3">
                  <Button
                    onClick={() => setSelectedTeacherWorkload(null)}
                    className="rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white"
                  >
                    Cerrar Detalle
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
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
                <DialogTitle>¡Docente Registrado Exitosamente!</DialogTitle>
                <DialogDescription>
                  Comparte estas credenciales oficiales con el profesor para que acceda al aula virtual y registro de notas.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Profesor Titular:</span>
                <span className="text-xs font-bold text-neutral-900">{createdTeacherCredentials?.fullName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Rol Asignado:</span>
                <span className="text-xs font-bold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-md">
                  {createdTeacherCredentials?.roleName}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Número de Cuenta:</span>
                <span className="text-xs font-mono font-bold text-neutral-900">{createdTeacherCredentials?.accountNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <span className="text-xs text-neutral-500 font-semibold">Usuario Login:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-neutral-900">{createdTeacherCredentials?.username}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdTeacherCredentials?.username || "", "user")}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    {copiedKey === "user" ? <Check className="size-3 text-lime-600" /> : <Copy className="size-3 text-neutral-400" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-semibold">Contraseña Inicial:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                    {createdTeacherCredentials?.password}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdTeacherCredentials?.password || "", "pass")}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    {copiedKey === "pass" ? <Check className="size-3 text-lime-600" /> : <Copy className="size-3 text-neutral-400" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                const creds = `Credenciales de Acceso Docente a EduSys:\nProfesor: ${createdTeacherCredentials?.fullName}\nRol: ${createdTeacherCredentials?.roleName}\nUsuario: ${createdTeacherCredentials?.username}\nContraseña: ${createdTeacherCredentials?.password}\nEnlace: http://localhost:3000/login`;
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
                  <span>Copiar Mensaje de Bienvenida</span>
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
