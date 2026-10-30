"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { fetchApi } from "@/lib/api-client";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Users,
  ShieldCheck,
  Building,
  Loader2,
  Check,
  X,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DemoAccount {
  username: string;
  label: string;
  roleDescription: string;
  schoolCode: string;
  badge: string;
  badgeColor: string;
  defaultRoute: string;
  icon: any;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: "superadmin",
    label: "Super Admin SaaS (Creador)",
    roleDescription: "Venta de suscripciones a escuelas, planes SaaS y control global",
    schoolCode: "GLOBAL SaaS",
    badge: "SaaS Owner",
    badgeColor: "bg-neutral-950 text-lime-400 font-bold border border-lime-400/40",
    defaultRoute: "/admin",
    icon: Sparkles,
  },
  {
    username: "director",
    label: "Directora Institucional",
    roleDescription: "Supervisión ejecutiva, diplomas con QR, auditoría y comunicados",
    schoolCode: "ESC001",
    badge: "Dirección",
    badgeColor: "bg-blue-100 text-blue-900",
    defaultRoute: "/school",
    icon: Building,
  },
  {
    username: "admin.school",
    label: "Administrador Escolar",
    roleDescription: "Gestión institucional, matrículas, personal, rollover y horarios",
    schoolCode: "ESC002",
    badge: "Admin Escolar",
    badgeColor: "bg-lime-400 text-neutral-950",
    defaultRoute: "/school",
    icon: ShieldCheck,
  },
  {
    username: "cajero.school",
    label: "Contador / Cajero (Finance)",
    roleDescription: "Ventanilla de caja, facturas, cobros en POS/efectivo y morosos",
    schoolCode: "ESC002",
    badge: "Caja & Pagos",
    badgeColor: "bg-amber-400 text-neutral-950 font-bold",
    defaultRoute: "/school/finance",
    icon: CreditCard,
  },
  {
    username: "admisiones.school",
    label: "Oficial de Admisiones",
    roleDescription: "Aspirantes, revisión de documentos y conversión de matrícula",
    schoolCode: "ESC002",
    badge: "Admisiones",
    badgeColor: "bg-cyan-100 text-cyan-900 font-bold",
    defaultRoute: "/school/admissions",
    icon: UserCheck,
  },
  {
    username: "lhernandez",
    label: "Docente Titular (Faculty)",
    roleDescription: "Pase de lista, calificaciones de tareas, exámenes y horarios",
    schoolCode: "ESC002",
    badge: "Docente",
    badgeColor: "bg-purple-100 text-purple-900",
    defaultRoute: "/teacher",
    icon: Users,
  },
  {
    username: "mlopez",
    label: "Padre / Tutor Legal (Parent)",
    roleDescription: "Panel multi-hijo, asistencias de hijos, notas y colegiaturas",
    schoolCode: "ESC001",
    badge: "Familia",
    badgeColor: "bg-orange-100 text-orange-900",
    defaultRoute: "/parent",
    icon: Users,
  },
  {
    username: "kjmejia",
    label: "Estudiante Regular (Student)",
    roleDescription: "Aula virtual, mis tareas, mis notas, mi asistencia y pagos",
    schoolCode: "ESC002",
    badge: "Estudiante",
    badgeColor: "bg-emerald-100 text-emerald-900",
    defaultRoute: "/student",
    icon: GraduationCap,
  },
];

export function DemoRoleSwitcher() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const handleSwitchRole = async (account: DemoAccount) => {
    try {
      setIsSwitching(account.username);

      const res = await fetchApi<{
        status: boolean;
        message: string;
        data: { accessToken: string; refreshToken: string } | null;
      }>("/auth/login", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({
          username: account.username,
          password: "123456",
        }),
      });

      if (res?.data?.accessToken) {
        const token = res.data.accessToken;

        // Establecer cookie con expiración amplia
        document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;

        // Actualizar Zustand store
        login(token, res.data.refreshToken);

        // Cerrar menú y redirigir
        setIsOpen(false);
        router.push(account.defaultRoute);
        router.refresh();
      } else {
        alert("No se pudo iniciar sesión con la cuenta de prueba seleccionada.");
      }
    } catch (err: any) {
      console.error("Error switching role:", err);
      alert("Error al conmutar de rol: " + err.message);
    } finally {
      setIsSwitching(null);
    }
  };

  const currentAccount = DEMO_ACCOUNTS.find((a) => a.username === user?.username);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] select-none font-sans">
      {/* BOTÓN FLOTANTE O GLOBO CONTENEDOR */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-neutral-950 text-white shadow-xl hover:bg-neutral-800 transition-all border border-neutral-700 active:scale-95 cursor-pointer group"
        >
          <div className="size-6 rounded-full bg-lime-400 text-neutral-950 flex items-center justify-center font-black text-xs group-hover:rotate-12 transition-transform">
            ⚡
          </div>
          <div className="text-left pr-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-lime-400 leading-none">
              Modo Demo
            </p>
            <p className="text-xs font-bold leading-tight truncate max-w-[140px]">
              {currentAccount?.label || user?.username || "Cambiar Rol"}
            </p>
          </div>
          <ChevronUp className="size-3.5 text-neutral-400" />
        </button>
      ) : (
        <div className="w-80 sm:w-96 rounded-3xl bg-neutral-950 text-white shadow-2xl border border-neutral-800 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera del Panel Demo */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-lg bg-lime-400 text-neutral-950 flex items-center justify-center font-black text-xs">
                ⚡
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-lime-400 leading-none">
                  Conmutador Rápido de Roles
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Alterna en 1 clic para presentaciones en vivo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="size-7 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Lista de cuentas de demostración */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-0.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.username === acc.username;
              const isLoadingThis = isSwitching === acc.username;
              const Icon = acc.icon;

              return (
                <button
                  key={acc.username}
                  type="button"
                  disabled={isLoadingThis || isSwitching !== null}
                  onClick={() => handleSwitchRole(acc)}
                  className={`w-full p-2.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isCurrent
                      ? "bg-neutral-900 border border-neutral-700"
                      : "hover:bg-neutral-900/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCurrent ? "bg-lime-400 text-neutral-950" : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="size-4 animate-spin text-neutral-950" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black leading-tight truncate text-white">
                          {acc.label}
                        </p>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${acc.badgeColor}`}
                        >
                          {acc.schoolCode}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {acc.roleDescription}
                      </p>
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="size-5 rounded-full bg-lime-400 text-neutral-950 flex items-center justify-center shrink-0">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pie de Nota Informativa */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
            <span>Pass: 123456</span>
            <span>Credenciales Oficiales</span>
          </div>
        </div>
      )}
    </div>
  );
}
