"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { attendanceService } from "@/lib/services/attendance.service";
import { Class, academicsService } from "@/lib/services/academics.service";
import { ClassEnrollment, AttendanceRecord } from "@/lib/services/enrollments.service";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

interface AttendanceState {
  studentId: string;
  status: AttendanceStatus;
  notes: string;
}

interface AttendanceModule {
  // State
  classes: Class[];
  selectedClass: string;
  selectedDate: string;
  enrolledStudents: ClassEnrollment[];
  attendanceState: Record<string, AttendanceState>;
  loadingClasses: boolean;
  loadingAttendance: boolean;
  isSaving: boolean;
  saveMessage: { type: "success" | "error"; text: string } | null;

  // Actions
  loadClasses: () => Promise<void>;
  setSelectedClass: (classCode: string) => void;
  setSelectedDate: (date: string) => void;
  loadClassAttendance: () => Promise<void>;
  setStudentStatus: (studentId: string, status: AttendanceStatus) => void;
  setStudentNotes: (studentId: string, notes: string) => void;
  markAll: (status: AttendanceStatus) => void;
  saveAttendance: () => Promise<boolean>;
  resetAttendance: () => void;

  // Computed
  stats: {
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
  };
  canSave: boolean;
  isEmpty: boolean;
}

export function useAttendanceModule(): AttendanceModule {
  const { user } = useAuthStore();

  // State
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClassState] = useState<string>("");
  const [selectedDate, setSelectedDateState] = useState<string>(new Date().toISOString().split("T")[0]);
  const [enrolledStudents, setEnrolledStudents] = useState<ClassEnrollment[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceState>>({});
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions
  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const res = await academicsService.getClasses();
      if (res.status && res.data && res.data.length > 0) {
        setClasses(res.data);
        setSelectedClassState(res.data[0].code);
      }
    } catch (err) {
      console.error("Error loading classes:", err);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const setSelectedClass = useCallback((classCode: string) => {
    setSelectedClassState(classCode);
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
  }, []);

  const loadClassAttendance = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoadingAttendance(true);
      setSaveMessage(null);

      const [enrollRes, attendRes] = await Promise.allSettled([
        attendanceService.getEnrollmentsByClass(selectedClass),
        attendanceService.getAttendanceByClassAndDate(selectedClass, selectedDate),
      ]);

      const enrollments = enrollRes.status === "fulfilled" && enrollRes.value.status && enrollRes.value.data
        ? enrollRes.value.data
        : [];
      setEnrolledStudents(enrollments);

      const existingRecords: AttendanceRecord[] = attendRes.status === "fulfilled" && attendRes.value.status && attendRes.value.data
        ? attendRes.value.data
        : [];

      const recordMap = Object.fromEntries(existingRecords.map((r) => [r.studentId, r]));

      const newState: Record<string, AttendanceState> = {};
      enrollments.forEach((e) => {
        const existing = recordMap[e.studentId];
        newState[e.studentId] = {
          studentId: e.studentId,
          status: (existing?.status as AttendanceStatus) || "PRESENT",
          notes: existing?.notes || "",
        };
      });

      setAttendanceState(newState);
    } catch (err) {
      console.error("Error loading class attendance:", err);
    } finally {
      setLoadingAttendance(false);
    }
  }, [selectedClass, selectedDate]);

  const setStudentStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  }, []);

  const setStudentNotes = useCallback((studentId: string, notes: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  }, []);

  const markAll = useCallback((status: AttendanceStatus) => {
    setAttendanceState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status };
      });
      return next;
    });
  }, []);

  const saveAttendance = useCallback(async (): Promise<boolean> => {
    if (!selectedClass || enrolledStudents.length === 0) return false;
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const promises = enrolledStudents.map((e) => {
        const current = attendanceState[e.studentId] || { status: "PRESENT", notes: "" };
        return attendanceService.recordAttendance({
          studentId: e.studentId,
          classCode: selectedClass,
          schoolCode: user?.schoolCode || "ESC001",
          date: selectedDate,
          status: current.status,
          notes: current.notes || undefined,
        });
      });

      await Promise.all(promises);
      setSaveMessage({ type: "success", text: "¡Asistencia registrada y guardada exitosamente!" });
      return true;
    } catch (err) {
      console.error("Error saving attendance:", err);
      setSaveMessage({ type: "error", text: "Error al guardar algunos registros de asistencia." });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [selectedClass, enrolledStudents, attendanceState, selectedDate, user?.schoolCode]);

  const resetAttendance = useCallback(() => {
    setAttendanceState({});
    setSaveMessage(null);
  }, []);

  // Computed
  const stats = useMemo(() => {
    let present = 0, late = 0, absent = 0, excused = 0;
    Object.values(attendanceState).forEach((item) => {
      if (item.status === "PRESENT") present++;
      if (item.status === "LATE") late++;
      if (item.status === "ABSENT") absent++;
      if (item.status === "EXCUSED") excused++;
    });
    return { present, late, absent, excused, total: enrolledStudents.length };
  }, [attendanceState, enrolledStudents]);

  const canSave = useMemo(() => enrolledStudents.length > 0 && !isSaving, [enrolledStudents, isSaving]);
  const isEmpty = useMemo(() => enrolledStudents.length === 0, [enrolledStudents]);

  // Initialize
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClass) {
      loadClassAttendance();
    }
  }, [selectedClass, selectedDate, loadClassAttendance]);

  return {
    // State
    classes,
    selectedClass,
    selectedDate,
    enrolledStudents,
    attendanceState,
    loadingClasses,
    loadingAttendance,
    isSaving,
    saveMessage,

    // Actions
    loadClasses,
    setSelectedClass,
    setSelectedDate,
    loadClassAttendance,
    setStudentStatus,
    setStudentNotes,
    markAll,
    saveAttendance,
    resetAttendance,

    // Computed
    stats,
    canSave,
    isEmpty,
  };
}