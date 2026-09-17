import { fetchApi } from "../api-client";
import { Student } from "./api.service";

export interface PaymentConcept {
  id: number;
  schoolCode: string;
  code: string;
  name: string;
  amount: number;
  currency: string;
  isRecurring?: boolean;
  status: string;
}

export interface Invoice {
  id: number;
  schoolCode: string;
  studentId: string;
  student?: Student;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | string;
  notes?: string;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  schoolCode: string;
  invoiceId?: number;
  invoice?: Invoice;
  studentId: string;
  student?: Student;
  paymentMethodId?: number;
  amount: number;
  paymentDate: string;
  transactionReference?: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | string;
  notes?: string;
}

export const financeService = {
  // --- INVOICES ---
  getInvoices: async () => {
    return fetchApi<{ status: boolean; message: string; data: Invoice[] }>("/invoices", {
      method: "GET",
    });
  },

  getInvoicesByStudent: async (studentId: string) => {
    return fetchApi<{ status: boolean; message: string; data: Invoice[] }>(`/invoices/student/${studentId}`, {
      method: "GET",
    });
  },

  createInvoice: async (data: {
    schoolCode: string;
    studentId: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    status?: string;
    notes?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: Invoice }>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateInvoice: async (id: number, data: Partial<Invoice>) => {
    return fetchApi<{ status: boolean; message: string; data: Invoice }>(`/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteInvoice: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/invoices/${id}`, {
      method: "DELETE",
    });
  },

  // --- PAYMENTS ---
  getPayments: async () => {
    return fetchApi<{ status: boolean; message: string; data: Payment[] }>("/payments", {
      method: "GET",
    });
  },

  createPayment: async (data: {
    schoolCode: string;
    invoiceId?: number;
    studentId: string;
    amount: number;
    paymentDate?: string;
    transactionReference?: string;
    status?: string;
    notes?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: Payment }>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // --- PAYMENT CONCEPTS ---
  getPaymentConcepts: async () => {
    return fetchApi<{ status: boolean; message: string; data: PaymentConcept[] }>("/payment-concepts", {
      method: "GET",
    });
  },

  createPaymentConcept: async (data: {
    schoolCode: string;
    code: string;
    name: string;
    amount: number;
    currency?: string;
    isRecurring?: boolean;
    status?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: PaymentConcept }>("/payment-concepts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
