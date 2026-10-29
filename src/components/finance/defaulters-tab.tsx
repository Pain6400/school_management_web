"use client";

import { useState, useMemo } from "react";
import { Student } from "@/lib/services/api.service";
import { Invoice, Payment } from "@/lib/services/finance.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AccountStatementModal } from "./account-statement-modal";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  MessageCircle,
  FileText,
  Wallet,
  ArrowRight,
  Phone,
  Mail,
  User,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ChevronRight,
} from "lucide-react";

interface DefaultersTabProps {
  invoices: Invoice[];
  payments: Payment[];
  studentsMap: Record<string, Student>;
  schoolCode: string;
  onCollectAtPos: (student: Student) => void;
}

interface DefaulterStudentSummary {
  student: Student;
  overdueInvoices: Invoice[];
  pendingInvoices: Invoice[];
  totalOverdueAmount: number;
  totalPendingAmount: number;
  maxDaysOverdue: number;
  oldestDueDate: string;
}

export function DefaultersTab({
  invoices,
  payments,
  studentsMap,
  schoolCode,
  onCollectAtPos,
}: DefaultersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [agingFilter, setAgingFilter] = useState<"ALL" | "RECENT" | "MEDIUM" | "CRITICAL">("ALL");
  const [selectedStudentForStatement, setSelectedStudentForStatement] = useState<Student | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  const today = useMemo(() => new Date(), []);

  // 1. Agrupar deudas por estudiante y calcular días de mora
  const defaultersList: DefaulterStudentSummary[] = useMemo(() => {
    const studentDebts: Record<string, { overdue: Invoice[]; pending: Invoice[] }> = {};

    invoices.forEach((inv) => {
      if (inv.status === "PENDING" || inv.status === "PARTIAL" || inv.status === "OVERDUE") {
        if (!studentDebts[inv.studentId]) {
          studentDebts[inv.studentId] = { overdue: [], pending: [] };
        }

        const due = new Date(inv.dueDate);
        if (due < today) {
          studentDebts[inv.studentId].overdue.push(inv);
        } else {
          studentDebts[inv.studentId].pending.push(inv);
        }
      }
    });

    const summaries: DefaulterStudentSummary[] = [];

    Object.entries(studentDebts).forEach(([studentId, { overdue, pending }]) => {
      const student = studentsMap[studentId] || {
        publicId: studentId,
        firstName: "Estudiante",
        lastName: `(${studentId.slice(0, 8)})`,
        identityNumber: "No registrada",
        userCode: "EST-" + studentId.slice(0, 4),
        status: true,
        email: "estudiante@colegio.edu.hn",
      };

      const totalOverdueAmount = overdue.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
      const totalPendingAmount = pending.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

      // Calcular días de mora más antiguo
      let maxDaysOverdue = 0;
      let oldestDueDate = "";

      overdue.forEach((inv) => {
        const dueDate = new Date(inv.dueDate);
        const diffMs = today.getTime() - dueDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        if (diffDays > maxDaysOverdue) {
          maxDaysOverdue = diffDays;
          oldestDueDate = inv.dueDate;
        }
      });

      summaries.push({
        student: student as Student,
        overdueInvoices: overdue,
        pendingInvoices: pending,
        totalOverdueAmount,
        totalPendingAmount,
        maxDaysOverdue,
        oldestDueDate: oldestDueDate || (pending[0]?.dueDate ?? ""),
      });
    });

    // Ordenar de mayor mora a menor
    return summaries.sort((a, b) => b.totalOverdueAmount - a.totalOverdueAmount || b.maxDaysOverdue - a.maxDaysOverdue);
  }, [invoices, studentsMap, today]);

  // 2. Filtros de búsqueda y antigüedad
  const filteredDefaulters = useMemo(() => {
    return defaultersList.filter((item) => {
      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = `${item.student.firstName} ${item.student.lastName}`.toLowerCase();
        const dni = (item.student.identityNumber || "").toLowerCase();
        const code = (item.student.userCode || "").toLowerCase();
        if (!name.includes(q) && !dni.includes(q) && !code.includes(q)) {
          return false;
        }
      }

      // Filtro por antigüedad de mora
      if (agingFilter === "RECENT") {
        return item.maxDaysOverdue > 0 && item.maxDaysOverdue <= 30;
      }
      if (agingFilter === "MEDIUM") {
        return item.maxDaysOverdue >= 31 && item.maxDaysOverdue <= 60;
      }
      if (agingFilter === "CRITICAL") {
        return item.maxDaysOverdue > 60;
      }

      return true;
    });
  }, [defaultersList, searchQuery, agingFilter]);

  // 3. Métricas Globales de Cobranza & Morosidad
  const metrics = useMemo(() => {
    const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const totalCollected = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalOverdue = defaultersList.reduce((sum, d) => sum + d.totalOverdueAmount, 0);
    const totalPending = defaultersList.reduce((sum, d) => sum + d.totalPendingAmount, 0);

    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;
    const delinquentStudentsCount = defaultersList.filter((d) => d.totalOverdueAmount > 0).length;

    const avgDaysOverdue =
      delinquentStudentsCount > 0
        ? Math.round(
            defaultersList
              .filter((d) => d.maxDaysOverdue > 0)
              .reduce((sum, d) => sum + d.maxDaysOverdue, 0) / (delinquentStudentsCount || 1)
          )
        : 0;

    return {
      totalBilled,
      totalCollected,
      totalOverdue,
      totalPending,
      collectionRate,
      delinquentStudentsCount,
      avgDaysOverdue,
    };
  }, [invoices, payments, defaultersList]);

  // 4. Datos del gráfico mensual dual: Facturado vs Recaudado
  const monthlyChartData = useMemo(() => {
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ];

    const currentYear = new Date().getFullYear();

    const chart = months.map((monthName, idx) => {
      // Invoices emitidas en este mes
      const billed = invoices
        .filter((inv) => {
          const d = new Date(inv.issueDate);
          return d.getFullYear() === currentYear && d.getMonth() === idx;
        })
        .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

      // Pagos recibidos en este mes
      const collected = payments
        .filter((p) => {
          const d = new Date(p.paymentDate);
          return d.getFullYear() === currentYear && d.getMonth() === idx && p.status === "COMPLETED";
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      return {
        month: monthName,
        billed,
        collected,
        rate: billed > 0 ? Math.min(100, Math.round((collected / billed) * 100)) : 0,
      };
    });

    const maxVal = Math.max(
      ...chart.map((c) => Math.max(c.billed, c.collected)),
      5000
    );

    return { chart, maxVal };
  }, [invoices, payments]);

  // Handler para disparar recordatorio de WhatsApp
  const handleWhatsAppReminder = (summary: DefaulterStudentSummary) => {
    const studentName = `${summary.student.firstName} ${summary.student.lastName}`;
    const amount = summary.totalOverdueAmount > 0 ? summary.totalOverdueAmount : summary.totalPendingAmount;
    const phone = summary.student.phone || "99887766";
    const cleanPhone = phone.replace(/\D/g, "");

    const message = `Estimado(a) padre/tutor de ${studentName}: Le saludamos de Administración de Centro Educativo Luz del Saber. Le recordamos cordialmente que presenta un saldo pendiente de L. ${amount.toFixed(2)} correspondiente a colegiaturas. Le invitamos a pasar a caja o enviar su comprobante bancario. ¡Muchas gracias!`;

    const url = `https://wa.me/504${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleOpenStatement = (student: Student) => {
    setSelectedStudentForStatement(student);
    setIsStatementOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* METRIC BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Deuda Vencida en Mora</span>
            <span className="p-2 rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">
            L. {metrics.totalOverdue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {metrics.delinquentStudentsCount} alumnos con mensualidades vencidas
          </p>
        </Card>

        <Card className="p-5 border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa de Recaudación</span>
            <span className="p-2 rounded-xl bg-lime-100 text-lime-700">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">
            {metrics.collectionRate.toFixed(1)}%
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-100 mt-2 overflow-hidden">
            <div
              className="h-full bg-lime-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
            />
          </div>
        </Card>

        <Card className="p-5 border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recaudado (Caja)</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            L. {metrics.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            de L. {metrics.totalBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })} emitidos
          </p>
        </Card>

        <Card className="p-5 border-neutral-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-bold uppercase tracking-wider">Promedio Días de Mora</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {metrics.avgDaysOverdue} días
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            antigüedad promedio de saldos impagos
          </p>
        </Card>
      </div>

      {/* DUAL ANALYTICS CHART: BILLED VS COLLECTED */}
      <Card className="p-6 border-neutral-200/80 bg-white shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-neutral-950 text-white">
                <BarChart3 className="size-4 text-lime-400" />
              </span>
              <h3 className="text-base font-black text-neutral-950">
                Comparativo Mensual: Facturación vs. Cobranza Efectiva
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Control de volumen facturado versus ingresos recaudados mes a mes en el año lectivo.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-neutral-800" />
              <span className="text-neutral-700">Facturado (L.)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-lime-500" />
              <span className="text-neutral-700">Recaudado (L.)</span>
            </div>
          </div>
        </div>

        {/* BARS VISUALIZATION */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-12 gap-2 sm:gap-4 items-end h-48 border-b border-neutral-200 pb-2">
            {monthlyChartData.chart.map((item, idx) => {
              const billedHeight = Math.max(6, (item.billed / monthlyChartData.maxVal) * 100);
              const collectedHeight = Math.max(6, (item.collected / monthlyChartData.maxVal) * 100);
              const isCurrentMonth = idx === new Date().getMonth();

              return (
                <div key={item.month} className="flex flex-col items-center h-full justify-end group relative">
                  {/* TOOLTIP ON HOVER */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] p-2 rounded-xl whitespace-nowrap shadow-lg pointer-events-none z-20">
                    <p className="font-bold">{item.month}</p>
                    <p className="text-neutral-300">Facturado: L. {item.billed.toFixed(2)}</p>
                    <p className="text-lime-400">Cobrado: L. {item.collected.toFixed(2)} ({item.rate}%)</p>
                  </div>

                  {/* BARS */}
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    <div
                      className="w-2.5 sm:w-4 rounded-t-sm bg-neutral-800 transition-all duration-300 group-hover:bg-neutral-950"
                      style={{ height: `${billedHeight}%` }}
                    />
                    <div
                      className="w-2.5 sm:w-4 rounded-t-sm bg-lime-500 transition-all duration-300 group-hover:bg-lime-400"
                      style={{ height: `${collectedHeight}%` }}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-bold mt-2 ${
                      isCurrentMonth ? "text-neutral-950 font-black" : "text-neutral-400"
                    }`}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* DEFAULTERS LIST HEADER & FILTERS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              Expedientes con Deuda y Cuentas por Cobrar ({filteredDefaulters.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Envía recordatorios directos por WhatsApp, genera estados de cuenta o cobra en caja con un solo clic.
            </p>
          </div>

          {/* AGING BUCKET PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-neutral-100/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setAgingFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                agingFilter === "ALL"
                  ? "bg-white text-neutral-950 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Todos ({defaultersList.length})
            </button>
            <button
              type="button"
              onClick={() => setAgingFilter("RECENT")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                agingFilter === "RECENT"
                  ? "bg-white text-neutral-950 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              1 a 30 días
            </button>
            <button
              type="button"
              onClick={() => setAgingFilter("MEDIUM")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                agingFilter === "MEDIUM"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              31 a 60 días
            </button>
            <button
              type="button"
              onClick={() => setAgingFilter("CRITICAL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                agingFilter === "CRITICAL"
                  ? "bg-white text-red-600 shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              &gt; 60 días
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar moroso por nombre de alumno, número de identidad DNI o código..."
            className="pl-10 rounded-2xl bg-white border-neutral-200 text-xs py-5 focus-visible:ring-neutral-950"
          />
        </div>

        {/* DEFAULTERS CARDS */}
        <div className="space-y-3">
          {filteredDefaulters.length === 0 ? (
            <Card className="p-12 text-center border-neutral-200/80 bg-white">
              <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-neutral-900">
                No se registran alumnos en mora en esta categoría
              </h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                Todos los tutores han cumplido puntualmente con sus compromisos de pago o no coinciden con los filtros seleccionados.
              </p>
            </Card>
          ) : (
            filteredDefaulters.map((item) => {
              const isOverdue = item.totalOverdueAmount > 0;
              return (
                <Card
                  key={item.student.publicId}
                  className="p-5 border-neutral-200/80 bg-white shadow-2xs hover:border-neutral-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* STUDENT & CONTACT INFO */}
                  <div className="flex items-start gap-4">
                    <div className="size-11 rounded-2xl bg-neutral-950 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-lime-400 text-base">
                        {item.student.firstName[0]}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-neutral-950">
                          {item.student.firstName} {item.student.lastName}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-neutral-100 text-neutral-700 border-neutral-200"
                        >
                          {item.student.userCode || "EST-GEN"}
                        </Badge>
                        {isOverdue ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold">
                            {item.maxDaysOverdue} días de mora
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                            Por Vencer
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                        <span>
                          DNI: <strong className="text-neutral-700 font-mono">{item.student.identityNumber || "N/A"}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {item.student.phone || "(+504) 9988-7766"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          {item.student.email || "tutor@luzdelsaber.edu.hn"}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-400 mt-1">
                        {item.overdueInvoices.length > 0 && (
                          <span>
                            {item.overdueInvoices.length} factura(s) vencida(s):{" "}
                            {item.overdueInvoices.map((inv) => inv.invoiceNumber).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DEBT AMOUNT & QUICK ACTIONS */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        Saldo Pendiente
                      </span>
                      <p className="text-xl font-black text-red-600 font-mono">
                        L. {(item.totalOverdueAmount || item.totalPendingAmount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Venció: {item.oldestDueDate ? new Date(item.oldestDueDate).toLocaleDateString("es-HN") : "Próximo"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* WHATSAPP REMINDER */}
                      <button
                        type="button"
                        onClick={() => handleWhatsAppReminder(item)}
                        className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl text-xs font-bold px-3 py-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* ACCOUNT STATEMENT */}
                      <button
                        type="button"
                        onClick={() => handleOpenStatement(item.student)}
                        className="flex items-center border border-neutral-300 hover:bg-neutral-100 text-neutral-700 gap-1.5 rounded-xl text-xs font-semibold px-3 py-2 cursor-pointer transition-colors bg-white shadow-2xs"
                      >
                        <FileText className="size-3.5" />
                        <span>Estado de Cuenta</span>
                      </button>

                      {/* COBRAR EN POS SHORTCUT */}
                      <button
                        type="button"
                        onClick={() => onCollectAtPos(item.student)}
                        className="flex items-center bg-neutral-950 hover:bg-neutral-800 text-white gap-1.5 rounded-xl text-xs font-bold px-3.5 py-2 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Wallet className="size-3.5 text-lime-400" />
                        <span>Cobrar en Caja</span>
                        <ChevronRight className="size-3 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* ACCOUNT STATEMENT MODAL */}
      <AccountStatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        student={selectedStudentForStatement}
        invoices={invoices}
        payments={payments}
        schoolCode={schoolCode}
      />
    </div>
  );
}
