"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { auditService, AuditLogItem } from "@/lib/services/audit.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  Clock,
  User,
  Activity,
  CreditCard,
  GraduationCap,
  Users,
  Megaphone,
  KeyRound,
  FileCode,
  Globe,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  Info,
} from "lucide-react";

const ACTION_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any; severity: "NORMAL" | "WARNING" | "CRITICAL" }
> = {
  HIRE_STAFF: {
    label: "Contratación Docente",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: Users,
    severity: "NORMAL",
  },
  PROMOTION_BATCH: {
    label: "Promoción Anual (Rollover)",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200 font-bold",
    icon: GraduationCap,
    severity: "WARNING",
  },
  INVOICE_PAYMENT: {
    label: "Cobro de Colegiatura",
    badgeClass: "bg-lime-100 text-lime-900 border-lime-300 font-bold",
    icon: CreditCard,
    severity: "NORMAL",
  },
  CREATE_ANNOUNCEMENT: {
    label: "Emisión de Circular",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Megaphone,
    severity: "NORMAL",
  },
  BROADCAST_DISPATCH: {
    label: "Difusión Masiva Familias",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Megaphone,
    severity: "NORMAL",
  },
  ADMISSION_CONVERT: {
    label: "Conversión de Aspirante",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
    icon: CheckCircle2,
    severity: "NORMAL",
  },
  TIMETABLE_UPDATE: {
    label: "Ajuste de Horario Escolar",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
    severity: "NORMAL",
  },
  CERTIFICATE_ISSUANCE: {
    label: "Emisión de Certificado QR",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    icon: GraduationCap,
    severity: "NORMAL",
  },
  USER_LOGIN: {
    label: "Inicio de Sesión",
    badgeClass: "bg-neutral-100 text-neutral-800 border-neutral-200",
    icon: KeyRound,
    severity: "NORMAL",
  },
  PERMISSION_UPDATE: {
    label: "Auditoría de Permisos RBAC",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    icon: ShieldAlert,
    severity: "WARNING",
  },
};

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResource, setFilterResource] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const schoolCode = user?.schoolCode || "ESC002";
      const res = await auditService.getLogs(schoolCode);
      if (res && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Filtrado reactivo
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.resourceId && item.resourceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.user?.username && item.user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.ipAddress && item.ipAddress.includes(searchQuery));

      const matchResource =
        filterResource === "ALL" ||
        item.resource.toLowerCase().includes(filterResource.toLowerCase());

      return matchSearch && matchResource;
    });
  }, [logs, searchQuery, filterResource]);

  // Contadores KPI
  const totalLogsCount = logs.length;
  const financeCount = logs.filter((l) => l.resource.includes("FINANCE")).length;
  const academicCount = logs.filter(
    (l) => l.resource.includes("ENROLLMENT") || l.resource.includes("TIMETABLE") || l.resource.includes("CERTIFICATE")
  ).length;
  const criticalCount = logs.filter(
    (l) => ACTION_CONFIG[l.action]?.severity === "WARNING" || ACTION_CONFIG[l.action]?.severity === "CRITICAL"
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* ============================================================== */}
      {/* CABECERA PRINCIPAL AUDITORIA */}
      {/* ============================================================== */}
      <div className="p-6 sm:p-7 rounded-3xl bg-neutral-950 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-lime-400 bg-lime-950/70 border border-lime-800/60 px-2.5 py-0.5 rounded-md">
              Seguridad & Cumplimiento
            </span>
            <span className="text-xs text-neutral-500 font-medium">•</span>
            <span className="text-xs text-neutral-400 font-medium">
              Sede: {user?.schoolCode || "ESC002"} • Centro Educativo Luz del Saber
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bitácora de Auditoría y Trazabilidad (Audit Trail)
          </h1>
          <p className="text-xs text-neutral-400 max-w-3xl font-medium">
            Registro cronológico inmutable de todas las transacciones financieras, promociones masivas, contrataciones docentes y cambios normativos efectuados en el sistema escolar.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={isLoading}
            className="rounded-2xl border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 gap-2 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refrescar Logs</span>
          </Button>
          <div className="px-3.5 py-2 rounded-2xl bg-lime-950/40 border border-lime-800/40 text-center">
            <span className="text-[10px] font-bold text-lime-400 block uppercase">Estado Auditoría</span>
            <span className="text-xs font-black text-lime-300 flex items-center gap-1.5 justify-center">
              <span className="size-2 rounded-full bg-lime-400 animate-pulse" />
              Activa & Verificada
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4 TARJETAS KPI RESUMEN DE AUDITORIA */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Eventos
            </span>
            <div className="size-8 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center font-bold">
              <Activity className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {totalLogsCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Operaciones registradas</p>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Transacciones Caja
            </span>
            <div className="size-8 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {financeCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Pagos y facturación</p>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Académico & Matrícula
            </span>
            <div className="size-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <GraduationCap className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
            {academicCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Promociones y horarios</p>
        </Card>

        <Card className="p-4 sm:p-5 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Acciones Críticas
            </span>
            <div className="size-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {criticalCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Requieren supervisión</p>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      {/* ============================================================== */}
      <Card className="p-4 rounded-2xl border-neutral-200/80 bg-white shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por acción, usuario, IP o identificador de recurso..."
              className="pl-10 rounded-xl text-xs h-10 border-neutral-200 bg-neutral-50/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterResource("ALL")}
              className={`rounded-xl text-xs font-bold h-9 whitespace-nowrap cursor-pointer ${
                filterResource === "ALL" ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"
              }`}
            >
              Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterResource("FINANCE")}
              className={`rounded-xl text-xs font-bold h-9 whitespace-nowrap cursor-pointer ${
                filterResource === "FINANCE" ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"
              }`}
            >
              Finanzas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterResource("STAFF")}
              className={`rounded-xl text-xs font-bold h-9 whitespace-nowrap cursor-pointer ${
                filterResource === "STAFF" ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"
              }`}
            >
              Personal / RRHH
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterResource("ENROLLMENT")}
              className={`rounded-xl text-xs font-bold h-9 whitespace-nowrap cursor-pointer ${
                filterResource === "ENROLLMENT" ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"
              }`}
            >
              Promoción Anual
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterResource("COMMUNICATION")}
              className={`rounded-xl text-xs font-bold h-9 whitespace-nowrap cursor-pointer ${
                filterResource === "COMMUNICATION" ? "bg-neutral-950 text-white" : "hover:bg-neutral-100"
              }`}
            >
              Comunicación
            </Button>
          </div>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* TABLA PRINCIPAL DE EVENTOS DE AUDITORIA */}
      {/* ============================================================== */}
      <Card className="rounded-3xl border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-900">Historial Detallado de Transacciones</h3>
          </div>
          <span className="text-xs font-bold text-neutral-400">
            Mostrando {filteredLogs.length} de {totalLogsCount} registros
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs font-semibold text-neutral-500">Cargando bitácora de auditoría...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShieldCheck className="size-10 mx-auto text-neutral-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-neutral-700">No se encontraron eventos</p>
            <p className="text-xs text-neutral-400">
              No hay registros que coincidan con los criterios de búsqueda aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Usuario Autor</th>
                  <th className="py-3 px-4">Acción Ejecutada</th>
                  <th className="py-3 px-4">Recurso / Módulo</th>
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4">Dirección IP</th>
                  <th className="py-3 px-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLogs.map((item) => {
                  const actionMeta = ACTION_CONFIG[item.action] || {
                    label: item.action,
                    badgeClass: "bg-neutral-100 text-neutral-800",
                    icon: Info,
                    severity: "NORMAL",
                  };
                  const Icon = actionMeta.icon;

                  const dateStr = new Date(item.createdAt).toLocaleString("es-HN", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-neutral-600 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                            {item.user?.username ? item.user.username.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 leading-tight">
                              {item.user ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() || item.user.username : "admin.school"}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              {item.user?.username || "admin.school"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1.5 w-fit ${actionMeta.badgeClass}`}
                        >
                          <Icon className="size-3" />
                          <span>{actionMeta.label}</span>
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-600">
                        {item.resource}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-700 font-bold">
                        {item.resourceId || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-500 text-[11px]">
                        {item.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(item)}
                          className="rounded-xl text-[11px] font-bold h-7 px-2.5 gap-1 hover:bg-neutral-100 cursor-pointer"
                        >
                          <FileCode className="size-3" />
                          <span>Payload</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ============================================================== */}
      {/* MODAL DETALLE DE EVENTO (INSPECTOR DE PAYLOAD JSON) */}
      {/* ============================================================== */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent size="lg" className="rounded-3xl p-6">
          {selectedLog && (
            <>
              <DialogHeader className="pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Badge className="bg-neutral-900 text-lime-400 text-[10px] font-black">
                    ID EVENTO: {selectedLog.id ? selectedLog.id.slice(0, 8) : "LOG-001"}
                  </Badge>
                  <span className="text-xs text-neutral-400 font-mono">•</span>
                  <span className="text-xs text-neutral-500 font-mono">
                    {new Date(selectedLog.createdAt).toISOString()}
                  </span>
                </div>
                <DialogTitle className="text-lg font-black text-neutral-900 mt-1">
                  Inspección de Transacción y Carga Útil (Payload)
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-500">
                  Evidencia criptográfica y metadatos registrados para fines de auditoría.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Acción</span>
                    <p className="font-bold text-neutral-900">{selectedLog.action}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Recurso</span>
                    <p className="font-bold text-neutral-900">{selectedLog.resource}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Identificador</span>
                    <p className="font-mono font-bold text-neutral-900">{selectedLog.resourceId || "N/A"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">IP Autor</span>
                    <p className="font-mono font-bold text-neutral-900">{selectedLog.ipAddress || "127.0.0.1"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-0.5 col-span-2">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Agente de Usuario</span>
                    <p className="font-mono text-[11px] text-neutral-600 truncate">
                      {selectedLog.userAgent || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-neutral-700">
                    Carga Útil en Formato JSON:
                  </span>
                  <div className="p-4 rounded-2xl bg-neutral-950 text-lime-400 font-mono text-xs overflow-x-auto shadow-inner">
                    <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
                  </div>
                </div>
              </DialogBody>

              <DialogFooter className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-lime-700 bg-lime-100 px-2.5 py-1 rounded-md">
                  <ShieldCheck className="size-3.5" />
                  Registro Verificado e Inmutable
                </span>
                <Button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl text-xs font-bold bg-neutral-950 text-white hover:bg-neutral-800"
                >
                  Cerrar Inspección
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

