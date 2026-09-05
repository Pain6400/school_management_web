import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
  Award,
  Calendar,
  Clock,
  MoreHorizontal,
  Building2,
  Users,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { User } from "@/store/auth-store";

interface SchoolSidebarPanelProps {
  user: User | null;
}

const teachersList = [
  { name: "Davis", color: "bg-blue-500" },
  { name: "Elli", color: "bg-emerald-500" },
  { name: "Leo", color: "bg-amber-500" },
  { name: "Amanda", color: "bg-purple-500" },
  { name: "Carlos", color: "bg-rose-500" },
  { name: "Sofia", color: "bg-cyan-500" },
];

const recentActivities = [
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
];

export function SchoolSidebarPanel({ user }: SchoolSidebarPanelProps) {
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.toUpperCase()
    : user?.username?.toUpperCase() || "ADMINISTRADOR";

  return (
    <div className="xl:col-span-4 space-y-6">
      {/* CARD 1: VIRTUAL CARD */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Credencial Digital</h3>
            <p className="text-xs text-neutral-400">Acceso rápido institucional</p>
          </div>
          <button type="button" className="text-xs font-bold text-neutral-900 hover:text-neutral-600">
            + Ver carnet
          </button>
        </div>

        {/* The Lime-green Card */}
        <div className="w-full h-48 rounded-2xl bg-gradient-to-tr from-[#65a30d] via-[#84cc16] to-[#a3e635] text-white p-5 shadow-lg relative overflow-hidden flex flex-col justify-between transition-transform hover:scale-[1.02]">
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
                <p className="font-bold tracking-wide">{userName}</p>
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
            <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">
              Inscribir
            </span>
          </Link>

          <Link href="/teacher/grading" className="flex flex-col items-center gap-1.5 group">
            <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
              <Award className="size-4.5" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">
              Notas
            </span>
          </Link>

          <Link href="/teacher/attendance" className="flex flex-col items-center gap-1.5 group">
            <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
              <Calendar className="size-4.5" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">
              Asistencia
            </span>
          </Link>

          <Link href="/school/academics" className="flex flex-col items-center gap-1.5 group">
            <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
              <Clock className="size-4.5" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">
              Horarios
            </span>
          </Link>

          <Link href="/school/students" className="flex flex-col items-center gap-1.5 group">
            <div className="size-11 rounded-2xl border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-950 group-hover:text-lime-400 group-hover:border-neutral-950 flex items-center justify-center text-neutral-800 transition-all shadow-2xs">
              <MoreHorizontal className="size-4.5" />
            </div>
            <span className="text-[10px] font-semibold text-neutral-600 group-hover:text-neutral-950 truncate">
              Más
            </span>
          </Link>
        </div>

        {/* QUICK CONTACTS / DOCENTES */}
        <div className="pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-neutral-900">Docentes & Coordinadores</h4>
            <button type="button" className="text-neutral-400 hover:text-neutral-700">
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {teachersList.map((teacher) => (
              <div key={teacher.name} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div
                  className={`size-10 rounded-full ${teacher.color} text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-transparent group-hover:ring-neutral-900 transition-all`}
                >
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

      {/* CARD 2: RECENT ACTIVITY */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">Actividad Reciente</h3>
          <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-100 cursor-pointer">
            <span>7d</span>
            <ChevronDown className="size-3" />
          </div>
        </div>

        <div className="space-y-3.5">
          {recentActivities.map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                  <activity.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 truncate">{activity.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {activity.desc} • {activity.date}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${activity.badgeClass}`}
              >
                {activity.badge}
              </span>
            </div>
          ))}
        </div>

        <Link href="/school/enrollments">
          <Button
            variant="outline"
            className="w-full rounded-xl text-xs font-bold border-neutral-200 mt-2"
          >
            Ver historial completo
          </Button>
        </Link>
      </Card>
    </div>
  );
}
