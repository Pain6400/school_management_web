import { fetchApi } from '../api-client';

export interface AssignmentType {
  id: number;
  schoolCode: string;
  code?: string;
  name: string;
  weight?: number;
  dropLowest?: boolean;
  isExtraCredit?: boolean;
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
  typeId?: number;
  typeName?: string;
  title: string;
  type: string;
  maxScore: number;
  dueDate: string;
  submissionId: number | null;
  score: number | null;
  gradeCode?: string | null; // 'EX', 'INC', 'AB'
  isExempt?: boolean;
  isDropped?: boolean; // Gradelink feature: Drop Lowest Score
  status: string;
  feedback: string | null;
  submittedAt: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  submissionText?: string | null;
}

export interface CategoryBreakdown {
  typeId: number;
  typeName: string;
  weight: number;
  dropLowest: boolean;
  isExtraCredit: boolean;
  earned: number;
  maxScore: number;
  percentage: number;
  evaluatedCount: number;
  droppedAssignmentId?: number | null;
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
  percentage: number; // Final official score (weighted or overridden)
  calculatedGrade?: number; // Pure mathematical weighted score
  isGradeOverridden?: boolean; // Additio feature: Manual Override
  overrideReason?: string | null;
  letterGrade?: string; // A+, A, B, C, D, F
  gpaPoint?: number;
  gradeLabel?: string;
  isPassing?: boolean;
  gradedCount: number;
  submittedCount: number;
  pendingCount: number;
  missingCount: number;
  categoryBreakdown?: CategoryBreakdown[];
  assignments: StudentSubmissionSummary[];
}

export interface ClassGradebook {
  class: {
    code: string;
    name: string;
    courseName?: string;
    teacherName?: string | null;
    isConcluded?: boolean; // Gradelink feature: Conclude term / lock grades
    concludedAt?: string | null;
    concludedBy?: string | null;
  };
  totalAssignments: number;
  totalStudents: number;
  totalMaxScore: number;
  classAverage: number;
  passingCount?: number;
  failingCount?: number;
  assignmentTypes?: AssignmentType[];
  assignments: {
    id: number;
    title: string;
    maxScore: number;
    dueDate: string;
    typeId?: number;
    type: string;
    weight?: number;
  }[];
  students: StudentGradeSummary[];
}

export interface StudentGradeDetailResponse {
  class: {
    code: string;
    name: string;
    courseName?: string;
    teacherName?: string | null;
    isConcluded?: boolean;
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

  updateAssignmentType: async (id: number, data: Partial<AssignmentType>) => {
    return fetchApi<{ status: boolean; message: string; data: AssignmentType }>(`/assignment-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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
    score?: number;
    gradeCode?: string;
    feedback?: string;
    status?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: any }>('/assignments/grade-student', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  bulkGrade: async (grades: Array<{
    assignmentId: number;
    studentId: string;
    score?: number;
    gradeCode?: string;
    feedback?: string;
  }>) => {
    return fetchApi<{ status: boolean; message: string; data: { count: number; studentsCount: number } }>('/assignments/gradebook/bulk-grade', {
      method: 'POST',
      body: JSON.stringify({ grades }),
    });
  },

  overrideFinalGrade: async (data: {
    classCode: string;
    studentId: string;
    manualScore: number;
    reason: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: any }>('/assignments/gradebook/override-final-grade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  restoreCalculatedGrade: async (data: {
    classCode: string;
    studentId: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: any }>('/assignments/gradebook/restore-calculated-grade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  concludeClass: async (classCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: any }>('/assignments/gradebook/conclude-class', {
      method: 'POST',
      body: JSON.stringify({ classCode }),
    });
  },

  unconcludeClass: async (classCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: any }>('/assignments/gradebook/unconclude-class', {
      method: 'POST',
      body: JSON.stringify({ classCode }),
    });
  },
};