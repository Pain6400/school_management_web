"use client";

import { fetchApi } from "../api-client";
import { ClassEnrollment, AttendanceRecord as EnrollmentAttendanceRecord } from "./enrollments.service";

export interface AttendanceRecord {
  id: number;
  studentId: string;
  classCode: string;
  schoolCode: string;
  date: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
  notes?: string;
  studentName?: string;
  className?: string;
}

export const attendanceService = {
  // Obtener asistencias por clase y fecha
  getAttendanceByClassAndDate: async (classCode: string, date: string) => {
    return fetchApi<{ status: boolean; message: string; data: AttendanceRecord[] }>(
      `/attendance/class/${classCode}/date/${date}`, { method: "GET" }
    );
  },

  // Obtener matrículas por clase
  getEnrollmentsByClass: async (classCode: string) => {
    return fetchApi<{ status: boolean; message: string; data: ClassEnrollment[] }>(
      `/attendance/enrollments/class/${classCode}`, { method: "GET" }
    );
  },

  // Registrar o actualizar una asistencia individual
  recordAttendance: async (data: {
    studentId: string;
    classCode: string;
    schoolCode: string;
    date: string;
    status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
    notes?: string;
  }) => {
    return fetchApi<{ status: boolean; message: string; data: AttendanceRecord }>(
      `/attendance/record`, { method: "POST", body: JSON.stringify(data) }
    );
  },

  // Obtener reporte de asistencia por clase y rango de fechas
  getAttendanceReport: async (classCode: string, startDate: string, endDate: string) => {
    return fetchApi<{ status: boolean; message: string; data: any[] }>(
      `/attendance/report/class/${classCode}/range?start=${startDate}&end=${endDate}`, { method: "GET" }
    );
  },

  // Obtener estadísticas de asistencia para una clase
  getAttendanceStats: async (classCode: string, date?: string) => {
    const url = date
      ? `/attendance/stats/class/${classCode}?date=${date}`
      : `/attendance/stats/class/${classCode}`;
    return fetchApi<{ status: boolean; message: string; data: any }>(
      url, { method: "GET" }
    );
  },
};