import { fetchApi } from '../api-client';

export interface AssignmentType {
  id: number;
  schoolCode: string;
  name: string;
  weight?: number;
  description?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  maxScore: number;
  dueDate: string;
  assignedDate: string;
  status: string;
  classCode?: string;
  typeId?: number;
  type?: AssignmentType;
}

export const assignmentsService = {
  getAssignments: async () => {
    return fetchApi<{ status: boolean; message: string; data: Assignment[] }>('/assignments', {
      method: 'GET',
    });
  },

  getAssignmentTypes: async () => {
    return fetchApi<{ status: boolean; message: string; data: AssignmentType[] }>('/assignment-types', {
      method: 'GET',
    });
  },
  
  getAssignmentsByClass: async (classCode: string, schoolCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: Assignment[] }>(`/assignments/class/${classCode}/school/${schoolCode}`, {
      method: 'GET',
    });
  },

  createAssignment: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Assignment }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteAssignment: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/assignments/${id}`, {
      method: 'DELETE',
    });
  }
};