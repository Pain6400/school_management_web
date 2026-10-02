"use client";

import AcademicYearsTab from "../components/academic-years-tab";

export default function AcademicYearsPage() {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Años Académicos & Períodos
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Gestión de ciclos lectivos oficiales, fechas de inicio/cierre y ponderación de bimestres o trimestres.
          </p>
        </div>
      </div>

      <AcademicYearsTab />
    </div>
  );
}
