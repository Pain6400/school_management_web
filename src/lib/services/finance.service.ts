import { fetchApi } from "../api-client";
import { Student } from "./api.service";

export interface PaymentMethod {
  id: number;
  schoolCode: string;
  name: string;
  description?: string;
  status: string;
}

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
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "WAIVED" | string;
  notes?: string;
  payments?: Payment[];
  school?: {
    publicId: string;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export interface Payment {
  id: number;
  schoolCode: string;
  invoiceId?: number;
  invoice?: Invoice;
  studentId: string;
  student?: Student;
  paymentMethodId?: number;
  paymentMethod?: PaymentMethod;
  amount: number;
  paymentDate: string;
  transactionReference?: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | string;
  notes?: string;
  recordedBy?: string;
  recorder?: {
    publicId: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

export const financeService = {
  // --- INVOICES ---
  getInvoices: async (params?: { schoolCode?: string }) => {
    const query = params?.schoolCode ? `?schoolCode=${params.schoolCode}` : "";
    return fetchApi<{ status: boolean; message: string; data: Invoice[] }>(`/invoices${query}`, {
      method: "GET",
    });
  },

  getInvoicesByStudent: async (studentId: string, params?: { year?: number | string }) => {
    const query = params?.year ? `?year=${params.year}` : "";
    return fetchApi<{ status: boolean; message: string; data: Invoice[] }>(`/invoices/student/${studentId}${query}`, {
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
  getPayments: async (params?: { schoolCode?: string }) => {
    const query = params?.schoolCode ? `?schoolCode=${params.schoolCode}` : "";
    return fetchApi<{ status: boolean; message: string; data: Payment[] }>(`/payments${query}`, {
      method: "GET",
    });
  },

  getPaymentsByStudent: async (studentId: string, params?: { year?: number | string }) => {
    const query = params?.year ? `?year=${params.year}` : "";
    return fetchApi<{ status: boolean; message: string; data: Payment[] }>(`/payments/student/${studentId}${query}`, {
      method: "GET",
    });
  },

  createPayment: async (data: {
    schoolCode: string;
    invoiceId?: number;
    studentId: string;
    paymentMethodId?: number;
    amount: number;
    paymentDate?: string;
    transactionReference?: string;
    status?: string;
    notes?: string;
    recordedBy?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: Payment }>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updatePayment: async (id: number, data: Partial<Payment>) => {
    return fetchApi<{ status: boolean; message: string; data: Payment }>(`/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deletePayment: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/payments/${id}`, {
      method: "DELETE",
    });
  },

  // --- PAYMENT METHODS ---
  getPaymentMethods: async (params?: { schoolCode?: string }) => {
    const query = params?.schoolCode ? `?schoolCode=${params.schoolCode}` : "";
    return fetchApi<{ status: boolean; message: string; data: PaymentMethod[] }>(`/payment-methods${query}`, {
      method: "GET",
    });
  },

  // --- PAYMENT CONCEPTS ---
  getPaymentConcepts: async (params?: { schoolCode?: string }) => {
    const query = params?.schoolCode ? `?schoolCode=${params.schoolCode}` : "";
    return fetchApi<{ status: boolean; message: string; data: PaymentConcept[] }>(`/payment-concepts${query}`, {
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
