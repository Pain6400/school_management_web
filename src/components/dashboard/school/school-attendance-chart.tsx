"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, BarChart3, LineChart, TrendingUp } from "lucide-react";

interface SchoolAttendanceChartProps {
  studentsCount: number;
  teachersCount: number;
  classesCount: number;
  loading: boolean;
}

const barData = [
  { day: "Sun", date: "4 Jan", present: 20, absent: 5, justified: 10, total: 35 },
  { day: "Mon", date: "5 Jan", present: 65, absent: 10, justified: 5, total: 80 },
  { day: "Tue", date: "6 Jan", present: 75, absent: 8, justified: 6, total: 89 },
  { day: "Wed", date: "7 Jan", present: 92, absent: 4, justified: 4, total: 100, isHighlight: true },
  { day: "Thu", date: "8 Jan", present: 80, absent: 6, justified: 5, total: 91 },
  { day: "Fri", date: "9 Jan", present: 70, absent: 8, justified: 7, total: 85 },
  { day: "Sat", date: "10 Jan", present: 15, absent: 2, justified: 5, total: 22 },
];

export function SchoolAttendanceChart({
  studentsCount,
  teachersCount,
  classesCount,
  loading,
}: SchoolAttendanceChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(3); // Default to Wednesday like example

  const displayStudents = studentsCount > 0 ? studentsCount : 1280;
  const displayTeachers = teachersCount > 0 ? teachersCount : 68;
  const displayClasses = classesCount > 0 ? classesCount : 42;

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight">
              {loading ? "..." : displayStudents.toLocaleString()}
            </h2>
          </div>
          <p className="text-xs font-semibold text-neutral-400 mt-1 uppercase tracking-wider">
            Balance de Asistencia & Alumnos Activos
          </p>
        </div>

        {/* Controls & Legend */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#8ce042]" />
              <span>Presentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#fb923c]" />
              <span>Justificados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-neutral-300" />
              <span>Ausentes</span>
            </div>
          </div>

          {/* Filter Pill & View Toggles */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 cursor-pointer transition-colors">
              <span>7d</span>
              <ChevronDown className="size-3 text-neutral-500" />
            </div>
            <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50">
              <button type="button" className="p-1.5 bg-white text-neutral-900 shadow-2xs">
                <BarChart3 className="size-3.5" />
              </button>
              <button type="button" className="p-1.5 text-neutral-400 hover:text-neutral-700">
                <LineChart className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STYLIZED ROUNDED BAR CHART + STACKED METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-end">
        {/* Chart Visual (8 cols) */}
        <div className="lg:col-span-8">
          <div className="relative h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {barData.map((item, idx) => {
              const isHovered = hoveredBar === idx;
              const heightPercent = Math.max(20, item.present);

              return (
                <div
                  key={item.day}
                  className="relative flex-1 flex flex-col items-center group cursor-pointer"
                  onMouseEnter={() => setHoveredBar(idx)}
                >
                  {/* Interactive Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-20 bg-white rounded-2xl p-3 shadow-xl border border-neutral-100 min-w-[160px] text-xs transition-all pointer-events-none animate-in fade-in zoom-in-95">
                      <p className="font-semibold text-neutral-400 text-[10px] mb-1.5">
                        {item.day}, {item.date}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-medium">
                          <span className="flex items-center gap-1.5 text-neutral-600">
                            <span className="size-2 rounded-full bg-[#8ce042]" />
                            Presentes
                          </span>
                          <span className="font-bold text-neutral-900">94.8%</span>
                        </div>
                        <div className="flex items-center justify-between font-medium">
                          <span className="flex items-center gap-1.5 text-neutral-600">
                            <span className="size-2 rounded-full bg-[#fb923c]" />
                            Justificados
                          </span>
                          <span className="font-bold text-neutral-900">3.2%</span>
                        </div>
                        <div className="flex items-center justify-between font-medium">
                          <span className="flex items-center gap-1.5 text-neutral-600">
                            <span className="size-2 rounded-full bg-neutral-300" />
                            Ausentes
                          </span>
                          <span className="font-bold text-neutral-900">2.0%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* The Rounded Segmented Pill Bar */}
                  <div className="w-full max-w-[48px] h-52 bg-neutral-100 rounded-2xl flex flex-col justify-end p-1 overflow-hidden transition-all group-hover:bg-neutral-200/60">
                    <div
                      style={{ height: `${item.justified}%` }}
                      className={`w-full rounded-b-xl transition-all ${
                        isHovered ? "bg-[#fb923c]" : "bg-neutral-200"
                      }`}
                    />
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all ${
                        isHovered ? "bg-[#8ce042]" : "bg-neutral-200"
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-xs font-semibold mt-3 transition-colors ${
                      isHovered ? "text-neutral-950 font-bold" : "text-neutral-400"
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stacked KPI Side Metrics (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 pt-4 lg:pt-0 lg:pl-4 lg:border-l border-neutral-100">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Alumnos
            </p>
            <div className="text-2xl font-black text-neutral-900 mt-1">
              {displayStudents.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-lime-600 mt-0.5">
              <TrendingUp className="size-3.5" />
              <span>+5.1% vs ciclo anterior</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Plantel Docente
            </p>
            <div className="text-2xl font-black text-neutral-900 mt-1">
              {displayTeachers} Maestros
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-lime-600 mt-0.5">
              <TrendingUp className="size-3.5" />
              <span>+15.5% cobertura total</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Aulas & Clases
            </p>
            <div className="text-2xl font-black text-neutral-900 mt-1">
              {displayClasses} / 45
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-lime-600 mt-0.5">
              <TrendingUp className="size-3.5" />
              <span>+20.7% capacidad activa</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
