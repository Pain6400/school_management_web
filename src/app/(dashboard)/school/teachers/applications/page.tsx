"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  staffService,
  StaffApplication,
  HireStaffResult,
} from "@/lib/services/staff.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  ExternalLink,
  RotateCcw,
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Building,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any }
> = {
  PENDING: {
    label: "En Revisión",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  SHORTLISTED: {
    label: "Preseleccionado",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Sparkles,
  },
  INTERVIEWED: {
    label: "Entrevistado",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Calendar,
  },
  HIRED: {
    label: "Contratado Oficial",
    badgeClass: "bg-lime-100 text-lime-800 border-lime-300 font-bold",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Descartado",
    badgeClass: "bg-neutral-100 text-neutral-600 border-neutral-200",
    icon: UserX,
  },
};

const DEPARTMENTS = [
  "ALL",
  "Ciencias y Matemáticas",
  "Educación Primaria",
  "Idiomas / Inglés",
  "Tecnología e Informática",
  "Humanidades y Ciencias Sociales",
  "Artes y Educación Física",
];

export default function StaffApplicationsPage() {
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  // Detail Modal
  const [detailCandidate, setDetailCandidate] = useState<StaffApplication | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Hire Modal
  const [hireCandidate, setHireCandidate] = useState<StaffApplication | null>(null);
  const [hireSalary, setHireSalary] = useState<number>(22000);
  const [hireStartDate, setHireStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [hireUsername, setHireUsername] = useState<string>("");
  const [isSubmittingHire, setIsSubmittingHire] = useState(false);
  const [hireError, setHireError] = useState<string | null>(null);

  // Hired Success Modal
  const [hiredResult, setHiredResult] = useState<HireStaffResult | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await staffService.getApplications({
        schoolCode: "ESC002",
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        department: selectedDept !== "ALL" ? selectedDept : undefined,
        search: searchQuery || undefined,
      });
      if (res && res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error("Error fetching staff applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus, selectedDept]);

  // Handle live search with simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === "PENDING").length;
    const inProcess = applications.filter(
      (a) => a.status === "SHORTLISTED" || a.status === "INTERVIEWED"
    ).length;
    const hired = applications.filter((a) => a.status === "HIRED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;
    return { total, pending, inProcess, hired, rejected };
  }, [applications]);

  // Open Hire Dialog
  const handleOpenHire = (candidate: StaffApplication) => {
    setHireCandidate(candidate);
    setHireSalary(candidate.expectedSalary ? Number(candidate.expectedSalary) : 22000);
    setHireStartDate(new Date().toISOString().split("T")[0]);
    // Generate suggested username: firstname.lastname
    const cleanFirst = candidate.firstName.toLowerCase().trim().split(" ")[0].replace(/[^a-z]/g, "");
    const cleanLast = candidate.lastName.toLowerCase().trim().split(" ")[0].replace(/[^a-z]/g, "");
    setHireUsername(`${cleanFirst}.${cleanLast}`);
    setHireError(null);
  };

  // Submit Hire
  const handleConfirmHire = async () => {
    if (!hireCandidate) return;
    try {
      setIsSubmittingHire(true);
      setHireError(null);
      const res = await staffService.hire(hireCandidate.id, {
        baseSalary: Number(hireSalary),
        startDate: hireStartDate,
        username: hireUsername.trim() || undefined,
      });

      if (res.status && res.data) {
        setHiredResult(res.data);
        setHireCandidate(null);
        setDetailCandidate(null);
        fetchApplications();
      } else {
        setHireError(res.message || "Error al procesar la contratación.");
      }
    } catch (err: any) {
      setHireError(err.message || "Ocurrió un error inesperado al contratar al docente.");
    } finally {
      setIsSubmittingHire(false);
    }
  };

  // Update Status from Detail modal
  const handleUpdateStatus = async (status: string) => {
    if (!detailCandidate) return;
    try {
      setIsUpdatingStatus(true);
      const res = await staffService.updateStatus(
        detailCandidate.id,
        status,
        adminNotesInput
      );
      if (res.status && res.data) {
        setDetailCandidate(res.data);
        fetchApplications();
      }
    } catch (err: any) {
      alert("Error al actualizar estado: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyCredentials = () => {
    if (!hiredResult) return;
    const text = `Credenciales de Acceso Docente - Sistema Escolar
Usuario: ${hiredResult.username}
Contraseña Temporal: ${hiredResult.tempPassword}
Código de Empleado: ${hiredResult.userCode}
Puesto: ${hiredResult.positionApplied}
Salario Base: L. ${Number(hiredResult.baseSalary).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">
              Bolsa de Empleo y Reclutamiento Docente
            </h1>
            <Badge variant="outline" className="bg-lime-50 text-lime-800 border-lime-300 text-xs font-bold">
              Staff HR Pro
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Recepción curricular, pipeline de evaluación de candidatos y alta oficial con 1 clic en plantilla docente.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/careers" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold gap-1.5 border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              <ExternalLink className="size-3.5" />
              <span>Ver Portal Público de Empleo</span>
            </Button>
          </Link>
          <Button
            onClick={fetchApplications}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <RotateCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 bg-white shadow-2xs border-neutral-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Postulantes
            </span>
            <div className="size-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1.5">
            {metrics.total}
          </div>
          <p className="text-[10px] text-neutral-500 mt-0.5">Expedientes recibidos</p>
        </Card>

        <Card className="p-4 bg-white shadow-2xs border-neutral-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              En Revisión
            </span>
            <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1.5">
            {metrics.pending}
          </div>
          <p className="text-[10px] text-neutral-500 mt-0.5">Por clasificar</p>
        </Card>

        <Card className="p-4 bg-white shadow-2xs border-neutral-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              En Proceso
            </span>
            <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <Sparkles className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1.5">
            {metrics.inProcess}
          </div>
          <p className="text-[10px] text-neutral-500 mt-0.5">Preselección & Entrevista</p>
        </Card>

        <Card className="p-4 bg-white shadow-2xs border-neutral-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-lime-600 uppercase tracking-wider">
              Contratados
            </span>
            <div className="size-7 rounded-lg bg-lime-50 flex items-center justify-center text-lime-800">
              <UserCheck className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-lime-900 mt-1.5">
            {metrics.hired}
          </div>
          <p className="text-[10px] text-neutral-500 mt-0.5">Docentes incorporados</p>
        </Card>

        <Card className="p-4 bg-white shadow-2xs border-neutral-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Descartados
            </span>
            <div className="size-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">
              <UserX className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-600 mt-1.5">
            {metrics.rejected}
          </div>
          <p className="text-[10px] text-neutral-500 mt-0.5">No seleccionados</p>
        </Card>
      </div>

      {/* CONTROLS BAR: STATUS TABS, DEPT & SEARCH */}
      <Card className="p-4 bg-white shadow-2xs border-neutral-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: "ALL", label: "Todos" },
              { id: "PENDING", label: "En Revisión" },
              { id: "SHORTLISTED", label: "Preseleccionados" },
              { id: "INTERVIEWED", label: "Entrevistados" },
              { id: "HIRED", label: "Contratados" },
              { id: "REJECTED", label: "Descartados" },
            ].map((tab) => {
              const active = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search and Dept Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Department Select */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 rounded-xl border border-neutral-200 bg-white text-xs font-semibold px-3 text-neutral-800 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="ALL">Todos los Departamentos</option>
              {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
              <Input
                placeholder="Buscar por candidato, DNI o N°..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs bg-neutral-50/50 border-neutral-200 w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* APPLICANTS TABLE */}
      <Card className="p-0 overflow-hidden shadow-2xs border-neutral-200/80">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Expedientes de Candidatos ({applications.length})
            </h3>
            <p className="text-[11px] text-neutral-500">
              Gestión curricular de postulantes a plazas docentes y administrativas.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando postulaciones docentes...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <Briefcase className="size-10 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No se encontraron expedientes</p>
            <p className="text-xs text-neutral-500 max-w-sm">
              No hay postulaciones registradas que coincidan con los filtros aplicados.
            </p>
            {(selectedStatus !== "ALL" || selectedDept !== "ALL" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStatus("ALL");
                  setSelectedDept("ALL");
                  setSearchQuery("");
                }}
                className="rounded-xl mt-2 text-xs font-bold"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/70 border-b border-neutral-100">
                <TableRow>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">N° Expediente</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Candidato / Identidad</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Cargo & Departamento</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Grado / Experiencia</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Pretensión</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estado</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((cand) => {
                  const cfg = STATUS_CONFIG[cand.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  const isHired = cand.status === "HIRED";

                  return (
                    <TableRow key={cand.id} className="hover:bg-neutral-50/80 transition-colors">
                      <TableCell className="py-3">
                        <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                          {cand.applicationNumber}
                        </span>
                        <div className="text-[10px] text-neutral-400 mt-1">
                          {new Date(cand.createdAt).toLocaleDateString("es-HN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-neutral-900 text-lime-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {cand.firstName?.[0]}{cand.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 text-sm">
                              {cand.firstName} {cand.lastName}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              DNI: {cand.identityNumber}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                              <span className="flex items-center gap-0.5">
                                <Mail className="size-2.5" />
                                {cand.email}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Phone className="size-2.5" />
                                {cand.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="font-bold text-xs text-neutral-800">
                          {cand.positionApplied}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                          <Building className="size-3 text-neutral-400" />
                          <span>{cand.department}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="text-xs font-semibold text-neutral-700">
                          {cand.highestDegree || "Título Universitario"}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                          <Briefcase className="size-3 text-neutral-400" />
                          <span>{cand.yearsOfExperience} años exp.</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="text-xs font-bold text-neutral-900">
                          {cand.expectedSalary
                            ? `L. ${Number(cand.expectedSalary).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
                            : "A convenir"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-bold px-2 py-0.5 flex items-center gap-1 w-fit rounded-lg border ${cfg.badgeClass}`}
                        >
                          <StatusIcon className="size-3" />
                          {cfg.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDetailCandidate(cand);
                              setAdminNotesInput(cand.adminNotes || "");
                            }}
                            className="rounded-xl text-xs font-bold h-8 px-2.5 gap-1 text-neutral-700 hover:bg-neutral-100"
                          >
                            <Eye className="size-3.5" />
                            <span>Expediente</span>
                          </Button>

                          {!isHired ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenHire(cand)}
                              className="rounded-xl text-xs font-bold h-8 px-3 gap-1 bg-lime-600 hover:bg-lime-700 text-white shadow-2xs"
                            >
                              <UserCheck className="size-3.5" />
                              <span>Contratar</span>
                            </Button>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-lime-50 text-lime-800 border-lime-300 text-[10px] font-bold h-8 px-2 flex items-center gap-1"
                            >
                              <CheckCircle2 className="size-3 text-lime-600" />
                              <span>Alta Oficial</span>
                            </Badge>
                          )}
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

      {/* DETAIL & STATUS EVALUATION MODAL */}
      <Dialog open={!!detailCandidate} onOpenChange={(open) => !open && setDetailCandidate(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-6">
          {detailCandidate && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-neutral-100 px-2.5 py-1 rounded-md text-neutral-700 border border-neutral-200">
                    Expediente: {detailCandidate.applicationNumber}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold px-2.5 py-0.5 ${STATUS_CONFIG[detailCandidate.status]?.badgeClass}`}
                  >
                    {STATUS_CONFIG[detailCandidate.status]?.label}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-black text-neutral-900 mt-2">
                  {detailCandidate.firstName} {detailCandidate.lastName}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  {detailCandidate.positionApplied} · {detailCandidate.department}
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Candidate Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Cédula / DNI
                    </span>
                    <span className="font-mono font-bold text-neutral-800">
                      {detailCandidate.identityNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Teléfono
                    </span>
                    <span className="font-bold text-neutral-800">{detailCandidate.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Email
                    </span>
                    <span className="font-semibold text-neutral-800 truncate block">
                      {detailCandidate.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Grado Académico
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {detailCandidate.highestDegree || "No especificado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Experiencia
                    </span>
                    <span className="font-bold text-neutral-800">
                      {detailCandidate.yearsOfExperience} años
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Pretensión Salarial
                    </span>
                    <span className="font-bold text-lime-700">
                      {detailCandidate.expectedSalary
                        ? `L. ${Number(detailCandidate.expectedSalary).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`
                        : "A convenir"}
                    </span>
                  </div>
                </div>

                {/* Profile Bio */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-700 mb-1">
                    Resumen Profesional / Perfil Docente:
                  </h4>
                  <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200/70 whitespace-pre-wrap leading-relaxed">
                    {detailCandidate.bio || "El postulante no proporcionó una descripción adicional."}
                  </p>
                </div>

                {/* Resume URL */}
                {detailCandidate.resumeUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-200/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <FileText className="size-4 text-blue-600" />
                      <span>Curriculum Vitae Adjunto</span>
                    </div>
                    <a
                      href={detailCandidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
                    >
                      <span>Abrir Documento</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}

                {/* Admin notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Notas y Observaciones de Selección (RRHH):
                  </Label>
                  <textarea
                    rows={3}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Comentarios de entrevista técnica, referencias laborales, acuerdos salariales..."
                    className="w-full text-xs rounded-xl border border-neutral-200 p-3 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                  />
                </div>

                {/* Pipeline Progression Buttons */}
                <div className="border-t border-neutral-200 pt-3">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                    Actualizar Fase del Candidato:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingStatus || detailCandidate.status === "SHORTLISTED"}
                      onClick={() => handleUpdateStatus("SHORTLISTED")}
                      className="rounded-xl text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
                    >
                      <Sparkles className="size-3 mr-1" />
                      Preseleccionar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingStatus || detailCandidate.status === "INTERVIEWED"}
                      onClick={() => handleUpdateStatus("INTERVIEWED")}
                      className="rounded-xl text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      <Calendar className="size-3 mr-1" />
                      Marcar Entrevistado
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingStatus || detailCandidate.status === "REJECTED"}
                      onClick={() => handleUpdateStatus("REJECTED")}
                      className="rounded-xl text-xs font-bold text-red-700 border-red-200 hover:bg-red-50"
                    >
                      <UserX className="size-3 mr-1" />
                      Descartar Postulante
                    </Button>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="border-t border-neutral-200 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setDetailCandidate(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cerrar
                </Button>
                {detailCandidate.status !== "HIRED" && (
                  <Button
                    onClick={() => {
                      const cand = detailCandidate;
                      setDetailCandidate(null);
                      handleOpenHire(cand);
                    }}
                    className="rounded-xl text-xs font-bold bg-lime-600 hover:bg-lime-700 text-white gap-1"
                  >
                    <UserCheck className="size-3.5" />
                    <span>Proceder a Contratación</span>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 1-CLICK HIRE TEACHER DIALOG */}
      <Dialog open={!!hireCandidate} onOpenChange={(open) => !open && setHireCandidate(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          {hireCandidate && (
            <>
              <DialogHeader>
                <div className="size-10 rounded-2xl bg-lime-100 text-lime-800 flex items-center justify-center mb-1">
                  <UserCheck className="size-5" />
                </div>
                <DialogTitle className="text-lg font-black text-neutral-900">
                  Alta Oficial de Docente
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Convertir al aspirante {hireCandidate.firstName} {hireCandidate.lastName} en miembro activo de la institución con rol TEACHER.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4">
                {hireError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{hireError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Cargo Postulado:</span>
                    <span className="font-bold text-neutral-900">{hireCandidate.positionApplied}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Departamento:</span>
                    <span className="font-bold text-neutral-900">{hireCandidate.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Cédula / DNI:</span>
                    <span className="font-mono font-bold text-neutral-900">{hireCandidate.identityNumber}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Salario Base Mensual (HNL) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                        L.
                      </span>
                      <Input
                        type="number"
                        step="100"
                        min="0"
                        value={hireSalary}
                        onChange={(e) => setHireSalary(Number(e.target.value))}
                        className="pl-8 h-10 rounded-xl text-xs font-bold"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Se registrará en el tabulador de salarios de empleados de la institución.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Fecha de Inicio de Contrato <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={hireStartDate}
                      onChange={(e) => setHireStartDate(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-neutral-700">
                      Nombre de Usuario del Sistema
                    </Label>
                    <Input
                      type="text"
                      value={hireUsername}
                      onChange={(e) => setHireUsername(e.target.value)}
                      placeholder="ej. elena.vasquez"
                      className="h-10 rounded-xl text-xs font-mono"
                    />
                    <p className="text-[11px] text-neutral-400">
                      La contraseña temporal por defecto será <span className="font-mono font-bold">123456</span>.
                    </p>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="border-t border-neutral-200 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setHireCandidate(null)}
                  disabled={isSubmittingHire}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmHire}
                  disabled={isSubmittingHire || !hireSalary}
                  className="rounded-xl text-xs font-bold bg-lime-600 hover:bg-lime-700 text-white gap-1.5 px-4 shadow-xs"
                >
                  {isSubmittingHire ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Procesando Contratación...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-3.5" />
                      <span>Confirmar Alta y Crear Usuario</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* HIRED SUCCESS & CREDENTIALS MODAL */}
      <Dialog open={!!hiredResult} onOpenChange={(open) => !open && setHiredResult(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center">
          {hiredResult && (
            <>
              <div className="size-14 rounded-full bg-lime-100 text-lime-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="size-7" />
              </div>

              <DialogTitle className="text-xl font-black text-neutral-900">
                ¡Docente Contratado Exitosamente!
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 mt-1">
                Se ha generado el expediente de usuario y cuenta de acceso oficial para {hiredResult.fullName}.
              </DialogDescription>

              <div className="mt-5 p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Código Docente:</span>
                  <span className="font-mono font-black text-neutral-900 bg-neutral-200/60 px-2 py-0.5 rounded">
                    {hiredResult.userCode}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Usuario de Acceso:</span>
                  <span className="font-mono font-bold text-neutral-900">{hiredResult.username}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Contraseña Provisional:</span>
                  <span className="font-mono font-bold text-lime-700 bg-lime-50 px-2 py-0.5 rounded border border-lime-200">
                    {hiredResult.tempPassword}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Rol Institucional:</span>
                  <Badge variant="outline" className="bg-lime-100 text-lime-800 border-lime-300 font-bold text-[10px]">
                    {hiredResult.role}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Salario Base:</span>
                  <span className="font-bold text-neutral-900">
                    L. {Number(hiredResult.baseSalary).toLocaleString("es-HN", { minimumFractionDigits: 2 })} / mes
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2">
                <Button
                  onClick={copyCredentials}
                  variant="outline"
                  className="rounded-xl text-xs font-bold w-full sm:w-auto gap-1.5 border-neutral-300"
                >
                  {copiedKey ? <Check className="size-3.5 text-lime-600" /> : <Copy className="size-3.5" />}
                  <span>{copiedKey ? "Copiado al Portapapeles" : "Copiar Credenciales"}</span>
                </Button>
                <Link href="/school/teachers" className="w-full sm:w-auto">
                  <Button
                    onClick={() => setHiredResult(null)}
                    className="rounded-xl text-xs font-bold w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white gap-1.5"
                  >
                    <span>Ver en Directorio Docente</span>
                    <ExternalLink className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

