"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  studentsService,
  StudentDetailedExpediente,
  StudentClassEnrollmentDetail,
  FamilyRelationshipDetail,
  StudentInvoiceDetail,
  StudentPaymentDetail,
  StudentAttendanceDetail,
  StudentBehaviorDetail,
  GuardianItem,
} from "@/lib/services/api.service";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  Layers,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Users,
  CreditCard,
  Printer,
  Edit,
  DollarSign,
  BookOpen,
  DoorOpen,
  CalendarDays,
  ShieldCheck,
  Percent,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Loader2,
  FileCheck,
  UserPlus,
  Trash2,
  UserCheck,
  Check,
  Lock,
} from "lucide-react";

const RELATIONSHIP_OPTIONS = [
  { value: "MOTHER", label: "Madre" },
  { value: "FATHER", label: "Padre" },
  { value: "GUARDIAN", label: "Tutor Legal / Responsable" },
  { value: "UNCLE_AUNT", label: "Tío / Tía" },
  { value: "GRANDPARENT", label: "Abuelo / Abuela" },
  { value: "SIBLING", label: "Hermano(a) Mayor" },
  { value: "OTHER", label: "Otro Familiar" },
];

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [expediente, setExpediente] = useState<StudentDetailedExpediente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab state: 'expediente' | 'calificaciones' | 'clases' | 'finanzas' | 'asistencia'
  const [activeTab, setActiveTab] = useState<"expediente" | "calificaciones" | "clases" | "finanzas" | "asistencia">("expediente");

  // Edit Modal State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    identityNumber: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    scholarshipPercentage: 0,
    status: true,
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  // Guardians Management Modal State
  const [isGuardiansModalOpen, setIsGuardiansModalOpen] = useState(false);
  const [availableGuardians, setAvailableGuardians] = useState<GuardianItem[]>([]);
  const [isLoadingGuardians, setIsLoadingGuardians] = useState(false);
  const [guardianToAddId, setGuardianToAddId] = useState("");
  const [relationshipToAdd, setRelationshipToAdd] = useState("MOTHER");
  const [isPrimaryToAdd, setIsPrimaryToAdd] = useState(false);
  const [canViewGradesToAdd, setCanViewGradesToAdd] = useState(true);
  const [canReceiveNotificationsToAdd, setCanReceiveNotificationsToAdd] = useState(true);
  const [isAssigningGuardian, setIsAssigningGuardian] = useState(false);
  const [guardianActionError, setGuardianActionError] = useState<string | null>(null);
  const [guardianActionSuccess, setGuardianActionSuccess] = useState<string | null>(null);
  const [confirmDeleteGuardianId, setConfirmDeleteGuardianId] = useState<string | null>(null);
  const [isDeletingGuardianId, setIsDeletingGuardianId] = useState<string | null>(null);

  const fetchStudentData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await studentsService.getStudentDetails(studentId);
      if (res && res.data) {
        setExpediente(res.data);
        const stu = res.data.student;
        const ec = stu.emergencyContact || {};
        setEditForm({
          firstName: stu.firstName || "",
          lastName: stu.lastName || "",
          email: stu.email || "",
          phone: stu.phone || "",
          identityNumber: stu.identityNumber || "",
          dateOfBirth: stu.dateOfBirth ? stu.dateOfBirth.split("T")[0] : "",
          gender: stu.gender || "",
          address: stu.address || "",
          scholarshipPercentage: stu.scholarshipPercentage || 0,
          status: stu.status !== undefined ? Boolean(stu.status) : true,
          emergencyContactName: ec.name || "",
          emergencyContactPhone: ec.phone || "",
          emergencyContactRelation: ec.relation || "",
        });
      } else {
        setError("No se pudieron cargar los datos del estudiante.");
      }
    } catch (err: any) {
      console.error("Error loading student expediente:", err);
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  // Derived calculations
  const student = expediente?.student;
  const currentEnrollment = expediente?.annualEnrollments?.[0];
  const classEnrollments = expediente?.classEnrollments || [];
  const family = expediente?.familyRelationships || [];
  const submissions = expediente?.assignmentsSubmissions || [];
  const attendance = expediente?.attendanceRecords || [];
  const invoices = expediente?.invoices || [];
  const payments = expediente?.payments || [];
  const behavior = expediente?.behaviorRecords || [];

  // Financial calculations
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  }, [payments]);

  const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

  // Grades summary & GPA calculation
  const gradesSummary = useMemo(() => {
    const classesWithGrades = classEnrollments.filter(
      (ce) => ce.finalGrade !== null && ce.finalGrade !== undefined
    );
    if (classesWithGrades.length === 0) return { average: null, passing: 0, failing: 0 };
    const sum = classesWithGrades.reduce((acc, ce) => acc + Number(ce.finalGrade), 0);
    const avg = sum / classesWithGrades.length;
    const passing = classesWithGrades.filter((ce) => Number(ce.finalGrade) >= 70).length;
    const failing = classesWithGrades.length - passing;
    return {
      average: avg,
      passing,
      failing,
    };
  }, [classEnrollments]);

  // Attendance stats
  const attendanceStats = useMemo(() => {
    if (attendance.length === 0) return { rate: 100, present: 0, late: 0, absent: 0, excused: 0 };
    const present = attendance.filter((a) => a.status === "PRESENT").length;
    const late = attendance.filter((a) => a.status === "LATE").length;
    const absent = attendance.filter((a) => a.status === "ABSENT").length;
    const excused = attendance.filter((a) => a.status === "EXCUSED").length;
    // Late counts as 0.5 attendance
    const effectiveAtt = present + late * 0.5 + excused;
    const rate = Math.round((effectiveAtt / attendance.length) * 100);
    return {
      rate: Math.min(100, Math.max(0, rate)),
      present,
      late,
      absent,
      excused,
    };
  }, [attendance]);

  // Submissions grouped by class
  const submissionsByClass = useMemo(() => {
    const map: Record<string, typeof submissions> = {};
    submissions.forEach((sub) => {
      const code = sub.classCode || "GENERAL";
      if (!map[code]) map[code] = [];
      map[code].push(sub);
    });
    return map;
  }, [submissions]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    try {
      setIsUpdating(true);
      setEditError(null);
      await studentsService.updateStudent(studentId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone?.trim() || undefined,
        identityNumber: editForm.identityNumber?.trim() || undefined,
        dateOfBirth: editForm.dateOfBirth ? (editForm.dateOfBirth as any) : undefined,
        gender: editForm.gender || undefined,
        address: editForm.address?.trim() || undefined,
        scholarshipPercentage: Number(editForm.scholarshipPercentage) || 0,
        status: Boolean(editForm.status),
        emergencyContact: {
          name: editForm.emergencyContactName?.trim(),
          phone: editForm.emergencyContactPhone?.trim(),
          relation: editForm.emergencyContactRelation?.trim(),
        },
      });
      setIsEditDialogOpen(false);
      fetchStudentData();
    } catch (err: any) {
      setEditError(err.message || "Error al actualizar los datos del estudiante");
    } finally {
      setIsUpdating(false);
    }
  };

  const loadAvailableGuardians = async () => {
    try {
      setIsLoadingGuardians(true);
      const res = await studentsService.searchGuardians();
      if (res && res.data) {
        setAvailableGuardians(res.data);
      }
    } catch (err) {
      console.error("Error al cargar tutores disponibles:", err);
    } finally {
      setIsLoadingGuardians(false);
    }
  };

  const handleAssignGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianToAddId) {
      setGuardianActionError("Selecciona un tutor registrado para vincular.");
      return;
    }
    try {
      setIsAssigningGuardian(true);
      setGuardianActionError(null);
      setGuardianActionSuccess(null);
      const res = await studentsService.assignGuardianToStudent(studentId, {
        guardianId: guardianToAddId,
        relationship: relationshipToAdd,
        isPrimary: isPrimaryToAdd,
        canViewGrades: canViewGradesToAdd,
        canReceiveNotifications: canReceiveNotificationsToAdd,
      });
      if (res && res.status) {
        setGuardianActionSuccess("Tutor vinculado exitosamente al alumno.");
        setGuardianToAddId("");
        setIsPrimaryToAdd(false);
        await fetchStudentData();
      } else {
        setGuardianActionError(res.message || "Error al vincular el tutor.");
      }
    } catch (err: any) {
      setGuardianActionError(err.message || "Error al vincular el tutor.");
    } finally {
      setIsAssigningGuardian(false);
    }
  };

  const handleUpdateGuardianRelationship = async (guardianId: string, rel: string) => {
    try {
      setGuardianActionError(null);
      setGuardianActionSuccess(null);
      await studentsService.updateStudentGuardian(studentId, guardianId, { relationship: rel });
      await fetchStudentData();
      setGuardianActionSuccess("Parentesco actualizado exitosamente.");
    } catch (err: any) {
      setGuardianActionError(err.message || "Error al actualizar parentesco.");
    }
  };

  const handleSetPrimaryGuardian = async (guardianId: string) => {
    try {
      setGuardianActionError(null);
      setGuardianActionSuccess(null);
      const res = await studentsService.updateStudentGuardian(studentId, guardianId, { isPrimary: true });
      if (res && (res as any).status === false) {
        throw new Error((res as any).message || "Error al cambiar contacto principal.");
      }
      await fetchStudentData();
      setGuardianActionSuccess("Contacto principal actualizado exitosamente.");
      setConfirmDeleteGuardianId(null);
    } catch (err: any) {
      setGuardianActionError(err.message || "Error al cambiar contacto principal.");
    }
  };

  const handleToggleGuardianPermission = async (
    guardianId: string,
    field: "canViewGrades" | "canReceiveNotifications",
    currentVal: boolean
  ) => {
    try {
      setGuardianActionError(null);
      const res = await studentsService.updateStudentGuardian(studentId, guardianId, { [field]: !currentVal });
      if (res && (res as any).status === false) {
        throw new Error((res as any).message || "Error al actualizar permisos.");
      }
      await fetchStudentData();
    } catch (err: any) {
      setGuardianActionError(err.message || "Error al actualizar permisos.");
    }
  };

  const handleRemoveGuardian = async (guardianId: string) => {
    try {
      setIsDeletingGuardianId(guardianId);
      setGuardianActionError(null);
      setGuardianActionSuccess(null);
      const res = await studentsService.removeGuardianFromStudent(studentId, guardianId);
      if (res && (res as any).status === false) {
        throw new Error((res as any).message || "Error al desvincular tutor.");
      }
      await fetchStudentData();
      setGuardianActionSuccess("Tutor desvinculado del expediente exitosamente.");
      setConfirmDeleteGuardianId(null);
    } catch (err: any) {
      setGuardianActionError(err.message || "Error al desvincular tutor.");
    } finally {
      setIsDeletingGuardianId(null);
    }
  };

  const availableGuardianOptions = useMemo(() => {
    return availableGuardians
      .filter((g) => !family.some((rel) => rel.parentId === g.publicId))
      .map((g) => ({
        value: g.publicId,
        label: `${g.firstName} ${g.lastName}`,
        description: `Cédula: ${g.identityNumber || "S/N"} • Tel: ${g.phone || "S/N"}`,
        badge: g.email || undefined,
      }));
  }, [availableGuardians, family]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="size-10 animate-spin text-neutral-900" />
        <p className="text-sm font-semibold text-neutral-600">
          Cargando expediente completo del alumno...
        </p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="size-12 text-red-500" />
        <h2 className="text-xl font-black text-neutral-900">Estudiante no encontrado</h2>
        <p className="text-sm text-neutral-500 max-w-md text-center">
          {error || "El expediente solicitado no existe o no tienes permisos para acceder a él."}
        </p>
        <Link href="/school/students">
          <Button variant="outline" className="rounded-xl gap-2 font-bold text-xs mt-2">
            <ArrowLeft className="size-4" />
            <span>Volver al Directorio de Estudiantes</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* TOP NAVIGATION & ACTIONS (HIDDEN IN PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80 print:hidden">
        <div className="flex items-center gap-2">
          <Link href="/school/students">
            <Button variant="ghost" size="sm" className="rounded-xl text-neutral-600 hover:text-neutral-950 gap-2 font-bold text-xs cursor-pointer">
              <ArrowLeft className="size-4" />
              <span>Directorio de Estudiantes</span>
            </Button>
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-xs font-bold text-neutral-900">
            {student.firstName} {student.lastName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs font-bold gap-2 text-neutral-700 hover:text-neutral-950 cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>Imprimir Expediente</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="rounded-xl text-xs font-bold gap-2 bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs"
          >
            <Edit className="size-3.5 text-lime-400" />
            <span>Editar Datos</span>
          </Button>
        </div>
      </div>

      {/* STUDENT PROFILE HERO BANNER */}
      <Card className="p-6 overflow-hidden relative border border-neutral-200/80 bg-linear-to-br from-white via-neutral-50/50 to-neutral-100/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="size-20 sm:size-24 rounded-3xl bg-neutral-950 text-lime-400 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md border-4 border-white shrink-0">
              {student.profilePicture ? (
                <img
                  src={student.profilePicture}
                  alt={student.firstName}
                  className="size-full object-cover rounded-3xl"
                />
              ) : (
                <span>
                  {student.firstName?.[0]?.toUpperCase()}
                  {student.lastName?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                  {student.firstName} {student.lastName}
                </h1>
                <Badge
                  variant={student.status ? "default" : "secondary"}
                  className={
                    student.status
                      ? "bg-lime-100 text-lime-900 border-lime-300 text-[11px] font-bold"
                      : "bg-neutral-200 text-neutral-700 text-[11px]"
                  }
                >
                  {student.status ? "Activo" : "Inactivo"}
                </Badge>
                {student.scholarshipPercentage && student.scholarshipPercentage > 0 && (
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[11px] font-bold gap-1">
                    <Percent className="size-3" />
                    <span>Beca {student.scholarshipPercentage}%</span>
                  </Badge>
                )}
              </div>

              <p className="text-xs text-neutral-500 font-mono">
                Código: <strong className="text-neutral-800">{student.userCode || student.publicId.slice(0, 8)}</strong>
                {" • "}
                Usuario: <strong className="text-neutral-800">@{student.username}</strong>
                {student.identityNumber && (
                  <>
                    {" • "}
                    Cédula: <strong className="text-neutral-800">{student.identityNumber}</strong>
                  </>
                )}
              </p>

              {/* Badges for current enrollment */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {currentEnrollment ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 text-white text-xs font-bold">
                    <GraduationCap className="size-3.5 text-lime-400" />
                    <span>{currentEnrollment.gradeName || currentEnrollment.gradeCode}</span>
                    <span className="text-neutral-400 text-[10px]">
                      ({currentEnrollment.academicYearName})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-xl font-bold border border-amber-200">
                    Sin matrícula activa en ciclo escolar
                  </span>
                )}

                <div className="flex items-center gap-3 text-xs text-neutral-600">
                  {student.email && (
                    <a href={`mailto:${student.email}`} className="flex items-center gap-1 hover:text-neutral-950 transition-colors">
                      <Mail className="size-3 text-neutral-400" />
                      <span>{student.email}</span>
                    </a>
                  )}
                  {student.phone && (
                    <a href={`tel:${student.phone}`} className="flex items-center gap-1 hover:text-neutral-950 transition-colors">
                      <Phone className="size-3 text-neutral-400" />
                      <span>{student.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Promedio General */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Promedio General
            </span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {gradesSummary.average !== null ? `${gradesSummary.average.toFixed(1)}%` : "—"}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {gradesSummary.average !== null
              ? `${gradesSummary.passing} asignaturas aprobadas`
              : "Sin notas registradas"}
          </p>
        </Card>

        {/* Clases Inscritas */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Clases Inscritas
            </span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {classEnrollments.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Asignaturas en curso lectivo
          </p>
        </Card>

        {/* Asistencia */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Asistencia Global
            </span>
            <div className="size-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {attendanceStats.rate}%
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {attendanceStats.present} presentes • {attendanceStats.absent} inasistencias
          </p>
        </Card>

        {/* Finanzas */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Estado Financiero
            </span>
            <div className={`size-8 rounded-xl flex items-center justify-center ${outstandingBalance > 0 ? "bg-amber-100 text-amber-800" : "bg-lime-100 text-lime-800"}`}>
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${outstandingBalance > 0 ? "text-amber-600" : "text-neutral-900"}`}>
            {outstandingBalance > 0 ? `$${outstandingBalance.toFixed(2)}` : "Al día"}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {outstandingBalance > 0 ? "Saldo pendiente de cobro" : "Sin pagos vencidos"}
          </p>
        </Card>
      </div>

      {/* TABS NAVIGATION BAR (PRINT HIDDEN) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 border border-neutral-200/80 overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("expediente")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
            activeTab === "expediente"
              ? "bg-white text-neutral-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Expediente & Datos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calificaciones")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
            activeTab === "calificaciones"
              ? "bg-white text-neutral-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
          }`}
        >
          <Award className="size-3.5" />
          <span>Calificaciones & Boletín</span>
          {gradesSummary.average !== null && (
            <span className="size-5 rounded-full bg-neutral-900 text-lime-400 text-[10px] flex items-center justify-center font-mono">
              {Math.round(gradesSummary.average)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("clases")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
            activeTab === "clases"
              ? "bg-white text-neutral-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
          }`}
        >
          <Layers className="size-3.5" />
          <span>Clases Inscritas</span>
          <span className="size-5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] flex items-center justify-center font-bold">
            {classEnrollments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("finanzas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
            activeTab === "finanzas"
              ? "bg-white text-neutral-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
          }`}
        >
          <DollarSign className="size-3.5" />
          <span>Finanzas & Pagos</span>
          {outstandingBalance > 0 && (
            <span className="size-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("asistencia")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
            activeTab === "asistencia"
              ? "bg-white text-neutral-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
          }`}
        >
          <Clock className="size-3.5" />
          <span>Asistencia</span>
        </button>
      </div>

      {/* TAB CONTENT 1: EXPEDIENTE & DATOS PERSONALES */}
      {activeTab === "expediente" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos Personales */}
            <Card className="p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
                <User className="size-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">Información Personal y Residencia</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-neutral-400 font-semibold block">Nombres Completos</span>
                  <span className="text-neutral-900 font-bold text-sm mt-0.5 block">
                    {student.firstName} {student.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 font-semibold block">Documento de Identidad</span>
                  <span className="text-neutral-900 font-mono font-bold mt-0.5 block">
                    {student.identityNumber || "No registrado"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 font-semibold block">Fecha de Nacimiento</span>
                  <span className="text-neutral-900 font-medium mt-0.5 block">
                    {student.dateOfBirth
                      ? new Date(student.dateOfBirth).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "No registrada"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 font-semibold block">Género</span>
                  <span className="text-neutral-900 font-medium mt-0.5 block">
                    {student.gender === "M" ? "Masculino" : student.gender === "F" ? "Femenino" : student.gender || "No especificado"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-neutral-400 font-semibold block">Dirección Residencial</span>
                  <span className="text-neutral-900 font-medium mt-0.5 flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-neutral-400 shrink-0" />
                    <span>{student.address || "Dirección no especificada"}</span>
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 font-semibold block">Teléfono Personal</span>
                  <span className="text-neutral-900 font-medium mt-0.5 block">
                    {student.phone || "Sin teléfono registrado"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 font-semibold block">Fecha de Registro</span>
                  <span className="text-neutral-900 font-medium mt-0.5 block">
                    {student.createdAt
                      ? new Date(student.createdAt).toLocaleDateString("es-ES")
                      : "—"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Matrícula y Estado Institucional */}
            <Card className="p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-neutral-100">
                <GraduationCap className="size-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">Historial de Matrícula Institucional</h3>
              </div>
              <div className="space-y-4 pt-4">
                {expediente.annualEnrollments.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No registra matrículas anuales registradas.</p>
                ) : (
                  expediente.annualEnrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">{enr.gradeName || enr.gradeCode}</span>
                          {enr.isCurrent && (
                            <Badge className="bg-lime-100 text-lime-900 border-lime-300 text-[10px] font-bold">
                              Ciclo Activo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 font-medium">
                          {enr.academicYearName} • Matriculado el{" "}
                          {enr.enrollmentDate ? new Date(enr.enrollmentDate).toLocaleDateString("es-ES") : "—"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono font-bold bg-white">
                        {enr.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Familiares & Contactos de Emergencia */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">
                  Padres, Tutores y Contactos de Emergencia
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold text-neutral-600">
                  {family.length} Registrado{family.length === 1 ? "" : "s"}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsGuardiansModalOpen(true);
                    loadAvailableGuardians();
                  }}
                  className="rounded-xl text-xs font-bold gap-1.5 bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs"
                >
                  <UserPlus className="size-3.5 text-lime-400" />
                  <span>Administrar Tutores</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {family.length === 0 ? (
                <div className="col-span-full p-8 text-center text-xs text-neutral-500 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 space-y-3">
                  <p className="font-medium">No hay padres o tutores vinculados en el expediente de este estudiante.</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsGuardiansModalOpen(true);
                      loadAvailableGuardians();
                    }}
                    className="rounded-xl text-xs font-bold gap-1.5 bg-neutral-950 hover:bg-neutral-800 text-white cursor-pointer shadow-xs"
                  >
                    <UserPlus className="size-3.5 text-lime-400" />
                    <span>+ Vincular Tutor Ahora</span>
                  </Button>
                </div>
              ) : (
                family.map((rel) => (
                  <div
                    key={rel.parentId}
                    className="p-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-neutral-900 text-lime-400 text-[10px] font-bold">
                          {rel.relationship === "MOTHER"
                            ? "Madre"
                            : rel.relationship === "FATHER"
                            ? "Padre"
                            : rel.relationship === "GUARDIAN"
                            ? "Tutor Legal"
                            : rel.relationship}
                        </Badge>
                        {rel.isPrimary && (
                          <span className="text-[10px] font-bold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-md">
                            Contacto Principal
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">
                          {rel.firstName} {rel.lastName}
                        </h4>
                        {rel.identityNumber && (
                          <p className="text-[11px] font-mono text-neutral-400">ID: {rel.identityNumber}</p>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-neutral-600 pt-1 border-t border-neutral-100">
                        {rel.phone && (
                          <a href={`tel:${rel.phone}`} className="flex items-center gap-1.5 hover:text-neutral-950 font-medium">
                            <Phone className="size-3 text-neutral-400" />
                            <span>{rel.phone}</span>
                          </a>
                        )}
                        {rel.email && (
                          <a href={`mailto:${rel.email}`} className="flex items-center gap-1.5 hover:text-neutral-950 font-medium truncate">
                            <Mail className="size-3 text-neutral-400" />
                            <span className="truncate">{rel.email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 text-[10px]">
                      <span className="text-neutral-500 font-medium">
                        {rel.canViewGrades ? "• Notas activas" : "• Sin notas"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsGuardiansModalOpen(true);
                          loadAvailableGuardians();
                        }}
                        className="h-7 px-2.5 text-[10px] font-bold text-neutral-800 hover:bg-neutral-200 rounded-lg cursor-pointer"
                      >
                        Editar Tutor
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Contacto de Emergencia Registrado en JSON */}
              {student.emergencyContact && student.emergencyContact.name && (
                <div className="p-4 rounded-2xl border border-dashed border-neutral-300 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Contacto de Respaldo</span>
                    <ShieldCheck className="size-3.5 text-neutral-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">{student.emergencyContact.name}</h4>
                    <p className="text-xs text-neutral-500">{student.emergencyContact.relation || "Pariente"}</p>
                  </div>
                  {student.emergencyContact.phone && (
                    <a href={`tel:${student.emergencyContact.phone}`} className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium">
                      <Phone className="size-3 text-neutral-400" />
                      <span>{student.emergencyContact.phone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Historial de Conducta / Méritos */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">Expediente de Conducta & Méritos</h3>
              </div>
              <span className="text-xs text-neutral-400">{behavior.length} Registros</span>
            </div>

            <div className="space-y-3 pt-4">
              {behavior.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-neutral-100">
                  Sin observaciones de conducta o deméritos registrados. Historial limpio.
                </div>
              ) : (
                behavior.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl border border-neutral-200/70 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          b.behaviorType === "POSITIVE"
                            ? "bg-lime-100 text-lime-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.behaviorType === "POSITIVE" ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <AlertCircle className="size-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">{b.description}</span>
                          <Badge
                            variant="outline"
                            className={
                              b.behaviorType === "POSITIVE"
                                ? "bg-lime-50 text-lime-800 border-lime-300 text-[10px]"
                                : "bg-amber-50 text-amber-800 border-amber-300 text-[10px]"
                            }
                          >
                            {b.points > 0 ? `+${b.points} pts` : `${b.points} pts`}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Registrado por {b.recorderFirstName} {b.recorderLastName} •{" "}
                          {b.dateOccurred ? new Date(b.dateOccurred).toLocaleDateString("es-ES") : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 2: CALIFICACIONES & BOLETÍN */}
      {activeTab === "calificaciones" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Boletín Oficial de Calificaciones</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Resumen de notas finales calculadas y ponderaciones por materia inscrita.
                </p>
              </div>
              {gradesSummary.average !== null && (
                <div className="flex items-center gap-3 bg-neutral-900 text-white px-4 py-2 rounded-2xl">
                  <span className="text-xs text-neutral-400 font-semibold">Promedio Ponderado:</span>
                  <span className="text-xl font-black text-lime-400 font-mono">
                    {gradesSummary.average.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {classEnrollments.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400">
                El estudiante no cuenta con materias inscritas actualmente.
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                {classEnrollments.map((ce) => {
                  const classSubs = submissionsByClass[ce.classCode] || [];
                  const finalScore = ce.finalGrade !== null && ce.finalGrade !== undefined ? Number(ce.finalGrade) : null;
                  const isPassing = finalScore !== null && finalScore >= 70;

                  return (
                    <div
                      key={ce.id}
                      className="rounded-2xl border border-neutral-200/90 overflow-hidden bg-white shadow-2xs"
                    >
                      {/* Class Header */}
                      <div className="p-4 bg-neutral-50/70 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-neutral-900">{ce.className}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {ce.classCode}
                            </Badge>
                            {ce.isGradeOverridden && (
                              <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] font-bold">
                                Nota Ajustada
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500">
                            Docente: <strong className="text-neutral-700">{ce.teacherFirstName} {ce.teacherLastName}</strong>
                            {ce.classroomName && ` • Aula: ${ce.classroomName}`}
                          </p>
                        </div>

                        {/* Final Grade Badge */}
                        <div className="flex items-center gap-3">
                          {finalScore !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Nota Final</span>
                                <span className={`text-xl font-black font-mono ${isPassing ? "text-lime-700" : "text-red-600"}`}>
                                  {finalScore.toFixed(1)}
                                </span>
                              </div>
                              <Badge
                                className={
                                  isPassing
                                    ? "bg-lime-100 text-lime-900 border-lime-300 text-xs font-bold"
                                    : "bg-red-100 text-red-900 border-red-300 text-xs font-bold"
                                }
                              >
                                {isPassing ? "Aprobado" : "Reprobado"}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400 italic bg-neutral-100 px-3 py-1 rounded-xl">
                              En curso (Sin nota final)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Override Reason Alert if applicable */}
                      {ce.isGradeOverridden && ce.overrideReason && (
                        <div className="px-4 py-2 bg-purple-50 text-purple-800 text-xs flex items-center gap-2 border-b border-purple-100">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>
                            <strong>Motivo de ajuste manual:</strong> {ce.overrideReason}
                          </span>
                        </div>
                      )}

                      {/* Submissions Table */}
                      <div className="p-0">
                        {classSubs.length === 0 ? (
                          <p className="text-xs text-neutral-400 p-4 text-center italic">
                            No hay asignaciones o exámenes registrados en esta materia.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader className="bg-neutral-50/40 text-[11px]">
                              <TableRow>
                                <TableHead className="font-bold py-2.5">Actividad / Tarea</TableHead>
                                <TableHead className="font-bold py-2.5">Tipo</TableHead>
                                <TableHead className="font-bold py-2.5">Fecha</TableHead>
                                <TableHead className="font-bold py-2.5">Calificación</TableHead>
                                <TableHead className="font-bold py-2.5">Feedback Docente</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {classSubs.map((sub) => {
                                const scoreNum = sub.score !== null ? Number(sub.score) : null;
                                const maxScoreNum = Number(sub.maxScore) || 100;
                                const pct = scoreNum !== null ? Math.round((scoreNum / maxScoreNum) * 100) : null;

                                return (
                                  <TableRow key={sub.id} className="text-xs hover:bg-neutral-50/50">
                                    <TableCell className="py-2.5 font-bold text-neutral-800">
                                      {sub.assignmentTitle}
                                    </TableCell>
                                    <TableCell className="py-2.5">
                                      <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                                        {sub.assignmentTypeName || "General"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-2.5 text-neutral-500 text-[11px]">
                                      {sub.dueDate ? new Date(sub.dueDate).toLocaleDateString("es-ES") : "—"}
                                    </TableCell>
                                    <TableCell className="py-2.5">
                                      {scoreNum !== null ? (
                                        <div className="flex items-center gap-1.5 font-mono">
                                          <span className="font-bold text-neutral-900">{scoreNum}</span>
                                          <span className="text-neutral-400 text-[11px]">/ {maxScoreNum}</span>
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] ml-1 font-bold ${
                                              pct && pct >= 70 ? "text-lime-700 bg-lime-50" : "text-red-700 bg-red-50"
                                            }`}
                                          >
                                            {pct}%
                                          </Badge>
                                        </div>
                                      ) : (
                                        <span className="text-neutral-400 italic text-[11px]">Pendiente</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-neutral-600 italic text-[11px] max-w-xs truncate">
                                      {sub.feedback || "—"}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB CONTENT 3: CLASES & HORARIOS */}
      {activeTab === "clases" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Asignaturas y Carga Académica</h3>
              <p className="text-xs text-neutral-500">
                Horarios, docentes y aulas asignadas para el periodo escolar actual.
              </p>
            </div>
            <Badge variant="outline" className="font-bold text-xs bg-white">
              {classEnrollments.length} Asignaturas
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classEnrollments.length === 0 ? (
              <div className="col-span-full p-12 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-neutral-100">
                No tiene clases matriculadas en el ciclo activo.
              </div>
            ) : (
              classEnrollments.map((ce) => {
                const days = ce.schedule?.days || [];
                const start = ce.schedule?.start;
                const end = ce.schedule?.end;

                return (
                  <Card key={ce.id} className="p-5 space-y-4 hover:shadow-xs transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="font-mono text-[10px] text-neutral-500 mb-1">
                          {ce.classCode}
                        </Badge>
                        <h4 className="text-base font-black text-neutral-900">{ce.className}</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">{ce.courseName || "Asignatura general"}</p>
                      </div>
                      <Badge
                        className={
                          ce.status === "ACTIVE"
                            ? "bg-lime-100 text-lime-900 border-lime-300 text-[10px] font-bold"
                            : "bg-neutral-100 text-neutral-600 text-[10px]"
                        }
                      >
                        {ce.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                      {/* Teacher */}
                      <div className="flex items-center gap-2 text-neutral-700">
                        <User className="size-3.5 text-neutral-400 shrink-0" />
                        <span>
                          Docente: <strong>{ce.teacherFirstName} {ce.teacherLastName}</strong>
                        </span>
                      </div>

                      {/* Classroom */}
                      <div className="flex items-center gap-2 text-neutral-700">
                        <DoorOpen className="size-3.5 text-neutral-400 shrink-0" />
                        <span>
                          Aula: <strong>{ce.classroomName || ce.classroomCode || "Sin asignar"}</strong>
                          {ce.classroomLocation && ` (${ce.classroomLocation})`}
                        </span>
                      </div>

                      {/* Schedule */}
                      <div className="flex items-center gap-2 text-neutral-700">
                        <CalendarDays className="size-3.5 text-neutral-400 shrink-0" />
                        <span>
                          {days.length > 0 ? (
                            <>
                              <strong>{days.join(", ")}</strong> {start && end ? `• ${start} - ${end}` : ""}
                            </>
                          ) : (
                            <span className="italic text-neutral-400">Horario no especificado</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: FINANZAS & PAGOS */}
      {activeTab === "finanzas" && (
        <div className="space-y-6">
          {/* Financial summary banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-neutral-900 text-white">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                Total Facturado
              </span>
              <span className="text-2xl font-black font-mono mt-1 block">
                ${totalInvoiced.toFixed(2)}
              </span>
              <p className="text-[11px] text-neutral-400 mt-1">{invoices.length} facturas emitidas</p>
            </Card>

            <Card className="p-4 bg-lime-950 text-lime-300">
              <span className="text-[10px] uppercase font-bold text-lime-400/80 block tracking-wider">
                Total Cobrado
              </span>
              <span className="text-2xl font-black font-mono mt-1 block">
                ${totalPaid.toFixed(2)}
              </span>
              <p className="text-[11px] text-lime-400/70 mt-1">{payments.length} pagos registrados</p>
            </Card>

            <Card className={`p-4 ${outstandingBalance > 0 ? "bg-amber-500 text-white" : "bg-neutral-100 text-neutral-700"}`}>
              <span className="text-[10px] uppercase font-bold block tracking-wider opacity-90">
                Saldo Pendiente
              </span>
              <span className="text-2xl font-black font-mono mt-1 block">
                ${outstandingBalance.toFixed(2)}
              </span>
              <p className="text-[11px] mt-1 opacity-80">
                {outstandingBalance > 0 ? "Requiere pago" : "Estado solvente"}
              </p>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">Facturas & Colegiaturas</h3>
              </div>
              <span className="text-xs text-neutral-400">{invoices.length} Facturas</span>
            </div>

            {invoices.length === 0 ? (
              <p className="text-xs text-neutral-400 p-6 text-center italic">
                No hay facturas o cobros registrados para este estudiante.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-neutral-50/70 text-xs">
                  <TableRow>
                    <TableHead className="font-bold py-3">Nº Factura</TableHead>
                    <TableHead className="font-bold py-3">Concepto / Notas</TableHead>
                    <TableHead className="font-bold py-3">Emisión</TableHead>
                    <TableHead className="font-bold py-3">Vencimiento</TableHead>
                    <TableHead className="font-bold py-3">Monto</TableHead>
                    <TableHead className="font-bold py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="text-xs">
                      <TableCell className="font-mono font-bold py-3 text-neutral-900">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="py-3 text-neutral-600">
                        {inv.notes || "Colegiatura escolar"}
                      </TableCell>
                      <TableCell className="py-3 text-neutral-500">
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("es-ES") : "—"}
                      </TableCell>
                      <TableCell className="py-3 text-neutral-500">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("es-ES") : "—"}
                      </TableCell>
                      <TableCell className="py-3 font-mono font-bold text-neutral-900">
                        ${Number(inv.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={
                            inv.status === "PAID"
                              ? "bg-lime-100 text-lime-800 border-lime-300 text-[10px] font-bold"
                              : "bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold"
                          }
                        >
                          {inv.status === "PAID" ? "Pagada" : "Pendiente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Payments Table */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">Historial de Recibos y Transacciones</h3>
              </div>
              <span className="text-xs text-neutral-400">{payments.length} Pagos</span>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-neutral-400 p-6 text-center italic">
                No hay comprobantes de pago registrados aún.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-neutral-50/70 text-xs">
                  <TableRow>
                    <TableHead className="font-bold py-3">Referencia / Comprobante</TableHead>
                    <TableHead className="font-bold py-3">Fecha de Pago</TableHead>
                    <TableHead className="font-bold py-3">Método</TableHead>
                    <TableHead className="font-bold py-3">Monto Abonado</TableHead>
                    <TableHead className="font-bold py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="text-xs">
                      <TableCell className="font-mono font-bold py-3 text-neutral-900">
                        {p.transactionReference || `REC-#${p.id}`}
                      </TableCell>
                      <TableCell className="py-3 text-neutral-500">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("es-ES") : "—"}
                      </TableCell>
                      <TableCell className="py-3 text-neutral-600">
                        {p.paymentMethodName || "Efectivo / Transferencia"}
                      </TableCell>
                      <TableCell className="py-3 font-mono font-bold text-lime-700">
                        +${Number(p.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className="bg-lime-100 text-lime-800 border-lime-300 text-[10px] font-bold">
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: ASISTENCIA */}
      {activeTab === "asistencia" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Presentes</span>
              <div className="text-2xl font-black text-lime-700 mt-1">{attendanceStats.present}</div>
              <p className="text-[10px] text-neutral-400">Asistencias puntuales</p>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Tardanzas</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{attendanceStats.late}</div>
              <p className="text-[10px] text-neutral-400">Llegadas tarde</p>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Inasistencias</span>
              <div className="text-2xl font-black text-red-600 mt-1">{attendanceStats.absent}</div>
              <p className="text-[10px] text-neutral-400">Faltas injustificadas</p>
            </Card>
            <Card className="p-4">
              <span className="text-[11px] font-bold text-neutral-400 uppercase">Justificadas</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{attendanceStats.excused}</div>
              <p className="text-[10px] text-neutral-400">Con excusa médica</p>
            </Card>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-neutral-900" />
                <h3 className="text-base font-bold text-neutral-900">Registro Detallado de Asistencia</h3>
              </div>
              <span className="text-xs text-neutral-400">{attendance.length} Sesiones</span>
            </div>

            {attendance.length === 0 ? (
              <p className="text-xs text-neutral-400 p-6 text-center italic">
                No hay registros de asistencia en la base de datos para este alumno.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-neutral-50/70 text-xs">
                  <TableRow>
                    <TableHead className="font-bold py-3">Fecha</TableHead>
                    <TableHead className="font-bold py-3">Clase / Materia</TableHead>
                    <TableHead className="font-bold py-3">Hora Entrada</TableHead>
                    <TableHead className="font-bold py-3">Estado</TableHead>
                    <TableHead className="font-bold py-3">Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((att, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="font-medium py-3 text-neutral-900">
                        {att.date ? new Date(att.date).toLocaleDateString("es-ES") : "—"}
                      </TableCell>
                      <TableCell className="py-3 font-semibold text-neutral-800">
                        {att.className || att.classCode}
                      </TableCell>
                      <TableCell className="py-3 text-neutral-500 font-mono text-[11px]">
                        {att.timeIn || "08:00"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          className={
                            att.status === "PRESENT"
                              ? "bg-lime-100 text-lime-800 border-lime-300 text-[10px] font-bold"
                              : att.status === "LATE"
                              ? "bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold"
                              : att.status === "EXCUSED"
                              ? "bg-blue-100 text-blue-800 border-blue-300 text-[10px] font-bold"
                              : "bg-red-100 text-red-800 border-red-300 text-[10px] font-bold"
                          }
                        >
                          {att.status === "PRESENT"
                            ? "Presente"
                            : att.status === "LATE"
                            ? "Tardanza"
                            : att.status === "EXCUSED"
                            ? "Excusa"
                            : "Ausente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-neutral-500 text-[11px] italic">
                        {att.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* EDIT MODAL DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Editar Expediente de {student.firstName} {student.lastName}</DialogTitle>
            <DialogDescription>
              Actualiza la información personal, de residencia y contactos de emergencia del alumno.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="flex flex-col flex-1">
            <DialogBody>
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Nombres *</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                    required
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Apellidos *</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                    required
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Documento de Identidad / Cédula</Label>
                  <Input
                    value={editForm.identityNumber}
                    onChange={(e) => setEditForm((p) => ({ ...p, identityNumber: e.target.value }))}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Correo Electrónico (Personal / Estudiantil) *</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Teléfono Personal</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Estado del Estudiante</Label>
                  <select
                    value={editForm.status ? "true" : "false"}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value === "true" }))}
                    className="w-full h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="true">Activo (Matrícula y accesos habilitados)</option>
                    <option value="false">Inactivo (Suspendido / Retirado)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Porcentaje de Beca (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.scholarshipPercentage}
                    onChange={(e) => setEditForm((p) => ({ ...p, scholarshipPercentage: Number(e.target.value) }))}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Fecha de Nacimiento</Label>
                  <Input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Género</Label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 focus:outline-hidden"
                  >
                    <option value="">Selecciona género</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-800">Dirección Residencial</Label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Colonia, Calle, Número de Casa..."
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                {/* ACCESO RÁPIDO A TUTORES DENTRO DEL MODAL DE EDICIÓN */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-neutral-100/70 border border-neutral-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Users className="size-4 text-neutral-900" />
                    <div>
                      <h5 className="text-xs font-bold text-neutral-900">Tutores y Responsables Legales</h5>
                      <p className="text-[11px] text-neutral-500">
                        {family.length} tutor{family.length === 1 ? "" : "es"} asignado{family.length === 1 ? "" : "s"} al expediente del alumno.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setIsGuardiansModalOpen(true);
                      loadAvailableGuardians();
                    }}
                    className="text-xs font-bold rounded-lg cursor-pointer gap-1.5 self-start sm:self-auto bg-white hover:bg-neutral-900 hover:text-white transition-all shadow-xs"
                  >
                    <UserPlus className="size-3.5 text-lime-600" />
                    <span>Administrar Tutores</span>
                  </Button>
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div className="pt-3 border-t border-neutral-100 space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Contacto de Emergencia Adicional
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-neutral-600">Nombre Contacto</Label>
                    <Input
                      placeholder="Ej. Tía María"
                      value={editForm.emergencyContactName}
                      onChange={(e) => setEditForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-neutral-600">Parentesco</Label>
                    <Input
                      placeholder="Ej. Tía, Abuelo"
                      value={editForm.emergencyContactRelation}
                      onChange={(e) => setEditForm((p) => ({ ...p, emergencyContactRelation: e.target.value }))}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-neutral-600">Teléfono Emergencia</Label>
                    <Input
                      placeholder="+504 9900-1122"
                      value={editForm.emergencyContactPhone}
                      onChange={(e) => setEditForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
                className="h-10 px-5 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="h-10 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DEDICADO PARA ADMINISTRAR TUTORES */}
      <Dialog open={isGuardiansModalOpen} onOpenChange={setIsGuardiansModalOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-neutral-900 text-lime-400 flex items-center justify-center font-bold">
                <Users className="size-5" />
              </div>
              <div>
                <DialogTitle>Administrar Tutores de {student.firstName} {student.lastName}</DialogTitle>
                <DialogDescription>
                  Asigna nuevos tutores, cambia el parentesco, designa al contacto principal o desvincula responsables.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {guardianActionError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-red-500" />
                <span>{guardianActionError}</span>
              </div>
            )}

            {guardianActionSuccess && (
              <div className="p-3.5 rounded-xl bg-lime-50 border border-lime-300 text-lime-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-lime-600" />
                <span>{guardianActionSuccess}</span>
              </div>
            )}

            {/* SECCIÓN 1: ASIGNAR NUEVO TUTOR */}
            <div className="p-4 rounded-2xl bg-neutral-50/90 border border-neutral-200/90 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-4 text-neutral-900" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Vincular Nuevo Tutor al Alumno
                  </h4>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Selecciona de los tutores registrados en la institución
                </span>
              </div>

              <form onSubmit={handleAssignGuardian} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6 space-y-1">
                    <Label className="text-[11px] font-bold text-neutral-700">
                      Buscar Tutor Registrado
                    </Label>
                    <Combobox
                      options={availableGuardianOptions}
                      value={guardianToAddId}
                      onChange={(val) => setGuardianToAddId(val)}
                      placeholder={isLoadingGuardians ? "Cargando tutores..." : "Buscar por nombre, cédula o correo..."}
                      searchPlaceholder="Escribe para buscar tutor..."
                      emptyText={isLoadingGuardians ? "Cargando..." : "No hay tutores adicionales disponibles."}
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
                      type="submit"
                      disabled={isAssigningGuardian || !guardianToAddId}
                      className="w-full h-11 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isAssigningGuardian ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="size-3.5 text-lime-400" />
                          <span>Vincular</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Opciones adicionales: primario, ver notas, notificaciones */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-700">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPrimaryToAdd}
                      onChange={(e) => setIsPrimaryToAdd(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="font-semibold text-[11px]">Designar como Contacto Principal</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={canViewGradesToAdd}
                      onChange={(e) => setCanViewGradesToAdd(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="text-[11px]">Permitir consultar calificaciones</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={canReceiveNotificationsToAdd}
                      onChange={(e) => setCanReceiveNotificationsToAdd(e.target.checked)}
                      className="rounded text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="text-[11px]">Recibir alertas y notificaciones</span>
                  </label>
                </div>
              </form>
            </div>

            {/* SECCIÓN 2: TUTORES VINCULADOS ACTUALMENTE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-neutral-900" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Tutores Vinculados al Expediente ({family.length})
                  </h4>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Cambia el parentesco, ajusta el tutor principal o desvincula si es necesario
                </span>
              </div>

              {family.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  El alumno no tiene tutores asignados en este momento. Agrega uno en el formulario superior.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {family.map((rel) => (
                    <div
                      key={rel.parentId}
                      className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        rel.isPrimary
                          ? "bg-lime-50/70 border-lime-300 shadow-xs"
                          : "bg-white border-neutral-200/90"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`size-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                            rel.isPrimary
                              ? "bg-neutral-950 text-lime-400"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {rel.isPrimary ? <UserCheck className="size-5" /> : <User className="size-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-sm font-bold text-neutral-900">
                              {rel.firstName} {rel.lastName}
                            </h5>
                            {rel.isPrimary && (
                              <Badge className="bg-lime-200 text-lime-900 border-lime-300 text-[10px] font-bold">
                                Contacto Principal
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-neutral-500 font-mono">
                            {rel.identityNumber ? `Cédula: ${rel.identityNumber}` : "Sin Cédula"}
                            {rel.phone ? ` • Tel: ${rel.phone}` : ""}
                            {rel.email ? ` • ${rel.email}` : ""}
                          </p>

                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleToggleGuardianPermission(rel.parentId, "canViewGrades", rel.canViewGrades)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                rel.canViewGrades
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-neutral-100 text-neutral-400 border-neutral-200 line-through"
                              }`}
                            >
                              Notas {rel.canViewGrades ? "Habilitadas" : "Bloqueadas"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleGuardianPermission(rel.parentId, "canReceiveNotifications", rel.canReceiveNotifications)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                rel.canReceiveNotifications
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-neutral-100 text-neutral-400 border-neutral-200 line-through"
                              }`}
                            >
                              Notificaciones {rel.canReceiveNotifications ? "Activas" : "Pausadas"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {/* Selector de parentesco */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-500 font-semibold hidden sm:inline">Parentesco:</span>
                          <select
                            value={rel.relationship}
                            onChange={(e) => handleUpdateGuardianRelationship(rel.parentId, e.target.value)}
                            className="h-9 rounded-xl px-2.5 text-xs font-semibold bg-white border border-neutral-300 text-neutral-900 cursor-pointer"
                          >
                            {RELATIONSHIP_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {!rel.isPrimary && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeletingGuardianId !== null}
                            onClick={() => handleSetPrimaryGuardian(rel.parentId)}
                            className="h-9 px-3 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-950 cursor-pointer"
                            title="Hacer este tutor el contacto principal"
                          >
                            Hacer Principal
                          </Button>
                        )}

                        {rel.isPrimary ? (
                          <div
                            className="h-9 px-3 rounded-xl border border-lime-300 bg-lime-100/70 text-lime-800 text-[11px] font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                            title="El tutor principal no puede eliminarse. Para eliminarlo, primero designa a otro tutor como principal."
                          >
                            <Lock className="size-3.5 text-lime-700" />
                            <span>Principal</span>
                          </div>
                        ) : confirmDeleteGuardianId === rel.parentId ? (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl p-1 animate-in fade-in">
                            <span className="text-[11px] font-bold text-red-700 px-1">¿Eliminar?</span>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isDeletingGuardianId === rel.parentId}
                              onClick={() => handleRemoveGuardian(rel.parentId)}
                              className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              {isDeletingGuardianId === rel.parentId ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Sí, eliminar"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isDeletingGuardianId === rel.parentId}
                              onClick={() => setConfirmDeleteGuardianId(null)}
                              className="h-7 px-2 text-neutral-600 hover:bg-neutral-200 text-[11px] font-semibold rounded-lg cursor-pointer"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDeletingGuardianId !== null}
                            onClick={() => {
                              setConfirmDeleteGuardianId(rel.parentId);
                              setGuardianActionError(null);
                            }}
                            className="size-9 p-0 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                            title="Eliminar tutor del expediente"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setIsGuardiansModalOpen(false);
                setGuardianActionError(null);
                setGuardianActionSuccess(null);
              }}
              className="h-10 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
            >
              Listo / Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
