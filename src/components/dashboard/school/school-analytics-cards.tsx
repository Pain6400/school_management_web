import { Card } from "@/components/ui/card";
import { ChevronDown, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export function SchoolAnalyticsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Rendimiento */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-neutral-900">Rendimiento</h4>
            <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-100">
              <span>Enero</span>
              <ChevronDown className="size-3" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-400">Promedio general</p>
          <div className="text-2xl font-black text-neutral-900 mt-2">
            8.8 <span className="text-xs font-medium text-neutral-400">/ 10</span>
          </div>
        </div>

        {/* Multi-segment horizontal bar */}
        <div className="my-3">
          <div className="w-full h-3 rounded-full overflow-hidden flex gap-0.5 bg-neutral-100">
            <div className="h-full bg-[#8ce042] rounded-l-full" style={{ width: "38%" }} />
            <div className="h-full bg-lime-400" style={{ width: "32%" }} />
            <div className="h-full bg-[#fb923c]" style={{ width: "18%" }} />
            <div className="h-full bg-neutral-300 rounded-r-full" style={{ width: "12%" }} />
          </div>
        </div>

        {/* Breakdown Legend */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="size-2 rounded-full bg-[#8ce042]" /> Sobresaliente
            </span>
            <span className="font-bold text-neutral-900">38%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="size-2 rounded-full bg-lime-400" /> Notable
            </span>
            <span className="font-bold text-neutral-900">32%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="size-2 rounded-full bg-[#fb923c]" /> Aprobatorio
            </span>
            <span className="font-bold text-neutral-900">18%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="size-2 rounded-full bg-neutral-300" /> En Refuerzo
            </span>
            <span className="font-bold text-neutral-900">12%</span>
          </div>
        </div>
      </Card>

      {/* Card 2: Salud Escolar Semi-Circle Gauge */}
      <Card className="p-5 flex flex-col justify-between text-center">
        <div className="flex items-center justify-between text-left">
          <div>
            <h4 className="text-sm font-bold text-neutral-900">Salud Escolar</h4>
            <p className="text-[11px] text-neutral-400">Asistencia Global</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-100">
            <span>30d</span>
            <ChevronDown className="size-3" />
          </div>
        </div>

        <div className="text-left mt-2">
          <div className="text-2xl font-black text-neutral-900">96.5%</div>
          <div className="flex items-center gap-1 text-xs font-bold text-lime-600 mt-0.5">
            <TrendingUp className="size-3" />
            <span>+2.4% vs mes anterior</span>
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center my-2">
          <svg className="w-36 h-20 overflow-visible" viewBox="0 0 100 55">
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#f1f3f5"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 10 50 A 40 40 0 0 1 85 30"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8ce042" />
                <stop offset="100%" stopColor="#a3e635" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-0 text-center">
            <span className="text-xl font-black text-neutral-900">96.5%</span>
            <p className="text-[9px] text-neutral-400 font-medium">Asistencia Promedio</p>
          </div>
        </div>

        <p className="text-[10px] text-neutral-400 text-left mt-1">
          Basado en el registro diario de asistencia de los 42 grupos escolares.
        </p>
      </Card>

      {/* Card 3: Metas del Ciclo */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-neutral-900">Metas del Ciclo</h4>
            <button type="button" className="text-xs font-bold text-neutral-900 hover:text-neutral-600">
              + Añadir
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Seguimiento de hitos</p>
        </div>

        <div className="space-y-4 my-2 text-xs">
          <div>
            <div className="flex items-center justify-between font-bold text-neutral-800 mb-1">
              <span>Actas de Notas P1</span>
              <span className="text-[10px] text-neutral-400 font-medium">85% / 100%</span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#8ce042] rounded-full" style={{ width: "85%" }} />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Quedan 4 días para cierre</p>
          </div>

          <div>
            <div className="flex items-center justify-between font-bold text-neutral-800 mb-1">
              <span>Matrícula Total</span>
              <span className="text-[10px] text-neutral-400 font-medium">860 / 1000</span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#fb923c] rounded-full" style={{ width: "86%" }} />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">86% de meta institucional</p>
          </div>

          <div>
            <div className="flex items-center justify-between font-bold text-neutral-800 mb-1">
              <span>Capacitación Docente</span>
              <span className="text-[10px] text-neutral-400 font-medium">48 / 68</span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-800 rounded-full" style={{ width: "70%" }} />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Faltan 2 semanas</p>
          </div>
        </div>

        <Link href="/school/academics">
          <span className="text-xs font-bold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 transition-colors">
            Ver todas las metas <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </Card>
    </div>
  );
}
