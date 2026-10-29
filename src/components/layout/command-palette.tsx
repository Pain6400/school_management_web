"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Search,
  GraduationCap,
  Users,
  CreditCard,
  Calendar,
  BookOpen,
  Bell,
  Home,
  UserCheck,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
} from "lucide-react";
import { studentsService, Student } from "@/lib/services/api.service";
import { useAuthStore } from "@/store/auth-store";

interface QuickAction {
  id: string;
  title: string;
  category: "Páginas del Sistema" | "Acciones Rápidas" | "Académico";
  url: string;
  icon: React.ElementType;
  badge?: string;
}

const STATIC_ACTIONS: QuickAction[] = [
  { id: "dash", title: "Tablero Principal (Dashboard)", category: "Páginas del Sistema", url: "/school", icon: Home },
  { id: "students", title: "Directorio de Estudiantes", category: "Páginas del Sistema", url: "/school/students", icon: GraduationCap },
  { id: "new-student", title: "Crear Nuevo Estudiante", category: "Acciones Rápidas", url: "/school/students?action=create", icon: Plus, badge: "Nuevo" },
  { id: "teachers", title: "Directorio de Maestros", category: "Páginas del Sistema", url: "/school/teachers", icon: Users },
  { id: "finance", title: "Caja y Finanzas Escolares", category: "Páginas del Sistema", url: "/school/finance", icon: CreditCard },
  { id: "enroll-annual", title: "Matrícula Anual", category: "Acciones Rápidas", url: "/school/enrollments/annual", icon: UserCheck },
  { id: "enroll-classes", title: "Inscripción a Clases", category: "Acciones Rápidas", url: "/school/enrollments/classes", icon: BookOpen },
  { id: "attendance", title: "Control de Asistencia", category: "Páginas del Sistema", url: "/teacher/attendance", icon: Calendar },
  { id: "announcements", title: "Comunicados y Circulares", category: "Páginas del Sistema", url: "/school/announcements", icon: Bell },
  { id: "academic-years", title: "Ciclos y Años Lectivos", category: "Académico", url: "/school/academics/years", icon: Calendar },
  { id: "grades", title: "Grados y Secciones", category: "Académico", url: "/school/academics/grades", icon: Building2 },
  { id: "courses", title: "Asignaturas y Cursos", category: "Académico", url: "/school/academics/courses", icon: BookOpen },
  { id: "parent-portal", title: "Portal de la Familia / Padres", category: "Páginas del Sistema", url: "/parent", icon: ShieldCheck, badge: "Familia" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  // Global keydown listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Search students when query has at least 2 characters
  useEffect(() => {
    if (!open) {
      setQuery("");
      setStudents([]);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setStudents([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingStudents(true);
        const res = await studentsService.getStudents({ search: trimmed });
        if (res && res.data) {
          setStudents(res.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Error searching students in command palette:", err);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Filter static actions based on query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return STATIC_ACTIONS;
    const q = query.toLowerCase();
    return STATIC_ACTIONS.filter(
      (action) =>
        action.title.toLowerCase().includes(q) ||
        action.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="p-0 gap-0 overflow-hidden rounded-3xl border-neutral-200/90 shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-100 bg-white">
          <Search className="size-5 text-neutral-400 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Escribe para buscar estudiantes, páginas o acciones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-lg shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-4 bg-neutral-50/50">
          {/* Results: Students */}
          {students.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-2.5">
                Alumnos Encontrados ({students.length})
              </span>
              <div className="space-y-1 pt-1">
                {students.map((stu) => (
                  <button
                    key={stu.publicId}
                    type="button"
                    onClick={() => handleSelect(`/school/students/${stu.publicId}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white text-left transition-all border border-transparent hover:border-neutral-200/80 shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-lime-100 text-lime-900 flex items-center justify-center font-bold text-xs">
                        {stu.firstName?.charAt(0) || "E"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900 group-hover:text-lime-700 transition-colors">
                          {stu.firstName} {stu.lastName}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          ID: {stu.identityNumber || stu.userCode || "S/N"} • {stu.email || "Sin email"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-neutral-900 text-xs font-semibold">
                      <span>Ver Expediente</span>
                      <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results: Navigation & Actions */}
          {filteredActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-2.5">
                Navegación & Acciones
              </span>
              <div className="space-y-1 pt-1">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleSelect(action.url)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white text-left transition-all border border-transparent hover:border-neutral-200/80 shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900 group-hover:text-neutral-950">
                            {action.title}
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {action.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200/70 text-neutral-700">
                            {action.badge}
                          </span>
                        )}
                        <ArrowRight className="size-3.5 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && students.length === 0 && !isSearchingStudents && (
            <div className="py-8 text-center text-xs text-neutral-400 space-y-1">
              <p className="font-bold text-neutral-600">No se encontraron resultados</p>
              <p>Prueba con otro término como "estudiante", "pago", "notas" o el nombre de un alumno.</p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span>Presiona <kbd className="font-mono font-semibold text-neutral-600 bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-[10px]">↵</kbd> para seleccionar</span>
            <span><kbd className="font-mono font-semibold text-neutral-600 bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-[10px]">ESC</kbd> para cerrar</span>
          </div>
          <span className="font-medium text-neutral-500">EduSys Pro Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

