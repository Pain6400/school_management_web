"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogBody, DialogFooter
} from "@/components/ui/dialog";
import {
  CreditCard, DollarSign, Receipt, Plus, Search, Filter,
  RotateCcw, CheckCircle2, AlertCircle, Clock, FileText,
  TrendingUp, ArrowDownRight, User, Calendar, Loader2,
  Trash2, ExternalLink, ShieldCheck
} from "lucide-react";
import { financeService, Invoice, Payment, PaymentConcept } from "@/lib/services/finance.service";
import { studentsService, Student } from "@/lib/services/api.service";

export default function FinancePage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStudent, setFilterStudent] = useState("ALL");

  // New Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: "",
    conceptCode: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    totalAmount: 1500,
    notes: "",
  });
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // New Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    transactionReference: "",
    notes: "",
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const schoolCode = user?.schoolCode || "EDUSYS";

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes, conRes, stuRes] = await Promise.allSettled([
        financeService.getInvoices(),
        financeService.getPayments(),
        financeService.getPaymentConcepts(),
        studentsService.getStudents(),
      ]);

      if (invRes.status === "fulfilled" && invRes.value.status && invRes.value.data) {
        setInvoices(invRes.value.data);
      }
      if (payRes.status === "fulfilled" && payRes.value.status && payRes.value.data) {
        setPayments(payRes.value.data);
      }
      if (conRes.status === "fulfilled" && conRes.value.status && conRes.value.data) {
        setConcepts(conRes.value.data);
      }
      if (stuRes.status === "fulfilled" && stuRes.value.status && stuRes.value.data) {
        setStudents(stuRes.value.data);
      }
    } catch (err) {
      console.error("Error al cargar finanzas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Map students by publicId
  const studentsMap = useMemo(() => {
    const map: Record<string, Student> = {};
    students.forEach((s) => {
      map[s.publicId] = s;
    });
    return map;
  }, [students]);

  // Options for Student Combobox
  const studentOptions = useMemo(() => {
    return students.map((s) => ({
      value: s.publicId,
      label: `${s.firstName} ${s.lastName}`,
      description: s.identityNumber || s.userCode || s.email,
      badge: s.userCode,
    }));
  }, [students]);

  const studentFilterOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Todos los Estudiantes" },
      ...studentOptions,
    ];
  }, [studentOptions]);

  // Metrics
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let overdueCount = 0;

    const today = new Date().toISOString().split("T")[0];

    invoices.forEach((inv) => {
      const amount = Number(inv.totalAmount || 0);
      totalBilled += amount;

      if (inv.status === "PAID") {
        totalCollected += amount;
      } else {
        totalPending += amount;
        if (inv.dueDate && inv.dueDate < today) {
          overdueCount++;
        }
      }
    });

    return { totalBilled, totalCollected, totalPending, overdueCount };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Text Search
      const q = searchQuery.toLowerCase().trim();
      const student = studentsMap[inv.studentId];
      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : "";
      const matchesSearch =
        !q ||
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        studentName.includes(q) ||
        student?.identityNumber?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (filterStatus !== "ALL" && inv.status !== filterStatus) return false;

      // 3. Student Filter
      if (filterStudent !== "ALL" && inv.studentId !== filterStudent) return false;

      return true;
    });
  }, [invoices, searchQuery, filterStatus, filterStudent, studentsMap]);

  // Auto-generate invoice number when opening modal
  const handleOpenCreateInvoice = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().getFullYear();
    setInvoiceForm({
      studentId: students[0]?.publicId || "",
      conceptCode: concepts[0]?.code || "",
      invoiceNumber: `INV-${dateStr}-${randomNum}`,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      totalAmount: concepts[0]?.amount || 1500,
      notes: "Colegiatura / mensualidad regular",
    });
    setInvoiceError(null);
    setIsInvoiceModalOpen(true);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.studentId) {
      setInvoiceError("Debes seleccionar a un estudiante");
      return;
    }

    try {
      setIsSubmittingInvoice(true);
      setInvoiceError(null);

      const res = await financeService.createInvoice({
        schoolCode,
        studentId: invoiceForm.studentId,
        invoiceNumber: invoiceForm.invoiceNumber,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        totalAmount: Number(invoiceForm.totalAmount),
        status: "PENDING",
        notes: invoiceForm.notes,
      });

      if (res.status) {
        setIsInvoiceModalOpen(false);
        loadFinanceData();
      } else {
        setInvoiceError(res.message || "Error al crear factura");
      }
    } catch (err: any) {
      setInvoiceError(err?.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: Number(invoice.totalAmount),
      transactionReference: `REC-${Date.now().toString().slice(-6)}`,
      notes: "Pago registrado en caja institucional",
    });
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      setIsSubmittingPayment(true);
      setPaymentError(null);

      const res = await financeService.createPayment({
        schoolCode,
        invoiceId: selectedInvoice.id,
        studentId: selectedInvoice.studentId,
        amount: Number(paymentForm.amount),
        paymentDate: new Date().toISOString(),
        transactionReference: paymentForm.transactionReference,
        status: "COMPLETED",
        notes: paymentForm.notes,
      });

      if (res.status) {
        // Actualizar factura a PAID
        await financeService.updateInvoice(selectedInvoice.id, { status: "PAID" });
        setIsPaymentModalOpen(false);
        loadFinanceData();
      } else {
        setPaymentError(res.message || "Error al registrar pago");
      }
    } catch (err: any) {
      setPaymentError(err?.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm("¿Seguro que deseas anular o eliminar este comprobante de pago?")) return;
    try {
      await financeService.deleteInvoice(id);
      loadFinanceData();
    } catch (err: any) {
      alert(err?.message || "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-lime-400/20">
            <DollarSign className="size-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Gestión Financiera & Cobranzas
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                <ShieldCheck className="size-3" /> Módulo Oficial
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Control de colegiaturas, emisión de recibos y registro de pagos de los estudiantes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreateInvoice}
            className="h-12 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-xs gap-2 cursor-pointer"
          >
            <Plus className="size-4 text-lime-400" />
            <span>Emitir Factura / Cobro</span>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Facturado</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <Receipt className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">
            L. {metrics.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">{invoices.length} recibos generados</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Cobrado</span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-lime-600 mt-2">
            L. {metrics.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Ingresos recaudados</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Por Cobrar</span>
            <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            L. {metrics.totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Saldo pendiente</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Morosidad</span>
            <div className="size-8 rounded-xl bg-red-100 flex items-center justify-center text-red-800">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">
            {metrics.overdueCount}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Recibos vencidos</p>
        </Card>
      </div>

      {/* FILTER BAR */}
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900">Filtros de Búsqueda Financiera</h3>
            </div>
            {(searchQuery || filterStatus !== "ALL" || filterStudent !== "ALL") && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setFilterStatus("ALL"); setFilterStudent("ALL"); }}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por N° Factura o alumno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 rounded-xl bg-white border border-neutral-200/90 pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>

            <div>
              <Combobox
                options={studentFilterOptions}
                value={filterStudent}
                onChange={(val) => setFilterStudent(val || "ALL")}
                placeholder="Filtrar por Alumno"
                searchPlaceholder="Buscar alumno..."
              />
            </div>

            <div>
              <Combobox
                options={[
                  { value: "ALL", label: "Todos los Estados" },
                  { value: "PENDING", label: "Pendientes de Pago", badge: "Pendiente" },
                  { value: "PAID", label: "Pagadas", badge: "Pagado" },
                  { value: "OVERDUE", label: "Vencidas", badge: "Vencida" },
                ]}
                value={filterStatus}
                onChange={(val) => setFilterStatus(val || "ALL")}
                placeholder="Estado del Recibo"
                searchPlaceholder="Buscar estado..."
              />
            </div>
          </div>
        </div>
      </Card>

      {/* INVOICES TABLE */}
      <Card className="p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-neutral-900">Listado de Comprobantes & Recibos</h3>
            <p className="text-xs text-neutral-400">Mostrando {filteredInvoices.length} de {invoices.length} registros</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-medium flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
            <span>Cargando datos financieros...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-medium">
            No se encontraron comprobantes con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-400 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200/80">
                <tr>
                  <th className="py-3 px-4">N° Factura</th>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">Emisión</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredInvoices.map((inv) => {
                  const student = studentsMap[inv.studentId];
                  const isPaid = inv.status === "PAID";
                  const isPending = inv.status === "PENDING";

                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900">
                          {student ? `${student.firstName} ${student.lastName}` : "Estudiante"}
                        </div>
                        {student?.identityNumber && (
                          <div className="text-[11px] text-neutral-400">{student.identityNumber}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-sm text-neutral-900">
                        L. {Number(inv.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                            isPaid
                              ? "bg-lime-100 text-lime-800 border border-lime-200"
                              : isPending
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {isPaid ? "Pagada" : isPending ? "Pendiente" : "Vencida"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleOpenPayment(inv)}
                              className="h-8 px-3 rounded-lg text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white shadow-2xs"
                            >
                              <CreditCard className="size-3 mr-1 text-lime-400" />
                              <span>Registrar Pago</span>
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL AMPLIO: EMITIR FACTURA */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir Nueva Factura / Cobro</DialogTitle>
            <DialogDescription>
              Genera un comprobante oficial de pago para un estudiante matriculado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice} className="flex flex-col flex-1">
            <DialogBody>
              {invoiceError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{invoiceError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Estudiante Titular <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={studentOptions}
                    value={invoiceForm.studentId}
                    onChange={(val) => setInvoiceForm({ ...invoiceForm, studentId: val })}
                    placeholder="Seleccionar estudiante..."
                    searchPlaceholder="Buscar por nombre o cédula..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Número de Comprobante / Factura <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-12 rounded-xl text-sm px-4 font-mono font-bold"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Monto Total (Lempiras) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    className="h-12 rounded-xl text-sm px-4 font-bold"
                    value={invoiceForm.totalAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Fecha de Emisión <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl text-sm px-4"
                    value={invoiceForm.issueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Fecha de Vencimiento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl text-sm px-4"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Concepto / Observaciones
                  </Label>
                  <Input
                    className="h-12 rounded-xl text-sm px-4"
                    placeholder="Ej. Mensualidad Marzo 2026 - Grado Primaria"
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInvoiceModalOpen(false)}
                disabled={isSubmittingInvoice}
                className="h-12 px-6 rounded-xl text-sm font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingInvoice}
                className="h-12 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold shadow-xs"
              >
                {isSubmittingInvoice ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Guardando...</>
                ) : (
                  "Crear y Emitir Factura"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL AMPLIO: REGISTRAR PAGO */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago de Factura</DialogTitle>
            <DialogDescription>
              Factura {selectedInvoice?.invoiceNumber} • Monto Total: L. {selectedInvoice?.totalAmount}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterPayment} className="flex flex-col flex-1">
            <DialogBody>
              {paymentError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-500" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Monto a Pagar (Lempiras) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    className="h-12 rounded-xl text-sm px-4 font-bold"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    N° Transacción / Referencia <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-12 rounded-xl text-sm px-4 font-mono"
                    placeholder="Ej. TRANS-981240"
                    value={paymentForm.transactionReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold text-neutral-800">
                    Notas / Comentarios del Pago
                  </Label>
                  <Input
                    className="h-12 rounded-xl text-sm px-4"
                    placeholder="Ej. Pago realizado por transferencia bancaria"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isSubmittingPayment}
                className="h-12 px-6 rounded-xl text-sm font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPayment}
                className="h-12 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold shadow-xs"
              >
                {isSubmittingPayment ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Registrando...</>
                ) : (
                  "Confirmar y Registrar Pago"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
