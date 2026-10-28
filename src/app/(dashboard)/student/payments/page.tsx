"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { StudentPaymentsView } from "@/components/student/student-payments-view";
import { studentsService, Student } from "@/lib/services/api.service";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StudentPaymentsPage() {
  const { user } = useAuthStore();
  const studentId = user?.sub || "";
  const schoolCode = user?.schoolCode || "ESC002";
  const [student, setStudent] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    studentsService
      .getStudent(studentId)
      .then((res) => {
        if (res.status && res.data) {
          setStudent(res.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingStudent(false));
  }, [studentId]);

  return (
    <div className="space-y-6">
      {/* BANNER ESTILO EDUSYS */}
      <div className="rounded-3xl bg-white border border-neutral-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="size-16 rounded-2xl bg-neutral-950 text-lime-400 flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-lime-400/20">
            {student?.firstName?.charAt(0) || user?.username?.charAt(0) || "E"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
                Estado de Cuenta & Pagos
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-100 text-lime-800 border border-lime-200">
                <Sparkles className="size-3" /> Alumno Activo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Estudiante: <strong className="text-neutral-800 font-semibold">{student ? `${student.firstName} ${student.lastName}` : user?.username}</strong> • DNI: <span className="font-mono text-neutral-700">{student?.identityNumber || "0501199710597"}</span> • Escuela: <span className="font-mono font-bold text-neutral-800">{schoolCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/student">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4 rounded-xl border-neutral-200 text-xs font-bold gap-1.5 cursor-pointer hover:bg-neutral-100"
            >
              <ArrowLeft className="size-4" />
              <span>Volver al Tablero</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* COMPONENTE PRINCIPAL DE PAGOS */}
      {studentId ? (
        <StudentPaymentsView
          studentId={studentId}
          student={student}
          schoolCode={schoolCode}
        />
      ) : (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="size-6 animate-spin text-neutral-400" />
        </div>
      )}
    </div>
  );
}

