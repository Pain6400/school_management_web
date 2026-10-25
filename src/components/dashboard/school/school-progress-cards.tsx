import { Card } from "@/components/ui/card";
import { Edit3, ArrowRight } from "lucide-react";
import Link from "next/link";

export function SchoolProgressCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card Left: Capacidad de Matrícula */}
      <Card className="p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">
              Capacidad de Matrícula 2026
            </h3>
            <button
              type="button"
              className="text-neutral-400 hover:text-neutral-950 p-1.5 rounded-lg hover:bg-neutral-100 active:scale-95 transition-[transform,color,background-color] duration-150 cursor-pointer"
              title="Ajustar capacidad"
            >
              <Edit3 className="size-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Cupos asignados en ciclo lectivo actual</p>
        </div>

        {/* Progress Bar Dual Segment */}
        <div className="my-6">
          <div className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden flex p-0.5 border border-neutral-200/50">
            <div className="h-full bg-[#8ce042] rounded-full transition-[width] duration-500 ease-out" style={{ width: "86%" }} />
            <div className="h-full bg-neutral-200/80 rounded-r-full" style={{ width: "14%" }} />
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mt-2.5">
            <span className="tabular-nums font-mono text-neutral-900">860 inscritos (86%)</span>
            <span className="text-neutral-400 tabular-nums font-mono">1,000 cupos</span>
          </div>
        </div>

        <Link href="/school/enrollments" className="w-fit">
          <span className="text-xs font-bold text-neutral-900 hover:text-neutral-600 flex items-center gap-1.5 group transition-colors">
            <span>Gestionar matrículas</span>
            <ArrowRight className="size-3.5 text-lime-600 transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </Link>
      </Card>

      {/* Card Right: Tip / Announcement Card with Sleek Linear Gradient */}
      <Card className="p-6 relative overflow-hidden bg-neutral-950 text-white flex flex-col justify-between border-neutral-900 shadow-md">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-lime-400/20 via-transparent to-transparent pointer-events-none blur-2xl" />

        <div className="relative z-10 max-w-[280px]">
          <span className="text-[10px] font-bold bg-lime-400 text-neutral-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Aviso Oficial
          </span>
          <h3 className="text-base font-bold text-white mt-3 leading-snug">
            Cierre de Notas Periodo 1
          </h3>
          <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
            Recordatorio: Los docentes deben verificar y cerrar las actas antes del 15 de marzo para emisión de boletas oficiales.
          </p>
        </div>

        <div className="relative z-10 pt-4">
          <Link
            href="/school/academics/years"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors group"
          >
            <span>Ver calendario escolar</span>
            <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
