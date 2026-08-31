"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AcademicYearsTab from "./components/academic-years-tab";
import GradesTab from "./components/grades-tab";
import ClassroomsTab from "./components/classrooms-tab";
import CoursesTab from "./components/courses-tab";
import ClassesTab from "./components/classes-tab";

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState("years");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión Académica</h2>
      </div>

      <Tabs defaultValue="years" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="years">Años Académicos</TabsTrigger>
          <TabsTrigger value="grades">Grados</TabsTrigger>
          <TabsTrigger value="classrooms">Aulas</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="classes">Clases (Secciones)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="years" className="space-y-4">
          <AcademicYearsTab />
        </TabsContent>
        
        <TabsContent value="grades" className="space-y-4">
          <GradesTab />
        </TabsContent>
        
        <TabsContent value="classrooms" className="space-y-4">
          <ClassroomsTab />
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-4">
          <CoursesTab />
        </TabsContent>
        
        <TabsContent value="classes" className="space-y-4">
          <ClassesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}