"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, GraduationCap, BookOpen, UserCheck, ArrowRight,
  PlusCircle, CalendarCheck, ShieldCheck, ChevronDown, BarChart3,
  LineChart, Sparkles, Clock, CheckCircle2, TrendingUp,
  CreditCard, Send, ArrowUpRight, Award, Edit3, MoreHorizontal,
  ExternalLink, FileText, Calendar, Building2, Check,
} from "lucide-react";
import Link from "next/link";
import { usersService, studentsService } from "@/lib/services/api.service";
import { academicsService } from "@/lib/services/academics.service";

export default function SchoolDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    academicYears: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("7d");
  const [hoveredBar, setHoveredBar] = useState<number | null>(3); // Default to Wednesday like example

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [studentsRes, usersRes, classesRes, yearsRes] = await Promise.allSettled([
          studentsService.getStudents(),
          usersService.getUsers(),
          academicsService.getClasses(),
          academicsService.getAcademicYears(),
        ]);

        setStats({
          students: studentsRes.status === "fulfilled" && studentsRes.value.status ? studentsRes.value.data.length : 0,
          teachers: usersRes.status === "fulfilled" && usersRes.value.status ? usersRes.value.data.length : 0,
          classes: classesRes.status === "fulfilled" && classesRes.value.status ? classesRes.value.data.length : 0,
          academicYears: yearsRes.status === "fulfilled" && yearsRes.value.status ? yearsRes.value.data.length : 0,
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Display values with dynamic fallbacks
  const displayStudents = stats.students > 0 ? stats.students : 1280;
  const displayTeachers = stats.teachers > 0 ? stats.teachers : 68;
  const displayClasses = stats.classes > 0 ? stats.classes : 42;

  // Weekly attendance bar chart data (Lun - Dom)
  const barData = [
    { day: "Sun", date: "4 Jan", present: 20, absent: 5, justified: 10, total: 35 },
    { day: "Mon", date: "5 Jan", present: 65, absent: 10, justified: 5, total: 80 },
    { day: "Tue", date: "6 Jan", present: 75, absent: 8, justified: 6, total: 89 },
    { day: "Wed", date: "7 Jan", present: 92, absent: 4, justified: 4, total: 100, isHighlight: true },
    { day: "Thu", date: "8 Jan", present: 80, absent: 6, justified: 5, total: 91 },
    { day: "Fri", date: "9 Jan", present: 70, absent: 8, justified: 7, total: 85 },
    { day: "Sat", date: "10 Jan", present: 15, absent: 2, justified: 5, total: 22 },
  ];

  return (
    <div className="space-y-6">
      {/* 3-COLUMN MASTER DASHBOARD GRID (MATCHING ejemplo.webp) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* =========================================================================
            LEFT & CENTER MAIN COLUMN (8 Columns)
            ========================================================================= */}
        <div className="xl:col-span-8 space-y-6">

          {/* ROW 1: HERO OVERVIEW CARD WITH STYLIZED BAR CHART */}
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
                    <button className="p-1.5 bg-white text-neutral-900 shadow-2xs">
                      <BarChart3 className="size-3.5" />
                    </button>
                    <button className="p-1.5 text-neutral-400 hover:text-neutral-700">
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
                        {/* Interactive Floating Tooltip (matching Wednesday in example) */}
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
                          {/* Segment Orange */}
                          <div
                            style={{ height: `${item.justified}%` }}
                            className={`w-full rounded-b-xl transition-all ${
                              isHovered ? "bg-[#fb923c]" : "bg-neutral-200"
                            }`}
                          />
                          {/* Segment Lime */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-xl transition-all ${
                              isHovered ? "bg-[#8ce042]" : "bg-neutral-200"
                            }`}
                          />
                        </div>

                        {/* Day Label */}
                        <span className={`text-xs font-semibold mt-3 transition-colors ${
                          isHovered ? "text-neutral-950 font-bold" : "text-neutral-400"
                        }`}>
                          {item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stacked KPI Side Metrics (4 cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4 pt-4 lg:pt-0 lg:pl-4 lg:border-l border-neutral-100">
                {/* Metric 1 */}
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

                {/* Metric 2 */}
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

                {/* Metric 3 */}
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

          {/* ROW 2: SPENDING LIMIT STYLE PROGRESS & PROMO TIP CARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Left: Capacidad de Matrícula (Monthly spending limit style) */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-neutral-900">Capacidad de Matrícula 2025</h3>
                  <button className="text-neutral-400 hover:text-neutral-700">
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
                <Link href="/school/academics" className="inline-flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors">
                  <span>Ver calendario escolar</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* Decorative Geometric Lime & Amber Tiles (Matching ejemplo.webp) */}
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

          {/* ROW 3: THREE ANALYTICAL CARDS (COST ANALYSIS, HEALTH GAUGE, GOAL TRACKER) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Cost Analysis -> Desempeño Académico */}
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

            {/* Card 2: Financial Health -> Salud Institucional Semi-Circle Gauge */}
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

              {/* Stat */}
              <div className="text-left mt-2">
                <div className="text-2xl font-black text-neutral-900">96.5%</div>
                <div className="flex items-center gap-1 text-xs font-bold text-lime-600 mt-0.5">
                  <TrendingUp className="size-3" />
                  <span>+2.4% vs mes anterior</span>
                </div>
              </div>

              {/* SEMI-CIRCLE RADIAL GAUGE (MATCHING ejemplo.webp) */}
              <div className="relative flex flex-col items-center justify-center my-2">
                <svg className="w-36 h-20 overflow-visible" viewBox="0 0 100 55">
                  {/* Background Track Arc */}
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#f1f3f5"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Foreground Lime Gradient Arc */}
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

            {/* Card 3: Goal Tracker -> Metas del Ciclo */}
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-neutral-900">Metas del Ciclo</h4>
                  <button className="text-xs font-bold text-neutral-900 hover:text-neutral-600">
                    + Añadir
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">Seguimiento de hitos</p>
              </div>

              <div className="space-y-4 my-2 text-xs">
                {/* Goal 1 */}
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

                {/* Goal 2 */}
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

                {/* Goal 3 */}
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

        </div>

        {/* =========================================================================
            RIGHT COLUMN (4 Columns - MATCHING My Card & Quick Actions in ejemplo.webp)
            ========================================================================= */}
        <div className="xl:col-span-4 space-y-6">

          {/* CARD 1: VIRTUAL CARD ("My card" style from ejemplo.webp) */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Credencial Digital</h3>
                <p className="text-xs text-neutral-400">Acceso rápido institucional</p>
              </div>
              <button className="text-xs font-bold text-neutral-900 hover:text-neutral-600">
                + Ver carnet
              </button>
            </div>

            {/* THE LIME-GREEN VISA-STYLE CARD */}
            <div className="w-full h-48 rounded-2xl bg-gradient-to-tr from-[#65a30d] via-[#84cc16] to-[#a3e635] text-white p-5 shadow-lg relative overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.02]">
              {/* Background watermark seal */}
              <div className="absolute -right-6 -bottom-6 size-36 rounded-full bg-white/10 pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-black uppercase tracking-widest text-white/90">
                  CREDENCIAL INSTITUCIONAL
                </span>
                <span className="text-xs font-black tracking-widest text-white/90">
                  EDUSYS
                </span>
              </div>

              <div className="relative z-10">
                <div className="text-base font-mono tracking-widest font-bold drop-shadow-xs">
                  •••• •••• •••• 7890
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <div>
                    <p className="text-[10px] text-white/70 uppercase font-semibold">Titular</p>
                    <p className="font-bold tracking-wide">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.toUpperCase() : "ADMINISTRADOR"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/70 uppercase font-semibold">Vigencia</p>
                    <p className="font-bold">12/28</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTION ICON BUTTONS (5 BUTTONS ROW) */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              <Link href="/school/enrollments" className="flex flex-col items-center gap-1.5 group">
                <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
                  <UserCheck className="size-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">Inscribir</span>
              </Link>

              <Link href="/teacher/grading" className="flex flex-col items-center gap-1.5 group">
                <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
                  <Award className="size-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">Notas</span>
              </Link>

              <Link href="/teacher/attendance" className="flex flex-col items-center gap-1.5 group">
                <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
                  <Calendar className="size-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">Asistencia</span>
              </Link>

              <Link href="/school/academics" className="flex flex-col items-center gap-1.5 group">
                <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
                  <Clock className="size-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">Horarios</span>
              </Link>

              <Link href="/school/students" className="flex flex-col items-center gap-1.5 group">
                <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
                  <MoreHorizontal className="size-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">Más</span>
              </Link>
            </div>

            {/* QUICK CONTACTS / DOCENTES ROW ("Quick payment" style from ejemplo.webp) */}
            <div className="pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-neutral-900">Docentes & Coordinadores</h4>
                <button className="text-neutral-400 hover:text-neutral-700">
                  <MoreHorizontal className="size-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                {[
                  { name: "Davis", color: "bg-blue-500" },
                  { name: "Elli", color: "bg-emerald-500" },
                  { name: "Leo", color: "bg-amber-500" },
                  { name: "Amanda", color: "bg-purple-500" },
                  { name: "Carlos", color: "bg-rose-500" },
                  { name: "Sofia", color: "bg-cyan-500" },
                ].map((teacher) => (
                  <div key={teacher.name} className="flex flex-col items-center gap-1 cursor-pointer group">
                    <div className={`size-10 rounded-full ${teacher.color} text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-transparent group-hover:ring-neutral-900 transition-all`}>
                      {teacher.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950">
                      {teacher.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* CARD 2: RECENT ACTIVITY ("Transaction history" style from ejemplo.webp) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900">Actividad Reciente</h3>
              <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-100 cursor-pointer">
                <span>7d</span>
                <ChevronDown className="size-3" />
              </div>
            </div>

            {/* List of Activities */}
            <div className="space-y-3.5">
              {[
                {
                  icon: UserCheck,
                  title: "Matrícula aprobada",
                  desc: "David R. - Grado 9° B",
                  date: "25 Feb 2025",
                  badge: "+ Inscrito",
                  badgeClass: "bg-lime-100 text-lime-800",
                },
                {
                  icon: Award,
                  title: "Notas publicadas",
                  desc: "Matemáticas - Periodo 1",
                  date: "24 Feb 2025",
                  badge: "Completado",
                  badgeClass: "bg-neutral-100 text-neutral-700",
                },
                {
                  icon: Calendar,
                  title: "Asistencia registrada",
                  desc: "Sección 10-A (32 alumnos)",
                  date: "23 Feb 2025",
                  badge: "98% Asist.",
                  badgeClass: "bg-lime-100 text-lime-800",
                },
                {
                  icon: Building2,
                  title: "Asignación de aula",
                  desc: "Lab. Ciencias - Grado 11",
                  date: "22 Feb 2025",
                  badge: "Actualizado",
                  badgeClass: "bg-neutral-100 text-neutral-700",
                },
                {
                  icon: Users,
                  title: "Docente incorporado",
                  desc: "Prof. Carlos Mendoza",
                  date: "20 Feb 2025",
                  badge: "Activo",
                  badgeClass: "bg-blue-50 text-blue-700",
                },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                      <activity.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">{activity.title}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{activity.desc} • {activity.date}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${activity.badgeClass}`}>
                    {activity.badge}
                  </span>
                </div>
              ))}
            </div>

            <Link href="/school/enrollments">
              <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-neutral-200 mt-2">
                Ver historial completo
              </Button>
            </Link>
          </Card>

        </div>

      </div>
    </div>
  );
}
