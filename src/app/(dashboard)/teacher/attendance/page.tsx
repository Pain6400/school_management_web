"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, CheckCircle2, AlertTriangle, XCircle, Clock, Save, Users, RefreshCw } from "lucide-react";

import { useAttendanceModule } from "@/lib/modules/attendance.module";

export default function AttendancePage() {
  const {
    classes,
    selectedClass,
    selectedDate,
    enrolledStudents,
    attendanceState,
    loadingClasses,
    loadingAttendance,
    isSaving,
    saveMessage,
    setSelectedClass,
    setSelectedDate,
    loadClassAttendance,
    setStudentStatus,
    setStudentNotes,
    markAll,
    saveAttendance,
    stats,
  } = useAttendanceModule();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Registro de Asistencia Diaria</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pasa lista a tus alumnos por clase y fecha. Los cambios se sincronizan con la base de datos.
          </p>
        </div>

        <Button
          onClick={() => saveAttendance()}
          disabled={isSaving || enrolledStudents.length === 0}
          className="gap-2 shadow-xs"
        >
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
                              {student ? `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}` : "AL"}
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
                            onChange={(ev) => setStudentNotes(studentId, ev.target.value)}
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