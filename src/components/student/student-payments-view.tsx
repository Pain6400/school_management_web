"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogBody, DialogFooter
} from "@/components/ui/dialog";
import {
  CreditCard, DollarSign, Receipt, Clock, CheckCircle2,
  AlertCircle, AlertTriangle, Calendar, Building2, Printer,
  HelpCircle, ChevronRight, FileText, ArrowUpRight, Sparkles,
  ShieldCheck, Banknote, Landmark, CheckCheck, RefreshCw, Loader2
} from "lucide-react";
import { financeService, Invoice, Payment } from "@/lib/services/finance.service";
import { Student } from "@/lib/services/api.service";

interface StudentPaymentsViewProps {
  studentId: string;
  student?: Student | null;
  schoolCode?: string;
}

export function StudentPaymentsView({ studentId, student, schoolCode = "ESC002" }: StudentPaymentsViewProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePaymentTab, setActivePaymentTab] = useState<"pending" | "history">("pending");

  // Modales
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    payment: Payment;
    invoice?: Invoice;
  } | null>(null);

  const [isHowToPayOpen, setIsHowToPayOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);

  // Available Years
  const availableYears = useMemo(() => {
    return [currentYear, currentYear - 1, currentYear - 2];
  }, [currentYear]);

  // Cargar datos financieros del estudiante filtrando por el año seleccionado (Backend-First)
  const loadStudentFinance = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const [invRes, payRes] = await Promise.allSettled([
        financeService.getInvoicesByStudent(studentId, { year: selectedYear }),
        financeService.getPaymentsByStudent(studentId, { year: selectedYear }),
      ]);

      if (invRes.status === "fulfilled" && invRes.value.status && invRes.value.data) {
        setInvoices(invRes.value.data);
      } else {
        setInvoices([]);
      }

      if (payRes.status === "fulfilled" && payRes.value.status && payRes.value.data) {
        setPayments(payRes.value.data);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error("Error al cargar finanzas del estudiante:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentFinance();
  }, [studentId, selectedYear]);

  // Separar facturas pendientes y pagadas
  const pendingInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status !== "PAID" && inv.status !== "WAIVED");
  }, [invoices]);

  const paidInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status === "PAID" || inv.status === "WAIVED");
  }, [invoices]);

  // Métricas financieras calculadas
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const totalPending = pendingInvoices.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
    const totalPaid = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const overdueList = pendingInvoices.filter((inv) => inv.dueDate && inv.dueDate < todayStr);
    const hasOverdue = overdueList.length > 0;

    // Próximo vencimiento
    const sortedPending = [...pendingInvoices].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    const nextDue = sortedPending[0]?.dueDate || null;

    return {
      totalPending,
      totalPaid,
      pendingCount: pendingInvoices.length,
      paidCount: payments.length,
      hasOverdue,
      overdueCount: overdueList.length,
      nextDue,
    };
  }, [pendingInvoices, payments]);

  // Manejar apertura de recibo
  const handleOpenReceipt = (payment: Payment) => {
    const associatedInvoice = invoices.find((inv) => inv.id === payment.invoiceId) || payment.invoice;
    setSelectedReceipt({
      payment,
      invoice: associatedInvoice,
    });
    setIsReceiptModalOpen(true);
  };

  const handleOpenHowToPay = (inv?: Invoice) => {
    setInvoiceToPay(inv || null);
    setIsHowToPayOpen(true);
  };

  const schoolName = student?.school?.name || (schoolCode === "ESC002" ? "Centro Educativo Luz del Saber" : "Instituto Educativo");
  const scholarshipPercentage = student?.scholarshipPercentage || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BARRA SUPERIOR DE FILTRO POR AÑO Y ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-neutral-950 text-lime-400 flex items-center justify-center font-bold shadow-xs">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-neutral-900 tracking-tight">
              Mis Pagos & Aranceles Escolares
            </h2>
            <p className="text-xs text-neutral-500">
              Control de colegiaturas, mensualidades y comprobantes oficiales
            </p>
          </div>
        </div>

        {/* SELECTOR DE AÑO LECTIVO (SIEMPRE FILTRA POR AÑO ACTUAL POR DEFECTO) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider hidden md:inline">
            Ciclo:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-neutral-100 border border-neutral-200/80">
            {availableYears.map((year) => {
              const isSelected = selectedYear === year;
              const isCurrent = year === currentYear;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-neutral-950 text-white shadow-2xs"
                      : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60"
                  }`}
                >
                  <span>{year}</span>
                  {isCurrent && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold uppercase ${isSelected ? "bg-lime-400 text-neutral-950" : "bg-neutral-200 text-neutral-700"}`}>
                      Actual
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadStudentFinance}
            disabled={loading}
            className="h-9 px-3 rounded-xl border-neutral-200 text-xs font-bold gap-1 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-neutral-400" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleOpenHowToPay()}
            className="h-9 px-4 rounded-xl bg-lime-400 hover:bg-lime-500 text-neutral-950 text-xs font-black shadow-xs gap-1.5 cursor-pointer"
          >
            <HelpCircle className="size-3.5" />
            <span>¿Cómo pagar?</span>
          </Button>
        </div>
      </div>

      {/* TARJETAS KPI DE RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL PENDIENTE */}
        <Card className="p-5 border-neutral-200/80 relative overflow-hidden bg-white shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Pendiente ({selectedYear})
            </span>
            <div className={`p-1.5 rounded-xl ${metrics.totalPending > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${metrics.totalPending > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              L. {metrics.totalPending.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {metrics.totalPending > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Clock className="size-3" /> {metrics.pendingCount} recibo{metrics.pendingCount > 1 ? "s" : ""} por liquidar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCheck className="size-3" /> Totalmente al día
              </span>
            )}
          </div>
        </Card>

        {/* TOTAL PAGADO */}
        <Card className="p-5 border-neutral-200/80 relative overflow-hidden bg-white shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Cancelado ({selectedYear})
            </span>
            <div className="p-1.5 rounded-xl bg-lime-100 text-lime-800">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900">
              L. {metrics.totalPaid.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500 font-medium">
            {metrics.paidCount} pago{metrics.paidCount > 1 ? "s" : ""} registrado{metrics.paidCount > 1 ? "s" : ""} en caja
          </p>
        </Card>

        {/* BECA / BENEFICIO */}
        <Card className="p-5 border-neutral-200/80 relative overflow-hidden bg-white shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Beca / Descuento
            </span>
            <div className="p-1.5 rounded-xl bg-purple-100 text-purple-800">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">
              {scholarshipPercentage > 0 ? `${scholarshipPercentage}% de Beca` : "0% Regular"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500 font-medium">
            {scholarshipPercentage > 0
              ? "Descuento institucional aplicado a tus mensualidades"
              : "Tarifa estándar institucional"}
          </p>
        </Card>

        {/* PRÓXIMO VENCIMIENTO */}
        <Card className="p-5 border-neutral-200/80 relative overflow-hidden bg-white shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Próximo Vencimiento
            </span>
            <div className={`p-1.5 rounded-xl ${metrics.hasOverdue ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"}`}>
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl font-black ${metrics.hasOverdue ? "text-rose-600" : "text-neutral-900"}`}>
              {metrics.nextDue ? new Date(metrics.nextDue).toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" }) : "Sin pendientes"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500 font-medium">
            {metrics.hasOverdue ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="size-3" /> Hay recibos vencidos
              </span>
            ) : metrics.nextDue ? (
              "Fecha límite para realizar tu pago regular"
            ) : (
              "No tienes fechas de pago pendientes"
            )}
          </p>
        </Card>
      </div>

      {/* PESTAÑAS: PENDIENTES VS HISTORIAL */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-200/80 pb-3">
          <button
            type="button"
            onClick={() => setActivePaymentTab("pending")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activePaymentTab === "pending"
                ? "bg-neutral-950 text-white shadow-2xs"
                : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80"
            }`}
          >
            <Clock className="size-4" />
            <span>Recibos Pendientes ({pendingInvoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePaymentTab("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activePaymentTab === "history"
                ? "bg-neutral-950 text-white shadow-2xs"
                : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80"
            }`}
          >
            <Receipt className="size-4" />
            <span>Historial de Pagos ({payments.length})</span>
          </button>
        </div>

        {/* TAB 1: RECIBOS PENDIENTES */}
        {activePaymentTab === "pending" && (
          <Card className="p-5 sm:p-6 border-neutral-200/80 bg-white shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Cuentas por Pagar del Ciclo {selectedYear}
                </h3>
                <p className="text-xs text-neutral-400">
                  Facturas y cuotas escolares emitidas pendientes de confirmación o pago en ventanilla
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <Loader2 className="size-6 animate-spin" />
                <span className="text-xs">Consultando cuentas por pagar...</span>
              </div>
            ) : pendingInvoices.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <CheckCheck className="size-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900">
                    ¡Estás completamente al día en el ciclo {selectedYear}!
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    No tienes cuotas escolares ni recibos pendientes de pago para el periodo seleccionado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvoices.map((inv) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOverdue = inv.dueDate && inv.dueDate < todayStr;
                  const total = Number(inv.totalAmount || 0);

                  return (
                    <div
                      key={inv.id}
                      className="p-4 sm:p-5 rounded-2xl border border-neutral-200/80 bg-white hover:border-neutral-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-800">
                            {inv.invoiceNumber}
                          </span>
                          {isOverdue ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <AlertCircle className="size-3" /> Vencida
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="size-3" /> Pendiente de Pago
                            </span>
                          )}
                          {scholarshipPercentage > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              Beca {scholarshipPercentage}% aplicada
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-black text-neutral-900">
                          {inv.notes || "Colegiatura / Cuota Escolar"}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap pt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5 text-neutral-400" />
                            Emisión: {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "Sin fecha"}
                          </span>
                          <span className={`flex items-center gap-1 font-semibold ${isOverdue ? "text-rose-600" : "text-neutral-600"}`}>
                            <Clock className="size-3.5" />
                            Límite: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Sin fecha límite"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-neutral-100">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                            Monto a Pagar
                          </span>
                          <span className="text-xl font-black text-neutral-900">
                            L. {total.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <Button
                          type="button"
                          onClick={() => handleOpenHowToPay(inv)}
                          className="h-10 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Landmark className="size-3.5 text-lime-400" />
                          <span>Pagar Ahora</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* TAB 2: HISTORIAL DE PAGOS REALIZADOS */}
        {activePaymentTab === "history" && (
          <Card className="p-5 sm:p-6 border-neutral-200/80 bg-white shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Historial de Pagos y Recibos Cancelados ({selectedYear})
                </h3>
                <p className="text-xs text-neutral-400">
                  Comprobantes registrados oficialmente en la caja institucional de tu escuela
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <Loader2 className="size-6 animate-spin" />
                <span className="text-xs">Cargando pagos realizados...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 font-medium text-xs">
                No hay pagos registrados para el año {selectedYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-400 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200/80">
                    <tr>
                      <th className="py-3 px-4">Fecha de Pago</th>
                      <th className="py-3 px-4">N° Recibo / Ref</th>
                      <th className="py-3 px-4">Factura Asociada</th>
                      <th className="py-3 px-4">Método de Pago</th>
                      <th className="py-3 px-4 text-right">Monto Cancelado</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {payments.map((p) => {
                      const amount = Number(p.amount || 0);
                      const paymentDateStr = p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString("es-HN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "S/F";

                      return (
                        <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-neutral-900">
                            {paymentDateStr}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-neutral-800">
                            {p.transactionReference || `REC-${p.id}`}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-600">
                            {p.invoice?.invoiceNumber || (p.invoiceId ? `INV-${p.invoiceId}` : "Pago Directo")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-lg text-[11px]">
                              <Banknote className="size-3 text-neutral-500" />
                              {p.paymentMethod?.name || (p.paymentMethodId === 1 ? "Efectivo" : "Transferencia / Depósito")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-sm text-neutral-900">
                            L. {amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {p.status === "COMPLETED" ? (
                              <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Pagado ✓
                              </span>
                            ) : (
                              <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                                En Verificación
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReceipt(p)}
                              className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer border-neutral-200 hover:bg-neutral-100"
                            >
                              <FileText className="size-3 text-neutral-600" />
                              <span>Ver Recibo</span>
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
        )}
      </div>

      {/* MODAL: COMPROBANTE OFICIAL DE PAGO DIGITAL (PRINTABLE) */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600" />
              <span>Comprobante Digital Oficial de Pago</span>
            </DialogTitle>
            <DialogDescription>
              {schoolName} • Código Institucional {schoolCode}
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {selectedReceipt && (
              <div className="bg-white border-2 border-dashed border-neutral-200 rounded-2xl p-6 space-y-5 print:border-none print:p-0">
                {/* RECEIPT HEADER */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <div>
                    <h3 className="font-black text-base text-neutral-900 tracking-tight">
                      {schoolName}
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Sistema Escolar Integrado EDUSYS • {schoolCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Recibo Oficial N°
                    </span>
                    <span className="font-mono font-black text-sm text-neutral-900">
                      {selectedReceipt.payment.transactionReference || `REC-${selectedReceipt.payment.id}`}
                    </span>
                  </div>
                </div>

                {/* STUDENT AND PAYMENT DATA */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                      Estudiante Titular
                    </span>
                    <span className="font-bold text-neutral-900">
                      {student ? `${student.firstName} ${student.lastName}` : "Alumno Institucional"}
                    </span>
                    <span className="text-[11px] text-neutral-500 block font-mono">
                      DNI: {student?.identityNumber || "0501199710597"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                      Fecha de Cancelación
                    </span>
                    <span className="font-bold text-neutral-900">
                      {selectedReceipt.payment.paymentDate
                        ? new Date(selectedReceipt.payment.paymentDate).toLocaleDateString("es-HN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Fecha actual"}
                    </span>
                  </div>
                </div>

                {/* CONCEPT DETAIL */}
                <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800">
                      {selectedReceipt.invoice?.notes || selectedReceipt.payment.notes || "Colegiatura / Arancel Escolar"}
                    </span>
                    <span className="font-mono font-bold text-neutral-900">
                      L. {Number(selectedReceipt.payment.amount || 0).toFixed(2)}
                    </span>
                  </div>
                  {selectedReceipt.invoice?.invoiceNumber && (
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Comprobante base: {selectedReceipt.invoice.invoiceNumber}
                    </div>
                  )}
                </div>

                {/* TOTAL */}
                <div className="border-t border-neutral-200 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-neutral-500 block">
                      Método: <strong className="text-neutral-900">{selectedReceipt.payment.paymentMethod?.name || "Caja / Efectivo"}</strong>
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Estado: Pagado y conciliado en sistema
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Total Pagado
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      L. {Number(selectedReceipt.payment.amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* DIGITAL STAMP */}
                <div className="pt-3 border-t border-dashed border-neutral-200 flex items-center justify-between text-[10px] text-neutral-400">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <CheckCheck className="size-3.5" />
                    PAGO CONFIRMADO EN CAJA OFICIAL
                  </div>
                  <span>Validez legal como comprobante de pago escolar</span>
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReceiptModalOpen(false)}
              className="h-11 px-5 rounded-xl text-xs font-bold"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="h-11 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-2 shadow-xs"
            >
              <Printer className="size-4 text-lime-400" />
              <span>Imprimir Comprobante</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: INSTRUCCIONES DE PAGO */}
      <Dialog open={isHowToPayOpen} onOpenChange={setIsHowToPayOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-neutral-900" />
              <span>Instrucciones y Métodos de Pago</span>
            </DialogTitle>
            <DialogDescription>
              {schoolName} • Opciones disponibles para abonar o liquidar cuotas escolares
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {invoiceToPay && (
              <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-200/80 text-xs">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Recibo a Pagar
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-neutral-900">{invoiceToPay.notes || invoiceToPay.invoiceNumber}</span>
                  <span className="font-black text-sm text-neutral-900">
                    L. {Number(invoiceToPay.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* OPCION 1: VENTANILLA DE CAJA */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                <Building2 className="size-4 text-lime-600" />
                <span>Opción 1: Ventanilla de Caja en el Colegio</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Puedes presentarte en la administración o caja del campus <strong>{schoolName}</strong> en horario de <strong>Lunes a Viernes de 7:30 AM a 3:30 PM</strong>.
              </p>
              <div className="text-[11px] text-neutral-500 font-medium">
                Se acepta efectivo y tarjeta de débito/crédito. Solo indica el nombre o DNI del estudiante ({student?.identityNumber || "0501199710597"}).
              </div>
            </div>

            {/* OPCION 2: TRANSFERENCIA BANCARIA */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
                <Landmark className="size-4 text-blue-600" />
                <span>Opción 2: Transferencia Bancaria o Depósito</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Realiza la transferencia desde la banca en línea a cualquiera de las cuentas institucionales:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-neutral-200 flex items-center justify-between">
                  <div>
                    <strong className="block text-neutral-900">BAC Credomatic (Cuenta de Cheques)</strong>
                    <span className="font-mono text-neutral-600 text-[11px]">7401-9283-0192</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">Lempiras</Badge>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-neutral-200 flex items-center justify-between">
                  <div>
                    <strong className="block text-neutral-900">Banco Ficohsa (Cuenta de Ahorros)</strong>
                    <span className="font-mono text-neutral-600 text-[11px]">2000-1192-8402</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">Lempiras</Badge>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong className="font-bold block flex items-center gap-1">
                  <AlertCircle className="size-3.5 text-amber-600" /> Importante en el detalle de la transferencia:
                </strong>
                <span>Coloca en la descripción: <strong>DNI {student?.identityNumber || "0501199710597"} - {student ? `${student.firstName} ${student.lastName}` : "Estudiante"}</strong> para su conciliación inmediata en caja.</span>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsHowToPayOpen(false)}
              className="h-11 px-6 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

