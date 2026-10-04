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
};
