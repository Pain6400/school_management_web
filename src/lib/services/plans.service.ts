import { fetchApi } from '../api-client';

export interface Plan {
  code: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxStudents: number;
  maxTeachers: number;
  maxStorageMb: number;
  features?: string[];
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const plansService = {
  getPlans: () => {
    return fetchApi<{ status: boolean; message: string; data: Plan[] }>('/plans');
  },

  getPlanByCode: (code: string) => {
    return fetchApi<{ status: boolean; message: string; data: Plan }>(`/plans/${code}`);
  },

  createPlan: (data: Partial<Plan>) => {
    return fetchApi<{ status: boolean; message: string; data: Plan }>('/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePlan: (code: string, data: Partial<Plan>) => {
    return fetchApi<{ status: boolean; message: string; data: Plan }>(`/plans/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deletePlan: (code: string) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/plans/${code}`, {
      method: 'DELETE',
    });
  },
};

