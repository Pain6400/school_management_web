import { fetchApi } from '../api-client';
import { User } from './api.service';

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
  grade?: Grade;
}

export interface Class {
  code: string;
  schoolCode: string;
  name: string;
  schedule: {
    days?: string[];
    start?: string;
    end?: string;
    [key: string]: any;
  };
  maxStudents: number;
  status: string;
  courseCode?: string;
  course?: Course;
  gradeCode?: string;
  grade?: Grade;
  classroomCode?: string;
  classroom?: Classroom;
  teacherId?: string;
  teacher?: User;
  academicYearId?: number;
  academicYear?: AcademicYear;
}

export const academicsService = {
  // Academic Years
  getAcademicYears: async () => {
    return fetchApi<{ status: boolean; message: string; data: AcademicYear[] }>('/academic-years', { method: 'GET' });
  },
  createAcademicYear: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: AcademicYear }>('/academic-years', { method: 'POST', body: JSON.stringify(data) });
  },

  // Academic Periods
  getAcademicPeriods: async () => {
    return fetchApi<{ status: boolean; message: string; data: AcademicPeriod[] }>('/academic-periods', { method: 'GET' });
  },
  createAcademicPeriod: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: AcademicPeriod }>('/academic-periods', { method: 'POST', body: JSON.stringify(data) });
  },

  // Grades
  getGrades: async () => {
    return fetchApi<{ status: boolean; message: string; data: Grade[] }>('/grades', { method: 'GET' });
  },
  createGrade: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Grade }>('/grades', { method: 'POST', body: JSON.stringify(data) });
  },

  // Classrooms
  getClassrooms: async () => {
    return fetchApi<{ status: boolean; message: string; data: Classroom[] }>('/classrooms', { method: 'GET' });
  },
  createClassroom: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Classroom }>('/classrooms', { method: 'POST', body: JSON.stringify(data) });
  },

  // Courses
  getCourses: async () => {
    return fetchApi<{ status: boolean; message: string; data: Course[] }>('/courses', { method: 'GET' });
  },
  createCourse: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Course }>('/courses', { method: 'POST', body: JSON.stringify(data) });
  },

  // Classes
  getClasses: async () => {
    return fetchApi<{ status: boolean; message: string; data: Class[] }>('/classes', { method: 'GET' });
  },
  createClass: async (data: any) => {
    return fetchApi<{ status: boolean; message: string; data: Class }>('/classes', { method: 'POST', body: JSON.stringify(data) });
  },
  deleteClass: async (code: string) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/classes/${code}`, { method: 'DELETE' });
  }
};