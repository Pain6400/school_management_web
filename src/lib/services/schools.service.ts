import { fetchApi } from '../api-client';

export interface School {
  code: string;
  planCode: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: boolean;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  autoRenew: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaasSchoolPlan {
  code: string;
  name: string;
  price: number;
  maxStudents: number;
  maxTeachers: number;
}

export interface SaasStudentStats {
  enrolledCount: number;
  maxStudents: number;
  usagePercent: number;
  isNearCapacity: boolean;
  isOverCapacity: boolean;
}

export interface SaasSubscriptionInfo {
  id: string | null;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  daysOverdue: number;
  debtStatus: 'UP_TO_DATE' | 'PENDING_PAYMENT' | 'EXPIRING_SOON' | 'OVERDUE' | 'INACTIVE';
  paymentStatus: string;
  subscriptionStatus: string;
  totalAmount: number;
  autoRenew: boolean;
}

export interface SaasPaymentRecord {
  id: string;
  amountPaid: number;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  nextPaymentDate?: string;
  status: string;
  receiptUrl?: string | null;
  receiptFileName?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface SaasSchoolFinancials {
  totalPaid: number;
  lastPaymentDate: string | null;
  pendingAmount: number;
}

export interface SaasSchoolItem {
  publicId: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: boolean;
  createdAt: string;
  plan: SaasSchoolPlan;
  studentStats: SaasStudentStats;
  subscription: SaasSubscriptionInfo;
  financials: SaasSchoolFinancials;
  payments: SaasPaymentRecord[];
}

export interface SaasKpis {
  totalSchools: number;
  activeSchools: number;
  schoolsInDebt: number;
  schoolsPendingPayment?: number;
  totalStudentsPlatform: number;
  mrr: number;
  totalCollected: number;
}

export interface SaasOverviewData {
  kpis: SaasKpis;
  schools: SaasSchoolItem[];
}

export interface RegisterSchoolPaymentPayload {
  amountPaid: number;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  nextPaymentDate?: string;
  monthsToAdd?: number;
  notes?: string;
  receiptUrl?: string;
  receiptFileName?: string;
}

export const schoolsService = {
  getSchools: () => {
    return fetchApi<{ status: boolean; message: string; data: School[] }>('/schools');
  },

  getSchoolByCode: (code: string) => {
    return fetchApi<{ status: boolean; message: string; data: School }>(`/schools/${code}`);
  },

  createSchool: (data: Partial<School>) => {
    return fetchApi<{ status: boolean; message: string; data: School }>('/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSchool: (code: string, data: Partial<School>) => {
    return fetchApi<{ status: boolean; message: string; data: School }>(`/schools/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteSchool: (code: string) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/schools/${code}`, {
      method: 'DELETE',
    });
  },

  getSaasOverview: () => {
    return fetchApi<{ status: boolean; message: string; data: SaasOverviewData }>('/schools/saas-overview');
  },

  registerSchoolPayment: (schoolCode: string, payload: RegisterSchoolPaymentPayload, receiptFile?: File) => {
    if (receiptFile) {
      const formData = new FormData();
      formData.append('amountPaid', payload.amountPaid.toString());
      formData.append('paymentMethod', payload.paymentMethod);
      formData.append('transactionReference', payload.transactionReference);
      formData.append('paymentDate', payload.paymentDate);
      if (payload.nextPaymentDate) formData.append('nextPaymentDate', payload.nextPaymentDate);
      if (payload.monthsToAdd) formData.append('monthsToAdd', payload.monthsToAdd.toString());
      if (payload.notes) formData.append('notes', payload.notes);
      formData.append('receipt', receiptFile);

      return fetchApi<{ status: boolean; message: string; data: any }>(`/schools/${schoolCode}/payments`, {
        method: 'POST',
        body: formData,
      });
    }

    return fetchApi<{ status: boolean; message: string; data: any }>(`/schools/${schoolCode}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  uploadReceiptFile: (schoolCode: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<{ status: boolean; message: string; data: { url: string; fileName: string } }>(`/schools/${schoolCode}/upload-receipt`, {
      method: 'POST',
      body: formData,
    });
  },

  toggleSchoolStatus: (schoolCode: string, status?: boolean) => {
    return fetchApi<{ status: boolean; message: string; data: School }>(`/schools/${schoolCode}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
