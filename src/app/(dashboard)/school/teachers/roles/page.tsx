"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Shield,
  Key,
  Users,
  Check,
  X,
  Lock,
  Eye,
  Edit3,
  Trash2,
  Download,
  Plus,
  HelpCircle,
  Sparkles,
  Info,
  Layers,
  GraduationCap,
  Briefcase,
  CreditCard,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface PermissionRow {
  code: string;
  module: string;
  action: string;
  description: string;
  superAdmin: boolean;
  schoolAdmin: boolean;
  director: boolean;
  teacher: boolean;
  accountant: boolean;
  student: boolean;
  parent: boolean;
}

const PERMISSIONS_DATA: PermissionRow[] = [
  // 1. Institucional y Configuración
  {
    code: "SCHOOL_CONFIG_MANAGE",
    module: "Configuración Institucional",
    action: "Gestionar Parámetros y Sedes",
    description: "Modificar nombre de escuela, logo, códigos y parámetros globales del sistema.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: false,
    student: false,
    parent: false,
  },
  {
    code: "USERS_MANAGE",
    module: "Gestión de Usuarios",
    action: "Crear y Modificar Cuentas",
    description: "Alta y baja de usuarios, reseteo de contraseñas y asignación de roles.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: false,
    student: false,
    parent: false,
  },

  // 2. Personal y Docentes
  {
    code: "STAFF_APPLICATIONS_MANAGE",
    module: "Personal y Bolsa de Empleo",
    action: "Reclutar y Evaluar Docentes",
    description: "Revisar postulaciones públicas, preseleccionar y contratación 1-clic con alta salarial.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: false,
    student: false,
    parent: false,
  },
  {
    code: "TEACHERS_DIRECTORY_VIEW",
    module: "Personal y Docentes",
    action: "Ver Directorio y Carga Docente",
    description: "Consultar lista de profesores, materias asignadas, carga horaria y aulas.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: true,
    accountant: true,
    student: false,
    parent: false,
  },

  // 3. Académico & Horarios
  {
    code: "ACADEMICS_CURRICULUM_MANAGE",
    module: "Gestión Académica",
    action: "Diseñar Planes y Materias",
    description: "Crear grados, cursos, asignaturas y configurar aulas físicas.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: false,
    student: false,
    parent: false,
  },
  {
    code: "TIMETABLE_MANAGE",
    module: "Horarios Semanales",
    action: "Crear y Publicar Horarios",
    description: "Programar bloques de clases por aula, profesor y día sin cruces.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: false,
    student: false,
    parent: false,
  },
  {
    code: "TIMETABLE_VIEW",
    module: "Horarios Semanales",
    action: "Consultar Horario Semanal",
    description: "Ver la cuadrícula de clases por día de la semana y aula.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: true,
    accountant: false,
    student: true,
    parent: true,
  },

  // 4. Matrículas y Promoción
  {
    code: "ENROLLMENTS_MANAGE",
    module: "Matrículas y Estudiantes",
    action: "Registrar y Promocionar Alumnos",
    description: "Matrícula anual, inscripción a clases y ejecución de Promoción (Rollover).",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: false,
    student: false,
    parent: false,
  },

  // 5. Aula Virtual & Calificaciones
  {
    code: "CLASSROOM_ASSIGNMENTS_MANAGE",
    module: "Aula Virtual",
    action: "Crear Tareas y Pruebas Online",
    description: "Publicar actividades académicas, adjuntar materiales y configurar fechas de entrega.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: true,
    accountant: false,
    student: false,
    parent: false,
  },
  {
    code: "GRADES_INPUT",
    module: "Calificaciones",
    action: "Asentar Notas y Evaluaciones",
    description: "Ingresar calificaciones por parcial / período para las materias a cargo.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: true,
    accountant: false,
    student: false,
    parent: false,
  },
  {
    code: "ATTENDANCE_RECORD",
    module: "Asistencia Diaria",
    action: "Pasar Lista y Registrar Faltas",
    description: "Marcar Presente, Ausente, Tarde o Excusa en la lista diaria de clase.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: true,
    accountant: false,
    student: false,
    parent: false,
  },
  {
    code: "STUDENT_PORTAL_ACCESS",
    module: "Portal del Estudiante",
    action: "Ver Mis Tareas y Notas",
    description: "Enviar entregas de tareas, resolver quizes y consultar boletín de notas.",
    superAdmin: true,
    schoolAdmin: false,
    director: false,
    teacher: false,
    accountant: false,
    student: true,
    parent: false,
  },

  // 6. Finanzas y Pagos
  {
    code: "FINANCE_BILLING_MANAGE",
    module: "Finanzas & Caja",
    action: "Cobro de Colegiaturas y Recibos",
    description: "Cobro presencial en ventanilla (POS), emisión de recibos y anulación.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: true,
    student: false,
    parent: false,
  },
  {
    code: "FINANCE_DEBTORS_VIEW",
    module: "Finanzas & Morosidad",
    action: "Reporte de Saldos y Defaulters",
    description: "Consultar saldos pendientes, estados de cuenta y enviar recordatorios de pago.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: true,
    student: false,
    parent: false,
  },
  {
    code: "FAMILY_FINANCE_VIEW",
    module: "Portal Familiar",
    action: "Ver Historial y Pagar Online",
    description: "Descargar recibos de colegiatura de sus hijos y revisar estados de cuenta.",
    superAdmin: true,
    schoolAdmin: false,
    director: false,
    teacher: false,
    accountant: false,
    student: false,
    parent: true,
  },

  // 7. Certificados & Diplomas
  {
    code: "CERTIFICATES_EMIT",
    module: "Certificados & Diplomas",
    action: "Emitir Certificados Oficiales",
    description: "Generar constancias de estudio, certificados de notas y diplomas de honor con QR.",
    superAdmin: true,
    schoolAdmin: true,
    director: true,
    teacher: false,
    accountant: false,
    student: false,
    parent: false,
  },
];

