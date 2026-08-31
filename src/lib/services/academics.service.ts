import { fetchApi } from '../api-client';

export interface AcademicYear {
  id: number;
  yearCode: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: boolean;
}

export interface AcademicPeriod {
  id: number;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  weight: number;
  status: string;
}

export interface Grade {
  code: string;
  schoolCode: string;
  name: string;
  level: number;
  description?: string;
}

export interface Classroom {
  code: string;
  schoolCode: string;
  name: string;
  capacity: number;
  location: string;
  equipment?: string[];
  description?: string;
  status: boolean;
}

export interface Course {
  code: string;
  schoolCode: string;
  gradeCode: string;
  name: string;
  description?: string;
  credits: number;
  status: boolean;
}

export interface Class {
  code: string;
  schoolCode: string;
  name: string;
  schedule: any;
  maxStudents: number;
  status: string;
}

export const academicsService = {
  getAcademicYears: async () => {
    return fetchApi<{ status: boolean; message: string; data: AcademicYear[] }>('/academic-years', { method: 'GET' });
  },
  createAcademicYear: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: AcademicYear }>('/academic-years', { method: 'POST', body: JSON.stringify(data) });
  },

  getAcademicPeriods: async () => {
    return fetchApi<{ status: boolean; message: string; data: AcademicPeriod[] }>('/academic-periods', { method: 'GET' });
  },
  createAcademicPeriod: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: AcademicPeriod }>('/academic-periods', { method: 'POST', body: JSON.stringify(data) });
  },

  getGrades: async () => {
    return fetchApi<{ status: boolean; message: string; data: Grade[] }>('/grades', { method: 'GET' });
  },
  createGrade: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Grade }>('/grades', { method: 'POST', body: JSON.stringify(data) });
  },

  getClassrooms: async () => {
    return fetchApi<{ status: boolean; message: string; data: Classroom[] }>('/classrooms', { method: 'GET' });
  },
  createClassroom: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Classroom }>('/classrooms', { method: 'POST', body: JSON.stringify(data) });
  },

  getCourses: async () => {
    return fetchApi<{ status: boolean; message: string; data: Course[] }>('/courses', { method: 'GET' });
  },
  createCourse: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Course }>('/courses', { method: 'POST', body: JSON.stringify(data) });
  },

  getClasses: async () => {
    return fetchApi<{ status: boolean; message: string; data: Class[] }>('/classes', { method: 'GET' });
  },
  createClass: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Class }>('/classes', { method: 'POST', body: JSON.stringify(data) });
  }
};