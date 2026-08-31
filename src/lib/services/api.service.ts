import { fetchApi } from '../api-client';

export interface User {
  publicId: string;
  identityNumber: string;
  userCode: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: boolean;
  profilePicture?: string;
}

export interface Student extends User {
  emergencyContact?: any;
}

export const usersService = {
  getUsers: async () => {
    return fetchApi<{ status: boolean; message: string; data: User[] }>('/users', {
      method: 'GET',
    });
  },
  
  createUser: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id: string) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
  
  assignRole: async (userId: string, roleId: number) => {
    return fetchApi<{ status: boolean; message: string; data: any }>(`/users/${userId}/roles/${roleId}`, {
      method: 'POST',
    });
  }
};

export const studentsService = {
  getStudents: async () => {
    return fetchApi<{ status: boolean; message: string; data: Student[] }>('/students', {
      method: 'GET',
    });
  },
  
  createStudent: async (formData: FormData) => {
    // Note: If the backend expects FormData, fetchApi needs to support it (not stringify)
    // For now, let's assume fetchApi can handle FormData if we omit content-type header
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la petición');
    }
    
    return response.json();
  },

  deleteStudent: async (id: string) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/students/${id}`, {
      method: 'DELETE',
    });
  }
};