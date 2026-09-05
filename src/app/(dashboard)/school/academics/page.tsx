"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AcademicYearsTab from "./components/academic-years-tab";
import GradesTab from "./components/grades-tab";
import ClassroomsTab from "./components/classrooms-tab";
import CoursesTab from "./components/courses-tab";
import ClassesTab from "./components/classes-tab";
import { Calendar, GraduationCap, School, BookOpen, Layers } from "lucide-react";

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState("years");

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-neutral-200/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Gestión Académica
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Configuración de ciclos lectivos, periodos, grados, aulas, asignaturas y secciones escolares.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs defaultValue="years" value={activeTab} onValueChange={(val) => val && setActiveTab(val)}>
        <TabsList className="w-full sm:w-fit grid grid-cols-2 sm:flex sm:flex-wrap h-auto gap-1 p-1 bg-neutral-200/60 rounded-2xl border border-neutral-200/80">
          <TabsTrigger value="years" className="gap-2">
            <Calendar className="size-3.5" />
            <span>Años Académicos</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-2">
            <GraduationCap className="size-3.5" />
            <span>Grados</span>
          </TabsTrigger>
          <TabsTrigger value="classrooms" className="gap-2">
            <School className="size-3.5" />
            <span>Aulas</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="size-3.5" />
            <span>Cursos</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <Layers className="size-3.5" />
            <span>Clases (Secciones)</span>
          </TabsTrigger>
        </TabsList>

        <div className="pt-2">
          <TabsContent value="years" className="space-y-6">
            <AcademicYearsTab />
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <GradesTab />
          </TabsContent>

          <TabsContent value="classrooms" className="space-y-6">
            <ClassroomsTab />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <CoursesTab />
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <ClassesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