const ROLES_LIST = [
  {
    key: "ALL",
    label: "Matriz Completa",
    badge: "7 Roles",
    badgeClass: "bg-neutral-100 text-neutral-800",
  },
  {
    key: "SUPER_ADMIN",
    label: "Super Admin",
    badge: "Plataforma SaaS",
    badgeClass: "bg-purple-100 text-purple-800",
    account: "superadmin / 123456",
    description: "Control absoluto sobre todas las escuelas, bases de datos y planes de suscripción.",
  },
  {
    key: "SCHOOL_ADMIN",
    label: "Admin Escolar",
    badge: "Centro Educativo",
    badgeClass: "bg-blue-100 text-blue-800",
    account: "admin.school / 123456",
    description: "Administración integral de la escuela: admisiones, personal, finanzas y matrícula.",
  },
  {
    key: "DIRECTOR",
    label: "Directora / Rector",
    badge: "Dirección",
    badgeClass: "bg-indigo-100 text-indigo-800",
    account: "director / 123456",
    description: "Supervisión pedagógica, aprobación de actas, promociones y certificados.",
  },
  {
    key: "TEACHER",
    label: "Docente / Profesor",
    badge: "Académico",
    badgeClass: "bg-lime-100 text-lime-800",
    account: "lhernandez / 123456",
    description: "Imparte materias asignadas, califica tareas, pasa lista y evalúa estudiantes.",
  },
  {
    key: "ACCOUNTANT",
    label: "Cajero / Contador",
    badge: "Finanzas",
    badgeClass: "bg-amber-100 text-amber-800",
    account: "admin.school (Caja)",
    description: "Cobros en caja (POS), emisión de facturación y seguimiento de morosos.",
  },
  {
    key: "STUDENT",
    label: "Estudiante",
    badge: "Alumno",
    badgeClass: "bg-cyan-100 text-cyan-800",
    account: "kjmejia / 123456",
    description: "Acceso a tareas asignadas, notas personales, horarios y aula virtual.",
  },
  {
    key: "PARENT",
    label: "Padre / Tutor",
    badge: "Familia",
    badgeClass: "bg-pink-100 text-pink-800",
    account: "mlopez / 123456",
    description: "Seguimiento académico de sus hijos, asistencia y pago de colegiaturas.",
  },
];

