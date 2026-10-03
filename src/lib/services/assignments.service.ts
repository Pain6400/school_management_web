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

export interface StudentSubmissionSummary {
  assignmentId: number;
  title: string;
  type: string;
  maxScore: number;
  dueDate: string;
  submissionId: number | null;
  score: number | null;
  status: string;
  feedback: string | null;
  submittedAt: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  submissionText?: string | null;
}

export interface StudentGradeSummary {
  enrollmentId: number;
  studentId: string;
  firstName: string;
  lastName: string;
  userCode: string;
  email: string;
  profilePicture?: string;
  totalScore: number;
  evaluatedMaxScore?: number;
  totalMaxScore: number;
  percentage: number;
  performancePercentage?: number;
  cumulativePercentage?: number;
  gradedCount: number;
  submittedCount: number;
  pendingCount: number;
  missingCount: number;
  assignments: StudentSubmissionSummary[];
}

export interface ClassGradebook {
  class: {
    code: string;
    name: string;
    courseName?: string;
    teacherName?: string | null;
  };
  totalAssignments: number;
  totalStudents: number;
  totalMaxScore: number;
  classAverage: number;
  assignments: {
    id: number;
    title: string;
    maxScore: number;
    dueDate: string;
    type: string;
  }[];
  students: StudentGradeSummary[];
}

export interface StudentGradeDetailResponse {
  class: {
    code: string;
    name: string;
    courseName?: string;
    teacherName?: string | null;
  };
  student: StudentGradeSummary;
  totalMaxScore: number;
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
  
  getAssignmentsByClass: async (classCode: string, schoolCode?: string) => {
    const url = schoolCode
      ? `/assignments/class/${classCode}/school/${schoolCode}`
      : `/assignments/class/${classCode}`;
    return fetchApi<{ status: boolean; message: string; data: Assignment[] }>(url, {
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
  },

  getGradebook: async (classCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: ClassGradebook }>(`/assignments/gradebook/class/${classCode}`, {
      method: 'GET',
    });
  },

  getStudentGradeDetail: async (studentId: string, classCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: StudentGradeDetailResponse }>(`/assignments/gradebook/student/${studentId}/class/${classCode}`, {
      method: 'GET',
    });
  },

  gradeStudent: async (data: {
    assignmentId: number;
    studentId: string;
    score: number;
    feedback?: string;
    status?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: any }>('/assignments/grade-student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};