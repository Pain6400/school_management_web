import { fetchApi } from '../api-client';

export interface AdmissionApplication {
  id: number;
  publicId: string;
  applicationNumber: string;
  schoolCode: string;
  firstName: string;
  lastName: string;
  identityNumber?: string;
  dateOfBirth: string;
  gender: string;
  gradeCode: string;
  previousSchool?: string;
  parentFirstName: string;
  parentLastName: string;
  parentIdentityNumber: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: string;
  address?: string;
  notes?: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ENROLLED' | string;
  adminNotes?: string;
  convertedStudentId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdmissionInput {
  schoolCode?: string;
  firstName: string;
  lastName: string;
  identityNumber?: string;
  dateOfBirth: string;
  gender: string;
  gradeCode: string;
  previousSchool?: string;
  parentFirstName: string;
  parentLastName: string;
  parentIdentityNumber: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: string;
  address?: string;
  notes?: string;
}

export interface AdmissionTrackingData {
  applicationNumber: string;
  firstName: string;
  lastName: string;
  gradeCode: string;
  schoolCode: string;
  status: string;
  parentName: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export type PublicAdmissionStatus = AdmissionTrackingData;

export interface ConvertedStudentResult {
  applicationNumber: string;
  student: {
    publicId: string;
    userCode: string;
    username: string;
    fullName: string;
    temporaryPassword: string;
  };
  guardian: {
    publicId: string;
    userCode: string;
    username: string;
    fullName: string;
    phone: string;
  };
}

export const admissionsService = {
  // Public: Enviar postulación
  apply: async (data: CreateAdmissionInput) => {
    return fetchApi<{ status: boolean; message: string; data: AdmissionApplication }>('/admissions/apply', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: false,
    });
  },

  // Public: Rastreo de estado
  getStatus: async (referenceNumber: string) => {
    return fetchApi<{
      status: boolean;
      message: string;
      data: AdmissionTrackingData;
    }>(`/admissions/status/${encodeURIComponent(referenceNumber)}`, {
      method: 'GET',
      requireAuth: false,
    });
  },

  // Admin: Listado
  getApplications: async (params?: { schoolCode?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.schoolCode) query.append('schoolCode', params.schoolCode);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';

    return fetchApi<{ status: boolean; message: string; data: AdmissionApplication[] }>(`/admissions${qs}`, {
      method: 'GET',
    });
  },

  // Admin: Detalle
  getApplicationById: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: AdmissionApplication }>(`/admissions/${id}`, {
      method: 'GET',
    });
  },

  // Admin: Cambiar estado
  updateStatus: async (id: number, status: string, adminNotes?: string) => {
    return fetchApi<{ status: boolean; message: string; data: AdmissionApplication }>(`/admissions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  },

  // Admin: Conversión 1-Clic a Estudiante Oficial
  convertToStudent: async (id: number) => {
    return fetchApi<{
      status: boolean;
      message: string;
      data: ConvertedStudentResult;
    }>(`/admissions/${id}/convert`, {
      method: 'POST',
    });
  },
};