export default function RolesMatrixPage() {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");

  const modules = Array.from(new Set(PERMISSIONS_DATA.map((p) => p.module)));

  const filteredPermissions = PERMISSIONS_DATA.filter((p) => {
    if (selectedModuleFilter !== "ALL" && p.module !== selectedModuleFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        p.code.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        p.action.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getRolePermission = (perm: PermissionRow, roleKey: string): boolean => {
    switch (roleKey) {
      case "SUPER_ADMIN":
        return perm.superAdmin;
      case "SCHOOL_ADMIN":
        return perm.schoolAdmin;
      case "DIRECTOR":
        return perm.director;
      case "TEACHER":
        return perm.teacher;
      case "ACCOUNTANT":
        return perm.accountant;
      case "STUDENT":
        return perm.student;
      case "PARENT":
        return perm.parent;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">
              Matriz de Roles y Permisos (RBAC)
            </h1>
            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 text-xs font-bold">
              Security & Access Control
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Arquitectura de permisos por rol institucional, seguridad basada en JWT y control de acceso funcional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-neutral-100 text-neutral-700 border-neutral-200 text-xs font-mono py-1 px-3">
            7 Roles · {PERMISSIONS_DATA.length} Permisos
          </Badge>
        </div>
      </div>

      {/* ROLES TABS / CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {ROLES_LIST.map((r) => {
          const isActive = selectedRoleFilter === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setSelectedRoleFilter(r.key)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm ring-2 ring-neutral-900/10"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
                    isActive ? "text-lime-400" : "text-neutral-400"
                  }`}
                >
                  {r.badge}
                </span>
                <span className="text-xs font-black block leading-tight">{r.label}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-neutral-200/20 flex items-center justify-between">
                <span className={`text-[10px] ${isActive ? "text-neutral-300" : "text-neutral-400"}`}>
                  {r.key === "ALL" ? "Comparar" : "Inspeccionar"}
                </span>
                <ShieldCheck className={`size-3 ${isActive ? "text-lime-400" : "text-neutral-400"}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ROLE HIGHLIGHT BANNER IF SINGLE ROLE SELECTED */}
      {selectedRoleFilter !== "ALL" && (
        <Card className="p-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white border-none shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center text-lime-400 shrink-0">
                <Key className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black">
                    Rol Seleccionado: {ROLES_LIST.find((r) => r.key === selectedRoleFilter)?.label}
                  </h3>
                  <Badge variant="outline" className="bg-lime-400/20 text-lime-300 border-lime-400/30 text-[10px] font-bold">
                    Código: {selectedRoleFilter}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  {ROLES_LIST.find((r) => r.key === selectedRoleFilter)?.description}
                </p>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl px-3 py-2 text-xs border border-white/10">
              <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                Cuenta Oficial de Prueba:
              </span>
              <span className="font-mono text-lime-300 font-bold">
                {ROLES_LIST.find((r) => r.key === selectedRoleFilter)?.account}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* FILTER CONTROLS */}
      <Card className="p-4 bg-white shadow-2xs border-neutral-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-neutral-500">Filtrar por Módulo:</span>
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="h-8 rounded-xl border border-neutral-200 bg-white text-xs font-semibold px-2.5 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="ALL">Todos los Módulos ({modules.length})</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Buscar permiso por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-xl text-xs bg-neutral-50/50 border-neutral-200"
            />
          </div>
        </div>
      </Card>

      {/* PERMISSIONS MATRIX TABLE */}
      <Card className="p-0 overflow-hidden shadow-2xs border-neutral-200/80">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              {selectedRoleFilter === "ALL"
                ? "Matriz Completa de Roles vs Permisos"
                : `Permisos Específicos para ${ROLES_LIST.find((r) => r.key === selectedRoleFilter)?.label}`}
            </h3>
            <p className="text-[11px] text-neutral-500">
              Mostrando {filteredPermissions.length} capacidades operativas protegidas por Guards en NestJS.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-50/80 border-b border-neutral-200">
              <TableRow>
                <TableHead className="font-bold text-neutral-800 text-xs py-3 w-64">
                  Módulo y Permiso
                </TableHead>
                <TableHead className="font-bold text-neutral-800 text-xs py-3">
                  Descripción Operativa
                </TableHead>

                {selectedRoleFilter === "ALL" ? (
                  <>
                    <TableHead className="text-center font-bold text-neutral-700 text-xs py-3">
                      Super Admin
                    </TableHead>
                    <TableHead className="text-center font-bold text-neutral-700 text-xs py-3">
                      Admin Escolar
                    </TableHead>
                    <TableHead className="text-center font-bold text-neutral-700 text-xs py-3">
                      Directora
                    </TableHead>
                    <TableHead className="text-center font-bold text-neutral-700 text-xs py-3">
                      Docente
                    </TableHead>
                    <TableHead className="text-center font-bold text-neutral-700 text-xs py-3">
                      Contador
                    </TableHead>
                    <TableHead className="text-center font-bold text-neutral-700 text-xs py-3">
                      Estudiante
                    </TableHead>
                    <TableHead className="text-center font-bold text-neutral-700 text-xs py-3">
                      Padre / Tutor
                    </TableHead>
                  </>
                ) : (
                  <TableHead className="text-center font-bold text-neutral-800 text-xs py-3 w-40">
                    Estado de Acceso
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((row) => {
                if (selectedRoleFilter !== "ALL") {
                  const hasAccess = getRolePermission(row, selectedRoleFilter);
                  return (
                    <TableRow key={row.code} className="hover:bg-neutral-50/60 transition-colors">
                      <TableCell className="py-3">
                        <div className="text-xs font-bold text-neutral-900">{row.action}</div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{row.code}</div>
                        <Badge variant="outline" className="text-[9px] font-bold text-neutral-600 bg-neutral-100 border-neutral-200 mt-1">
                          {row.module}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-xs text-neutral-600 leading-relaxed">
                        {row.description}
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        {hasAccess ? (
                          <Badge
                            variant="outline"
                            className="bg-lime-100 text-lime-800 border-lime-300 font-bold text-xs px-2.5 py-1 gap-1 mx-auto"
                          >
                            <Check className="size-3 text-lime-600" />
                            <span>Concedido</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-neutral-100 text-neutral-500 border-neutral-200 text-xs px-2.5 py-1 gap-1 mx-auto"
                          >
                            <Lock className="size-3 text-neutral-400" />
                            <span>Restringido</span>
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={row.code} className="hover:bg-neutral-50/60 transition-colors">
                    <TableCell className="py-3">
                      <div className="text-xs font-bold text-neutral-900">{row.action}</div>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{row.code}</div>
                      <Badge variant="outline" className="text-[9px] font-bold text-neutral-600 bg-neutral-100 border-neutral-200 mt-1">
                        {row.module}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-neutral-600 leading-relaxed max-w-xs">
                      {row.description}
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <PermissionCheck allowed={row.superAdmin} />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <PermissionCheck allowed={row.schoolAdmin} />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <PermissionCheck allowed={row.director} />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <PermissionCheck allowed={row.teacher} />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <PermissionCheck allowed={row.accountant} />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <PermissionCheck allowed={row.student} />
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <PermissionCheck allowed={row.parent} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function PermissionCheck({ allowed }: { allowed: boolean }) {
  if (allowed) {
    return (
      <div className="inline-flex items-center justify-center size-6 rounded-md bg-lime-100 text-lime-800 border border-lime-300">
        <Check className="size-3.5 stroke-3" />
      </div>
    );
  }
  return (
    <div className="inline-flex items-center justify-center size-6 rounded-md bg-neutral-100 text-neutral-400 border border-neutral-200">
      <span className="text-xs font-bold font-mono">-</span>
    </div>
  );
}

