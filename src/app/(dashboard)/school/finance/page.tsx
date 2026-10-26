"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogBody, DialogFooter
} from "@/components/ui/dialog";
import {
  DollarSign, Receipt, CreditCard, Plus, Search, Filter,
  RotateCcw, CheckCircle2, AlertCircle, Clock, FileText,
  User, Calendar, Loader2, Trash2, Printer,
  GraduationCap, Wallet, Banknote, CheckCheck,
  Tag, Sparkles, Check, ArrowRight, Edit3
} from "lucide-react";
import {
  financeService, Invoice, Payment, PaymentConcept, PaymentMethod
} from "@/lib/services/finance.service";
import { studentsService, Student } from "@/lib/services/api.service";
import { enrollmentsService, StudentEnrollment } from "@/lib/services/enrollments.service";
import { AsyncStudentSearch } from "@/components/finance/async-student-search";

export default function FinancePage() {
  const { user } = useAuthStore();
  const schoolCode = user?.schoolCode || "ESC001";
  const cashierName = user?.firstName ? `${user.firstName} ${user.lastName || ""}` : (user?.username || "Cajero Institucional");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"pos" | "invoices" | "payments" | "concepts">("pos");

  // Filters for Invoices Tab
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStudent, setFilterStudent] = useState("ALL");

  // Filters for Payments Tab
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");

  // POS / Ventanilla de Cobro State
  const [posSelectedStudent, setPosSelectedStudent] = useState<Student | null>(null);

  // New Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [modalSelectedStudent, setModalSelectedStudent] = useState<Student | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    studentId: "",
    conceptCode: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    baseAmount: 1500,
    discountPercentage: 0,
    totalAmount: 1500,
    notes: "",
  });
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Payment Modal (Cashier)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethodId: 1, // Default 1: Efectivo
    amount: 0,
    cashReceived: 0,
    transactionReference: "",
    bankName: "BAC Credomatic",
    isTransferPending: true,
    notes: "",
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Quick Scholarship Modal
  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [studentForScholarship, setStudentForScholarship] = useState<Student | null>(null);
  const [newScholarshipPercentage, setNewScholarshipPercentage] = useState<number>(0);
  const [isSubmittingScholarship, setIsSubmittingScholarship] = useState(false);

  // Printable Receipt Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    invoice?: Invoice | null;
    payment?: Payment | null;
    student?: Student | null;
    cashierName: string;
    cashReceived?: number;
    changeGiven?: number;
  } | null>(null);

  // Transfer Reconciliation Dialog
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [paymentToReconcile, setPaymentToReconcile] = useState<Payment | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Enrollments & Student Custom Fees
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [posStudentEnrollment, setPosStudentEnrollment] = useState<StudentEnrollment | null>(null);

  // Fee Edit Dialog from Finance
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);
  const [enrollmentToEditInFinance, setEnrollmentToEditInFinance] = useState<StudentEnrollment | null>(null);
  const [financeFeeForm, setFinanceFeeForm] = useState({
    monthlyFee: 1500,
    scholarshipPercentage: 0,
    dueDay: 10,
    notes: "",
  });
  const [isSavingFinanceFee, setIsSavingFinanceFee] = useState(false);

  // Load finance data automatically filtered by the current school
  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes, conRes, methRes, enrRes] = await Promise.allSettled([
        financeService.getInvoices({ schoolCode }),
        financeService.getPayments({ schoolCode }),
        financeService.getPaymentConcepts({ schoolCode }),
        financeService.getPaymentMethods({ schoolCode }),
        enrollmentsService.getStudentEnrollments(schoolCode),
      ]);

      const newMap: Record<string, Student> = {};

      if (invRes.status === "fulfilled" && invRes.value.status && invRes.value.data) {
        setInvoices(invRes.value.data);
        invRes.value.data.forEach((inv) => {
          if (inv.student) {
            newMap[inv.studentId] = inv.student;
          }
        });
      }

      if (payRes.status === "fulfilled" && payRes.value.status && payRes.value.data) {
        setPayments(payRes.value.data);
        payRes.value.data.forEach((pay) => {
          if (pay.student) {
            newMap[pay.studentId] = pay.student;
          }
        });
      }

      if (conRes.status === "fulfilled" && conRes.value.status && conRes.value.data) {
        setConcepts(conRes.value.data);
      }

      if (methRes.status === "fulfilled" && methRes.value.status && methRes.value.data) {
        setPaymentMethods(methRes.value.data);
      }

      if (enrRes.status === "fulfilled" && enrRes.value.status && enrRes.value.data) {
        setEnrollments(enrRes.value.data);
        enrRes.value.data.forEach((enr) => {
          if (enr.student) {
            newMap[enr.studentId] = enr.student;
          }
        });
      }

      setStudentsMap((prev) => ({ ...prev, ...newMap }));
    } catch (err) {
      console.error("Error al cargar finanzas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [schoolCode]);

  // Sync active enrollment when student is selected in POS
  useEffect(() => {
    if (posSelectedStudent) {
      const enr = enrollments.find((e) => e.studentId === posSelectedStudent.publicId);
      if (enr) {
        setPosStudentEnrollment(enr);
      } else {
        enrollmentsService.getEnrollmentsByStudent(posSelectedStudent.publicId).then((res) => {
          if (res.status && res.data && res.data.length > 0) {
            setPosStudentEnrollment(res.data[0]);
          } else {
            setPosStudentEnrollment(null);
          }
        }).catch(() => setPosStudentEnrollment(null));
      }
    } else {
      setPosStudentEnrollment(null);
    }
  }, [posSelectedStudent, enrollments]);

  // Options for Student Filter in Invoices Tab (built strictly from students present in invoices to avoid full table load)
  const studentFilterOptions = useMemo(() => {
    const uniqueIds = Array.from(new Set(invoices.map((inv) => inv.studentId)));
    const opts = uniqueIds.map((id) => {
      const s = studentsMap[id];
      return {
        value: id,
        label: s ? `${s.firstName} ${s.lastName}` : `Estudiante (${id.slice(0, 8)})`,
        description: s?.identityNumber ? `DNI: ${s.identityNumber}` : s?.userCode,
      };
    });

    return [
      { value: "ALL", label: "Todos los Estudiantes con Recibos" },
      ...opts,
    ];
  }, [invoices, studentsMap]);

  // Metrics
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalTransfersPending = 0;
    let overdueCount = 0;
    let todayCollectedCash = 0;

    const todayStr = new Date().toISOString().split("T")[0];

    invoices.forEach((inv) => {
      const amount = Number(inv.totalAmount || 0);
      totalBilled += amount;

      if (inv.status === "PAID" || inv.status === "WAIVED") {
        totalCollected += amount;
      } else {
        totalPending += amount;
        if (inv.dueDate && inv.dueDate < todayStr) {
          overdueCount++;
        }
      }
    });

    payments.forEach((pay) => {
      const payAmount = Number(pay.amount || 0);
      const payDateStr = pay.paymentDate ? pay.paymentDate.split("T")[0] : "";

      const isCash = pay.paymentMethod?.name?.toLowerCase().includes("efectivo") ||
        pay.paymentMethodId === 1 ||
        (!pay.paymentMethod && !pay.transactionReference?.startsWith("TR-"));

      if (isCash && pay.status === "COMPLETED" && payDateStr === todayStr) {
        todayCollectedCash += payAmount;
      }

      if (pay.status === "PENDING") {
        totalTransfersPending += payAmount;
      }
    });

    return {
      totalBilled,
      totalCollected,
      totalPending,
      totalTransfersPending,
      overdueCount,
      todayCollectedCash,
    };
  }, [invoices, payments]);

  // Pending Invoices of Selected POS Student
  const studentPendingInvoices = useMemo(() => {
    if (!posSelectedStudent) return [];
    return invoices.filter(
      (inv) => inv.studentId === posSelectedStudent.publicId && inv.status !== "PAID" && inv.status !== "WAIVED"
    );
  }, [invoices, posSelectedStudent]);

  // Filtered invoices for Invoices Tab
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
        student?.identityNumber?.toLowerCase().includes(q) ||
        student?.userCode?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (filterStatus !== "ALL") {
        if (filterStatus === "TRANSFER_PENDING") {
          const hasPendingPay = payments.some(
            (p) => p.invoiceId === inv.id && p.status === "PENDING"
          );
          if (!hasPendingPay) return false;
        } else if (filterStatus === "WAIVED") {
          if (inv.status !== "WAIVED" && !(inv.status === "PAID" && Number(inv.totalAmount) === 0)) return false;
        } else if (inv.status !== filterStatus) {
          return false;
        }
      }

      // 3. Student Filter
      if (filterStudent !== "ALL" && inv.studentId !== filterStudent) return false;

      return true;
    });
  }, [invoices, searchQuery, filterStatus, filterStudent, studentsMap, payments]);

  // Filtered payments for Payments Tab
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const q = paymentSearch.toLowerCase().trim();
      const student = studentsMap[pay.studentId];
      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : "";
      const matchesSearch =
        !q ||
        pay.transactionReference?.toLowerCase().includes(q) ||
        studentName.includes(q) ||
        pay.notes?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (paymentMethodFilter !== "ALL") {
        if (pay.paymentMethodId !== Number(paymentMethodFilter)) return false;
      }

      if (paymentStatusFilter !== "ALL") {
        if (pay.status !== paymentStatusFilter) return false;
      }

      return true;
    });
  }, [payments, paymentSearch, paymentMethodFilter, paymentStatusFilter, studentsMap]);

  // Handle open create invoice
  const handleOpenCreateInvoice = (preselectedStudent?: Student | null) => {
    const defaultStudent = preselectedStudent || null;
    const defaultConcept = concepts[0] || { code: "MENSUALIDAD", amount: 1500 };
    const scholarship = defaultStudent?.scholarshipPercentage || 0;
    const base = Number(defaultConcept.amount) || 1500;
    const discounted = Math.max(0, base - (base * scholarship) / 100);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().getFullYear();

    setModalSelectedStudent(defaultStudent);
    setInvoiceForm({
      studentId: defaultStudent?.publicId || "",
      conceptCode: defaultConcept.code,
      invoiceNumber: `INV-${dateStr}-${randomNum}`,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      baseAmount: base,
      discountPercentage: scholarship,
      totalAmount: discounted,
      notes: scholarship === 100
        ? "Exonerado por Beca Completa (100%)"
        : scholarship > 0
        ? `Aplica Beca (${scholarship}%)`
        : "Colegiatura / mensualidad regular",
    });
    setInvoiceError(null);
    setIsInvoiceModalOpen(true);
  };

  // Recalculate invoice modal amount when student or concept changes
  const handleInvoiceStudentOrConceptChange = (student?: Student | null, newConceptCode?: string) => {
    const stu = student !== undefined ? student : modalSelectedStudent;
    const conceptCode = newConceptCode !== undefined ? newConceptCode : invoiceForm.conceptCode;

    const concept = concepts.find((c) => c.code === conceptCode) || concepts[0];

    const scholarship = stu?.scholarshipPercentage || 0;
    const base = concept ? Number(concept.amount) : 1500;
    const discounted = Math.max(0, base - (base * scholarship) / 100);

    setInvoiceForm((prev) => ({
      ...prev,
      studentId: stu?.publicId || "",
      conceptCode: conceptCode,
      baseAmount: base,
      discountPercentage: scholarship,
      totalAmount: discounted,
      notes: scholarship === 100
        ? "Exonerado por Beca Completa (100%)"
        : scholarship > 0
        ? `Aplica Beca (${scholarship}%)`
        : prev.notes || "Colegiatura regular",
    }));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.studentId) {
      setInvoiceError("Debes buscar y seleccionar a un estudiante titular");
      return;
    }

    try {
      setIsSubmittingInvoice(true);
      setInvoiceError(null);

      const isWaived = invoiceForm.discountPercentage === 100 || Number(invoiceForm.totalAmount) === 0;

      const res = await financeService.createInvoice({
        schoolCode,
        studentId: invoiceForm.studentId,
        invoiceNumber: invoiceForm.invoiceNumber,
        issueDate: invoiceForm.issueDate,
        dueDate: invoiceForm.dueDate,
        totalAmount: Number(invoiceForm.totalAmount),
        status: isWaived ? "PAID" : "PENDING",
        notes: invoiceForm.notes,
      });

      if (res.status && res.data) {
        setIsInvoiceModalOpen(false);
        await loadFinanceData();

        if (isWaived) {
          const stu = studentsMap[invoiceForm.studentId] || modalSelectedStudent;
          setReceiptData({
            invoice: res.data,
            student: stu,
            cashierName,
          });
          setIsReceiptModalOpen(true);
        }
      } else {
        setInvoiceError(res.message || "Error al crear factura");
      }
    } catch (err: any) {
      setInvoiceError(err?.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const amount = Number(invoice.totalAmount);
    setPaymentForm({
      paymentMethodId: 1, // Default 1: Efectivo
      amount,
      cashReceived: amount,
      transactionReference: `REC-CAJA-${Date.now().toString().slice(-6)}`,
      bankName: "BAC Credomatic",
      isTransferPending: true,
      notes: "Cobro presencial en ventanilla de caja",
    });
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  // Register Payment
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const selectedMethod = paymentMethods.find((m) => m.id === paymentForm.paymentMethodId);
    const isCash = selectedMethod?.name?.toLowerCase().includes("efectivo") || paymentForm.paymentMethodId === 1;
    const isTransfer = selectedMethod?.name?.toLowerCase().includes("transferencia") ||
      selectedMethod?.name?.toLowerCase().includes("depósito") ||
      paymentForm.paymentMethodId === 2 || paymentForm.paymentMethodId === 3;

    if (isTransfer && !paymentForm.transactionReference.trim()) {
      setPaymentError("Debes ingresar el N° de comprobante o referencia bancaria");
      return;
    }

    if (isCash && paymentForm.cashReceived < paymentForm.amount) {
      setPaymentError(`El efectivo entregado (L. ${paymentForm.cashReceived}) no puede ser menor al monto a pagar (L. ${paymentForm.amount})`);
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setPaymentError(null);

      const finalStatus = isCash ? "COMPLETED" : (isTransfer && paymentForm.isTransferPending ? "PENDING" : "COMPLETED");

      const notesFormatted = isCash
        ? `Pago en efectivo en caja. Recibido: L. ${paymentForm.cashReceived} - Vuelto: L. ${(paymentForm.cashReceived - paymentForm.amount).toFixed(2)}. ${paymentForm.notes}`
        : isTransfer
        ? `Transferencia bancaria (${paymentForm.bankName}). Ref: ${paymentForm.transactionReference}. ${paymentForm.isTransferPending ? "[Pendiente de Verificación]" : "[Verificado en Línea]"}. ${paymentForm.notes}`
        : paymentForm.notes;

      const res = await financeService.createPayment({
        schoolCode,
        invoiceId: selectedInvoice.id,
        studentId: selectedInvoice.studentId,
        paymentMethodId: paymentForm.paymentMethodId,
        amount: Number(paymentForm.amount),
        paymentDate: new Date().toISOString(),
        transactionReference: paymentForm.transactionReference,
        status: finalStatus,
        notes: notesFormatted,
        recordedBy: user?.sub,
      });

      if (res.status && res.data) {
        if (finalStatus === "COMPLETED") {
          await financeService.updateInvoice(selectedInvoice.id, { status: "PAID" });
        }

        setIsPaymentModalOpen(false);
        await loadFinanceData();

        const student = studentsMap[selectedInvoice.studentId];
        setReceiptData({
          invoice: selectedInvoice,
          payment: res.data,
          student,
          cashierName,
          cashReceived: isCash ? paymentForm.cashReceived : undefined,
          changeGiven: isCash ? Math.max(0, paymentForm.cashReceived - paymentForm.amount) : undefined,
        });
        setIsReceiptModalOpen(true);
      } else {
        setPaymentError(res.message || "Error al registrar pago");
      }
    } catch (err: any) {
      setPaymentError(err?.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Reconcile pending transfer
  const handleOpenReconcile = (payment: Payment) => {
    setPaymentToReconcile(payment);
    setIsReconcileModalOpen(true);
  };

  const handleConfirmReconcile = async () => {
    if (!paymentToReconcile) return;
    try {
      setIsReconciling(true);
      await financeService.updatePayment(paymentToReconcile.id, {
        status: "COMPLETED",
        notes: `${paymentToReconcile.notes || ""} • [Transferencia Conciliada y Aprobada por ${cashierName}]`,
      });

      if (paymentToReconcile.invoiceId) {
        await financeService.updateInvoice(paymentToReconcile.invoiceId, {
          status: "PAID",
        });
      }

      setIsReconcileModalOpen(false);
      setPaymentToReconcile(null);
      await loadFinanceData();
    } catch (err: any) {
      alert("Error al conciliar pago: " + (err?.message || "Error desconocido"));
    } finally {
      setIsReconciling(false);
    }
  };

  // Open Scholarship Modal
  const handleOpenScholarshipModal = (student: Student) => {
    setStudentForScholarship(student);
    setNewScholarshipPercentage(student.scholarshipPercentage || 0);
    setIsScholarshipModalOpen(true);
  };

  const handleSaveScholarship = async () => {
    if (!studentForScholarship) return;
    try {
      setIsSubmittingScholarship(true);
      const res = await studentsService.updateStudent(studentForScholarship.publicId, {
        scholarshipPercentage: Number(newScholarshipPercentage),
      });
      if (res.status) {
        // Update cached student
        const updatedStudent = { ...studentForScholarship, scholarshipPercentage: Number(newScholarshipPercentage) };
        setStudentsMap((prev) => ({ ...prev, [updatedStudent.publicId]: updatedStudent }));
        if (posSelectedStudent?.publicId === updatedStudent.publicId) {
          setPosSelectedStudent(updatedStudent);
        }
        setIsScholarshipModalOpen(false);
        await loadFinanceData();
      } else {
        alert(res.message || "No se pudo actualizar la beca");
      }
    } catch (err: any) {
      alert("Error al actualizar beca: " + (err?.message || "Error de red"));
    } finally {
      setIsSubmittingScholarship(false);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (id: number) => {
    if (!confirm("¿Seguro que deseas anular o eliminar este comprobante de pago?")) return;
    try {
      await financeService.deleteInvoice(id);
      loadFinanceData();
    } catch (err: any) {
      alert(err?.message || "No se pudo eliminar");
    }
  };

  // POS Fast Bill and Pay (Concept)
  const handlePOSCreateAndPay = async (concept: PaymentConcept) => {
    if (!posSelectedStudent) return;

    const isMonthly = concept.name.toLowerCase().includes("mensual") ||
      concept.name.toLowerCase().includes("colegiatura") ||
      concept.isRecurring;

    const baseAmount = (isMonthly && posStudentEnrollment && Number(posStudentEnrollment.monthlyFee) > 0)
      ? Number(posStudentEnrollment.monthlyFee)
      : (Number(concept.amount) || 1500);

    const scholarship = (posStudentEnrollment && posStudentEnrollment.scholarshipPercentage !== undefined)
      ? Number(posStudentEnrollment.scholarshipPercentage)
      : (posSelectedStudent.scholarshipPercentage || 0);

    const isFullScholarship = scholarship === 100;
    const discountedAmount = Math.max(0, baseAmount - (baseAmount * scholarship) / 100);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNum = `INV-${new Date().getFullYear()}-${randomNum}`;

    try {
      setLoading(true);
      const res = await financeService.createInvoice({
        schoolCode,
        studentId: posSelectedStudent.publicId,
        invoiceNumber: invoiceNum,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        totalAmount: discountedAmount,
        status: isFullScholarship ? "PAID" : "PENDING",
        notes: isFullScholarship
          ? `${concept.name} - Exonerado por Beca Completa (100%)`
          : scholarship > 0
          ? `${concept.name} - Aplica Beca ${scholarship}% (Tarifa Base L. ${baseAmount})`
          : `${concept.name} - Cobro en Ventanilla (Tarifa L. ${baseAmount})`,
      });

      await loadFinanceData();

      if (isFullScholarship) {
        setReceiptData({
          invoice: res.data,
          student: posSelectedStudent,
          cashierName,
        });
        setIsReceiptModalOpen(true);
      } else if (res.data) {
        handleOpenPayment(res.data);
      }
    } catch (err: any) {
      alert("Error al emitir cobro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // POS Fast Bill Assigned Monthly Tuition (1-Click)
  const handlePOSPayAssignedMonthlyFee = async () => {
    if (!posSelectedStudent) return;

    const baseAmount = posStudentEnrollment && Number(posStudentEnrollment.monthlyFee) > 0
      ? Number(posStudentEnrollment.monthlyFee)
      : 1500;

    const scholarship = posStudentEnrollment?.scholarshipPercentage !== undefined
      ? Number(posStudentEnrollment.scholarshipPercentage)
      : (posSelectedStudent.scholarshipPercentage || 0);

    const isFullScholarship = scholarship === 100;
    const discountedAmount = Math.max(0, baseAmount - (baseAmount * scholarship) / 100);

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const currentMonthName = months[new Date().getMonth()];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNum = `MENS-${new Date().getFullYear()}-${randomNum}`;

    try {
      setLoading(true);
      const res = await financeService.createInvoice({
        schoolCode,
        studentId: posSelectedStudent.publicId,
        invoiceNumber: invoiceNum,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        totalAmount: discountedAmount,
        status: isFullScholarship ? "PAID" : "PENDING",
        notes: isFullScholarship
          ? `Colegiatura ${currentMonthName} ${new Date().getFullYear()} - Exonerado por Beca Completa (100%)`
          : scholarship > 0
          ? `Colegiatura ${currentMonthName} ${new Date().getFullYear()} - Cuota Asignada L. ${baseAmount} (Beca ${scholarship}%)`
          : `Colegiatura ${currentMonthName} ${new Date().getFullYear()} - Cuota Mensual Asignada L. ${baseAmount}`,
      });

      await loadFinanceData();

      if (isFullScholarship) {
        setReceiptData({
          invoice: res.data,
          student: posSelectedStudent,
          cashierName,
        });
        setIsReceiptModalOpen(true);
      } else if (res.data) {
        handleOpenPayment(res.data);
      }
    } catch (err: any) {
      alert("Error al emitir cobro de mensualidad: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Fee Edit from Finance
  const handleOpenEditFeeFromFinance = (enrollment: StudentEnrollment) => {
    setEnrollmentToEditInFinance(enrollment);
    setFinanceFeeForm({
      monthlyFee: Number(enrollment.monthlyFee) || 1500,
      scholarshipPercentage: Number(enrollment.scholarshipPercentage) || 0,
      dueDay: Number(enrollment.dueDay) || 10,
      notes: enrollment.notes || "",
    });
    setIsEditFeeModalOpen(true);
  };

  const handleSaveFinanceFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentToEditInFinance) return;

    try {
      setIsSavingFinanceFee(true);
      const res = await enrollmentsService.updateStudentEnrollment(enrollmentToEditInFinance.id, {
        monthlyFee: Number(financeFeeForm.monthlyFee) || 0,
        scholarshipPercentage: Number(financeFeeForm.scholarshipPercentage) || 0,
        dueDay: Number(financeFeeForm.dueDay) || 10,
        notes: financeFeeForm.notes,
      });

      if (res.status) {
        setIsEditFeeModalOpen(false);
        setEnrollmentToEditInFinance(null);
        await loadFinanceData();
      } else {
        alert(res.message || "Error al actualizar tarifa");
      }
    } catch (err: any) {
      alert("Error al guardar tarifa: " + (err?.message || "Error de red"));
    } finally {
      setIsSavingFinanceFee(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-lime-400/20 shrink-0">
            <DollarSign className="size-8" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Caja Institucional & Finanzas
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                <CheckCheck className="size-3" /> Escuela {schoolCode}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Atención en ventanilla, liquidación de colegiaturas con becas, búsqueda rápida y conciliación bancaria.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => handleOpenCreateInvoice(posSelectedStudent)}
            className="h-11 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-xs gap-2 cursor-pointer"
          >
            <Plus className="size-4 text-lime-400" />
            <span>Emitir Factura Manual</span>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS / ARQUEO RESUMIDO */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-neutral-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Efectivo en Caja (Hoy)</span>
            <div className="size-8 rounded-xl bg-lime-100 flex items-center justify-center text-lime-800">
              <Banknote className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-lime-600 mt-2">
            L. {metrics.todayCollectedCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Recaudado hoy en ventanilla</p>
        </Card>

        <Card className="p-5 border-neutral-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Recaudado</span>
            <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
              <CheckCircle2 className="size-4 text-lime-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-2">
            L. {metrics.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">Pagos confirmados y exoneraciones</p>
        </Card>

        <Card className="p-5 border-neutral-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Transferencias x Conciliar</span>
            <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            L. {metrics.totalTransfersPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Vouchers bancarios por validar</p>
        </Card>

        <Card className="p-5 border-neutral-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Saldo Pendiente / Mora</span>
            <div className="size-8 rounded-xl bg-red-100 flex items-center justify-center text-red-800">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">
            L. {metrics.totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">{metrics.overdueCount} recibos vencidos</p>
        </Card>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-neutral-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "pos"
                ? "border-neutral-950 text-neutral-950 bg-neutral-50/50 rounded-t-xl"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Wallet className="size-4 text-lime-500" />
            <span>Ventanilla de Cobro Rápido (POS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "invoices"
                ? "border-neutral-950 text-neutral-950 bg-neutral-50/50 rounded-t-xl"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Receipt className="size-4 text-neutral-500" />
            <span>Listado de Facturas ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "payments"
                ? "border-neutral-950 text-neutral-950 bg-neutral-50/50 rounded-t-xl"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <CreditCard className="size-4 text-neutral-500" />
            <span>Historial de Pagos & Arqueo ({payments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("concepts")}
            className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "concepts"
                ? "border-neutral-950 text-neutral-950 bg-neutral-50/50 rounded-t-xl"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Tag className="size-4 text-neutral-500" />
            <span>Tarifas & Métodos</span>
          </button>
        </div>
      </div>

      {/* TAB 1: VENTANILLA DE COBRO RÁPIDO (POS) */}
      {activeTab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SEARCH & STUDENT CARD (Left Column) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 border-neutral-200/80 bg-white space-y-5">
              <div>
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                  <User className="size-4 text-neutral-600" />
                  Búsqueda Instantánea del Estudiante
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Ingresa DNI/identidad o nombre completo para localizar al alumno.
                </p>
              </div>

              {/* ASYNC SEARCH (NO PRELOADED MASSIVE LIST) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-neutral-700">Buscar Alumno en Ventanilla</Label>
                <AsyncStudentSearch
                  selectedStudent={posSelectedStudent}
                  schoolCode={schoolCode}
                  onSelectStudent={(student) => {
                    setPosSelectedStudent(student);
                    if (student) {
                      setStudentsMap((prev) => ({ ...prev, [student.publicId]: student }));
                    }
                  }}
                  placeholder="Escribe DNI (ej. 0501199710597) o nombre del estudiante..."
                />
              </div>

              {posSelectedStudent ? (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-4 animate-in fade-in-50 duration-150">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-neutral-950 text-lime-400 font-black flex items-center justify-center text-base shadow-xs">
                        {posSelectedStudent.firstName?.[0] || "E"}
                        {posSelectedStudent.lastName?.[0] || "S"}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neutral-900">
                          {posSelectedStudent.firstName} {posSelectedStudent.lastName}
                        </h4>
                        <div className="text-[11px] font-mono text-neutral-500">
                          Carnet: {posSelectedStudent.userCode || "N/A"}
                        </div>
                        {posSelectedStudent.identityNumber && (
                          <div className="text-[11px] text-neutral-400 font-mono">
                            DNI: {posSelectedStudent.identityNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TARIFA Y MENSUALIDAD ASIGNADA */}
                  <div className="pt-2 border-t border-neutral-200/80 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="size-3.5 text-lime-600" />
                        Tarifa Mensual Asignada
                      </span>
                      {posStudentEnrollment && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditFeeFromFinance(posStudentEnrollment)}
                          className="text-[11px] font-bold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="size-3" />
                          <span>Ajustar Tarifa</span>
                        </button>
                      )}
                    </div>

                    {posStudentEnrollment ? (
                      <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Grado Matriculado:</span>
                          <span className="font-bold text-neutral-900">{posStudentEnrollment.grade?.name || posStudentEnrollment.gradeCode || "Asignado"}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Mensualidad Base:</span>
                          <span className="font-mono font-bold text-neutral-900">
                            L. {Number(posStudentEnrollment.monthlyFee || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500">Vence:</span>
                          <span className="font-mono text-neutral-700">Día {posStudentEnrollment.dueDay || 10} de cada mes</span>
                        </div>
                        <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-700">Cuota Neta Mensual:</span>
                          <span className="text-sm font-black text-lime-700">
                            {posStudentEnrollment.scholarshipPercentage === 100
                              ? "Exonerado (L. 0.00)"
                              : `L. ${(Number(posStudentEnrollment.monthlyFee || 0) * (1 - (posStudentEnrollment.scholarshipPercentage || 0) / 100)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                        <span>Sin matrícula activa en este ciclo.</span>
                        <a href="/school/enrollments/annual" className="font-bold underline ml-2">Matricular</a>
                      </div>
                    )}
                  </div>

                  {/* SCHOLARSHIP CARD / BECA */}
                  <div className="pt-2 border-t border-neutral-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <GraduationCap className="size-3.5" />
                        Condición Financiera / Beca
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenScholarshipModal(posSelectedStudent)}
                        className="text-[11px] font-bold text-neutral-900 hover:underline cursor-pointer"
                      >
                        Gestionar Beca
                      </button>
                    </div>

                    {posSelectedStudent.scholarshipPercentage === 100 ? (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-600 shrink-0" />
                        <div>
                          <div>Beca Completa (100% Exonerado)</div>
                          <div className="text-[10px] font-normal text-amber-700">
                            Exonerado total de colegiatura. Comprobantes emitidos con costo L. 0.00.
                          </div>
                        </div>
                      </div>
                    ) : (posSelectedStudent.scholarshipPercentage || 0) > 0 ? (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
                        <Tag className="size-4 text-blue-600 shrink-0" />
                        <div>
                          <div>
                            {posSelectedStudent.scholarshipPercentage === 50
                              ? "Media Beca (50%)"
                              : `Beca Parcial (${posSelectedStudent.scholarshipPercentage}%)`}
                          </div>
                          <div className="text-[10px] font-normal text-blue-700">
                            Aplica deducción automática del {posSelectedStudent.scholarshipPercentage}% en colegiaturas.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-medium flex items-center gap-2">
                        <Wallet className="size-4 text-neutral-400 shrink-0" />
                        <div>
                          <span className="font-bold">Tarifa Regular (Sin Beca - 0%)</span>
                          <div className="text-[10px] text-neutral-500">Paga el 100% de los conceptos facturados.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-neutral-200 text-neutral-400 text-xs space-y-1">
                  <Search className="size-6 mx-auto text-neutral-300" />
                  <div className="font-bold text-neutral-600">Empieza escribiendo para buscar al alumno</div>
                  <p className="text-[11px] text-neutral-400">
                    Escribe DNI (ej. 05011997) o nombre y selecciónalo del listado.
                  </p>
                </div>
              )}
            </Card>

            {/* CAJA EN TURNO RESUMEN */}
            <Card className="p-5 border-neutral-200/80 bg-neutral-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cajero en Turno</span>
                <span className="size-2 rounded-full bg-lime-400 animate-pulse"></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-neutral-800 text-lime-400 font-bold flex items-center justify-center text-sm border border-neutral-700">
                  {cashierName[0]}
                </div>
                <div>
                  <div className="font-black text-sm text-white">{cashierName}</div>
                  <div className="text-[11px] text-neutral-400">Punto de Cobro Presencial • Escuela {schoolCode}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: PENDING INVOICES & QUICK COBRO */}
          <div className="lg:col-span-7 space-y-6">
            {posSelectedStudent ? (
              <>
                {/* 1. FACTURAS PENDIENTES DEL ALUMNO */}
                <Card className="p-6 border-neutral-200/80 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-neutral-900">
                        Cuentas por Cobrar Pendientes ({studentPendingInvoices.length})
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Recibos o mensualidades emitidas aún no liquidadas por este alumno.
                      </p>
                    </div>
                  </div>

                  {studentPendingInvoices.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-lime-50 border border-lime-200 text-center space-y-1">
                      <CheckCircle2 className="size-6 text-lime-600 mx-auto" />
                      <div className="text-xs font-bold text-lime-900">
                        ¡Este alumno se encuentra solvente!
                      </div>
                      <p className="text-[11px] text-lime-700">
                        No tiene facturas ni colegiaturas pendientes de pago en este momento.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentPendingInvoices.map((inv) => {
                        const hasPendingTransfer = payments.some(
                          (p) => p.invoiceId === inv.id && p.status === "PENDING"
                        );

                        return (
                          <div
                            key={inv.id}
                            className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-300 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-neutral-900">
                                  {inv.invoiceNumber}
                                </span>
                                {hasPendingTransfer ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    Transferencia en Verificación
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                                    Pendiente de Pago
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-600 font-medium">{inv.notes || "Colegiatura regular"}</div>
                              <div className="text-[11px] text-neutral-400">
                                Vence: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Sin fecha"}
                              </div>
                            </div>

                            <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3">
                              <div className="text-lg font-black text-neutral-900">
                                L. {Number(inv.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleOpenPayment(inv)}
                                className="h-9 px-4 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white shadow-2xs gap-1.5 cursor-pointer"
                              >
                                <CreditCard className="size-3.5 text-lime-400" />
                                <span>Cobrar en Ventanilla</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* 2. COBRO RÁPIDO DE MENSUALIDAD ASIGNADA */}
                {posStudentEnrollment && (
                  <Card className="p-5 border-lime-300 bg-lime-50/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-lime-200 text-lime-900 border border-lime-300">
                            Cuota Mensual Automática
                          </span>
                          <h4 className="text-sm font-black text-neutral-900">
                            Colegiatura del Mes ({["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][new Date().getMonth()]})
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          Calculado con la tarifa pactada para este estudiante en {posStudentEnrollment.grade?.name || posStudentEnrollment.gradeCode || "su grado"}.
                        </p>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right">
                          <div className="text-[10px] font-semibold text-neutral-500">Monto a Cancelar:</div>
                          <div className="text-xl font-black text-neutral-900">
                            {posStudentEnrollment.scholarshipPercentage === 100
                              ? "L. 0.00 (Exonerado)"
                              : `L. ${(Number(posStudentEnrollment.monthlyFee || 1500) * (1 - (posStudentEnrollment.scholarshipPercentage || 0) / 100)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handlePOSPayAssignedMonthlyFee}
                          className="h-10 px-5 rounded-xl text-xs font-black bg-neutral-950 hover:bg-neutral-800 text-white shadow-xs gap-1.5 cursor-pointer shrink-0"
                        >
                          <CreditCard className="size-4 text-lime-400" />
                          <span>{posStudentEnrollment.scholarshipPercentage === 100 ? "Emitir Exonerado" : "Cobrar Mensualidad"}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* 3. EMITIR NUEVO COBRO INMEDIATO AL ALUMNO */}
                <Card className="p-6 border-neutral-200/80 bg-white space-y-4">
                  <div>
                    <h3 className="text-base font-black text-neutral-900">
                      Emitir & Cobrar Nuevo Concepto
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Selecciona un concepto oficial para liquidar en ventanilla en 1 paso.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {concepts.map((concept) => {
                      const base = Number(concept.amount) || 1500;
                      const scholarship = posSelectedStudent.scholarshipPercentage || 0;
                      const isFull = scholarship === 100;
                      const finalAmount = Math.max(0, base - (base * scholarship) / 100);

                      return (
                        <div
                          key={concept.id}
                          className="p-4 rounded-2xl border border-neutral-200 hover:border-neutral-900 transition-all bg-neutral-50/50 flex flex-col justify-between gap-3 group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-neutral-900">{concept.name}</span>
                              {isFull ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  Beca 100%
                                </span>
                              ) : scholarship > 0 ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                  -{scholarship}% Beca
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{concept.code}</div>
                          </div>

                          <div className="flex items-end justify-between pt-2 border-t border-neutral-200/80">
                            <div>
                              {scholarship > 0 && !isFull && (
                                <div className="text-[10px] text-neutral-400 line-through">
                                  L. {base.toFixed(2)}
                                </div>
                              )}
                              <div className="text-base font-black text-neutral-900">
                                {isFull ? "Exonerado (L. 0.00)" : `L. ${finalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handlePOSCreateAndPay(concept)}
                              className="h-8 px-3 rounded-lg text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white shadow-2xs gap-1 cursor-pointer"
                            >
                              <span>{isFull ? "Exonerar" : "Cobrar"}</span>
                              <ArrowRight className="size-3 text-lime-400" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12 border-neutral-200/80 bg-white text-center space-y-3">
                <div className="size-16 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <Wallet className="size-8" />
                </div>
                <h3 className="text-base font-black text-neutral-900">Ventanilla de Cobro Lista</h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  Utiliza el buscador a la izquierda e ingresa el DNI (ej. 05011997) o nombre para cargar al estudiante sin saturar el sistema.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LISTADO DE FACTURAS Y RECIBOS */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          {/* FILTER BAR */}
          <Card className="p-5 border-neutral-200/80 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-neutral-500" />
                <h3 className="text-sm font-bold text-neutral-900">Filtros de Búsqueda</h3>
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
                  placeholder="Buscar N° Factura, nombre, DNI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white border border-neutral-200/90 pl-10 pr-4 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              <div>
                <Combobox
                  options={studentFilterOptions}
                  value={filterStudent}
                  onChange={(val) => setFilterStudent(val || "ALL")}
                  placeholder="Filtrar por Estudiante"
                  searchPlaceholder="Buscar estudiante..."
                />
              </div>

              <div>
                <Combobox
                  options={[
                    { value: "ALL", label: "Todos los Estados" },
                    { value: "PENDING", label: "Pendientes de Pago", badge: "Pendiente" },
                    { value: "PAID", label: "Pagadas en Caja / Confirmadas", badge: "Pagado" },
                    { value: "TRANSFER_PENDING", label: "Transferencias x Conciliar", badge: "En Verificación" },
                    { value: "WAIVED", label: "Exoneradas por Beca (L. 0.00)", badge: "Beca" },
                    { value: "OVERDUE", label: "Vencidas", badge: "Mora" },
                  ]}
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val || "ALL")}
                  placeholder="Estado del Recibo"
                  searchPlaceholder="Buscar estado..."
                />
              </div>
            </div>
          </Card>

          {/* INVOICES TABLE */}
          <Card className="p-6 border-neutral-200/80 bg-white overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-neutral-900">Registro de Facturas Emitidas</h3>
                <p className="text-xs text-neutral-400">Mostrando {filteredInvoices.length} de {invoices.length} comprobantes</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-neutral-400 text-xs font-medium flex flex-col items-center gap-2">
                <Loader2 className="size-6 animate-spin text-neutral-400" />
                <span>Cargando datos de facturación...</span>
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
                      <th className="py-3 px-4">Estudiante & Beca</th>
                      <th className="py-3 px-4">Concepto / Notas</th>
                      <th className="py-3 px-4">Vencimiento</th>
                      <th className="py-3 px-4 text-right">Monto Total</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredInvoices.map((inv) => {
                      const student = studentsMap[inv.studentId];
                      const isPaid = inv.status === "PAID";
                      const isWaived = inv.status === "WAIVED" || (isPaid && Number(inv.totalAmount) === 0);
                      const pendingTransfer = payments.find(
                        (p) => p.invoiceId === inv.id && p.status === "PENDING"
                      );
                      const sch = student?.scholarshipPercentage || 0;

                      return (
                        <tr key={inv.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900">
                                {student ? `${student.firstName} ${student.lastName}` : "Estudiante"}
                              </span>
                              {sch === 100 ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                  Beca 100%
                                </span>
                              ) : sch > 0 ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                  Beca {sch}%
                                </span>
                              ) : null}
                            </div>
                            {student?.identityNumber && (
                              <div className="text-[11px] text-neutral-400">DNI: {student.identityNumber}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate">
                            {inv.notes || "Colegiatura regular"}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-500">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-sm text-neutral-900">
                            {isWaived ? "Exonerado (L. 0.00)" : `L. ${Number(inv.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isWaived ? (
                              <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                                Exonerada x Beca
                              </span>
                            ) : isPaid ? (
                              <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-lime-100 text-lime-800 border border-lime-200">
                                Pagada
                              </span>
                            ) : pendingTransfer ? (
                              <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                                Transferencia x Conciliar
                              </span>
                            ) : (
                              <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-800 border border-red-200">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {pendingTransfer ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleOpenReconcile(pendingTransfer)}
                                  className="h-8 px-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs gap-1 cursor-pointer"
                                >
                                  <Check className="size-3" />
                                  <span>Conciliar</span>
                                </Button>
                              ) : !isPaid && !isWaived ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleOpenPayment(inv)}
                                  className="h-8 px-3 rounded-lg text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white shadow-2xs gap-1 cursor-pointer"
                                >
                                  <CreditCard className="size-3 text-lime-400" />
                                  <span>Cobrar</span>
                                </Button>
                              ) : null}

                              {(isPaid || isWaived) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptData({
                                      invoice: inv,
                                      student,
                                      cashierName,
                                    });
                                    setIsReceiptModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                                  title="Ver Recibo Imprimible"
                                >
                                  <Printer className="size-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Anular Comprobante"
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
        </div>
      )}

      {/* TAB 3: HISTORIAL DE PAGOS & ARQUEO DE CAJA */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* ARQUEO DE CAJA RESUMEN */}
          <div className="rounded-2xl bg-neutral-900 text-white p-6 shadow-md grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Cajero en Turno</span>
              <div className="text-lg font-black text-white mt-1 flex items-center gap-2">
                <User className="size-4 text-lime-400" />
                {cashierName}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Escuela: {schoolCode} • Hoy: {new Date().toLocaleDateString()}</div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Efectivo en Gaveta</span>
              <div className="text-2xl font-black text-lime-400 mt-1">
                L. {metrics.todayCollectedCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Total recaudado hoy en efectivo</div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Transferencias Pendientes</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                L. {metrics.totalTransfersPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Por conciliar en extracto escolar</div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="button"
                onClick={() => window.print()}
                variant="outline"
                className="h-11 px-4 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700 gap-2 cursor-pointer"
              >
                <Printer className="size-4" />
                <span>Imprimir Arqueo</span>
              </Button>
            </div>
          </div>

          {/* FILTERS FOR PAYMENTS */}
          <Card className="p-5 border-neutral-200/80 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por N° comprobante, alumno o nota..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white border border-neutral-200/90 pl-10 pr-4 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              <div>
                <Combobox
                  options={[
                    { value: "ALL", label: "Todos los Métodos de Pago" },
                    ...paymentMethods.map((m) => ({ value: String(m.id), label: m.name })),
                  ]}
                  value={paymentMethodFilter}
                  onChange={(val) => setPaymentMethodFilter(val || "ALL")}
                  placeholder="Método de Pago"
                  searchPlaceholder="Buscar método..."
                />
              </div>

              <div>
                <Combobox
                  options={[
                    { value: "ALL", label: "Todos los Estados" },
                    { value: "COMPLETED", label: "Completado / Pagado en Caja", badge: "Completado" },
                    { value: "PENDING", label: "Pendiente de Verificación", badge: "Pendiente" },
                  ]}
                  value={paymentStatusFilter}
                  onChange={(val) => setPaymentStatusFilter(val || "ALL")}
                  placeholder="Estado de la Transacción"
                  searchPlaceholder="Buscar estado..."
                />
              </div>
            </div>
          </Card>

          {/* PAYMENTS TABLE */}
          <Card className="p-6 border-neutral-200/80 bg-white overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-neutral-900">Historial Detallado de Transacciones</h3>
                <p className="text-xs text-neutral-400">Mostrando {filteredPayments.length} transacciones registradas</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-neutral-400 text-xs font-medium flex flex-col items-center gap-2">
                <Loader2 className="size-6 animate-spin text-neutral-400" />
                <span>Cargando historial de pagos...</span>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-16 text-center text-neutral-400 text-xs font-medium">
                No se encontraron pagos con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-400 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200/80">
                    <tr>
                      <th className="py-3 px-4">N° Recibo / Ref</th>
                      <th className="py-3 px-4">Estudiante</th>
                      <th className="py-3 px-4">Método de Pago</th>
                      <th className="py-3 px-4">Fecha y Hora</th>
                      <th className="py-3 px-4 text-right">Monto</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredPayments.map((pay) => {
                      const student = studentsMap[pay.studentId];
                      const isCompleted = pay.status === "COMPLETED";
                      const isPending = pay.status === "PENDING";
                      const methodName = pay.paymentMethod?.name || (pay.paymentMethodId === 1 ? "Efectivo / Caja" : "Transferencia / Depósito");

                      return (
                        <tr key={pay.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                            {pay.transactionReference || `REC-${pay.id}`}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-neutral-900">
                              {student ? `${student.firstName} ${student.lastName}` : "Estudiante"}
                            </div>
                            <div className="text-[11px] text-neutral-400 font-mono">
                              {student?.userCode || student?.identityNumber || ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {methodName.toLowerCase().includes("efectivo") ? (
                                <Banknote className="size-3.5 text-lime-600" />
                              ) : (
                                <CreditCard className="size-3.5 text-blue-600" />
                              )}
                              <span className="font-medium text-neutral-800">{methodName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-500">
                            {pay.paymentDate ? new Date(pay.paymentDate).toLocaleString() : "-"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-sm text-neutral-900">
                            L. {Number(pay.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                                isCompleted
                                  ? "bg-lime-100 text-lime-800 border border-lime-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {isCompleted ? "Completado" : "Pendiente Conciliación"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleOpenReconcile(pay)}
                                  className="h-8 px-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs gap-1 cursor-pointer"
                                >
                                  <Check className="size-3" />
                                  <span>Conciliar</span>
                                </Button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const inv = invoices.find((i) => i.id === pay.invoiceId);
                                  setReceiptData({
                                    invoice: inv,
                                    payment: pay,
                                    student,
                                    cashierName,
                                  });
                                  setIsReceiptModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                                title="Ver Comprobante Oficial"
                              >
                                <Printer className="size-3.5" />
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
        </div>
      )}

      {/* TAB 4: CONCEPTOS Y TARIFAS */}
      {activeTab === "concepts" && (
        <div className="space-y-6">
          <Card className="p-6 border-neutral-200/80 bg-white space-y-4">
            <div>
              <h3 className="text-base font-black text-neutral-900">Catálogo de Conceptos de Pago Escolar</h3>
              <p className="text-xs text-neutral-500">
                Tarifas base configuradas para el ciclo lectivo escolar (Escuela {schoolCode}).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {concepts.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-700">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-bold text-lime-700 bg-lime-100 px-2 py-0.5 rounded-full">
                      {c.isRecurring ? "Recurrente" : "Pago Único"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-neutral-900">{c.name}</h4>
                    <div className="text-xl font-black text-neutral-900 mt-1">
                      L. {Number(c.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400">Moneda: {c.currency || "HNL"}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-neutral-200/80 bg-white space-y-4">
            <div>
              <h3 className="text-base font-black text-neutral-900">Métodos de Cobro Habilitados</h3>
              <p className="text-xs text-neutral-500">
                Canales aceptados para recepción de pagos en ventanilla y cuentas escolares.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {paymentMethods.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                  <div className="flex items-center gap-2">
                    {m.name.toLowerCase().includes("efectivo") ? (
                      <Banknote className="size-4 text-lime-600" />
                    ) : (
                      <CreditCard className="size-4 text-blue-600" />
                    )}
                    <span className="text-xs font-bold text-neutral-900">{m.name}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">{m.description || "Habilitado en caja"}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* TARIFAS MENSUALES ASIGNADAS POR ALUMNO */}
          <Card className="p-6 border-neutral-200/80 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                  <GraduationCap className="size-4 text-neutral-600" />
                  Tarifas y Cuotas Mensuales Asignadas por Alumno ({enrollments.length})
                </h3>
                <p className="text-xs text-neutral-500">
                  Cuotas mensuales pactadas individualmente al momento de la matrícula para la sede {schoolCode}.
                </p>
              </div>

              <a
                href="/school/enrollments/annual"
                className="h-9 px-4 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="size-3.5 text-lime-400" />
                <span>Nueva Matrícula & Tarifa</span>
              </a>
            </div>

            {enrollments.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                No hay matrículas activas registradas para esta sede.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                    <tr>
                      <th className="py-3 px-4">Estudiante</th>
                      <th className="py-3 px-4">Grado</th>
                      <th className="py-3 px-4 text-right">Cuota Base</th>
                      <th className="py-3 px-4 text-center">Beca</th>
                      <th className="py-3 px-4 text-right">Cuota Neta Mensual</th>
                      <th className="py-3 px-4 text-center">Vencimiento</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {enrollments.map((enr) => {
                      const student = studentsMap[enr.studentId] || enr.student;
                      const base = Number(enr.monthlyFee || 0);
                      const sch = Number(enr.scholarshipPercentage || student?.scholarshipPercentage || 0);
                      const net = Math.max(0, base - (base * sch) / 100);

                      return (
                        <tr key={enr.id} className="hover:bg-neutral-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-neutral-900">
                            {student ? `${student.firstName} ${student.lastName}` : `Alumno #${enr.studentId.slice(0, 8)}`}
                            <div className="text-[10px] font-mono text-neutral-400 font-normal">
                              {student?.identityNumber ? `DNI: ${student.identityNumber}` : ""}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-700">
                            {enr.grade?.name || enr.gradeCode || "General"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-neutral-600">
                            L. {base.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {sch === 100 ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                100% Exonerado
                              </span>
                            ) : sch > 0 ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                {sch}% Beca
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400">Regular (0%)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-neutral-900">
                            {sch === 100 ? (
                              <span className="text-amber-700">L. 0.00</span>
                            ) : (
                              `L. ${net.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-neutral-600">
                            Día {enr.dueDay || 10}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditFeeFromFinance(enr)}
                              className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1 cursor-pointer"
                            >
                              <Edit3 className="size-3" />
                              <span>Editar</span>
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
        </div>
      )}

      {/* MODAL 1: EMITIR FACTURA (CON BUSCADOR ASYNC DE ESTUDIANTE) */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Emitir Nueva Factura / Comprobante de Cobro</DialogTitle>
            <DialogDescription>
              Busca al estudiante titular por nombre o DNI. La beca se calculará automáticamente.
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
                {/* Estudiante via Async Search */}
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-800">
                    Estudiante Titular <span className="text-red-500">*</span>
                  </Label>
                  <AsyncStudentSearch
                    selectedStudent={modalSelectedStudent}
                    schoolCode={schoolCode}
                    onSelectStudent={(student) => {
                      setModalSelectedStudent(student);
                      if (student) {
                        setStudentsMap((prev) => ({ ...prev, [student.publicId]: student }));
                        handleInvoiceStudentOrConceptChange(student, undefined);
                      } else {
                        handleInvoiceStudentOrConceptChange(null, undefined);
                      }
                    }}
                    placeholder="Escribe DNI (ej. 0501199710597) o nombre del estudiante..."
                  />
                </div>

                {/* Banner si tiene beca */}
                {invoiceForm.discountPercentage === 100 ? (
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-600 shrink-0" />
                    <div>
                      <div>Estudiante con Beca Completa (100% Exonerado)</div>
                      <div className="text-[11px] font-normal text-amber-700">
                        El monto total se ajustará automáticamente a L. 0.00 y se registrará como exonerado.
                      </div>
                    </div>
                  </div>
                ) : invoiceForm.discountPercentage > 0 ? (
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
                    <Tag className="size-4 text-blue-600 shrink-0" />
                    <div>
                      <div>Beca / Descuento del {invoiceForm.discountPercentage}% detectado</div>
                      <div className="text-[11px] font-normal text-blue-700">
                        Descuento aplicado: -L. {((invoiceForm.baseAmount * invoiceForm.discountPercentage) / 100).toFixed(2)}. Total neto: L. {invoiceForm.totalAmount.toFixed(2)}.
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Concepto */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-800">
                    Concepto de Cobro <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={concepts.map((c) => ({
                      value: c.code,
                      label: `${c.name} (L. ${Number(c.amount).toFixed(2)})`,
                    }))}
                    value={invoiceForm.conceptCode}
                    onChange={(val) => handleInvoiceStudentOrConceptChange(undefined, val || "")}
                    placeholder="Seleccionar concepto..."
                    searchPlaceholder="Buscar concepto..."
                  />
                </div>

                {/* N° Factura */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-800">
                    Número de Comprobante / Factura <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-11 rounded-xl text-xs px-4 font-mono font-bold"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                    required
                  />
                </div>

                {/* Monto Final a Facturar */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-800">
                    Monto Total a Facturar (Lempiras) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-11 rounded-xl text-xs px-4 font-black text-neutral-900 bg-neutral-50"
                    value={invoiceForm.totalAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: Number(e.target.value) })}
                    required
                  />
                </div>

                {/* Vencimiento */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-800">
                    Fecha de Vencimiento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className="h-11 rounded-xl text-xs px-4"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    required
                  />
                </div>

                {/* Observaciones */}
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-bold text-neutral-800">Concepto / Observaciones</Label>
                  <Input
                    className="h-11 rounded-xl text-xs px-4"
                    placeholder="Ej. Colegiatura Mensual - Aplica Beca 50%"
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
                className="h-11 px-5 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingInvoice}
                className="h-11 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmittingInvoice ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Guardando...</>
                ) : invoiceForm.discountPercentage === 100 ? (
                  "Emitir Comprobante Exonerado"
                ) : (
                  "Crear y Emitir Factura"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REGISTRAR PAGO EN CAJA / TRANSFERENCIA */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Cobro en Ventanilla / Registro de Pago</DialogTitle>
            <DialogDescription>
              Comprobante {selectedInvoice?.invoiceNumber} • Monto Total: L. {Number(selectedInvoice?.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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

              <div className="space-y-4">
                {/* SELECTOR DE MÉTODO DE PAGO */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-800">
                    Forma de Pago del Alumno <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => {
                      const isSelected = paymentForm.paymentMethodId === method.id;
                      const isCash = method.name.toLowerCase().includes("efectivo") || method.id === 1;

                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => {
                            setPaymentForm((prev) => ({
                              ...prev,
                              paymentMethodId: method.id,
                              transactionReference: isCash
                                ? `REC-CAJA-${Date.now().toString().slice(-6)}`
                                : "",
                            }));
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? "border-neutral-950 bg-neutral-900 text-white shadow-xs"
                              : "border-neutral-200 hover:border-neutral-400 bg-white text-neutral-800"
                          }`}
                        >
                          {isCash ? (
                            <Banknote className={`size-4 ${isSelected ? "text-lime-400" : "text-neutral-500"}`} />
                          ) : (
                            <CreditCard className={`size-4 ${isSelected ? "text-lime-400" : "text-neutral-500"}`} />
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold">{method.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DETALLES DE EFECTIVO / CAJA (VUELTO) */}
                {(paymentForm.paymentMethodId === 1 ||
                  paymentMethods.find((m) => m.id === paymentForm.paymentMethodId)?.name.toLowerCase().includes("efectivo")) ? (
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-neutral-600">Total a Pagar (L.)</Label>
                        <div className="text-xl font-black text-neutral-900">
                          L. {Number(paymentForm.amount).toFixed(2)}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-neutral-600">
                          Efectivo Recibido <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          min={paymentForm.amount}
                          step="0.01"
                          className="h-10 text-sm font-black text-neutral-900 bg-white"
                          value={paymentForm.cashReceived}
                          onChange={(e) => setPaymentForm({ ...paymentForm, cashReceived: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">Cambio / Vuelto a entregar:</span>
                      <span className="text-lg font-black text-lime-600">
                        L. {Math.max(0, paymentForm.cashReceived - paymentForm.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* DETALLES DE TRANSFERENCIA / DEPÓSITO BANCARIO */
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-amber-950">
                          Banco Destino / Cuenta Institucional <span className="text-red-500">*</span>
                        </Label>
                        <select
                          className="w-full h-10 rounded-xl bg-white border border-amber-300 text-xs text-neutral-900 px-3 font-medium focus:outline-none"
                          value={paymentForm.bankName}
                          onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                        >
                          <option value="BAC Credomatic">BAC Credomatic</option>
                          <option value="Banco Atlántida">Banco Atlántida</option>
                          <option value="Banco Ficohsa">Banco Ficohsa</option>
                          <option value="Banpaís">Banpaís</option>
                          <option value="Banco de Occidente">Banco de Occidente</option>
                          <option value="Banhcafé">Banhcafé</option>
                          <option value="Davivienda">Davivienda</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-amber-950">
                          N° Referencia / Voucher Bancario <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="h-10 text-xs font-mono font-bold bg-white border-amber-300"
                          placeholder="Ej. TR-9841203"
                          value={paymentForm.transactionReference}
                          onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200">
                      <Label className="text-[11px] font-bold text-amber-950 block mb-1.5">
                        Estado de la Transferencia
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, isTransferPending: true })}
                          className={`p-2.5 rounded-xl text-left border text-xs font-bold cursor-pointer transition-all ${
                            paymentForm.isTransferPending
                              ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                              : "bg-white text-neutral-700 border-amber-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            <span>Pendiente de Conciliación</span>
                          </div>
                          <div className="text-[10px] font-normal opacity-90 mt-0.5">
                            Se confirmará cuando caiga en el extracto bancario
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, isTransferPending: false })}
                          className={`p-2.5 rounded-xl text-left border text-xs font-bold cursor-pointer transition-all ${
                            !paymentForm.isTransferPending
                              ? "bg-lime-600 text-white border-lime-700 shadow-xs"
                              : "bg-white text-neutral-700 border-amber-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5" />
                            <span>Verificado en Línea (Pagado)</span>
                          </div>
                          <div className="text-[10px] font-normal opacity-90 mt-0.5">
                            Fondos confirmados en la app del banco ahora mismo
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-neutral-800">Notas Adicionales del Cobro</Label>
                  <Input
                    className="h-10 text-xs"
                    placeholder="Ej. Cobrado en ventanilla principal"
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
                className="h-11 px-5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPayment}
                className="h-11 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSubmittingPayment ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Procesando...</>
                ) : (
                  "Confirmar y Registrar Pago"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: GESTIÓN RÁPIDA DE BECA DEL ESTUDIANTE */}
      <Dialog open={isScholarshipModalOpen} onOpenChange={setIsScholarshipModalOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Asignar Porcentaje de Beca</DialogTitle>
            <DialogDescription>
              {studentForScholarship?.firstName} {studentForScholarship?.lastName} ({studentForScholarship?.userCode || "Estudiante"})
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <p className="text-xs text-neutral-600">
              Selecciona el beneficio financiero otorgado al estudiante. Se aplicará a los futuros cobros y emisiones de colegiatura.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Sin Beca (0%)", val: 0, desc: "Paga tarifa completa" },
                { label: "Beca 25%", val: 25, desc: "Descuento de cuarta parte" },
                { label: "Media Beca (50%)", val: 50, desc: "Paga el 50% de colegiatura" },
                { label: "Beca 75%", val: 75, desc: "Paga el 25% restante" },
                { label: "Beca Completa (100%)", val: 100, desc: "Exonerado 100% de colegiatura" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setNewScholarshipPercentage(opt.val)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    newScholarshipPercentage === opt.val
                      ? "border-neutral-950 bg-neutral-900 text-white shadow-xs"
                      : "border-neutral-200 hover:border-neutral-400 bg-white text-neutral-800"
                  }`}
                >
                  <div className="text-xs font-black">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${newScholarshipPercentage === opt.val ? "text-neutral-400" : "text-neutral-500"}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold text-neutral-700">O ingresar porcentaje personalizado (%):</Label>
              <Input
                type="number"
                min="0"
                max="100"
                className="h-10 text-xs font-bold font-mono"
                value={newScholarshipPercentage}
                onChange={(e) => setNewScholarshipPercentage(Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScholarshipModalOpen(false)}
              disabled={isSubmittingScholarship}
              className="h-10 px-4 rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveScholarship}
              disabled={isSubmittingScholarship}
              className="h-10 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer"
            >
              {isSubmittingScholarship ? "Guardando..." : "Guardar Beca"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: CONCILIAR TRANSFERENCIA BANCARIA */}
      <Dialog open={isReconcileModalOpen} onOpenChange={setIsReconcileModalOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Conciliar Transferencia Bancaria</DialogTitle>
            <DialogDescription>
              Confirmar que los fondos han ingresado a la cuenta bancaria de la institución.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-3">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-950">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="size-4 text-amber-600" />
                Referencia: {paymentToReconcile?.transactionReference || "S/Ref"}
              </div>
              <div>Monto: <span className="font-black text-sm">L. {Number(paymentToReconcile?.amount || 0).toFixed(2)}</span></div>
              <div className="text-[11px] text-amber-800">
                Al confirmar, el pago cambiará a estado <b>COMPLETADO</b> y la factura asociada a <b>PAGADA</b>.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReconcileModalOpen(false)}
              disabled={isReconciling}
              className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReconcile}
              disabled={isReconciling}
              className="h-10 px-5 rounded-xl bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold shadow-xs cursor-pointer gap-1.5"
            >
              {isReconciling ? "Conciliando..." : <><Check className="size-3.5" /> Aprobar y Marcar Pagado</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: RECIBO OFICIAL IMPRIMIBLE */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent size="lg" className="print:m-0 print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Comprobante Oficial de Pago</DialogTitle>
            <DialogDescription>
              Recibo generado para entrega física o respaldo del estudiante.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {/* PRINTABLE RECEIPT TEMPLATE */}
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-neutral-200 text-neutral-900 space-y-6 font-sans print:border-none print:p-2">
              <div className="flex items-start justify-between border-b pb-4 border-neutral-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-neutral-950 text-lime-400 font-black flex items-center justify-center text-sm">
                      ES
                    </div>
                    <h2 className="text-lg font-black tracking-tight text-neutral-900">
                      SISTEMA EDUCATIVO INSTITUCIONAL
                    </h2>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Departamento de Administración Financiera & Ventanilla de Caja
                  </p>
                  <p className="text-[10px] text-neutral-400">Código de Centro: {schoolCode}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Comprobante Oficial
                  </span>
                  <span className="font-mono font-black text-sm text-neutral-900">
                    {receiptData?.payment?.transactionReference || receiptData?.invoice?.invoiceNumber || "REC-001"}
                  </span>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    {new Date().toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Student info */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div>
                  <span className="text-neutral-400 text-[10px] uppercase font-bold block">Estudiante:</span>
                  <span className="font-bold text-neutral-900 text-sm">
                    {receiptData?.student?.firstName} {receiptData?.student?.lastName}
                  </span>
                  {receiptData?.student?.identityNumber && (
                    <div className="text-neutral-500 text-[11px]">DNI: {receiptData?.student.identityNumber}</div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-neutral-400 text-[10px] uppercase font-bold block">Código de Alumno:</span>
                  <span className="font-mono font-bold text-neutral-800">
                    {receiptData?.student?.userCode || "N/A"}
                  </span>
                  {(receiptData?.student?.scholarshipPercentage || 0) > 0 && (
                    <div className="text-amber-700 font-bold text-[11px]">
                      Beca Asignada: {receiptData?.student?.scholarshipPercentage}%
                    </div>
                  )}
                </div>
              </div>

              {/* Concepts breakdown */}
              <div className="space-y-2">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-neutral-200 text-neutral-400 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2">Concepto / Descripción</th>
                      <th className="py-2 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <tr>
                      <td className="py-2.5 font-medium text-neutral-800">
                        {receiptData?.invoice?.notes || "Colegiatura / Matrícula Escolar"}
                      </td>
                      <td className="py-2.5 text-right font-bold text-neutral-900">
                        L. {Number(receiptData?.invoice?.totalAmount || receiptData?.payment?.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total and Payment Method */}
              <div className="border-t border-neutral-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-neutral-400 text-[11px]">Método: </span>
                    <span className="font-bold text-neutral-900">
                      {receiptData?.payment?.paymentMethod?.name || (receiptData?.cashReceived !== undefined ? "Efectivo / Caja" : "Exoneración x Beca / Cobro Oficial")}
                    </span>
                  </div>
                  {receiptData?.cashReceived !== undefined && (
                    <div className="text-[11px] text-neutral-500">
                      Entregado: L. {receiptData.cashReceived.toFixed(2)} • Cambio: L. {(receiptData.changeGiven || 0).toFixed(2)}
                    </div>
                  )}
                  <div className="text-[11px] text-neutral-400">
                    Atendido por: {receiptData?.cashierName || "Cajero Institucional"}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Total Cancelado
                  </span>
                  <span className="text-2xl font-black text-lime-600">
                    L. {Number(receiptData?.payment?.amount || receiptData?.invoice?.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Official Seal */}
              <div className="pt-4 border-t border-dashed border-neutral-200 flex items-center justify-between text-[10px] text-neutral-400">
                <div className="flex items-center gap-1.5 text-lime-700 font-bold bg-lime-50 border border-lime-200 px-3 py-1 rounded-full">
                  <CheckCheck className="size-3" />
                  COBRADO EN CAJA OFICIAL
                </div>
                <span>Validez legal como comprobante de pago institucional.</span>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReceiptModalOpen(false)}
              className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>Imprimir Comprobante</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: EDITAR TARIFA Y BECA DESDE FINANZAS */}
      <Dialog open={isEditFeeModalOpen} onOpenChange={setIsEditFeeModalOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Modificar Tarifa Mensual y Beca del Estudiante</DialogTitle>
            <DialogDescription>
              Ajusta la mensualidad acordada para {enrollmentToEditInFinance?.student?.firstName} {enrollmentToEditInFinance?.student?.lastName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveFinanceFee} className="flex flex-col flex-1">
            <DialogBody className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <div className="size-10 rounded-xl bg-neutral-950 text-lime-400 font-black flex items-center justify-center text-sm">
                  {enrollmentToEditInFinance?.student?.firstName?.[0] || "E"}
                </div>
                <div>
                  <div className="text-xs font-black text-neutral-900">
                    {enrollmentToEditInFinance?.student?.firstName} {enrollmentToEditInFinance?.student?.lastName}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    Grado: {enrollmentToEditInFinance?.grade?.name || enrollmentToEditInFinance?.gradeCode} • Ciclo: {enrollmentToEditInFinance?.academicYear?.name || "Activo"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-neutral-700">
                    Mensualidad Base (Lempiras)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    className="h-10 rounded-xl text-xs font-black"
                    value={financeFeeForm.monthlyFee}
                    onChange={(e) => setFinanceFeeForm({ ...financeFeeForm, monthlyFee: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-neutral-700">
                    Beca / Descuento (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="h-10 rounded-xl text-xs font-black"
                    value={financeFeeForm.scholarshipPercentage}
                    onChange={(e) => setFinanceFeeForm({ ...financeFeeForm, scholarshipPercentage: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-neutral-700">
                    Día Vencimiento
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    className="h-10 rounded-xl text-xs font-mono"
                    value={financeFeeForm.dueDay}
                    onChange={(e) => setFinanceFeeForm({ ...financeFeeForm, dueDay: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* RESUMEN EN TIEMPO REAL */}
              <div className="p-3.5 rounded-xl bg-lime-50/50 border border-lime-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-600">Nueva Cuota Neta Mensual: </span>
                  <span className="text-base font-black text-neutral-900">
                    L. {Math.max(0, Number(financeFeeForm.monthlyFee || 0) * (1 - (Number(financeFeeForm.scholarshipPercentage) || 0) / 100)).toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  {financeFeeForm.scholarshipPercentage === 100
                    ? "Exonerado al 100%"
                    : `Descuento: L. ${((Number(financeFeeForm.monthlyFee) * Number(financeFeeForm.scholarshipPercentage)) / 100).toFixed(2)}`}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Observaciones del Ajuste</Label>
                <Input
                  placeholder="Ej. Beca parcial aprobada por administración..."
                  value={financeFeeForm.notes}
                  onChange={(e) => setFinanceFeeForm({ ...financeFeeForm, notes: e.target.value })}
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditFeeModalOpen(false)}
                disabled={isSavingFinanceFee}
                className="h-10 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingFinanceFee}
                className="h-10 rounded-xl px-5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSavingFinanceFee ? (
                  <><Loader2 className="mr-2 size-3.5 animate-spin" />Guardando...</>
                ) : (
                  "Guardar Ajuste de Tarifa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
