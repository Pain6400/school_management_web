"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Loader2,
  FileText,
  UserCheck,
  RefreshCw,
  Phone,
  Mail,
  Home,
  Calendar,
  AlertCircle,
  Eye,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  admissionsService,
  AdmissionApplication,
  ConvertedStudentResult,
} from "@/lib/services/admissions.service";

export default function AdmissionsManagementPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Detalle Modal State
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Conversión State
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [convertedResult, setConvertedResult] = useState<ConvertedStudentResult | null>(null);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Cargar aplicaciones
  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await admissionsService.getApplications();
      if (res && res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error("Error al cargar postulaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Filtrado
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus =
        selectedStatus === "ALL" || app.status === selectedStatus;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.applicationNumber.toLowerCase().includes(q) ||
        `${app.firstName} ${app.lastName}`.toLowerCase().includes(q) ||
        `${app.parentFirstName} ${app.parentLastName}`.toLowerCase().includes(q) ||
        (app.identityNumber && app.identityNumber.toLowerCase().includes(q)) ||
        app.parentIdentityNumber.toLowerCase().includes(q) ||
        app.gradeCode.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [applications, selectedStatus, searchQuery]);

  // Contadores para métricas
  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === "PENDING").length,
      inReview: applications.filter((a) => a.status === "IN_REVIEW").length,
      approved: applications.filter((a) => a.status === "APPROVED").length,
      enrolled: applications.filter((a) => a.status === "ENROLLED").length,
      rejected: applications.filter((a) => a.status === "REJECTED").length,
    };
  }, [applications]);

  // Abrir modal de detalle
  const handleOpenDetail = (app: AdmissionApplication) => {
    setSelectedApp(app);
    setAdminNotesInput(app.adminNotes || "");
    setDetailModalOpen(true);
  };

  // Cambiar estado
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      const res = await admissionsService.updateStatus(
        selectedApp.id,
        newStatus,
        adminNotesInput
      );
      if (res && res.data) {
        setSelectedApp(res.data);
        setApplications((prev) =>
          prev.map((a) => (a.id === res.data.id ? res.data : a))
        );
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Convertir a Estudiante Oficial
  const handleConvertToStudent = async (app: AdmissionApplication) => {
    setConvertingId(app.id);
    try {
      const res = await admissionsService.convertToStudent(app.id);
      if (res && res.data) {
        setConvertedResult(res.data);
        setConversionModalOpen(true);
        if (detailModalOpen) {
          setDetailModalOpen(false);
        }
        await loadApplications();
      }
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Error al convertir aspirante a estudiante."
      );
    } finally {
      setConvertingId(null);
    }
  };

  const copyCredentials = () => {
    if (!convertedResult) return;
    const text = `=== CREDENCIALES OFICIALES DE ACCESO ===\n` +
      `Estudiante: ${convertedResult.student.fullName}\n` +
      `Código: ${convertedResult.student.userCode}\n` +
      `Usuario: ${convertedResult.student.username}\n` +
      `Contraseña Temporal: ${convertedResult.student.temporaryPassword}\n\n` +
      `Tutor Legal: ${convertedResult.guardian.fullName}\n` +
      `Usuario Tutor: ${convertedResult.guardian.username}\n` +
      `Portal: http://localhost:3000/login\n` +
      `=========================================`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Admisiones & Postulaciones
            </h1>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold border-0">
              Ciclo 2026
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Recepción de expedientes de nuevo ingreso, validación de tutores y conversión automática en 1-clic a estudiante oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admissions" target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 text-xs font-semibold">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Formulario Público</span>
            </Button>
          </Link>
          <Link href="/application-status" target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 text-xs font-semibold">
              <Search className="w-3.5 h-3.5" />
              <span>Rastreador Público</span>
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={loadApplications}
            disabled={loading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card
          onClick={() => setSelectedStatus("ALL")}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === "ALL"
              ? "ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/20 border-blue-300"
              : "hover:border-neutral-300 dark:hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 dark:text-white">
            {counts.all}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Postulaciones registradas</p>
        </Card>

        <Card
          onClick={() => setSelectedStatus("PENDING")}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === "PENDING"
              ? "ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/20 border-amber-300"
              : "hover:border-neutral-300 dark:hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pendientes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {counts.pending}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Por revisar expediente</p>
        </Card>

        <Card
          onClick={() => setSelectedStatus("IN_REVIEW")}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === "IN_REVIEW"
              ? "ring-2 ring-sky-500 bg-sky-50/30 dark:bg-sky-950/20 border-sky-300"
              : "hover:border-neutral-300 dark:hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">En Revisión</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {counts.inReview}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Comité evaluando cupos</p>
        </Card>

        <Card
          onClick={() => setSelectedStatus("APPROVED")}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === "APPROVED"
              ? "ring-2 ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-300"
              : "hover:border-neutral-300 dark:hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Aprobadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {counts.approved}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Listas para matriculación</p>
        </Card>

        <Card
          onClick={() => setSelectedStatus("ENROLLED")}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === "ENROLLED"
              ? "ring-2 ring-purple-500 bg-purple-50/30 dark:bg-purple-950/20 border-purple-300"
              : "hover:border-neutral-300 dark:hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Matriculados</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {counts.enrolled}
          </div>
          <p className="text-xs text-neutral-400 mt-1">Estudiantes oficiales</p>
        </Card>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar por código, alumno, tutor o DNI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "Todas" },
              { id: "PENDING", label: "Pendientes" },
              { id: "IN_REVIEW", label: "En Revisión" },
              { id: "APPROVED", label: "Aprobadas" },
              { id: "ENROLLED", label: "Matriculadas" },
              { id: "REJECTED", label: "Rechazadas" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={selectedStatus === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus(tab.id)}
                className={`rounded-xl text-xs font-semibold h-8 px-3 ${
                  selectedStatus === tab.id
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabla de Postulaciones */}
      <Card className="rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-neutral-500 font-medium">Cargando solicitudes de admisión...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
              No se encontraron solicitudes
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No hay postulaciones que coincidan con "${searchQuery}".`
                : "No hay registros bajo el filtro de estado seleccionado."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-50">
                  <TableHead className="w-36 font-bold text-xs uppercase text-neutral-500">N° Solicitud</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-neutral-500">Aspirante</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-neutral-500">Grado</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-neutral-500">Tutor Responsable</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-neutral-500">Fecha Ingreso</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-neutral-500">Estado</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase text-neutral-500">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {app.applicationNumber}
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 block text-sm">
                          {app.firstName} {app.lastName}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {app.identityNumber ? `DNI: ${app.identityNumber}` : "Sin DNI registrado"} • {app.gender}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-semibold text-xs rounded-lg">
                        {app.gradeCode}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 block">
                          {app.parentFirstName} {app.parentLastName}
                        </span>
                        <span className="text-xs text-neutral-500 flex items-center gap-2">
                          <span>{app.parentRelationship}</span>
                          <span>•</span>
                          <span>{app.parentPhone}</span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-neutral-500">
                      {new Date(app.createdAt).toLocaleDateString("es-HN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell>
                      {app.status === "PENDING" && (
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold text-xs">
                          Pendiente
                        </Badge>
                      )}
                      {app.status === "IN_REVIEW" && (
                        <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold text-xs">
                          En Revisión
                        </Badge>
                      )}
                      {app.status === "APPROVED" && (
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs">
                          Aprobada
                        </Badge>
                      )}
                      {app.status === "ENROLLED" && (
                        <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold text-xs flex items-center gap-1 w-fit">
                          <GraduationCap className="w-3 h-3" />
                          Matriculado
                        </Badge>
                      )}
                      {app.status === "REJECTED" && (
                        <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-xs">
                          Rechazada
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(app)}
                          className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-neutral-500" />
                          Detalle
                        </Button>

                        {app.status !== "ENROLLED" ? (
                          <Button
                            size="sm"
                            disabled={convertingId === app.id}
                            onClick={() => handleConvertToStudent(app)}
                            className="h-8 px-3 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1"
                          >
                            {convertingId === app.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            <span>Matricular</span>
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-200 h-8 px-2.5 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Oficial
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal 1: Expediente Detallado de Admisión */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-6">
          {selectedApp && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs text-blue-600">
                    {selectedApp.applicationNumber}
                  </Badge>
                  <Badge className="text-xs font-semibold">
                    Estado: {selectedApp.status}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  Expediente de {selectedApp.firstName} {selectedApp.lastName}
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Registrado el {new Date(selectedApp.createdAt).toLocaleString("es-HN")} para el grado {selectedApp.gradeCode}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* 2 Columnas: Alumno y Tutor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tarjeta Alumno */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      Datos del Postulante
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-neutral-400 block">Nombre Completo:</span>
                        <strong className="text-neutral-800 dark:text-neutral-100 font-semibold text-sm">
                          {selectedApp.firstName} {selectedApp.lastName}
                        </strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-neutral-400 block">DNI:</span>
                          <span className="font-mono">{selectedApp.identityNumber || "No especificado"}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Género:</span>
                          <span>{selectedApp.gender}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-neutral-400 block">Fecha Nacimiento:</span>
                          <span>{new Date(selectedApp.dateOfBirth).toLocaleDateString("es-HN")}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Grado Aspirado:</span>
                          <span className="font-semibold text-blue-600">{selectedApp.gradeCode}</span>
                        </div>
                      </div>
                      {selectedApp.previousSchool && (
                        <div className="pt-1">
                          <span className="text-neutral-400 block">Escuela de Procedencia:</span>
                          <span>{selectedApp.previousSchool}</span>
                        </div>
                      )}
                      {selectedApp.address && (
                        <div className="pt-1">
                          <span className="text-neutral-400 block">Dirección de Residencia:</span>
                          <span>{selectedApp.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tarjeta Tutor */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Tutor Responsable
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-neutral-400 block">Nombre del Tutor:</span>
                        <strong className="text-neutral-800 dark:text-neutral-100 font-semibold text-sm">
                          {selectedApp.parentFirstName} {selectedApp.parentLastName}
                        </strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-neutral-400 block">DNI / Identidad:</span>
                          <span className="font-mono">{selectedApp.parentIdentityNumber}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Parentesco:</span>
                          <span className="font-semibold">{selectedApp.parentRelationship}</span>
                        </div>
                      </div>
                      <div className="pt-1">
                        <span className="text-neutral-400 block">Teléfono de Contacto:</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{selectedApp.parentPhone}</span>
                      </div>
                      <div className="pt-1">
                        <span className="text-neutral-400 block">Correo Electrónico:</span>
                        <span className="text-neutral-800 dark:text-neutral-200">{selectedApp.parentEmail}</span>
                      </div>
                      {selectedApp.notes && (
                        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <span className="text-neutral-400 block">Observaciones de la Familia:</span>
                          <p className="italic text-neutral-600 dark:text-neutral-400 mt-0.5">{selectedApp.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notas Administrativas y Modificación de Estado */}
                <div className="space-y-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                      Observaciones Administrativas / Entrevista:
                    </label>
                  </div>
                  <Textarea
                    placeholder="Escribe comentarios internos sobre el examen de admisión, entrevistas o documentos pendientes..."
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    rows={2}
                    className="text-xs rounded-xl bg-white dark:bg-neutral-900"
                  />

                  {/* Botones de Cambio Rápido de Estado */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-neutral-500 mr-1">Cambiar Estado:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus("IN_REVIEW")}
                      className="h-7 text-xs rounded-lg text-sky-700 border-sky-300 hover:bg-sky-50"
                    >
                      En Revisión
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus("APPROVED")}
                      className="h-7 text-xs rounded-lg text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus("REJECTED")}
                      className="h-7 text-xs rounded-lg text-rose-700 border-rose-300 hover:bg-rose-50"
                    >
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus("PENDING")}
                      className="h-7 text-xs rounded-lg text-neutral-600 hover:bg-neutral-100"
                    >
                      Restablecer a Pendiente
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-xl w-full sm:w-auto"
                >
                  Cerrar
                </Button>

                {selectedApp.status !== "ENROLLED" && (
                  <Button
                    onClick={() => handleConvertToStudent(selectedApp)}
                    disabled={convertingId === selectedApp.id}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {convertingId === selectedApp.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Matricular y Convertir en Estudiante Oficial</span>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Comprobante Oficial de Conversión / Credenciales Generadas */}
      <Dialog open={conversionModalOpen} onOpenChange={setConversionModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          {convertedResult && (
            <>
              <DialogHeader className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-2">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  ¡Aspirante Matriculado con Éxito!
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-neutral-500 mt-1">
                  Se ha generado la cuenta estudiantil oficial, creado y vinculado al tutor con rol PARENT en <code>family_relationships</code>, y actualizado el expediente a estado <strong>MATRICULADO</strong>.
                </DialogDescription>
              </DialogHeader>

              {/* Ficha de Credenciales Imprimible */}
              <div className="my-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Estudiante Oficial</span>
                    <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                      {convertedResult.student.fullName}
                    </h3>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-mono text-xs">
                    {convertedResult.student.userCode}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-neutral-400 block mb-0.5">Usuario del Alumno:</span>
                    <strong className="font-mono text-blue-600 dark:text-blue-400 text-sm">
                      {convertedResult.student.username}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-neutral-400 block mb-0.5">Contraseña Temporal:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {convertedResult.student.temporaryPassword}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-neutral-400 block mb-0.5">Tutor Legal Vinculado:</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-neutral-800 dark:text-neutral-100 font-semibold">
                        {convertedResult.guardian.fullName}
                      </strong>
                      <span className="text-neutral-500 block font-mono text-[11px]">
                        Usuario: {convertedResult.guardian.username} • Tel: {convertedResult.guardian.phone}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      Rol: PARENT
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={copyCredentials}
                  className="rounded-xl w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>¡Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Credenciales</span>
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="rounded-xl flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir</span>
                  </Button>
                  <Button
                    onClick={() => setConversionModalOpen(false)}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1 sm:flex-initial text-xs"
                  >
                    Entendido
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

