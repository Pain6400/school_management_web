import { fetchApi } from '../api-client';

export interface Role {
  id: number;
  name: string;
  description?: string;
}

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
  roles?: Role[];
}

export interface Student extends User {
  emergencyContact?: any;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  scholarshipPercentage?: number;
  schoolCode?: string;
  createdAt?: string;
}

export interface StudentFilterParams {
  gradeCode?: string;
  classCode?: string;
  classroomCode?: string;
  search?: string;
  status?: string;
}

export interface FamilyRelationshipDetail {
  studentId: string;
  parentId: string;
  relationship: string;
  isPrimary: boolean;
  canViewGrades: boolean;
  canReceiveNotifications: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  identityNumber?: string;
  address?: string;
}

export interface StudentAnnualEnrollmentDetail {
  id: number;
  studentId: string;
  academicYearId: number;
  gradeCode: string;
  enrollmentDate: string;
  status: string;
  notes?: string;
  academicYearName?: string;
  isCurrent?: boolean;
  gradeName?: string;
  gradeLevel?: number;
}

export interface StudentClassEnrollmentDetail {
  id: number;
  studentId: string;
  classCode: string;
  enrollmentDate: string;
  status: string;
  finalGrade?: number | null;
  isGradeOverridden?: boolean;
  overrideReason?: string | null;
  calculatedFinalGrade?: number | null;
  className: string;
  schedule?: Record<string, any>;
  classStatus: string;
  courseName?: string;
  courseCode?: string;
  courseCredits?: number;
  classroomCode?: string;
  classroomName?: string;
  classroomLocation?: string;
  teacherId?: string;
  teacherFirstName?: string;
  teacherLastName?: string;
  teacherEmail?: string;
}

export interface StudentAssignmentSubmissionDetail {
  id: number;
  assignmentId: number;
  score?: number | null;
  submittedAt?: string | null;
  status: string;
  feedback?: string | null;
  gradeCode?: string | null;
  isExempt?: boolean;
  assignmentTitle: string;
  maxScore: number;
  dueDate: string;
  classCode: string;
  className: string;
  assignmentTypeName?: string;
  assignmentWeight?: number;
}

export interface StudentAttendanceDetail {
  studentId: string;
  classCode: string;
  date: string;
  status: string;
  notes?: string;
  timeIn?: string;
  timeOut?: string;
  className?: string;
}

export interface StudentInvoiceDetail {
  id: number;
  invoiceNumber: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface StudentPaymentDetail {
  id: number;
  invoiceId?: number;
  amount: number;
  paymentDate: string;
  transactionReference?: string;
  status: string;
  notes?: string;
  paymentMethodName?: string;
}

export interface StudentBehaviorDetail {
  id: number;
  behaviorType: string;
  description: string;
  points: number;
  dateOccurred: string;
  createdAt: string;
  recorderFirstName?: string;
  recorderLastName?: string;
}

export interface StudentDetailedExpediente {
  student: Student;
  annualEnrollments: StudentAnnualEnrollmentDetail[];
  classEnrollments: StudentClassEnrollmentDetail[];
  familyRelationships: FamilyRelationshipDetail[];
  assignmentsSubmissions: StudentAssignmentSubmissionDetail[];
  attendanceRecords: StudentAttendanceDetail[];
  invoices: StudentInvoiceDetail[];
  payments: StudentPaymentDetail[];
  behaviorRecords: StudentBehaviorDetail[];
}

export const usersService = {
  getUsers: async () => {
    return fetchApi<{ status: boolean; message: string; data: User[] }>('/users', {
      method: 'GET',
    });
  },

  getTeachers: async () => {
    return fetchApi<{ status: boolean; message: string; data: User[] }>('/users/role/teachers', {
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

export interface GuardianItem {
  publicId: string;
  firstName: string;
  lastName: string;
  identityNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  schoolCode?: string;
}

export const studentsService = {
  searchGuardians: async (query?: string, schoolCode?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (schoolCode && schoolCode !== 'ALL') params.append('schoolCode', schoolCode);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ status: boolean; message: string; data: GuardianItem[] }>(`/students/guardians/search${queryStr}`, {
      method: 'GET',
    });
  },

  searchStudents: async (query: string, schoolCode?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (schoolCode && schoolCode !== 'ALL') params.append('schoolCode', schoolCode);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ status: boolean; message: string; data: Student[] }>(`/students/search${queryStr}`, {
      method: 'GET',
    });
  },

  getStudents: async (filters?: StudentFilterParams) => {
    const params = new URLSearchParams();
    if (filters?.gradeCode && filters.gradeCode !== 'ALL') params.append('gradeCode', filters.gradeCode);
    if (filters?.classCode && filters.classCode !== 'ALL') params.append('classCode', filters.classCode);
    if (filters?.classroomCode && filters.classroomCode !== 'ALL') params.append('classroomCode', filters.classroomCode);
    if (filters?.search && filters.search.trim() !== '') params.append('search', filters.search.trim());
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ status: boolean; message: string; data: Student[] }>(`/students${queryStr}`, {
      method: 'GET',
    });
  },

  getStudent: async (id: string) => {
    return fetchApi<{ status: boolean; message: string; data: Student }>(`/students/${id}`, {
      method: 'GET',
    });
  },

  getStudentDetails: async (id: string) => {
    return fetchApi<{ status: boolean; message: string; data: StudentDetailedExpediente }>(`/students/${id}/details`, {
      method: 'GET',
    });
  },
  
  createStudent: async (formData: FormData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000/api'}/students`, {
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

  updateStudent: async (id: string, data: Partial<Student>) => {
    return fetchApi<{ status: boolean; message: string; data: Student }>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteStudent: async (id: string) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  getStudentGuardians: async (studentId: string) => {
    return fetchApi<{ status: boolean; message: string; data: FamilyRelationshipDetail[] }>(`/students/${studentId}/guardians`, {
      method: 'GET',
    });
  },

  assignGuardianToStudent: async (studentId: string, data: { guardianId: string; relationship: string; isPrimary?: boolean; canViewGrades?: boolean; canReceiveNotifications?: boolean }) => {
    return fetchApi<{ status: boolean; message: string; data: FamilyRelationshipDetail[] }>(`/students/${studentId}/guardians`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStudentGuardian: async (studentId: string, guardianId: string, data: { relationship?: string; isPrimary?: boolean; canViewGrades?: boolean; canReceiveNotifications?: boolean }) => {
    return fetchApi<{ status: boolean; message: string; data: FamilyRelationshipDetail[] }>(`/students/${studentId}/guardians/${guardianId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  removeGuardianFromStudent: async (studentId: string, guardianId: string) => {
    return fetchApi<{ status: boolean; message: string; data: FamilyRelationshipDetail[] }>(`/students/${studentId}/guardians/${guardianId}`, {
      method: 'DELETE',
    });
  }
};