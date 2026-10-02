"use client";

import ClassroomsTab from "../components/classrooms-tab";

export default function ClassroomsPage() {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Aulas e Instalaciones
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Espacios físicos, laboratorios y capacidad máxima de alumnos por aula.
          </p>
        </div>
      </div>

      <ClassroomsTab />
    </div>
  );
}
