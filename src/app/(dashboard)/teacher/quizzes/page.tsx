"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, FileText, Settings, PlayCircle, BarChart3, Clock, MoreVertical, Edit2, Trash2, Award } from "lucide-react";

const DUMMY_QUIZZES = [
  {
    id: 1,
    title: "Evaluación Diagnóstica: Matemáticas Avanzadas",
    course: "Matemáticas 10mo Grado",
    questions: 15,
    timeLimit: 45,
    status: "ACTIVE",
    responses: 24,
    averageScore: 82,
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Quiz Corto: Revolución Francesa",
    course: "Historia Universal",
    questions: 5,
    timeLimit: 10,
    status: "DRAFT",
    responses: 0,
    averageScore: null,
    createdAt: "2026-03-05T14:30:00Z",
  },
  {
    id: 3,
    title: "Examen Parcial: Física Fundamental",
    course: "Física",
    questions: 20,
    timeLimit: 60,
    status: "COMPLETED",
    responses: 45,
    averageScore: 76,
    createdAt: "2026-02-15T08:00:00Z",
  }
];

export default function QuizzesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQuizzes = DUMMY_QUIZZES.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER BANNER ESTILO PREMIUM */}
      <div className="relative rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FileText className="w-64 h-64 text-white rotate-12 transform scale-150" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-lime-400 text-xs font-bold backdrop-blur-md border border-white/5">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              Nuevo Módulo
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Pruebas en Línea
            </h1>
            <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">
              Crea, gestiona y califica automáticamente cuestionarios interactivos. 
              Evalúa el rendimiento de tus estudiantes en tiempo real con analíticas avanzadas.
            </p>
          </div>
          
          <div className="flex-shrink-0 flex gap-3">
            <Button className="h-12 px-6 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-100 font-bold shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95">
              <PlusCircle className="mr-2 size-5" />
              Crear Prueba
            </Button>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-neutral-400 group-focus-within:text-lime-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por título o materia..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-neutral-200/80 bg-white/50 backdrop-blur-sm focus:bg-white focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10 outline-none transition-all font-medium text-sm shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="h-12 rounded-2xl border-neutral-200/80 bg-white shadow-sm font-semibold flex-1 sm:flex-none">
            <Settings className="mr-2 size-4 text-neutral-500" />
            Configuración Global
          </Button>
        </div>
      </div>

      {/* QUIZZES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id} className="group relative overflow-hidden rounded-3xl border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
            {/* Status Indicator */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${
              quiz.status === 'ACTIVE' ? 'bg-emerald-500' : 
              quiz.status === 'DRAFT' ? 'bg-amber-400' : 'bg-neutral-300'
            }`} />

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  quiz.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                  quiz.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                  'bg-neutral-100 text-neutral-600 border border-neutral-200'
                }`}>
                  {quiz.status === 'ACTIVE' ? 'En Curso' : quiz.status === 'DRAFT' ? 'Borrador' : 'Finalizado'}
                </div>
                
                <button className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 rounded-md hover:bg-neutral-100">
                  <MoreVertical className="size-5" />
                </button>
              </div>

              <h3 className="font-bold text-lg text-neutral-900 leading-tight mb-1 group-hover:text-lime-700 transition-colors line-clamp-2">
                {quiz.title}
              </h3>
              <p className="text-xs font-semibold text-neutral-500 mb-6">
                {quiz.course}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                    <FileText className="size-3" /> Preguntas
                  </span>
                  <p className="font-black text-neutral-900">{quiz.questions}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                    <Clock className="size-3" /> Tiempo
                  </span>
                  <p className="font-black text-neutral-900">{quiz.timeLimit} min</p>
                </div>
                {quiz.status !== 'DRAFT' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                        <BarChart3 className="size-3" /> Entregas
                      </span>
                      <p className="font-black text-neutral-900">{quiz.responses}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                        <Award className="size-3" /> Promedio
                      </span>
                      <p className={`font-black ${
                        quiz.averageScore && quiz.averageScore >= 80 ? 'text-emerald-600' :
                        quiz.averageScore && quiz.averageScore >= 60 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {quiz.averageScore ? `${quiz.averageScore}%` : '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                <Button className="flex-1 h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs transition-colors">
                  {quiz.status === 'DRAFT' ? (
                    <><Edit2 className="size-3.5 mr-1.5" /> Editar</>
                  ) : (
                    <><BarChart3 className="size-3.5 mr-1.5" /> Resultados</>
                  )}
                </Button>
                {quiz.status === 'DRAFT' && (
                  <Button variant="outline" className="size-10 rounded-xl p-0 border-neutral-200 text-neutral-600 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* Empty State / Create New Card */}
        <Card className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 hover:bg-lime-50/50 hover:border-lime-200 transition-all duration-300 cursor-pointer min-h-[300px]">
          <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
            <PlusCircle className="size-6 text-lime-600" />
          </div>
          <h3 className="font-bold text-neutral-900 mb-1">Crear Nueva Prueba</h3>
          <p className="text-xs text-center text-neutral-500 max-w-[200px]">
            Inicia un nuevo cuestionario desde cero o usa una plantilla existente.
          </p>
        </Card>
      </div>
    </div>
  );
}
