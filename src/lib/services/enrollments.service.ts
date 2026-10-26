import { fetchApi } from "../api-client";
import { User, Student } from "./api.service";
import { AcademicYear, Grade, Class } from "./academics.service";

export interface StudentEnrollment {
  id: number;
  studentId: string;
  student?: Student;
  academicYearId: number;
  academicYear?: AcademicYear;
  gradeCode?: string;
  grade?: Grade;
  schoolCode: string;
  enrollmentDate: string;
  status: string;
  monthlyFee?: number;
  scholarshipPercentage?: number;
  dueDay?: number;
  notes?: string;
}

export interface ClassEnrollment {
  id: number;
  studentId: string;
  student?: Student;
  classCode: string;
  class?: Class;
  schoolCode: string;
  enrollmentDate: string;
  status: string;
  finalGrade?: number;
}

export interface AttendanceRecord {
  id?: number;
  studentId: string;
  student?: Student;
  classCode: string;
  schoolCode: string;
  date: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | string;
  notes?: string;
  recordedBy?: string;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: string;
  student?: Student;
  submissionDate?: string;
  submittedAt?: string;
  content?: string;
  submissionText?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  score?: number;
  feedback?: string;
  status: "PENDING" | "SUBMITTED" | "GRADED" | "LATE" | string;
  gradedAt?: string;
}

export const enrollmentsService = {
  // --- STUDENT ENROLLMENTS (Año Académico) ---
  getStudentEnrollments: async (schoolCode?: string) => {
    const q = schoolCode && schoolCode !== "ALL" ? `?schoolCode=${schoolCode}` : "";
    return fetchApi<{ status: boolean; message: string; data: StudentEnrollment[] }>(`/student-enrollments${q}`, {
      method: "GET",
    });
  },

  getEnrollmentsByStudent: async (studentId: string) => {
    return fetchApi<{ status: boolean; message: string; data: StudentEnrollment[] }>(`/student-enrollments/student/${studentId}`, {
      method: "GET",
    });
  },

  createStudentEnrollment: async (data: {
    studentId: string;
    academicYearId: number;
    gradeCode?: string;
    schoolCode: string;
    enrollmentDate: string;
    status?: string;
    monthlyFee?: number;
    scholarshipPercentage?: number;
    dueDay?: number;
    notes?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: StudentEnrollment }>("/student-enrollments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStudentEnrollment: async (id: number, data: Partial<StudentEnrollment>) => {
    return fetchApi<{ status: boolean; message: string; data: StudentEnrollment }>(`/student-enrollments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteStudentEnrollment: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/student-enrollments/${id}`, {
      method: "DELETE",
    });
  },

  // --- CLASS ENROLLMENTS (Clase / Sección) ---
  getClassEnrollments: async () => {
    return fetchApi<{ status: boolean; message: string; data: ClassEnrollment[] }>("/class-enrollments", {
      method: "GET",
    });
  },

  getEnrollmentsByClass: async (classCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: ClassEnrollment[] }>(`/class-enrollments/class/${classCode}`, {
      method: "GET",
    });
  },

  createClassEnrollment: async (data: {
    studentId: string;
    classCode: string;
    schoolCode: string;
    enrollmentDate?: string;
    status?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: ClassEnrollment }>("/class-enrollments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteClassEnrollment: async (id: number) => {
    return fetchApi<{ status: boolean; message: string; data: null }>(`/class-enrollments/${id}`, {
      method: "DELETE",
    });
  },

  // --- ATTENDANCE ---
  getAttendanceByClassAndDate: async (classCode: string, date: string) => {
    return fetchApi<{ status: boolean; message: string; data: AttendanceRecord[] }>(`/attendance/class/${classCode}/date/${date}`, {
      method: "GET",
    });
  },

  recordAttendance: async (data: {
    studentId: string;
    classCode: string;
    schoolCode: string;
    date: string;
    status: string;
    notes?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: AttendanceRecord }>("/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // --- ASSIGNMENT SUBMISSIONS ---
  getSubmissionsByAssignment: async (assignmentId: number) => {
    return fetchApi<{ status: boolean; message: string; data: AssignmentSubmission[] }>(`/assignment-submissions/assignment/${assignmentId}`, {
      method: "GET",
    });
  },

  gradeSubmission: async (id: number, data: { score: number; feedback?: string; status?: string }) => {
    return fetchApi<{ status: boolean; message: string; data: AssignmentSubmission }>(`/assignment-submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  // --- STUDENT PORTAL METHODS ---
  getSubmissionsByStudent: async (studentId: string) => {
    return fetchApi<{ status: boolean; message: string; data: AssignmentSubmission[] }>(
      `/assignment-submissions/student/${studentId}`,
      { method: "GET" }
    );
  },

  submitAssignment: async (data: {
    assignmentId: number;
    studentId: string;
    status?: string;
    feedback?: string;
    score?: number;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: AssignmentSubmission }>("/assignment-submissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAttendanceByStudent: async (studentId: string) => {
    return fetchApi<{ status: boolean; message: string; data: AttendanceRecord[] }>(
      `/attendance/student/${studentId}`,
      { method: "GET" }
    );
  },

  // TODO: [Backend-First] Este método actualmente procesa datos en el frontend como puente temporal.
  // Debe ser reemplazado por un endpoint real GET /student-metrics/:studentId
  calculateStudentMetrics: (
    assignments: any[],
    submissions: any[],
    attendance: AttendanceRecord[]
  ) => {
    const submissionMap: Record<number, any> = {};
    submissions.forEach((sub) => { submissionMap[sub.assignmentId] = sub; });

    const total = assignments.length;
    let submittedCount = 0;
    let gradedCount = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;

    assignments.forEach((a) => {
      const sub = submissionMap[a.id];
      if (sub) {
        submittedCount++;
        if (sub.status === "GRADED" && sub.score != null) {
          gradedCount++;
          totalScore += Number(sub.score);
          maxPossibleScore += Number(a.maxScore || 100);
        }
      }
    });

    const averagePercent = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : null;
    const pendingCount = Math.max(0, total - submittedCount);

    const present = attendance.filter((a) => a.status === "PRESENT").length;
    const late = attendance.filter((a) => a.status === "LATE").length;
    const absent = attendance.filter((a) => a.status === "ABSENT").length;
    const excused = attendance.filter((a) => a.status === "EXCUSED").length;
    const totalAtt = attendance.length;
    const attendancePercent = totalAtt > 0 ? Math.round(((present + excused + late * 0.5) / totalAtt) * 100) : 100;

    return { total, submittedCount, gradedCount, pendingCount, averagePercent, present, late, absent, excused, totalAtt, attendancePercent };
  }
};