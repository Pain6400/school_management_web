"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, CheckCircle2, AlertTriangle, XCircle, Clock, Save, Users, RefreshCw } from "lucide-react";
import { academicsService, Class } from "@/lib/services/academics.service";
import { enrollmentsService, ClassEnrollment, AttendanceRecord } from "@/lib/services/enrollments.service";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const [enrolledStudents, setEnrolledStudents] = useState<ClassEnrollment[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Cargar clases
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const res = await academicsService.getClasses();
        if (res.status && res.data && res.data.length > 0) {
          setClasses(res.data);
          setSelectedClass(res.data[0].code);
        }
      } catch (err) {
        console.error("Error loading classes:", err);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // 2. Cargar alumnos inscritos y registros previos de asistencia cuando cambia la clase o la fecha
  const loadClassAttendance = async () => {
    if (!selectedClass) return;
    try {
      setLoadingAttendance(true);
      setSaveMessage(null);

      const [enrollRes, attendRes] = await Promise.allSettled([
        enrollmentsService.getEnrollmentsByClass(selectedClass),
        enrollmentsService.getAttendanceByClassAndDate(selectedClass, selectedDate),
      ]);

      const enrollments = enrollRes.status === "fulfilled" && enrollRes.value.status && enrollRes.value.data
        ? enrollRes.value.data
        : [];
      setEnrolledStudents(enrollments);

      const existingRecords: AttendanceRecord[] = attendRes.status === "fulfilled" && attendRes.value.status && attendRes.value.data
        ? attendRes.value.data
        : [];

      const recordMap = Object.fromEntries(existingRecords.map((r) => [r.studentId, r]));

      // Inicializar estado para cada alumno
      const newState: Record<string, { status: AttendanceStatus; notes: string }> = {};
      enrollments.forEach((e) => {
        const existing = recordMap[e.studentId];
        newState[e.studentId] = {
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
  };

  useEffect(() => {
    if (selectedClass) {
      loadClassAttendance();
    }
  }, [selectedClass, selectedDate]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendanceState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = { ...next[id], status };
      });
      return next;
    });
  };

  // Guardar lista en masa
  const handleSaveAttendance = async () => {
    if (!selectedClass || enrolledStudents.length === 0) return;
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const promises = enrolledStudents.map((e) => {
        const current = attendanceState[e.studentId] || { status: "PRESENT", notes: "" };
        return enrollmentsService.recordAttendance({
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
    } catch (err) {
      console.error("Error saving attendance:", err);
      setSaveMessage({ type: "error", text: "Error al guardar algunos registros de asistencia." });
    } finally {
      setIsSaving(false);
    }
  };

  // Resumen del día
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Registro de Asistencia Diaria</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pasa lista a tus alumnos por clase y fecha. Los cambios se sincronizan en tiempo real.
          </p>
        </div>

        <Button onClick={handleSaveAttendance} disabled={isSaving || enrolledStudents.length === 0} className="gap-2 shadow-xs">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar Asistencia
        </Button>
      </div>

      {/* FILTER BAR: CLASE Y FECHA */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Clase / Sección</Label>
              <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una clase..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Fecha de Asistencia</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => markAll("PRESENT")}
                disabled={enrolledStudents.length === 0}
              >
                Todos Presentes
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadClassAttendance}
                title="Recargar datos"
              >
                <RefreshCw className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATS SUMMARY BAR */}
      {enrolledStudents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-emerald-500/10 border-emerald-500/20 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Presentes</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.present}</p>
            </div>
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>

          <div className="rounded-lg border bg-amber-500/10 border-amber-500/20 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Tardanzas</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.late}</p>
            </div>
            <Clock className="size-6 text-amber-600" />
          </div>

          <div className="rounded-lg border bg-rose-500/10 border-rose-500/20 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-800 dark:text-rose-300">Ausencias</p>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{stats.absent}</p>
            </div>
            <XCircle className="size-6 text-rose-600" />
          </div>

          <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Justificados</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.excused}</p>
            </div>
            <AlertTriangle className="size-6 text-blue-600" />
          </div>
        </div>
      )}

      {saveMessage && (
        <div
          className={`p-3 rounded-lg text-sm border font-medium ${
            saveMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/15 border-destructive/30 text-destructive"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* STUDENT LIST TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Estudiantes</CardTitle>
          <CardDescription>
            Haz clic en los botones para alternar el estado de cada estudiante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAttendance ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Cargando lista de alumnos...</p>
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="size-10 stroke-1 text-muted-foreground/40 mx-auto mb-2" />
              <p className="font-medium">No hay alumnos inscritos en esta clase.</p>
              <p className="text-xs">
                Inscribe estudiantes desde el módulo de Matrículas en el panel de Dirección.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead className="text-center">Estado de Asistencia</TableHead>
                    <TableHead>Observación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((e) => {
                    const student = e.student;
                    const studentId = e.studentId;
                    const currentStatus = attendanceState[studentId]?.status || "PRESENT";

                    return (
                      <TableRow key={e.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                              {student ? `${student.firstName[0]}${student.lastName[0]}` : "AL"}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {student ? `${student.firstName} ${student.lastName}` : studentId}
                              </p>
                              {student?.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {student?.userCode || "—"}
                          </code>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="inline-flex rounded-lg border p-1 bg-muted/30 gap-1">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(studentId, "PRESENT")}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                currentStatus === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(studentId, "LATE")}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                currentStatus === "LATE"
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              Tardanza
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(studentId, "ABSENT")}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                currentStatus === "ABSENT"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              Ausente
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(studentId, "EXCUSED")}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                                currentStatus === "EXCUSED"
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              Justificado
                            </button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Input
                            placeholder="Nota opcional..."
                            className="h-8 text-xs max-w-xs"
                            value={attendanceState[studentId]?.notes || ""}
                            onChange={(ev) =>
                              setAttendanceState((prev) => ({
                                ...prev,
                                [studentId]: {
                                  ...prev[studentId],
                                  notes: ev.target.value,
                                },
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}