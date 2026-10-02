"use client";

import CoursesTab from "../components/courses-tab";

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Materias y Asignaturas
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Malla curricular, códigos oficiales de asignaturas y vinculación por grado académico.
          </p>
        </div>
      </div>

      <CoursesTab />
    </div>
  );
}
