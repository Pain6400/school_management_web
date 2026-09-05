"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { usersService, studentsService } from "@/lib/services/api.service";
import { academicsService } from "@/lib/services/academics.service";
import { SchoolAttendanceChart } from "@/components/dashboard/school/school-attendance-chart";
import { SchoolProgressCards } from "@/components/dashboard/school/school-progress-cards";
import { SchoolAnalyticsCards } from "@/components/dashboard/school/school-analytics-cards";
import { SchoolSidebarPanel } from "@/components/dashboard/school/school-sidebar-panel";

export default function SchoolDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    academicYears: 0,
  });
  const [loading, setLoading] = useState(true);

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
          students:
            studentsRes.status === "fulfilled" && studentsRes.value.status
              ? studentsRes.value.data.length
              : 0,
          teachers:
            usersRes.status === "fulfilled" && usersRes.value.status
              ? usersRes.value.data.length
              : 0,
          classes:
            classesRes.status === "fulfilled" && classesRes.value.status
              ? classesRes.value.data.length
              : 0,
          academicYears:
            yearsRes.status === "fulfilled" && yearsRes.value.status
              ? yearsRes.value.data.length
              : 0,
        });
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Column: Charts, KPI and Analytical Cards (8 Columns) */}
        <div className="xl:col-span-8 space-y-6">
          <SchoolAttendanceChart
            studentsCount={stats.students}
            teachersCount={stats.teachers}
            classesCount={stats.classes}
            loading={loading}
          />
          <SchoolProgressCards />
          <SchoolAnalyticsCards />
        </div>

        {/* Right Sidebar Panel: Virtual ID, Quick Actions and Recent Activity (4 Columns) */}
        <SchoolSidebarPanel user={user} />
      </div>
    </div>
  );
}
