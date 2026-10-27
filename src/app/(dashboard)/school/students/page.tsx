"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { studentsService, Student, GuardianItem } from "@/lib/services/api.service";
import { academicsService, Grade, Class, Classroom } from "@/lib/services/academics.service";
import { enrollmentsService, StudentEnrollment, ClassEnrollment } from "@/lib/services/enrollments.service";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2, Plus, Trash2, GraduationCap, Mail, Search,
  User, Users, Phone, CreditCard, AtSign, BookOpen, AlertCircle,
  Filter, RotateCcw, CheckCircle2, XCircle, Layers,
  FileText, ChevronRight, DoorOpen, Sparkles, School, Eye, EyeOff,
  UserPlus, UserCheck, ShieldCheck, HeartHandshake, Home,
  Copy, Check, Lock, KeyRound,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogBody,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RELATIONSHIP_OPTIONS = [
  { value: "MOTHER", label: "Madre" },
  { value: "FATHER", label: "Padre" },
  { value: "GUARDIAN", label: "Tutor Legal / Responsable" },
  { value: "UNCLE_AUNT", label: "Tío / Tía" },
  { value: "GRANDPARENT", label: "Abuelo / Abuela" },
  { value: "SIBLING", label: "Hermano(a) Mayor" },
  { value: "OTHER", label: "Otro Familiar" },
];

const EMPTY_FORM = {
  // Datos del Alumno
  firstName: "",
  lastName: "",
  email: "",
  identityNumber: "",
  username: "",
  phone: "",
  password: "", // Contraseña inicial definida o autogenerada
  // Asignación de Tutor (Obligatorio)
  guardianId: "",
  guardianRelationship: "MOTHER",
};

type FormState = typeof EMPTY_FORM;

export interface AssignedGuardianItem {
  guardian: GuardianItem;
  relationship: string;
  isPrimary: boolean;
  canViewGrades: boolean;
  canReceiveNotifications: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [annualEnrollments, setAnnualEnrollments] = useState<StudentEnrollment[]>([]);
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([]);

  // Guardians list for assignment
  const [guardians, setGuardians] = useState<GuardianItem[]>([]);
  const [guardiansLoading, setGuardiansLoading] = useState(false);

  // Password visibility & generation
  const [showPassword, setShowPassword] = useState(false);

  // Multiple Guardians Assignment State
  const [assignedGuardians, setAssignedGuardians] = useState<AssignedGuardianItem[]>([]);
  const [guardianToAddId, setGuardianToAddId] = useState<string>("");
  const [relationshipToAdd, setRelationshipToAdd] = useState<string>("MOTHER");

