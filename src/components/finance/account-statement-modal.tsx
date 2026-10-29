"use client";

import { useMemo } from "react";
import { Student } from "@/lib/services/api.service";
import { Invoice, Payment } from "@/lib/services/finance.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Printer,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  Download,
} from "lucide-react";

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  invoices: Invoice[];
  payments: Payment[];
  schoolCode?: string;
}

export function AccountStatementModal({
  isOpen,
  onClose,
  student,
  invoices,
  payments,
  schoolCode = "ESC002",
}: AccountStatementModalProps) {
  // Filtrar facturas y pagos correspondientes a este estudiante
  const studentInvoices = useMemo(() => {
    if (!student) return [];
    return invoices
      .filter((inv) => inv.studentId === student.publicId)
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoices, student]);

  const studentPayments = useMemo(() => {
    if (!student) return [];
    return payments
      .filter((p) => p.studentId === student.publicId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, student]);

  const totals = useMemo(() => {
    const totalBilled = studentInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const totalPaid = studentPayments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingBalance = Math.max(0, totalBilled - totalPaid);
    const overdueInvoices = studentInvoices.filter(
      (inv) => inv.status === "PENDING" && new Date(inv.dueDate) < new Date()
    );
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

    return {
      totalBilled,
      totalPaid,
      pendingBalance,
      overdueCount: overdueInvoices.length,
      totalOverdue,
    };
  }, [studentInvoices, studentPayments]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={Boolean(isOpen && student)} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      {student && (
        <DialogContent size="xl" className="p-0 overflow-hidden bg-white rounded-3xl border border-neutral-200 shadow-2xl">
        {/* MODAL HEADER */}
        <DialogHeader className="px-8 py-5 border-b border-neutral-100 bg-neutral-50/70 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-neutral-900 text-white">
                <FileText className="size-4 text-lime-400" />
              </span>
              <DialogTitle className="text-lg font-black text-neutral-950">
                Estado de Cuenta Institucional
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-neutral-500 mt-1">
              Registro histórico y consolidado de obligaciones, facturas y pagos del alumno.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold rounded-xl border-neutral-300 hover:bg-neutral-100 cursor-pointer"
            >
              <Printer className="size-3.5" />
              Imprimir / PDF
            </Button>
          </div>
        </DialogHeader>

        {/* MODAL BODY (PRINTABLE REGION) */}
        <DialogBody className="p-8 space-y-6 overflow-y-auto print:p-0">
          {/* INSTITUTIONAL HEADER */}
          <div className="flex items-start justify-between pb-6 border-b border-neutral-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-bold">
                  <span className="text-lime-400 text-sm">E</span>
                </div>
                <h2 className="text-base font-black tracking-tight text-neutral-900 uppercase">
                  Centro Educativo Luz del Saber
                </h2>
              </div>
              <p className="text-xs text-neutral-500">
                Código Centro: <span className="font-mono font-bold text-neutral-700">{schoolCode}</span> • Departamento de Administración y Finanzas
              </p>
              <p className="text-xs text-neutral-500">
                Tegucigalpa, M.D.C., Honduras • Tel: (+504) 2234-5678 • info@luzdelsaber.edu.hn
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-mono">
                DOCUMENTO OFICIAL
              </span>
              <p className="text-xs text-neutral-500 mt-1">
                Fecha de Emisión: <span className="font-semibold text-neutral-900">{new Date().toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}</span>
              </p>
            </div>
          </div>

          {/* STUDENT & TUTOR SUMMARY CARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-neutral-50/80 border border-neutral-200/90 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                <User className="size-3.5" /> Datos del Alumno
              </div>
              <div>
                <p className="text-sm font-black text-neutral-900">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-neutral-600 mt-0.5">
                  DNI / Identidad: <span className="font-mono font-bold text-neutral-800">{student.identityNumber || "No registrada"}</span>
                </p>
                <p className="text-neutral-600">
                  Código de Alumno: <span className="font-mono font-bold text-neutral-800">{student.userCode || "N/A"}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                <GraduationCap className="size-3.5" /> Beca y Contacto
              </div>
              <div>
                <p className="text-neutral-700">
                  Beca Asignada:{" "}
                  <span className="font-bold text-neutral-900">
                    {student.scholarshipPercentage ? `${student.scholarshipPercentage}% de Descuento` : "Sin beca (0%)"}
                  </span>
                </p>
                <p className="text-neutral-600 mt-0.5">
                  Teléfono: <span className="font-medium text-neutral-800">{student.phone || "(+504) 9988-7766"}</span>
                </p>
                <p className="text-neutral-600">
                  Correo: <span className="font-medium text-neutral-800">{student.email || "estudiante@colegio.edu.hn"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Total Facturado
              </p>
              <p className="text-xl font-black text-neutral-900 mt-1">
                L. {totals.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {studentInvoices.length} cargos emitidos
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Total Pagado / Abonado
              </p>
              <p className="text-xl font-black text-emerald-600 mt-1">
                L. {totals.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {studentPayments.length} recibos aplicados
              </p>
            </div>

            <div className={`p-4 rounded-2xl border shadow-2xs ${
              totals.pendingBalance > 0
                ? "bg-red-50/50 border-red-200 text-red-900"
                : "bg-emerald-50/50 border-emerald-200 text-emerald-900"
            }`}>
              <p className="text-[11px] font-bold uppercase tracking-wider">
                Saldo Pendiente Actual
              </p>
              <p className="text-xl font-black mt-1">
                L. {totals.pendingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] mt-0.5 font-medium">
                {totals.pendingBalance > 0
                  ? `${totals.overdueCount} recibos en mora (L. ${totals.totalOverdue.toFixed(2)})`
                  : "Cuenta solvente • Al día"}
              </p>
            </div>
          </div>

          {/* INVOICES & OBLIGATIONS TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-neutral-900 flex items-center gap-2">
                <FileText className="size-4 text-neutral-600" />
                Detalle de Obligaciones y Mensualidades ({studentInvoices.length})
              </h3>
            </div>

            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  <tr>
                    <th className="px-4 py-3">N° Factura</th>
                    <th className="px-4 py-3">Concepto / Notas</th>
                    <th className="px-4 py-3">Emisión</th>
                    <th className="px-4 py-3">Vencimiento</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {studentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                        No se registran cargos o facturas para este alumno.
                      </td>
                    </tr>
                  ) : (
                    studentInvoices.map((inv) => {
                      const isOverdue =
                        inv.status === "PENDING" && new Date(inv.dueDate) < new Date();
                      return (
                        <tr key={inv.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-neutral-700">
                            {inv.notes || "Colegiatura Regular"}
                          </td>
                          <td className="px-4 py-3 text-neutral-500">
                            {new Date(inv.issueDate).toLocaleDateString("es-HN")}
                          </td>
                          <td className="px-4 py-3">
                            <span className={isOverdue ? "text-red-600 font-bold" : "text-neutral-500"}>
                              {new Date(inv.dueDate).toLocaleDateString("es-HN")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-neutral-900 font-mono">
                            L. {Number(inv.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {inv.status === "PAID" ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                PAGADO
                              </Badge>
                            ) : isOverdue ? (
                              <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] animate-pulse">
                                VENCIDO
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                                PENDIENTE
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENTS HISTORY TABLE */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-neutral-900 flex items-center gap-2">
              <DollarSign className="size-4 text-emerald-600" />
              Recibos de Pago y Transferencias Aplicadas ({studentPayments.length})
            </h3>

            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  <tr>
                    <th className="px-4 py-3">N° Recibo</th>
                    <th className="px-4 py-3">Fecha de Pago</th>
                    <th className="px-4 py-3">Método / Referencia</th>
                    <th className="px-4 py-3 text-right">Monto Pagado</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {studentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                        No se registran pagos procesados para este alumno.
                      </td>
                    </tr>
                  ) : (
                    studentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                          REC-{p.id.toString().padStart(5, "0")}
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {new Date(p.paymentDate).toLocaleDateString("es-HN")}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {p.paymentMethod?.name || "Efectivo / Transferencia"}{" "}
                          {p.transactionReference && (
                            <span className="font-mono text-neutral-400">({p.transactionReference})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 font-mono">
                          L. {Number(p.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIGNATURE & LEGAL DISCLAIMER */}
          <div className="pt-8 border-t border-neutral-200 grid grid-cols-2 gap-8 text-center text-xs text-neutral-500">
            <div>
              <div className="w-48 mx-auto border-b border-neutral-400 pt-10" />
              <p className="mt-2 font-bold text-neutral-800">Caja y Administración</p>
              <p className="text-[11px] text-neutral-400">Firma y Sello Oficial</p>
            </div>
            <div>
              <div className="w-48 mx-auto border-b border-neutral-400 pt-10" />
              <p className="mt-2 font-bold text-neutral-800">Padre / Tutor Responsable</p>
              <p className="text-[11px] text-neutral-400">Conforme con Saldo</p>
            </div>
          </div>
        </DialogBody>

        {/* MODAL FOOTER */}
        <DialogFooter className="px-8 py-4 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
          <p className="text-xs text-neutral-400">
            * Para arreglos de pago o aclaraciones contables, presentarse en oficina de Tesorería.
          </p>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl px-5 border-neutral-300 hover:bg-neutral-100"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
      )}
    </Dialog>
  );
}
