import { fetchApi } from '../api-client';
import { StudentDetailedExpediente, User } from './api.service';

export interface WardRelationship {
  studentId: string;
  parentId: string;
  relationship: string;
  isPrimary: boolean;
  canViewGrades: boolean;
  canReceiveNotifications: boolean;
  student: (User & {
    scholarshipPercentage?: number;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    emergencyContact?: any;
  }) | null;
  parent: User;
}

export const parentService = {
  // Obtener todos los hijos/tutelados vinculados al tutor por su parentId
  getWardsByParentId: async (parentId: string) => {
    return fetchApi<{
      status: boolean;
      message: string;
      data: WardRelationship[];
    }>(`/users/family-relationships/parent/${parentId}`, {
      method: 'GET',
    });
  },

  // Obtener expediente y datos completos del estudiante tutelado
  getWardDetails: async (studentId: string) => {
    return fetchApi<{
      status: boolean;
      message: string;
      data: StudentDetailedExpediente;
    }>(`/students/${studentId}/details`, {
      method: 'GET',
    });
  },
};

