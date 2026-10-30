import { fetchApi } from '../api-client';

export interface StaffApplication {
  id: number;
  publicId: string;
  applicationNumber: string;
  schoolCode: string;
  firstName: string;
  lastName: string;
  identityNumber: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  department: string;
  positionApplied: string;
  highestDegree?: string;
  yearsOfExperience: number;
  expectedSalary?: number;
  resumeUrl?: string;
  bio?: string;
  address?: string;
  status: 'PENDING' | 'SHORTLISTED' | 'INTERVIEWED' | 'HIRED' | 'REJECTED';
  adminNotes?: string;
  convertedUserId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffApplicationInput {
  schoolCode?: string;
  firstName: string;
  lastName: string;
  identityNumber: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  department: string;
  positionApplied: string;
  highestDegree?: string;
  yearsOfExperience?: number;
  expectedSalary?: number;
  resumeUrl?: string;
  bio?: string;
  address?: string;
}

export interface HireStaffResult {
  applicationNumber: string;
  userId: string;
  userCode: string;
  username: string;
  tempPassword: string;
  fullName: string;
  role: string;
  department: string;
  positionApplied: string;
  baseSalary: number;
  currency: string;
  startDate: string;
  status: string;
}

export const staffService = {
  // Public application
  apply: async (data: CreateStaffApplicationInput) => {
    return fetchApi<{ status: boolean; message: string; data: any }>('/staff-applications/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Public tracking
  getStatus: async (ref: string) => {
    return fetchApi<{ status: boolean; message: string; data: any }>(`/staff-applications/status/${encodeURIComponent(ref)}`, {
      method: 'GET',
    });
  },

  // Admin: list all applications
  getApplications: async (params?: {
    schoolCode?: string;
    status?: string;
    department?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.schoolCode && params.schoolCode !== 'ALL') q.append('schoolCode', params.schoolCode);
    if (params?.status && params.status !== 'ALL') q.append('status', params.status);
    if (params?.department && params.department !== 'ALL') q.append('department', params.department);
    if (params?.search && params.search.trim()) q.append('search', params.search.trim());

    const qs = q.toString() ? `?${q.toString()}` : '';
    return fetchApi<{ status: boolean; message: string; data: StaffApplication[] }>(`/staff-applications${qs}`, {
      method: 'GET',
    });
  },

  // Admin: get single
  getApplication: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: StaffApplication }>(`/staff-applications/${id}`, {
      method: 'GET',
    });
  },

  // Admin: update status
  updateStatus: async (id: number, status: string, adminNotes?: string) => {
    return fetchApi<{ status: boolean; message: string; data: StaffApplication }>(`/staff-applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  // Admin: hire (1-click teacher conversion)
  hire: async (
    id: number,
    data?: {
      baseSalary?: number;
      startDate?: string;
      username?: string;
      password?: string;
    }
  ) => {
    return fetchApi<{ status: boolean; message: string; data: HireStaffResult }>(`/staff-applications/${id}/hire`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
};

