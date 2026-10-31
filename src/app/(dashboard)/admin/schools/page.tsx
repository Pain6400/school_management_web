"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  schoolsService, SaasOverviewData, SaasSchoolItem, RegisterSchoolPaymentPayload
} from "@/lib/services/schools.service";
import {
  Loader2, Plus, Trash2, Building2, Search, AlertCircle, Edit,
  CreditCard, CheckCircle2, AlertTriangle, Clock, Receipt, RefreshCw,
  Power, Check, Calendar, ArrowUpRight, DollarSign, Users, ChevronRight
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogBody, DialogFooter,
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

const INITIAL_PAYMENT_FORM: RegisterSchoolPaymentPayload = {
  amountPaid: 99.99,
  paymentMethod: "TRANSFERENCIA",
  transactionReference: "",
  paymentDate: new Date().toISOString().split("T")[0],
  monthsToAdd: 12,
  notes: "",
};

export default function SchoolsManagementPage() {
  const [data, setData] = useState<SaasOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UP_TO_DATE" | "EXPIRING_SOON" | "OVERDUE" | "INACTIVE">("ALL");

  // Create / Edit School Modal State
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
  const [isSubmittingSchool, setIsSubmittingSchool] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  // Register Payment Modal State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedSchoolForPayment, setSelectedSchoolForPayment] = useState<SaasSchoolItem | null>(null);
  const [paymentFormData, setPaymentFormData] = useState<RegisterSchoolPaymentPayload>(INITIAL_PAYMENT_FORM);

  // Payment History Modal State
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedSchoolForHistory, setSelectedSchoolForHistory] = useState<SaasSchoolItem | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await schoolsService.getSaasOverview();
      if (res.status && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error loading SaaS overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    if (!data?.schools) return [];
    return data.schools.filter((s) => {
      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        s.plan.name.toLowerCase().includes(q);

      // Status Filter
      let matchStatus = true;
      if (statusFilter === "UP_TO_DATE") matchStatus = s.status && s.subscription.debtStatus === "UP_TO_DATE";
      if (statusFilter === "EXPIRING_SOON") matchStatus = s.status && s.subscription.debtStatus === "EXPIRING_SOON";
      if (statusFilter === "OVERDUE") matchStatus = s.status && s.subscription.debtStatus === "OVERDUE";
      if (statusFilter === "INACTIVE") matchStatus = !s.status || s.subscription.debtStatus === "INACTIVE";

      return matchSearch && matchStatus;
    });
  }, [data, searchQuery, statusFilter]);

  // Counts for filters
  const counts = useMemo(() => {
    if (!data?.schools) return { all: 0, upToDate: 0, expiring: 0, overdue: 0, inactive: 0 };
    return {
      all: data.schools.length,
      upToDate: data.schools.filter(s => s.status && s.subscription.debtStatus === "UP_TO_DATE").length,
      expiring: data.schools.filter(s => s.status && s.subscription.debtStatus === "EXPIRING_SOON").length,
      overdue: data.schools.filter(s => s.status && s.subscription.debtStatus === "OVERDUE").length,
      inactive: data.schools.filter(s => !s.status || s.subscription.debtStatus === "INACTIVE").length,
    };
  }, [data]);

  // Open Create School
  const handleOpenCreate = () => {
    setEditingCode(null);
    setFormData(INITIAL_FORM);
    setSchoolError(null);
    setIsSchoolDialogOpen(true);
  };

  // Open Edit School
  const handleOpenEdit = (school: SaasSchoolItem) => {
    setEditingCode(school.code);
    setFormData({
      code: school.code,
      planCode: school.plan.code || "BASIC",
      name: school.name,
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      status: school.status !== undefined ? school.status : true,
    });
    setSchoolError(null);
    setIsSchoolDialogOpen(true);
  };

  // Submit Create / Edit School
  const handleSubmitSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolError(null);
    try {
      setIsSubmittingSchool(true);
      let res;
      if (editingCode) {
        res = await schoolsService.updateSchool(editingCode, formData);
      } else {
        res = await schoolsService.createSchool(formData);
      }

      if (res.status) {
        setIsSchoolDialogOpen(false);
        fetchOverview();
      } else {
        setSchoolError(res.message || "Error al procesar la solicitud");
      }
    } catch (err: any) {
      setSchoolError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmittingSchool(false);
    }
  };

  // Open Register Payment Modal
  const handleOpenRegisterPayment = (school: SaasSchoolItem) => {
    setSelectedSchoolForPayment(school);
    setPaymentFormData({
      amountPaid: school.plan.price > 0 ? school.plan.price : 99.99,
      paymentMethod: "TRANSFERENCIA",
      transactionReference: `TRX-SAAS-${school.code}-${new Date().getFullYear()}`,
      paymentDate: new Date().toISOString().split("T")[0],
      monthsToAdd: 12,
      notes: `Renovación anual plan ${school.plan.name}`,
    });
    setPaymentError(null);
    setIsPaymentDialogOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForPayment) return;
    setPaymentError(null);
    try {
      setIsSubmittingPayment(true);
      const res = await schoolsService.registerSchoolPayment(selectedSchoolForPayment.code, paymentFormData);
      if (res.status) {
        setIsPaymentDialogOpen(false);
        fetchOverview();
      } else {
        setPaymentError(res.message || "Error al registrar el pago");
      }
    } catch (err: any) {
      setPaymentError(err.message || "Error al procesar el pago");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Open History Modal
  const handleOpenHistory = (school: SaasSchoolItem) => {
    setSelectedSchoolForHistory(school);
    setIsHistoryDialogOpen(true);
  };

  // Toggle School Status (Suspend / Reactivate)
  const handleToggleStatus = async (school: SaasSchoolItem) => {
    const actionName = school.status ? "suspender" : "reactivar";
    if (!confirm(`¿Deseas ${actionName} el acceso de la institución "${school.name}" (${school.code})?`)) return;

    try {
      await schoolsService.toggleSchoolStatus(school.code, !school.status);
      fetchOverview();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado de la escuela.");
    }
  };

  // Delete School
  const handleDelete = async (code: string) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente la escuela ${code}?`)) return;
    try {
      await schoolsService.deleteSchool(code);
      fetchOverview();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Gestión de Escuelas & Suscripciones SaaS
            </h2>
            <Badge className="bg-neutral-950 text-lime-400 font-bold border border-lime-400/40">
              Tenants & Facturación
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Supervisa los alumnos inscritos, planes contratados, cobros y el estado de mora de cada escuela cliente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
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
            <span>Nueva Escuela</span>
          </Button>
        </div>
      </div>

      {/* FILTER BUTTONS PILLS */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === "ALL"
              ? "bg-neutral-900 text-white shadow-xs"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
        >
          Todas ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("UP_TO_DATE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === "UP_TO_DATE"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
            }`}
        >
          <CheckCircle2 className="size-3.5" />
          Al Día ({counts.upToDate})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("EXPIRING_SOON")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === "EXPIRING_SOON"
              ? "bg-amber-500 text-white shadow-xs"
              : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
            }`}
        >
          <Clock className="size-3.5" />
          Por Vencer ({counts.expiring})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("OVERDUE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === "OVERDUE"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
            }`}
        >
          <AlertTriangle className="size-3.5" />
          En Mora ({counts.overdue})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("INACTIVE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === "INACTIVE"
              ? "bg-neutral-600 text-white shadow-xs"
              : "bg-white text-neutral-500 border border-neutral-200 hover:bg-neutral-50"
            }`}
        >
          <Power className="size-3.5" />
          Inactivas ({counts.inactive})
        </button>
      </div>

      {/* TABLE CARD */}
      <Card className="rounded-3xl border-neutral-200/90 shadow-xs overflow-hidden">
        {/* SEARCH BAR */}
        <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              placeholder="Buscar escuela por nombre, código o plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-xs h-10 bg-white"
            />
          </div>
          <div className="text-xs text-neutral-500 font-medium">
            Mostrando <strong>{filteredSchools.length}</strong> de <strong>{data?.schools.length || 0}</strong> instituciones
          </div>
        </div>

        {/* LOADING OR EMPTY */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-2">
            <Loader2 className="size-8 animate-spin text-neutral-900" />
            <p className="text-xs text-neutral-500 font-medium">Cargando estado de escuelas y suscripciones...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-2">
            <Building2 className="size-12 text-neutral-300 stroke-1" />
            <p className="text-sm font-bold text-neutral-800">No se encontraron instituciones</p>
            <p className="text-xs text-neutral-400">Intenta cambiar los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-neutral-50/80 border-b border-neutral-100">
                <TableRow>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Escuela</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Plan SaaS</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Alumnos Matriculados</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Vigencia Suscripción</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Estado Financiero (Mora)</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5">Total Pagado</TableHead>
                  <TableHead className="font-bold text-neutral-700 text-xs py-3.5 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => {
                  const debt = school.subscription.debtStatus;
                  const usage = school.studentStats.usagePercent;
                  const isSuspended = !school.status;

                  return (
                    <TableRow key={school.code} className="hover:bg-neutral-50/80 transition-colors">
                      {/* ESCUELA INFO */}
                      <TableCell className="py-4">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200 shrink-0">
                            {school.code}
                          </span>
                          <div>
                            <div className="font-bold text-sm text-neutral-900 leading-tight">
                              {school.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {school.email || school.phone || "Sin contacto"}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* PLAN SAAS */}
                      <TableCell className="py-4">
                        <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider bg-neutral-50">
                          {school.plan.name}
                        </Badge>
                        <div className="text-[11px] text-neutral-500 font-semibold mt-1">
                          ${school.plan.price.toFixed(2)} / año
                        </div>
                      </TableCell>

                      {/* ALUMNOS MATRICULADOS CON PROGRESS BAR */}
                      <TableCell className="py-4 min-w-[160px]">
                        <div className="flex items-center justify-between text-xs font-bold text-neutral-800 mb-1">
                          <span>{school.studentStats.enrolledCount} / {school.studentStats.maxStudents}</span>
                          <span className="text-[10px] text-neutral-400 font-medium">{usage}%</span>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200/50">
                          <div
                            className={`h-full rounded-full transition-all ${usage >= 90 ? "bg-rose-500" : usage >= 75 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            style={{ width: `${Math.max(4, Math.min(100, usage))}%` }}
                          />
                        </div>
                        {school.studentStats.isNearCapacity && (
                          <div className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="size-3" /> Cerca del límite del plan
                          </div>
                        )}
                      </TableCell>

                      {/* VIGENCIA SUSCRIPCIÓN */}
                      <TableCell className="py-4">
                        <div className="text-xs font-semibold text-neutral-800">
                          {school.subscription.endDate ? school.subscription.endDate.split("T")[0] : "Sin fecha"}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {debt === "OVERDUE" ? (
                            <span className="text-rose-600 font-bold">Venció hace {school.subscription.daysOverdue} días</span>
                          ) : debt === "EXPIRING_SOON" ? (
                            <span className="text-amber-600 font-bold">Quedan {school.subscription.daysRemaining} días</span>
                          ) : (
                            <span>Quedan {school.subscription.daysRemaining} días</span>
                          )}
                        </div>
                      </TableCell>

                      {/* ESTADO FINANCIERO / MORA */}
                      <TableCell className="py-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-800">
                            <Power className="size-3" />
                            Suspendida
                          </span>
                        ) : debt === "OVERDUE" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="size-3 text-rose-600" />
                            EN MORA ({school.subscription.daysOverdue} d)
                          </span>
                        ) : debt === "EXPIRING_SOON" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="size-3 text-amber-600" />
                            POR VENCER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            AL DÍA
                          </span>
                        )}
                      </TableCell>

                      {/* TOTAL PAGADO */}
                      <TableCell className="py-4">
                        <div className="font-bold text-sm text-neutral-900">
                          ${school.financials.totalPaid.toFixed(2)}
                        </div>
                        {school.financials.lastPaymentDate && (
                          <div className="text-[10px] text-neutral-400">
                            Último: {school.financials.lastPaymentDate.split("T")[0]}
                          </div>
                        )}
                      </TableCell>

                      {/* ACCIONES */}
                      <TableCell className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* BOTON REGISTRAR PAGO */}
                          <Button
                            size="sm"
                            className="rounded-xl px-2.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs gap-1 cursor-pointer"
                            onClick={() => handleOpenRegisterPayment(school)}
                            title="Registrar cobro de suscripción SaaS"
                          >
                            <CreditCard className="size-3.5" />
                            <span>Cobrar</span>
                          </Button>

                          {/* BOTON HISTORIAL DE PAGOS */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg cursor-pointer"
                            onClick={() => handleOpenHistory(school)}
                            title="Ver comprobantes y pagos anteriores"
                          >
                            <Receipt className="size-4" />
                          </Button>

                          {/* TOGGLE SUSPENDER / ACTIVAR */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`size-8 rounded-lg cursor-pointer ${school.status
                                ? "text-neutral-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                            onClick={() => handleToggleStatus(school)}
                            title={school.status ? "Suspender servicio por mora" : "Reactivar servicio"}
                          >
                            <Power className="size-4" />
                          </Button>

                          {/* EDITAR */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                            onClick={() => handleOpenEdit(school)}
                            title="Editar datos institucionales"
                          >
                            <Edit className="size-4" />
                          </Button>

                          {/* ELIMINAR */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            onClick={() => handleDelete(school.code)}
                            title="Eliminar escuela"
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

      {/* ============================================================== */}
      {/* MODAL 1: REGISTRAR PAGO DE SUSCRIPCIÓN SAAS                    */}
      {/* ============================================================== */}
      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => { setIsPaymentDialogOpen(open); if (open) setPaymentError(null); }}
      >
        <DialogContent size="lg">
          <form onSubmit={handleSubmitPayment} className="flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <DialogTitle>Registrar Pago de Suscripción SaaS</DialogTitle>
                  <DialogDescription>
                    Registra la recepción del pago de la cuota o renovación para {selectedSchoolForPayment?.name} ({selectedSchoolForPayment?.code}).
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-5">
              {paymentError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* INFO RESUMEN DE LA ESCUELA */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-neutral-500">Plan Contratado</div>
                  <div className="text-sm font-bold text-neutral-900">{selectedSchoolForPayment?.plan.name}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500">Precio Sugerido</div>
                  <div className="text-sm font-bold text-neutral-900">${selectedSchoolForPayment?.plan.price.toFixed(2)} / año</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500">Estado Actual</div>
                  <div className="text-sm font-bold">
                    {selectedSchoolForPayment?.subscription.debtStatus === "OVERDUE" ? (
                      <span className="text-rose-600">En Mora ({selectedSchoolForPayment.subscription.daysOverdue} días)</span>
                    ) : (
                      <span className="text-emerald-600">Al Día</span>
                    )}
                  </div>
                </div>
              </div>

              {/* FORM FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Monto Cobrado (USD) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentFormData.amountPaid}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amountPaid: parseFloat(e.target.value) || 0 })}
                    required
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Método de Pago <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    className="h-11 w-full rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-medium text-neutral-900"
                  >
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="TARJETA_CREDITO">Tarjeta de Crédito / Débito (Stripe)</option>
                    <option value="EFECTIVO">Efectivo / Caja Ventanilla</option>
                    <option value="CHEQUE">Cheque Institucional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Comprobante o Ref. Transacción <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={paymentFormData.transactionReference}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionReference: e.target.value })}
                    placeholder="Ej. TRX-BANCO-883921"
                    required
                    className="h-11 rounded-xl text-sm px-4 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Fecha del Cobro <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    required
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Extender Suscripción Por:
                  </Label>
                  <select
                    value={paymentFormData.monthsToAdd}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, monthsToAdd: parseInt(e.target.value, 10) })}
                    className="h-11 w-full rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-medium text-neutral-900"
                  >
                    <option value={12}>1 Año Completo (12 Meses) - Renovación Anual</option>
                    <option value={6}>6 Meses - Semestral</option>
                    <option value={3}>3 Meses - Trimestral</option>
                    <option value={1}>1 Mes - Mensual</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-700">
                    Notas u Observaciones
                  </Label>
                  <Input
                    value={paymentFormData.notes || ""}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    placeholder="Ej. Pago verificado con factura fiscal #0049"
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                disabled={isSubmittingPayment}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPayment}
                className="rounded-xl px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmittingPayment ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" /> Registrando...</>
                ) : (
                  "Confirmar Cobro & Renovar Suscripción"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 2: HISTORIAL DE PAGOS SAAS DE LA ESCUELA                 */}
      {/* ============================================================== */}
      <Dialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      >
        <DialogContent size="lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <Receipt className="size-4" />
              </div>
              <div>
                <DialogTitle>Historial de Pagos SaaS — {selectedSchoolForHistory?.name}</DialogTitle>
                <DialogDescription>
                  Registro cronológico de pagos recibidos por la plataforma para el código {selectedSchoolForHistory?.code}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {(!selectedSchoolForHistory?.payments || selectedSchoolForHistory.payments.length === 0) ? (
              <div className="p-8 text-center text-xs text-neutral-400 font-medium bg-neutral-50 rounded-2xl">
                No hay pagos registrados para esta escuela.
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200/90 overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-50">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Fecha</TableHead>
                      <TableHead className="text-xs font-bold">Monto</TableHead>
                      <TableHead className="text-xs font-bold">Método</TableHead>
                      <TableHead className="text-xs font-bold">Referencia</TableHead>
                      <TableHead className="text-xs font-bold">Próx. Vencimiento</TableHead>
                      <TableHead className="text-xs font-bold text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSchoolForHistory.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-semibold">
                          {p.paymentDate ? p.paymentDate.split("T")[0] : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-600">
                          ${p.amountPaid.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-600">
                          {p.paymentMethod}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-neutral-700">
                          {p.transactionReference}
                        </TableCell>
                        <TableCell className="text-xs text-neutral-500">
                          {p.nextPaymentDate ? p.nextPaymentDate.split("T")[0] : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 3: CREAR / EDITAR INSTITUCIÓN                            */}
      {/* ============================================================== */}
      <Dialog
        open={isSchoolDialogOpen}
        onOpenChange={(open) => { setIsSchoolDialogOpen(open); if (open) setSchoolError(null); }}
      >
        <DialogContent size="lg">
          <form onSubmit={handleSubmitSchool} className="flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingCode ? "Editar Institución" : "Registrar Nueva Escuela"}</DialogTitle>
              <DialogDescription>
                {editingCode ? "Modifica los datos de la institución cliente." : "Ingresa la información para dar de alta una nueva escuela en la plataforma."}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-5">
              {schoolError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{schoolError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Código Único <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="code" placeholder="Ej. ESC004"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    disabled={!!editingCode}
                    required className="h-11 rounded-xl text-sm px-4 uppercase font-mono"
                  />
                  {!editingCode && <p className="text-[10px] text-neutral-400">Identificador único (sin espacios)</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Nombre de la Escuela <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="name" placeholder="Ej. Academia Montessori del Valle"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Plan de Suscripción <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={formData.planCode}
                    onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
                    className="h-11 w-full rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-medium text-neutral-900"
                  >
                    <option value="FREE">FREE - Plan Gratuito (Hasta 50 alumnos, $0.00)</option>
                    <option value="BASIC">BASIC - Plan Básico (Hasta 200 alumnos, $99.99/año)</option>
                    <option value="PREMIUM">PREMIUM - Plan Premium (Hasta 1000 alumnos, $299.99/año)</option>
                    <option value="ENTERPRISE">ENTERPRISE - Plan Empresarial (Hasta 5000 alumnos, $599.99/año)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Correo Principal
                  </Label>
                  <Input
                    name="email" type="email" placeholder="contacto@escuela.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Teléfono
                  </Label>
                  <Input
                    name="phone" placeholder="+504 9988-7766"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">
                    Dirección Física
                  </Label>
                  <Input
                    name="address" placeholder="Col. Moderna, Calle Principal"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11 rounded-xl text-sm px-4"
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSchoolDialogOpen(false)}
                disabled={isSubmittingSchool}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingSchool}
                className="rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmittingSchool ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" /> Guardando...</>
                ) : (
                  editingCode ? "Actualizar Escuela" : "Guardar & Activar Escuela"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