  // Success credentials modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    studentName: string;
    identityNumber: string;
    username: string;
    email: string;
    password: string;
    guardiansSummary: Array<{ name: string; relationship: string; isPrimary: boolean }>;
    guardianName: string;
    guardianRelationship: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Metadata Loading vs Students Query Loading
  const [metaLoading, setMetaLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterClassroom, setFilterClassroom] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAll, setShowAll] = useState(false);

  // Modal State for New Student
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const extractData = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };

  // 1. Initial metadata loading (Grades, Classes, Classrooms, Enrollments)
  const fetchMetadata = async () => {
    try {
      setMetaLoading(true);
      const [grdRes, clsRes, clrRes, annRes, ceRes] = await Promise.allSettled([
        academicsService.getGrades(),
        academicsService.getClasses(),
        academicsService.getClassrooms(),
        enrollmentsService.getStudentEnrollments(),
        enrollmentsService.getClassEnrollments(),
      ]);

      if (grdRes.status === "fulfilled") setGrades(extractData(grdRes.value));
      if (clsRes.status === "fulfilled") setClasses(extractData(clsRes.value));
      if (clrRes.status === "fulfilled") setClassrooms(extractData(clrRes.value));
      if (annRes.status === "fulfilled") setAnnualEnrollments(extractData(annRes.value));
      if (ceRes.status === "fulfilled") setClassEnrollments(extractData(ceRes.value));
    } catch (err) {
      console.error("Error loading school metadata:", err);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Is at least one filter selected or search active or showAll clicked?
  const hasActiveFilter = useMemo(() => {
    return (
      filterGrade !== "ALL" ||
      filterClass !== "ALL" ||
      filterClassroom !== "ALL" ||
      searchQuery.trim() !== "" ||
      filterStatus !== "ALL" ||
      showAll
    );
  }, [filterGrade, filterClass, filterClassroom, searchQuery, filterStatus, showAll]);

  // 2. Fetch Students from Backend only when filters are active
  const fetchFilteredStudents = useCallback(async () => {
    if (!hasActiveFilter) {
      setStudents([]);
      return;
    }

    try {
      setStudentsLoading(true);
      const res = await studentsService.getStudents({
        gradeCode: filterGrade !== "ALL" ? filterGrade : undefined,
        classCode: filterClass !== "ALL" ? filterClass : undefined,
        classroomCode: filterClassroom !== "ALL" ? filterClassroom : undefined,
        search: searchQuery.trim() !== "" ? searchQuery.trim() : undefined,
        status: filterStatus !== "ALL" ? filterStatus : undefined,
      });

      setStudents(extractData(res));
    } catch (err) {
      console.error("Error fetching filtered students:", err);
    } finally {
      setStudentsLoading(false);
    }
  }, [hasActiveFilter, filterGrade, filterClass, filterClassroom, searchQuery, filterStatus]);

  useEffect(() => {
    fetchFilteredStudents();
  }, [fetchFilteredStudents]);

  // Map of studentId -> gradeCode
  const studentGradeMap = useMemo(() => {
    const map: Record<string, string> = {};
    annualEnrollments.forEach((ae) => {
      if (ae.studentId && ae.gradeCode) {
        map[ae.studentId] = ae.gradeCode;
      }
    });
    return map;
  }, [annualEnrollments]);

  // Map of studentId -> Set of classCodes
  const studentClassesMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    classEnrollments.forEach((ce) => {
      if (ce.studentId && ce.classCode) {
        if (!map[ce.studentId]) map[ce.studentId] = new Set();
        map[ce.studentId].add(ce.classCode);
      }
    });
    return map;
  }, [classEnrollments]);

  // Options for Grade Combobox filter
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

  // Options for Class Combobox filter
  const classFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todas las Clases" },
      ...classes.map((c) => ({
        value: c.code,
        label: c.name,
        description: c.course?.name || c.grade?.name,
        badge: c.code,
      })),
    ];
  }, [classes]);

  // Options for Classroom Combobox filter
  const classroomFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todas las Aulas" },
      ...classrooms.map((cr) => ({
        value: cr.code,
        label: cr.name,
        description: cr.location,
        badge: cr.code,
      })),
    ];
  }, [classrooms]);

  // Carga de Tutores / Padres de la institución
  const fetchGuardians = useCallback(async () => {
    try {
      setGuardiansLoading(true);
      const res = await studentsService.searchGuardians();
      if (res && res.data) {
        setGuardians(res.data);
      }
    } catch (err) {
      console.error("Error al cargar la lista de tutores:", err);
    } finally {
      setGuardiansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      fetchGuardians();
    }
  }, [isDialogOpen, fetchGuardians]);

  const guardianComboboxOptions = useMemo(() => {
    return guardians.map((g) => ({
      value: g.publicId,
      label: `${g.firstName} ${g.lastName}`,
      description: `Cédula: ${g.identityNumber || "S/N"} • Tel: ${g.phone || "S/N"}`,
      badge: g.email || undefined,
    }));
  }, [guardians]);

  const handleAddGuardianToList = () => {
    if (!guardianToAddId) {
      setError("Selecciona un tutor registrado para agregarlo a la lista.");
      return;
    }
    const g = guardians.find((item) => item.publicId === guardianToAddId);
    if (!g) return;
    if (assignedGuardians.some((ag) => ag.guardian.publicId === guardianToAddId)) {
      setError("Este tutor ya ha sido asignado a la lista.");
      return;
    }
    const isFirst = assignedGuardians.length === 0;
    setAssignedGuardians((prev) => [
      ...prev,
      {
        guardian: g,
        relationship: relationshipToAdd,
        isPrimary: isFirst,
        canViewGrades: true,
        canReceiveNotifications: true,
      },
    ]);
    setGuardianToAddId("");
    setError(null);
  };

  const handleRemoveGuardianFromList = (guardianId: string) => {
    setAssignedGuardians((prev) => {
      const filtered = prev.filter((item) => item.guardian.publicId !== guardianId);
      if (filtered.length > 0 && !filtered.some((item) => item.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryGuardian = (guardianId: string) => {
    setAssignedGuardians((prev) =>
      prev.map((item) => ({
        ...item,
        isPrimary: item.guardian.publicId === guardianId,
      }))
    );
  };

  const handleUpdateGuardianRelationship = (guardianId: string, rel: string) => {
    setAssignedGuardians((prev) =>
      prev.map((item) =>
        item.guardian.publicId === guardianId ? { ...item, relationship: rel } : item
      )
    );
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterGrade("ALL");
    setFilterClass("ALL");
    setFilterClassroom("ALL");
    setFilterStatus("ALL");
    setShowAll(false);
    setStudents([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateRandomPassword = () => {
    const prefixes = ["Estudiante", "Saber", "Campus", "Edu", "Clase", "Colegio"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const pass = `${prefix}${randomDigits}!`;
    setForm((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    if (!createdCredentials) return;
    const guardiansText = createdCredentials.guardiansSummary
      ?.map((g) => `   - ${g.name} (${g.relationship}${g.isPrimary ? " [Principal]" : ""})`)
      .join("\n") || `   - ${createdCredentials.guardianName} (${createdCredentials.guardianRelationship})`;

    const text = `COMPROBANTE DE ACCESO ESTUDIANTIL
========================================
Institución Educativa
Estudiante: ${createdCredentials.studentName}
Documento / Cédula: ${createdCredentials.identityNumber}
Nombre de Usuario: ${createdCredentials.username}
Contraseña Inicial: ${createdCredentials.password}
Correo Personal de Contacto: ${createdCredentials.email}
Tutores Asignados:
${guardiansText}
Portal de Acceso: http://localhost:3000/login
========================================`;
    handleCopy(text, "all");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 1. Validaciones del Alumno
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Los nombres y apellidos del alumno son obligatorios.");
      return;
    }
    if (!form.identityNumber.trim()) {
      setError("El documento de identidad o cédula del alumno es obligatorio.");
      return;
    }
    if (!form.username.trim()) {
      setError("El nombre de usuario del alumno es obligatorio.");
      return;
    }
    if (!form.email.trim()) {
      setError("El correo electrónico personal del alumno es obligatorio.");
      return;
    }

    // 2. Validación estricta de Tutores (Al menos uno obligatorio)
    if (assignedGuardians.length === 0) {
      setError("Debes asignar al menos un tutor o responsable legal a la lista del estudiante.");
      return;
    }

    const primaryG = assignedGuardians.find((ag) => ag.isPrimary) || assignedGuardians[0];
    const effectivePassword = form.password.trim() || `Colegio${Math.floor(1000 + Math.random() * 9000)}!`;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2000/api";

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        identityNumber: form.identityNumber.trim(),
        username: form.username.trim(),
        phone: form.phone?.trim() || undefined,
        password: effectivePassword,
        guardians: assignedGuardians.map((ag) => ({
          guardianId: ag.guardian.publicId,
          relationship: ag.relationship,
          isPrimary: ag.isPrimary,
          canViewGrades: ag.canViewGrades,
          canReceiveNotifications: ag.canReceiveNotifications,
        })),
        guardianMode: "EXISTING",
        guardianId: primaryG.guardian.publicId,
        guardianRelationship: primaryG.relationship,
      };

      const res = await fetch(`${apiUrl}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al crear el estudiante");
      }

      // Preparar ficha de credenciales para entrega
      const relLabel = RELATIONSHIP_OPTIONS.find((r) => r.value === primaryG.relationship)?.label || primaryG.relationship;
      const gName = `${primaryG.guardian.firstName} ${primaryG.guardian.lastName}`;

      setCreatedCredentials({
        studentName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        identityNumber: form.identityNumber.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: effectivePassword,
        guardiansSummary: assignedGuardians.map((ag) => {
          const rL = RELATIONSHIP_OPTIONS.find((r) => r.value === ag.relationship)?.label || ag.relationship;
          return {
            name: `${ag.guardian.firstName} ${ag.guardian.lastName}`,
            relationship: rL,
            isPrimary: ag.isPrimary,
          };
        }),
        guardianName: gName,
        guardianRelationship: relLabel,
      });

      setIsDialogOpen(false);
      setForm(EMPTY_FORM);
      setAssignedGuardians([]);
      setGuardianToAddId("");
      setShowPassword(false);
      setIsSuccessModalOpen(true);

      // Refresh students query if active
      if (hasActiveFilter) {
        fetchFilteredStudents();
      }
    } catch (err: any) {
      setError(err.message || "Error al registrar al estudiante");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("¿Eliminar este estudiante? Esta acción desvinculará sus registros de matrícula.")) return;
    try {
      await studentsService.deleteStudent(publicId);
      fetchFilteredStudents();
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
            Directorio de Estudiantes
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Módulo administrativo escolar con expedientes integrales, calificaciones y gestión de matrículas.
          </p>
        </div>

        {/* MODAL CREAR ESTUDIANTE */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (open) setError(null); }}>
          <DialogTrigger render={
            <Button className="rounded-xl px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer">
              <Plus className="size-4 text-lime-400" />
              <span>Nuevo Estudiante</span>
            </Button>
          } />
          <DialogContent size="xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-neutral-900 text-lime-400 flex items-center justify-center font-bold">
                  <GraduationCap className="size-4" />
                </div>
                <div>
                  <DialogTitle>Registrar Nuevo Estudiante</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos personales del alumno y asigna a su tutor o responsable legal registrado.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <DialogBody className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* BLOQUE 1: DATOS PERSONALES DEL ESTUDIANTE */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/70">
                    <User className="size-4 text-neutral-900" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      1. Datos del Estudiante
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-800">
                        Nombres <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="firstName"
                        placeholder="Ej. Sofía Mariana"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm px-3.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-800">
                        Apellidos <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="lastName"
                        placeholder="Ej. Gómez Navarro"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm px-3.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-800">
                        Documento de Identidad / Cédula <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="identityNumber"
                        placeholder="Ej. 0801-2008-12345"
                        value={form.identityNumber}
                        onChange={handleChange}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm px-3.5 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-800">
                        Nombre de Usuario <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="username"
                        placeholder="Ej. sofia.gomez"
                        value={form.username}
                        onChange={handleChange}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm px-3.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-800">
                        Correo Electrónico Personal <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        name="email"
                        type="email"
                        placeholder="sofia@gmail.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="h-11 rounded-xl text-xs sm:text-sm px-3.5"
                      />
                      <p className="text-[10px] text-neutral-400">
                        Correo personal del estudiante o familia. El correo institucional (@colegio.edu) se asignará más adelante.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-800">
                        Teléfono de Contacto
                      </Label>
                      <Input
                        name="phone"
                        placeholder="+504 9988-7766"
                        value={form.phone}
                        onChange={handleChange}
                        className="h-11 rounded-xl text-xs sm:text-sm px-3.5"
                      />
                    </div>

                    {/* CAMPO DE CONTRASEÑA INICIAL */}
                    <div className="space-y-1.5 sm:col-span-2 pt-1 border-t border-neutral-100">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                          <Lock className="size-3.5 text-neutral-500" />
                          <span>Contraseña Inicial de Acceso</span>
                          <span className="text-neutral-400 font-normal text-[11px]">(opcional o autogenerada)</span>
                        </Label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[11px] font-bold text-neutral-900 hover:text-lime-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Sparkles className="size-3 text-lime-600" />
                          <span>Autogenerar contraseña</span>
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Ej. Estudiante2026! (o deja vacío para generar una automática)"
                          value={form.password}
                          onChange={handleChange}
                          className="h-11 rounded-xl text-xs sm:text-sm px-3.5 pr-10 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Si la dejas en blanco, el sistema le asignará una contraseña segura automáticamente y te mostrará la ficha al finalizar para que se la entregues al estudiante o a su tutor.
                      </p>
                    </div>
                  </div>
                </div>

                {/* BLOQUE 2: ASIGNACIÓN DE TUTORES Y FAMILIARES (OBLIGATORIO) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border border-neutral-200/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-neutral-200/60">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-neutral-900" />
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        2. Tutores y Responsables Legales
                      </span>
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                        {assignedGuardians.length} Asignado{assignedGuardians.length === 1 ? "" : "s"} (Mínimo 1)
                      </Badge>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      Puedes vincular a la madre, al padre y a otros tutores legales
                    </span>
                  </div>

                  {/* CAJA DE BÚSQUEDA Y ASIGNACIÓN */}
                  <div className="p-3.5 rounded-xl bg-white border border-neutral-200/90 space-y-3 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-6 space-y-1">
                        <Label className="text-[11px] font-bold text-neutral-700">
                          Buscar Tutor Registrado
                        </Label>
                        <Combobox
                          options={guardianComboboxOptions}
                          value={guardianToAddId}
                          onChange={(val) => setGuardianToAddId(val)}
                          placeholder={
                            guardiansLoading
                              ? "Cargando tutores..."
                              : "Buscar por nombre, cédula o correo..."
                          }
                          searchPlaceholder="Escribe para buscar tutor..."
                          emptyText={
                            guardiansLoading
                              ? "Buscando tutores..."
                              : "No se encontraron tutores registrados."
                          }
                        />
                      </div>

                      <div className="md:col-span-4 space-y-1">
                        <Label className="text-[11px] font-bold text-neutral-700">
                          Parentesco
                        </Label>
                        <div className="relative">
                          <select
                            value={relationshipToAdd}
                            onChange={(e) => setRelationshipToAdd(e.target.value)}
                            className="w-full h-11 rounded-xl px-3 bg-white border border-neutral-300 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 appearance-none cursor-pointer"
                          >
                            {RELATIONSHIP_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="size-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Button
                          type="button"
                          onClick={handleAddGuardianToList}
                          disabled={!guardianToAddId}
                          className="w-full h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <UserPlus className="size-3.5 text-lime-400" />
                          <span>Agregar</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* LISTA DE TUTORES ASIGNADOS */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-neutral-800 block">
                      Tutores Vinculados a este Alumno:
                    </Label>

                    {assignedGuardians.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 text-center text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
                        <AlertCircle className="size-4 text-amber-600 shrink-0" />
                        <span>Debes seleccionar y agregar al menos un tutor de la lista superior para completar el registro.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedGuardians.map((ag) => (
                          <div
                            key={ag.guardian.publicId}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              ag.isPrimary
                                ? "bg-lime-50/70 border-lime-300"
                                : "bg-white border-neutral-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`size-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                                  ag.isPrimary
                                    ? "bg-neutral-950 text-lime-400"
                                    : "bg-neutral-100 text-neutral-700"
                                }`}
                              >
                                {ag.isPrimary ? <UserCheck className="size-4" /> : <User className="size-4" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold text-neutral-900">
                                    {ag.guardian.firstName} {ag.guardian.lastName}
                                  </h5>
                                  {ag.isPrimary && (
                                    <Badge className="bg-lime-200/80 text-lime-900 border-lime-300 text-[9px] font-bold">
                                      Contacto Principal
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-500 font-mono">
                                  {ag.guardian.identityNumber ? `Cédula: ${ag.guardian.identityNumber}` : "Sin ID"}
                                  {ag.guardian.phone ? ` • Tel: ${ag.guardian.phone}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <select
                                value={ag.relationship}
                                onChange={(e) => handleUpdateGuardianRelationship(ag.guardian.publicId, e.target.value)}
                                className="h-8 rounded-lg px-2 text-[11px] font-semibold bg-white border border-neutral-200 text-neutral-800 cursor-pointer"
                              >
                                {RELATIONSHIP_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              {!ag.isPrimary && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetPrimaryGuardian(ag.guardian.publicId)}
                                  className="h-8 px-2.5 rounded-lg text-[10px] font-bold text-neutral-600 hover:text-neutral-950 cursor-pointer"
                                  title="Marcar como tutor principal"
                                >
                                  Hacer Principal
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveGuardianFromList(ag.guardian.publicId)}
                                className="size-8 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                                title="Eliminar de la lista"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* NOTA DE SISTEMA */}
                <div className="rounded-2xl bg-neutral-100/70 border border-neutral-200/80 p-3.5 flex items-start gap-2.5 text-xs text-neutral-600">
                  <BookOpen className="size-4 shrink-0 mt-0.5 text-neutral-900" />
                  <span>
                    Todos los tutores asignados podrán consultar calificaciones y comunicados en el portal familiar. La matrícula en cursos y grados se realiza desde el módulo de <strong>Matrículas</strong>.
                  </span>
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsDialogOpen(false); setForm(EMPTY_FORM); setAssignedGuardians([]); setError(null); }}
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-xl text-sm font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || assignedGuardians.length === 0}
                  className="h-11 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 size-3.5 animate-spin" />Guardando...</>
                  ) : (
                    `Crear Estudiante (${assignedGuardians.length} Tutor${assignedGuardians.length === 1 ? "" : "es"})`
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL DE COMPROBANTE DE CREDENCIALES EXITOSAS */}
        <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
          <DialogContent size="lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-lime-100 text-lime-900 flex items-center justify-center font-bold">
                  <CheckCircle2 className="size-6 text-lime-700" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-neutral-900">
                    ¡Estudiante Registrado con Éxito!
                  </DialogTitle>
                  <DialogDescription>
                    Ficha oficial de credenciales para entrega al estudiante o tutor responsable.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {createdCredentials && (
              <DialogBody className="space-y-4">
                {/* Tarjeta de Credenciales */}
                <div className="p-5 rounded-2xl bg-neutral-900 text-white space-y-4 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 block">
                        Ficha de Acceso Institucional
                      </span>
                      <h3 className="text-base font-black text-white mt-0.5">
                        {createdCredentials.studentName}
                      </h3>
                    </div>
                    <Badge className="bg-lime-400/20 text-lime-300 border-lime-400/30 text-[10px] font-bold">
                      Cédula: {createdCredentials.identityNumber}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Usuario */}
                    <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                          Nombre de Usuario
                        </span>
                        <span className="text-sm font-mono font-bold text-white mt-0.5 block">
                          {createdCredentials.username}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(createdCredentials.username, "user")}
                        className="size-8 p-0 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 cursor-pointer"
                        title="Copiar usuario"
                      >
                        {copiedKey === "user" ? <Check className="size-4 text-lime-400" /> : <Copy className="size-4" />}
                      </Button>
                    </div>

                    {/* Contraseña */}
                    <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-lime-400 block">
                          Contraseña Provisional
                        </span>
                        <span className="text-sm font-mono font-bold text-lime-300 mt-0.5 block">
                          {createdCredentials.password}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(createdCredentials.password, "pass")}
                        className="size-8 p-0 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 cursor-pointer"
                        title="Copiar contraseña"
                      >
                        {copiedKey === "pass" ? <Check className="size-4 text-lime-400" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Info Tutores y Correo */}
                  <div className="pt-2.5 border-t border-neutral-800 text-[11px] text-neutral-300 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-neutral-400">Tutores Asignados:</span>
                      {createdCredentials.guardiansSummary?.map((g, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 font-semibold text-white">
                          <span>{g.name}</span>
                          <span className="text-[10px] text-lime-400">({g.relationship}{g.isPrimary ? " • Principal" : ""})</span>
                          {idx < createdCredentials.guardiansSummary.length - 1 && <span className="text-neutral-600">;</span>}
                        </span>
                      ))}
                    </div>
                    <div className="text-neutral-400 text-[10px]">
                      Correo Personal: <strong className="text-neutral-200">{createdCredentials.email}</strong>
                    </div>
                  </div>
                </div>

                {/* Nota de advertencia y recomendación */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-bold block">Entrega de credenciales:</span>
                    <span>
                      Copia o imprime esta ficha para entregarla al estudiante o a su tutor. Se le sugerirá actualizar su contraseña personal en su primer inicio de sesión.
                    </span>
                  </div>
                </div>
              </DialogBody>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAll}
                className="rounded-xl text-xs font-bold gap-2 cursor-pointer h-10 px-4"
              >
                {copiedKey === "all" ? (
                  <>
                    <Check className="size-4 text-lime-600" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    <span>Copiar Comprobante Completo</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setCreatedCredentials(null);
                }}
                className="rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer h-10 px-6"
              >
                Entendido y Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ADVANCED FILTERS BAR (SIEMPRE VISIBLE) */}
      <Card className="p-5 overflow-visible relative z-20 shadow-xs border-neutral-200/90">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-900" />
              <h3 className="text-sm font-bold text-neutral-900">
                Filtros de Búsqueda Escolar
              </h3>
              <Badge variant="outline" className="text-[10px] font-semibold text-neutral-500">
                Selecciona al menos uno
              </Badge>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Restablecer filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <Input
                placeholder="Nombre, cédula..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (showAll) setShowAll(false);
                }}
                className="pl-10 h-11 rounded-xl text-xs sm:text-sm"
              />
            </div>

            {/* Grade Filter with Combobox */}
            <div className="w-full">
              <Combobox
                options={gradeFilterOptions}
                value={filterGrade}
                onChange={(val) => {
                  setFilterGrade(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Filtrar por Grado"
                searchPlaceholder="Buscar grado..."
              />
            </div>

            {/* Class Filter with Combobox */}
            <div className="w-full">
              <Combobox
                options={classFilterOptions}
                value={filterClass}
                onChange={(val) => {
                  setFilterClass(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Filtrar por Clase"
                searchPlaceholder="Buscar clase..."
              />
            </div>

            {/* Classroom Filter with Combobox */}
            <div className="w-full">
              <Combobox
                options={classroomFilterOptions}
                value={filterClassroom}
                onChange={(val) => {
                  setFilterClassroom(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Filtrar por Aula"
                searchPlaceholder="Buscar aula..."
              />
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <Combobox
                options={[
                  { value: "ALL", label: "Todos los Estados" },
                  { value: "ACTIVE", label: "Solo Activos" },
                  { value: "INACTIVE", label: "Solo Inactivos" },
                ]}
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val || "ALL");
                  if (showAll) setShowAll(false);
                }}
                placeholder="Estado"
                searchPlaceholder="Buscar estado..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* STATE A: NO FILTER SELECTED YET -> SHOW GUIDED HERO PANEL */}
      {!hasActiveFilter && (
        <Card className="p-8 sm:p-12 text-center border-dashed border-2 border-neutral-300 bg-linear-to-b from-neutral-50/50 to-white relative z-10 space-y-6">
          <div className="size-16 rounded-3xl bg-neutral-900 text-lime-400 mx-auto flex items-center justify-center shadow-lg shadow-neutral-950/10">
            <Filter className="size-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Selecciona un Filtro para Consultar Alumnos
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Para optimizar la visualización y rendimiento del sistema, selecciona al menos un criterio (<strong>Grado</strong>, <strong>Aula</strong> o <strong>Clase</strong>) o realiza una búsqueda por nombre o identificación.
            </p>
          </div>

          {/* Quick shortcuts */}
          <div className="pt-2 max-w-2xl mx-auto space-y-4">
            {/* Quick Grades */}
            {grades.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Accesos Rápidos por Grado
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {grades.slice(0, 6).map((g) => (
                    <button
                      key={g.code}
                      type="button"
                      onClick={() => setFilterGrade(g.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-bold text-neutral-800 transition-all cursor-pointer shadow-2xs group"
                    >
                      <GraduationCap className="size-3 text-neutral-400 group-hover:text-lime-400" />
                      <span>{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Classrooms */}
            {classrooms.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Filtrar por Aula Asignada
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {classrooms.slice(0, 5).map((cr) => (
                    <button
                      key={cr.code}
                      type="button"
                      onClick={() => setFilterClassroom(cr.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200/80 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold text-neutral-700 transition-all cursor-pointer shadow-2xs group"
                    >
                      <DoorOpen className="size-3 text-neutral-400 group-hover:text-lime-400" />
                      <span>{cr.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View All Button */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="rounded-xl text-xs font-bold gap-2 text-neutral-600 hover:text-neutral-950 cursor-pointer"
              >
                <Users className="size-3.5" />
                <span>Mostrar todos los alumnos registrados sin filtros</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STATE B: FILTER APPLIED -> SHOW METRICS & DATA TABLE */}
      {hasActiveFilter && (
        <>
          {/* METRIC CARDS */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Alumnos Encontrados
                </span>
                <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                  <GraduationCap className="size-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-neutral-900 mt-2">{students.length}</div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Coinciden con los criterios seleccionados</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Con Matrícula Asignada
                </span>
                <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-neutral-900 mt-2">
                {students.filter((s) => Boolean(studentGradeMap[s.publicId])).length}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Alumnos con grado escolar oficial</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Filtro Aplicado
                </span>
                <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                  <Filter className="size-4" />
                </div>
              </div>
              <div className="text-sm font-bold text-neutral-900 mt-2 truncate">
                {filterGrade !== "ALL"
                  ? `Grado: ${grades.find((g) => g.code === filterGrade)?.name || filterGrade}`
                  : filterClass !== "ALL"
                  ? `Clase: ${classes.find((c) => c.code === filterClass)?.name || filterClass}`
                  : filterClassroom !== "ALL"
                  ? `Aula: ${classrooms.find((cr) => cr.code === filterClassroom)?.name || filterClassroom}`
                  : searchQuery
                  ? `Búsqueda: "${searchQuery}"`
                  : "Todos los alumnos"}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Criterio activo de consulta</p>
            </Card>
          </div>

          {/* STUDENTS TABLE */}
          <Card className="p-0 overflow-hidden relative z-10 shadow-xs border-neutral-200/90">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Listado de Estudiantes</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mostrando {students.length} estudiantes según los filtros aplicados.
                </p>
              </div>
            </div>

            {studentsLoading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="size-8 animate-spin text-neutral-900" />
                <p className="text-xs text-neutral-500 font-semibold">Cargando directorio de estudiantes...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center space-y-2">
                <GraduationCap className="size-12 text-neutral-300 stroke-1" />
                <p className="text-sm font-bold text-neutral-800">No se encontraron estudiantes</p>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Ningún alumno coincide con los filtros especificados. Prueba cambiando el grado, aula o término de búsqueda.
                </p>
                <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl mt-3 text-xs font-bold cursor-pointer">
                  Restablecer filtros
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-neutral-50/70 border-b border-neutral-100">
                    <TableRow>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estudiante</TableHead>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Identificación</TableHead>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Grado Asignado</TableHead>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Contacto</TableHead>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Clases Inscritas</TableHead>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estado</TableHead>
                      <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const studentGradeCode = studentGradeMap[student.publicId];
                      const gradeObj = grades.find((g) => g.code === studentGradeCode);
                      const enrolledClassesCount = studentClassesMap[student.publicId]?.size || 0;

                      return (
                        <TableRow key={student.publicId} className="hover:bg-neutral-50/80 transition-colors">
                          {/* Student Name & Avatar */}
                          <TableCell className="py-3.5">
                            <Link
                              href={`/school/students/${student.publicId}`}
                              className="group flex items-center gap-3 cursor-pointer"
                            >
                              <div className="size-9 rounded-2xl bg-neutral-900 text-lime-400 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                                {student.profilePicture ? (
                                  <img
                                    src={student.profilePicture}
                                    alt={student.firstName}
                                    className="size-full object-cover rounded-2xl"
                                  />
                                ) : (
                                  <span>
                                    {student.firstName?.[0]?.toUpperCase()}
                                    {student.lastName?.[0]?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-neutral-900 text-sm group-hover:text-lime-600 transition-colors flex items-center gap-1.5">
                                  <span>{student.firstName} {student.lastName}</span>
                                </div>
                                <span className="text-[11px] text-neutral-400">@{student.username}</span>
                              </div>
                            </Link>
                          </TableCell>

                          {/* Identification */}
                          <TableCell className="py-3.5">
                            <span className="font-mono text-xs text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
                              {student.identityNumber || student.userCode || "—"}
                            </span>
                          </TableCell>

                          {/* Grade */}
                          <TableCell className="py-3.5">
                            {gradeObj ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 text-neutral-900 font-bold text-xs border border-neutral-200/60">
                                <GraduationCap className="size-3 text-neutral-600" />
                                {gradeObj.name}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">Sin matricular</span>
                            )}
                          </TableCell>

                          {/* Contact Info */}
                          <TableCell className="py-3.5">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <div className="flex items-center gap-1.5 text-neutral-700">
                                <Mail className="size-3 text-neutral-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{student.email}</span>
                              </div>
                              {student.phone && (
                                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                                  <Phone className="size-3 text-neutral-400 shrink-0" />
                                  <span>{student.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Enrolled Classes Count */}
                          <TableCell className="py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700">
                              <Layers className="size-3 text-neutral-500" />
                              <span>{enrolledClassesCount} {enrolledClassesCount === 1 ? "clase" : "clases"}</span>
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3.5">
                            <Badge
                              variant={student.status ? "default" : "secondary"}
                              className={
                                student.status
                                  ? "bg-lime-100 text-lime-800 border-lime-200 text-[10px] font-bold"
                                  : "bg-neutral-100 text-neutral-600 text-[10px]"
                              }
                            >
                              {student.status ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>

                          {/* Actions: Ver Detalle / Expediente + Delete */}
                          <TableCell className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link href={`/school/students/${student.publicId}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-900 text-xs font-bold gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                >
                                  <FileText className="size-3.5 text-lime-400" />
                                  <span>Ver Detalle</span>
                                  <ChevronRight className="size-3 text-neutral-400" />
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                                title="Eliminar estudiante"
                                onClick={() => handleDelete(student.publicId)}
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
        </>
      )}
    </div>
  );
}
