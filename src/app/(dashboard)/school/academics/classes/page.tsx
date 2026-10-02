"use client";

import ClassesTab from "../components/classes-tab";

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Clases y Secciones
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Apertura de secciones activas combinando materia, maestro titular, horario semanal y aula física.
          </p>
        </div>
      </div>

      <ClassesTab />
    </div>
  );
}
