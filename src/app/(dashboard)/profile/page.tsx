"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, Shield, Mail, Key, School, Calendar, CheckCircle2, 
  ArrowLeft, Lock, Smartphone, Globe
} from "lucide-react";
import Link from "next/link";

export default function UserProfilePage() {
  const { user } = useAuthStore();

  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN");
  const isSchoolAdmin = user?.roles?.includes("SCHOOL_ADMIN");
  const roleTitle = isSuperAdmin 
    ? "Super Administrador (SaaS)" 
    : isSchoolAdmin 
    ? "Administrador Escolar" 
    : user?.roles?.[0] || "Usuario del Sistema";

  const homeUrl = isSuperAdmin ? "/admin" : "/school";

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Link href={homeUrl}>
              <Button variant="ghost" size="sm" className="rounded-xl gap-1 text-neutral-500 hover:text-neutral-900 -ml-2">
                <ArrowLeft className="size-4" />
                <span>Volver</span>
              </Button>
            </Link>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Mi Perfil de Usuario
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Información de cuenta, credenciales de acceso institucional y nivel de permisos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-lime-400 text-neutral-950 font-bold px-3 py-1 text-xs">
            Sesión Activa
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* AVATAR & QUICK SUMMARY CARD */}
        <Card className="rounded-3xl border-neutral-200/90 shadow-xs bg-white text-center p-6 flex flex-col items-center justify-center">
          <div className="size-24 rounded-3xl bg-neutral-950 text-lime-400 flex items-center justify-center text-3xl font-black shadow-md ring-4 ring-neutral-100 mb-4">
            {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U").toUpperCase()}
          </div>
          <h3 className="text-lg font-black text-neutral-900 leading-tight">
            {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username}
          </h3>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            @{user?.username}
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
              {roleTitle}
            </span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-neutral-100 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between text-neutral-500">
              <span>Estado de Cuenta:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Habilitado
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-500">
              <span>Escuela Asignada:</span>
              <span className="font-bold text-neutral-800">
                {user?.schoolCode || (isSuperAdmin ? "Plataforma Global" : "Sin asignar")}
              </span>
            </div>
          </div>
        </Card>

        {/* ACCOUNT DETAILS & SECURITY */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-3xl border-neutral-200/90 shadow-xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black text-neutral-900 flex items-center gap-2">
                <User className="size-4 text-lime-600" />
                Información Personal & Contacto
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Datos sincronizados en el directorio central de usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nombre Completo</span>
                  <p className="text-xs font-bold text-neutral-900">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "No registrado"}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nombre de Usuario</span>
                  <p className="text-xs font-bold text-neutral-900 font-mono">
                    {user?.username || "usuario"}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Correo Institucional</span>
                  <p className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Mail className="size-3.5 text-neutral-400" />
                    {user?.email || "No registrado"}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Identificador Interno</span>
                  <p className="text-xs font-bold text-neutral-900 font-mono">
                    {user?.sub ? user.sub.slice(0, 8) + "..." : "ID-ACTIVO"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-neutral-200/90 shadow-xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black text-neutral-900 flex items-center gap-2">
                <Shield className="size-4 text-blue-600" />
                Roles y Permisos del Sistema
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Ámbitos autorizados para tu cuenta institucional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant="outline" className="px-3 py-1 font-mono text-xs font-bold bg-neutral-50 text-neutral-800 border-neutral-200">
                    🛡️ {role}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                {isSuperAdmin
                  ? "Tienes privilegios completos de plataforma SaaS: puedes crear escuelas, configurar planes, supervisar morosidad y administrar todas las cuentas del ecosistema."
                  : "Tienes privilegios operacionales según tu rol institucional asignado por la administración escolar."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
