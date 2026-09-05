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
              Capacidad de Matrícula 2025
            </h3>
            <button type="button" className="text-neutral-400 hover:text-neutral-700">
              <Edit3 className="size-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Cupos asignados en ciclo lectivo</p>
        </div>

        {/* Progress Bar Dual Segment */}
        <div className="my-6">
          <div className="w-full h-4 bg-neutral-100 rounded-full overflow-hidden flex p-0.5">
            <div className="h-full bg-[#8ce042] rounded-full" style={{ width: "86%" }} />
            <div className="h-full bg-neutral-200 rounded-r-full" style={{ width: "14%" }} />
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mt-2">
            <span>860 inscritos</span>
            <span className="text-neutral-400">1,000 cupos</span>
          </div>
        </div>

        <Link href="/school/enrollments">
          <span className="text-xs font-bold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition-colors">
            Gestionar matrículas <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </Card>

      {/* Card Right: Tip / Announcement Card with Geometric Art */}
      <Card className="p-6 relative overflow-hidden bg-neutral-900 text-white flex flex-col justify-between">
        <div className="relative z-10 max-w-[240px]">
          <span className="text-[10px] font-bold bg-lime-400 text-neutral-950 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Aviso Oficial
          </span>
          <h3 className="text-base font-bold text-white mt-2 leading-snug">
            Cierre de Notas Periodo 1
          </h3>
          <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
            Recuerda a los docentes verificar las actas antes del 15 de marzo para emisión de boletas.
          </p>
        </div>

        <div className="relative z-10 pt-4">
          <Link
            href="/school/academics"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors"
          >
            <span>Ver calendario escolar</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Decorative Geometric Lime & Amber Tiles */}
        <div className="absolute -right-4 -bottom-4 size-36 opacity-90 pointer-events-none flex flex-wrap gap-1.5 rotate-12">
          <div className="size-10 rounded-xl bg-[#8ce042]/80" />
          <div className="size-10 rounded-xl bg-[#fb923c]/80" />
          <div className="size-10 rounded-xl bg-[#8ce042]" />
          <div className="size-10 rounded-xl bg-lime-200/40" />
          <div className="size-10 rounded-xl bg-[#fb923c]" />
          <div className="size-10 rounded-xl bg-[#8ce042]/90" />
        </div>
      </Card>
    </div>
  );
}
